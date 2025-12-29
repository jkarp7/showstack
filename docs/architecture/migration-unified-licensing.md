# Unified App License-Based Feature Access Migration
## Implementation Guide for Edition-Based Licensing in ShowStack

**Document Version:** 1.0
**Created:** December 29, 2025
**Purpose:** Technical guide for implementing license-based feature flags in unified ShowStack application
**Architecture:** Single application with edition-controlled feature access

---

## 🎯 Overview

This document provides implementation guidance for transforming ShowStack from a lighting-only application into a unified multi-discipline platform with edition-based licensing.

**Core Concept:**
- **One ShowStack application** (single codebase)
- **Six feature domains** (Lighting, Sound, Video, Production, Tour, Producer)
- **License-based activation** (feature flags control access)
- **Role-based UI** (show only activated features)

**User Experience:**
- User downloads one ShowStack app
- License key determines which features are activated
- UI dynamically shows/hides features based on license
- Clean, focused interface (no bloat from inactive features)
- Seamless upgrade (change license key = unlock features)

---

## 💳 Edition Structure

### Professional Editions

| Edition | Price | Activated Features | License Tier |
|---------|-------|-------------------|--------------|
| **Lighting Edition** | $249/year | Lighting | `tier-lighting` |
| **Sound Edition** | $199/year | Sound | `tier-sound` |
| **Video Edition** | $199/year | Video | `tier-video` |
| **Designer Edition** | $449/year | Lighting + Sound + Video | `tier-designer` |
| **Production Edition** | $599/year | L+S+V + Production + Tour | `tier-production` |
| **Complete Edition** | $999/year | All features | `tier-complete` |

### Student & Institutional

| Edition | Price | Activated Features | License Tier |
|---------|-------|-------------------|--------------|
| **Student Edition** | $99/year | All features | `tier-student` |
| **Institutional** | Custom | Based on contract | `tier-institutional` |

---

## 🏗️ Technical Architecture

### Feature Flag System

**File:** `src/core/licensing/featureFlags.ts`

```typescript
export enum FeatureDomain {
  LIGHTING = 'lighting',
  SOUND = 'sound',
  VIDEO = 'video',
  PRODUCTION = 'production',
  TOUR = 'tour',
  PRODUCER = 'producer'
}

export enum LicenseTier {
  TRIAL = 'tier-trial',
  LIGHTING = 'tier-lighting',
  SOUND = 'tier-sound',
  VIDEO = 'tier-video',
  DESIGNER = 'tier-designer',
  PRODUCTION = 'tier-production',
  COMPLETE = 'tier-complete',
  STUDENT = 'tier-student',
  INSTITUTIONAL = 'tier-institutional'
}

export interface LicenseConfig {
  tier: LicenseTier;
  activatedDomains: FeatureDomain[];
  expiresAt?: Date;
  maxProjects?: number;
  maxCollaborators?: number;
}

// License tier to feature domain mapping
const TIER_FEATURE_MAP: Record<LicenseTier, FeatureDomain[]> = {
  [LicenseTier.TRIAL]: [FeatureDomain.LIGHTING], // 14-day trial
  [LicenseTier.LIGHTING]: [FeatureDomain.LIGHTING],
  [LicenseTier.SOUND]: [FeatureDomain.SOUND],
  [LicenseTier.VIDEO]: [FeatureDomain.VIDEO],
  [LicenseTier.DESIGNER]: [
    FeatureDomain.LIGHTING,
    FeatureDomain.SOUND,
    FeatureDomain.VIDEO
  ],
  [LicenseTier.PRODUCTION]: [
    FeatureDomain.LIGHTING,
    FeatureDomain.SOUND,
    FeatureDomain.VIDEO,
    FeatureDomain.PRODUCTION,
    FeatureDomain.TOUR
  ],
  [LicenseTier.COMPLETE]: [
    FeatureDomain.LIGHTING,
    FeatureDomain.SOUND,
    FeatureDomain.VIDEO,
    FeatureDomain.PRODUCTION,
    FeatureDomain.TOUR,
    FeatureDomain.PRODUCER
  ],
  [LicenseTier.STUDENT]: [
    FeatureDomain.LIGHTING,
    FeatureDomain.SOUND,
    FeatureDomain.VIDEO,
    FeatureDomain.PRODUCTION,
    FeatureDomain.TOUR,
    FeatureDomain.PRODUCER
  ],
  [LicenseTier.INSTITUTIONAL]: [] // Determined by contract
};

export class LicenseManager {
  private currentLicense: LicenseConfig | null = null;

  constructor() {
    this.loadLicense();
  }

  private loadLicense(): void {
    // Load license from secure storage
    const stored = localStorage.getItem('showstack-license');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.currentLicense = this.validateLicense(parsed);
      } catch (error) {
        console.error('Failed to load license:', error);
      }
    }
  }

  private validateLicense(license: any): LicenseConfig | null {
    // Validate license signature, expiration, etc.
    // In production, this would verify a cryptographic signature
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return null; // Expired
    }
    return license;
  }

  public isFeatureEnabled(domain: FeatureDomain): boolean {
    if (!this.currentLicense) {
      return false; // No license = no features
    }

    return this.currentLicense.activatedDomains.includes(domain);
  }

  public getActivatedDomains(): FeatureDomain[] {
    return this.currentLicense?.activatedDomains || [];
  }

  public getLicenseTier(): LicenseTier | null {
    return this.currentLicense?.tier || null;
  }

  public updateLicense(licenseKey: string): Promise<boolean> {
    // Verify license key with backend
    // In production, this would make API call to license server
    return fetch('/api/license/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey })
    })
      .then(response => response.json())
      .then(data => {
        if (data.valid) {
          this.currentLicense = data.license;
          localStorage.setItem('showstack-license', JSON.stringify(data.license));
          return true;
        }
        return false;
      });
  }
}

// Singleton instance
export const licenseManager = new LicenseManager();
```

