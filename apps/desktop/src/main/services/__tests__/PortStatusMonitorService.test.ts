import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as net from 'net';

vi.mock('../../utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// We mock net after import so we can control socket behaviour per-test.
vi.mock('net');

import { PortStatusMonitorServiceClass } from '../PortStatusMonitorService';

// Helper: build a fake socket that fires one event after a tick
function makeFakeSocket(event: 'connect' | 'error', err?: NodeJS.ErrnoException) {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  const socket = {
    on: vi.fn((ev: string, cb: (...args: unknown[]) => void) => {
      listeners[ev] = listeners[ev] ?? [];
      listeners[ev].push(cb);
      return socket;
    }),
    destroy: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  // Fire the event asynchronously so the promise has time to attach listeners
  setTimeout(() => {
    for (const cb of listeners[event] ?? []) {
      if (event === 'error') cb(err);
      else cb();
    }
  }, 0);
  return socket;
}

describe('PortStatusMonitorService', () => {
  let service: PortStatusMonitorServiceClass;

  beforeEach(() => {
    service = new PortStatusMonitorServiceClass();
    vi.mocked(net.createConnection).mockReset();
  });

  it('returns reachable when socket connects', async () => {
    vi.mocked(net.createConnection).mockReturnValue(makeFakeSocket('connect') as any);

    const [result] = await service.checkAll('proj-1', [{ id: 'eq-1', ip_address: '10.0.0.1' }]);
    expect(result.status).toBe('reachable');
    expect(result.equipment_id).toBe('eq-1');
    expect(result.ip).toBe('10.0.0.1');
  });

  it('returns reachable on ECONNREFUSED (host is up, port is closed)', async () => {
    const err = Object.assign(new Error('refused'), { code: 'ECONNREFUSED' });
    vi.mocked(net.createConnection).mockReturnValue(makeFakeSocket('error', err) as any);

    const [result] = await service.checkAll('proj-2', [{ id: 'eq-2', ip_address: '10.0.0.2' }]);
    expect(result.status).toBe('reachable');
  });

  it('returns unreachable on ENETUNREACH', async () => {
    const err = Object.assign(new Error('no route'), { code: 'ENETUNREACH' });
    vi.mocked(net.createConnection).mockReturnValue(makeFakeSocket('error', err) as any);

    const [result] = await service.checkAll('proj-3', [{ id: 'eq-3', ip_address: '10.0.0.3' }]);
    expect(result.status).toBe('unreachable');
  });

  it('skips equipment without ip_address', async () => {
    const results = await service.checkAll('proj-4', [
      { id: 'eq-no-ip', ip_address: null },
      { id: 'eq-no-ip-2' },
    ]);
    expect(results).toHaveLength(0);
    expect(net.createConnection).not.toHaveBeenCalled();
  });

  it('returns timeout when socket does not respond within timeout', async () => {
    vi.useFakeTimers();
    const socket = { on: vi.fn(), destroy: vi.fn(), removeAllListeners: vi.fn() };
    vi.mocked(net.createConnection).mockReturnValue(socket as unknown as net.Socket);

    const checkPromise = service.checkOne('eq-timeout', '10.0.0.99');
    await vi.advanceTimersByTimeAsync(2001);
    const result = await checkPromise;

    expect(result.status).toBe('timeout');
    expect(result.equipment_id).toBe('eq-timeout');
    vi.useRealTimers();
  });

  it('returns cached results within TTL', async () => {
    vi.mocked(net.createConnection).mockReturnValue(makeFakeSocket('connect') as any);

    // First call populates cache
    await service.checkAll('proj-5', [{ id: 'eq-5', ip_address: '10.0.0.5' }]);
    const callCount = vi.mocked(net.createConnection).mock.calls.length;

    // Second call within TTL should use cache
    await service.checkAll('proj-5', [{ id: 'eq-5', ip_address: '10.0.0.5' }]);
    expect(vi.mocked(net.createConnection).mock.calls.length).toBe(callCount);
  });

  it('re-checks after cache is cleared', async () => {
    vi.mocked(net.createConnection).mockReturnValue(makeFakeSocket('connect') as any);

    await service.checkAll('proj-6', [{ id: 'eq-6', ip_address: '10.0.0.6' }]);
    service.clearCache('proj-6');
    await service.checkAll('proj-6', [{ id: 'eq-6', ip_address: '10.0.0.6' }]);

    expect(vi.mocked(net.createConnection).mock.calls.length).toBe(2);
  });

  it('deduplicates concurrent checkAll calls for the same project', async () => {
    vi.mocked(net.createConnection).mockReturnValue(makeFakeSocket('connect') as any);

    // Fire two concurrent calls without awaiting the first
    const [r1, r2] = await Promise.all([
      service.checkAll('proj-7', [{ id: 'eq-7', ip_address: '10.0.0.7' }]),
      service.checkAll('proj-7', [{ id: 'eq-7', ip_address: '10.0.0.7' }]),
    ]);

    // Only one socket connection should have been made
    expect(vi.mocked(net.createConnection).mock.calls.length).toBe(1);
    expect(r1).toBe(r2);
  });
});
