/**
 * Tests for PresenceService
 *
 * Covers join/leave presence channels, presence change callbacks,
 * getPresenceMembers snapshot, and cleanup on sign-out.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mocks
// ============================================

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Build a mock Realtime channel
function makeMockChannel() {
  const presenceState: Record<string, unknown[]> = {};
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    track: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    presenceState: vi.fn(() => presenceState),
    _presenceState: presenceState,
  };
  return channel;
}

type MockChannel = ReturnType<typeof makeMockChannel>;
let mockChannel: MockChannel;

const mockConnector = {
  isAuthenticated: vi.fn(),
  getUserId: vi.fn(),
  getSession: vi.fn(),
  getSupabaseClient: vi.fn(),
};

vi.mock('../sync/SupabaseConnector', () => ({
  getSupabaseConnector: () => mockConnector,
}));

// Import PresenceService after mocks
import { PresenceService } from '../PresenceService';

// ============================================
// Tests
// ============================================

describe('PresenceService', () => {
  let service: PresenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel = makeMockChannel();
    mockConnector.isAuthenticated.mockReturnValue(true);
    mockConnector.getUserId.mockReturnValue('user-123');
    mockConnector.getSession.mockReturnValue({ user: { email: 'test@example.com' } });
    mockConnector.getSupabaseClient.mockReturnValue({
      channel: vi.fn(() => mockChannel),
    });
    service = new PresenceService();
  });

  // ==========================================
  // joinProjectPresence
  // ==========================================

  describe('joinProjectPresence', () => {
    it('does nothing when not authenticated', () => {
      mockConnector.isAuthenticated.mockReturnValue(false);

      service.joinProjectPresence('proj-1');

      expect(mockConnector.getSupabaseClient).not.toHaveBeenCalled();
    });

    it('creates a presence channel and subscribes', () => {
      service.joinProjectPresence('proj-1', 'fixtures');

      expect(mockConnector.getSupabaseClient).toHaveBeenCalled();
      expect(mockChannel.on).toHaveBeenCalledWith(
        'presence',
        { event: 'sync' },
        expect.any(Function),
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('does not create a second channel when already joined', () => {
      service.joinProjectPresence('proj-1');
      const firstClient = mockConnector.getSupabaseClient.mock.calls.length;

      service.joinProjectPresence('proj-1'); // second call

      // getSupabaseClient should not have been called again — used track instead
      expect(mockConnector.getSupabaseClient.mock.calls.length).toBe(firstClient);
      expect(mockChannel.track).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // leaveProjectPresence
  // ==========================================

  describe('leaveProjectPresence', () => {
    it('does nothing when not joined', () => {
      // Should not throw
      service.leaveProjectPresence('not-joined');
    });

    it('unsubscribes and cleans up channel', () => {
      service.joinProjectPresence('proj-1');
      service.leaveProjectPresence('proj-1');

      expect(mockChannel.unsubscribe).toHaveBeenCalled();

      // Subsequent getPresenceMembers should return empty
      expect(service.getPresenceMembers('proj-1')).toEqual([]);
    });

    it('removes registered callbacks on leave', () => {
      service.joinProjectPresence('proj-1');
      const cb = vi.fn();
      service.onPresenceChange('proj-1', cb);

      service.leaveProjectPresence('proj-1');

      // Re-join and trigger presence — old callback should not fire
      service.joinProjectPresence('proj-1');
      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // onPresenceChange
  // ==========================================

  describe('onPresenceChange', () => {
    it('registers a callback and returns an unsubscribe function', () => {
      const cb = vi.fn();
      const unsub = service.onPresenceChange('proj-1', cb);

      expect(typeof unsub).toBe('function');
    });

    it('unsubscribe removes the callback', () => {
      service.joinProjectPresence('proj-1');

      // Capture the 'sync' event handler to trigger it manually
      const syncCallArgs = mockChannel.on.mock.calls.find(
        (call: unknown[]) => (call[1] as { event: string }).event === 'sync',
      );
      const syncHandler = syncCallArgs?.[2] as (() => void) | undefined;

      const cb = vi.fn();
      const unsub = service.onPresenceChange('proj-1', cb);

      unsub();

      // Trigger presence sync — cb should not be called
      syncHandler?.();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // getPresenceMembers
  // ==========================================

  describe('getPresenceMembers', () => {
    it('returns empty array when not joined', () => {
      expect(service.getPresenceMembers('not-joined')).toEqual([]);
    });

    it('returns flattened presence state', () => {
      service.joinProjectPresence('proj-1');
      const member = {
        userId: 'u1',
        email: 'a@b.com',
        displayName: 'a',
        activeView: 'fixtures',
        joinedAt: 1000,
      };
      mockChannel.presenceState.mockReturnValue({ u1: [member] });

      const members = service.getPresenceMembers('proj-1');

      expect(members).toEqual([member]);
    });
  });

  // ==========================================
  // cleanup
  // ==========================================

  describe('cleanup', () => {
    it('leaves all active channels', () => {
      service.joinProjectPresence('proj-1');
      service.joinProjectPresence('proj-2');

      service.cleanup();

      // Both channels should have been unsubscribed
      expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(2);
      expect(service.getPresenceMembers('proj-1')).toEqual([]);
      expect(service.getPresenceMembers('proj-2')).toEqual([]);
    });

    it('is safe to call with no active channels', () => {
      expect(() => service.cleanup()).not.toThrow();
    });
  });
});
