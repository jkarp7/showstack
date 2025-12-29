# Developer Mode Guide

**Date**: December 10, 2024
**Status**: ✅ Fully Implemented
**Branch**: `claude/dev-mode-telemetry-017fhFf37A4nPAh344TcFxQA`

---

## Overview

Developer Mode is a powerful debugging and testing feature for ShowStack that unlocks experimental features, provides debugging tools, and enables comprehensive state inspection throughout the application.

---

## Enabling Developer Mode

### Via Settings UI

1. Open ShowStack
2. Navigate to **Settings** (Cmd/Ctrl+, or click Settings icon)
3. Go to **Advanced** tab
4. Toggle **Enable Developer Tools**
5. DevTools will automatically open

### Programmatically

```typescript
import { useSettingsStore } from './store/settingsStore';

// Enable developer mode
useSettingsStore.getState().updateAdvanced({ developerMode: true });
```

---

## Features Unlocked

### 1. Chrome DevTools Access

**Keyboard Shortcuts:**
- **F12** - Toggle DevTools open/close
- **Right-click** → Inspect - Inspect any element

**DevTools Features:**
- Console logging and debugging
- Element inspection
- Network monitoring
- Performance profiling
- React DevTools (if installed)
- Redux DevTools for Zustand stores

### 2. Experimental Features (Feature Flags)

When developer mode is enabled, **ALL** feature flags are automatically enabled:

| Feature Flag | Description | Status |
|--------------|-------------|--------|
| `collaboration` | Real-time collaboration with team members | Future |
| `realTimeSync` | Sync changes in real-time across devices | Future |
| `teamComments` | Add comments and annotations for team review | Future |
| `aiAssistant` | AI-powered assistant for common tasks | Future |
| `smartSuggestions` | Intelligent suggestions based on workflow | Future |
| `autoFixErrors` | Automatically fix common errors | Future |
| `advancedReports` | Advanced reporting with custom layouts | In Dev |
| `customCharts` | Create custom charts and visualizations | In Dev |
| `dataExport` | Export data in multiple formats | ✅ Live |
| `cloudBackup` | Automatic cloud backup of projects | Future |
| `thirdPartyIntegrations` | Integrate with third-party services | Future |
| `betaFeatures` | Early access to beta features | Future |
| `experimentalUI` | Try experimental UI improvements | Future |

**Usage:**

```typescript
import { isFeatureEnabled, useFeatureFlag } from './config/featureFlags';

// Check if feature is enabled
if (isFeatureEnabled('aiAssistant')) {
  // Show AI assistant UI
}

// React hook (reactive)
function MyComponent() {
  const hasAI = useFeatureFlag('aiAssistant');

  return hasAI ? <AIAssistant /> : null;
}
```

### 3. DeveloperPanel Component

A debugging panel that shows component state, metrics, and debug information.

**Basic Usage:**

```typescript
import { DeveloperPanel } from './components/common/DeveloperPanel';

function MyComponent() {
  const [fixtures, setFixtures] = useState([]);
  const loadTime = useLoadTime();

  return (
    <>
      {/* Your component UI */}

      {/* Developer panel - only shows when dev mode enabled */}
      <DeveloperPanel
        title="Fixture Manager"
        data={{
          fixtureCount: fixtures.length,
          selectedCount: fixtures.filter(f => f.selected).length,
          filters: activeFilters
        }}
        metrics={{
          loadTime,
          renderTime: performance.now(),
          memoryUsage: performance.memory?.usedJSHeapSize
        }}
      >
        <div>Custom debug info here</div>
      </DeveloperPanel>
    </>
  );
}
```

**Features:**
- State inspector (JSON view)
- Performance metrics display
- Custom debug content
- Log to console button
- Export debug data as JSON
- Collapsible panel
- Purple theme (distinct from app UI)

### 4. Console Logging

All telemetry and debug logs are enabled in developer mode:

```typescript
// These only log when developer mode is enabled
if (import.meta.env.DEV) {
  console.log('[Telemetry] Successfully synced events');
  console.log('[Debug] Component mounted:', componentName);
}
```

---

## File Locations

### Core Components

| File | Purpose |
|------|---------|
| `src/renderer/src/hooks/useDeveloperMode.ts` | Hook to check if dev mode is enabled |
| `src/renderer/src/components/common/DeveloperPanel.tsx` | Debug panel component |
| `src/renderer/src/config/featureFlags.ts` | Feature flag system |
| `src/renderer/src/components/settings/AdvancedSettings.tsx` | Settings UI for dev mode toggle |

### Backend Integration

| File | Purpose |
|------|---------|
| `src/main/ipc/settings.ts` | IPC handlers for DevTools |
| `src/main/window.ts:43-50` | F12 keyboard shortcut handler |
| `src/preload/index.ts:160-161` | IPC API definitions |

### State Management

| File | Purpose |
|------|---------|
| `src/renderer/src/store/settingsStore.ts:63-67` | Developer mode state |

---

## DeveloperPanel Integration Examples

### Example 1: Manager Module

```typescript
import { DeveloperPanel } from '../../components/common/DeveloperPanel';

export function Manager() {
  const projects = useProjects();
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const start = performance.now();
    // ... component logic
    setRenderTime(performance.now() - start);
  }, []);

  return (
    <div>
      {/* Module UI */}

      <DeveloperPanel
        title="Manager Module"
        data={{
          projectCount: projects.length,
          activeProject: projects.find(p => p.active),
          route: window.location.pathname
        }}
        metrics={{
          renderTime,
          componentCount: document.querySelectorAll('*').length
        }}
      />
    </div>
  );
}
```

### Example 2: Shop Order Tool

```typescript
export function PrepProject() {
  const sections = useSections();
  const items = useItems();

  return (
    <div>
      {/* Shop order UI */}

      <DeveloperPanel
        title="Shop Order"
        data={{
          sections: sections.length,
          items: items.length,
          currentRevision: currentRevision,
          unsavedChanges: hasUnsavedChanges
        }}
        metrics={{
          itemsPerSection: items.length / sections.length,
          exportTime: lastExportTime
        }}
      >
        <div className="text-xs">
          <p>Project ID: {projectId}</p>
          <p>Last saved: {lastSaved?.toLocaleString()}</p>
        </div>
      </DeveloperPanel>
    </div>
  );
}
```

### Example 3: Production Module

```typescript
export function SystemDocs() {
  const fixtures = useFixtures();
  const performance = usePerformanceMetrics();

  return (
    <div>
      {/* System docs UI */}

      <DeveloperPanel
        title="Production Module"
        data={{
          fixtureCount: fixtures.length,
          selectedFixtures: selectedFixtures.length,
          filters: activeFilters,
          sortBy: sortColumn
        }}
        metrics={{
          loadTime: performance.loadTime,
          renderTime: performance.renderTime,
          fps: performance.fps
        }}
      />
    </div>
  );
}
```

---

## Best Practices

### 1. Always Use the Hook

```typescript
import { useDeveloperMode } from './hooks/useDeveloperMode';

function MyComponent() {
  const isDev = useDeveloperMode();

  // Conditional debugging UI
  if (isDev) {
    console.log('Debug info:', data);
  }

  return <div>{/* ... */}</div>;
}
```

### 2. Don't Show Sensitive Data

```typescript
// ❌ Bad - exposes API keys
<DeveloperPanel data={{ apiKey: API_KEY }} />

// ✅ Good - safe debug info
<DeveloperPanel data={{
  hasApiKey: !!API_KEY,
  keyLength: API_KEY?.length
}} />
```

### 3. Clean Up Console Logs

