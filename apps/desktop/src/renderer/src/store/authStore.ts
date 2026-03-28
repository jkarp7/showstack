/**
 * Auth Store
 *
 * Manages authentication state for cloud sync.
 * Communicates with main process via IPC.
 */

import { create } from 'zustand';
import { logger } from '../utils/logger';
import { validatePassword } from '@showstack/shared';

/**
 * Sync status from PowerSync
 */
export interface SyncStatus {
  state: 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';
  connected: boolean;
  hasPendingChanges: boolean;
  pendingUploadCount: number;
  lastSyncedAt: Date | null;
  error: string | null;
  isAuthenticated: boolean;
}

/**
 * License status from main process
 */
export interface LicenseStatus {
  status: 'active' | 'grace' | 'expired' | 'suspended' | 'maintenance_expired';
  tier: 'professional' | 'student' | 'institutional' | 'demo' | null;
  message: string;
  canView: boolean;
  canEdit: boolean;
  canSync: boolean;
  warningLevel?: 'low' | 'medium' | 'high';
  daysUntilExpiration?: number;
  daysSinceVerification?: number;
}

/**
 * Auth state
 */
export interface AuthState {
  // Authentication
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  isLoading: boolean;
  error: string | null;

  // License
  hasLicense: boolean;
  licenseStatus: LicenseStatus | null;

  // Sync status
  syncStatus: SyncStatus;
  isCloudConfigured: boolean;

  // UI state
  showAuthModal: boolean;
  authModalView: 'login' | 'signup' | 'reset' | 'set-password';
  isFirstLaunchPrompt: boolean;
  pendingDeepLinkType: 'recovery' | 'invite' | null;

  // Actions
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  refreshAuthState: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  refreshLicenseStatus: () => Promise<void>;
  initializeSync: () => Promise<void>;

  // Demo mode
  activateDemoMode: () => Promise<void>;

  // UI actions
  openAuthModal: (view?: 'login' | 'signup' | 'reset' | 'set-password') => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: 'login' | 'signup' | 'reset' | 'set-password') => void;
  setFirstLaunchPrompt: (value: boolean) => void;
  clearError: () => void;
}

/**
 * In-memory fallback for when localStorage is unavailable (e.g. private browsing).
 * Ensures the first-launch prompt doesn't re-appear every page load in the same session.
 *
 * Intentional trade-off: this Map lives at module scope for the entire renderer-process
 * lifetime. Keys written during one sign-in session persist across sign-out / sign-in
 * within the same renderer process (i.e. without an app restart). For the first-launch
 * prompt use case this is the desired behaviour — once dismissed it should stay dismissed.
 *
 * Cross-account note: a user who signs out and signs back in as a *different* account
 * inherits any in-memory keys written by the previous session. This is harmless for the
 * first-launch prompt (both users benefit from it being dismissed), but callers adding
 * new per-user keys should call safeLocalStorage(key, null) in the signOut action to
 * clear them explicitly rather than relying on process restart.
 */
const memoryStorage = new Map<string, string>();

/**
 * Safe localStorage wrapper with in-memory session fallback.
 * Falls back to sessionStorage first, then an in-memory Map.
 * Guarantees callers never see the first-launch prompt again within the same session,
 * even if persistent storage is blocked.
 *
 * Pass `null` as the value to remove the key from all storage tiers.
 */
function safeLocalStorage(key: string, value?: string | null): string | null {
  const isRemoval = value === null;

  // Primary: persistent localStorage
  try {
    if (isRemoval) {
      localStorage.removeItem(key);
      memoryStorage.delete(key);
      return null;
    }
    if (value !== undefined) {
      localStorage.setItem(key, value);
      return value;
    }
    return localStorage.getItem(key);
  } catch {
    // Fall through to sessionStorage
  }

  // Secondary: sessionStorage (survives page reloads within the same tab)
  try {
    if (isRemoval) {
      sessionStorage.removeItem(key);
      memoryStorage.delete(key);
      return null;
    }
    if (value !== undefined) {
      sessionStorage.setItem(key, value);
      return value;
    }
    return sessionStorage.getItem(key);
  } catch {
    // Fall through to in-memory
  }

  // Tertiary: in-memory (lost on page reload, but prevents prompt re-appearing in session)
  logger.warn(
    `[AuthStore] localStorage/sessionStorage unavailable for key "${key}", using memory fallback`,
  );
  if (isRemoval) {
    memoryStorage.delete(key);
    return null;
  }
  if (value !== undefined) {
    memoryStorage.set(key, value);
    return value;
  }
  return memoryStorage.get(key) ?? null;
}

