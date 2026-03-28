import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Provide a window.api mock so hasAPI() returns true
const apiMock = {
  console: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    importPatch: vi.fn(),
    exportPatch: vi.fn(),
  },
};
(globalThis as unknown as { window: { api: typeof apiMock } }).window = {
  api: apiMock,
};

import { useConsoleStore } from '../consoleStore';

describe('consoleStore', () => {
  beforeEach(() => {
    apiMock.console.connect.mockImplementation((_type: string, ip: string, port?: number) =>
      Promise.resolve({
        success: true,
        connection: { type: 'eos', ip, port: port ?? 3032 },
      }),
    );
    apiMock.console.disconnect.mockResolvedValue({ success: true });
    useConsoleStore.getState().clearConnection();
  });

  // ─── connect ──────────────────────────────────────────────────────────────

  describe('connect', () => {
    it('sets status to connected and stores connection on success', async () => {
      const ok = await useConsoleStore.getState().connect('eos', '10.0.0.1');
      const state = useConsoleStore.getState();

      expect(ok).toBe(true);
      expect(state.status).toBe('connected');
      expect(state.connection).toMatchObject({ type: 'eos', ip: '10.0.0.1', port: 3032 });
    });

    it('uses the supplied port', async () => {
      await useConsoleStore.getState().connect('eos', '10.0.0.1', 9000);
      expect(useConsoleStore.getState().connection?.port).toBe(9000);
    });

    it('sets status to error on failure', async () => {
      apiMock.console.connect.mockResolvedValueOnce({ success: false, error: 'refused' });
      const ok = await useConsoleStore.getState().connect('eos', '10.0.0.1');

      expect(ok).toBe(false);
      expect(useConsoleStore.getState().status).toBe('error');
      expect(useConsoleStore.getState().connection).toBeNull();
    });

    it('sets status to error on thrown exception', async () => {
      apiMock.console.connect.mockRejectedValueOnce(new Error('boom'));
      const ok = await useConsoleStore.getState().connect('eos', '10.0.0.1');

      expect(ok).toBe(false);
      expect(useConsoleStore.getState().status).toBe('error');
    });
  });

  // ─── disconnect ───────────────────────────────────────────────────────────

  describe('disconnect', () => {
    it('clears connection and returns to idle', async () => {
      await useConsoleStore.getState().connect('eos', '10.0.0.1');
      await useConsoleStore.getState().disconnect('eos');

      const state = useConsoleStore.getState();
      expect(state.connection).toBeNull();
      expect(state.status).toBe('idle');
    });

    it('does not clear connection when disconnecting a different type', async () => {
      await useConsoleStore.getState().connect('eos', '10.0.0.1');
      await useConsoleStore.getState().disconnect('grandma2');

      // Eos connection should still be there
      expect(useConsoleStore.getState().connection?.type).toBe('eos');
    });
  });

  // ─── setLastSync / setLastImport ──────────────────────────────────────────

  it('setLastSync updates lastSync and connection.lastSync', async () => {
    await useConsoleStore.getState().connect('eos', '10.0.0.1');
    useConsoleStore.getState().setLastSync(12345);

    const state = useConsoleStore.getState();
    expect(state.lastSync).toBe(12345);
    expect(state.connection?.lastSync).toBe(12345);
  });

  it('setLastImport stores the channel array', () => {
    const channels = [
      { channelNumber: 1, universe: 1, address: 1, fixtureType: 'Leko', label: 'SR 1', notes: '' },
    ];
    useConsoleStore.getState().setLastImport(channels);
    expect(useConsoleStore.getState().lastImport).toEqual(channels);
  });

  // ─── clearConnection ──────────────────────────────────────────────────────

  it('clearConnection resets all state', async () => {
    await useConsoleStore.getState().connect('eos', '10.0.0.1');
    useConsoleStore.getState().setLastSync(9999);
    useConsoleStore.getState().clearConnection();

    const state = useConsoleStore.getState();
    expect(state.connection).toBeNull();
    expect(state.status).toBe('idle');
    expect(state.lastSync).toBeNull();
    expect(state.lastImport).toBeNull();
  });
});
