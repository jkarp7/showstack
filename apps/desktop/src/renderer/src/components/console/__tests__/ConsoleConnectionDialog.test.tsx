import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsoleConnectionDialog } from '../ConsoleConnectionDialog';
import { useConsoleStore } from '../../../store/consoleStore';

vi.mock('../../../utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Extend the global window.api mock (set up in test/setup.ts) with the console + infrastructure methods needed
const consoleMock = {
  connect: vi
    .fn()
    .mockImplementation((_type: string, ip: string, port?: number) =>
      Promise.resolve({ success: true, connection: { type: 'eos', ip, port: port ?? 3032 } }),
    ),
  disconnect: vi.fn().mockResolvedValue({ success: true }),
  importPatch: vi.fn(),
  exportPatch: vi.fn(),
};
const infrastructureMock = {
  getPortStatusReport: vi.fn().mockResolvedValue([]),
};

beforeEach(() => {
  // Attach mocks to window.api
  (window as unknown as { api: Record<string, unknown> }).api = {
    ...((window as unknown as { api: Record<string, unknown> }).api ?? {}),
    console: consoleMock,
    infrastructure: {
      ...((window as unknown as { api: { infrastructure?: Record<string, unknown> } }).api
        ?.infrastructure ?? {}),
      getPortStatusReport: infrastructureMock.getPortStatusReport,
    },
  };
  consoleMock.connect.mockImplementation((_type: string, ip: string, port?: number) =>
    Promise.resolve({ success: true, connection: { type: 'eos', ip, port: port ?? 3032 } }),
  );
  consoleMock.disconnect.mockResolvedValue({ success: true });
  infrastructureMock.getPortStatusReport.mockResolvedValue([]);
  useConsoleStore.getState().clearConnection();
});

const defaultProps = {
  isOpen: true,
  projectId: 'proj-1',
  onClose: vi.fn(),
};

describe('ConsoleConnectionDialog', () => {
  it('renders nothing when isOpen is false', () => {
    render(<ConsoleConnectionDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Connect to Console')).toBeNull();
  });

  it('renders the dialog when isOpen is true', () => {
    render(<ConsoleConnectionDialog {...defaultProps} />);
    expect(screen.getByText('Connect to Console')).toBeDefined();
  });

  // ─── IP validation ────────────────────────────────────────────────────────

  it('shows inline IP error on blur with invalid value', async () => {
    render(<ConsoleConnectionDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText(/192\.168\.1\.100/);
    await userEvent.type(input, 'not-an-ip');
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByText(/Invalid IP address/i)).toBeDefined();
    });
  });

  it('clears IP error when input becomes valid', async () => {
    render(<ConsoleConnectionDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText(/192\.168\.1\.100/);
    await userEvent.type(input, 'bad');
    fireEvent.blur(input);
    await waitFor(() => expect(screen.queryByText(/Invalid IP address/i)).toBeDefined());

    await userEvent.clear(input);
    await userEvent.type(input, '10.0.0.1');
    fireEvent.blur(input);
    await waitFor(() => expect(screen.queryByText(/Invalid IP address/i)).toBeNull());
  });

  it('Connect button is disabled when IP field is empty', () => {
    render(<ConsoleConnectionDialog {...defaultProps} />);
    const button = screen.getByRole('button', { name: /connect/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('Connect button becomes enabled after valid IP is entered', async () => {
    render(<ConsoleConnectionDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText(/192\.168\.1\.100/);
    await userEvent.type(input, '10.0.0.100');
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /connect/i });
      expect((button as HTMLButtonElement).disabled).toBe(false);
    });
  });

  // ─── reachability warning ─────────────────────────────────────────────────

  it('shows reachability warning when IP is unreachable', async () => {
    infrastructureMock.getPortStatusReport.mockResolvedValueOnce([
      {
        equipment_id: '__console__',
        ip: '10.0.0.1',
        status: 'unreachable',
        last_checked: Date.now(),
      },
    ]);

    render(<ConsoleConnectionDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText(/192\.168\.1\.100/);
    await userEvent.type(input, '10.0.0.1');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText(/currently unreachable/i)).toBeDefined();
    });
  });

  it('does not show reachability warning when IP is reachable', async () => {
    infrastructureMock.getPortStatusReport.mockResolvedValueOnce([
      {
        equipment_id: '__console__',
        ip: '10.0.0.1',
        status: 'reachable',
        last_checked: Date.now(),
      },
    ]);

    render(<ConsoleConnectionDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText(/192\.168\.1\.100/);
    await userEvent.type(input, '10.0.0.1');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByText(/currently/i)).toBeNull();
    });
  });

  // ─── connect action ───────────────────────────────────────────────────────

  it('calls window.api.console.connect when Connect is clicked', async () => {
    render(<ConsoleConnectionDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText(/192\.168\.1\.100/);
    await userEvent.type(input, '10.0.0.100');
    fireEvent.blur(input);
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /connect/i });
      expect((button as HTMLButtonElement).disabled).toBe(false);
    });
    await userEvent.click(screen.getByRole('button', { name: /connect/i }));
    await waitFor(() =>
      expect(consoleMock.connect).toHaveBeenCalledWith('eos', '10.0.0.100', undefined),
    );
  });

  it('shows connected banner after successful connect', async () => {
    render(<ConsoleConnectionDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText(/192\.168\.1\.100/);
    await userEvent.type(input, '10.0.0.100');
    await userEvent.click(screen.getByRole('button', { name: /connect/i }));
    await waitFor(() => {
      expect(screen.getByText(/Connected to/i)).toBeDefined();
    });
  });

  it('shows error message when connect fails', async () => {
    consoleMock.connect.mockResolvedValueOnce({ success: false, error: 'UDP bind failed' });
    render(<ConsoleConnectionDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText(/192\.168\.1\.100/);
    await userEvent.type(input, '10.0.0.100');
    await userEvent.click(screen.getByRole('button', { name: /connect/i }));
    await waitFor(() => {
      expect(screen.getByText(/Failed to connect/i)).toBeDefined();
    });
  });
});
