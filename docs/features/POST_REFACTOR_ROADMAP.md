# ShowStack Post-Refactor Implementation Plan

**Created:** Early 2026
**Last Updated:** March 9, 2026
**Status:** Partially complete — see section statuses below

**Objective:** Implement "Pro" features regarding project versioning, licensing, and update distribution after the core "Local-First" refactor is complete.

---

## Summary

| Section | Feature                                 | Status      |
| ------- | --------------------------------------- | ----------- |
| 1       | Eos-Style Project Families (Versioning) | ✅ Complete |
| 2       | Modern Licensing System                 | ✅ Complete |
| 3       | E-commerce > Supabase Pipeline          | ⬜ Pending  |
| 4       | Date-Based Update Distribution          | ⬜ Pending  |

---

## 1. "Eos-Style" Project Families (Versioning) — ✅ Complete

_Goal: declutter the project list by grouping versions of the same show into stacks, similar to ETC Eos._

**Implemented:**

- `root_project_id` column in the PowerSync schema; `NULL` = root project, UUID = version of another project
- `ProjectService.createCopy()` inherits the root project ID correctly
- `<ProjectStackCard />` component — stacked-card visual, version count badge, most-recently-updated cover
- Clicking a stack enters a folder view; "Back to Library" breadcrumb to return
- "Save as Copy" inheritance logic in `LandingPage.tsx`

---

## 2. Modern Licensing System — ✅ Complete

_Goal: Switch to a "Key-Centric Identity" with Perpetual Fallback (Keep what you paid for)._

**Implemented (February 15, 2026, PR #80):**

- Supabase Auth integration — users sign in with email/password. No manual key entry.
- Licenses are auto-claimed by email match on the Supabase `licenses` table.
- `LicenseService` enforces perpetual fallback: `APP_BUILD_DATE <= maintenanceEndDate` allows the app to run indefinitely on versions built during the active maintenance window.
- Demo mode provides restricted access (25 fixtures, no cloud sync, no exports) for unauthenticated users.
- `cloud_sync` column on the licenses table gates PowerSync connectivity.
- Feature limits (`maxFixtures`) enforced per tier: demo=25, student=100, pro/institutional=unlimited.

**Supabase schema (implemented):**

```sql
CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  tier TEXT NOT NULL DEFAULT 'pro',
  maintenance_end_date TIMESTAMPTZ NOT NULL,
  cloud_sync BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Local license logic (implemented):**

```ts
canRunApplication(localLicense): boolean {
  const appBuildDate = new Date(process.env.APP_BUILD_DATE);
  const maintenanceEnds = new Date(localLicense.maintenanceEndDate);
  return appBuildDate <= maintenanceEnds;
}
```

---

## 3. E-commerce > Supabase Pipeline — ⬜ Pending

_Goal: Automate license generation so purchases are fulfilled without manual intervention._

### 3.1 The Webhook Listener

Create a Supabase Edge Function (`purchase-webhook`).

- **Trigger:** Receives JSON from Stripe/Shopify/WooCommerce (`checkout.completed`).
- **Logic:**
  1.  **Upsert User:** Check `auth.users` for the email. Create a shadow user if missing.
  2.  **Insert License:** Add row to `public.licenses` with `maintenance_end_date` = Now + 1 Year.
  3.  **Send Email:** Call Resend/Postmark API to notify the user their account is ready.

### 3.2 Notes on Current Flow

The "Dual Activation" flow (email + key entry) has been replaced by Supabase Auth. Users simply sign in and their license is auto-claimed. The webhook just needs to create the user and license row — no key generation or emailing of keys is required.

**Execution checklist:**

- [x] Create `public.licenses` table in Supabase.
- [ ] Deploy `purchase-webhook` Edge Function.
- [ ] Connect Stripe/Shopify webhooks to the function URL.
- [ ] Test end-to-end: purchase → license row → user sign-in → auto-claim.

---

## 4. Date-Based Update Distribution — ⬜ Pending

_Goal: Push updates continuously without worrying about "Major Version" billing._

### 4.1 Build Configuration

Ensure build date is baked in at build time (required for perpetual fallback logic):

```json
"build": "cross-env APP_BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) electron-builder"
```

### 4.2 The "License Gate" (UpdateService)

Modify auto-updater logic to check maintenance eligibility before downloading:

```ts
autoUpdater.on('update-available', (info) => {
  const updateDate = new Date(info.releaseDate);
  const license = LicenseService.getCurrentLicense();

  if (license.maintenanceEndDate < updateDate) {
    autoUpdater.autoDownload = false;
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message:
        'A new version is available, but your maintenance plan has expired.\n\nRenew to get this update, or continue using your current version forever.',
    });
  } else {
    autoUpdater.downloadUpdate();
  }
});
```

**Execution checklist:**

- [ ] Implement `UpdateService` to gate downloads based on maintenance expiry.
- [ ] Verify the "Offline Fallback" works by setting system clock forward 2 years.
- [ ] Confirm `APP_BUILD_DATE` is correctly baked in during CI builds.

---

## 5. Execution Summary

### Phase 1: The Foundation (Post-Refactor)

- [x] Add `root_project_id` to database schema (SQLite migration + Supabase migration 004).
- [x] Build `<ProjectStackCard>` component.
- [x] Implement "Save as Copy" inheritance logic (grouping in LandingPage.tsx).

### Phase 2: The Gateway (Supabase)

- [x] Create `public.licenses` table in Supabase.
- [ ] Deploy `purchase-webhook` Edge Function.
- [ ] Connect Stripe/Shopify webhooks to the function URL.

### Phase 3: The Client Logic (Electron)

- [x] Update `LicenseService` to check dates, not version numbers.
- [x] Fix cloud sync: migrate PowerSync from `@powersync/web` → `@powersync/node`.
- [ ] Implement `UpdateService` to gate downloads based on maintenance expiry.
- [ ] Verify the "Offline Fallback" works by setting system clock forward 2 years.
