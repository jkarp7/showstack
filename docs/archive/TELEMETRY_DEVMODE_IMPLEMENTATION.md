# Developer Mode & Telemetry Implementation Plan

**Status:** Planned for future implementation
**Priority:** Medium
**Estimated Effort:** 2-3 sessions

---

## Overview

This document outlines the implementation plan for two key features:

1. Developer Mode - Advanced debugging and development tools
2. Telemetry System - Usage analytics and error tracking

---

## 1. Developer Mode Implementation

### Goal

Provide developers and advanced users with debugging tools and experimental features.

### Current State

- ✅ Toggle exists in Settings > Advanced > Developer Mode
- ✅ Stored in `settingsStore.advanced.developerMode`
- ⚠️ No features currently gated behind this flag
- ⚠️ Electron DevTools not connected to toggle

### Implementation Tasks

#### Task 1.1: Create useDeveloperMode Hook

**File:** `src/renderer/src/hooks/useDeveloperMode.ts`

```typescript
import { useSettingsStore } from '../store/settingsStore';

export function useDeveloperMode() {
  return useSettingsStore((state) => state.advanced.developerMode);
}
```

#### Task 1.2: Connect Electron DevTools

**File:** `src/main/index.ts`

- Listen for developer mode changes via IPC
- Open/close DevTools based on setting
- Add keyboard shortcut (F12) when enabled

#### Task 1.3: Add Developer Features

**Component-level features:**

- State inspector panels
- Performance metrics display
- Debug logging panels
- Feature flag toggles

**Locations to add developer tools:**

1. **Equipment Manager** (`src/renderer/src/pages/modules/Manager.tsx`)
   - Show render performance metrics
   - Display current fixture data structure
   - Grid virtualization stats

2. **Shop Order Builder** (`src/renderer/src/pages/modules/Prep.tsx`)
   - PDF generation debug info
   - Revision history viewer
   - Template variable inspector

3. **Admin Panel** (`src/renderer/src/pages/admin/AdminPanel.tsx`)
   - Database query inspector
   - License validation tester
   - Settings store viewer

**Example Implementation:**

```tsx
import { useDeveloperMode } from '../hooks/useDeveloperMode';

function EquipmentManager() {
  const isDeveloperMode = useDeveloperMode();

  return (
    <div>
      {/* Regular UI */}
      <EquipmentGrid />

      {/* Developer Tools */}
      {isDeveloperMode && (
        <DeveloperPanel>
          <h3>Debug Info</h3>
          <pre>{JSON.stringify(state, null, 2)}</pre>
          <PerformanceMetrics />
        </DeveloperPanel>
      )}
    </div>
  );
}
```

#### Task 1.4: Feature Flags System

Create a feature flags system for testing unreleased features:

**File:** `src/renderer/src/config/featureFlags.ts`

```typescript
export const featureFlags = {
  collaboration: false,
  aiAssistant: false,
  advancedReports: false,
  // Enable all in dev mode
  enableAll: () => {
    const isDev = useSettingsStore.getState().advanced.developerMode;
    return isDev;
  },
};
```

---

## 2. Telemetry System Implementation

### Goal

Collect anonymous usage data to inform product decisions and identify bugs.

### Privacy-First Approach

- ✅ Opt-in only (not enabled by default)
- ✅ Anonymous (no personal data)
- ✅ Transparent about what's collected
- ✅ Can be disabled anytime
- ✅ Local storage with cloud sync option

### Implementation Tasks

#### Task 2.1: Add Privacy Settings

**File:** `src/renderer/src/store/settingsStore.ts`

Add new privacy section:

```typescript
export interface PrivacySettings {
  telemetryEnabled: boolean;
  crashReportsEnabled: boolean;
  anonymousId: string; // Generated UUID
  dataRetentionDays: number; // How long to keep local data
}

// Add to settings store
privacy: {
  telemetryEnabled: false,
  crashReportsEnabled: false,
  anonymousId: generateUUID(),
  dataRetentionDays: 90
}
```

#### Task 2.2: Create Telemetry Service

**File:** `src/renderer/src/services/telemetry.ts`

```typescript
interface TelemetryEvent {
  event: string;
  timestamp: number;
  properties: Record<string, any>;
  anonymousId: string;
  appVersion: string;
  platform: string;
}

class TelemetryService {
  private endpoint = 'https://analytics.lytrix.com/events';
  private batchSize = 50;
  private flushInterval = 60000; // 1 minute

  async track(event: string, properties?: Record<string, any>): Promise<void>;
  async identify(traits: Record<string, any>): Promise<void>;
  async flush(): Promise<void>;
  private storeLocal(event: TelemetryEvent): Promise<void>;
  private syncToCloud(): Promise<void>;
}

export const telemetry = new TelemetryService();
```

#### Task 2.3: Choose Backend Solution

**Option A: PostHog (Recommended)**

- Free tier: 1M events/month
- Self-hostable via Docker
- Built-in dashboards and analytics
- Privacy-focused, GDPR compliant
- Effort: ~2 hours to integrate

**Option B: Custom Backend**

- Node.js + PostgreSQL
- Full control over data
- Requires maintenance
- Effort: ~1-2 days to build

**Option C: Hybrid**

- Local SQLite storage
- Optional cloud sync to PostHog
- Best of both worlds
- Effort: ~3-4 hours

#### Task 2.4: Add Consent Dialog

**File:** `src/renderer/src/components/ConsentDialog.tsx`

Show on first launch:

