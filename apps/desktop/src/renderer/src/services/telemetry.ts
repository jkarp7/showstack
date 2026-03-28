import posthog from 'posthog-js';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Event properties type - restricts values to primitive types for safety
 */
export type EventProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Telemetry Event Structure
 */
export interface TelemetryEvent {
  event: string;
  timestamp: number;
  properties: EventProperties;
  anonymousId: string;
  appVersion: string;
  platform: string;
  sessionId: string;
}

/**
 * Local storage structure for telemetry events
 */
interface StoredEvent {
  id: string;
  event: TelemetryEvent;
  synced: boolean;
}

/**
 * Sanitize file path to remove sensitive information
 *
 * Removes everything before /src/ or /node_modules/ to prevent
 * exposing usernames, home directories, or internal project structure.
 *
 * @param path Potentially sensitive file path
 * @returns Sanitized relative path
 *
 * @example
 * sanitizePath('/Users/john.doe/projects/showstack/src/App.tsx')
 * // Returns: 'src/App.tsx'
 */
function sanitizePath(path: string | undefined): string {
  if (!path) return '';

  // Remove everything before /src/ or /node_modules/
  const srcMatch = path.match(/\/src\/.*/);
  if (srcMatch) return srcMatch[0].slice(1); // Remove leading slash

  const nodeModulesMatch = path.match(/\/node_modules\/.*/);
  if (nodeModulesMatch) return nodeModulesMatch[0].slice(1);

  // If no match, return just the filename to be safe
  const parts = path.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * Sanitize stack trace to remove sensitive information
 *
 * - Removes absolute paths (keeps only relative paths like src/...)
 * - Truncates to first 20 lines to reduce payload size
 * - Prevents exposure of usernames and internal project structure
 *
 * @param stack Raw stack trace string
 * @returns Sanitized stack trace
 *
 * @example
 * sanitizeStackTrace(error.stack)
 * // Removes '/Users/john.doe/projects/' from all lines
 * // Keeps only 'src/components/App.tsx:45:12'
 */
function sanitizeStackTrace(stack: string | undefined): string {
  if (!stack) return '';

  const lines = stack.split('\n');
  const sanitized = lines
    .slice(0, 20) // Truncate to first 20 lines
    .map((line) => {
      // Replace absolute paths with relative paths
      return line
        .replace(/\/[^:]+\/(src\/[^:]+)/g, '$1')
        .replace(/\/[^:]+\/(node_modules\/[^:]+)/g, '$1');
    });

  return sanitized.join('\n');
}

/**
 * Telemetry Service
 *
 * Privacy-first analytics service with local storage and optional cloud sync.
 *
 * ## Architecture
 * - Respects user opt-in/opt-out preferences
 * - Stores events locally in localStorage (limited to 1,000 events)
 * - Dual-layer batching: local storage + PostHog SDK batching
 * - Auto-syncs on interval (60 seconds) and before app close
 *
 * ## PostHog SDK Integration
 * PostHog SDK handles event transmission automatically with its own batching:
 * - Events are queued in memory and sent in batches
 * - Default batch size: 10 events or 10 seconds (whichever comes first)
 * - Network failures are handled gracefully with automatic retries
 * - Events persist across page reloads via localStorage
 *
 * ## Event Flow
 * 1. Event tracked → stored locally (localStorage)
 * 2. If batch size reached (50 events) → trigger sync
 * 3. Sync: Send events to PostHog SDK via posthog.capture()
 * 4. PostHog SDK batches and transmits to server
 * 5. Mark local events as synced, clean up old events
 *
 * ## Sync Semantics
 * - Local events marked "synced" after PostHog SDK capture (not server confirmation)
 * - PostHog SDK handles server transmission and retries
 * - Old synced events auto-deleted after retention period (90 days default)
 * - Unsynced events never deleted (prevent data loss)
 * - Max 1,000 events stored locally to prevent memory issues
 *
 * ## Privacy Considerations
 * - All tracking respects telemetryEnabled setting
 * - Anonymous ID used (crypto.randomUUID)
 * - No PII tracked in event properties
 * - User can export/delete all local data
 * - PostHog API key is public (bundled in JS) - this is expected and safe
 */
class TelemetryService {
  private readonly STORAGE_KEY = 'showstack-telemetry-events';
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute
  private readonly MAX_LOCAL_EVENTS = 1000; // Total events cap (synced + unsynced)
  private readonly MAX_UNSYNCED_EVENTS = 500; // Cap on unsynced events when offline
  private flushTimer: number | null = null;
  private sessionId: string;
  private localEvents: StoredEvent[] = [];
  private unsyncedCount = 0;
  private posthogInitialized = false;
  private posthogInitPromise: Promise<void> | null = null;
  private eventQueue: Array<() => void> = [];
  private isFlushInProgress = false;

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.loadLocalEvents();
    this.posthogInitPromise = this.initializePostHog();
    this.startAutoFlush();
  }

  /**
   * Initialize PostHog SDK
   * Returns a promise that resolves when initialization is complete
   */
  private async initializePostHog(): Promise<void> {
    const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
    const settings = useSettingsStore.getState().privacy;

    // Only initialize if API key is configured and telemetry is enabled
    // Check for undefined, null, or empty string
    if (
      !posthogKey ||
      posthogKey === 'undefined' ||
      posthogKey.trim() === '' ||
      !settings.telemetryEnabled
    ) {
      if (
        import.meta.env.DEV &&
        (!posthogKey || posthogKey === 'undefined' || posthogKey.trim() === '')
      ) {
        console.log('[Telemetry] PostHog key not configured. Events will be stored locally only.');
      }
      return;
    }

    return new Promise<void>((resolve) => {
      try {
        posthog.init(posthogKey, {
          api_host: 'https://us.i.posthog.com',
          autocapture: false, // We manually track events
          capture_pageview: false, // No pageviews in desktop app
          capture_pageleave: false,
          persistence: 'localStorage',
          loaded: (posthog) => {
            // Set anonymous ID from settings
            posthog.identify(settings.anonymousId);
            this.posthogInitialized = true;

            if (import.meta.env.DEV) {
              console.log('[Telemetry] PostHog initialized successfully');
            }

            // Process queued events
            this.processEventQueue();

            resolve();
          },
        });
      } catch (error) {
        console.error('[Telemetry] Failed to initialize PostHog:', error);
        this.posthogInitialized = false;
        resolve(); // Still resolve to unblock waiting calls
      }
    });
  }

  /**
   * Process queued events after PostHog initializes
   */
  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const fn = this.eventQueue.shift();
      if (fn) fn();
    }
  }

  /**
   * Track an event
   * @param event Event name
   * @param properties Event properties (optional)
   */
  async track(event: string, properties: EventProperties = {}): Promise<void> {
    const settings = useSettingsStore.getState().privacy;

    // Respect user opt-out
    if (!settings.telemetryEnabled) {
      if (import.meta.env.DEV) {
        console.log(`[Telemetry] Event "${event}" not tracked - telemetry disabled`);
      }
      return;
    }

    const telemetryEvent: TelemetryEvent = {
      event,
      timestamp: Date.now(),
      properties,
      anonymousId: settings.anonymousId,
      appVersion: this.getAppVersion(),
      platform: this.getPlatform(),
      sessionId: this.sessionId,
    };

    if (import.meta.env.DEV) {
      console.log(`[Telemetry] Tracking event: ${event}`, properties);
    }

    await this.storeLocal(telemetryEvent);

    // Auto-flush if batch size reached
    if (this.unsyncedCount >= this.BATCH_SIZE) {
      // Wait for PostHog initialization to complete before flushing
      if (this.posthogInitPromise) {
        await this.posthogInitPromise;
      }
      await this.flush();
    }
  }

  /**
   * Identify user traits (anonymous)
   * @param traits User traits (no PII)
   */
  async identify(traits: EventProperties): Promise<void> {
    const settings = useSettingsStore.getState().privacy;

    if (!settings.telemetryEnabled) {
      return;
    }

    // Use PostHog's identify method if initialized
    if (this.posthogInitialized) {
      posthog.identify(settings.anonymousId, traits);
    }

    // Also track as an event for local storage
    await this.track('user_identified', traits);
  }

  /**
   * Track an error event with stack trace
   * @param error Error object or message
   * @param context Additional context about the error
   */
  async trackError(error: Error | string, context: EventProperties = {}): Promise<void> {
    const settings = useSettingsStore.getState().privacy;

    if (!settings.telemetryEnabled) {
      return;
    }

    // Sanitize context to remove sensitive file paths
    const sanitizedContext: EventProperties = {};
    for (const [key, value] of Object.entries(context)) {
      if (key === 'filename' && typeof value === 'string') {
        sanitizedContext[key] = sanitizePath(value);
      } else {
        sanitizedContext[key] = value;
      }
    }

    const errorData =
      typeof error === 'string'
        ? { message: error }
        : {
            message: error.message,
            stack: sanitizeStackTrace(error.stack),
            name: error.name,
          };

    await this.track('error_occurred', {
      ...errorData,
      ...sanitizedContext,
    });

    // Also use PostHog's exception capture if available
    if (this.posthogInitialized && typeof error !== 'string') {
      posthog.capture('$exception', {
        $exception_message: error.message,
        $exception_type: error.name,
        $exception_stack_trace_raw: sanitizeStackTrace(error.stack),
        ...sanitizedContext,
      });
    }
  }

  /**
   * Track a performance metric
   * @param metric Name of the performance metric
   * @param value Numeric value (e.g., duration in milliseconds)
   * @param context Additional context
   */
  async trackPerformance(
    metric: string,
    value: number,
    context: EventProperties = {},
  ): Promise<void> {
    await this.track('performance_metric', {
      metric,
      value,
      ...context,
    });
  }

  /**
   * Flush all pending events to cloud (if enabled)
   * Uses a lock to prevent race conditions from concurrent flush calls
   */
  async flush(): Promise<void> {
    const settings = useSettingsStore.getState().privacy;

    if (!settings.telemetryEnabled) {
      return;
    }

    // Prevent concurrent flushes (race condition protection)
    if (this.isFlushInProgress) {
      if (import.meta.env.DEV) {
        console.log('[Telemetry] Flush already in progress, skipping');
      }
      return;
    }

    const unsyncedEvents = this.localEvents.filter((e) => !e.synced);

    if (unsyncedEvents.length === 0) {
      return;
    }

    this.isFlushInProgress = true;

    try {
      await this.syncToCloud(unsyncedEvents);

      // Mark events as synced
      unsyncedEvents.forEach((event) => {
        event.synced = true;
      });
      this.unsyncedCount -= unsyncedEvents.length;

      this.saveLocalEvents();

      // Clean up old synced events
      await this.cleanupOldEvents();
    } catch (error) {
      console.error('Failed to flush telemetry events:', error);
      // Events remain unsynced and will retry on next flush
    } finally {
      this.isFlushInProgress = false;
    }
  }

  /**
   * Clear all local telemetry data
   */
  async clearLocalData(): Promise<void> {
    this.localEvents = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Export local telemetry data
   */
  exportData(): TelemetryEvent[] {
    return this.localEvents.map((e) => e.event);
  }

  /**
   * Get statistics about local telemetry data
   */
  getStats() {
    const synced = this.localEvents.filter((e) => e.synced).length;
    const unsynced = this.localEvents.filter((e) => !e.synced).length;

    // Use reduce instead of spread to avoid call stack issues with large arrays
    const oldest =
      this.localEvents.length > 0
        ? new Date(
            this.localEvents.reduce(
              (min, e) => (e.event.timestamp < min ? e.event.timestamp : min),
              this.localEvents[0].event.timestamp,
            ),
          )
        : null;

    return {
      total: this.localEvents.length,
      synced,
      unsynced,
      oldestEvent: oldest,
    };
  }

  /**
   * Store event locally
   */
  private async storeLocal(event: TelemetryEvent): Promise<void> {
    const storedEvent: StoredEvent = {
      id: crypto.randomUUID(),
      event,
      synced: false,
    };

    this.localEvents.push(storedEvent);
    this.unsyncedCount++;

    // Enforce cap on unsynced events to prevent unbounded growth when offline
    if (this.unsyncedCount > this.MAX_UNSYNCED_EVENTS) {
      // Drop oldest unsynced event
      const oldestUnsyncedIndex = this.localEvents.findIndex((e) => !e.synced);
      if (oldestUnsyncedIndex > -1) {
        this.localEvents.splice(oldestUnsyncedIndex, 1);
        this.unsyncedCount--;
        if (import.meta.env.DEV) {
          console.warn(
            `[Telemetry] MAX_UNSYNCED_EVENTS (${this.MAX_UNSYNCED_EVENTS}) reached — oldest unsynced event dropped`,
          );
        }
      }
    } else if (this.localEvents.length > this.MAX_LOCAL_EVENTS) {
      // Enforce total cap: remove oldest synced event first
      const syncedIndex = this.localEvents.findIndex((e) => e.synced);
      if (syncedIndex > -1) {
        this.localEvents.splice(syncedIndex, 1);
      } else {
        this.localEvents.shift();
      }
    }

    this.saveLocalEvents();
  }

  /**
   * Sync events to cloud backend (PostHog)
   *
   * This passes our locally-stored events to the PostHog SDK, which handles
   * the actual transmission to PostHog servers.
   *
   * ## PostHog SDK Batching
   * - SDK queues events in memory (default: 10 events or 10 seconds)
   * - Automatically sends batches to server in background
   * - Handles network failures with retries
   * - Persists queue to localStorage for reliability
   *
   * ## Why we store locally first
   * 1. Provides immediate feedback in Analytics Dashboard
   * 2. Ensures no data loss if PostHog SDK fails to initialize
   * 3. Allows export of all telemetry data (not just server-synced)
   * 4. Respects data retention policy (auto-cleanup after 90 days)
   *
   * @param events Array of events to sync to PostHog
   */
  private async syncToCloud(events: StoredEvent[]): Promise<void> {
    // If PostHog is not initialized, skip cloud sync (events remain local)
    if (!this.posthogInitialized) {
      if (import.meta.env.DEV) {
        console.log(
          `[Telemetry] PostHog not initialized. ${events.length} events stored locally only.`,
        );
      }
      return Promise.resolve();
    }

    try {
      // Pass events to PostHog SDK
      // SDK will batch and transmit to server automatically
      for (const storedEvent of events) {
        const e = storedEvent.event;

        posthog.capture(e.event, {
          ...e.properties,
          $app_version: e.appVersion,
          $os: e.platform,
          $session_id: e.sessionId,
          timestamp: new Date(e.timestamp).toISOString(),
        });
      }

      // Note: PostHog browser SDK sends events automatically in background
      // We mark events as "synced" after capture (not server confirmation)
      // The SDK handles retries and persistence internally

      if (import.meta.env.DEV) {
        console.log(`[Telemetry] Successfully synced ${events.length} events to PostHog`);
      }
    } catch (error) {
      // Log error but don't throw - events will remain unsynced and retry later
      console.error('[Telemetry] Failed to sync to PostHog:', error);
      throw error; // Re-throw so events remain unsynced
    }
  }

  /**
   * Clean up old events based on retention policy
   */
  private async cleanupOldEvents(): Promise<void> {
    const settings = useSettingsStore.getState().privacy;
    const retentionMs = settings.dataRetentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;

    // Remove old synced events
    this.localEvents = this.localEvents.filter((event) => {
      // Keep unsynced events regardless of age
      if (!event.synced) return true;

      // Keep synced events within retention period
      return event.event.timestamp >= cutoffTime;
    });

    this.saveLocalEvents();
  }

  /**
   * Load events from localStorage
   */
  private loadLocalEvents(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.localEvents = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load local telemetry events:', error);
      this.localEvents = [];
    }
    this.unsyncedCount = this.localEvents.filter((e) => !e.synced).length;
  }

  /**
   * Save events to localStorage
   */
  private saveLocalEvents(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.localEvents));
    } catch (error) {
      console.error('Failed to save local telemetry events:', error);
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    // Clear any existing timer to prevent memory leaks
    this.stopAutoFlush();

    this.flushTimer = window.setInterval(() => {
      this.flush().catch((err) => {
        console.error('Auto-flush failed:', err);
      });
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Stop auto-flush timer
   */
  private stopAutoFlush(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get app version from environment
   */
  private getAppVersion(): string {
    return import.meta.env.VITE_APP_VERSION || '0.2.0-alpha';
  }

  /**
   * Get platform information
   */
  private getPlatform(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.platform;
    }
    return 'unknown';
  }

  /**
   * Cleanup before app closes
   */
  async shutdown(): Promise<void> {
    this.stopAutoFlush();

    // Try to sync any remaining events
    try {
      await this.flush();
    } catch (error) {
      // Ignore flush errors on shutdown
      if (import.meta.env.DEV) {
        console.log('[Telemetry] Flush on shutdown failed (expected):', error);
      }
    }

    // Shut down PostHog — flushes any queued events before disconnecting.
    // posthog.shutdown() is preferred over posthog.reset() on quit because
    // reset() clears identity without flushing, potentially losing pending events.
    if (this.posthogInitialized) {
      try {
        await posthog.shutdown(3000); // 3s timeout so quit isn't delayed
        if (import.meta.env.DEV) {
          console.log('[Telemetry] PostHog shut down successfully');
        }
      } catch (error) {
        console.error('[Telemetry] Failed to shut down PostHog:', error);
      }
    }
  }
}

// Singleton instance
export const telemetry = new TelemetryService();

// Cleanup on app close
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    telemetry.shutdown().catch((err) => {
      console.error('Failed to shutdown telemetry:', err);
    });
  });
}
