# ShowStack Module-Based Licensing System

Complete module-based licensing system for ShowStack with offline-first validation, tier-based feature differentiation, and graceful degradation.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Tier Comparison](#tier-comparison)
- [Security](#security)
- [Development](#development)

## Overview

The licensing system provides:

- **Offline-First**: 14-day grace period, non-blocking verification
- **Module-Based**: Lighting, Sound, Video, Production Management, Touring, Producer modules
- **Tier-Based Features**: Professional, Student, Institutional, Demo tiers
- **Demo Mode**: Restricted local-only access for unauthenticated users
- **Graceful Degradation**: Read-only mode on expiration (not lockout)
- **Smart Warnings**: 7-day expiration alerts

## Installation

The licensing system is integrated into the main ShowStack application. To ensure it works properly:

1. **Install dependencies** (requires network access):

   ```bash
   npm install lucide-react
   ```

2. **Database is auto-initialized** on first run (better-sqlite3)

3. **No additional setup required** - the system is ready to use!

## Quick Start

### Using License Status Banner

```tsx
import { LicenseBanner } from './components/License/LicenseBanner';
import { useUser } from './hooks/useUser';

function App() {
  const { status } = useUser();

  return (
    <div>
      {status && <LicenseBanner status={status} />}
      {/* Rest of your app */}
    </div>
  );
}
```

### Checking Module Access

```tsx
import { useModuleAccess } from './hooks/useUser';
import { UpgradePrompt } from './components/License/UpgradePrompt';

function LightingModule() {
  const { hasAccess, loading } = useModuleAccess('lighting');

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <UpgradePrompt module="lighting" />;

  return <LightingApp />;
}
```

### Gating a Feature

```tsx
import { useFeature } from './hooks/useFeature';

function ExportPanel() {
  const { enabled } = useFeature('lighting', 'advancedExport');

  return (
    <div>
      {enabled ? <AdvancedExportToolbar /> : <p>Advanced export available in Professional plan</p>}
    </div>
  );
}
```

### Enforcing Read-Only Mode

```tsx
import { useEditPermission } from './hooks/useEditPermission';

function FixtureForm() {
  const { canEdit } = useEditPermission();

  return (
    <input
      disabled={!canEdit}
      placeholder={canEdit ? 'Edit fixture' : 'Read-only (license expired)'}
    />
  );
}
```

## Architecture

### Components

```
src/
├── shared/types/
│   ├── license.types.ts      # Type definitions
│   └── settings.types.ts     # Settings types
├── main/
│   ├── database/
│   │   ├── schema.ts         # SQL schema (includes license tables)
│   │   └── queries/
│   │       ├── license.ts    # License CRUD
│   │       └── settings.ts   # Settings CRUD
│   ├── services/
│   │   ├── LicenseService.ts        # Core license logic
│   │   ├── SettingsService.ts       # Settings management
│   │   └── BackgroundVerifier.ts    # Periodic verification
│   └── ipc/
│       └── license.ts        # IPC handlers
├── preload/
│   └── index.ts             # IPC bridge
└── renderer/src/
    ├── hooks/
    │   ├── useUser.ts               # License & status
    │   ├── useModuleAccess.ts       # Module access check
    │   ├── useFeature.ts            # Feature access check
    │   ├── useEditPermission.ts     # Edit permission
    │   └── useSettings.ts           # Settings management
    └── components/License/
        ├── LicenseBanner.tsx        # Warning banner
        ├── ModuleSelector.tsx       # Module switcher
        ├── UpgradePrompt.tsx        # Upgrade CTA
        └── Account/
            ├── AccountDialog.tsx         # Main dialog
            ├── ProfileSection.tsx        # User profile
            ├── LicenseSection.tsx        # License info
            └── SubscriptionSection.tsx   # Billing info
```

### Data Flow

```
1. App starts -> Database initialized -> Background verifier starts
2. Renderer requests license status -> IPC -> LicenseService -> Database
3. LicenseService checks:
   - Is license expired?
   - Is verification stale (>14 days offline)?
   - Is expiration approaching (<7 days)?
4. Returns validation status with appropriate warnings
5. Components use hooks to gate features/modules
```

## API Reference

### Hooks

#### `useUser()`

Access user license information and status.

```tsx
const { license, status, loading, activateLicense } = useUser();

// license: UserLicense | null
// status: LicenseValidation | null
// loading: boolean
// activateLicense: (key, email, modules) => Promise<UserLicense>
```

#### `useModuleAccess(module)`

Check if user has access to a specific module.

```tsx
const { hasAccess, features, loading } = useModuleAccess('lighting');

// hasAccess: boolean
// features: ModuleFeatures | null
// loading: boolean
```

#### `useFeature(module, feature)`

Check if a specific feature is enabled.

```tsx
const { enabled, loading } = useFeature('lighting', 'advancedExport');

// enabled: boolean
// loading: boolean
```

#### `useEditPermission()`

Check if user can edit (based on license expiration).

```tsx
const { canEdit } = useEditPermission();

// canEdit: boolean
```

#### `useSettings()`

Manage application settings.

```tsx
const { settings, loading, updateSettings, resetSettings } = useSettings();

// settings: AppSettings | null
// loading: boolean
// updateSettings: (partial) => Promise<void>
// resetSettings: () => Promise<void>
```

### Components

#### `<LicenseBanner status={status} />`

Displays license warnings. Auto-hides when fully active.

#### `<ModuleSelector currentModule={module} onModuleChange={fn} />`

Module switcher with locked state indicators.

#### `<UpgradePrompt module={module} feature={feature} />`

Upgrade CTA for locked features/modules.

#### `<AccountDialog isOpen={bool} onClose={fn} />`

Full account management UI with tabs.

## Usage Examples

### Example 1: Gate Advanced Export

```tsx
function ExportPanel() {
  const { enabled } = useFeature('lighting', 'advancedExport');

  return (
    <div>
      <BasicExport />
      {enabled ? <AdvancedExportToolbar /> : <UpgradePrompt feature="Advanced Export" />}
    </div>
  );
}
```

### Example 2: Check Cloud Sync Access

```tsx
function SyncButton() {
  const { enabled } = useFeature('lighting', 'cloudSync');

  return (
    <button disabled={!enabled}>
      {enabled ? 'Sync to Cloud' : 'Cloud Sync (Professional plan)'}
    </button>
  );
}
```

### Example 3: Module Access Gate

```tsx
function SoundModule() {
  const { hasAccess, loading } = useModuleAccess('sound');

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <UpgradePrompt module="sound" />;

  return <SoundApp />;
}
```

## Tier Comparison

### Universal Features

| Feature          | Professional | Student | Institutional | Demo |
| ---------------- | ------------ | ------- | ------------- | ---- |
| Max Revisions    | 5            | 2       | 3             | 0    |
| Max Fixtures     | Unlimited    | 100     | Unlimited     | 25   |
| Multi-Discipline | Yes          | No      | Yes           | No   |
| Advanced Export  | Yes          | No      | Yes           | No   |
| Cloud Sync       | Yes          | No      | Yes           | No   |
| Priority Support | Yes          | No      | Yes           | No   |

### Modules

| Module                | Description                    |
| --------------------- | ------------------------------ |
| Lighting              | Fixture management & paperwork |
| Sound                 | Audio system design            |
| Video                 | Video & projection planning    |
| Production Management | Scheduling & logistics         |
| Touring               | Tour management & per diems    |
| Producer              | Budgeting & financial tracking |

## Security

### Email Verification

Licenses are scoped to a verified email address in Supabase Auth. An unclaimed license (where `user_id IS NULL`) is only visible to the authenticated user whose email matches the license record, enforced by Supabase Row-Level Security (RLS) policies.

Auto-claiming an unclaimed license uses a server-side RPC (`claim_license_by_email`) that runs in a transaction under the authenticated user's context. Client code cannot claim a license for a different user's email.

### CRUD Upload Error Sanitization

PowerSync CRUD upload errors are sanitized before being surfaced to callers or logs that might be visible in the renderer. Raw PostgreSQL error messages can leak schema details (constraint names, column names, table structure). `SupabaseConnector.sanitizeCrudError()` maps errors into safe generic messages:

| Error pattern                        | Safe message                            |
| ------------------------------------ | --------------------------------------- |
| `permission denied`, `rls`, `policy` | `Permission denied on <op> <table>`     |
| `not found`, `PGRST116`              | `Record not found on <op> <table>`      |
| `duplicate`, `unique`, `23505`       | `Duplicate record on <op> <table>`      |
| `foreign key`, `23503`               | `Foreign key violation on <op> <table>` |
| anything else                        | `Sync <op> failed for <table>`          |

The raw error is still logged at `logger.error` level (main-process only) for debugging, but it is never thrown or forwarded to the renderer.

### Server License Data Validation

Before writing Supabase license data to the local SQLite database, `LicenseService.verifyLicenseViaSupabase()` validates:

- Required fields (`email`, `license_key`, `tier`, `maintenance_end_date`) are present and non-empty.
- `tier` is one of the known values: `professional`, `student`, `institutional`. Unknown tiers are rejected and logged as warnings.
- `modules` is an array (not a string, null, or other unexpected type).

If any check fails, the local database is **not updated** and verification returns `false`. The existing local license (including a demo license) remains intact until a valid server response is received.

### Rate Limiting & Offline Grace

- License verification is throttled to once every **24 hours** by the background verifier.
- A **14-day offline grace period** allows the app to function without network access. After 14 days the license enters `grace` status (read/write still allowed; sync disabled). After 28 days the warning level escalates to `high`.
- A suspended license (`status: 'suspended'`) disables all access immediately, regardless of offline grace.

### Supabase HTTPS Enforcement

The `SupabaseConnector` constructor validates that the configured Supabase URL uses HTTPS. In production builds this throws an error; in development it logs a warning. This prevents credential leakage over plaintext connections.

## Development

### Testing License States

To test different license states during development:

1. **No License**: Delete from database manually
2. **Expired License**: Set `maintenanceEndDate` to past date
3. **Offline Mode**: Set `lastVerified` to 15+ days ago
4. **Approaching Expiration**: Set `maintenanceEndDate` to 5 days from now
5. **Demo Mode**: Call `licenseService.createDemoLicense()` or use the "Continue in Demo Mode" button on first launch

### Adding New Features

1. Add feature to `ModuleFeatures` interface in `license.types.ts`
2. Update `getDefaultFeaturesForTier()` in `LicenseService.ts`
3. Use `useFeature()` hook in components
4. Update documentation

### Server-Side Integration

The license verification endpoint should return:

```json
{
  "status": "active",
  "tier": "professional",
  "maintenance_end_date": "2026-12-31T00:00:00Z",
  "modules": [
    {
      "module": "lighting",
      "enabled": true,
      "features": {
        "maxRevisions": 5,
        "maxFixtures": -1,
        "multiDiscipline": true,
        "advancedExport": true,
        "cloudSync": true,
        "prioritySupport": true
      }
    }
  ]
}
```

See `LicenseService.ts:verifyLicenseViaSupabase()` for implementation details.

## Support

- **Documentation**: This file + inline code documentation
- **Issues**: GitHub repository
- **Email**: dev@showstack.app

---

**Version**: 2.0.0
**Last Updated**: February 26, 2026
**Author**: ShowStack Development Team
