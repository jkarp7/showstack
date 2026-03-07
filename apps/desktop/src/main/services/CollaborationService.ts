/**
 * Collaboration Service
 *
 * Manages project and shop-order sharing: invitations, member management,
 * and pending-invitation checks. All mutating operations go through Supabase
 * RPCs (defined in migration 007_collaboration_rpcs.sql). Read operations
 * query the local PowerSync database so they work offline.
 *
 * License gate: invite operations require canCollaborate === true
 * (professional + institutional tiers with active cloud sync).
 */

import { getSupabaseConnector } from './sync/SupabaseConnector';
import { getPowerSyncService } from './sync';
import { licenseService } from './LicenseService';
import { logger } from '../utils/logger';

export type MemberRole = 'owner' | 'editor' | 'viewer';
export type MemberStatus = 'pending' | 'accepted' | 'declined';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string | null;
  email: string;
  role: MemberRole;
  invited_by: string;
  status: MemberStatus;
  invited_at: number;
  accepted_at: number | null;
}

export interface ShopOrderMember {
  id: string;
  shop_order_id: string;
  user_id: string | null;
  email: string;
  role: MemberRole;
  invited_by: string;
  status: MemberStatus;
  invited_at: number;
  accepted_at: number | null;
}

export interface CollaborationResult {
  success: boolean;
  error?: string;
  memberId?: string;
}

export class CollaborationService {
  // ============================================
  // PROJECT COLLABORATION
  // ============================================

  /**
   * Invite a user to collaborate on a project.
   * Requires professional or institutional license with active sync.
   */
  async inviteToProject(
    projectId: string,
    email: string,
    role: MemberRole,
  ): Promise<CollaborationResult> {
    const licenseStatus = licenseService.getLicenseStatus();
    if (!licenseStatus.canCollaborate) {
      return {
        success: false,
        error: 'Collaboration requires a Professional or Institutional license with active sync.',
      };
    }

    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) {
      return { success: false, error: 'You must be signed in to invite collaborators.' };
    }

