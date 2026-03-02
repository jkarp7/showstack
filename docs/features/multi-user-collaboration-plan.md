# Multi-User Collaboration Plan

## Context

ShowStack is currently a single-user cloud-sync app — each project is owned by exactly one `user_id`, RLS policies enforce strict ownership, and PowerSync sync rules filter by `user_id`. Multi-user collaboration (professional + institutional tiers) needs project and shop order sharing, role-based access, invitations by email, async sync via PowerSync, and real-time presence via Supabase Realtime.

---

## Pre-requisite Tasks (Flag Before Implementation)

### 1. `user_preferences` ownership ambiguity (BLOCKING)

`user_preferences` is currently per-project (unique key on `project_id + preference_key`), inheriting ownership from the project owner. In a shared project, all collaborators would overwrite each other's UI preferences (e.g., column visibility, sort order).

**Required fix before collaboration:**
Add `user_id` column to `user_preferences`, change unique constraint to `(project_id, user_id, preference_key)`, update RLS and PowerSync sync rules to filter by both project membership AND user_id. Otherwise shared-project prefs will collide.

### 2. `changed_who` field not yet populated in sync uploads (non-blocking but do now)

The `fixtures` table already has a `changed_who` column designed for audit/attribution. The `SupabaseConnector.uploadData()` method (`apps/desktop/src/main/services/sync/SupabaseConnector.ts:371`) currently just passes through `entry.opData` without injecting the current user's ID. Attribution is meaningless without this. Should be populated during the collaboration work.

---

## Implementation Plan

### Step 1 — Database Migration: Membership Tables (`005_project_members.sql`)

New tables in `supabase/migrations/005_project_members.sql`:

```sql
-- project_members: who has access to a shared project
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL until invitation accepted
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at BIGINT NOT NULL,
  accepted_at BIGINT,
  UNIQUE (project_id, email)
);

-- shop_order_members: same structure for shop orders
CREATE TABLE shop_order_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_order_id UUID NOT NULL REFERENCES shop_order_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at BIGINT NOT NULL,
  accepted_at BIGINT,
  UNIQUE (shop_order_id, email)
);

-- Indexes
CREATE INDEX project_members_project_id_idx ON project_members(project_id);
CREATE INDEX project_members_user_id_idx ON project_members(user_id);
CREATE INDEX project_members_email_idx ON project_members(email);
CREATE INDEX shop_order_members_shop_order_id_idx ON shop_order_members(shop_order_id);
CREATE INDEX shop_order_members_user_id_idx ON shop_order_members(user_id);
```

Also update `user_preferences` in this migration:

```sql
ALTER TABLE user_preferences ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- Backfill user_id from parent project's user_id
UPDATE user_preferences SET user_id = (SELECT user_id FROM projects WHERE id = project_id);
ALTER TABLE user_preferences ALTER COLUMN user_id SET NOT NULL;
-- Drop old unique constraint, add new one
ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_project_id_preference_key_key;
ALTER TABLE user_preferences ADD UNIQUE (project_id, user_id, preference_key);
```

Enable RLS on new tables:

```sql
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_members ENABLE ROW LEVEL SECURITY;
```

---

### Step 2 — Supabase RPC / Edge Functions

New RPCs in `supabase/migrations/007_collaboration_rpcs.sql`:

1. **`invite_to_project(p_project_id uuid, p_email text, p_role text)`**
   - Validates caller is project owner
   - Creates `project_members` record with `status='pending'`
   - Returns `{ success, error, member_id }`

2. **`accept_project_invitation(p_project_id uuid)`**
   - Called by signed-in user; matches `email = auth.email()` in pending invitations
   - Sets `user_id = auth.uid()`, `status = 'accepted'`, `accepted_at = now()`

3. **`remove_project_member(p_project_id uuid, p_user_id uuid)`**
   - Only callable by project owner
   - Deletes `project_members` record

Same three RPCs for shop orders (`invite_to_shop_order`, `accept_shop_order_invitation`, `remove_shop_order_member`).

---

### Step 3 — RLS Policy Updates (`006_collaboration_rls.sql`)

Drop existing single-user policies and replace with membership-aware ones. Pattern:

```sql
-- projects: SELECT = owner OR accepted member
DROP POLICY "Users can view their own projects" ON projects;
CREATE POLICY "Users can view projects they have access to"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
        AND project_members.status = 'accepted'
    )
  );

-- projects: UPDATE = owner OR editor member
-- projects: DELETE = owner only (auth.uid() = user_id)
-- projects: INSERT = owner only (auth.uid() = user_id, unchanged)
```

Child tables (fixtures, dimmer_racks, pd_racks, etc.) follow the same pattern — join through `project_members`:

