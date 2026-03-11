/**
 * Tests for CollaborationService
 *
 * Covers invite/remove/getMembers/accept/checkPending for projects and shop orders.
 * Mutating operations go through Supabase RPC mocks; read operations use a mock
 * PowerSync database.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Hoisted mocks
// ============================================

const {
  mockGetLicenseStatus,
  mockIsAuthenticated,
  mockGetUserId,
  mockRpc,
  mockGetAll,
  mockGetProjectById,
  mockGetShopOrderById,
  mockSyncProject,
  mockSyncShopOrder,
} = vi.hoisted(() => ({
  mockGetLicenseStatus: vi.fn(),
  mockIsAuthenticated: vi.fn(),
  mockGetUserId: vi.fn().mockReturnValue(null),
  mockRpc: vi.fn(),
  mockGetAll: vi.fn(),
  mockGetProjectById: vi.fn().mockReturnValue(null),
  mockGetShopOrderById: vi.fn().mockReturnValue(null),
  mockSyncProject: vi.fn().mockResolvedValue(undefined),
  mockSyncShopOrder: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../LicenseService', () => ({
  licenseService: {
    getLicenseStatus: mockGetLicenseStatus,
  },
}));

vi.mock('../sync', () => ({
  getPowerSyncService: () => ({
    getDatabase: () => ({ getAll: mockGetAll }),
  }),
}));

vi.mock('../sync/SupabaseConnector', () => ({
  getSupabaseConnector: () => ({
    isAuthenticated: mockIsAuthenticated,
    getUserId: mockGetUserId,
    getSupabaseClient: () => ({ rpc: mockRpc }),
  }),
}));

vi.mock('../../database/queries/projects', () => ({
  getProjectById: mockGetProjectById,
}));

vi.mock('../../database/queries/shop-order', () => ({
  getShopOrderProjectById: mockGetShopOrderById,
}));

vi.mock('../sync/projectSync', () => ({
  syncProjectToPowerSync: mockSyncProject,
  syncShopOrderToPowerSync: mockSyncShopOrder,
}));

// Import after mocks are registered
import { CollaborationService } from '../CollaborationService';

// ============================================
// Helpers
// ============================================

function allowCollaborate() {
  mockGetLicenseStatus.mockReturnValue({ canCollaborate: true });
  mockIsAuthenticated.mockReturnValue(true);
  mockGetUserId.mockReturnValue('user-123');
}

function denyCollaborate() {
  mockGetLicenseStatus.mockReturnValue({ canCollaborate: false });
}

// ============================================
// Tests
// ============================================

describe('CollaborationService', () => {
  let service: CollaborationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CollaborationService();
    // Default: sync helpers succeed, no project/shop-order found
    mockSyncProject.mockResolvedValue(undefined);
    mockSyncShopOrder.mockResolvedValue(undefined);
    mockGetProjectById.mockReturnValue(null);
    mockGetShopOrderById.mockReturnValue(null);
  });

  // ==========================================
  // PROJECT: inviteToProject
  // ==========================================

  describe('inviteToProject', () => {
    it('returns error when canCollaborate is false', async () => {
      denyCollaborate();

      const result = await service.inviteToProject('proj-1', 'Test Project', 'a@b.com', 'editor');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Professional or Institutional');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('returns error when not authenticated', async () => {
      mockGetLicenseStatus.mockReturnValue({ canCollaborate: true });
      mockIsAuthenticated.mockReturnValue(false);

      const result = await service.inviteToProject('proj-1', 'Test Project', 'a@b.com', 'editor');

      expect(result.success).toBe(false);
      expect(result.error).toContain('signed in');
    });

    it('returns success and memberId on successful invite', async () => {
      allowCollaborate();
      mockRpc.mockResolvedValue({ data: { success: true, member_id: 'member-uuid' }, error: null });

      const result = await service.inviteToProject('proj-1', 'Test Project', 'a@b.com', 'editor');

      expect(result.success).toBe(true);
      expect(result.memberId).toBe('member-uuid');
      expect(mockRpc).toHaveBeenCalledWith('invite_to_project', {
        p_project_id: 'proj-1',
        p_project_name: 'Test Project',
        p_email: 'a@b.com',
        p_role: 'editor',
      });
    });

    it('returns error from RPC error', async () => {
      allowCollaborate();
      mockRpc.mockResolvedValue({ data: null, error: { message: 'Already invited' } });

      const result = await service.inviteToProject('proj-1', 'Test Project', 'a@b.com', 'editor');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Already invited');
    });

    it('handles thrown exceptions', async () => {
      allowCollaborate();
      mockRpc.mockRejectedValue(new Error('Network failure'));

      const result = await service.inviteToProject('proj-1', 'Test Project', 'a@b.com', 'editor');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network failure');
    });
  });

  // ==========================================
  // PROJECT: removeProjectMember
  // ==========================================

  describe('removeProjectMember', () => {
    it('returns error when not authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(false);

      const result = await service.removeProjectMember('proj-1', 'user-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('signed in');
    });

    it('returns success on successful removal', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      const result = await service.removeProjectMember('proj-1', 'user-uuid');

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('remove_project_member', {
        p_project_id: 'proj-1',
        p_user_id: 'user-uuid',
      });
    });

    it('returns RPC error', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ error: { message: 'Not owner' } });

      const result = await service.removeProjectMember('proj-1', 'user-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not owner');
    });
  });

  // ==========================================
  // PROJECT: getProjectMembers
  // ==========================================

  describe('getProjectMembers', () => {
    it('returns members from local database', async () => {
      const members = [{ id: 'm1', project_id: 'proj-1', email: 'a@b.com', role: 'editor' }];
      mockGetAll.mockResolvedValue(members);

      const result = await service.getProjectMembers('proj-1');

      expect(result).toEqual(members);
      expect(mockGetAll).toHaveBeenCalledWith(expect.stringContaining('project_members'), [
        'proj-1',
      ]);
    });

    it('returns empty array if database throws', async () => {
      mockGetAll.mockRejectedValue(new Error('DB error'));

      const result = await service.getProjectMembers('proj-1');

      expect(result).toEqual([]);
    });
  });

  // ==========================================
  // PROJECT: acceptProjectInvitation
  // ==========================================

  describe('acceptProjectInvitation', () => {
    it('returns error when not authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(false);

      const result = await service.acceptProjectInvitation('proj-1');

      expect(result.success).toBe(false);
    });

    it('returns success on accepted invitation', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      const result = await service.acceptProjectInvitation('proj-1');

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('accept_project_invitation', {
        p_project_id: 'proj-1',
      });
    });

    it('returns RPC error', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ error: { message: 'No pending invitation' } });

      const result = await service.acceptProjectInvitation('proj-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No pending invitation');
    });
  });

  // ==========================================
  // PROJECT: checkPendingProjectInvitations
  // ==========================================

  describe('checkPendingProjectInvitations', () => {
    it('returns pending invitations from RPC', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      const invites = [{ id: 'i1', project_id: 'proj-1', status: 'pending' }];
      mockRpc.mockResolvedValue({ data: invites, error: null });

      const result = await service.checkPendingProjectInvitations();

      expect(result).toEqual(invites);
      expect(mockRpc).toHaveBeenCalledWith('get_pending_project_invitations');
    });

    it('returns empty array if RPC returns error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } });

      const result = await service.checkPendingProjectInvitations();

      expect(result).toEqual([]);
    });

    it('returns empty array if RPC throws', async () => {
      mockRpc.mockRejectedValue(new Error('Network error'));

      const result = await service.checkPendingProjectInvitations();

      expect(result).toEqual([]);
    });
  });

  // ==========================================
  // PROJECT: declineProjectInvitation
  // ==========================================

  describe('declineProjectInvitation', () => {
    it('returns error when not authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(false);

      const result = await service.declineProjectInvitation('proj-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('signed in');
    });

    it('returns success on successful decline', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      const result = await service.declineProjectInvitation('proj-1');

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('decline_project_invitation', {
        p_project_id: 'proj-1',
      });
    });

    it('returns RPC error', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ error: { message: 'No pending invitation' } });

      const result = await service.declineProjectInvitation('proj-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No pending invitation');
    });
  });

  // ==========================================
  // PROJECT: cancelProjectInvitation
  // ==========================================

  describe('cancelProjectInvitation', () => {
    it('returns error when not authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(false);

      const result = await service.cancelProjectInvitation('member-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('signed in');
    });

    it('returns success on successful cancellation', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      const result = await service.cancelProjectInvitation('member-uuid');

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('cancel_project_invitation', {
        p_member_id: 'member-uuid',
      });
    });

    it('returns RPC error', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ error: { message: 'Not found' } });

      const result = await service.cancelProjectInvitation('member-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });

  // ==========================================
  // SHOP ORDER: inviteToShopOrder
  // ==========================================

  describe('inviteToShopOrder', () => {
    it('returns error when canCollaborate is false', async () => {
      denyCollaborate();

      const result = await service.inviteToShopOrder('order-1', 'a@b.com', 'viewer');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Professional or Institutional');
    });

    it('returns success on successful invite', async () => {
      allowCollaborate();
      mockRpc.mockResolvedValue({ data: { success: true, member_id: 'member-2' }, error: null });

      const result = await service.inviteToShopOrder('order-1', 'a@b.com', 'viewer');

      expect(result.success).toBe(true);
      expect(result.memberId).toBe('member-2');
      expect(mockRpc).toHaveBeenCalledWith('invite_to_shop_order', {
        p_shop_order_id: 'order-1',
        p_email: 'a@b.com',
        p_role: 'viewer',
      });
    });
  });

  // ==========================================
  // SHOP ORDER: getShopOrderMembers
  // ==========================================

  describe('getShopOrderMembers', () => {
    it('returns members from local database', async () => {
      const members = [{ id: 'm2', shop_order_id: 'order-1', email: 'a@b.com', role: 'viewer' }];
      mockGetAll.mockResolvedValue(members);

      const result = await service.getShopOrderMembers('order-1');

      expect(result).toEqual(members);
      expect(mockGetAll).toHaveBeenCalledWith(expect.stringContaining('shop_order_members'), [
        'order-1',
      ]);
    });
  });

  // ==========================================
  // SHOP ORDER: checkPendingShopOrderInvitations
  // ==========================================

  describe('checkPendingShopOrderInvitations', () => {
    it('returns pending shop order invitations from RPC', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      const invites = [{ id: 'i2', shop_order_id: 'order-1', status: 'pending' }];
      mockRpc.mockResolvedValue({ data: invites, error: null });

      const result = await service.checkPendingShopOrderInvitations();

      expect(result).toEqual(invites);
      expect(mockRpc).toHaveBeenCalledWith('get_pending_shop_order_invitations');
    });

    it('returns empty array if RPC throws', async () => {
      mockRpc.mockRejectedValue(new Error('Network error'));

      const result = await service.checkPendingShopOrderInvitations();

      expect(result).toEqual([]);
    });
  });

  // ==========================================
  // SHOP ORDER: cancelShopOrderInvitation
  // ==========================================

  describe('cancelShopOrderInvitation', () => {
    it('returns error when not authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(false);

      const result = await service.cancelShopOrderInvitation('member-uuid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('signed in');
    });

    it('returns success on successful cancellation', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      const result = await service.cancelShopOrderInvitation('member-uuid');

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('cancel_shop_order_invitation', {
        p_member_id: 'member-uuid',
      });
    });
  });

  describe('declineShopOrderInvitation', () => {
    it('returns error when not authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(false);

      const result = await service.declineShopOrderInvitation('order-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('signed in');
    });

    it('returns success on successful decline', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      const result = await service.declineShopOrderInvitation('order-1');

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('decline_shop_order_invitation', {
        p_shop_order_id: 'order-1',
      });
    });

    it('returns RPC error', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockRpc.mockResolvedValue({ error: { message: 'No pending invitation' } });

      const result = await service.declineShopOrderInvitation('order-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No pending invitation');
    });
  });

  // ==========================================
  // Backfill: syncProjectToPowerSync before invite
  // ==========================================

  describe('inviteToProject backfill', () => {
    const mockProject = {
      id: 'proj-1',
      name: 'Test Project',
      created_at: 1704067200000,
      updated_at: 1704067200000,
    };

    beforeEach(() => {
      allowCollaborate();
      mockRpc.mockResolvedValue({ data: { success: true, member_id: 'member-uuid' }, error: null });
    });

    it('calls syncProjectToPowerSync before the invite RPC when project exists', async () => {
      mockGetUserId.mockReturnValue('user-123');
      mockGetProjectById.mockReturnValue(mockProject);

      await service.inviteToProject('proj-1', 'Test Project', 'a@b.com', 'editor');

      expect(mockSyncProject).toHaveBeenCalledWith(mockProject, 'user-123');
      expect(mockRpc).toHaveBeenCalledWith('invite_to_project', expect.any(Object));
    });

    it('skips backfill when project is not found locally', async () => {
      mockGetUserId.mockReturnValue('user-123');
      mockGetProjectById.mockReturnValue(null);

      await service.inviteToProject('proj-1', 'Test Project', 'a@b.com', 'editor');

      expect(mockSyncProject).not.toHaveBeenCalled();
      expect(mockRpc).toHaveBeenCalled();
    });

    it('proceeds with invite even when backfill throws', async () => {
      mockGetUserId.mockReturnValue('user-123');
      mockGetProjectById.mockReturnValue(mockProject);
      mockSyncProject.mockRejectedValue(new Error('PowerSync unavailable'));

      const result = await service.inviteToProject('proj-1', 'Test Project', 'a@b.com', 'editor');

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalled();
    });

    it('skips backfill when userId is null', async () => {
      mockGetUserId.mockReturnValue(null);
      mockGetProjectById.mockReturnValue(mockProject);

      await service.inviteToProject('proj-1', 'Test Project', 'a@b.com', 'editor');

      expect(mockSyncProject).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // Backfill: syncShopOrderToPowerSync before invite
  // ==========================================

  describe('inviteToShopOrder backfill', () => {
    const mockShopOrder = {
      id: 'order-1',
      production_name: 'Test Order',
      disciplines: '["lighting"]',
      current_revision: 1,
      order_date: 1704067200000,
      created_at: 1704067200000,
      updated_at: 1704067200000,
    };

    beforeEach(() => {
      allowCollaborate();
      mockRpc.mockResolvedValue({ data: { success: true, member_id: 'member-uuid' }, error: null });
    });

    it('calls syncShopOrderToPowerSync before the invite RPC when shop order exists', async () => {
      mockGetUserId.mockReturnValue('user-123');
      mockGetShopOrderById.mockReturnValue(mockShopOrder);

      await service.inviteToShopOrder('order-1', 'a@b.com', 'viewer');

      expect(mockSyncShopOrder).toHaveBeenCalledWith(mockShopOrder, 'user-123');
      expect(mockRpc).toHaveBeenCalledWith('invite_to_shop_order', expect.any(Object));
    });

    it('skips backfill when shop order is not found locally', async () => {
      mockGetUserId.mockReturnValue('user-123');
      mockGetShopOrderById.mockReturnValue(null);

      await service.inviteToShopOrder('order-1', 'a@b.com', 'viewer');

      expect(mockSyncShopOrder).not.toHaveBeenCalled();
      expect(mockRpc).toHaveBeenCalled();
    });

    it('proceeds with invite even when backfill throws', async () => {
      mockGetUserId.mockReturnValue('user-123');
      mockGetShopOrderById.mockReturnValue(mockShopOrder);
      mockSyncShopOrder.mockRejectedValue(new Error('PowerSync unavailable'));

      const result = await service.inviteToShopOrder('order-1', 'a@b.com', 'viewer');

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalled();
    });
  });
});