### React Hook for Feature Flags

**File:** `src/core/licensing/useFeature.ts`

```typescript
import { useEffect, useState } from 'react';
import { FeatureDomain, licenseManager } from './featureFlags';

export function useFeature(domain: FeatureDomain): boolean {
  const [enabled, setEnabled] = useState(() =>
    licenseManager.isFeatureEnabled(domain)
  );

  useEffect(() => {
    // Listen for license updates
    const handleLicenseChange = () => {
      setEnabled(licenseManager.isFeatureEnabled(domain));
    };

    window.addEventListener('license-updated', handleLicenseChange);
    return () => window.removeEventListener('license-updated', handleLicenseChange);
  }, [domain]);

  return enabled;
}

export function useActiveDomains(): FeatureDomain[] {
  const [domains, setDomains] = useState(() =>
    licenseManager.getActivatedDomains()
  );

  useEffect(() => {
    const handleLicenseChange = () => {
      setDomains(licenseManager.getActivatedDomains());
    };

    window.addEventListener('license-updated', handleLicenseChange);
    return () => window.removeEventListener('license-updated', handleLicenseChange);
  }, []);

  return domains;
}
```

### Feature-Gated Component Wrapper

**File:** `src/core/licensing/FeatureGate.tsx`

```typescript
import React from 'react';
import { FeatureDomain } from './featureFlags';
import { useFeature } from './useFeature';

interface FeatureGateProps {
  domain: FeatureDomain;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ domain, children, fallback = null }: FeatureGateProps) {
  const enabled = useFeature(domain);

  if (!enabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage example:
// <FeatureGate domain={FeatureDomain.SOUND}>
//   <SoundEquipmentGrid />
// </FeatureGate>
```

---

## 🏷️ Feature Domain Mapping

### What Gets Flagged as "Lighting Features"

All existing features in ShowStack should be flagged as `FeatureDomain.LIGHTING`:

#### Database Tables (Lighting Domain)

```typescript
// These tables are LIGHTING features
- projects (shared across all domains, no flag needed)
- fixtures ← LIGHTING
- power_systems ← LIGHTING
- dimmer_racks ← LIGHTING
- circuits ← LIGHTING
- multi_cables ← LIGHTING (Socapex specific)
- console_connections ← LIGHTING (ETC Eos)
- fixture_groups ← LIGHTING
- cue_lists ← LIGHTING (from Eos)
- cues ← LIGHTING (from Eos)
- vw_sync_history ← LIGHTING (Vectorworks)
- label_templates (shared, but initially created for lighting)
- show_branding (shared across all domains)
- revisions (shared change history)
- user_preferences (shared)
- activity_log (shared audit trail)
```

