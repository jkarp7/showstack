import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsoleSyncDialog } from '../ConsoleSyncDialog';
import { useConsoleStore } from '../../../store/consoleStore';

vi.mock('../../../utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const consoleMock = {
  connect: vi.fn().mockResolvedValue({ success: true }),
  disconnect: vi.fn().mockResolvedValue({ success: true }),
  importPatch: vi.fn(),
  exportPatch: vi.fn(),
};
const fixturesMock = {
  getAll: vi.fn().mockResolvedValue([]),
};

const defaultProps = {
  isOpen: true,
  onImportApply: vi.fn(),
  onClose: vi.fn(),
};

const MOCK_CHANNELS = [
  { channelNumber: 1, universe: 1, address: 1, fixtureType: 'Leko', label: 'SR 1', notes: '' },
  { channelNumber: 2, universe: 1, address: 10, fixtureType: 'Fresnel', label: 'SR 2', notes: '' },
];

beforeEach(() => {
  (window as unknown as { api: Record<string, unknown> }).api = {
    ...((window as unknown as { api: Record<string, unknown> }).api ?? {}),
    console: consoleMock,
    fixtures: fixturesMock,
  };
  consoleMock.importPatch.mockResolvedValue({ success: true, channels: MOCK_CHANNELS });
  consoleMock.exportPatch.mockResolvedValue({ success: true, sent: 2 });
  fixturesMock.getAll.mockResolvedValue([{ channel: '1', universe: 1, dmx_address: 1 }]);

  // Start connected
  useConsoleStore.setState({
    status: 'connected',
    connection: { type: 'eos', ip: '10.0.0.1', port: 3032, connected: true, lastSync: null },
    lastSync: null,
    lastImport: null,
  });
});

describe('ConsoleSyncDialog', () => {
  it('renders nothing when isOpen is false', () => {
    render(<ConsoleSyncDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Sync with')).toBeNull();
  });

  it('renders the dialog with console IP in title', () => {
    render(<ConsoleSyncDialog {...defaultProps} />);
    expect(screen.getByText(/10\.0\.0\.1/)).toBeDefined();
  });

  it('shows not-connected warning when status is idle', () => {
    useConsoleStore.setState({ status: 'idle', connection: null });
    render(<ConsoleSyncDialog {...defaultProps} />);
    expect(screen.getByText(/Not connected/i)).toBeDefined();
  });

  // ─── import flow ──────────────────────────────────────────────────────────

  it('calls importPatch and renders preview table on fetch', async () => {
    render(<ConsoleSyncDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Fetch Patch/i }));

    await waitFor(() => {
      expect(consoleMock.importPatch).toHaveBeenCalledWith('eos');
      expect(screen.getByText('SR 1')).toBeDefined();
      expect(screen.getByText('SR 2')).toBeDefined();
    });
  });

  it('shows conflict indicator for channels matching existingChannels', async () => {
    render(<ConsoleSyncDialog {...defaultProps} existingChannels={new Set([1])} />);
    await userEvent.click(screen.getByRole('button', { name: /Fetch Patch/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 channel.*already exist/i)).toBeDefined();
    });
  });

  it('calls onImportApply with channels when Apply Import is clicked', async () => {
    render(<ConsoleSyncDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Fetch Patch/i }));
    await waitFor(() => screen.getByRole('button', { name: /Apply Import/i }));
    await userEvent.click(screen.getByRole('button', { name: /Apply Import/i }));

    expect(defaultProps.onImportApply).toHaveBeenCalledWith(MOCK_CHANNELS);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows error when importPatch fails', async () => {
    consoleMock.importPatch.mockResolvedValueOnce({ success: false, error: 'timeout' });
    render(<ConsoleSyncDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Fetch Patch/i }));
    await waitFor(() => {
      expect(screen.getByText(/timeout/i)).toBeDefined();
    });
  });

  // ─── export flow ──────────────────────────────────────────────────────────

  it('switches to export direction and calls exportPatch', async () => {
    render(<ConsoleSyncDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Export ShowStack/i }));
    await userEvent.click(screen.getByRole('button', { name: /Send to Console/i }));

    await waitFor(() => {
      expect(consoleMock.exportPatch).toHaveBeenCalledWith('eos', expect.any(Array));
      expect(screen.getByText(/Sent 2 commands/i)).toBeDefined();
    });
  });

  it('shows error when exportPatch fails', async () => {
    consoleMock.exportPatch.mockResolvedValueOnce({ success: false, error: 'connection lost' });
    render(<ConsoleSyncDialog {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /Export ShowStack/i }));
    await userEvent.click(screen.getByRole('button', { name: /Send to Console/i }));
    await waitFor(() => {
      expect(screen.getByText(/connection lost/i)).toBeDefined();
    });
  });
});
