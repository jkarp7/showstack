/**
 * Tests for infrastructure IPC handlers.
 * Currently covers: infrastructure:getPortStatusReport (cache miss, cache hit).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHandle, mockCheckAll } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockCheckAll: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
  dialog: {},
}));

vi.mock('../../utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../services/PortStatusMonitorService', () => ({
  portStatusMonitor: { checkAll: mockCheckAll },
}));

// Stub all other heavy dependencies — we only test getPortStatusReport here
vi.mock('../../database/queries/infrastructure', () => ({
  getPortLinkages: vi.fn(),
  getFixtureConnections: vi.fn(),
  getEquipmentConnections: vi.fn(),
  validatePortAssignment: vi.fn(),
  getPortUsageStats: vi.fn(),
  getAllPortUsageStats: vi.fn(),
  exportInfrastructureToCSV: vi.fn(),
  importInfrastructureFromCSV: vi.fn(),
}));
vi.mock('../../services/InfrastructureService', () => ({
  infrastructureService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../errors', () => ({
  errorHandler: { executeWithRetry: vi.fn(async (fn: () => unknown) => fn()) },
  DatabaseError: class DatabaseError extends Error {},
  ValidationError: class ValidationError extends Error {},
}));
vi.mock('@showstack/shared', () => ({
  CreateInfrastructureEquipmentSchema: { parse: vi.fn((v: unknown) => v) },
  UpdateInfrastructureEquipmentSchema: { parse: vi.fn((v: unknown) => v) },
  parseWithZod: vi.fn(),
  formatValidationErrors: vi.fn(),
}));

import { registerInfrastructureHandlers } from '../infrastructure';

/** Extract a registered handler by IPC channel name */
function getHandler(channel: string) {
  const call = mockHandle.mock.calls.find((c: unknown[]) => c[0] === channel);
  if (!call) throw new Error(`No handler registered for "${channel}"`);
  return call[1] as (...args: unknown[]) => Promise<unknown>;
}

const FAKE_EVENT = {};

describe('infrastructure:getPortStatusReport', () => {
  beforeEach(() => {
    mockHandle.mockClear();
    mockCheckAll.mockResolvedValue([
      {
        equipment_id: 'eq-1',
        ip: '10.0.0.1',
        status: 'reachable',
        latency_ms: 5,
        last_checked: 1000,
      },
    ]);
    registerInfrastructureHandlers();
  });

  it('calls portStatusMonitor.checkAll and returns results on cache miss', async () => {
    const handler = getHandler('infrastructure:getPortStatusReport');
    const equipment = [{ id: 'eq-1', ip_address: '10.0.0.1' }];
    const result = await handler(FAKE_EVENT, 'project-1', equipment);

    expect(mockCheckAll).toHaveBeenCalledWith('project-1', equipment);
    expect(result).toEqual([
      {
        equipment_id: 'eq-1',
        ip: '10.0.0.1',
        status: 'reachable',
        latency_ms: 5,
        last_checked: 1000,
      },
    ]);
  });

  it('returns the value from checkAll (caching is handled inside the service)', async () => {
    const handler = getHandler('infrastructure:getPortStatusReport');
    const equipment = [{ id: 'eq-1', ip_address: '10.0.0.1' }];

    // Call twice — both should return results; service handles its own TTL
    await handler(FAKE_EVENT, 'project-1', equipment);
    const result = await handler(FAKE_EVENT, 'project-1', equipment);

    expect(result).toBeDefined();
    expect(mockCheckAll).toHaveBeenCalledTimes(2);
  });

  it('propagates errors thrown by checkAll', async () => {
    mockCheckAll.mockRejectedValueOnce(new Error('network error'));
    const handler = getHandler('infrastructure:getPortStatusReport');
    await expect(handler(FAKE_EVENT, 'project-1', [])).rejects.toThrow('network error');
  });
});