#### UI Components (Lighting Domain)

**Currently in `/src/components/`:**

```typescript
// Flag as LIGHTING domain
- components/lighting/FixtureGrid.tsx
- components/lighting/FixtureToolbar.tsx
- components/lighting/PowerManagement.tsx
- components/lighting/DimmerRackConfig.tsx
- components/lighting/CircuitManager.tsx
- components/lighting/MultiCableConfig.tsx
- components/lighting/VectorworksSync.tsx
- components/lighting/EosIntegration.tsx
```

**Shared Components (No domain flag - available to all):**

```typescript
// These remain accessible regardless of license
- components/shared/VirtualDataGrid.tsx
- components/shared/EditableCell.tsx
- components/shared/FilterBar.tsx
- components/shared/Toolbar.tsx
- components/shared/LabelDesigner.tsx
- components/shared/ReportGenerator.tsx
- components/shared/ProjectSettings.tsx
```

#### Routes (Lighting Domain)

**File:** `src/routes/index.tsx`

```typescript
import { FeatureDomain } from '@/core/licensing/featureFlags';
import { FeatureGate } from '@/core/licensing/FeatureGate';

export const routes = [
  // Shared routes (always available)
  { path: '/', component: Dashboard },
  { path: '/projects', component: ProjectList },
  { path: '/settings', component: Settings },

  // Lighting routes (gated)
  {
    path: '/lighting',
    component: () => (
      <FeatureGate domain={FeatureDomain.LIGHTING}>
        <LightingDashboard />
      </FeatureGate>
    )
  },
  {
    path: '/lighting/fixtures',
    component: () => (
      <FeatureGate domain={FeatureDomain.LIGHTING}>
        <FixtureGrid />
      </FeatureGate>
    )
  },
  {
    path: '/lighting/power',
    component: () => (
      <FeatureGate domain={FeatureDomain.LIGHTING}>
        <PowerManagement />
      </FeatureGate>
    )
  },

  // Sound routes (gated)
  {
    path: '/sound',
    component: () => (
      <FeatureGate domain={FeatureDomain.SOUND}>
        <SoundDashboard />
      </FeatureGate>
    )
  },
  // ... etc
];
```

#### Menu Items (Dynamic Based on License)

**File:** `src/components/navigation/MainMenu.tsx`

```typescript
import { useActiveDomains } from '@/core/licensing/useFeature';
import { FeatureDomain } from '@/core/licensing/featureFlags';

export function MainMenu() {
  const activeDomains = useActiveDomains();

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: HomeIcon, alwaysShow: true },
    { label: 'Projects', path: '/projects', icon: FolderIcon, alwaysShow: true },
  ];

  // Conditionally add menu items based on activated domains
  if (activeDomains.includes(FeatureDomain.LIGHTING)) {
    menuItems.push(
      { label: 'Lighting', path: '/lighting', icon: LightbulbIcon },
      { label: 'Fixtures', path: '/lighting/fixtures', icon: GridIcon },
      { label: 'Power & Dimmers', path: '/lighting/power', icon: BoltIcon },
      { label: 'Circuits', path: '/lighting/circuits', icon: NetworkIcon },
    );
  }

  if (activeDomains.includes(FeatureDomain.SOUND)) {
    menuItems.push(
      { label: 'Sound', path: '/sound', icon: SpeakerIcon },
      { label: 'Equipment', path: '/sound/equipment', icon: MicIcon },
      { label: 'Wireless Mics', path: '/sound/wireless', icon: WifiIcon },
      { label: 'Audio Patch', path: '/sound/patch', icon: CableIcon },
    );
  }

  if (activeDomains.includes(FeatureDomain.VIDEO)) {
    menuItems.push(
      { label: 'Video', path: '/video', icon: VideoIcon },
      { label: 'Projectors', path: '/video/projectors', icon: ProjectorIcon },
      { label: 'Media', path: '/video/media', icon: FilmIcon },
    );
  }

  if (activeDomains.includes(FeatureDomain.PRODUCTION)) {
    menuItems.push(
      { label: 'Production', path: '/production', icon: ClipboardIcon },
      { label: 'Schedule', path: '/production/schedule', icon: CalendarIcon },
      { label: 'Budget', path: '/production/budget', icon: DollarIcon },
    );
  }

  if (activeDomains.includes(FeatureDomain.TOUR)) {
    menuItems.push(
      { label: 'Tour', path: '/tour', icon: TruckIcon },
      { label: 'Routing', path: '/tour/routing', icon: MapIcon },
      { label: 'Logistics', path: '/tour/logistics', icon: PackageIcon },
    );
  }

  if (activeDomains.includes(FeatureDomain.PRODUCER)) {
    menuItems.push(
      { label: 'Producer', path: '/producer', icon: BriefcaseIcon },
      { label: 'Portfolio', path: '/producer/portfolio', icon: FolderOpenIcon },
      { label: 'Financials', path: '/producer/financials', icon: ChartIcon },
    );
  }

  return (
    <nav>
      {menuItems.map(item => (
        <MenuItem key={item.path} {...item} />
      ))}
    </nav>
  );
}
```

