/**
 * Supabase Connector for PowerSync
 *
 * Provides authentication tokens and handles uploads to Supabase.
 * PowerSync uses this connector to:
 * 1. Get JWT tokens for sync authentication
 * 2. Upload local changes to Supabase backend
 *
 * @see https://docs.powersync.com/client-sdk-references/javascript-web#2-integrate-with-your-backend
 */

import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/web';
import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getConfig } from '../../config/env';
import { logger } from '../../utils/logger';
import type { ModuleAccess, LicenseTier } from '../../../shared/types/license.types';

/**
 * License record as stored in Supabase
 */
export interface SupabaseLicense {
  id: string;
  license_key: string;
  user_id: string | null;
  email: string;
  name: string | null;
  tier: LicenseTier;
  modules: ModuleAccess[];
  maintenance_end_date: string;
  status: 'active' | 'suspended' | 'revoked';
  cloud_sync: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Result of fetching credentials
 */
export interface PowerSyncCredentials {
  endpoint: string;
  token: string;
  expiresAt?: Date;
}

/**
 * Supabase connector implementation for PowerSync
 *
 * Handles:
 * - Authentication state management
 * - Token refresh for PowerSync
 * - CRUD operation uploads to Supabase
 */
export class SupabaseConnector implements PowerSyncBackendConnector {
  private supabase: SupabaseClient;
  private currentSession: Session | null = null;
  private sessionListeners: Array<(session: Session | null) => void> = [];

  constructor() {
    const config = getConfig();

    if (!config.supabase.url || !config.supabase.anonKey) {
      throw new Error(
        'Supabase configuration missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.',
      );
    }

    // Enforce HTTPS in production to prevent credential leakage
    if (process.env.NODE_ENV === 'production' && !config.supabase.url.startsWith('https://')) {
      throw new Error('Supabase URL must use HTTPS in production');
    }

    this.supabase = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // Electron doesn't use URL-based auth
      },
    });

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this.currentSession = session;
      this.notifySessionListeners(session);

      if (config.app.debugPowerSync) {
        logger.info(`[SupabaseConnector] Auth state changed: ${event}`);
      }
    });

    // Initialize session
    this.initSession();
  }

  /**
   * Initialize session from stored state
   */
  private async initSession(): Promise<void> {
    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();
      this.currentSession = session;
    } catch (error) {
      logger.error('[SupabaseConnector] Failed to get initial session:', error);
    }
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get current session
   */
  getSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.currentSession?.user?.id ?? null;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      this.currentSession = data.session;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Note: Session may be null if email confirmation is required
      this.currentSession = data.session;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentSession = null;
  }

  /**
   * Request password reset
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      };
    }
  }

  /**
   * Subscribe to session changes
   */
  onSessionChange(listener: (session: Session | null) => void): () => void {
    this.sessionListeners.push(listener);
    return () => {
      this.sessionListeners = this.sessionListeners.filter((l) => l !== listener);
    };
  }

  private notifySessionListeners(session: Session | null): void {
    this.sessionListeners.forEach((listener) => listener(session));
  }

  // ============================================
  // License Operations
  // ============================================

  /**
   * Fetch the current user's active license from Supabase.
   * First checks by user_id (already claimed), then falls back to email match.
   */
  async fetchUserLicense(): Promise<SupabaseLicense | null> {
    const userId = this.getUserId();
    if (!userId) return null;

    // Try by user_id first (already claimed)
    const { data, error } = await this.supabase
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!error && data) {
      return data;
    }

    // Fall back to email match (unclaimed license visible via RLS)
    const userEmail = this.currentSession?.user?.email;
    if (!userEmail) return null;

    const { data: emailMatch, error: emailError } = await this.supabase
      .from('licenses')
      .select('*')
      .eq('email', userEmail)
      .is('user_id', null)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!emailError && emailMatch) {
      return emailMatch;
    }

    return null;
  }

  /**
   * Claim an unclaimed license by email via Supabase RPC.
   * Called automatically on sign-in when a license exists for the user's email.
   */
  async claimLicenseByEmail(): Promise<{
    success: boolean;
    error?: string;
    license?: SupabaseLicense;
  }> {
    const { data, error } = await this.supabase.rpc('claim_license_by_email');

    if (error) {
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string; license?: SupabaseLicense };
  }

  // ============================================
  // PowerSyncBackendConnector Interface
  // ============================================

  /**
   * Fetch credentials for PowerSync authentication
   * Called by PowerSync SDK when it needs to authenticate
   */
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const config = getConfig();

    if (!config.powersync.url) {
      throw new Error('PowerSync URL not configured. Ensure POWERSYNC_URL is set.');
    }

    // Ensure we have a fresh session
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession();

    if (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }

    if (!session) {
      throw new Error('No active session. User must be signed in to sync.');
    }

    // Update local session reference
    this.currentSession = session;

    return {
      endpoint: config.powersync.url,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  /**
   * Upload local changes to Supabase
   * Called by PowerSync SDK when there are pending local changes
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    try {
      for (const op of transaction.crud) {
        await this.uploadCrudEntry(op);
      }

      // Mark transaction as complete
      await transaction.complete();
    } catch (error) {
      logger.error('[SupabaseConnector] Upload failed:', error);

      // Don't mark as complete - PowerSync will retry
      throw error;
    }
  }

  /**
   * Upload a single CRUD operation to Supabase
   */
  private async uploadCrudEntry(entry: CrudEntry): Promise<void> {
    const table = entry.table;
    const data = entry.opData;
    const id = entry.id;

    switch (entry.op) {
      case UpdateType.PUT: {
        // Upsert: insert or update
        const { error } = await this.supabase.from(table).upsert({
          id,
          ...data,
        });

        if (error) {
          throw new Error(`Failed to upsert ${table}/${id}: ${error.message}`);
        }
        break;
      }

      case UpdateType.PATCH: {
        // Update existing record
        const { error } = await this.supabase.from(table).update(data).eq('id', id);

        if (error) {
          throw new Error(`Failed to update ${table}/${id}: ${error.message}`);
        }
        break;
      }

      case UpdateType.DELETE: {
        // Delete record
        const { error } = await this.supabase.from(table).delete().eq('id', id);

        if (error) {
          throw new Error(`Failed to delete ${table}/${id}: ${error.message}`);
        }
        break;
      }

      default:
        throw new Error(`Unknown operation type: ${entry.op}`);
    }
  }
}

// Singleton instance
let connectorInstance: SupabaseConnector | null = null;

/**
 * Get the singleton SupabaseConnector instance
 */
export function getSupabaseConnector(): SupabaseConnector {
  if (!connectorInstance) {
    connectorInstance = new SupabaseConnector();
  }
  return connectorInstance;
}

/**
 * Reset the connector (for testing)
 * @internal
 */
export function resetSupabaseConnector(): void {
  connectorInstance = null;
}
