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
} from '@powersync/node';
import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getConfig } from '../../config/env';
import { logger } from '../../utils/logger';
import type { ModuleAccess, LicenseTier } from '../../../shared/types/license.types';

/**
 * Map Supabase auth error messages to user-friendly strings.
 * Prevents leaking implementation details (e.g., "JWT expired", database errors).
 */
function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Invalid email or password';
  if (lower.includes('email not confirmed')) return 'Please confirm your email before signing in';
  if (lower.includes('user already registered')) return 'An account with this email already exists';
  if (lower.includes('password')) return 'Password does not meet requirements';
  if (lower.includes('rate limit') || lower.includes('too many'))
    return 'Too many attempts. Please wait and try again.';
  return 'Authentication failed. Please try again.';
}

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
 * Typed result from the claim_license_by_email RPC.
 * Prevents callers from coupling to raw Supabase RPC shapes.
 */
export interface ClaimLicenseResponse {
  success: boolean;
  error?: string;
  license?: SupabaseLicense;
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

    // Enforce HTTPS to prevent credential leakage
    if (config.supabase.url && !config.supabase.url.startsWith('https://')) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Supabase URL must use HTTPS in production');
      } else {
        logger.warn('[Security] Supabase URL is not using HTTPS — credentials may be exposed');
      }
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
   * Expose the underlying Supabase client for RPC calls and Realtime subscriptions.
   * Used by CollaborationService and PresenceService.
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
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
        return { success: false, error: mapAuthError(error.message) };
      }

      this.currentSession = data.session;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Sign in failed. Please try again.',
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string; emailConfirmationRequired?: boolean }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          // Redirect to the app's custom URL scheme after email confirmation.
          // Configure Supabase dashboard → Auth → URL Configuration to allow showstack://*.
          emailRedirectTo: 'showstack://auth/callback',
        },
      });

      if (error) {
        return { success: false, error: mapAuthError(error.message) };
      }

      // Session is null when email confirmation is required (Supabase default).
      // Return a distinct flag so the UI can show the appropriate message.
      this.currentSession = data.session;
      if (!data.session) {
        return {
          success: true,
          emailConfirmationRequired: true,
        };
      }
      return { success: true, emailConfirmationRequired: false };
    } catch (error) {
      return {
        success: false,
        error: 'Sign up failed. Please try again.',
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
  async claimLicenseByEmail(): Promise<ClaimLicenseResponse> {
    const { data, error } = await this.supabase.rpc('claim_license_by_email');

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || typeof data !== 'object' || typeof data.success !== 'boolean') {
      return { success: false, error: 'Invalid response from license claim' };
    }
    // Return only known fields — don't pass through unexpected data from RPC
    return {
      success: data.success,
      error: data.error,
      license: data.license,
    };
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
   * Map a raw Supabase CRUD error to a sanitized message.
   * Preserves enough context for debugging while stripping raw DB error text
   * (e.g. constraint names, column names) that could leak schema details.
   */
  private sanitizeCrudError(op: string, table: string, rawMessage: string): string {
    // Recognise common categories and return a safe generic message
    const lower = rawMessage.toLowerCase();
    if (lower.includes('permission') || lower.includes('rls') || lower.includes('policy')) {
      return `Permission denied on ${op} ${table}`;
    }
    if (lower.includes('not found') || lower.includes('pgrst116')) {
      return `Record not found on ${op} ${table}`;
    }
    if (lower.includes('duplicate') || lower.includes('unique') || lower.includes('23505')) {
      return `Duplicate record on ${op} ${table}`;
    }
    if (lower.includes('foreign key') || lower.includes('23503')) {
      return `Foreign key violation on ${op} ${table}`;
    }
    // Generic fallback — include op/table but not the raw DB message
    return `Sync ${op} failed for ${table}`;
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
        // Upsert: insert or update; inject attribution fields for fixtures
        const putPayload: Record<string, unknown> = { id, ...data };
        if (table === 'fixtures') {
          putPayload.changed_who = this.getUserId();
          // Intentional: client-side timestamp captures when the user made the
          // change, not when it was synced to the server (which may be delayed
          // in an offline-first flow). This differs from the server clock used
          // in RPC migrations — both are stored and serve different purposes.
          putPayload.changed_at = Date.now();
        }
        const { error } = await this.supabase.from(table).upsert(putPayload);

        if (error) {
          logger.error(`[SupabaseConnector] PUT failed ${table}/${id}:`, error);
          throw new Error(this.sanitizeCrudError('PUT', table, error.message));
        }
        break;
      }

      case UpdateType.PATCH: {
        // Update existing record; inject attribution fields for fixtures
        const patchPayload: Record<string, unknown> = { ...data };
        if (table === 'fixtures') {
          patchPayload.changed_who = this.getUserId();
          patchPayload.changed_at = Date.now();
        }
        const { error } = await this.supabase.from(table).update(patchPayload).eq('id', id);

        if (error) {
          logger.error(`[SupabaseConnector] PATCH failed ${table}/${id}:`, error);
          throw new Error(this.sanitizeCrudError('PATCH', table, error.message));
        }
        break;
      }

      case UpdateType.DELETE: {
        // Delete record
        const { error } = await this.supabase.from(table).delete().eq('id', id);

        if (error) {
          logger.error(`[SupabaseConnector] DELETE failed ${table}/${id}:`, error);
          throw new Error(this.sanitizeCrudError('DELETE', table, error.message));
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
