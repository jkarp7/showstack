/**
 * PowerSync Service
 *
 * Manages the PowerSync database connection and sync operations.
 * Provides a high-level API for sync status, conflict resolution,
 * and offline operation management.
 *
 * This is the main entry point for cloud sync functionality.
 */

import { PowerSyncDatabase, SyncStatus } from '@powersync/node';
import { app } from 'electron';
import { join } from 'path';
import { Worker } from 'node:worker_threads';
import { AppSchema } from './powerSyncSchema';
import { SupabaseConnector, getSupabaseConnector } from './SupabaseConnector';
import { getConfig } from '../../config/env';
import { logger } from '../../utils/logger';

/**
 * Sync status for UI display
 */
export interface ShowStackSyncStatus {
  /** Current connection state */
  state: 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';
  /** Whether currently connected to server */
  connected: boolean;
  /** Whether there are pending local changes */
  hasPendingChanges: boolean;
  /** Number of pending upload operations */
  pendingUploadCount: number;
  /** Last successful sync timestamp */
  lastSyncedAt: Date | null;
  /** Error message if in error state */
  error: string | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Callback type for sync status changes
 */
export type SyncStatusListener = (status: ShowStackSyncStatus) => void;

/**
 * PowerSync Service class
 *
 * Manages sync lifecycle:
 * - Initialize PowerSync database
 * - Connect/disconnect sync
 * - Monitor sync status
 * - Handle offline queue
 */
export class PowerSyncService {
  private db: PowerSyncDatabase | null = null;
  private connector: SupabaseConnector | null = null;
  private statusListeners: SyncStatusListener[] = [];
  private lastSyncedAt: Date | null = null;
  private currentError: string | null = null;
  private isInitialized = false;

  /**
   * Initialize the PowerSync database
   * Call this once at app startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('[PowerSyncService] Already initialized');
      return;
    }

    const config = getConfig();

    if (!config.isConfigured) {
      logger.info('[PowerSyncService] Cloud not configured, skipping initialization');
      return;
    }

    try {
      // Get the Supabase connector
      this.connector = getSupabaseConnector();

      // Create PowerSync database — use absolute userData path so the file
      // is writable in both dev and packaged builds.
      //
      // In a packaged Electron app, @powersync/node spawns its SQLite worker
      // using import.meta.url which resolves inside app.asar. dlopen cannot
      // load native extensions from inside an ASAR archive. We override
      // openWorker to explicitly load the worker from app.asar.unpacked so
      // that the dylib path it computes also lands in app.asar.unpacked.
      const openWorker = app.isPackaged
        ? (...[_url, opts]: ConstructorParameters<typeof Worker>) => {
            const workerPath = join(
              process.resourcesPath,
              'app.asar.unpacked',
              'node_modules',
              '@powersync',
              'node',
              'lib',
              'db',
              'DefaultWorker.js',
            );
            return new Worker(workerPath, opts as object | undefined);
          }
        : undefined;

      this.db = new PowerSyncDatabase({
        schema: AppSchema,
        database: {
          dbFilename: join(app.getPath('userData'), 'showstack-sync.db'),
          ...(openWorker && { openWorker }),
        },
      });

      // Initialize the database
      await this.db.init();

      // Set up status monitoring
      this.setupStatusMonitoring();

      // Listen for auth changes
      this.connector.onSessionChange((session) => {
        if (session) {
          // User signed in - start syncing
          this.connect();
        } else {
          // User signed out - stop syncing
          this.disconnect();
        }
      });

      // If user is already authenticated when we initialize (e.g. app restart
      // with persisted session), the onSessionChange listener above won't fire
      // for the existing session. Await the session directly so we don't race
      // against the async initSession() in SupabaseConnector.
      const {
        data: { session: existingSession },
      } = await this.connector.getClient().auth.getSession();
      if (existingSession) {
        this.connect().catch((error) => {
          logger.warn('[PowerSyncService] Initial connect failed:', { error: String(error) });
        });
      }

      this.isInitialized = true;

      if (config.app.debugPowerSync) {
        logger.info('[PowerSyncService] Initialized successfully');
      }
    } catch (error) {
      logger.error('[PowerSyncService] Initialization failed:', error);
      this.currentError = error instanceof Error ? error.message : 'Initialization failed';
      this.notifyStatusListeners();
      throw error;
    }
  }

  /**
   * Set up sync status monitoring
   */
  private setupStatusMonitoring(): void {
    if (!this.db) return;

    // Subscribe to sync status changes
    this.db.registerListener({
      statusChanged: (status: SyncStatus) => {
        const config = getConfig();

        if (config.app.debugPowerSync) {
          logger.info(
            `[PowerSyncService] Status changed: ${status.connected ? 'connected' : 'disconnected'}`,
          );
        }

        // Update last synced time when sync completes
        const dataFlow = status.dataFlowStatus;
        if (status.connected && !dataFlow?.downloading && !dataFlow?.uploading) {
          this.lastSyncedAt = new Date();
        }

        // Clear error on successful connection
        if (status.connected) {
          this.currentError = null;
        }

        this.notifyStatusListeners();
      },
    });
  }

