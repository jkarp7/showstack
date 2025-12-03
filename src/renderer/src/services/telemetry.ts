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
 * - Respects user opt-in/opt-out preferences
 * - Stores events locally using IndexedDB
 * - Batches events for efficient sync
 * - Auto-flushes on interval and before app close
 */
class TelemetryService {
  private readonly STORAGE_KEY = 'showstack-telemetry-events';
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute
  private flushTimer: number | null = null;
  private sessionId: string;
  private localEvents: StoredEvent[] = [];

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.loadLocalEvents();
    this.startAutoFlush();
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
    await this.track('user_identified', traits);
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
    const oldest = this.localEvents.length > 0
      ? new Date(Math.min(...this.localEvents.map(e => e.event.timestamp)))
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
    this.saveLocalEvents();
  }

  /**
   * Sync events to cloud backend
   * TODO: Implement actual cloud sync (PostHog, custom backend, etc.)
   */
  private async syncToCloud(events: StoredEvent[]): Promise<void> {
    // For now, just log that we would sync
    // In production, this would POST to analytics backend
    if (import.meta.env.DEV) {
      console.log(`[Telemetry] Would sync ${events.length} events to cloud`);
    }

    // Example implementation for PostHog:
    // const response = await fetch('https://app.posthog.com/capture/', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     api_key: 'YOUR_POSTHOG_KEY',
    //     batch: events.map(e => ({
    //       event: e.event.event,
    //       properties: e.event.properties,
    //       timestamp: new Date(e.event.timestamp).toISOString(),
    //       distinct_id: e.event.anonymousId,
    //     })),
    //   }),
    // });

    // For now, simulate success
    return Promise.resolve();
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
    await this.flush();
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