```tsx
<ConsentDialog>
  <h3>Help Improve ShowStack</h3>
  <p>
    We'd like to collect anonymous usage data to understand which features are most valuable and
    identify bugs.
  </p>

  <h4>What we collect:</h4>
  <ul>
    <li>✅ Which features you use</li>
    <li>✅ Error reports and crashes</li>
    <li>✅ Performance metrics</li>
  </ul>

  <h4>What we DON'T collect:</h4>
  <ul>
    <li>❌ Your name or email</li>
    <li>❌ Project content or data</li>
    <li>❌ Personal information</li>
  </ul>

  <Checkbox checked={telemetry} onChange={setTelemetry}>
    Enable anonymous analytics
  </Checkbox>

  <Checkbox checked={crashes} onChange={setCrashes}>
    Send crash reports
  </Checkbox>
</ConsentDialog>
```

#### Task 2.5: Implement Key Events

**Events to track:**

```typescript
// App lifecycle
telemetry.track('app_opened');
telemetry.track('app_closed', { sessionDuration: 3600 });

// Module usage
telemetry.track('module_opened', { module: 'production' });
telemetry.track('module_closed', { module: 'production', duration: 1200 });

// Feature usage
telemetry.track('feature_used', {
  feature: 'bulk_edit',
  itemCount: 50,
});
telemetry.track('export_completed', {
  format: 'pdf',
  pageCount: 10,
  duration: 2300,
});

// Errors
telemetry.track('error_occurred', {
  type: 'validation',
  message: 'Invalid channel number',
  component: 'FixtureEditor',
  severity: 'warning',
});

// Performance
telemetry.track('performance_metric', {
  metric: 'project_load_time',
  duration: 1200,
  fixtureCount: 500,
});

// User flows
telemetry.track('project_created', {
  template: 'touring_show',
  source: 'new_project_dialog',
});
telemetry.track('settings_changed', {
  category: 'workspace',
  setting: 'units',
  value: 'metric',
});
```

**Locations to add tracking:**

1. App.tsx - App lifecycle events
2. Module pages - Module usage
3. Feature components - Feature usage
4. Error boundaries - Error tracking
5. Settings - Configuration changes

#### Task 2.6: Create Analytics Dashboard (Admin Panel)

**File:** `src/renderer/src/pages/admin/Analytics.tsx`

Dashboard sections:

- Daily Active Users (line chart)
- Most Used Features (bar chart)
- Error Rate by Module (table)
- Performance Metrics (cards)
- User Journey Funnels (flow diagram)
- Export Data (CSV/JSON download)

#### Task 2.7: Add Privacy Settings UI

**File:** `src/renderer/src/components/settings/Privacy.tsx`

Settings panel:

- Telemetry toggle
- Crash reports toggle
- View anonymous ID
- Export local data
- Clear local data
- Link to privacy policy

---

## Implementation Order

### Phase 1: Foundation (Session 1)

1. Create `useDeveloperMode` hook
2. Add Privacy section to settings store
3. Create Telemetry service with local storage only
4. Add consent dialog
5. Implement basic events (app lifecycle, module usage)

### Phase 2: Integration (Session 2)

6. Connect Electron DevTools to developer mode
7. Add developer panels to key components
8. Set up PostHog (or custom backend)
9. Enable cloud sync for telemetry
10. Test end-to-end flow

### Phase 3: Analytics (Session 3)

11. Build analytics dashboard in admin panel
12. Add advanced events (performance, user flows)
13. Create feature flags system
14. Add Privacy settings UI
15. Documentation and testing

---

## Technical Decisions Needed

### Before Starting:

1. **Backend Choice:** PostHog Cloud, Self-hosted PostHog, or Custom?
2. **Storage:** SQLite for local events, or IndexedDB?
3. **Batch Size:** How many events before flushing to server?
4. **Retention:** How long to keep local telemetry data?

### During Implementation:

5. **Error Tracking:** Also integrate Sentry for crashes?
6. **Feature Flags:** Simple boolean or advanced percentage rollouts?
7. **Performance:** Track all renders or sample?

---

## Testing Checklist

- [ ] Developer mode toggle enables/disables features correctly
- [ ] Telemetry respects opt-in/opt-out setting
- [ ] Events are batched and sent efficiently
- [ ] Local storage doesn't grow unbounded
- [ ] Consent dialog shows on first launch only
- [ ] Privacy settings persist correctly
- [ ] DevTools keyboard shortcuts work
- [ ] No telemetry sent when disabled
- [ ] Anonymous ID is truly anonymous
- [ ] Dashboard displays data correctly

---

## Documentation Needed

1. **User Documentation:**
   - What is developer mode?
   - What data does telemetry collect?
   - How to opt-out?
   - Privacy policy update

2. **Developer Documentation:**
   - How to add telemetry events
   - How to gate features with developer mode
   - How to add feature flags
   - Dashboard API reference

---

## Success Metrics

**Developer Mode:**

- [ ] At least 3 developer features implemented
- [ ] DevTools integration working
- [ ] Feature flags system operational
- [ ] No performance impact when disabled

**Telemetry:**

- [ ] Opt-in rate > 30% (if prompted well)
- [ ] Event collection working reliably
- [ ] Dashboard showing actionable insights
- [ ] Zero privacy complaints
- [ ] < 100ms overhead per event

---

## Future Enhancements

- A/B testing framework
- Session replay (privacy-safe)
- Heatmaps (click tracking)
- Advanced funnels and cohorts
- Automated anomaly detection
- Performance regression alerts

---

## Notes

- Keep telemetry lightweight (< 5KB per event)
- Respect user privacy at all times
- Make opt-out obvious and easy
- Consider GDPR compliance if expanding internationally
- Regular security audits of telemetry pipeline
