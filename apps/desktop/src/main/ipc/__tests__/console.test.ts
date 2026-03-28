import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
}));

vi.mock('../../utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Use vi.hoisted so mock functions are available inside vi.mock factories
const mocks = vi.hoisted(() => ({
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined),
  getPatch: vi.fn().mockResolvedValue([]),
  parsePatch: vi
    .fn()
    .mockReturnValue([
      { channelNumber: 1, universe: 1, address: 1, fixtureType: 'Leko', label: 'SR 1', notes: '' },
    ]),
  buildBatchPatchCommands: vi.fn().mockReturnValue(['Chan 1 Patch 1/1']),
}));

vi.mock('../../console/eos/eosOSCClient', () => ({
  EosOSCClient: vi.fn().mockImplementation(() => ({
    connect: mocks.connect,
    disconnect: mocks.disconnect,
    send: mocks.send,
    getPatch: mocks.getPatch,
  })),
  EOS_OSC_PORT: 3032,
}));

vi.mock('../../console/eos/eosPatchParser', () => ({
  EosPatchParser: vi.fn().mockImplementation(() => ({
    parsePatch: mocks.parsePatch,
  })),
}));

vi.mock('../../console/eos/eosCommandBuilder', () => ({
  EosCommandBuilder: vi.fn().mockImplementation(() => ({
    buildBatchPatchCommands: mocks.buildBatchPatchCommands,
  })),
}));

import { registerConsoleHandlers, resetConsoleClients } from '../console';
import { EosOSCClient } from '../../console/eos/eosOSCClient';
import { EosPatchParser } from '../../console/eos/eosPatchParser';
import { EosCommandBuilder } from '../../console/eos/eosCommandBuilder';

/** Capture the handler registered for a given channel */
function getHandler(channel: string) {
  const calls = vi.mocked(ipcMain.handle).mock.calls;
  const call = calls.find((c) => c[0] === channel);
  if (!call) throw new Error(`No handler registered for ${channel}`);
  return call[1] as (...args: unknown[]) => Promise<unknown>;
}

const FAKE_EVENT = {} as Electron.IpcMainInvokeEvent;

describe('console IPC handlers', () => {
  beforeEach(() => {
    vi.mocked(ipcMain.handle).mockClear();
    // Re-set implementations cleared by mockReset: true
    mocks.connect.mockResolvedValue(undefined);
    mocks.disconnect.mockResolvedValue(undefined);
    mocks.send.mockResolvedValue(undefined);
    mocks.getPatch.mockResolvedValue([]);
    mocks.parsePatch.mockReturnValue([
      { channelNumber: 1, universe: 1, address: 1, fixtureType: 'Leko', label: 'SR 1', notes: '' },
    ]);
    mocks.buildBatchPatchCommands.mockReturnValue(['Chan 1 Patch 1/1']);
    vi.mocked(EosOSCClient).mockImplementation(
      () =>
        ({
          connect: mocks.connect,
          disconnect: mocks.disconnect,
          send: mocks.send,
          getPatch: mocks.getPatch,
        }) as unknown as EosOSCClient,
    );
    vi.mocked(EosPatchParser).mockImplementation(
      () => ({ parsePatch: mocks.parsePatch }) as unknown as EosPatchParser,
    );
    vi.mocked(EosCommandBuilder).mockImplementation(
      () =>
        ({
          buildBatchPatchCommands: mocks.buildBatchPatchCommands,
        }) as unknown as EosCommandBuilder,
    );
    resetConsoleClients();
    registerConsoleHandlers();
  });

  // ── console:connect ───────────────────────────────────────────────────────

  describe('console:connect', () => {
    it('returns success after connecting to Eos', async () => {
      const handler = getHandler('console:connect');
      const result = await handler(FAKE_EVENT, 'eos', '10.0.0.1');
      expect(result).toEqual({ success: true });
      expect(mocks.connect).toHaveBeenCalled();
    });

    it('returns error for unsupported console type', async () => {
      const handler = getHandler('console:connect');
      const result = (await handler(FAKE_EVENT, 'grandma2', '10.0.0.1')) as {
        success: boolean;
        error?: string;
      };
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not yet supported/i);
    });

    it('returns error when connect throws', async () => {
      mocks.connect.mockRejectedValueOnce(new Error('UDP bind failed'));
      const handler = getHandler('console:connect');
      const result = (await handler(FAKE_EVENT, 'eos', '10.0.0.1')) as {
        success: boolean;
        error?: string;
      };
      expect(result.success).toBe(false);
      expect(result.error).toContain('UDP bind failed');
    });

    it('disconnects an existing client before reconnecting', async () => {
      const handler = getHandler('console:connect');
      await handler(FAKE_EVENT, 'eos', '10.0.0.1');
      await handler(FAKE_EVENT, 'eos', '10.0.0.2');
      expect(mocks.disconnect).toHaveBeenCalledTimes(1);
      expect(mocks.connect).toHaveBeenCalledTimes(2);
    });
  });

  // ── console:disconnect ────────────────────────────────────────────────────

  describe('console:disconnect', () => {
    it('returns success when no client is connected', async () => {
      const handler = getHandler('console:disconnect');
      const result = await handler(FAKE_EVENT, 'eos');
      expect(result).toEqual({ success: true });
    });

    it('calls disconnect on the active client', async () => {
      await getHandler('console:connect')(FAKE_EVENT, 'eos', '10.0.0.1');
      const result = await getHandler('console:disconnect')(FAKE_EVENT, 'eos');
      expect(result).toEqual({ success: true });
      expect(mocks.disconnect).toHaveBeenCalled();
    });
  });

  // ── console:importPatch ───────────────────────────────────────────────────

  describe('console:importPatch', () => {
    it('returns channels after successful import', async () => {
      await getHandler('console:connect')(FAKE_EVENT, 'eos', '10.0.0.1');
      const result = (await getHandler('console:importPatch')(FAKE_EVENT, 'eos')) as {
        success: boolean;
        channels?: unknown[];
      };
      expect(result.success).toBe(true);
      expect(result.channels).toHaveLength(1);
    });

    it('returns error when not connected', async () => {
      const result = (await getHandler('console:importPatch')(FAKE_EVENT, 'eos')) as {
        success: boolean;
        error?: string;
      };
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not connected/i);
    });

    it('returns error for unsupported console type', async () => {
      const result = (await getHandler('console:importPatch')(FAKE_EVENT, 'grandma2')) as {
        success: boolean;
        error?: string;
      };
      expect(result.success).toBe(false);
    });
  });

  // ── console:exportPatch ───────────────────────────────────────────────────

  describe('console:exportPatch', () => {
    it('sends commands and returns success with count', async () => {
      await getHandler('console:connect')(FAKE_EVENT, 'eos', '10.0.0.1');
      const result = (await getHandler('console:exportPatch')(FAKE_EVENT, 'eos', [
        { channel: '1', universe: 1, dmx_address: 1 },
      ])) as { success: boolean; sent?: number };
      expect(result.success).toBe(true);
      expect(result.sent).toBe(1);
      expect(mocks.send).toHaveBeenCalledWith('/eos/newcmd', 'Chan 1 Patch 1/1');
    });

    it('returns error when not connected', async () => {
      const result = (await getHandler('console:exportPatch')(FAKE_EVENT, 'eos', [])) as {
        success: boolean;
        error?: string;
      };
      expect(result.success).toBe(false);
    });
  });
});
