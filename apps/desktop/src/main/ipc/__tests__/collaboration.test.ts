/**
 * Tests for Collaboration IPC handlers
 *
 * Verifies input validation and delegation to CollaborationService/PresenceService.
 * Uses the vi.hoisted pattern to capture ipcMain.handle calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Hoisted mocks (must be before any imports)
// ============================================

const {
  mockHandle,
  mockRemoveHandler,
  mockInviteToProject,
  mockRemoveProjectMember,
  mockGetProjectMembers,
  mockAcceptProjectInvitation,
  mockCheckPendingProjectInvitations,
  mockDeclineProjectInvitation,
  mockCancelProjectInvitation,
  mockInviteToShopOrder,
  mockRemoveShopOrderMember,
  mockGetShopOrderMembers,
  mockAcceptShopOrderInvitation,
  mockCheckPendingShopOrderInvitations,
  mockDeclineShopOrderInvitation,
  mockCancelShopOrderInvitation,
  mockJoinProjectPresence,
  mockLeaveProjectPresence,
  mockGetPresenceMembers,
  mockOnPresenceChange,
  mockFromWebContents,
} = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockRemoveHandler: vi.fn(),
  mockInviteToProject: vi.fn(),
  mockRemoveProjectMember: vi.fn(),
  mockGetProjectMembers: vi.fn(),
  mockAcceptProjectInvitation: vi.fn(),
  mockCheckPendingProjectInvitations: vi.fn(),
  mockDeclineProjectInvitation: vi.fn(),
  mockCancelProjectInvitation: vi.fn(),
  mockInviteToShopOrder: vi.fn(),
  mockRemoveShopOrderMember: vi.fn(),
  mockGetShopOrderMembers: vi.fn(),
  mockAcceptShopOrderInvitation: vi.fn(),
  mockCheckPendingShopOrderInvitations: vi.fn(),
  mockDeclineShopOrderInvitation: vi.fn(),
  mockCancelShopOrderInvitation: vi.fn(),
  mockJoinProjectPresence: vi.fn(),
  mockLeaveProjectPresence: vi.fn(),
  mockGetPresenceMembers: vi.fn(),
  mockOnPresenceChange: vi.fn(),
  mockFromWebContents: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle, removeHandler: mockRemoveHandler },
  BrowserWindow: { fromWebContents: mockFromWebContents },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../services/CollaborationService', () => ({
  collaborationService: {
    inviteToProject: mockInviteToProject,
    removeProjectMember: mockRemoveProjectMember,
    getProjectMembers: mockGetProjectMembers,
    acceptProjectInvitation: mockAcceptProjectInvitation,
    checkPendingProjectInvitations: mockCheckPendingProjectInvitations,
    declineProjectInvitation: mockDeclineProjectInvitation,
    cancelProjectInvitation: mockCancelProjectInvitation,
    inviteToShopOrder: mockInviteToShopOrder,
    removeShopOrderMember: mockRemoveShopOrderMember,
    getShopOrderMembers: mockGetShopOrderMembers,
    acceptShopOrderInvitation: mockAcceptShopOrderInvitation,
    checkPendingShopOrderInvitations: mockCheckPendingShopOrderInvitations,
    declineShopOrderInvitation: mockDeclineShopOrderInvitation,
    cancelShopOrderInvitation: mockCancelShopOrderInvitation,
  },
}));

vi.mock('../../services/PresenceService', () => ({
  presenceService: {
    joinProjectPresence: mockJoinProjectPresence,
    leaveProjectPresence: mockLeaveProjectPresence,
    getPresenceMembers: mockGetPresenceMembers,
    onPresenceChange: mockOnPresenceChange,
  },
}));

import { registerCollaborationHandlers, _resetPresenceStateForTesting } from '../collaboration';

// ============================================
// Helper: get a registered handler by channel name
// ============================================

function getHandler(channel: string): (event: unknown, ...args: unknown[]) => Promise<unknown> {
  const call = mockHandle.mock.calls.find((c: unknown[]) => c[0] === channel);
  if (!call) throw new Error(`No handler registered for channel: ${channel}`);
  return call[1] as (event: unknown, ...args: unknown[]) => Promise<unknown>;
}

const fakeEvent = { sender: { id: 1 } };

// ============================================
// Tests
// ============================================

describe('Collaboration IPC handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetPresenceStateForTesting();
    registerCollaborationHandlers();
  });

  // ==========================================
  // collaboration:invite-to-project
  // ==========================================

  describe('collaboration:invite-to-project', () => {
    it('returns error for invalid project ID', async () => {
      const handler = getHandler('collaboration:invite-to-project');
      const result = await handler(fakeEvent, '', 'Test Project', 'a@b.com', 'editor');
      expect(result).toMatchObject({ success: false, error: 'Invalid project ID' });
    });

    it('returns error for invalid project name', async () => {
      const handler = getHandler('collaboration:invite-to-project');
      const result = await handler(fakeEvent, 'proj-1', '', 'a@b.com', 'editor');
      expect(result).toMatchObject({ success: false, error: 'Invalid project name' });
    });

    it('returns error for invalid email', async () => {
      const handler = getHandler('collaboration:invite-to-project');
      const result = await handler(fakeEvent, 'proj-1', 'Test Project', 'not-an-email', 'editor');
      expect(result).toMatchObject({ success: false, error: 'Invalid email address' });
    });

    it('returns error for invalid role', async () => {
      const handler = getHandler('collaboration:invite-to-project');
      const result = await handler(fakeEvent, 'proj-1', 'Test Project', 'a@b.com', 'superadmin');
      expect(result).toMatchObject({ success: false });
    });

    it('returns error for owner role', async () => {
      const handler = getHandler('collaboration:invite-to-project');
      const result = await handler(fakeEvent, 'proj-1', 'Test Project', 'a@b.com', 'owner');
      expect(result).toMatchObject({ success: false });
    });

    it('delegates to collaborationService.inviteToProject with trimmed lowercase email', async () => {
      mockInviteToProject.mockResolvedValue({ success: true, memberId: 'm1' });
      const handler = getHandler('collaboration:invite-to-project');

      const result = await handler(fakeEvent, 'proj-1', 'Test Project', '  A@B.COM  ', 'editor');

      expect(mockInviteToProject).toHaveBeenCalledWith(
        'proj-1',
        'Test Project',
        'a@b.com',
        'editor',
      );
      expect(result).toMatchObject({ success: true });
    });
  });

  // ==========================================
  // collaboration:remove-project-member
  // ==========================================

  describe('collaboration:remove-project-member', () => {
    it('returns error for invalid project ID', async () => {
      const handler = getHandler('collaboration:remove-project-member');
      const result = await handler(fakeEvent, '', 'user-uuid');
      expect(result).toMatchObject({ success: false, error: 'Invalid project ID' });
    });

    it('returns error for invalid user ID', async () => {
      const handler = getHandler('collaboration:remove-project-member');
      const result = await handler(fakeEvent, 'proj-1', '');
      expect(result).toMatchObject({ success: false, error: 'Invalid user ID' });
    });

    it('delegates to collaborationService.removeProjectMember', async () => {
      mockRemoveProjectMember.mockResolvedValue({ success: true });
      const handler = getHandler('collaboration:remove-project-member');

      const result = await handler(fakeEvent, 'proj-1', 'user-uuid');

      expect(mockRemoveProjectMember).toHaveBeenCalledWith('proj-1', 'user-uuid');
      expect(result).toMatchObject({ success: true });
    });
  });

  // ==========================================
  // collaboration:get-project-members
  // ==========================================

  describe('collaboration:get-project-members', () => {
    it('returns empty array for invalid project ID', async () => {
      const handler = getHandler('collaboration:get-project-members');
      const result = await handler(fakeEvent, '');
      expect(result).toEqual([]);
    });

    it('delegates to collaborationService.getProjectMembers', async () => {
      const members = [{ id: 'm1' }];
      mockGetProjectMembers.mockResolvedValue(members);
      const handler = getHandler('collaboration:get-project-members');

      const result = await handler(fakeEvent, 'proj-1');

      expect(mockGetProjectMembers).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(members);
    });
  });

  // ==========================================
  // collaboration:accept-project-invitation
  // ==========================================

  describe('collaboration:accept-project-invitation', () => {
    it('returns error for invalid project ID', async () => {
      const handler = getHandler('collaboration:accept-project-invitation');
      const result = await handler(fakeEvent, '');
      expect(result).toMatchObject({ success: false });
    });

    it('delegates to collaborationService.acceptProjectInvitation', async () => {
      mockAcceptProjectInvitation.mockResolvedValue({ success: true });
      const handler = getHandler('collaboration:accept-project-invitation');

      const result = await handler(fakeEvent, 'proj-1');

      expect(mockAcceptProjectInvitation).toHaveBeenCalledWith('proj-1');
      expect(result).toMatchObject({ success: true });
    });
  });

  // ==========================================
  // collaboration:check-pending-project-invitations
  // ==========================================

  describe('collaboration:check-pending-project-invitations', () => {
    it('delegates to collaborationService.checkPendingProjectInvitations', async () => {
      const invites = [{ id: 'i1' }];
      mockCheckPendingProjectInvitations.mockResolvedValue(invites);
      const handler = getHandler('collaboration:check-pending-project-invitations');

      const result = await handler(fakeEvent);

      expect(mockCheckPendingProjectInvitations).toHaveBeenCalled();
      expect(result).toEqual(invites);
    });
  });

  // ==========================================
  // collaboration:decline-project-invitation
  // ==========================================

  describe('collaboration:decline-project-invitation', () => {
    it('returns error for invalid project ID', async () => {
      const handler = getHandler('collaboration:decline-project-invitation');
      const result = await handler(fakeEvent, '');
      expect(result).toMatchObject({ success: false, error: 'Invalid project ID' });
    });

    it('delegates to collaborationService.declineProjectInvitation', async () => {
      mockDeclineProjectInvitation.mockResolvedValue({ success: true });
      const handler = getHandler('collaboration:decline-project-invitation');

      const result = await handler(fakeEvent, 'proj-1');

      expect(mockDeclineProjectInvitation).toHaveBeenCalledWith('proj-1');
      expect(result).toMatchObject({ success: true });
    });
  });

  // ==========================================
  // collaboration:invite-to-shop-order
  // ==========================================

  describe('collaboration:invite-to-shop-order', () => {
    it('returns error for invalid shop order ID', async () => {
      const handler = getHandler('collaboration:invite-to-shop-order');
      const result = await handler(fakeEvent, '', 'a@b.com', 'viewer');
      expect(result).toMatchObject({ success: false, error: 'Invalid shop order ID' });
    });

    it('returns error for invalid email', async () => {
      const handler = getHandler('collaboration:invite-to-shop-order');
      const result = await handler(fakeEvent, 'order-1', 'bad-email', 'viewer');
      expect(result).toMatchObject({ success: false, error: 'Invalid email address' });
    });

    it('delegates to collaborationService.inviteToShopOrder', async () => {
      mockInviteToShopOrder.mockResolvedValue({ success: true });
      const handler = getHandler('collaboration:invite-to-shop-order');

      const result = await handler(fakeEvent, 'order-1', 'a@b.com', 'viewer');

      expect(mockInviteToShopOrder).toHaveBeenCalledWith('order-1', 'a@b.com', 'viewer');
      expect(result).toMatchObject({ success: true });
    });
  });

  // ==========================================
  // collaboration:remove-shop-order-member
  // ==========================================

  describe('collaboration:remove-shop-order-member', () => {
    it('returns error for invalid shop order ID', async () => {
      const handler = getHandler('collaboration:remove-shop-order-member');
      const result = await handler(fakeEvent, '', 'user-uuid');
      expect(result).toMatchObject({ success: false, error: 'Invalid shop order ID' });
    });

    it('returns error for invalid user ID', async () => {
      const handler = getHandler('collaboration:remove-shop-order-member');
      const result = await handler(fakeEvent, 'order-1', '');
      expect(result).toMatchObject({ success: false, error: 'Invalid user ID' });
    });

    it('delegates to collaborationService.removeShopOrderMember', async () => {
      mockRemoveShopOrderMember.mockResolvedValue({ success: true });
      const handler = getHandler('collaboration:remove-shop-order-member');

      const result = await handler(fakeEvent, 'order-1', 'user-uuid');

      expect(mockRemoveShopOrderMember).toHaveBeenCalledWith('order-1', 'user-uuid');
      expect(result).toMatchObject({ success: true });
    });
  });

  // ==========================================
  // collaboration:get-shop-order-members
  // ==========================================

  describe('collaboration:get-shop-order-members', () => {
    it('returns empty array for invalid shop order ID', async () => {
      const handler = getHandler('collaboration:get-shop-order-members');
      const result = await handler(fakeEvent, '');
      expect(result).toEqual([]);
    });

    it('delegates to collaborationService.getShopOrderMembers', async () => {
      const members = [{ id: 'm2' }];
      mockGetShopOrderMembers.mockResolvedValue(members);
      const handler = getHandler('collaboration:get-shop-order-members');

      const result = await handler(fakeEvent, 'order-1');

      expect(mockGetShopOrderMembers).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(members);
    });
  });

  // ==========================================
  // collaboration:accept-shop-order-invitation
  // ==========================================

  describe('collaboration:accept-shop-order-invitation', () => {
    it('returns error for invalid shop order ID', async () => {
      const handler = getHandler('collaboration:accept-shop-order-invitation');
      const result = await handler(fakeEvent, '');
      expect(result).toMatchObject({ success: false });
    });

    it('delegates to collaborationService.acceptShopOrderInvitation', async () => {
      mockAcceptShopOrderInvitation.mockResolvedValue({ success: true });
      const handler = getHandler('collaboration:accept-shop-order-invitation');

      const result = await handler(fakeEvent, 'order-1');

      expect(mockAcceptShopOrderInvitation).toHaveBeenCalledWith('order-1');
      expect(result).toMatchObject({ success: true });
    });
  });

  // ==========================================
  // collaboration:cancel-project-invitation
  // ==========================================

  describe('collaboration:cancel-project-invitation', () => {
    it('returns error for invalid member ID', async () => {
      const handler = getHandler('collaboration:cancel-project-invitation');
      const result = await handler(fakeEvent, '');
      expect(result).toMatchObject({ success: false, error: 'Invalid member ID' });
    });

    it('delegates to collaborationService.cancelProjectInvitation', async () => {
      mockCancelProjectInvitation.mockResolvedValue({ success: true });
      const handler = getHandler('collaboration:cancel-project-invitation');
      const memberId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      const result = await handler(fakeEvent, memberId);

      expect(mockCancelProjectInvitation).toHaveBeenCalledWith(memberId);
      expect(result).toMatchObject({ success: true });
    });

    it('returns error for non-UUID member ID', async () => {
      const handler = getHandler('collaboration:cancel-project-invitation');
      const result = await handler(fakeEvent, 'not-a-uuid');
      expect(result).toMatchObject({ success: false, error: 'Invalid member ID' });
    });
  });

  // ==========================================
  // collaboration:decline-shop-order-invitation
  // ==========================================

  describe('collaboration:decline-shop-order-invitation', () => {
    it('returns error for invalid shop order ID', async () => {
      const handler = getHandler('collaboration:decline-shop-order-invitation');
      const result = await handler(fakeEvent, '');
      expect(result).toMatchObject({ success: false, error: 'Invalid shop order ID' });
    });

    it('delegates to collaborationService.declineShopOrderInvitation', async () => {
      mockDeclineShopOrderInvitation.mockResolvedValue({ success: true });
      const handler = getHandler('collaboration:decline-shop-order-invitation');

      const result = await handler(fakeEvent, 'order-1');

      expect(mockDeclineShopOrderInvitation).toHaveBeenCalledWith('order-1');
      expect(result).toMatchObject({ success: true });
    });
  });

  // ==========================================
  // collaboration:cancel-shop-order-invitation
  // ==========================================

  describe('collaboration:cancel-shop-order-invitation', () => {
    it('returns error for invalid member ID', async () => {
      const handler = getHandler('collaboration:cancel-shop-order-invitation');
      const result = await handler(fakeEvent, '');
      expect(result).toMatchObject({ success: false, error: 'Invalid member ID' });
    });

    it('delegates to collaborationService.cancelShopOrderInvitation', async () => {
      mockCancelShopOrderInvitation.mockResolvedValue({ success: true });
      const handler = getHandler('collaboration:cancel-shop-order-invitation');
      const memberId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      const result = await handler(fakeEvent, memberId);

      expect(mockCancelShopOrderInvitation).toHaveBeenCalledWith(memberId);
      expect(result).toMatchObject({ success: true });
    });

    it('returns error for non-UUID member ID', async () => {
      const handler = getHandler('collaboration:cancel-shop-order-invitation');
      const result = await handler(fakeEvent, 'not-a-uuid');
      expect(result).toMatchObject({ success: false, error: 'Invalid member ID' });
    });
  });

  // ==========================================
  // collaboration:join-presence
  // ==========================================

  describe('collaboration:join-presence', () => {
    it('returns error for invalid project ID', async () => {
      const handler = getHandler('collaboration:join-presence');
      const result = await handler(fakeEvent, '');
      expect(result).toMatchObject({ success: false });
    });

    it('calls presenceService.joinProjectPresence and returns success', async () => {
      const handler = getHandler('collaboration:join-presence');
      const result = await handler(fakeEvent, 'proj-1', 'fixtures');

      expect(mockJoinProjectPresence).toHaveBeenCalledWith('proj-1', 'fixtures');
      expect(result).toMatchObject({ success: true });
    });

    it('returns error if joinProjectPresence throws', async () => {
      mockJoinProjectPresence.mockImplementation(() => {
        throw new Error('Channel error');
      });
      const handler = getHandler('collaboration:join-presence');

      const result = await handler(fakeEvent, 'proj-1');

      expect(result).toMatchObject({ success: false });
    });
  });

  // ==========================================
  // collaboration:leave-presence
  // ==========================================

  describe('collaboration:leave-presence', () => {
    it('returns error for invalid project ID', async () => {
      const handler = getHandler('collaboration:leave-presence');
      const result = await handler(fakeEvent, '');
      expect(result).toMatchObject({ success: false });
    });

    it('calls presenceService.leaveProjectPresence and returns success', async () => {
      const handler = getHandler('collaboration:leave-presence');
      const result = await handler(fakeEvent, 'proj-1');

      expect(mockLeaveProjectPresence).toHaveBeenCalledWith('proj-1');
      expect(result).toMatchObject({ success: true });
    });
  });

  // ==========================================
  // collaboration:get-presence
  // ==========================================

  describe('collaboration:get-presence', () => {
    it('returns empty array for invalid project ID', async () => {
      const handler = getHandler('collaboration:get-presence');
      const result = await handler(fakeEvent, '');
      expect(result).toEqual([]);
    });

    it('delegates to presenceService.getPresenceMembers', async () => {
      const members = [{ userId: 'u1' }];
      mockGetPresenceMembers.mockReturnValue(members);
      const handler = getHandler('collaboration:get-presence');

      const result = await handler(fakeEvent, 'proj-1');

      expect(mockGetPresenceMembers).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(members);
    });
  });

  // ==========================================
  // collaboration:subscribe-presence
  // ==========================================

  describe('collaboration:subscribe-presence', () => {
    const makeMockWindow = () => ({
      isDestroyed: vi.fn().mockReturnValue(false),
      webContents: { send: vi.fn() },
      once: vi.fn(),
    });

    it('returns error for invalid project ID', async () => {
      const handler = getHandler('collaboration:subscribe-presence');
      const result = await handler(fakeEvent, '');
      expect(result).toMatchObject({ success: false, error: 'Invalid project ID' });
    });

    it('returns error if window not found', async () => {
      mockFromWebContents.mockReturnValue(null);
      const handler = getHandler('collaboration:subscribe-presence');
      const result = await handler(fakeEvent, 'proj-1');
      expect(result).toMatchObject({ success: false, error: 'Window not found' });
    });

    it('registers a presence subscription and returns success', async () => {
      mockFromWebContents.mockReturnValue(makeMockWindow());
      mockOnPresenceChange.mockReturnValue(vi.fn());
      const handler = getHandler('collaboration:subscribe-presence');

      const result = await handler(fakeEvent, 'proj-1');

      expect(mockOnPresenceChange).toHaveBeenCalledWith('proj-1', expect.any(Function));
      expect(result).toMatchObject({ success: true });
    });

    it('replaces existing subscription when called again for same project+window', async () => {
      const firstUnsub = vi.fn();
      mockFromWebContents.mockReturnValue(makeMockWindow());
      mockOnPresenceChange.mockReturnValueOnce(firstUnsub).mockReturnValue(vi.fn());
      const handler = getHandler('collaboration:subscribe-presence');

      await handler(fakeEvent, 'proj-1');
      await handler(fakeEvent, 'proj-1');

      expect(firstUnsub).toHaveBeenCalled();
    });

    it('registers window close listener only once per window across multiple subscriptions', async () => {
      const mockWin = makeMockWindow();
      mockFromWebContents.mockReturnValue(mockWin);
      mockOnPresenceChange.mockReturnValue(vi.fn());
      const handler = getHandler('collaboration:subscribe-presence');

      await handler(fakeEvent, 'proj-1');
      await handler(fakeEvent, 'proj-2');

      expect(mockWin.once).toHaveBeenCalledTimes(1);
      expect(mockWin.once).toHaveBeenCalledWith('closed', expect.any(Function));
    });

    it('invokes all unsubscribe functions when the window closes', async () => {
      const unsub1 = vi.fn();
      const unsub2 = vi.fn();
      const mockWin = makeMockWindow();
      mockFromWebContents.mockReturnValue(mockWin);
      mockOnPresenceChange.mockReturnValueOnce(unsub1).mockReturnValueOnce(unsub2);
      const handler = getHandler('collaboration:subscribe-presence');

      await handler(fakeEvent, 'proj-1');
      await handler(fakeEvent, 'proj-2');

      // Capture and invoke the 'closed' listener
      const closedListener = mockWin.once.mock.calls[0][1] as () => void;
      closedListener();

      expect(unsub1).toHaveBeenCalled();
      expect(unsub2).toHaveBeenCalled();
    });
  });

  // ==========================================
  // collaboration:unsubscribe-presence
  // ==========================================

  describe('collaboration:unsubscribe-presence', () => {
    it('calls the stored unsubscribe function and returns success', async () => {
      const unsub = vi.fn();
      const mockWin = {
        isDestroyed: vi.fn(),
        webContents: { send: vi.fn() },
        once: vi.fn(),
      };
      mockFromWebContents.mockReturnValue(mockWin);
      mockOnPresenceChange.mockReturnValue(unsub);

      // Subscribe first so there is something to unsubscribe
      const subHandler = getHandler('collaboration:subscribe-presence');
      await subHandler(fakeEvent, 'proj-1');

      const unsubHandler = getHandler('collaboration:unsubscribe-presence');
      const result = await unsubHandler(fakeEvent, 'proj-1');

      expect(unsub).toHaveBeenCalled();
      expect(result).toMatchObject({ success: true });
    });

    it('returns success even when no subscription exists for the project', async () => {
      const handler = getHandler('collaboration:unsubscribe-presence');
      const result = await handler(fakeEvent, 'no-such-project');
      expect(result).toMatchObject({ success: true });
    });
  });
});
