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
import type { MemberRole } from '../services/CollaborationService';
import { logger } from '../utils/logger';

/** Basic email format validation */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const VALID_ROLES: MemberRole[] = ['owner', 'editor', 'viewer'];

export function registerCollaborationHandlers(): void {
  // ============================================
  // PROJECT MEMBERS
  // ============================================

  ipcMain.handle(
    'collaboration:invite-to-project',
    async (_, projectId: string, projectName: string, email: string, role: MemberRole) => {
      if (!projectId || typeof projectId !== 'string') {
        return { success: false, error: 'Invalid project ID' };
      }
      if (!projectName || typeof projectName !== 'string') {
        return { success: false, error: 'Invalid project name' };
      }
      if (!email || !isValidEmail(email)) {
        return { success: false, error: 'Invalid email address' };
      }
      if (!VALID_ROLES.includes(role)) {
        return { success: false, error: 'Invalid role. Must be owner, editor, or viewer.' };
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

  // ============================================
  // SHOP ORDER MEMBERS
  // ============================================

  ipcMain.handle(
    'collaboration:invite-to-shop-order',
    async (_, shopOrderId: string, email: string, role: MemberRole) => {
      if (!shopOrderId || typeof shopOrderId !== 'string') {
        return { success: false, error: 'Invalid shop order ID' };
      }
      if (!email || !isValidEmail(email)) {
        return { success: false, error: 'Invalid email address' };
      }
      if (!VALID_ROLES.includes(role)) {
        return { success: false, error: 'Invalid role. Must be owner, editor, or viewer.' };
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

  // Track per-window presence subscriptions: windowId → Map<projectId, unsubscribe>
  const presenceSubscriptions = new Map<number, Map<string, () => void>>();

  ipcMain.handle('collaboration:subscribe-presence', (event, projectId: string) => {
    if (!projectId || typeof projectId !== 'string') {
      return { success: false, error: 'Invalid project ID' };
    }

    const windowId = event.sender.id;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return { success: false, error: 'Window not found' };
    }

    // Initialize window subscription map
    if (!presenceSubscriptions.has(windowId)) {
      presenceSubscriptions.set(windowId, new Map());
    }
    const windowSubs = presenceSubscriptions.get(windowId)!;

    // Unsubscribe existing subscription for this project+window
    windowSubs.get(projectId)?.();

    const unsubscribe = presenceService.onPresenceChange(projectId, (members) => {
      if (!window.isDestroyed()) {
        window.webContents.send('collaboration:presenceChanged', projectId, members);
      }
    });

    windowSubs.set(projectId, unsubscribe);

    // Clean up on window close
    window.on('closed', () => {
      const subs = presenceSubscriptions.get(windowId);
      if (subs) {
        for (const unsub of subs.values()) unsub();
        presenceSubscriptions.delete(windowId);
      }
    });

    return { success: true };
  });

  ipcMain.handle('collaboration:unsubscribe-presence', (event, projectId: string) => {
    const windowId = event.sender.id;
    presenceSubscriptions.get(windowId)?.get(projectId)?.();
    presenceSubscriptions.get(windowId)?.delete(projectId);
    return { success: true };
  });

  logger.info('✅ Collaboration IPC handlers registered');
}
