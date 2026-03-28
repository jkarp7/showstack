/**
 * Sync IPC Handlers
 *
 * Exposes PowerSync and Supabase functionality to the renderer process.
 * Handles authentication, sync status, and sync operations.
 */

import { ipcMain, BrowserWindow } from 'electron';
import {
  getPowerSyncService,
  getSupabaseConnector,
  type ShowStackSyncStatus,
} from '../services/sync';
import { licenseService } from '../services/LicenseService';
import { presenceService } from '../services/PresenceService';
import { logger } from '../utils/logger';
import { validatePassword } from '@showstack/shared';

/** Basic email format validation */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Simple in-memory rate limiter — tracks last call time per action.
 * This is a client-side courtesy limit only. The authoritative rate limiting
 * is enforced server-side by Supabase (e.g., email rate limits for password reset,
 * auth attempt limits for sign-in). This resets on app restart by design —
 * Supabase's persistent server-side limits are the security boundary.
 */
const rateLimitTimestamps = new Map<string, number>();
const RATE_LIMIT_MS = 10_000; // 10 seconds between calls

function isRateLimited(action: string): boolean {
  const now = Date.now();
  const lastCall = rateLimitTimestamps.get(action);
  if (lastCall && now - lastCall < RATE_LIMIT_MS) {
    return true;
  }
  rateLimitTimestamps.set(action, now);
  return false;
}

/**
 * Register all sync-related IPC handlers
 */