  /**
   * Connect to PowerSync and start syncing
   * Requires user to be authenticated
   */
  async connect(): Promise<void> {
    if (!this.db || !this.connector) {
      throw new Error('PowerSync not initialized. Call initialize() first.');
    }

    this.currentError = null;

    // Do NOT check isAuthenticated() here — currentSession may not be
    // populated yet due to the async initSession() race. The PowerSync SDK
    // calls fetchCredentials() itself, which does a fresh getSession() and
    // handles token refresh. Let it decide if auth is valid.
    //
    // db.connect() resolves only once the status leaves "connecting"; fire
    // and forget so callers are never blocked. Status updates arrive through
    // the registerListener callback in setupStatusMonitoring().
    this.db.connect(this.connector).catch((error) => {
      this.currentError = error instanceof Error ? error.message : 'Connection failed';
      this.notifyStatusListeners();
    });
  }

  /**
   * Disconnect from PowerSync
   * Local database remains accessible
   */
  async disconnect(): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.disconnect();
      this.currentError = null;
    } catch (error) {
      logger.error('[PowerSyncService] Disconnect error:', error);
    }

    this.notifyStatusListeners();
  }

  /**
   * Force a sync operation
   * Useful after making local changes
   */
  async sync(): Promise<void> {
    if (!this.db) {
      throw new Error('PowerSync not initialized');
    }

    // Trigger upload of pending changes
    await this.db.writeTransaction(async () => {
      // Empty transaction triggers sync
    });
  }

  /**
   * Get the PowerSync database instance
   * Use this for direct database operations
   */
  getDatabase(): PowerSyncDatabase | null {
    return this.db;
  }

  /**
   * Get the Supabase connector
   */
  getConnector(): SupabaseConnector | null {
    return this.connector;
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): ShowStackSyncStatus {
    const baseStatus: ShowStackSyncStatus = {
      state: 'disconnected',
      connected: false,
      hasPendingChanges: false,
      pendingUploadCount: 0,
      lastSyncedAt: this.lastSyncedAt,
      error: this.currentError,
      isAuthenticated: this.connector?.isAuthenticated() ?? false,
    };

    if (!this.db) {
      return baseStatus;
    }

    const status = this.db.currentStatus;

    // Determine state
    let state: ShowStackSyncStatus['state'] = 'disconnected';
    const dataFlow = status?.dataFlowStatus;
    if (this.currentError) {
      state = 'error';
    } else if (status?.connected) {
      if (dataFlow?.downloading || dataFlow?.uploading) {
        state = 'syncing';
      } else {
        state = 'connected';
      }
    } else if (status?.connecting) {
      state = 'connecting';
    }

    return {
      state,
      connected: status?.connected ?? false,
      hasPendingChanges:
        (status?.dataFlowStatus?.uploading ?? false) || status?.hasSynced === false,
      pendingUploadCount: 0, // PowerSync doesn't expose this directly
      lastSyncedAt: this.lastSyncedAt,
      error: this.currentError,
      isAuthenticated: this.connector?.isAuthenticated() ?? false,
    };
  }

  /**
   * Check if there are pending changes to upload
   */
  async hasPendingChanges(): Promise<boolean> {
    if (!this.db) return false;

    const transaction = await this.db.getNextCrudTransaction();
    const hasPending = transaction !== null;

    // Don't consume the transaction
    if (transaction) {
      // Note: In a real implementation, we'd want to peek without consuming
      // For now, this is a simple check
    }

    return hasPending;
  }

  /**
   * Subscribe to sync status changes
   * Returns unsubscribe function
   */
  onStatusChange(listener: SyncStatusListener): () => void {
    this.statusListeners.push(listener);

    // Immediately notify with current status
    try {
      listener(this.getSyncStatus());
    } catch (error) {
      logger.error('[PowerSyncService] Status listener error on subscribe:', error);
    }

    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatusListeners(): void {
    const status = this.getSyncStatus();
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        logger.error('[PowerSyncService] Status listener error:', error);
      }
    });
  }

  /**
   * Execute a read query on the local database
   */
  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error('PowerSync not initialized');
    }

    const result = await this.db.getAll<T>(sql, params);
    return result;
  }

  /**
   * Execute a write operation
   * Changes are automatically queued for sync
   */
  async execute(sql: string, params: unknown[] = []): Promise<void> {
    if (!this.db) {
      throw new Error('PowerSync not initialized');
    }

    await this.db.execute(sql, params);
  }

  /**
   * Execute multiple operations in a transaction
   */
  async transaction<T>(
    callback: (tx: { execute: (sql: string, params?: unknown[]) => Promise<void> }) => Promise<T>,
  ): Promise<T> {
    if (!this.db) {
      throw new Error('PowerSync not initialized');
    }

    return this.db.writeTransaction(async (tx) => {
      return callback({
        execute: async (sql: string, params: unknown[] = []) => {
          await tx.execute(sql, params);
        },
      });
    });
  }

  /**
   * Watch a query for changes
   * Returns unsubscribe function
   */
  watch<T>(sql: string, params: unknown[], callback: (results: T[]) => void): () => void {
    if (!this.db) {
      throw new Error('PowerSync not initialized');
    }

    const abortController = new AbortController();

    // Start watching
    (async () => {
      try {
        for await (const result of this.db!.watch(sql, params, {
          signal: abortController.signal,
        })) {
          callback(result.rows?._array ?? []);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          logger.error('[PowerSyncService] Watch error:', error);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }

  /**
   * Check if PowerSync is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Check if cloud sync is configured
   */
  isCloudConfigured(): boolean {
    return getConfig().isConfigured;
  }

  /**
   * Dispose of the service
   * Call on app shutdown
   */
  async dispose(): Promise<void> {
    if (this.db) {
      await this.disconnect();
      await this.db.close();
      this.db = null;
    }

    this.connector = null;
    this.statusListeners = [];
    this.isInitialized = false;
  }
}

// Singleton instance
let serviceInstance: PowerSyncService | null = null;

/**
 * Get the singleton PowerSyncService instance
 */
export function getPowerSyncService(): PowerSyncService {
  if (!serviceInstance) {
    serviceInstance = new PowerSyncService();
  }
  return serviceInstance;
}

/**
 * Reset the service (for testing)
 * @internal
 */
export function resetPowerSyncService(): void {
  if (serviceInstance) {
    serviceInstance.dispose();
  }
  serviceInstance = null;
}
