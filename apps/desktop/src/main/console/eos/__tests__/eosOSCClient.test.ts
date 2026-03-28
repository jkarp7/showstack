import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

vi.mock('../../../utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mocks = vi.hoisted(() => {
  const { EventEmitter: EE } = require('events') as { EventEmitter: typeof EventEmitter };

  const clientInstance = {
    send: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };

  // Tracks all Server instances so tests can inspect them
  const serverInstances: EventEmitter[] = [];

  class ServerMock extends EE {
    close = vi.fn().mockResolvedValue(undefined);
    constructor() {
      super();
      serverInstances.push(this);
      setTimeout(() => this.emit('listening'), 0);
    }
  }

  const ClientMock = vi.fn().mockReturnValue(clientInstance);
  const ServerMockFn = vi.fn().mockImplementation(() => new ServerMock());

  return { ClientMock, ServerMockFn, ServerMock, clientInstance, serverInstances };
});

vi.mock('node-osc', () => ({
  Client: mocks.ClientMock,
  Server: mocks.ServerMockFn,
}));

import { EosOSCClient, EOS_OSC_PORT } from '../eosOSCClient';

describe('EosOSCClient', () => {
  let client: EosOSCClient;

  beforeEach(() => {
    mocks.clientInstance.send.mockResolvedValue(undefined);
    mocks.clientInstance.close.mockResolvedValue(undefined);
    mocks.ClientMock.mockClear();
    mocks.ClientMock.mockReturnValue(mocks.clientInstance);
    mocks.serverInstances.length = 0;
    mocks.ServerMockFn.mockClear();
    mocks.ServerMockFn.mockImplementation(() => new mocks.ServerMock());
    client = new EosOSCClient('10.0.0.100');
  });

  // ─── constructor ──────────────────────────────────────────────────────────

  it('creates an OSC Client with the given IP and default port', () => {
    expect(mocks.ClientMock).toHaveBeenCalledWith('10.0.0.100', EOS_OSC_PORT);
  });

  it('accepts a custom port', () => {
    new EosOSCClient('10.0.0.1', 8000);
    expect(mocks.ClientMock).toHaveBeenCalledWith('10.0.0.1', 8000);
  });

  // ─── connect ──────────────────────────────────────────────────────────────

  it('resolves when the Server emits listening', async () => {
    await expect(client.connect()).resolves.toBeUndefined();
    expect(mocks.ServerMockFn).toHaveBeenCalled();
  });

  it('is a no-op if already connected', async () => {
    await client.connect();
    const callCount = mocks.ServerMockFn.mock.calls.length;
    await client.connect();
    expect(mocks.ServerMockFn.mock.calls.length).toBe(callCount);
  });

  // ─── disconnect ───────────────────────────────────────────────────────────

  it('closes the client socket', async () => {
    await client.disconnect();
    expect(mocks.clientInstance.close).toHaveBeenCalled();
  });

  it('closes the server if connected', async () => {
    await client.connect();
    const serverInstance = mocks.serverInstances[0] as unknown as {
      close: ReturnType<typeof vi.fn>;
    };
    await client.disconnect();
    expect(serverInstance.close).toHaveBeenCalled();
  });

  // ─── send ─────────────────────────────────────────────────────────────────

  it('delegates to client.send with address and args', async () => {
    await client.send('/eos/newcmd', 'Chan 1 Patch 1/1');
    expect(mocks.clientInstance.send).toHaveBeenCalledWith('/eos/newcmd', 'Chan 1 Patch 1/1');
  });

  it('sends address-only message when no args provided', async () => {
    await client.send('/eos/get/patch');
    expect(mocks.clientInstance.send).toHaveBeenCalledWith('/eos/get/patch');
  });

  // ─── getPatch ─────────────────────────────────────────────────────────────

  it('resolves with empty array when count is 0', async () => {
    await client.connect();
    const serverInstance = mocks.serverInstances[0] as EventEmitter;

    const patchPromise = client.getPatch();
    setTimeout(() => serverInstance.emit('message', ['/eos/out/patch/count', 0]), 0);

    await expect(patchPromise).resolves.toEqual([]);
  });

  it('collects all channel messages then resolves', async () => {
    await client.connect();
    const serverInstance = mocks.serverInstances[0] as EventEmitter;

    const patchPromise = client.getPatch();
    setTimeout(() => {
      serverInstance.emit('message', ['/eos/out/patch/count', 2]);
      serverInstance.emit('message', ['/eos/out/patch/0', 1, '1/1', 'Leko', 'SR 1', '']);
      serverInstance.emit('message', ['/eos/out/patch/1', 2, '1/2', 'Fresnel', 'SR 2', '']);
    }, 0);

    const result = await patchPromise;
    expect(result).toHaveLength(2);
    expect(result[0][0]).toBe('/eos/out/patch/0');
    expect(result[1][0]).toBe('/eos/out/patch/1');
  });

  it('rejects if timeout elapses before count message', async () => {
    await client.connect();
    await expect(client.getPatch(50)).rejects.toThrow('timed out');
  });

  it('rejects if not connected', async () => {
    await expect(client.getPatch()).rejects.toThrow('Not connected');
  });
});
