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

const { mockGetLicenseStatus, mockIsAuthenticated, mockRpc, mockGetAll } = vi.hoisted(() => ({
  mockGetLicenseStatus: vi.fn(),
  mockIsAuthenticated: vi.fn(),
  mockRpc: vi.fn(),
  mockGetAll: vi.fn(),
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
    getSupabaseClient: () => ({ rpc: mockRpc }),
  }),
}));

// Import after mocks are registered
import { CollaborationService } from '../CollaborationService';

// ============================================
// Helpers
// ============================================

function allowCollaborate() {
  mockGetLicenseStatus.mockReturnValue({ canCollaborate: true });
  mockIsAuthenticated.mockReturnValue(true);
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
  });

  // ==========================================
  // PROJECT: inviteToProject
  // ==========================================

  describe('inviteToProject', () => {
    it('returns error when canCollaborate is false', async () => {
      denyCollaborate();

      const result = await service.inviteToProject('proj-1', 'a@b.com', 'editor');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Professional or Institutional');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('returns error when not authenticated', async () => {
      mockGetLicenseStatus.mockReturnValue({ canCollaborate: true });
      mockIsAuthenticated.mockReturnValue(false);

      const result = await service.inviteToProject('proj-1', 'a@b.com', 'editor');

      expect(result.success).toBe(false);
      expect(result.error).toContain('signed in');
    });

    it('returns success and memberId on successful invite', async () => {
      allowCollaborate();
      mockRpc.mockResolvedValue({ data: { success: true, member_id: 'member-uuid' }, error: null });

      const result = await service.inviteToProject('proj-1', 'a@b.com', 'editor');

      expect(result.success).toBe(true);
      expect(result.memberId).toBe('member-uuid');
      expect(mockRpc).toHaveBeenCalledWith('invite_to_project', {
        p_project_id: 'proj-1',
        p_email: 'a@b.com',
        p_role: 'editor',
      });
    });

    it('returns error from RPC error', async () => {
      allowCollaborate();
      mockRpc.mockResolvedValue({ data: null, error: { message: 'Already invited' } });

      const result = await service.inviteToProject('proj-1', 'a@b.com', 'editor');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Already invited');
    });

    it('handles thrown exceptions', async () => {
      allowCollaborate();
      mockRpc.mockRejectedValue(new Error('Network failure'));

      const result = await service.inviteToProject('proj-1', 'a@b.com', 'editor');

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
      mockRpc.mockResolvedValue({ error: null });

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
      mockRpc.mockResolvedValue({ error: null });

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
    it('returns pending invitations', async () => {
      const invites = [{ id: 'i1', project_id: 'proj-1', status: 'pending' }];
      mockGetAll.mockResolvedValue(invites);

      const result = await service.checkPendingProjectInvitations();

      expect(result).toEqual(invites);
      expect(mockGetAll).toHaveBeenCalledWith(expect.stringContaining("status = 'pending'"));
    });

    it('returns empty array if database throws', async () => {
      mockGetAll.mockRejectedValue(new Error('DB error'));

      const result = await service.checkPendingProjectInvitations();

      expect(result).toEqual([]);
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
    it('returns pending shop order invitations', async () => {
      const invites = [{ id: 'i2', shop_order_id: 'order-1', status: 'pending' }];
      mockGetAll.mockResolvedValue(invites);

      const result = await service.checkPendingShopOrderInvitations();

      expect(result).toEqual(invites);
    });
  });
});