---

## 📁 Project File Structure

### Unified Project File Format

**File Extension:** `.showstack`
**Format:** SQLite database (same as current)

**Key Principle:** Project file contains ALL data for ALL domains, but UI only shows data for activated features.

**Example:**
- User has Lighting Edition license
- Opens project file that contains lighting + sound data
- **Can see:** Fixtures, power, circuits (lighting features)
- **Cannot see:** Sound equipment, wireless mics (sound features)
- **Data preserved:** Sound data remains in file, just hidden
- **Upgrade path:** If user upgrades to Designer Edition, sound data becomes visible

**Benefits:**
- Collaboration: Users with different licenses can work on same project
- Upgrade: No data migration needed when upgrading license
- Downgrade: Data preserved if user downgrades (just hidden)

**File:** `src/core/project/projectSchema.ts`

```typescript
// Project metadata includes which domains have data
export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  domainsWithData: FeatureDomain[]; // Which domains have data in this project
  version: string; // ShowStack version
}

// When opening project, check domains
export function canViewAllProjectData(
  projectDomains: FeatureDomain[],
  licenseDomains: FeatureDomain[]
): boolean {
  return projectDomains.every(domain => licenseDomains.includes(domain));
}

// Warning if project has data for inactive domains
export function getHiddenDomains(
  projectDomains: FeatureDomain[],
  licenseDomains: FeatureDomain[]
): FeatureDomain[] {
  return projectDomains.filter(domain => !licenseDomains.includes(domain));
}
```

---

## 🎨 UI/UX Guidelines

### 1. Clean Interface (No Bloat)

**DO:**
- Hide entire menu sections for inactive domains
- Remove inactive domain tabs/buttons
- Show focused view for active domains only

**DON'T:**
- Show grayed-out/disabled features (feels crippled)
- Display "Upgrade to unlock" everywhere (annoying)
- Make inactive features visible but non-clickable

**Example:**

```typescript
// GOOD: Feature doesn't appear if not licensed
{activeDomains.includes(FeatureDomain.SOUND) && (
  <MenuItem label="Sound Equipment" path="/sound/equipment" />
)}

// BAD: Feature visible but disabled
<MenuItem
  label="Sound Equipment"
  path="/sound/equipment"
  disabled={!activeDomains.includes(FeatureDomain.SOUND)}
  tooltip="Upgrade to Sound Edition to unlock"
/>
```

### 2. Upgrade Prompts (Strategic Placement)

Show upgrade prompts **only** in these contexts:

**A. Settings/Account Page:**
```typescript
<LicenseManager>
  <CurrentPlan tier="Lighting Edition" price="$249/year" />
  <AvailableUpgrades>
    <Upgrade to="Designer Edition" price="$449/year" saves="$198/year">
      Unlock Sound and Video features
    </Upgrade>
  </AvailableUpgrades>
</LicenseManager>
```