export function registerSyncHandlers(): void {
  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize PowerSync service
   * Should be called once after app is ready
   */
  ipcMain.handle('sync:initialize', async () => {
    try {
      const service = getPowerSyncService();
      // Wrap with a timeout so a stuck worker (e.g. dylib load failure inside
      // app.asar.unpacked) doesn't block the renderer's initializeSync() forever.
      const INIT_TIMEOUT_MS = 10_000;
      await Promise.race([
        service.initialize(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('PowerSync initialization timed out')),
            INIT_TIMEOUT_MS,
          ),
        ),
      ]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Initialization failed',
      };
    }
  });

  /**
   * Check if cloud sync is configured
   */
  ipcMain.handle('sync:isConfigured', () => {
    const service = getPowerSyncService();
    return service.isCloudConfigured();
  });

  /**
   * Check if PowerSync is ready
   */
  ipcMain.handle('sync:isReady', () => {
    const service = getPowerSyncService();
    return service.isReady();
  });

  // ============================================
  // AUTHENTICATION
  // ============================================

  /**
   * Sign in with email and password
   */
  ipcMain.handle('auth:signIn', async (_, email: string, password: string) => {
    if (isRateLimited('signIn')) {
      return { success: false, error: 'Too many attempts. Please wait.' };
    }
    // Input validation
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return { success: false, error: 'Invalid email address' };
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    try {
      const connector = getSupabaseConnector();
      const result = await connector.signIn(email.trim().toLowerCase(), password);

      if (result.success) {
        // Refresh license data from Supabase after sign-in
        let licenseVerified = false;
        try {
          licenseVerified = await licenseService.verifyLicenseViaSupabase();
        } catch (licenseError) {
          logger.warn('[Sync] License refresh after sign-in failed (non-fatal)', {
            error: licenseError instanceof Error ? licenseError.message : 'Unknown',
          });
        }

        // Connect to sync only if the license includes cloud sync.
        // Non-blocking so login IPC returns immediately.
        const service = getPowerSyncService();
        if (service.isReady() && licenseService.getLicenseStatus()?.canSync) {
          service.connect().catch(() => {});
        }

        return { ...result, licenseVerified };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  });

  /**
   * Sign up with email and password
   */
  ipcMain.handle('auth:signUp', async (_, email: string, password: string) => {
    if (isRateLimited('signUp')) {
      return { success: false, error: 'Too many attempts. Please wait.' };
    }
    // Input validation
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return { success: false, error: 'Invalid email address' };
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    try {
      const connector = getSupabaseConnector();
      return await connector.signUp(email.trim().toLowerCase(), password);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      };
    }
  });

  /**
   * Sign out
   */
  ipcMain.handle('auth:signOut', async () => {
    try {
      // Disconnect sync first — skip if not initialized to avoid hanging on a
      // stuck db.disconnect() call (e.g. when the sync worker never came up).
      const service = getPowerSyncService();
      if (service.isReady()) {
        await service.disconnect();
      }

      // Clean up presence channels before signing out
      presenceService.cleanup();

      // Then sign out
      const connector = getSupabaseConnector();
      await connector.signOut();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  });

  /**
   * Exchange deep-link tokens for a Supabase session.
   * Called by the renderer after receiving an auth:deepLink event.
   *
   * Two URL formats are handled:
   *   - Email confirmation (type=signup):
   *       showstack://auth/callback#access_token=...&refresh_token=...&type=signup
   *       → calls setSession(); user is immediately authenticated
   *   - Password reset (type=recovery) and invite (type=invite):
   *       showstack://auth/callback?token_hash=...&type=recovery|invite
   *       → calls verifyOtp(); user must then set a password via auth:updatePassword
   *
   * Returns { success, type } so the renderer can decide what to show next.
   */
  ipcMain.handle('auth:exchangeDeepLink', async (_, url: string) => {
    if (!url || typeof url !== 'string') {
      return { success: false, error: 'Invalid URL' };
    }

    try {
      const parsedUrl = new URL(url);
      const queryParams = parsedUrl.searchParams;
      const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));

      // token_hash flows use query params (?token_hash=...&type=recovery|invite)
      const tokenHash = queryParams.get('token_hash');
      const tokenType = queryParams.get('type') as 'recovery' | 'invite' | null;

      if (tokenHash && (tokenType === 'recovery' || tokenType === 'invite')) {
        const connector = getSupabaseConnector();
        const { error } = await connector.getClient().auth.verifyOtp({
          token_hash: tokenHash,
          type: tokenType,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // User is authenticated but must set a password before proceeding
        return { success: true, type: tokenType };
      }

      // access_token flows use hash fragment (#access_token=...&refresh_token=...&type=signup|invite|recovery)
      // This is the format Supabase produces when {{ .ConfirmationURL }} is used in email templates.
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const sessionType = (hashParams.get('type') ?? 'signup') as
          | 'signup'
          | 'invite'
          | 'recovery';
        const connector = getSupabaseConnector();
        const { data, error } = await connector.getClient().auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // For invite and recovery, the user is authenticated but must set a password.
        // The renderer will show SetPasswordForm when type is not 'signup'.
        return { success: true, type: sessionType, hasSession: !!data.session };
      }

      return { success: false, error: 'No recognisable token in URL' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deep link exchange failed',
      };
    }
  });

  /**
   * Update the authenticated user's password.
   * Called after a recovery or invite deep link has been verified via auth:exchangeDeepLink.
   */
  ipcMain.handle('auth:updatePassword', async (_, password: string) => {
    if (!password || typeof password !== 'string') {
      return { success: false, error: 'Password is required' };
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return { success: false, error: passwordError };
    }

    try {
      const connector = getSupabaseConnector();
      const { error } = await connector.getClient().auth.updateUser({ password });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password update failed',
      };
    }
  });

  /**
   * Request password reset
   */
  ipcMain.handle('auth:resetPassword', async (_, email: string) => {
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return { success: false, error: 'Invalid email address' };
    }
    if (isRateLimited('resetPassword')) {
      return { success: false, error: 'Please wait before requesting another reset' };
    }

    try {
      const connector = getSupabaseConnector();
      return await connector.resetPassword(email.trim().toLowerCase());
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      };
    }
  });

  /**
   * Get current authentication state
   */
  ipcMain.handle('auth:getState', () => {
    try {
      const connector = getSupabaseConnector();
      const session = connector.getSession();

      return {
        isAuthenticated: connector.isAuthenticated(),
        userId: connector.getUserId(),
        email: session?.user?.email ?? null,
      };
    } catch (error) {
      logger.warn('Failed to get auth state', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        isAuthenticated: false,
        userId: null,
        email: null,
      };
    }
  });

  // ============================================
  // SYNC OPERATIONS
  // ============================================

  /**
   * Connect to sync service
   */
  ipcMain.handle('sync:connect', async () => {
    try {
      const service = getPowerSyncService();
      await service.connect();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  });

  /**
   * Disconnect from sync service
   */
  ipcMain.handle('sync:disconnect', async () => {
    try {
      const service = getPowerSyncService();
      await service.disconnect();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed',
      };
    }
  });

  /**
   * Force a sync operation
   */
  ipcMain.handle('sync:sync', async () => {
    try {
      const service = getPowerSyncService();
      await service.sync();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  });

  /**
   * Get current sync status
   */
  ipcMain.handle('sync:getStatus', (): ShowStackSyncStatus => {
    const service = getPowerSyncService();
    return service.getSyncStatus();
  });

  /**
   * Check for pending changes
   */
  ipcMain.handle('sync:hasPendingChanges', async () => {
    const service = getPowerSyncService();
    return service.hasPendingChanges();
  });

  // ============================================
  // STATUS SUBSCRIPTIONS
  // ============================================

  // Track active status subscriptions per window
  const statusSubscriptions = new Map<number, () => void>();

  /**
   * Subscribe to sync status changes
   * Sends 'sync:statusChanged' events to the renderer
   */
  ipcMain.handle('sync:subscribeStatus', (event) => {
    const windowId = event.sender.id;
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window) {
      return { success: false, error: 'Window not found' };
    }

    // Unsubscribe existing subscription for this window
    const existing = statusSubscriptions.get(windowId);
    if (existing) {
      existing();
    }

    // Create new subscription
    const service = getPowerSyncService();
    const unsubscribe = service.onStatusChange((status) => {
      // Send status to renderer if window is not destroyed
      if (!window.isDestroyed()) {
        window.webContents.send('sync:statusChanged', status);
      }
    });

    statusSubscriptions.set(windowId, unsubscribe);

    // Clean up on window close
    window.on('closed', () => {
      const unsub = statusSubscriptions.get(windowId);
      if (unsub) {
        unsub();
        statusSubscriptions.delete(windowId);
      }
    });

    return { success: true };
  });

  /**
   * Unsubscribe from sync status changes
   */
  ipcMain.handle('sync:unsubscribeStatus', (event) => {
    const windowId = event.sender.id;
    const existing = statusSubscriptions.get(windowId);

    if (existing) {
      existing();
      statusSubscriptions.delete(windowId);
    }

    return { success: true };
  });
}

/**
 * Initialize PowerSync on app startup
 * Call this after database initialization
 */
export async function initializePowerSync(): Promise<void> {
  const service = getPowerSyncService();

  try {
    // initialize() handles auto-connect for persisted sessions internally.
    // Wrap with a timeout so a stuck worker never blocks app startup.
    const INIT_TIMEOUT_MS = 10_000;
    await Promise.race([
      service.initialize(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PowerSync initialization timed out')), INIT_TIMEOUT_MS),
      ),
    ]);
  } catch (error) {
    // Non-fatal - app works offline without sync
    logger.info('[Sync] PowerSync initialization skipped:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get PowerSync sync status (for internal use by HealthChecker)
 */
export function getPowerSyncStatus(): ShowStackSyncStatus | null {
  try {
    const service = getPowerSyncService();
    return service.getSyncStatus();
  } catch {
    return null;
  }
}

/**
 * Cleanup PowerSync on app shutdown
 */
export async function disposePowerSync(): Promise<void> {
  const service = getPowerSyncService();
  await service.dispose();
}
