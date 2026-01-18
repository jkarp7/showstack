import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import posthog from 'posthog-js';
import { telemetry, TelemetryEvent } from '../telemetry';
import { useSettingsStore } from '../../store/settingsStore';

/**
 * Telemetry Service Tests
 *
 * Target: 70%+ coverage with comprehensive test cases
 * Covers: Event tracking, PostHog integration, local storage, error handling
 */

// Mock PostHog
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    identify: vi.fn(),
    capture: vi.fn(),
    flush: vi.fn(),
    shutdown: vi.fn(),
  },
}));

// Mock settings store
vi.mock('../../store/settingsStore', () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({
      privacy: {
        telemetryEnabled: true,
        anonymousId: 'test-anonymous-id',
        dataRetentionDays: 90,
      },
    })),
  },
}));

describe('TelemetryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset telemetry state
    (telemetry as any).localEvents = [];
    (telemetry as any).posthogInitialized = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize PostHog when API key is configured and telemetry is enabled', () => {
      // Set environment variable
      import.meta.env.VITE_POSTHOG_KEY = 'test-api-key';

      // Create new instance
      const service = new (telemetry.constructor as any)();

      expect(posthog.init).toHaveBeenCalledWith('test-api-key', expect.objectContaining({
        api_host: 'https://us.i.posthog.com',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        persistence: 'localStorage',
      }));

      // Cleanup
      import.meta.env.VITE_POSTHOG_KEY = undefined;
    });

    it('should not initialize PostHog when API key is missing', () => {
      import.meta.env.VITE_POSTHOG_KEY = undefined;

      const service = new (telemetry.constructor as any)();

      expect(posthog.init).not.toHaveBeenCalled();
    });

    it('should not initialize PostHog when telemetry is disabled', () => {
      import.meta.env.VITE_POSTHOG_KEY = 'test-api-key';

      vi.mocked(useSettingsStore.getState).mockReturnValue({
        privacy: {
          telemetryEnabled: false,
          anonymousId: 'test-anonymous-id',
          dataRetentionDays: 90,
        },
      } as any);

      const service = new (telemetry.constructor as any)();

      expect(posthog.init).not.toHaveBeenCalled();

      // Cleanup
      import.meta.env.VITE_POSTHOG_KEY = undefined;
    });
  });

  describe('Event Tracking', () => {
    it('should track events when telemetry is enabled', async () => {
      await telemetry.track('test_event', { foo: 'bar' });

      const stats = telemetry.getStats();
      expect(stats.total).toBe(1);
      expect(stats.unsynced).toBe(1);
    });

    it('should not track events when telemetry is disabled', async () => {
      vi.mocked(useSettingsStore.getState).mockReturnValue({
        privacy: {
          telemetryEnabled: false,
          anonymousId: 'test-anonymous-id',
          dataRetentionDays: 90,
        },
      } as any);

      await telemetry.track('test_event', { foo: 'bar' });

      const stats = telemetry.getStats();
      expect(stats.total).toBe(0);
    });

    it('should include all required event properties', async () => {
      await telemetry.track('test_event', { custom: 'property' });

      const exported = telemetry.exportData();
      const event = exported[0];

      expect(event).toHaveProperty('event', 'test_event');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('properties.custom', 'property');
      expect(event).toHaveProperty('anonymousId', 'test-anonymous-id');
      expect(event).toHaveProperty('appVersion');
      expect(event).toHaveProperty('platform');
      expect(event).toHaveProperty('sessionId');
    });

    it('should auto-flush when batch size is reached', async () => {
      // Set batch size to 2 for testing
      (telemetry as any).BATCH_SIZE = 2;
      (telemetry as any).posthogInitialized = true;

      await telemetry.track('event_1');
      expect(posthog.capture).not.toHaveBeenCalled();

      await telemetry.track('event_2');
      expect(posthog.capture).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Tracking', () => {
    it('should track Error objects with stack trace', async () => {
      const error = new Error('Test error');
      await telemetry.trackError(error, { context: 'test' });

      const exported = telemetry.exportData();
      const event = exported[0];

      expect(event.event).toBe('error_occurred');
      expect(event.properties.message).toBe('Test error');
      expect(event.properties.name).toBe('Error');
      expect(event.properties.stack).toBeDefined();
      expect(event.properties.context).toBe('test');
    });

    it('should track error strings', async () => {
      await telemetry.trackError('Simple error message');

      const exported = telemetry.exportData();
      const event = exported[0];

      expect(event.event).toBe('error_occurred');
      expect(event.properties.message).toBe('Simple error message');
    });

    it('should use PostHog exception capture when initialized', async () => {
      (telemetry as any).posthogInitialized = true;

      const error = new Error('Test error');
      await telemetry.trackError(error);

      expect(posthog.capture).toHaveBeenCalledWith('$exception', expect.objectContaining({
        $exception_message: 'Test error',
        $exception_type: 'Error',
        $exception_stack_trace_raw: error.stack,
      }));
    });

    it('should not track errors when telemetry is disabled', async () => {
      vi.mocked(useSettingsStore.getState).mockReturnValue({
        privacy: {
          telemetryEnabled: false,
          anonymousId: 'test-anonymous-id',
          dataRetentionDays: 90,
        },
      } as any);

      await telemetry.trackError(new Error('Test error'));

      const stats = telemetry.getStats();
      expect(stats.total).toBe(0);
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics', async () => {
      await telemetry.trackPerformance('grid_render', 125.5, {
        rowCount: 100,
      });

      const exported = telemetry.exportData();
      const event = exported[0];

      expect(event.event).toBe('performance_metric');
      expect(event.properties.metric).toBe('grid_render');
      expect(event.properties.value).toBe(125.5);
      expect(event.properties.rowCount).toBe(100);
    });

    it('should track performance with minimal context', async () => {
      await telemetry.trackPerformance('pdf_export', 3500);

      const exported = telemetry.exportData();
      const event = exported[0];

      expect(event.event).toBe('performance_metric');
      expect(event.properties.metric).toBe('pdf_export');
      expect(event.properties.value).toBe(3500);
    });
  });

  describe('User Identification', () => {
    it('should identify users with traits', async () => {
      await telemetry.identify({ role: 'lighting_designer' });

      const exported = telemetry.exportData();
      const event = exported[0];

      expect(event.event).toBe('user_identified');
      expect(event.properties.role).toBe('lighting_designer');
    });

    it('should use PostHog identify when initialized', async () => {
      (telemetry as any).posthogInitialized = true;

      await telemetry.identify({ role: 'lighting_designer' });

      expect(posthog.identify).toHaveBeenCalledWith('test-anonymous-id', {
        role: 'lighting_designer',
      });
    });
  });

  describe('Local Storage', () => {
    it('should persist events to localStorage', async () => {
      await telemetry.track('test_event');

      const stored = localStorage.getItem('showstack-telemetry-events');
      expect(stored).toBeTruthy();

      const events = JSON.parse(stored!);
      expect(events).toHaveLength(1);
      expect(events[0].event.event).toBe('test_event');
    });

    it('should load events from localStorage on init', () => {
      const mockEvent = {
        id: 'test-id',
        event: {
          event: 'test_event',
          timestamp: Date.now(),
          properties: {},
          anonymousId: 'test-id',
          appVersion: '0.1.0',
          platform: 'test',
          sessionId: 'test-session',
        },
        synced: false,
      };

      localStorage.setItem('showstack-telemetry-events', JSON.stringify([mockEvent]));

      const service = new (telemetry.constructor as any)();
      const stats = service.getStats();

      expect(stats.total).toBe(1);
      expect(stats.unsynced).toBe(1);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('showstack-telemetry-events', 'invalid json');

      const service = new (telemetry.constructor as any)();
      const stats = service.getStats();

      expect(stats.total).toBe(0);
    });
  });

  describe('Event Syncing', () => {
    beforeEach(() => {
      (telemetry as any).posthogInitialized = true;
    });

    it('should sync events to PostHog', async () => {
      await telemetry.track('event_1');
      await telemetry.track('event_2');

      await telemetry.flush();

      expect(posthog.capture).toHaveBeenCalledTimes(2);
      expect(posthog.flush).toHaveBeenCalled();
    });

    it('should mark events as synced after successful flush', async () => {
      await telemetry.track('test_event');

      const statsBefore = telemetry.getStats();
      expect(statsBefore.unsynced).toBe(1);
      expect(statsBefore.synced).toBe(0);

      await telemetry.flush();

      const statsAfter = telemetry.getStats();
      expect(statsAfter.unsynced).toBe(0);
      expect(statsAfter.synced).toBe(1);
    });

    it('should not mark events as synced if flush fails', async () => {
      vi.mocked(posthog.capture).mockImplementation(() => {
        throw new Error('Network error');
      });

      await telemetry.track('test_event');

      try {
        await telemetry.flush();
      } catch (error) {
        // Expected to throw
      }

      const stats = telemetry.getStats();
      expect(stats.unsynced).toBe(1);
      expect(stats.synced).toBe(0);
    });

    it('should skip sync when PostHog is not initialized', async () => {
      (telemetry as any).posthogInitialized = false;

      await telemetry.track('test_event');
      await telemetry.flush();

      expect(posthog.capture).not.toHaveBeenCalled();
    });
  });

  describe('Data Management', () => {
    it('should export all local events', async () => {
      await telemetry.track('event_1', { foo: 'bar' });
      await telemetry.track('event_2', { baz: 'qux' });

      const exported = telemetry.exportData();

      expect(exported).toHaveLength(2);
      expect(exported[0].event).toBe('event_1');
      expect(exported[1].event).toBe('event_2');
    });

    it('should clear all local data', async () => {
      await telemetry.track('test_event');

      const statsBefore = telemetry.getStats();
      expect(statsBefore.total).toBe(1);

      await telemetry.clearLocalData();

      const statsAfter = telemetry.getStats();
      expect(statsAfter.total).toBe(0);

      const stored = localStorage.getItem('showstack-telemetry-events');
      expect(stored).toBeNull();
    });

    it('should calculate stats correctly', async () => {
      // Disable auto-flush by setting a high batch size
      (telemetry as any).BATCH_SIZE = 1000;

      await telemetry.track('event_1');
      await telemetry.track('event_2');

      // Mark one as synced
      (telemetry as any).localEvents[0].synced = true;

      const stats = telemetry.getStats();

      expect(stats.total).toBe(2);
      expect(stats.synced).toBe(1);
      expect(stats.unsynced).toBe(1);
      expect(stats.oldestEvent).toBeInstanceOf(Date);
    });

    it('should return null for oldest event when no events exist', () => {
      const stats = telemetry.getStats();
      expect(stats.oldestEvent).toBeNull();
    });
  });

  describe('Data Retention', () => {
    it('should clean up old synced events after retention period', async () => {
      const oldTimestamp = Date.now() - (91 * 24 * 60 * 60 * 1000); // 91 days ago

      // Add old synced event
      (telemetry as any).localEvents.push({
        id: 'old-event',
        event: {
          event: 'old_event',
          timestamp: oldTimestamp,
          properties: {},
          anonymousId: 'test-id',
          appVersion: '0.1.0',
          platform: 'test',
          sessionId: 'test-session',
        },
        synced: true,
      });

      // Add recent synced event
      await telemetry.track('recent_event');
      (telemetry as any).localEvents[1].synced = true;

      await (telemetry as any).cleanupOldEvents();

      const stats = telemetry.getStats();
      expect(stats.total).toBe(1);

      const exported = telemetry.exportData();
      expect(exported[0].event).toBe('recent_event');
    });

    it('should keep unsynced events regardless of age', async () => {
      const oldTimestamp = Date.now() - (91 * 24 * 60 * 60 * 1000); // 91 days ago

      (telemetry as any).localEvents.push({
        id: 'old-unsynced',
        event: {
          event: 'old_unsynced_event',
          timestamp: oldTimestamp,
          properties: {},
          anonymousId: 'test-id',
          appVersion: '0.1.0',
          platform: 'test',
          sessionId: 'test-session',
        },
        synced: false,
      });

      await (telemetry as any).cleanupOldEvents();

      const stats = telemetry.getStats();
      expect(stats.total).toBe(1);
      expect(stats.unsynced).toBe(1);
    });
  });

  describe('Shutdown', () => {
    it('should flush events and shutdown PostHog', async () => {
      (telemetry as any).posthogInitialized = true;

      await telemetry.track('test_event');
      await telemetry.shutdown();

      expect(posthog.flush).toHaveBeenCalled();
      expect(posthog.shutdown).toHaveBeenCalled();
    });

    it('should handle shutdown when PostHog is not initialized', async () => {
      (telemetry as any).posthogInitialized = false;

      await telemetry.shutdown();

      expect(posthog.shutdown).not.toHaveBeenCalled();
    });
  });

  describe('Auto-flush', () => {
    it('should start auto-flush timer on init', () => {
      const service = new (telemetry.constructor as any)();
      expect((service as any).flushTimer).toBeTruthy();
    });

    it('should stop auto-flush timer on shutdown', async () => {
      const service = new (telemetry.constructor as any)();
      const timerBefore = (service as any).flushTimer;
      expect(timerBefore).toBeTruthy();

      await service.shutdown();

      const timerAfter = (service as any).flushTimer;
      expect(timerAfter).toBeNull();
    });
  });
});
