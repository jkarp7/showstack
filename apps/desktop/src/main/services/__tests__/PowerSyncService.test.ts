/**
 * Tests for PowerSyncService
 *
 * Tests the sync lifecycle, status management, and singleton pattern.
 * Target: ~80% coverage — all public methods and state transitions.
 *
 * @powersync/node is fully mocked; these tests exercise the service's own
 * orchestration logic (guards, state machine, listener fanout, etc.) without
 * hitting any real SQLite or network I/O.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Hoisted: shared mock state ───────────────────────────────────────────────

const mockDbCurrentStatus = {
  connected: false,
  connecting: false,
  dataFlowStatus: null as { downloading: boolean; uploading: boolean } | null,
  hasSynced: false,
};

const mockDbInstance = {
  init: vi.fn().mockResolvedValue(undefined),
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  getAll: vi.fn().mockResolvedValue([]),
  execute: vi.fn().mockResolvedValue(undefined),
  writeTransaction: vi
    .fn()
    .mockImplementation(async (cb: (tx: unknown) => unknown) => cb({ execute: vi.fn() })),
  getNextCrudTransaction: vi.fn().mockResolvedValue(null),
  registerListener: vi.fn(),
  watch: vi.fn(),
  get currentStatus() {
    return mockDbCurrentStatus;
  },
};

const mockGetConfig = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    isConfigured: true,
    app: { debugPowerSync: false },
  }),
);

const mockGetConnector = vi.hoisted(() => vi.fn());
const mockOnSessionChange = vi.hoisted(() => vi.fn().mockReturnValue(() => {}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@powersync/node', () => ({
  PowerSyncDatabase: vi.fn(() => mockDbInstance),
}));

vi.mock('../sync/SupabaseConnector', () => ({
  getSupabaseConnector: mockGetConnector,
}));

vi.mock('../sync/powerSyncSchema', () => ({
  AppSchema: {},
}));

vi.mock('../../config/env', () => ({
  getConfig: mockGetConfig,
}));

const mockGetPath = vi.hoisted(() => vi.fn().mockReturnValue('/tmp/test-userdata'));

vi.mock('electron', () => ({
  app: { getPath: mockGetPath, isPackaged: false },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import {
  PowerSyncService,
  getPowerSyncService,
  resetPowerSyncService,
} from '../sync/PowerSyncService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConnector(authenticated = false) {
  return {
    isAuthenticated: vi.fn().mockReturnValue(authenticated),
    onSessionChange: mockOnSessionChange,
    getClient: vi.fn().mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: authenticated ? {} : null } }),
      },
    }),
  };
}

function resetDbInstance() {
  mockDbInstance.init.mockReset().mockResolvedValue(undefined);
  mockDbInstance.connect.mockReset().mockResolvedValue(undefined);
  mockDbInstance.disconnect.mockReset().mockResolvedValue(undefined);
  mockDbInstance.close.mockReset().mockResolvedValue(undefined);
  mockDbInstance.getAll.mockReset().mockResolvedValue([]);
  mockDbInstance.execute.mockReset().mockResolvedValue(undefined);
  mockDbInstance.writeTransaction
    .mockReset()
    .mockImplementation(async (cb: (tx: unknown) => unknown) => cb({ execute: vi.fn() }));
  mockDbInstance.getNextCrudTransaction.mockReset().mockResolvedValue(null);
  mockDbInstance.registerListener.mockReset();
  mockDbInstance.watch.mockReset();
  mockDbCurrentStatus.connected = false;
  mockDbCurrentStatus.connecting = false;
  mockDbCurrentStatus.dataFlowStatus = null;
  mockDbCurrentStatus.hasSynced = false;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PowerSyncService', () => {
  let service: PowerSyncService;

  beforeEach(() => {
    resetDbInstance();
    mockGetPath.mockReturnValue('/tmp/test-userdata');
    mockGetConfig.mockReturnValue({ isConfigured: true, app: { debugPowerSync: false } });
    mockOnSessionChange.mockReturnValue(() => {});
    mockGetConnector.mockReturnValue(makeConnector(false));
    service = new PowerSyncService();
  });

  // ── initialize() ────────────────────────────────────────────────────────────

  describe('initialize()', () => {
    it('initializes when cloud is configured', async () => {
      await service.initialize();

      expect(mockDbInstance.init).toHaveBeenCalledTimes(1);
      expect(service.isReady()).toBe(true);
    });

    it('skips initialization when cloud is not configured', async () => {
      mockGetConfig.mockReturnValueOnce({ isConfigured: false, app: { debugPowerSync: false } });

      await service.initialize();

      expect(mockDbInstance.init).not.toHaveBeenCalled();
      expect(service.isReady()).toBe(false);
    });

    it('is idempotent — second call is a no-op', async () => {
      await service.initialize();
      await service.initialize();

      expect(mockDbInstance.init).toHaveBeenCalledTimes(1);
    });

    it('propagates errors and sets error state', async () => {
      mockDbInstance.init.mockRejectedValueOnce(new Error('DB init failed'));

      await expect(service.initialize()).rejects.toThrow('DB init failed');
      expect(service.getSyncStatus().error).toBe('DB init failed');
    });

    it('registers a session-change listener after init', async () => {
      await service.initialize();

      expect(mockOnSessionChange).toHaveBeenCalledTimes(1);
    });

    it('auto-connects when session change fires with a session', async () => {
      const connector = makeConnector(true);
      mockGetConnector.mockReturnValue(connector);
      let sessionCallback: ((session: unknown) => void) | null = null;
      connector.onSessionChange.mockImplementation((cb: (s: unknown) => void) => {
        sessionCallback = cb;
        return () => {};
      });

      await service.initialize();
      // initialize() already auto-connected; clear so we only count the
      // session-change triggered call below.
      mockDbInstance.connect.mockClear();

      // Simulate sign-in event
      sessionCallback!({ user: { id: 'u1' } });
      await Promise.resolve();

      expect(mockDbInstance.connect).toHaveBeenCalledTimes(1);
    });

    it('auto-connects on initialization when already authenticated', async () => {
      mockGetConnector.mockReturnValue(makeConnector(true));
      await service.initialize();
      await Promise.resolve();

      expect(mockDbInstance.connect).toHaveBeenCalledTimes(1);
    });

    it('auto-disconnects when session change fires with null', async () => {
      const connector = makeConnector(true);
      mockGetConnector.mockReturnValue(connector);
      let sessionCallback: ((session: unknown) => void) | null = null;
      connector.onSessionChange.mockImplementation((cb: (s: unknown) => void) => {
        sessionCallback = cb;
        return () => {};
      });

      await service.initialize();
      sessionCallback!({ user: { id: 'u1' } });
      await Promise.resolve();

      sessionCallback!(null);
      await Promise.resolve();

      expect(mockDbInstance.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  // ── connect() ───────────────────────────────────────────────────────────────

  describe('connect()', () => {
    it('throws if not initialized', async () => {
      await expect(service.connect()).rejects.toThrow('PowerSync not initialized');
    });

    it('throws if user is not authenticated', async () => {
      mockGetConnector.mockReturnValue(makeConnector(false));
      await service.initialize();

      await expect(service.connect()).rejects.toThrow('User must be authenticated');
    });

    it('connects when authenticated', async () => {
      mockGetConnector.mockReturnValue(makeConnector(true));
      await service.initialize();
      // initialize() auto-connects when session exists (count = 1); explicit
      // call below adds a second connect.
      mockDbInstance.connect.mockClear();

      await service.connect();

      expect(mockDbInstance.connect).toHaveBeenCalledTimes(1);
    });

    it('sets error state on connection failure', async () => {
      mockGetConnector.mockReturnValue(makeConnector(true));
      await service.initialize();
      mockDbInstance.connect.mockReset().mockRejectedValueOnce(new Error('Network unreachable'));

      // connect() is now fire-and-forget for db.connect() — it does not throw,
      // but the error surfaces asynchronously via the .catch() handler.
      await service.connect();
      await Promise.resolve(); // flush microtask queue
      expect(service.getSyncStatus().error).toBe('Network unreachable');
      expect(service.getSyncStatus().state).toBe('error');
    });
  });

  // ── disconnect() ─────────────────────────────────────────────────────────────

  describe('disconnect()', () => {
    it('is a no-op if not initialized', async () => {
      await service.disconnect(); // should not throw
      expect(mockDbInstance.disconnect).not.toHaveBeenCalled();
    });

    it('calls db.disconnect() when initialized', async () => {
      await service.initialize();
      await service.disconnect();

      expect(mockDbInstance.disconnect).toHaveBeenCalledTimes(1);
    });

    it('clears error state on disconnect', async () => {
      mockGetConnector.mockReturnValue(makeConnector(true));
      await service.initialize();
      mockDbInstance.connect.mockRejectedValueOnce(new Error('failed'));
      try {
        await service.connect();
      } catch {
        /* expected */
      }

      await service.disconnect();

      expect(service.getSyncStatus().error).toBeNull();
    });
  });

  // ── getSyncStatus() ─────────────────────────────────────────────────────────

  describe('getSyncStatus()', () => {
    it('returns disconnected state when not initialized', () => {
      const status = service.getSyncStatus();

      expect(status.state).toBe('disconnected');
      expect(status.connected).toBe(false);
      expect(status.error).toBeNull();
      expect(status.isAuthenticated).toBe(false);
    });

    it('returns connected state when db reports connected', async () => {
      mockGetConnector.mockReturnValue(makeConnector(true));
      await service.initialize();
      mockDbCurrentStatus.connected = true;

      const status = service.getSyncStatus();

      expect(status.state).toBe('connected');
      expect(status.connected).toBe(true);
    });

    it('returns connecting state', async () => {
      await service.initialize();
      mockDbCurrentStatus.connecting = true;

      const status = service.getSyncStatus();

      expect(status.state).toBe('connecting');
    });

    it('returns syncing state when uploading', async () => {
      mockGetConnector.mockReturnValue(makeConnector(true));
      await service.initialize();
      mockDbCurrentStatus.connected = true;
      mockDbCurrentStatus.dataFlowStatus = { downloading: false, uploading: true };

      const status = service.getSyncStatus();

      expect(status.state).toBe('syncing');
      expect(status.hasPendingChanges).toBe(true);
    });

    it('returns syncing state when downloading', async () => {
      mockGetConnector.mockReturnValue(makeConnector(true));
      await service.initialize();
      mockDbCurrentStatus.connected = true;
      mockDbCurrentStatus.dataFlowStatus = { downloading: true, uploading: false };

      const status = service.getSyncStatus();

      expect(status.state).toBe('syncing');
    });

    it('returns error state when currentError is set', async () => {
      mockGetConnector.mockReturnValue(makeConnector(true));
      await service.initialize();
      mockDbInstance.connect.mockRejectedValueOnce(new Error('oops'));
      try {
        await service.connect();
      } catch {
        /* expected */
      }

      const status = service.getSyncStatus();

      expect(status.state).toBe('error');
      expect(status.error).toBe('oops');
    });
  });

  // ── onStatusChange() ────────────────────────────────────────────────────────

  describe('onStatusChange()', () => {
    it('immediately invokes listener with current status', () => {
      const listener = vi.fn();
      service.onStatusChange(listener);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].state).toBe('disconnected');
    });

    it('returns an unsubscribe function that stops notifications', async () => {
      await service.initialize();
      const listener = vi.fn();
      const unsubscribe = service.onStatusChange(listener);
      listener.mockClear();

      unsubscribe();

      await service.disconnect(); // triggers notifyStatusListeners
      expect(listener).not.toHaveBeenCalled();
    });

    it('notifies all active listeners on status change', async () => {
      await service.initialize();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.onStatusChange(listener1);
      service.onStatusChange(listener2);
      listener1.mockClear();
      listener2.mockClear();

      await service.disconnect();

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('continues notifying other listeners if one throws', async () => {
      await service.initialize();
      const badListener = vi.fn().mockImplementation(() => {
        throw new Error('listener exploded');
      });
      const goodListener = vi.fn();
      service.onStatusChange(badListener);
      service.onStatusChange(goodListener);
      badListener.mockClear();
      goodListener.mockClear();

      await service.disconnect();

      expect(goodListener).toHaveBeenCalledTimes(1);
    });
  });

  // ── isReady() / isCloudConfigured() ─────────────────────────────────────────

  describe('isReady()', () => {
    it('returns false before initialization', () => {
      expect(service.isReady()).toBe(false);
    });

    it('returns true after successful initialization', async () => {
      await service.initialize();
      expect(service.isReady()).toBe(true);
    });
  });

  describe('isCloudConfigured()', () => {
    it('returns true when config is configured', () => {
      expect(service.isCloudConfigured()).toBe(true);
    });

    it('returns false when config is not configured', () => {
      mockGetConfig.mockReturnValueOnce({ isConfigured: false, app: { debugPowerSync: false } });

      expect(service.isCloudConfigured()).toBe(false);
    });
  });

  // ── sync() ───────────────────────────────────────────────────────────────────

  describe('sync()', () => {
    it('throws if not initialized', async () => {
      await expect(service.sync()).rejects.toThrow('PowerSync not initialized');
    });

    it('triggers a write transaction when initialized', async () => {
      await service.initialize();
      await service.sync();

      expect(mockDbInstance.writeTransaction).toHaveBeenCalledTimes(1);
    });
  });

  // ── hasPendingChanges() ──────────────────────────────────────────────────────

  describe('hasPendingChanges()', () => {
    it('returns false when not initialized', async () => {
      expect(await service.hasPendingChanges()).toBe(false);
    });

    it('returns false when no pending crud transaction', async () => {
      await service.initialize();
      mockDbInstance.getNextCrudTransaction.mockResolvedValueOnce(null);

      expect(await service.hasPendingChanges()).toBe(false);
    });

    it('returns true when there is a pending crud transaction', async () => {
      await service.initialize();
      mockDbInstance.getNextCrudTransaction.mockResolvedValueOnce({ id: 'tx-1' });

      expect(await service.hasPendingChanges()).toBe(true);
    });
  });

  // ── query() / execute() / transaction() ─────────────────────────────────────

  describe('query()', () => {
    it('throws if not initialized', async () => {
      await expect(service.query('SELECT 1')).rejects.toThrow('PowerSync not initialized');
    });

    it('delegates to db.getAll', async () => {
      await service.initialize();
      const rows = [{ id: '1' }];
      mockDbInstance.getAll.mockResolvedValueOnce(rows);

      const result = await service.query('SELECT * FROM fixtures', ['p1']);

      expect(mockDbInstance.getAll).toHaveBeenCalledWith('SELECT * FROM fixtures', ['p1']);
      expect(result).toEqual(rows);
    });
  });

  describe('execute()', () => {
    it('throws if not initialized', async () => {
      await expect(service.execute('DELETE FROM fixtures')).rejects.toThrow(
        'PowerSync not initialized',
      );
    });

    it('delegates to db.execute', async () => {
      await service.initialize();
      await service.execute('DELETE FROM fixtures WHERE id = ?', ['x']);

      expect(mockDbInstance.execute).toHaveBeenCalledWith('DELETE FROM fixtures WHERE id = ?', [
        'x',
      ]);
    });
  });

  describe('transaction()', () => {
    it('throws if not initialized', async () => {
      await expect(service.transaction(async () => {})).rejects.toThrow(
        'PowerSync not initialized',
      );
    });

    it('runs callback inside a write transaction', async () => {
      await service.initialize();
      const callback = vi.fn().mockResolvedValue('result');

      const result = await service.transaction(callback);

      expect(mockDbInstance.writeTransaction).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });
  });

  // ── dispose() ────────────────────────────────────────────────────────────────

  describe('dispose()', () => {
    it('cleans up db, connector, and listeners', async () => {
      await service.initialize();
      service.onStatusChange(vi.fn()); // add a listener

      await service.dispose();

      expect(mockDbInstance.disconnect).toHaveBeenCalledTimes(1);
      expect(mockDbInstance.close).toHaveBeenCalledTimes(1);
      expect(service.isReady()).toBe(false);
    });

    it('is safe to call when not initialized', async () => {
      await service.dispose(); // should not throw
    });
  });

  // ── Singleton helpers ─────────────────────────────────────────────────────────

  describe('getPowerSyncService() / resetPowerSyncService()', () => {
    afterEach(() => {
      resetPowerSyncService();
    });

    it('returns the same instance on repeated calls', () => {
      const a = getPowerSyncService();
      const b = getPowerSyncService();
      expect(a).toBe(b);
    });

    it('creates a new instance after reset', () => {
      const a = getPowerSyncService();
      resetPowerSyncService();
      const b = getPowerSyncService();
      expect(a).not.toBe(b);
    });
  });
});