    try {
      const { data, error } = await connector
        .getSupabaseClient()
        .rpc('invite_to_project', { p_project_id: projectId, p_email: email, p_role: role });

      if (error) {
        logger.warn('[CollaborationService] invite_to_project RPC error', { error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true, memberId: (data as { member_id?: string })?.member_id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[CollaborationService] inviteToProject failed', { error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Remove a member from a project. Only the project owner can call this.
   */
  async removeProjectMember(projectId: string, userId: string): Promise<CollaborationResult> {
    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) {
      return { success: false, error: 'You must be signed in.' };
    }

    try {
      const { error } = await connector
        .getSupabaseClient()
        .rpc('remove_project_member', { p_project_id: projectId, p_user_id: userId });

      if (error) {
        logger.warn('[CollaborationService] remove_project_member RPC error', {
          error: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[CollaborationService] removeProjectMember failed', { error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Get all members for a project from the local PowerSync database.
   * Returns an empty array if sync is not initialized.
   */
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
      const db = getPowerSyncService().getDatabase();
      if (!db) return [];

      const rows = await db.getAll<ProjectMember>(
        'SELECT * FROM project_members WHERE project_id = ? ORDER BY invited_at ASC',
        [projectId],
      );
      return rows;
    } catch (err) {
      logger.error('[CollaborationService] getProjectMembers failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  /**
   * Accept a pending project invitation. Called after the user clicks an invite link.
   */
  async acceptProjectInvitation(projectId: string): Promise<CollaborationResult> {
    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) {
      return { success: false, error: 'You must be signed in to accept an invitation.' };
    }

    try {
      const { error } = await connector
        .getSupabaseClient()
        .rpc('accept_project_invitation', { p_project_id: projectId });

      if (error) {
        logger.warn('[CollaborationService] accept_project_invitation RPC error', {
          error: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[CollaborationService] acceptProjectInvitation failed', { error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Check for pending project invitations for the current user's email.
   * Queries Supabase directly via RPC — pending invitations are never synced
   * to the invitee's local PowerSync database (sync rules only cover accepted members).
   */
  async checkPendingProjectInvitations(): Promise<ProjectMember[]> {
    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) return [];

    try {
      const { data, error } = await connector
        .getSupabaseClient()
        .rpc('get_pending_project_invitations');

      if (error) {
        logger.warn('[CollaborationService] get_pending_project_invitations RPC error', {
          error: error.message,
        });
        return [];
      }

      return (data as ProjectMember[]) ?? [];
    } catch (err) {
      logger.error('[CollaborationService] checkPendingProjectInvitations failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  // ============================================
  // SHOP ORDER COLLABORATION
  // ============================================

  /**
   * Invite a user to collaborate on a shop order.
   * Requires professional or institutional license with active sync.
   */
  async inviteToShopOrder(
    shopOrderId: string,
    email: string,
    role: MemberRole,
  ): Promise<CollaborationResult> {
    const licenseStatus = licenseService.getLicenseStatus();
    if (!licenseStatus.canCollaborate) {
      return {
        success: false,
        error: 'Collaboration requires a Professional or Institutional license with active sync.',
      };
    }

    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) {
      return { success: false, error: 'You must be signed in to invite collaborators.' };
    }

    try {
      const { data, error } = await connector.getSupabaseClient().rpc('invite_to_shop_order', {
        p_shop_order_id: shopOrderId,
        p_email: email,
        p_role: role,
      });

      if (error) {
        logger.warn('[CollaborationService] invite_to_shop_order RPC error', {
          error: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true, memberId: (data as { member_id?: string })?.member_id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[CollaborationService] inviteToShopOrder failed', { error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Remove a member from a shop order. Only the shop order owner can call this.
   */
  async removeShopOrderMember(shopOrderId: string, userId: string): Promise<CollaborationResult> {
    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) {
      return { success: false, error: 'You must be signed in.' };
    }

    try {
      const { error } = await connector
        .getSupabaseClient()
        .rpc('remove_shop_order_member', { p_shop_order_id: shopOrderId, p_user_id: userId });

      if (error) {
        logger.warn('[CollaborationService] remove_shop_order_member RPC error', {
          error: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[CollaborationService] removeShopOrderMember failed', { error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Get all members for a shop order from the local PowerSync database.
   */
  async getShopOrderMembers(shopOrderId: string): Promise<ShopOrderMember[]> {
    try {
      const db = getPowerSyncService().getDatabase();
      if (!db) return [];

      const rows = await db.getAll<ShopOrderMember>(
        'SELECT * FROM shop_order_members WHERE shop_order_id = ? ORDER BY invited_at ASC',
        [shopOrderId],
      );
      return rows;
    } catch (err) {
      logger.error('[CollaborationService] getShopOrderMembers failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  /**
   * Accept a pending shop order invitation.
   */
  async acceptShopOrderInvitation(shopOrderId: string): Promise<CollaborationResult> {
    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) {
      return { success: false, error: 'You must be signed in to accept an invitation.' };
    }

    try {
      const { error } = await connector
        .getSupabaseClient()
        .rpc('accept_shop_order_invitation', { p_shop_order_id: shopOrderId });

      if (error) {
        logger.warn('[CollaborationService] accept_shop_order_invitation RPC error', {
          error: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[CollaborationService] acceptShopOrderInvitation failed', { error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Check for pending shop order invitations for the current user's email.
   * Queries Supabase directly via RPC — same reason as checkPendingProjectInvitations.
   */
  async checkPendingShopOrderInvitations(): Promise<ShopOrderMember[]> {
    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) return [];

    try {
      const { data, error } = await connector
        .getSupabaseClient()
        .rpc('get_pending_shop_order_invitations');

      if (error) {
        logger.warn('[CollaborationService] get_pending_shop_order_invitations RPC error', {
          error: error.message,
        });
        return [];
      }

      return (data as ShopOrderMember[]) ?? [];
    } catch (err) {
      logger.error('[CollaborationService] checkPendingShopOrderInvitations failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();