**B. Project Open Warning (if project has hidden data):**
```typescript
<ProjectOpenDialog>
  <Warning>
    This project contains Sound and Video data which is not visible
    with your Lighting Edition license.
  </Warning>
  <UpgradeButton to="Designer Edition">
    Upgrade to view all project data
  </UpgradeButton>
  <ContinueButton>Open with Lighting data only</ContinueButton>
</ProjectOpenDialog>
```

**C. Collaboration Invitation:**
```typescript
<CollaboratorInvite>
  <Info>
    This project includes Sound features.
    Invitee will need Sound Edition or higher to view sound data.
  </Info>
</CollaboratorInvite>
```

### 3. Role-Based Dashboard

**File:** `src/components/dashboard/DomainDashboard.tsx`

```typescript
export function DomainDashboard() {
  const activeDomains = useActiveDomains();

  if (activeDomains.length === 0) {
    return <TrialExpiredView />;
  }

  // Show tiles only for activated domains
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeDomains.includes(FeatureDomain.LIGHTING) && (
        <DomainTile
          title="Lighting"
          icon={<LightbulbIcon />}
          stats={{
            fixtures: 120,
            circuits: 48,
            power: '12.5kW'
          }}
          href="/lighting"
        />
      )}

      {activeDomains.includes(FeatureDomain.SOUND) && (
        <DomainTile
          title="Sound"
          icon={<SpeakerIcon />}
          stats={{
            equipment: 45,
            wirelessMics: 12,
            cables: 8
          }}
          href="/sound"
        />
      )}

      {/* Similar tiles for other domains */}
    </div>
  );
}
```

---

## 🗂️ File & Folder Structure

### Recommended Organization

```
src/
├── core/
│   ├── licensing/
│   │   ├── featureFlags.ts       ← License management
│   │   ├── useFeature.ts         ← React hooks
│   │   └── FeatureGate.tsx       ← Component wrapper
│   ├── database/
│   │   ├── schema.ts             ← Shared database schema
│   │   └── migrations/           ← Database migrations
│   ├── project/
│   │   ├── projectManager.ts     ← Project CRUD
│   │   └── projectSchema.ts      ← Project metadata
│   └── shared/                   ← Shared utilities
│
├── domains/
│   ├── lighting/
│   │   ├── components/           ← Lighting-specific UI
│   │   │   ├── FixtureGrid.tsx
│   │   │   ├── PowerManagement.tsx
│   │   │   └── ...
│   │   ├── store/                ← Lighting state management
│   │   │   └── lightingStore.ts
│   │   ├── types/                ← Lighting TypeScript types
│   │   │   └── index.ts
│   │   ├── utils/                ← Lighting utilities
│   │   └── routes.tsx            ← Lighting routes
│   │
│   ├── sound/
│   │   ├── components/
│   │   │   ├── SoundEquipmentGrid.tsx
│   │   │   ├── WirelessMicGrid.tsx
│   │   │   └── ...
│   │   ├── store/
│   │   │   └── soundStore.ts
│   │   ├── types/
│   │   ├── utils/
│   │   └── routes.tsx
│   │
│   ├── video/
│   │   └── ... (similar structure)
│   │
│   ├── production/
│   │   └── ... (similar structure)
│   │
│   ├── tour/
│   │   └── ... (similar structure)
│   │
│   └── producer/
│       └── ... (similar structure)
│
├── shared/
│   ├── components/               ← Shared UI components
│   │   ├── VirtualDataGrid.tsx   ← Used by all domains
│   │   ├── LabelDesigner.tsx
│   │   └── ...
│   ├── types/                    ← Shared types
│   └── utils/                    ← Shared utilities
│
├── routes/
│   └── index.tsx                 ← Main router with feature gates
│
└── App.tsx                       ← Main app entry
```

---

## 🔧 Implementation Steps

### Step 1: Create Licensing Infrastructure

1. Create `src/core/licensing/` directory
2. Implement `featureFlags.ts` (license manager)
3. Implement `useFeature.ts` (React hooks)
4. Implement `FeatureGate.tsx` (component wrapper)
5. Add license storage (localStorage for dev, secure storage for prod)