- SELECT/INSERT/UPDATE: owner OR accepted member with role IN ('owner','editor')
- Viewer role: SELECT only

`project_members` RLS:

- SELECT: project owner + the member themselves
- INSERT: project owner only (via RPC)
- UPDATE: project owner + the invited user (to accept/decline)
- DELETE: project owner only

Same policy structure mirrored for `shop_order_members` and all shop order child tables.

---

### Step 4 — PowerSync Sync Rules Update

File: `supabase/powersync/sync-rules.yaml`

Add two new buckets alongside the existing three:

```yaml
# Bucket: shared_projects
# Projects and their data where the user is an accepted member (not owner)
shared_projects:
  description: 'Projects shared with this user'
  parameters:
    - user_id
  data:
    - SELECT projects.* FROM projects
      INNER JOIN project_members ON project_members.project_id = projects.id
      WHERE project_members.user_id = token_parameters.user_id
      AND project_members.status = 'accepted'

    - SELECT fixtures.* FROM fixtures
      INNER JOIN project_members ON project_members.project_id = fixtures.project_id
      WHERE project_members.user_id = token_parameters.user_id
      AND project_members.status = 'accepted'

    # + dimmer_racks, dimmer_rack_modules, pd_racks, phase_distribution_templates,
    #   infrastructure_equipment, user_preferences (filtered by user_id)

    # Always sync project_members so app knows membership
    - SELECT project_members.* FROM project_members
      WHERE project_members.user_id = token_parameters.user_id
      OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.user_id = token_parameters.user_id
      )

# Bucket: shared_shop_orders
shared_shop_orders:
  description: 'Shop orders shared with this user'
  parameters:
    - user_id
  data:
    - SELECT shop_order_projects.* FROM shop_order_projects
      INNER JOIN shop_order_members ON shop_order_members.shop_order_id = shop_order_projects.id
      WHERE shop_order_members.user_id = token_parameters.user_id
      AND shop_order_members.status = 'accepted'
    # + child tables via shop_order_members join
    # + shop_order_members themselves (same owner-or-member pattern)
```

