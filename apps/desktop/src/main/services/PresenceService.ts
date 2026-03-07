/**
 * Presence Service
 *
 * Manages real-time presence for shared projects via Supabase Realtime.
 * Each collaborator tracks their active view and join time. Presence is
 * ephemeral — it is NOT synced through PowerSync and resets on sign-out
 * or app close.
 *
 * Usage:
 *   presenceService.joinProjectPresence(projectId);
 *   presenceService.onPresenceChange(projectId, (members) => { ... });
 *   presenceService.leaveProjectPresence(projectId);
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseConnector } from './sync/SupabaseConnector';
import { logger } from '../utils/logger';
import type { PresenceMember } from '../../shared/types/collaboration.types';

export type { PresenceMember };

type PresenceChangeCallback = (members: PresenceMember[]) => void;

export class PresenceService {
  /** Active Realtime channels keyed by projectId */
  private channels = new Map<string, RealtimeChannel>();
  /** Registered callbacks keyed by projectId */
  private callbacks = new Map<string, PresenceChangeCallback[]>();

  /**
   * Join the presence channel for a project.
   * Tracks the current user's session and subscribes to other members.
   */
  joinProjectPresence(projectId: string, activeView = 'project'): void {
    const connector = getSupabaseConnector();
    if (!connector.isAuthenticated()) return;

    const userId = connector.getUserId();
    if (!userId) return; // guard: isAuthenticated() should guarantee this, but be explicit
    // getSession() is a public method on SupabaseConnector (SupabaseConnector.ts:152)
    const session = connector.getSession();
    const email = session?.user?.email ?? '';
    const displayName = email.split('@')[0] ?? email;

    if (this.channels.has(projectId)) {
      // Already subscribed — just update track state
      this.channels
        .get(projectId)!
        .track({ userId, email, displayName, activeView, joinedAt: Date.now() });
      return;
    }

    const supabase = connector.getSupabaseClient();
    const channelName = `presence:project:${projectId}`;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        this.fireCallbacks(projectId, channel);
      })
      .on('presence', { event: 'join' }, () => {
        this.fireCallbacks(projectId, channel);
      })
      .on('presence', { event: 'leave' }, () => {
        this.fireCallbacks(projectId, channel);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ userId, email, displayName, activeView, joinedAt: Date.now() });
          logger.info(`[PresenceService] Joined presence channel: ${channelName}`);
        }
      });

    this.channels.set(projectId, channel);
  }

  /**
   * Leave the presence channel for a project and clean up subscriptions.
   */
  leaveProjectPresence(projectId: string): void {
    const channel = this.channels.get(projectId);
    if (!channel) return;

    channel.unsubscribe().catch((err: unknown) => {
      logger.warn('[PresenceService] Error unsubscribing from presence channel', {
        error: err instanceof Error ? err.message : String(err),
      });
    });

    this.channels.delete(projectId);
    this.callbacks.delete(projectId);
    logger.info(`[PresenceService] Left presence channel for project: ${projectId}`);
  }

  /**
   * Register a callback to be notified when presence changes for a project.
   * Returns an unsubscribe function.
   */
  onPresenceChange(projectId: string, callback: PresenceChangeCallback): () => void {
    const existing = this.callbacks.get(projectId) ?? [];
    this.callbacks.set(projectId, [...existing, callback]);

    return () => {
      const cbs = this.callbacks.get(projectId) ?? [];
      this.callbacks.set(
        projectId,
        cbs.filter((cb) => cb !== callback),
      );
    };
  }

  /**
   * Get current presence members for a project (snapshot).
   */
  getPresenceMembers(projectId: string): PresenceMember[] {
    const channel = this.channels.get(projectId);
    if (!channel) return [];
    return this.extractMembers(channel);
  }

  /**
   * Sign-out cleanup — leave all active presence channels.
   */
  cleanup(): void {
    // Snapshot keys before iterating — leaveProjectPresence deletes from the Map
    for (const projectId of [...this.channels.keys()]) {
      this.leaveProjectPresence(projectId);
    }
  }

  // ============================================
  // Private helpers
  // ============================================

  private extractMembers(channel: RealtimeChannel): PresenceMember[] {
    const state = channel.presenceState<PresenceMember>();
    return Object.values(state)
      .flat()
      .map((entry) => entry as PresenceMember);
  }

  private fireCallbacks(projectId: string, channel: RealtimeChannel): void {
    const members = this.extractMembers(channel);
    const cbs = this.callbacks.get(projectId) ?? [];
    for (const cb of cbs) {
      cb(members);
    }
  }
}

// Singleton instance
export const presenceService = new PresenceService();