**Testing:**
```typescript
// Test license manager
describe('LicenseManager', () => {
  it('should activate lighting features for Lighting Edition', () => {
    const license = {
      tier: LicenseTier.LIGHTING,
      activatedDomains: [FeatureDomain.LIGHTING]
    };
    licenseManager.updateLicense(license);
    expect(licenseManager.isFeatureEnabled(FeatureDomain.LIGHTING)).toBe(true);
    expect(licenseManager.isFeatureEnabled(FeatureDomain.SOUND)).toBe(false);
  });
});
```

### Step 2: Reorganize Existing Code

1. Move lighting components to `src/domains/lighting/`
2. Move shared components to `src/shared/`
3. Update import paths throughout codebase
4. Ensure all tests still pass

**Migration script:**
```bash
# Create new directory structure
mkdir -p src/domains/lighting/components
mkdir -p src/domains/lighting/store
mkdir -p src/domains/lighting/types
mkdir -p src/shared/components

# Move existing components
mv src/components/FixtureGrid.tsx src/domains/lighting/components/
mv src/components/VirtualDataGrid.tsx src/shared/components/

# Update imports (automated with sed or codemod)
find src -name "*.tsx" -type f -exec sed -i '' \
  's|@/components/FixtureGrid|@/domains/lighting/components/FixtureGrid|g' {} +
```

### Step 3: Add Feature Gates to Routes

1. Update `src/routes/index.tsx`
2. Wrap domain routes in `<FeatureGate>`
3. Update navigation menu to be dynamic

**Example:**
```typescript
// Before
<Route path="/fixtures" component={FixtureGrid} />

// After
<Route
  path="/lighting/fixtures"
  component={() => (
    <FeatureGate domain={FeatureDomain.LIGHTING}>
      <FixtureGrid />
    </FeatureGate>
  )}
/>
```

### Step 4: Update Navigation

1. Make main menu dynamic based on active domains
2. Hide entire sections for inactive domains
3. Update dashboard to show tiles only for active domains

### Step 5: Project Metadata