const defaultSyncStatus: SyncStatus = {
  state: 'disconnected',
  connected: false,
  hasPendingChanges: false,
  pendingUploadCount: 0,
  lastSyncedAt: null,
  error: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  userId: null,
  email: null,
  isLoading: false,
  error: null,
  hasLicense: false,
  licenseStatus: null,
  syncStatus: defaultSyncStatus,
  isCloudConfigured: false,
  showAuthModal: false,
  authModalView: 'login',
  isFirstLaunchPrompt: false,
  pendingDeepLinkType: null,

  // Sign in
  signIn: async (email: string, password: string) => {
    if (!email?.trim()) {
      set({ error: 'Email is required' });
      return false;
    }
    if (password.length < 8) {
      set({ error: 'Password must be at least 8 characters' });
      return false;
    }
    set({ isLoading: true, error: null });

    try {
      const result = await window.api.auth.signIn(email, password);

      if (result.success) {
        // Refresh all state in parallel. Use allSettled so a failure in one
        // (e.g. sync status unreachable) doesn't leave auth/license state un-updated.
        const refreshResults = await Promise.allSettled([
          get().refreshAuthState(),
          get().refreshLicenseStatus(),
          get().refreshSyncStatus(),
        ]);
        refreshResults.forEach((r) => {
          if (r.status === 'rejected') {
            logger.warn('[AuthStore] signIn refresh failed', {
              reason: r.reason instanceof Error ? r.reason.message : String(r.reason),
            });
          }
        });
        // Mark auth as prompted so first-launch prompt won't show again
        safeLocalStorage('showstack-auth-prompted', 'true');
        // Surface license verification failure to the user
        if (result.licenseVerified === false) {
          set({
            isLoading: false,
            showAuthModal: false,
            isFirstLaunchPrompt: false,
            error:
              'Signed in, but no license found for this account. Some features may be limited.',
          });
        } else {
          set({ isLoading: false, showAuthModal: false, isFirstLaunchPrompt: false });
        }
        return true;
      } else {
        set({ isLoading: false, error: result.error || 'Sign in failed' });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      });
      return false;
    }
  },

  // Sign up
  signUp: async (email: string, password: string) => {
    if (!email?.trim()) {
      set({ error: 'Email is required' });
      return false;
    }
    if (password.length < 8) {
      set({ error: 'Password must be at least 8 characters' });
      return false;
    }
    set({ isLoading: true, error: null });

    try {
      const result = await window.api.auth.signUp(email, password);

      if (result.success) {
        // Refresh auth state - user may need to confirm email
        await get().refreshAuthState();
        set({ isLoading: false });
        return true;
      } else {
        set({ isLoading: false, error: result.error || 'Sign up failed' });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      });
      return false;
    }
  },

  // Sign out
  signOut: async () => {
    set({ isLoading: true, error: null });

    try {
      await window.api.auth.signOut();
      set({
        isAuthenticated: false,
        userId: null,
        email: null,
        isLoading: false,
        syncStatus: defaultSyncStatus,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      });
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await window.api.auth.resetPassword(email);

      if (result.success) {
        set({ isLoading: false });
        return true;
      } else {
        set({ isLoading: false, error: result.error || 'Password reset failed' });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      });
      return false;
    }
  },

  // Set new password (after recovery/invite deep link verification)
  updatePassword: async (password: string) => {
    const passwordError = validatePassword(password);
    if (passwordError) {
      set({ error: passwordError });
      return false;
    }
    set({ isLoading: true, error: null });

    try {
      const result = await window.api.auth.updatePassword(password);

      if (result.success) {
        await Promise.allSettled([
          get().refreshAuthState(),
          get().refreshLicenseStatus(),
          get().refreshSyncStatus(),
        ]);
        set({
          isLoading: false,
          pendingDeepLinkType: null,
        });
        return true;
      } else {
        set({ isLoading: false, error: result.error || 'Password update failed' });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Password update failed',
      });
      return false;
    }
  },

  // Refresh auth state from main process
  refreshAuthState: async () => {
    try {
      const state = await window.api.auth.getState();
      set({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        email: state.email,
      });
    } catch (error) {
      logger.error('[AuthStore] Failed to refresh auth state:', error);
    }
  },

  // Refresh sync status
  refreshSyncStatus: async () => {
    try {
      const status = await window.api.sync.getStatus();
      set({ syncStatus: status });
    } catch (error) {
      logger.error('[AuthStore] Failed to refresh sync status:', error);
    }
  },

  // Refresh license status
  refreshLicenseStatus: async () => {
    try {
      const status = await window.api.license.getStatus();
      set({
        licenseStatus: status,
        hasLicense: status.status !== 'expired' || status.canView,
      });
    } catch (error) {
      logger.error('[AuthStore] Failed to refresh license status:', error);
    }
  },

  // Initialize sync service
  initializeSync: async () => {
    try {
      // Check if cloud is configured
      const isConfigured = await window.api.sync.isConfigured();
      set({ isCloudConfigured: isConfigured });

      if (!isConfigured) {
        logger.info('[AuthStore] Cloud sync not configured');
        return;
      }

      // Initialize PowerSync
      const result = await window.api.sync.initialize();
      if (!result.success) {
        logger.warn('[AuthStore] Sync initialization failed:', result.error);
      }

      // Refresh auth + license from local cache first (fast, no network needed)
      await get().refreshAuthState();
      await get().refreshLicenseStatus();

      // Register the renderer-side status listener BEFORE subscribeStatus so
      // we catch the immediate push that subscribeStatus fires on setup.
      window.api.sync.onStatusChanged((status: SyncStatus) => {
        logger.info(
          `[AuthStore] sync status: ${status.state}${status.error ? ` — ${status.error}` : ''}`,
        );
        set({ syncStatus: status });
      });
      await window.api.sync.subscribeStatus();
      await get().refreshSyncStatus();

      // Connect only if the license includes cloud sync.
      if (get().isAuthenticated && get().licenseStatus?.canSync) {
        window.api.sync.connect().catch(() => {});
      }

      // Verify license against Supabase in the background.
      // If canSync status changes (e.g. user just upgraded), connect then.
      if (get().isAuthenticated) {
        window.api.license
          .verifyOnline()
          .then(async () => {
            await get().refreshLicenseStatus();
            const { licenseStatus, syncStatus } = get();
            // Connect if license now allows sync and we're not already connected
            if (
              licenseStatus?.canSync &&
              syncStatus.state !== 'connected' &&
              syncStatus.state !== 'connecting' &&
              syncStatus.state !== 'syncing'
            ) {
              window.api.sync.connect().catch(() => {});
            }
          })
          .catch(() => {
            // Network unavailable — local cached status remains valid
          });
      }

      const isReady = await window.api.sync.isReady();
      logger.info(
        `[AuthStore] sync init complete — isReady: ${isReady}, isConfigured: ${isConfigured}`,
      );
    } catch (error) {
      logger.error('[AuthStore] Failed to initialize sync:', error);
    }
  },

  // Demo mode
  activateDemoMode: async () => {
    try {
      await window.api.license.createDemo();
      await get().refreshLicenseStatus();
      set({ isFirstLaunchPrompt: false, showAuthModal: false });
    } catch (error) {
      logger.error('[AuthStore] Failed to activate demo mode', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  // UI actions
  openAuthModal: (view = 'login') => {
    set({ showAuthModal: true, authModalView: view, error: null });
  },

  closeAuthModal: () => {
    set({
      showAuthModal: false,
      error: null,
      isFirstLaunchPrompt: false,
      pendingDeepLinkType: null,
    });
  },

  setAuthModalView: (view) => {
    set({ authModalView: view, error: null });
  },

  setFirstLaunchPrompt: (value) => {
    set({ isFirstLaunchPrompt: value });
  },

  clearError: () => {
    set({ error: null });
  },
}));