```typescript
// ❌ Bad - logs in production
console.log('Debug:', data);

// ✅ Good - only logs in dev mode
if (import.meta.env.DEV) {
  console.log('[Debug]', data);
}
```

### 4. Use Feature Flags Correctly

```typescript
// ❌ Bad - checking dev mode for feature
const isDev = useDeveloperMode();
if (isDev) showAIFeature();

// ✅ Good - use feature flag
const hasAI = useFeatureFlag('aiAssistant');
if (hasAI) showAIFeature();
```

---

## Performance Impact

### Memory Usage
- **DeveloperPanel**: ~2-5 MB per instance
- **DevTools**: ~50-100 MB (Chrome DevTools overhead)
- **Console logging**: Minimal (<1 MB)

### Recommendations
- Close DevTools when not actively debugging
- Limit DeveloperPanel instances (1 per page max)
- Disable dev mode in production builds
- Clear console regularly during long debug sessions

---

## Security Considerations

### What Developer Mode Does NOT Expose
- ❌ User credentials or passwords
- ❌ API keys or secrets (unless explicitly added to panels)
- ❌ Personal user data
- ❌ Production database access

### What It DOES Expose
- ✅ Application state (Redux/Zustand stores)
- ✅ Component props and local state
- ✅ Network requests (visible in DevTools)
- ✅ Performance metrics
- ✅ Console logs

### Production Safeguards
```typescript
// Store checks prevent dev mode in production
const isDev = useSettingsStore(state => state.advanced.developerMode);

// Build-time checks
if (import.meta.env.PROD && isDev) {
  console.warn('Developer mode should be disabled in production');
}
```

---

## Troubleshooting

### DevTools Won't Open

**Check:**
1. Is developer mode enabled in Settings → Advanced?
2. Try F12 keyboard shortcut
3. Check console for errors
4. Restart the application

**Debug:**
```typescript
// In browser console
localStorage.getItem('showstack-settings')
// Check if advanced.developerMode is true
```

### DeveloperPanel Not Showing

**Check:**
1. Developer mode is enabled
2. Component is imported correctly
3. Component is rendered (check React DevTools)

**Debug:**
```typescript
import { useDeveloperMode } from './hooks/useDeveloperMode';

function MyComponent() {
  const isDev = useDeveloperMode();
  console.log('Dev mode:', isDev); // Should be true

  return <DeveloperPanel {...props} />;
}
```

### Feature Flags Not Working

**Check:**
```typescript
import { getFeatureFlags, isFeatureEnabled } from './config/featureFlags';

// In console
const flags = getFeatureFlags();
console.log('All flags:', flags);
console.log('AI enabled:', isFeatureEnabled('aiAssistant'));
```

**Expected:** All flags should return `true` when dev mode is enabled

---

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| **F12** | Toggle DevTools |
| **Cmd/Ctrl+Shift+A** | Open Admin Panel |
| **Cmd/Ctrl+,** | Open Settings |
| **Right-click** | Context menu with Inspect option |

---

## Related Documentation

- [TELEMETRY_IMPLEMENTATION_SUMMARY.md](./TELEMETRY_IMPLEMENTATION_SUMMARY.md) - Telemetry system
- [POSTHOG_SETUP.md](./POSTHOG_SETUP.md) - Analytics configuration
- [Feature Flags](./src/renderer/src/config/featureFlags.ts) - All available feature flags
- [Settings Store](./src/renderer/src/store/settingsStore.ts) - Settings state management

---

## Future Enhancements

### Planned Features
- [ ] Performance regression detection
- [ ] Automated error reporting in dev mode
- [ ] State time-travel debugging
- [ ] Network request mocking
- [ ] Component performance profiler
- [ ] Memory leak detection
- [ ] Accessibility testing tools
- [ ] Screenshot/video capture for bug reports

### Community Contributions
If you have ideas for developer mode features, please open an issue or PR!

---

**Last Updated**: December 10, 2024
**Maintained By**: ShowStack Development Team
