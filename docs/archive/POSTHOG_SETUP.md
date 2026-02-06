# PostHog Analytics Setup Guide

**Date**: December 10, 2024
**Status**: ✅ Configured and Ready

---

## Overview

PostHog is now fully integrated with ShowStack for privacy-first, anonymous analytics. Users must opt-in via the consent dialog on first launch.

---

## Configuration

### Environment Variables

PostHog is configured via environment variables in `.env.local`:

```bash
# PostHog Analytics (US Cloud)
VITE_POSTHOG_KEY=phc_YOUR_PROJECT_API_KEY_HERE

# App Version
VITE_APP_VERSION=0.1.0-alpha
```

**Files**:

- `.env.local` - Local development (gitignored, contains actual key)
- `.env.example` - Template for others (checked into git)

### PostHog Project Details

- **Account**: ShowStack Analytics
- **Project**: ShowStack Production
- **Region**: US Cloud (https://us.i.posthog.com)
- **API Key**: `phc_YOUR_PROJECT_API_KEY_HERE` (stored in `.env.local`, not in git)
- **Dashboard**: https://us.posthog.com/project/[project_id]

---

## How It Works

### 1. User Consent Flow

1. User launches ShowStack for the first time
2. Splash screen shows
3. After splash, ConsentDialog appears asking for permission
4. User can opt-in or skip
5. Choice is saved to localStorage
6. If opted-in, telemetry starts tracking events

### 2. Event Collection

**Local Storage**:

- All events are stored in localStorage first
- Events include: event name, timestamp, properties, anonymousId, appVersion, platform, sessionId
- Data persists even if PostHog sync fails

**Batching**:

- Events are batched (50 events or 60 seconds)
- Automatic flush before app closes
- Retry on failure (unsynced events remain in localStorage)

### 3. PostHog Sync

**Endpoint**: `https://us.i.posthog.com/batch/`

**Request Format**:

```json
{
  "api_key": "phc_YOUR_PROJECT_API_KEY_HERE",
  "batch": [
    {
      "event": "app_opened",
      "properties": {
        "platform": "MacIntel",
        "$app_version": "0.1.0-alpha",
        "$os": "MacIntel",
        "$session_id": "uuid-here"
      },
      "timestamp": "2024-12-10T12:00:00.000Z",
      "distinct_id": "anonymous-uuid-here"
    }
  ]
}
```

**Special Properties**:

- `$app_version` - App version from environment
- `$os` - Operating system/platform
- `$session_id` - Unique per app launch
- `distinct_id` - Anonymous UUID (never tied to user identity)

---

## Events Tracked

### App Lifecycle

```typescript
app_opened
├── platform: string
├── userAgent: string
└── viewport: { width, height }

app_closed
├── sessionDuration: number (seconds)
└── sessionDurationMinutes: number
```

### Module Usage

```typescript
module_opened
├── module: 'manager' | 'prep' | 'production'
└── timestamp

module_closed
├── module: string
└── duration: number (seconds)
```

### Future Events (to be implemented)

- Shop order creation and export
- Fixture management operations
- Settings changes
- Errors and performance metrics

---

## Privacy Compliance

### What We Collect

- ✅ Feature usage
- ✅ Performance metrics
- ✅ Error reports
- ✅ App version and platform
- ✅ Anonymous user ID (UUID)

### What We DON'T Collect

- ❌ Names or email addresses
- ❌ Project content or data
- ❌ File names or paths
- ❌ IP addresses (PostHog feature can be disabled)
- ❌ Any PII (personally identifiable information)

### User Controls

- ✅ Opt-in only (disabled by default)
- ✅ Easy opt-out in Settings → Advanced → Privacy
- ✅ Export all collected data
- ✅ Delete all collected data
- ✅ View anonymous ID
- ✅ Configurable data retention (default: 90 days)

---

## Monitoring & Dashboard

### PostHog Dashboard Access

1. Go to https://us.posthog.com
2. Log in with ShowStack account
3. Select "ShowStack Production" project

### Key Metrics to Watch

**User Engagement**:

- Daily/Weekly/Monthly Active Users
- Session duration
- App open/close frequency

**Feature Usage**:

- Most used modules
- Shop order creation rate
- Export frequency

**Performance**:

- App load times
- Rendering performance
- Error rates

**User Journey**:

- Module navigation paths
- Feature adoption funnel
- Drop-off points

---

## Testing

### Local Testing

1. **Start app in development**:

```bash
npm run dev
```

2. **Trigger events**:

- Open app (app_opened)
- Navigate to modules (module_opened)
- Close app (app_closed)

3. **Check console**:

```
[Telemetry] Successfully synced 3 events to PostHog
```

4. **Verify in PostHog**:

- Go to PostHog dashboard
- Navigate to "Events" or "Live Events"
- Should see events appearing in real-time

### Privacy Testing

1. **Disable telemetry**:

- Go to Settings → Advanced → Privacy
- Turn off "Enable Telemetry"

2. **Trigger events**:

- Navigate around the app

3. **Verify no sync**:

- Console should not show any PostHog sync messages
- PostHog dashboard should not receive events

---

## Troubleshooting

### Events Not Appearing in PostHog

**Check**:

1. Is telemetry enabled in settings?
2. Is VITE_POSTHOG_KEY set in .env.local?
3. Is the app using the environment variable? (Check browser console)
4. Are there network errors in browser DevTools?
5. Is the PostHog API key correct?

**Debug**:

```typescript
// In browser console
localStorage.getItem('showstack-telemetry-events');
// Should show stored events

// Check settings
localStorage.getItem('showstack-settings');
// Check privacy.telemetryEnabled
```

### Network Errors

**CORS Issues**:

- PostHog US Cloud (https://us.i.posthog.com) has CORS enabled
- If using self-hosted PostHog, ensure CORS is configured

**Rate Limiting**:

- Free tier: 1M events/month
- If hitting limits, events will fail to sync but remain in localStorage

### Events Syncing but Not Batching

**Check flush interval**:

```typescript
// src/renderer/src/services/telemetry.ts
private readonly FLUSH_INTERVAL = 60000; // 60 seconds
```

**Force flush**:

```typescript
// In browser console
window.telemetry?.flush();
```

---

## Development vs Production

### Development

- Console logging enabled
- PostHog key from `.env.local`
- Events sync immediately for testing

### Production

- No console logging
- PostHog key embedded during build
- Events batch normally (50 events or 60 seconds)

---

## Data Retention & Cleanup

### Local Data

- Stored in localStorage
- Retention policy: 90 days (configurable)
- Automatic cleanup of old synced events
- Unsynced events kept regardless of age

### PostHog Data

- PostHog retention based on plan (default: 7 years on paid plans)
- Can be configured in PostHog project settings
- Data can be deleted via PostHog API or dashboard

---

## Next Steps

### Immediate

- ✅ PostHog integrated and configured
- ✅ API key set in .env.local
- ⬜ Test with actual app usage
- ⬜ Verify events appearing in dashboard

### Short-term

- ⬜ Add more event tracking throughout app
- ⬜ Create custom dashboards in PostHog
- ⬜ Set up alerts for errors
- ⬜ Monitor user adoption

### Long-term

- ⬜ A/B testing with PostHog experiments
- ⬜ Session replay (if privacy acceptable)
- ⬜ Custom funnels for feature adoption
- ⬜ Performance regression alerts

---

## Additional Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog API Reference](https://posthog.com/docs/api)
- [Privacy Best Practices](https://posthog.com/docs/privacy)
- [GDPR Compliance](https://posthog.com/docs/privacy/gdpr)

---

**Last Updated**: December 10, 2024
**Status**: Production Ready ✅
