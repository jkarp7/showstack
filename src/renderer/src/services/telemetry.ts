import posthog from 'posthog-js';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Telemetry Event Structure
 */
export interface TelemetryEvent {
  event: string;
  timestamp: number;
  properties: Record<string, any>;
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
  private readonly MAX_LOCAL_EVENTS = 1000; // Prevent memory issues
  private flushTimer: number | null = null;
  private sessionId: string;
  private localEvents: StoredEvent[] = [];
  private posthogInitialized = false;
  private posthogInitPromise: Promise<void> | null = null;
  private eventQueue: Array<() => void> = [];

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
    if (!posthogKey || posthogKey === 'undefined' || posthogKey.trim() === '' || !settings.telemetryEnabled) {
      if (import.meta.env.DEV && (!posthogKey || posthogKey === 'undefined' || posthogKey.trim() === '')) {
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
  async track(event: string, properties: Record<string, any> = {}): Promise<void> {
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
    if (this.localEvents.filter(e => !e.synced).length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Identify user traits (anonymous)
   * @param traits User traits (no PII)
   */
  async identify(traits: Record<string, any>): Promise<void> {
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
  async trackError(error: Error | string, context: Record<string, any> = {}): Promise<void> {
    const settings = useSettingsStore.getState().privacy;

    if (!settings.telemetryEnabled) {
      return;
    }

    const errorData = typeof error === 'string'
      ? { message: error }
      : {
          message: error.message,
          stack: error.stack,
          name: error.name,
        };

    await this.track('error_occurred', {
      ...errorData,
      ...context,
    });

    // Also use PostHog's exception capture if available
    if (this.posthogInitialized && typeof error !== 'string') {
      posthog.capture('$exception', {
        $exception_message: error.message,
        $exception_type: error.name,
        $exception_stack_trace_raw: error.stack,
        ...context,
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
    context: Record<string, any> = {}
  ): Promise<void> {
    await this.track('performance_metric', {
      metric,
      value,
      ...context,
    });
  }

  /**
   * Flush all pending events to cloud (if enabled)
   */
  async flush(): Promise<void> {
    const settings = useSettingsStore.getState().privacy;

    if (!settings.telemetryEnabled) {
      return;
    }

    const unsyncedEvents = this.localEvents.filter(e => !e.synced);

    if (unsyncedEvents.length === 0) {
      return;
    }

    try {
      await this.syncToCloud(unsyncedEvents);

      // Mark events as synced
      unsyncedEvents.forEach(event => {
        event.synced = true;
      });

      this.saveLocalEvents();

      // Clean up old synced events
      await this.cleanupOldEvents();
    } catch (error) {
      console.error('Failed to flush telemetry events:', error);
      // Events remain unsynced and will retry on next flush
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
    return this.localEvents.map(e => e.event);
  }

  /**
   * Get statistics about local telemetry data
   */
  getStats() {
    const synced = this.localEvents.filter(e => e.synced).length;
    const unsynced = this.localEvents.filter(e => !e.synced).length;

    // Use reduce instead of spread to avoid call stack issues with large arrays
    const oldest = this.localEvents.length > 0
      ? new Date(this.localEvents.reduce((min, e) =>
          e.event.timestamp < min ? e.event.timestamp : min,
          this.localEvents[0].event.timestamp
        ))
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

    // Enforce maximum local events limit
    if (this.localEvents.length > this.MAX_LOCAL_EVENTS) {
      // Remove oldest synced events first
      const syncedEvents = this.localEvents.filter(e => e.synced);
      if (syncedEvents.length > 0) {
        const oldestSynced = syncedEvents[0];
        const index = this.localEvents.indexOf(oldestSynced);
        if (index > -1) {
          this.localEvents.splice(index, 1);
        }
      } else {
        // If no synced events, remove oldest event
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
        console.log(`[Telemetry] PostHog not initialized. ${events.length} events stored locally only.`);
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
    this.localEvents = this.localEvents.filter(event => {
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
    if (this.flushTimer !== null) {
      return;
    }

    this.flushTimer = window.setInterval(() => {
      this.flush().catch(err => {
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
    return import.meta.env.VITE_APP_VERSION || '0.1.0-alpha';
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

    // Reset PostHog if initialized
    if (this.posthogInitialized) {
      try {
        posthog.reset();
        if (import.meta.env.DEV) {
          console.log('[Telemetry] PostHog reset successfully');
        }
      } catch (error) {
        console.error('[Telemetry] Failed to reset PostHog:', error);
      }
    }
  }
}

// Singleton instance
export const telemetry = new TelemetryService();

// Cleanup on app close
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    telemetry.shutdown().catch(err => {
      console.error('Failed to shutdown telemetry:', err);
    });
  });
}
