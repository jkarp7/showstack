# ShowStack Post-Refactor Implementation Plan

**Objective:** Implement "Pro" features regarding project versioning, licensing, and update distribution after the core "Local-First" refactor is complete.

---

## 1. "Eos-Style" Project Families (Versioning)

_Goal: declutter the project list by grouping versions of the same show into stacks, similar to ETC Eos._

### 1.1 Database Schema Update

Modify `apps/desktop/src/main/database/schema.ts` (PowerSync schema):

- **Add Column:** `root_project_id` (TEXT).
  - **Logic:**
    - `NULL`: This project is a "Root" (or a standalone project).
    - `UUID`: This project is a version/copy of the project with this ID.

### 1.2 "Save As Copy" Logic

Update your `ProjectService.createCopy()` function:

1.  **Check Source:** Look at the `originalProject`.
2.  **Inherit Root:**
    - If `originalProject.root_project_id` is set, use that.
    - If `originalProject.root_project_id` is null, use `originalProject.id`.
3.  **Create:** Insert new project with this `root_project_id`.

### 1.3 UI Implementation (The Stack)

1.  **Logic:** In `LandingPage.tsx`, group the projects array by `root_project_id`.
2.  **Component:** Create `<ProjectStackCard />`.
    - **Visual:** CSS to make it look like 2-3 stacked cards.
    - **Badge:** Show version count (e.g., "5 Versions").
    - **Cover:** Display the thumbnail/data of the _most recently updated_ child.
3.  **Interaction:**
    - Clicking a Stack replaces the grid view with a "Folder View" showing only projects in that family.
    - Add a "Back to Library" breadcrumb.

---

## 2. Modern Licensing System

_Goal: Switch to a "Key-Centric Identity" with Perpetual Fallback (Keep what you paid for)._

### 2.1 The Concept

- **One Key:** User gets one key forever (`SK-XXXX`).
- **Dynamic Access:** The key doesn't unlock "Version 1.0"; it unlocks "Any version released before [Maintenance End Date]."
- **Cloud Gate:** The key also gates access to `db.connect()` (PowerSync).

### 2.2 Database Schema (Supabase)

Create a table in Supabase to track keys.

```sql
CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  maintenance_end_date TIMESTAMPTZ NOT NULL, -- The critical field
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Local License Logic (Electron)

Update LicenseService.ts to enforce the "Perpetual Fallback"

```ts
canRunApplication(localLicense): boolean {
  // 1. Get Build Date (injected at build time via package.json)
  const appBuildDate = new Date(process.env.BUILD_DATE);

  // 2. Get User's Maintenance Date
  const maintenanceEnds = new Date(localLicense.maintenanceEndDate);

  // 3. Allow if this version was released while they were active
  return appBuildDate <= maintenanceEnds;
}
```

---

## 3. E-commerce > Supabase Pipeline

_Goal: Automate key generation so you never manually email a key again._

### 3.1 The Webhook Listener

Create a Supabase Edge Function (`purchase-webhook`).

- **Trigger:** Receives JSON from Stripe/Shopify/WooCommerce (`checkout.completed`).
- **Logic:**
  1.  **Generate Key:** `SK-${RandomUUID}`.
  2.  **Upsert User:** Check `auth.users` for the email. Create a shadow user if missing.
  3.  **Insert License:** Add row to `public.licenses` with `maintenance_end_date` = Now + 1 Year.
  4.  **Send Email:** Call Resend/Postmark API to email the key to the user.

### 3.2 The "Dual Activation" Flow

In the Desktop App (`Login.tsx` / `LicenseService.ts`):

- **Input:** User enters Email + Key.
- **Process:**
  1.  Call Supabase Function `activate-license`.
  2.  Function validates key.
  3.  Function returns:
      - `session`: Supabase Auth Token (for Cloud Sync).
      - `licenseData`: Signed blob (for Offline Local use).
  4.  App saves `licenseData` to SQLite (unlocks Offline features).
  5.  App saves `session` to Secure Storage (unlocks PowerSync).

---

## 4. Date-Based Update Distribution

_Goal: Push updates continuously without worrying about "Major Version" billing._

### 4.1 Build Configuration

In `package.json` or your build script, ensure the build date is baked in.

```json
"build": "cross-env BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) electron-builder"
```

### 4.2 The "License Gate" (UpdateService)

Modify your auto-updater logic to check eligibility before downloading

```ts
autoUpdater.on('update-available', (info) => {
  const updateDate = new Date(info.releaseDate);
  const license = LicenseService.getCurrentLicense();

  if (license.maintenanceEndDate < updateDate) {
    // ABORT DOWNLOAD
    autoUpdater.autoDownload = false;

    // Show Prompt
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message:
        'A new version is available, but your maintenance plan has expired.\n\nRenew for $99 to get this update, or continue using your current version forever.',
    });
  } else {
    // Proceed
    autoUpdater.downloadUpdate();
  }
});
```

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
- [ ] Verify the "Offline Fallback" works by setting your system clock forward 2 years.

**Status Update (February 2026):** LicenseService now implements perpetual fallback licensing with `APP_BUILD_DATE` vs `maintenanceEndDate` comparison. Supabase Auth replaces the "Dual Activation" flow — users sign in with email/password and licenses are auto-claimed by email. Demo mode provides restricted access for unauthenticated users. The e-commerce webhook (Phase 2) and auto-updater gate (Phase 4) are still pending.

**Status Update (February 23, 2026):** Cloud sync is now functional end-to-end. PowerSync was migrated from `@powersync/web` to `@powersync/node` (the correct package for Electron main process). The IPC bridge pattern (main process holds PowerSync, renderer calls via `window.api.sync.*`) was confirmed correct and is unchanged. After sign-in, the sync status now correctly transitions from "offline" → "connected". Project Families (versioning stack) foundation is in place: `root_project_id` schema column added, `.ss` export/import fixed end-to-end.
