# ShowStack Module-Based Licensing System

Complete module-based licensing system for ShowStack with offline-first validation, tier-based feature differentiation, and graceful degradation.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Tier Comparison](#tier-comparison)
- [Development](#development)

## Overview

The licensing system provides:

- **Offline-First**: 14-day grace period, non-blocking verification
- **Module-Based**: Prep, Production, Manager, Student modules
- **Tier-Based Features**: Professional, Student, Institutional tiers
- **Graceful Degradation**: Read-only mode on expiration (not lockout)
- **Smart Warnings**: 7-day expiration alerts

## Installation

The licensing system is integrated into the main ShowStack application. To ensure it works properly:

1. **Install dependencies** (requires network access):
   ```bash
   npm install lucide-react
   ```

2. **Database is auto-initialized** on first run (sql.js)

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

function ProductionModule() {
  const { hasAccess, loading } = useModuleAccess('production');

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <UpgradePrompt module="production" />;

  return <ProductionApp />;
}
```

### Gating a Feature

```tsx
import { useFeature } from './hooks/useFeature';

function EquipmentList() {
  const { enabled } = useFeature('prep', 'bulkOperations');

  return (
    <div>
      {enabled ? (
        <BulkOperationsToolbar />
      ) : (
        <p>Bulk operations available in Professional plan</p>
      )}
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
1. App starts → Database initialized → Background verifier starts
2. Renderer requests license status → IPC → LicenseService → Database
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
const { hasAccess, features, loading } = useModuleAccess('prep');

// hasAccess: boolean
// features: ModuleFeatures | null
// loading: boolean
```

#### `useFeature(module, feature)`

Check if a specific feature is enabled.

```tsx
const { enabled, loading } = useFeature('prep', 'bulkOperations');

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

### Example 1: Gate Bulk Operations

```tsx
function EquipmentList() {
  const { enabled } = useFeature('prep', 'bulkOperations');

  return (
    <div>
      <EquipmentTable />
      {enabled ? (
        <BulkOperationsToolbar />
      ) : (
        <UpgradePrompt feature="Bulk Operations" />
      )}
    </div>
  );
}
```

### Example 2: Disable Logo Upload for Students

```tsx
function LogoUpload() {
  const { enabled } = useFeature('prep', 'logoIntegration');

  return (
    <div>
      <label>Company Logo</label>
      <input
        type="file"
        disabled={!enabled}
        className={!enabled ? 'opacity-50 cursor-not-allowed' : ''}
      />
      {!enabled && (
        <p className="text-sm text-gray-500">
          Logo integration available in Professional plan
        </p>
      )}
    </div>
  );
}
```

### Example 3: Project Limits

```tsx
function ProjectCreation() {
  const { features } = useModuleAccess('prep');
  const [projectCount, setProjectCount] = useState(2);

  const maxProjects = features?.prepFeatures?.maxProjects ?? 3;
  const canCreate = maxProjects === -1 || projectCount < maxProjects;

  return (
    <div>
      <h2>Projects ({projectCount}/{maxProjects === -1 ? '∞' : maxProjects})</h2>
      <button
        onClick={() => setProjectCount(projectCount + 1)}
        disabled={!canCreate}
      >
        Create New Project
      </button>
      {!canCreate && <UpgradePrompt feature="Unlimited Projects" />}
    </div>
  );
}
```

### Example 4: Conditional Integration Buttons

```tsx
function IntegrationButtons() {
  const { features } = useModuleAccess('production');

  return (
    <div className="flex gap-2">
      <button>Import CSV</button>

      {features?.productionFeatures?.vectorworksIntegration && (
        <button>Import from Vectorworks</button>
      )}

      {features?.productionFeatures?.etcEosIntegration && (
        <button>Sync with ETC Eos</button>
      )}

      {!features?.productionFeatures?.vectorworksIntegration && (
        <button onClick={() => {/* Show upgrade modal */}}>
          🔒 Unlock Vectorworks
        </button>
      )}
    </div>
  );
}
```

## Tier Comparison

### Universal Features

| Feature | Professional | Student | Institutional |
|---------|-------------|---------|---------------|
| Max Revisions | 5 | 2 | 3 |
| Multi-Discipline | ✅ | ❌ | ✅ |
| Advanced Export | ✅ | ❌ | ✅ |
| Cloud Sync | ✅ | ❌ | ✅ |
| Priority Support | ✅ | ❌ | ✅ |

### Production Module Features

| Feature | Professional | Student | Institutional |
|---------|-------------|---------|---------------|
| Vectorworks Integration | ✅ | ❌ | ✅ |
| ETC Eos Integration | ✅ | ❌ | ✅ |
| Paperwork Generation | ✅ | ✅ | ✅ |
| Label System | ✅ | ✅ | ✅ |
| Power Management | ✅ | ❌ | ✅ |

### Manager Module Features

| Feature | Professional | Student | Institutional |
|---------|-------------|---------|---------------|
| Plaid Integration | ✅ | ❌ | ❌ |
| Multi-Show Management | ✅ | ✅ | ✅ |
| Budget Tracking | ✅ | ✅ | ✅ |
| Per Diem Calculation | ✅ | ❌ | ✅ |
| Tour Logistics | ✅ | ❌ | ✅ |

## Development

### Testing License States

To test different license states during development:

1. **No License**: Delete from database manually
2. **Expired License**: Set `expirationDate` to past date
3. **Offline Mode**: Set `lastVerified` to 15+ days ago
4. **Approaching Expiration**: Set `expirationDate` to 5 days from now

### Adding New Features

1. Add feature to appropriate `ModuleFeatures` interface in `license.types.ts`
2. Update `getDefaultFeaturesForTier()` in `LicenseService.ts`
3. Use `useFeature()` hook in components
4. Update documentation

### Server-Side Integration

The license verification endpoint should return:

```json
{
  "status": "active",
  "tier": "professional",
  "expirationDate": "2025-12-31T00:00:00Z",
  "modules": [
    {
      "module": "prep",
      "enabled": true,
      "features": { /* ... */ }
    }
  ]
}
```

See `LicenseService.ts:verifyLicenseOnline()` for implementation details.

## Support

- **Documentation**: This file + inline code documentation
- **Issues**: GitHub repository
- **Email**: dev@showstack.app

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Author**: ShowStack Development Team
