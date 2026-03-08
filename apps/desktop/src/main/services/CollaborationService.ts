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
 *
 * Private helpers eliminate the boilerplate repeated across the project/shop-order
 * method pairs:
 *   _callRpc              — auth guard + RPC call returning CollaborationResult
 *   _callRpcGated         — canCollaborate gate + delegates to _callRpc
 *   _queryLocal<T>        — PowerSync getAll() with error handling
 *   _checkPending<T>      — auth guard + RPC returning an array (pending invitations)
 *   _backfillToPowerSync  — pre-invite ownership backfill (project or shop order)
 */

import { getSupabaseConnector } from './sync/SupabaseConnector';
import { getPowerSyncService } from './sync';
import { licenseService } from './LicenseService';
import { logger } from '../utils/logger';
import { getProjectById } from '../database/queries/projects';
import { getShopOrderProjectById } from '../database/queries/shop-order';
import { syncProjectToPowerSync, syncShopOrderToPowerSync } from './sync/projectSync';
import type {
  MemberRole,
  InviteRole,
  MemberStatus,
  ProjectMember,
  ShopOrderMember,
  CollaborationResult,
} from '../../shared/types/collaboration.types';

export type {
  MemberRole,
  InviteRole,
  MemberStatus,
  ProjectMember,
  ShopOrderMember,
  CollaborationResult,
};