Also update the existing `user_projects` bucket to include `project_members` for projects the user owns (so they can see who they've invited).

---

### Step 5 — License Gating

File: `apps/desktop/src/main/services/LicenseService.ts`

Add `canCollaborate` to `LicenseValidation`:

```typescript
canCollaborate: boolean; // professional + institutional tiers
```

In `validateLicense()`, set `canCollaborate` based on tier:

```typescript
canCollaborate: tier === 'professional' || tier === 'institutional';
```

Update `packages/shared/types/license.types.ts` to add `canCollaborate` to the shared `LicenseValidation` type.

---

### Step 6 — CollaborationService (Main Process)

New file: `apps/desktop/src/main/services/CollaborationService.ts`

Responsibilities:

- `inviteToProject(projectId, email, role)` — calls Supabase RPC, validates license
- `removeProjectMember(projectId, userId)` — calls Supabase RPC
- `getProjectMembers(projectId)` — queries local PowerSync DB for `project_members`
- `acceptProjectInvitation(projectId)` — calls Supabase RPC on sign-in check
- `checkPendingInvitations()` — called after sign-in, queries by email for pending invitations
- Same methods for shop orders (`inviteToShopOrder`, etc.)

Pattern follows existing `ProjectService.ts` / `SupabaseConnector.ts` singletons.

---

### Step 7 — IPC Handlers

New file: `apps/desktop/src/main/ipc/collaboration.ts`

Handlers (following pattern in `apps/desktop/src/main/ipc/sync.ts`):

- `collaboration:invite-to-project` — calls `CollaborationService.inviteToProject()`
- `collaboration:remove-project-member`
- `collaboration:get-project-members`
- `collaboration:accept-invitation` — called when user clicks link/button
- `collaboration:invite-to-shop-order`
- `collaboration:remove-shop-order-member`
- `collaboration:get-shop-order-members`

Register in main process IPC setup (same pattern as other IPC files).

Add `window.api.collaboration.*` bindings in the Electron preload script (check `apps/desktop/src/main/preload.ts` or equivalent).

Add `window.api.collaboration.*` entries to the renderer test setup mock in `apps/desktop/src/renderer/test/setup.ts`.

---

### Step 8 — Populate `changed_who` on Upload

File: `apps/desktop/src/main/services/sync/SupabaseConnector.ts`

In `uploadCrudEntry()` (line ~420), inject `changed_who` for fixture PATCH/PUT operations:

```typescript
if (table === 'fixtures' && entry.op !== UpdateType.DELETE) {
  data.changed_who = this.getUserId();
  data.changed_at = Date.now();
}
```

---

### Step 9 — Realtime Presence (Supabase Realtime)

New file: `apps/desktop/src/main/services/PresenceService.ts`

Uses Supabase Realtime Presence channels (not PowerSync — this is live status only).

- `joinProjectPresence(projectId)` — subscribes to `presence:project:{projectId}` channel
  - Tracks: `{ userId, email, displayName, activeView, joinedAt }`
- `leaveProjectPresence(projectId)` — unsubscribes
- `onPresenceChange(projectId, callback)` — notifies renderer of member changes
- Cleanup on sign-out / project close

IPC: `collaboration:get-presence`, `collaboration:join-presence`, `collaboration:leave-presence`

Renderer side: `PresenceAvatars` component shows online collaborators (dots/avatars in project header). Lives alongside the existing `SyncStatusIndicator.tsx`.

---

### Step 10 — Feature Flag + UI

1. **Enable flag** in `apps/desktop/src/renderer/src/config/featureFlags.ts`:

   ```typescript
   collaboration: true;
   ```

2. **ProjectSharingDialog** component:
   - Gated behind `featureFlags.collaboration && license.canCollaborate`
   - Share button in project header
   - Lists current members with roles
   - Invite by email + role selector
   - Pending invitations section
   - Remove member (owner only)

3. **Collaboration.tsx settings tab** (`apps/desktop/src/renderer/src/components/settings/Collaboration.tsx`) — replace placeholder with real member list and invite form.

4. **Pending invitation banner** — shown on app launch if user has pending invitations.

---

## Critical Files to Modify

| File                                                                  | Change                                           |
| --------------------------------------------------------------------- | ------------------------------------------------ |
| `supabase/migrations/005_project_members.sql`                         | New (membership tables + user_preferences fix)   |
| `supabase/migrations/006_collaboration_rls.sql`                       | New (updated RLS policies)                       |
| `supabase/migrations/007_collaboration_rpcs.sql`                      | New (invite/accept/remove RPCs)                  |
| `supabase/powersync/sync-rules.yaml`                                  | Add shared_projects + shared_shop_orders buckets |
| `apps/desktop/src/main/services/sync/powerSyncSchema.ts`              | Add project_members, shop_order_members tables   |
| `apps/desktop/src/main/services/LicenseService.ts`                    | Add canCollaborate to LicenseValidation          |
| `packages/shared/types/license.types.ts`                              | Add canCollaborate to shared type                |
| `apps/desktop/src/main/services/sync/SupabaseConnector.ts`            | Populate changed_who on upload                   |
| `apps/desktop/src/main/services/CollaborationService.ts`              | New service                                      |
| `apps/desktop/src/main/services/PresenceService.ts`                   | New service                                      |
| `apps/desktop/src/main/ipc/collaboration.ts`                          | New IPC handlers                                 |
| `apps/desktop/src/renderer/test/setup.ts`                             | Add collaboration mocks                          |
| `apps/desktop/src/renderer/src/config/featureFlags.ts`                | Enable collaboration flag                        |
| `apps/desktop/src/renderer/src/components/settings/Collaboration.tsx` | Replace placeholder UI                           |

---

## Testing Plan

Following existing patterns:

### Unit/Service Tests (Vitest, node environment)

- `CollaborationService.test.ts` — invite flow (success, already-member, not-owner, license-gated), remove member, get members, accept invitation, pending invitation check
- `PresenceService.test.ts` — join/leave channel, presence change callbacks, cleanup on sign-out
- `LicenseService.test.ts` additions — `canCollaborate` for demo/student/professional/institutional

### Mock Patterns

- Mock Supabase RPC chain: `supabase.rpc('invite_to_project').mockResolvedValue(...)`
- Mock Supabase Realtime channel: mock `supabase.channel()`, `.on()`, `.subscribe()`, `.track()`
- Use existing `buildLicense()` helper with role overrides

### IPC Handler Tests

- `collaboration.test.ts` in `apps/desktop/src/main/ipc/__tests__/` — tests each handler with mocked CollaborationService

### Integration Tests

- Add collaboration membership scenarios to `integration.test.ts` — in-memory SQLite with `project_members` table, verify RLS-equivalent query logic

### Coverage

- New services must hit ≥50% (functions/lines) to maintain thresholds
- CollaborationService critical path (invite + accept flow): target 80%

### Verification Steps

1. `npm run test:run` — all 1,528 existing tests pass, new tests added
2. `npx tsc --noEmit` — 0 type errors
3. `npm run lint` — within allowed warning budget
4. Manual: Sign in as User A, create project, invite User B by email, sign in as User B, accept invite, verify project appears and is editable
5. Manual: Test offline edit + sync — User A edits while offline, User B edits same fixture, reconnect and verify LWW resolution
6. Manual: Verify `changed_who` is populated on fixture edits
7. Manual: Verify demo/student users cannot access sharing UI (license gate)
