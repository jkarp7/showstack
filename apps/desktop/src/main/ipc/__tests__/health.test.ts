/**
 * Tests for Health Check IPC handler — caching behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockHandle, mockCheck } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockCheck: vi.fn(),
}));

// Mock electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: mockHandle,
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock HealthChecker
vi.mock('../../services/HealthChecker', () => ({
  healthChecker: {
    check: mockCheck,
  },
  HealthReportSchema: {
    parse: vi.fn((v: unknown) => v),
  },
}));

import { registerHealthHandlers, resetHealthCache } from '../health';

describe('Health IPC handler caching', () => {
  let healthHandler: () => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    resetHealthCache();

    // Register handlers and capture the registered callback
    registerHealthHandlers();
    const handleCall = mockHandle.mock.calls.find((call: unknown[]) => call[0] === 'health:check');
    healthHandler = handleCall![1] as () => Promise<unknown>;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call healthChecker.check on first request', async () => {
    const report = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'healthy', message: 'ok' },
        filesystem: { status: 'healthy', message: 'ok' },
        memory: { status: 'healthy', message: 'ok' },
        sync: { status: 'healthy', message: 'ok' },
      },
    };
    mockCheck.mockResolvedValueOnce(report);

    const result = await healthHandler();

    expect(mockCheck).toHaveBeenCalledTimes(1);
    expect(result).toEqual(report);
  });

  it('should return cached report within 5s window', async () => {
    const report = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'healthy', message: 'ok' },
        filesystem: { status: 'healthy', message: 'ok' },
        memory: { status: 'healthy', message: 'ok' },
        sync: { status: 'healthy', message: 'ok' },
      },
    };
    mockCheck.mockResolvedValue(report);

    // First call — should invoke healthChecker
    await healthHandler();
    expect(mockCheck).toHaveBeenCalledTimes(1);

    // Advance 3 seconds (within 5s TTL)
    vi.advanceTimersByTime(3000);

    // Second call — should return cached
    const result = await healthHandler();
    expect(mockCheck).toHaveBeenCalledTimes(1); // Still 1
    expect(result).toEqual(report);
  });

  it('should refresh after 5s TTL expires', async () => {
    const report1 = {
      status: 'healthy',
      timestamp: '2024-01-01T00:00:00Z',
      checks: {
        database: { status: 'healthy', message: 'ok' },
        filesystem: { status: 'healthy', message: 'ok' },
        memory: { status: 'healthy', message: 'ok' },
        sync: { status: 'healthy', message: 'ok' },
      },
    };
    const report2 = {
      status: 'degraded',
      timestamp: '2024-01-01T00:00:06Z',
      checks: {
        database: { status: 'healthy', message: 'ok' },
        filesystem: { status: 'degraded', message: 'low space' },
        memory: { status: 'healthy', message: 'ok' },
        sync: { status: 'healthy', message: 'ok' },
      },
    };

    mockCheck.mockResolvedValueOnce(report1).mockResolvedValueOnce(report2);

    // First call
    await healthHandler();
    expect(mockCheck).toHaveBeenCalledTimes(1);

    // Advance past 5s TTL
    vi.advanceTimersByTime(5001);

    // Second call — should get fresh report
    const result = await healthHandler();
    expect(mockCheck).toHaveBeenCalledTimes(2);
    expect(result).toEqual(report2);
  });
});
