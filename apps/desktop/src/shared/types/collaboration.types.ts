/**
 * Collaboration Type Definitions
 *
 * Shared types for project/shop-order membership and presence.
 * Used by the main process (CollaborationService, PresenceService),
 * the preload bridge, and renderer components.
 */

export type MemberRole = 'owner' | 'editor' | 'viewer';
export type MemberStatus = 'pending' | 'accepted' | 'declined';

export interface ProjectMember {
  id: string;
  project_id: string;
  project_name?: string;
  user_id: string | null;
  email: string;
  role: MemberRole;
  invited_by: string;
  invited_by_email?: string;
  status: MemberStatus;
  invited_at: number;
  accepted_at: number | null;
}

export interface ShopOrderMember {
  id: string;
  shop_order_id: string;
  shop_order_name?: string;
  user_id: string | null;
  email: string;
  role: MemberRole;
  invited_by: string;
  invited_by_email?: string;
  status: MemberStatus;
  invited_at: number;
  accepted_at: number | null;
}

export interface CollaborationResult {
  success: boolean;
  error?: string;
  memberId?: string;
}

export interface PresenceMember {
  userId: string;
  email: string;
  displayName: string;
  activeView: string;
  joinedAt: number;
}
