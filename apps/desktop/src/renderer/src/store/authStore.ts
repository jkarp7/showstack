/**
 * Auth Store
 *
 * Manages authentication state for cloud sync.
 * Communicates with main process via IPC.
 */

import { create } from 'zustand';
import { logger } from '../utils/logger';

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
 * Auth state
 */
export interface AuthState {
  // Authentication
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  isLoading: boolean;
  error: string | null;

  // Sync status
  syncStatus: SyncStatus;
  isCloudConfigured: boolean;

  // UI state
  showAuthModal: boolean;
  authModalView: 'login' | 'signup' | 'reset';

  // Actions
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  refreshAuthState: () => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  initializeSync: () => Promise<void>;

  // UI actions
  openAuthModal: (view?: 'login' | 'signup' | 'reset') => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: 'login' | 'signup' | 'reset') => void;
  clearError: () => void;
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
  syncStatus: defaultSyncStatus,
  isCloudConfigured: false,
  showAuthModal: false,
  authModalView: 'login',

  // Sign in
  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await window.api.auth.signIn(email, password);

      if (result.success) {
        // Refresh auth state after successful sign in
        await get().refreshAuthState();
        await get().refreshSyncStatus();
        set({ isLoading: false, showAuthModal: false });
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

      // Refresh states
      await get().refreshAuthState();
      await get().refreshSyncStatus();

      // Subscribe to status changes
      await window.api.sync.subscribeStatus();
      window.api.sync.onStatusChanged((status: SyncStatus) => {
        set({ syncStatus: status });
      });
    } catch (error) {
      logger.error('[AuthStore] Failed to initialize sync:', error);
    }
  },

  // UI actions
  openAuthModal: (view = 'login') => {
    set({ showAuthModal: true, authModalView: view, error: null });
  },

  closeAuthModal: () => {
    set({ showAuthModal: false, error: null });
  },

  setAuthModalView: (view) => {
    set({ authModalView: view, error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