export class CollaborationService {
  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Call a Supabase RPC that returns JSONB `{success, error?, member_id?}`.
   * Handles the auth check, try/catch, and response parsing shared by every
   * mutating collaboration method.
   */
  private async _callRpc(
    rpcName: string,
    params: Record<string, unknown>,
    fallbackError = 'Operation failed',
  ): Promise<CollaborationResult> {
    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) {
      return { success: false, error: 'You must be signed in.' };
    }
    try {
      const { data, error } = await connector.getSupabaseClient().rpc(rpcName, params);
      if (error) {
        logger.warn(`[CollaborationService] ${rpcName} RPC error`, { error: error.message });
        return { success: false, error: error.message };
      }
      const result = data as { success: boolean; error?: string; member_id?: string };
      if (!result?.success) {
        return { success: false, error: result?.error ?? fallbackError };
      }
      return { success: true, memberId: result.member_id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`[CollaborationService] ${rpcName} failed`, { error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Like `_callRpc` but also enforces the `canCollaborate` license gate.
   * Used by invite operations that require a Professional/Institutional tier.
   */
  private async _callRpcGated(
    rpcName: string,
    params: Record<string, unknown>,
    fallbackError = 'Operation failed',
  ): Promise<CollaborationResult> {
    const licenseStatus = licenseService.getLicenseStatus();
    if (!licenseStatus.canCollaborate) {
      return {
        success: false,
        error: 'Collaboration requires a Professional or Institutional license with active sync.',
      };
    }
    return this._callRpc(rpcName, params, fallbackError);
  }

  /**
   * Run a SELECT query against the local PowerSync database.
   * Returns an empty array if the database is not initialized or if the query throws.
   */
  private async _queryLocal<T>(sql: string, params: unknown[]): Promise<T[]> {
    try {
      const db = getPowerSyncService().getDatabase();
      if (!db) return [];
      return await db.getAll<T>(sql, params);
    } catch (err) {
      logger.error('[CollaborationService] local query failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  /**
   * Call a Supabase RPC that returns an array of pending invitations.
   * Returns an empty array when the user is unauthenticated or the call fails.
   * Pending invitations are never synced to the local PowerSync database
   * (sync rules only cover accepted members), so we query Supabase directly.
   */
  private async _checkPending<T>(rpcName: string): Promise<T[]> {
    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) return [];
    try {
      const { data, error } = await connector.getSupabaseClient().rpc(rpcName);
      if (error) {
        logger.warn(`[CollaborationService] ${rpcName} RPC error`, { error: error.message });
        return [];
      }
      return (data as T[]) ?? [];
    } catch (err) {
      logger.error(`[CollaborationService] ${rpcName} failed`, {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  /** Sync a local entity row to PowerSync before an invite RPC, establishing
   *  ownership in Supabase ahead of the RPC. Silently skips if unauthenticated
   *  or the entity is not found locally. Errors are logged as warnings — the
   *  RPC proceeds regardless. */
  private async _backfillToPowerSync<T extends { id: string }>(
    entityId: string,
    getEntityFn: (id: string) => T | null,
    syncFn: (entity: T, userId: string) => Promise<void>,
    warnMessage: string,
  ): Promise<void> {
    const conn = getSupabaseConnector();
    const userId = conn.getUserId();
    if (!userId) return;
    const entity = getEntityFn(entityId);
    if (!entity) return;
    await syncFn(entity, userId).catch((err) =>
      logger.warn(warnMessage, { error: err instanceof Error ? err.message : String(err) }),
    );
  }

  // ============================================
  // PROJECT COLLABORATION
  // ============================================

  /**
   * Invite a user to collaborate on a project.
   * Requires professional or institutional license with active sync.
   */
  async inviteToProject(
    projectId: string,
    projectName: string,
    email: string,
    role: InviteRole,
  ): Promise<CollaborationResult> {
    // Backfill: write the full project row to PowerSync (→ Supabase) before
    // the invite RPC runs. This handles projects that pre-date the write-path
    // feature and ensures ownership is established atomically. The stub-upsert
    // inside `invite_to_project` remains as a final safety net.
    await this._backfillToPowerSync(
      projectId,
      getProjectById,
      syncProjectToPowerSync,
      '[CollaborationService] project backfill failed; stub upsert in RPC is safety net',
    );

    return this._callRpcGated(
      'invite_to_project',
      { p_project_id: projectId, p_project_name: projectName, p_email: email, p_role: role },
      'Invite failed',
    );
  }

  /**
   * Remove a member from a project. Only the project owner can call this.
   *
   * No `canCollaborate` check: owners can always manage their own projects
   * regardless of their current license tier. The Supabase RPC enforces
   * ownership server-side.
   */
  async removeProjectMember(projectId: string, userId: string): Promise<CollaborationResult> {
    return this._callRpc(
      'remove_project_member',
      { p_project_id: projectId, p_user_id: userId },
      'Remove failed',
    );
  }

  /**
   * Get all members for a project from the local PowerSync database.
   * Returns an empty array if sync is not initialized.
   */
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return this._queryLocal<ProjectMember>(
      'SELECT id, project_id, user_id, email, role, invited_by, status, invited_at, accepted_at FROM project_members WHERE project_id = ? ORDER BY invited_at ASC',
      [projectId],
    );
  }

  /** Accept a pending project invitation. Called after the user clicks an invite link. */
  async acceptProjectInvitation(projectId: string): Promise<CollaborationResult> {
    return this._callRpc('accept_project_invitation', { p_project_id: projectId }, 'Accept failed');
  }

  /** Decline a pending project invitation. */
  async declineProjectInvitation(projectId: string): Promise<CollaborationResult> {
    return this._callRpc(
      'decline_project_invitation',
      { p_project_id: projectId },
      'Decline failed',
    );
  }

  /**
   * Cancel a pending project invitation (owner cancelling an invite they sent).
   * Uses the project_members row ID so it works before the invitee accepts
   * (when user_id is still null on the pending row).
   *
   * No `canCollaborate` check: owners can rescind invitations they've already
   * sent regardless of their current license tier.
   */
  async cancelProjectInvitation(memberId: string): Promise<CollaborationResult> {
    return this._callRpc('cancel_project_invitation', { p_member_id: memberId }, 'Cancel failed');
  }

  /** Check for pending project invitations for the current user's email. */
  async checkPendingProjectInvitations(): Promise<ProjectMember[]> {
    return this._checkPending<ProjectMember>('get_pending_project_invitations');
  }

  // ============================================
  // SHOP ORDER COLLABORATION
  // ============================================

  /**
   * Invite a user to collaborate on a shop order.
   * Requires professional or institutional license with active sync.
   *
   * A backfill writes the full shop order row to PowerSync (→ Supabase) before
   * the invite RPC runs, handling shop orders created before the write-path feature
   * was introduced and preventing the TOCTOU ownership race (issue #86).
   */
  async inviteToShopOrder(
    shopOrderId: string,
    email: string,
    role: InviteRole,
  ): Promise<CollaborationResult> {
    // Backfill: write the full shop order row to PowerSync (→ Supabase) before
    // the invite RPC runs. This ensures ownership is established before the invite,
    // and the RPC's server-side lookup will find the row.
    await this._backfillToPowerSync(
      shopOrderId,
      getShopOrderProjectById,
      syncShopOrderToPowerSync,
      '[CollaborationService] shop order backfill failed; RPC will proceed without it',
    );

    return this._callRpcGated(
      'invite_to_shop_order',
      { p_shop_order_id: shopOrderId, p_email: email, p_role: role },
      'Invite failed',
    );
  }

  /**
   * Remove a member from a shop order. Only the shop order owner can call this.
   *
   * No `canCollaborate` check: owners can manage their own shop orders regardless
   * of license tier. The RPC enforces ownership server-side.
   */
  async removeShopOrderMember(shopOrderId: string, userId: string): Promise<CollaborationResult> {
    return this._callRpc(
      'remove_shop_order_member',
      { p_shop_order_id: shopOrderId, p_user_id: userId },
      'Remove failed',
    );
  }

  /**
   * Get all members for a shop order from the local PowerSync database.
   */
  async getShopOrderMembers(shopOrderId: string): Promise<ShopOrderMember[]> {
    return this._queryLocal<ShopOrderMember>(
      'SELECT id, shop_order_id, user_id, email, role, invited_by, status, invited_at, accepted_at FROM shop_order_members WHERE shop_order_id = ? ORDER BY invited_at ASC',
      [shopOrderId],
    );
  }

  /**
   * Cancel a pending shop order invitation (owner cancelling an invite they sent).
   *
   * No `canCollaborate` check: owners can rescind invitations regardless of tier.
   */
  async cancelShopOrderInvitation(memberId: string): Promise<CollaborationResult> {
    return this._callRpc(
      'cancel_shop_order_invitation',
      { p_member_id: memberId },
      'Cancel failed',
    );
  }

  /** Accept a pending shop order invitation. */
  async acceptShopOrderInvitation(shopOrderId: string): Promise<CollaborationResult> {
    return this._callRpc(
      'accept_shop_order_invitation',
      { p_shop_order_id: shopOrderId },
      'Accept failed',
    );
  }

  /** Decline a pending shop order invitation. */
  async declineShopOrderInvitation(shopOrderId: string): Promise<CollaborationResult> {
    return this._callRpc(
      'decline_shop_order_invitation',
      { p_shop_order_id: shopOrderId },
      'Decline failed',
    );
  }

  /** Check for pending shop order invitations for the current user's email. */
  async checkPendingShopOrderInvitations(): Promise<ShopOrderMember[]> {
    return this._checkPending<ShopOrderMember>('get_pending_shop_order_invitations');
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();
