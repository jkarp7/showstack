/**
 * Collaboration IPC Handlers
 *
 * Exposes CollaborationService and PresenceService to the renderer process.
 * Channel naming: 'collaboration:<action>'
 * Follows the pattern established in apps/desktop/src/main/ipc/sync.ts.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { collaborationService } from '../services/CollaborationService';
import { presenceService } from '../services/PresenceService';
import type { InviteRole } from '../services/CollaborationService';
import { logger } from '../utils/logger';

/** Basic email format validation */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const VALID_INVITE_ROLES: InviteRole[] = ['editor', 'viewer'];

// Module-scoped so state survives across registerCollaborationHandlers() calls
// (e.g. hot-reload in development, repeated calls in tests).
// windowId → Map<projectId, unsubscribe fn>
const presenceSubscriptions = new Map<number, Map<string, () => void>>();

/**
 * Reset module-level presence subscription state.
 *
 * @internal Test-only escape hatch. Application code must not call this.
 * Alternative: `vi.resetModules()` + re-import, but that requires restructuring
 * all hoisted mocks in the IPC test suite. This lightweight export is the
 * pragmatic trade-off; the underscore prefix signals it is not part of the
 * public API.
 */
export function _resetPresenceStateForTesting(): void {
  presenceSubscriptions.clear();
}