1. Add `domainsWithData` field to project metadata
2. Show warning when opening project with hidden data
3. Preserve all data regardless of license (don't delete)

### Step 6: Testing & QA

1. Test each license tier:
   - Lighting Edition: Only lighting features visible
   - Designer Edition: Lighting + Sound + Video visible
   - Complete Edition: All features visible

2. Test upgrade flow:
   - Start with Lighting Edition
   - Add sound data (should fail gracefully)
   - Upgrade to Designer Edition
   - Sound features now accessible

3. Test project sharing:
   - User A (Complete Edition) creates project with all data
   - User B (Lighting Edition) opens same project
   - User B sees only lighting data
   - User B's changes to lighting data sync back

---

## 🎯 Specific Lighting Feature Flags

### Database Queries (Add Domain Check)

**Before:**
```typescript
// Get all fixtures for project
export function getFixtures(projectId: string): Fixture[] {
  return db.query('SELECT * FROM fixtures WHERE project_id = ?', [projectId]);
}
```

**After:**
```typescript
// Get fixtures only if lighting feature is enabled
export function getFixtures(projectId: string): Fixture[] {
  if (!licenseManager.isFeatureEnabled(FeatureDomain.LIGHTING)) {
    return []; // or throw error
  }
  return db.query('SELECT * FROM fixtures WHERE project_id = ?', [projectId]);
}
```

**Better Approach (declarative):**
```typescript
// Decorator pattern for feature-gated queries
import { requireFeature } from '@/core/licensing/decorators';

export class FixtureRepository {
  @requireFeature(FeatureDomain.LIGHTING)
  async getFixtures(projectId: string): Promise<Fixture[]> {
    return db.query('SELECT * FROM fixtures WHERE project_id = ?', [projectId]);
  }

  @requireFeature(FeatureDomain.LIGHTING)
  async createFixture(fixture: Partial<Fixture>): Promise<Fixture> {
    // Implementation
  }
}
```

### UI Components (Feature Gate Wrapper)

**Before:**
```typescript
// Always render fixture grid
export function LightingPage() {
  return (
    <div>
      <h1>Lighting</h1>
      <FixtureGrid />
      <PowerManagement />
    </div>
  );
}
```

**After:**
```typescript
// Only render if lighting features enabled
export function LightingPage() {
  return (
    <FeatureGate domain={FeatureDomain.LIGHTING}>
      <div>
        <h1>Lighting</h1>
        <FixtureGrid />
        <PowerManagement />
      </div>
    </FeatureGate>
  );
}
```

### Report Generation (Domain-Specific)

```typescript
export function generateReport(reportType: string, projectId: string): void {
  // Map report types to domains
  const reportDomainMap = {
    'instrument-schedule': FeatureDomain.LIGHTING,
    'channel-hookup': FeatureDomain.LIGHTING,
    'dimmer-hookup': FeatureDomain.LIGHTING,
    'input-list': FeatureDomain.SOUND,
    'wireless-plot': FeatureDomain.SOUND,
    'speaker-hang': FeatureDomain.SOUND,
    'projector-schedule': FeatureDomain.VIDEO,
    // etc...
  };

  const requiredDomain = reportDomainMap[reportType];
  if (!licenseManager.isFeatureEnabled(requiredDomain)) {
    throw new Error(`${reportType} requires ${requiredDomain} feature`);
  }

  // Generate report...
}
```

---

## 📋 Complete Lighting Features Checklist

Mark these existing features with `FeatureDomain.LIGHTING` flag:

### Database Access
- [ ] Fixture CRUD operations
- [ ] Power system CRUD
- [ ] Dimmer rack CRUD
- [ ] Circuit CRUD
- [ ] Multi-cable CRUD
- [ ] Vectorworks sync operations
- [ ] ETC Eos console operations
- [ ] Fixture group operations
- [ ] Cue list operations

### UI Components
- [ ] FixtureGrid
- [ ] FixtureToolbar
- [ ] FixtureForm (add/edit)
- [ ] PowerManagement
- [ ] DimmerRackConfig
- [ ] CircuitManager
- [ ] MultiCableConfig
- [ ] PhaseBalancing
- [ ] DMXMapVisualization
- [ ] VectorworksSync
- [ ] EosIntegration
- [ ] LightingDashboard

### Routes
- [ ] `/lighting` - Main lighting page
- [ ] `/lighting/fixtures` - Fixture grid
- [ ] `/lighting/power` - Power management
- [ ] `/lighting/circuits` - Circuit management
- [ ] `/lighting/cables` - Multi-cable config
- [ ] `/lighting/vectorworks` - VW sync
- [ ] `/lighting/eos` - Console integration

### Reports
- [ ] Instrument Schedule
- [ ] Channel Hookup
- [ ] Dimmer Hookup
- [ ] Circuit Schedule
- [ ] Load-In Schedule
- [ ] Color Cut List
- [ ] Gobo List
- [ ] Equipment Count

### Menu Items
- [ ] "Lighting" top-level menu
- [ ] "Fixtures" submenu
- [ ] "Power & Dimmers" submenu
- [ ] "Circuits" submenu
- [ ] "Multi-Cable" submenu
- [ ] "Vectorworks" submenu
- [ ] "Eos Console" submenu

---

## 🚀 Deployment & Rollout

### Phase 1: Internal Testing (Week 1-2)
- Implement licensing infrastructure
- Add feature gates to existing lighting features
- Test with different license tiers
- Ensure no regressions

### Phase 2: Beta Testing (Week 3-4)
- Deploy to beta testers with Lighting Edition licenses
- Ensure feature flags work correctly
- Gather feedback on UX (is anything confusing?)

### Phase 3: Add Sound Features (Month 2-3)
- Implement sound features (see migration-sound-features.md)
- Gate sound features with `FeatureDomain.SOUND`
- Launch Designer Edition (Lighting + Sound)

### Phase 4: Expand to All Editions (Month 4-12)
- Add Video, Production, Tour, Producer features
- Launch all edition tiers
- Complete rollout

---

## 🔐 Security Considerations

### License Verification

**Development:**
- Store license in localStorage
- Simple JSON validation
- No cryptographic verification (for speed)

**Production:**
- Store license in secure storage (Electron secure storage)
- Cryptographic signature verification (RSA or ECDSA)
- Server-side validation on startup
- Periodic license check (every 24 hours)
- Offline grace period (7 days)

**Example production license format:**
```json
{
  "licenseKey": "ABCD-EFGH-IJKL-MNOP",
  "tier": "tier-designer",
  "activatedDomains": ["lighting", "sound", "video"],
  "issuedAt": "2025-12-29T00:00:00Z",
  "expiresAt": "2026-12-29T00:00:00Z",
  "userId": "user-12345",
  "signature": "base64-encoded-signature..."
}
```

### Anti-Tampering

- Obfuscate license checking code (webpack obfuscation)
- Use code signing for Electron app
- Server-side validation for critical operations
- Detect license file modifications
- Watermark trial versions

---

## 📊 Analytics & Telemetry

Track feature usage to inform product decisions:

```typescript
// Track which features are being used
export function trackFeatureUsage(domain: FeatureDomain, action: string): void {
  // Send to analytics (PostHog, Mixpanel, etc.)
  analytics.track('feature_used', {
    domain,
    action,
    licenseTier: licenseManager.getLicenseTier(),
    timestamp: new Date()
  });
}

// Usage:
trackFeatureUsage(FeatureDomain.LIGHTING, 'fixture_created');
trackFeatureUsage(FeatureDomain.SOUND, 'wireless_mic_assigned');
```

**Metrics to track:**
- Which features are most used per license tier?
- Do Lighting Edition users try to access Sound features? (upgrade funnel)
- Which edition has highest retention?
- Which features correlate with upgrade behavior?

---

## 🎓 User Education

### Onboarding Flow

**First launch:**
1. Show welcome screen
2. Ask user to enter license key OR start trial
3. Explain which features are included in their edition
4. Show focused tour of activated features only

**Trial Edition (14 days, Lighting only):**
- Watermark all PDFs with "TRIAL VERSION"
- Show "X days remaining" in header
- Upgrade CTA on day 10
- Hard stop at day 14 (read-only mode)

### In-App Education

**Tooltips on first use:**
- "You have Lighting Edition - manage fixtures, power, and circuits"
- "Upgrade to Designer Edition to add sound and video features"

**Contextual help:**
- Help docs filtered by active features
- Tutorial videos only for licensed features

---

## ✅ Success Criteria

### Implementation Complete When:
- [ ] License manager implemented and tested
- [ ] All existing lighting features gated with `FeatureDomain.LIGHTING`
- [ ] Dynamic navigation menu works correctly
- [ ] Feature gates prevent access to unlicensed features
- [ ] Project files preserve data for all domains
- [ ] Upgrade flow tested (Lighting → Designer → Complete)
- [ ] Downgrade graceful (features hidden, data preserved)
- [ ] No regressions in existing functionality
- [ ] Performance impact < 5% (feature checking overhead)
- [ ] Documentation complete for developers

### User Experience Success:
- [ ] Users report clean, focused interface
- [ ] No confusion about which features are available
- [ ] Upgrade prompts clear and non-intrusive
- [ ] Trial experience positive
- [ ] Collaboration works across different license tiers

---

## 🔄 Migration Checklist

### Pre-Migration
- [ ] Backup current codebase
- [ ] Create feature branch for licensing implementation
- [ ] Set up test environment with multiple license tiers

### During Migration
- [ ] Implement licensing infrastructure
- [ ] Reorganize file structure (domains/)
- [ ] Add feature gates to all routes
- [ ] Update navigation components
- [ ] Add project metadata for domains
- [ ] Update tests
- [ ] Update documentation

### Post-Migration
- [ ] Beta test with real users
- [ ] Monitor analytics for feature usage
- [ ] Gather feedback on UX
- [ ] Fix bugs and regressions
- [ ] Deploy to production

---

## 📝 Documentation Updates Needed

### Developer Docs
- [ ] Update architecture diagrams
- [ ] Document feature flag system
- [ ] Add examples of gating new features
- [ ] Update file structure guide

### User Docs
- [ ] Create edition comparison page
- [ ] Update getting started guide (per edition)
- [ ] Add upgrade/downgrade instructions
- [ ] Create license management guide

---

**Document Status:** Ready for Implementation
**Next Step:** Implement licensing infrastructure (Step 1)
**Estimated Time:** 2-3 weeks for full migration

---

**See Also:**
- `docs/migration-sound-features.md` - Sound feature implementation
- `docs/unified-vs-modular-analysis.md` - Architecture rationale
- `docs/project-status.md` - Overall project roadmap
