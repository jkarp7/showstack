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
  mockInviteToProject,
  mockRemoveProjectMember,
  mockGetProjectMembers,
  mockAcceptProjectInvitation,
  mockCheckPendingProjectInvitations,
  mockDeclineProjectInvitation,
  mockInviteToShopOrder,
  mockRemoveShopOrderMember,
  mockGetShopOrderMembers,
  mockAcceptShopOrderInvitation,
  mockCheckPendingShopOrderInvitations,
  mockDeclineShopOrderInvitation,
  mockJoinProjectPresence,
  mockLeaveProjectPresence,
  mockGetPresenceMembers,
  mockOnPresenceChange,
} = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockInviteToProject: vi.fn(),
  mockRemoveProjectMember: vi.fn(),
  mockGetProjectMembers: vi.fn(),
  mockAcceptProjectInvitation: vi.fn(),
  mockCheckPendingProjectInvitations: vi.fn(),
  mockDeclineProjectInvitation: vi.fn(),
  mockInviteToShopOrder: vi.fn(),
  mockRemoveShopOrderMember: vi.fn(),
  mockGetShopOrderMembers: vi.fn(),
  mockAcceptShopOrderInvitation: vi.fn(),
  mockCheckPendingShopOrderInvitations: vi.fn(),
  mockDeclineShopOrderInvitation: vi.fn(),
  mockJoinProjectPresence: vi.fn(),
  mockLeaveProjectPresence: vi.fn(),
  mockGetPresenceMembers: vi.fn(),
  mockOnPresenceChange: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: { handle: mockHandle },
  BrowserWindow: { fromWebContents: vi.fn() },
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
    inviteToShopOrder: mockInviteToShopOrder,
    removeShopOrderMember: mockRemoveShopOrderMember,
    getShopOrderMembers: mockGetShopOrderMembers,
    acceptShopOrderInvitation: mockAcceptShopOrderInvitation,
    checkPendingShopOrderInvitations: mockCheckPendingShopOrderInvitations,
    declineShopOrderInvitation: mockDeclineShopOrderInvitation,
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

import { registerCollaborationHandlers } from '../collaboration';

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
});