export function registerCollaborationHandlers(): void {
  // Remove any previously registered handlers so this function is idempotent.
  // ipcMain.handle() throws if a handler is already registered for the channel,
  // which would happen on hot-reload or if called more than once.
  const channels = [
    'collaboration:invite-to-project',
    'collaboration:remove-project-member',
    'collaboration:get-project-members',
    'collaboration:accept-project-invitation',
    'collaboration:check-pending-project-invitations',
    'collaboration:decline-project-invitation',
    'collaboration:cancel-project-invitation',
    'collaboration:invite-to-shop-order',
    'collaboration:remove-shop-order-member',
    'collaboration:get-shop-order-members',
    'collaboration:accept-shop-order-invitation',
    'collaboration:check-pending-shop-order-invitations',
    'collaboration:decline-shop-order-invitation',
    'collaboration:cancel-shop-order-invitation',
    'collaboration:join-presence',
    'collaboration:leave-presence',
    'collaboration:get-presence',
    'collaboration:subscribe-presence',
    'collaboration:unsubscribe-presence',
  ] as const;
  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }

  // ============================================
  // PROJECT MEMBERS
  // ============================================

  ipcMain.handle(
    'collaboration:invite-to-project',
    async (_, projectId: string, projectName: string, email: string, role: InviteRole) => {
      if (!projectId || typeof projectId !== 'string') {
        return { success: false, error: 'Invalid project ID' };
      }
      if (!projectName || typeof projectName !== 'string') {
        return { success: false, error: 'Invalid project name' };
      }
      if (!email || !isValidEmail(email)) {
        return { success: false, error: 'Invalid email address' };
      }
      if (!VALID_INVITE_ROLES.includes(role)) {
        return { success: false, error: 'Invalid role. Must be editor or viewer.' };
      }

      return collaborationService.inviteToProject(
        projectId,
        projectName,
        email.trim().toLowerCase(),
        role,
      );
    },
  );

  ipcMain.handle(
    'collaboration:remove-project-member',
    async (_, projectId: string, userId: string) => {
      if (!projectId || typeof projectId !== 'string') {
        return { success: false, error: 'Invalid project ID' };
      }
      if (!userId || typeof userId !== 'string') {
        return { success: false, error: 'Invalid user ID' };
      }

      return collaborationService.removeProjectMember(projectId, userId);
    },
  );

  ipcMain.handle('collaboration:get-project-members', async (_, projectId: string) => {
    if (!projectId || typeof projectId !== 'string') {
      return [];
    }

    return collaborationService.getProjectMembers(projectId);
  });

  ipcMain.handle('collaboration:accept-project-invitation', async (_, projectId: string) => {
    if (!projectId || typeof projectId !== 'string') {
      return { success: false, error: 'Invalid project ID' };
    }

    return collaborationService.acceptProjectInvitation(projectId);
  });

  ipcMain.handle('collaboration:check-pending-project-invitations', async () => {
    return collaborationService.checkPendingProjectInvitations();
  });

  ipcMain.handle('collaboration:decline-project-invitation', async (_, projectId: string) => {
    if (!projectId || typeof projectId !== 'string') {
      return { success: false, error: 'Invalid project ID' };
    }

    return collaborationService.declineProjectInvitation(projectId);
  });

  ipcMain.handle('collaboration:cancel-project-invitation', async (_, memberId: string) => {
    if (!memberId || typeof memberId !== 'string') {
      return { success: false, error: 'Invalid member ID' };
    }

    return collaborationService.cancelProjectInvitation(memberId);
  });

  // ============================================
  // SHOP ORDER MEMBERS
  // ============================================

  ipcMain.handle(
    'collaboration:invite-to-shop-order',
    async (_, shopOrderId: string, email: string, role: InviteRole) => {
      if (!shopOrderId || typeof shopOrderId !== 'string') {
        return { success: false, error: 'Invalid shop order ID' };
      }
      if (!email || !isValidEmail(email)) {
        return { success: false, error: 'Invalid email address' };
      }
      if (!VALID_INVITE_ROLES.includes(role)) {
        return { success: false, error: 'Invalid role. Must be editor or viewer.' };
      }

      return collaborationService.inviteToShopOrder(shopOrderId, email.trim().toLowerCase(), role);
    },
  );

  ipcMain.handle(
    'collaboration:remove-shop-order-member',
    async (_, shopOrderId: string, userId: string) => {
      if (!shopOrderId || typeof shopOrderId !== 'string') {
        return { success: false, error: 'Invalid shop order ID' };
      }
      if (!userId || typeof userId !== 'string') {
        return { success: false, error: 'Invalid user ID' };
      }

      return collaborationService.removeShopOrderMember(shopOrderId, userId);
    },
  );

  ipcMain.handle('collaboration:get-shop-order-members', async (_, shopOrderId: string) => {
    if (!shopOrderId || typeof shopOrderId !== 'string') {
      return [];
    }

    return collaborationService.getShopOrderMembers(shopOrderId);
  });

  ipcMain.handle('collaboration:accept-shop-order-invitation', async (_, shopOrderId: string) => {
    if (!shopOrderId || typeof shopOrderId !== 'string') {
      return { success: false, error: 'Invalid shop order ID' };
    }

    return collaborationService.acceptShopOrderInvitation(shopOrderId);
  });

  ipcMain.handle('collaboration:check-pending-shop-order-invitations', async () => {
    return collaborationService.checkPendingShopOrderInvitations();
  });

  ipcMain.handle('collaboration:decline-shop-order-invitation', async (_, shopOrderId: string) => {
    if (!shopOrderId || typeof shopOrderId !== 'string') {
      return { success: false, error: 'Invalid shop order ID' };
    }

    return collaborationService.declineShopOrderInvitation(shopOrderId);
  });

  ipcMain.handle('collaboration:cancel-shop-order-invitation', async (_, memberId: string) => {
    if (!memberId || typeof memberId !== 'string') {
      return { success: false, error: 'Invalid member ID' };
    }

    return collaborationService.cancelShopOrderInvitation(memberId);
  });

  // ============================================
  // PRESENCE
  // ============================================

  ipcMain.handle(
    'collaboration:join-presence',
    async (_, projectId: string, activeView?: string) => {
      if (!projectId || typeof projectId !== 'string') {
        return { success: false, error: 'Invalid project ID' };
      }

      try {
        presenceService.joinProjectPresence(projectId, activeView);
        return { success: true };
      } catch (err) {
        logger.warn('[Collaboration IPC] join-presence failed', {
          error: err instanceof Error ? err.message : String(err),
        });
        return { success: false, error: 'Failed to join presence channel' };
      }
    },
  );

  ipcMain.handle('collaboration:leave-presence', async (_, projectId: string) => {
    if (!projectId || typeof projectId !== 'string') {
      return { success: false, error: 'Invalid project ID' };
    }

    presenceService.leaveProjectPresence(projectId);
    return { success: true };
  });

  ipcMain.handle('collaboration:get-presence', async (_, projectId: string) => {
    if (!projectId || typeof projectId !== 'string') {
      return [];
    }

    return presenceService.getPresenceMembers(projectId);
  });

  // ============================================
  // PRESENCE SUBSCRIPTIONS (push to renderer)
  // ============================================

  ipcMain.handle('collaboration:subscribe-presence', async (event, projectId: string) => {
    if (!projectId || typeof projectId !== 'string') {
      return { success: false, error: 'Invalid project ID' };
    }

    const windowId = event.sender.id;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return { success: false, error: 'Window not found' };
    }

    // First subscription for this window — initialize its Map and register the
    // 'closed' cleanup listener. presenceSubscriptions.has() serves as the guard
    // so the listener is registered at most once per window lifetime.
    const isNewWindow = !presenceSubscriptions.has(windowId);
    if (isNewWindow) {
      presenceSubscriptions.set(windowId, new Map());
      window.once('closed', () => {
        const subs = presenceSubscriptions.get(windowId);
        if (subs) {
          for (const unsub of subs.values()) unsub();
          presenceSubscriptions.delete(windowId);
        }
      });
    }
    const windowSubs = presenceSubscriptions.get(windowId)!;

    // Unsubscribe existing subscription for this project+window before replacing
    windowSubs.get(projectId)?.();

    const unsubscribe = presenceService.onPresenceChange(projectId, (members) => {
      if (!window.isDestroyed()) {
        window.webContents.send('collaboration:presenceChanged', projectId, members);
      }
    });

    windowSubs.set(projectId, unsubscribe);

    return { success: true };
  });

  ipcMain.handle('collaboration:unsubscribe-presence', async (event, projectId: string) => {
    const windowId = event.sender.id;
    presenceSubscriptions.get(windowId)?.get(projectId)?.();
    presenceSubscriptions.get(windowId)?.delete(projectId);
    return { success: true };
  });

  logger.info('✅ Collaboration IPC handlers registered');
}
