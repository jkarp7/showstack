/**
 * Tests for SupabaseConnector
 *
 * Tests the license-related methods of SupabaseConnector:
 * - fetchUserLicense
 * - claimLicenseByEmail
 * - Authentication state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before imports
vi.mock('../../config/env', () => ({
  getConfig: () => ({
    supabase: { url: 'https://test.supabase.co', anonKey: 'test-key' },
    powersync: { url: 'https://test.powersync.com' },
    app: { debugPowerSync: false },
  }),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Supabase client
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockAuth = {
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: mockAuth,
  }),
}));

vi.mock('@powersync/node', () => ({
  AbstractPowerSyncDatabase: class {},
  PowerSyncBackendConnector: class {},
  UpdateType: { PUT: 'PUT', PATCH: 'PATCH', DELETE: 'DELETE' },
}));

import { SupabaseConnector } from '../sync/SupabaseConnector';

describe('SupabaseConnector', () => {
  let connector: SupabaseConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new SupabaseConnector();
  });

  describe('authentication state', () => {
    it('starts unauthenticated', () => {
      expect(connector.isAuthenticated()).toBe(false);
      expect(connector.getUserId()).toBeNull();
      expect(connector.getSession()).toBeNull();
    });

    it('signIn updates session on success', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token',
      };
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await connector.signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(connector.isAuthenticated()).toBe(true);
    });

    it('signIn returns user-friendly error on failure', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await connector.signIn('bad@example.com', 'wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('signUp returns user-friendly error on failure', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { session: null },
        error: { message: 'User already registered' },
      });

      const result = await connector.signUp('taken@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('An account with this email already exists');
    });

    it('signOut clears session', async () => {
      // First sign in
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token',
      };
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      await connector.signIn('test@example.com', 'password123');
      expect(connector.isAuthenticated()).toBe(true);

      // Then sign out
      mockAuth.signOut.mockResolvedValue({});
      await connector.signOut();

      expect(connector.isAuthenticated()).toBe(false);
      expect(connector.getSession()).toBeNull();
    });
  });

  describe('fetchUserLicense', () => {
    it('returns null when not authenticated', async () => {
      const result = await connector.fetchUserLicense();
      expect(result).toBeNull();
    });

    it('returns license matched by user_id', async () => {
      // Set up authenticated session
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token',
      };
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      await connector.signIn('test@example.com', 'password123');

      const mockLicense = {
        id: 'lic-1',
        license_key: 'KEY-1',
        user_id: 'user-123',
        email: 'test@example.com',
        tier: 'professional',
        modules: [],
        maintenance_end_date: '2027-01-01T00:00:00Z',
        status: 'active',
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockLicense, error: null }),
      };
      mockFrom.mockReturnValue(mockChain);

      const result = await connector.fetchUserLicense();
      expect(result).toEqual(mockLicense);
    });

    it('falls back to email match when no user_id match', async () => {
      // Set up authenticated session
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token',
      };
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      await connector.signIn('test@example.com', 'password123');

      const unclaimedLicense = {
        id: 'lic-2',
        license_key: 'KEY-2',
        user_id: null,
        email: 'test@example.com',
        tier: 'professional',
        modules: [],
        maintenance_end_date: '2027-01-01T00:00:00Z',
        status: 'active',
      };

      // First call (by user_id) returns no match
      const firstChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      // Second call (by email) returns unclaimed license
      const secondChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: unclaimedLicense, error: null }),
      };

      mockFrom.mockReturnValueOnce(firstChain).mockReturnValueOnce(secondChain);

      const result = await connector.fetchUserLicense();
      expect(result).toEqual(unclaimedLicense);
    });
  });

  describe('claimLicenseByEmail', () => {
    it('returns success on successful claim', async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, license: { id: 'lic-1' } },
        error: null,
      });

      const result = await connector.claimLicenseByEmail();
      expect(result.success).toBe(true);
    });

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Function call failed' },
      });

      const result = await connector.claimLicenseByEmail();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Function call failed');
    });
  });

  describe('resetPassword', () => {
    it('returns success when reset email sent', async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const result = await connector.resetPassword('test@example.com');
      expect(result.success).toBe(true);
    });

    it('returns error on failure', async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      });

      const result = await connector.resetPassword('test@example.com');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  describe('session listeners', () => {
    it('notifies listeners on session change', () => {
      const listener = vi.fn();
      connector.onSessionChange(listener);

      // Simulate auth state change by calling the registered callback
      const authCallback = mockAuth.onAuthStateChange.mock.calls[0][0];
      const mockSession = { user: { id: 'user-1' }, access_token: 'tok' };
      authCallback('SIGNED_IN', mockSession);

      expect(listener).toHaveBeenCalledWith(mockSession);
    });

    it('unsubscribe removes listener', () => {
      const listener = vi.fn();
      const unsubscribe = connector.onSessionChange(listener);
      unsubscribe();

      // Simulate auth state change
      const authCallback = mockAuth.onAuthStateChange.mock.calls[0][0];
      authCallback('SIGNED_OUT', null);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ── Issue #81: CRUD upload error sanitization ──────────────────────────────

  describe('uploadData (CRUD error handling)', () => {
    // Helper: set up an authenticated session
    async function signInConnector() {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token',
      };
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      await connector.signIn('test@example.com', 'password123');
    }

    // Minimal mock of the AbstractPowerSyncDatabase interface used by uploadData
    function makeDb(crud: object[], complete = vi.fn().mockResolvedValue(undefined)) {
      return {
        getNextCrudTransaction: vi.fn().mockResolvedValue({ crud, complete }),
      };
    }

    it('returns early when there are no pending CRUD transactions', async () => {
      const db = { getNextCrudTransaction: vi.fn().mockResolvedValue(null) };
      await connector.uploadData(db as never);
      expect(db.getNextCrudTransaction).toHaveBeenCalledTimes(1);
    });

    it('calls complete() after all operations succeed', async () => {
      const complete = vi.fn().mockResolvedValue(undefined);
      const crud = [{ op: 'PUT', table: 'fixtures', id: 'fix-1', opData: { name: 'SR Special' } }];
      const db = makeDb(crud, complete);

      const mockChain = { upsert: vi.fn().mockResolvedValue({ error: null }) };
      mockFrom.mockReturnValue(mockChain);

      await connector.uploadData(db as never);

      expect(complete).toHaveBeenCalledTimes(1);
    });

    it('does NOT call complete() when a CRUD operation fails (allows retry)', async () => {
      const complete = vi.fn().mockResolvedValue(undefined);
      const crud = [{ op: 'PUT', table: 'fixtures', id: 'fix-1', opData: {} }];
      const db = makeDb(crud, complete);

      const mockChain = {
        upsert: vi
          .fn()
          .mockResolvedValue({ error: { message: 'permission denied for table fixtures' } }),
      };
      mockFrom.mockReturnValue(mockChain);

      await expect(connector.uploadData(db as never)).rejects.toThrow();
      expect(complete).not.toHaveBeenCalled();
    });

    it('sanitizes permission errors — does not expose raw DB error text', async () => {
      const complete = vi.fn().mockResolvedValue(undefined);
      const crud = [{ op: 'PUT', table: 'fixtures', id: 'fix-1', opData: {} }];
      const db = makeDb(crud, complete);

      const mockChain = {
        upsert: vi
          .fn()
          .mockResolvedValue({ error: { message: 'permission denied for table fixtures' } }),
      };
      mockFrom.mockReturnValue(mockChain);

      await expect(connector.uploadData(db as never)).rejects.toThrow(
        'Permission denied on PUT fixtures',
      );
    });

    it('sanitizes duplicate key errors', async () => {
      const crud = [{ op: 'PATCH', table: 'projects', id: 'proj-1', opData: { name: 'X' } }];
      const db = makeDb(crud);

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: '23505 duplicate key value violates unique constraint' },
        }),
      };
      mockFrom.mockReturnValue(mockChain);

      await expect(connector.uploadData(db as never)).rejects.toThrow(
        'Duplicate record on PATCH projects',
      );
    });

    it('sanitizes record-not-found errors', async () => {
      const crud = [{ op: 'DELETE', table: 'fixtures', id: 'gone-1', opData: {} }];
      const db = makeDb(crud);

      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'PGRST116: not found' } }),
      };
      mockFrom.mockReturnValue(mockChain);

      await expect(connector.uploadData(db as never)).rejects.toThrow(
        'Record not found on DELETE fixtures',
      );
    });

    it('throws generic sanitized message for unknown errors', async () => {
      const crud = [{ op: 'PUT', table: 'fixtures', id: 'fix-1', opData: {} }];
      const db = makeDb(crud);

      const mockChain = {
        upsert: vi.fn().mockResolvedValue({
          error: { message: 'some internal pg error with schema details column_x' },
        }),
      };
      mockFrom.mockReturnValue(mockChain);

      await expect(connector.uploadData(db as never)).rejects.toThrow(
        'Sync PUT failed for fixtures',
      );
    });
  });

  // ── Issue #81: ClaimLicenseResponse type ────────────────────────────────────

  describe('claimLicenseByEmail (typed response)', () => {
    it('returns typed ClaimLicenseResponse on success', async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, license: { id: 'lic-1', license_key: 'KEY-1' } },
        error: null,
      });

      const result = await connector.claimLicenseByEmail();

      // Type check — result has the ClaimLicenseResponse shape
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('license');
    });

    it('returns typed error response on malformed RPC reply', async () => {
      mockRpc.mockResolvedValue({
        data: 'unexpected string',
        error: null,
      });

      const result = await connector.claimLicenseByEmail();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid response from license claim');
    });
  });
});
