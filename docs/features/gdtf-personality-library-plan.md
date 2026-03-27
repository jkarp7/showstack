# GDTF Personality Library — Implementation Plan

**Status:** Phases 1–3 Complete ✅ / Phase 4 Planned
**Relates to:** DMX Map visualization (complete), Issue #30 (MVR import)
**Last Updated:** March 26, 2026

---

## Problem

The current DMX Map marks each fixture at a single address (`dmx_address`). A real fixture may occupy 1–100+ consecutive addresses depending on its DMX mode (personality). Without knowing the footprint, the map cannot:

- Show the full address range a fixture occupies
- Detect overlap between a multi-channel fixture and another fixture patched into its middle addresses
- Accurately represent how much of a universe is consumed

Additionally, users with non-standard or custom fixtures (LED tape, in-house specials, one-off conversions) have no way to specify a footprint at all.

---

## Solution Overview

Two complementary mechanisms:

1. **User-editable `dmx_footprint` field** — always available, works for any fixture regardless of manufacturer or library coverage.
2. **GDTF personality library** — automatic footprint lookup for known fixtures; users select a mode and the channel count populates automatically. Updated independently of app releases.

These combine cleanly: the GDTF picker writes to `dmx_footprint`. For fixtures with no GDTF match, the user sets it manually. Same field, same downstream behavior.

---

## Architecture

### Three-Tier Library Model

```
Tier 1: Bundled starter set (ships with app)
  └── ~200 most common fixtures in resources/gdtf/
  └── ETC, Robe, Chauvet, Martin, Clay Paky, GLP, Ayrton, etc.
  └── Always available offline, zero latency

Tier 2: ShowStack GDTF CDN (Supabase Storage)
  └── Full curated library synced from GDTF-Share
  └── Manifest endpoint: version hash + per-fixture metadata
  └── App downloads individual files on first use, caches locally
  └── Update check on app launch (non-blocking, background)

Tier 3: User-editable fallback
  └── dmx_footprint integer, manually set
  └── Covers anything not in Tiers 1 or 2
```

The CDN approach avoids per-user GDTF-Share credentials. ShowStack maintains the upstream sync (scheduled GitHub Action or Supabase Edge Function cron pulling from GDTF-Share with app credentials). End users never authenticate against GDTF-Share directly.

### Local Cache Layout

```
{userData}/gdtf-library/
  {Manufacturer}/
    {Fixture Model}.gdtf      ← ZIP containing description.xml
```

Cache metadata tracked in the app database:

```sql
CREATE TABLE gdtf_cache (
  id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  revision_id TEXT,             -- GDTF-Share revision hash
  cached_at INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  modes_json TEXT               -- Pre-parsed [{name, channel_count}] to avoid re-unzipping
);
```

Storing `modes_json` means GDTF files are unzipped and parsed once on download; subsequent lookups are a single DB query.

---

## Schema Changes

### fixtures table

New column:

```sql
ALTER TABLE fixtures ADD COLUMN dmx_footprint INTEGER NOT NULL DEFAULT 1;
```

Default of `1` is correct for most conventional fixtures and safe for everything else (no regressions on existing data).

### mode field

The existing `mode` field (already in the fixture schema) will be documented and wired as the GDTF mode name. It is currently absent from `FIXTURE_ALLOWED_FIELDS` in `fixtures.ts` — add it so it becomes user-editable and persisted through normal update paths.

---

## GDTF Parsing

GDTF files are ZIP archives. The relevant path to channel count:

```
description.xml
  └── <GDTF>
        └── <FixtureType>
              └── <DMXModes>
                    └── <DMXMode Name="Extended 16-bit">   ← mode name
                          └── <DMXChannels>
                                └── <DMXChannel> × N       ← count = footprint
```

Dependencies:

- `adm-zip` — already in use for other file operations; use for ZIP extraction
- `fast-xml-parser` — already planned for Vectorworks integration; use for XML parsing

No new npm dependencies needed.

Parse results cached as `modes_json` in `gdtf_cache`:

```json
[
  { "name": "Basic (8ch)", "channel_count": 8 },
  { "name": "Standard (18ch)", "channel_count": 18 },
  { "name": "Extended 16-bit (32ch)", "channel_count": 32 }
]
```

Mode display format in the UI: `"{name} — {channel_count}ch"`.

---

## Update Mechanism

On app launch (non-blocking, runs after window is shown):

1. Fetch manifest from ShowStack CDN: `{ version_hash: "abc123", updated_at: 1234567890, fixture_count: 7200 }`
2. Compare with stored hash in `settingsStore` / app DB
3. If changed: show a dismissible notification in the sidebar or admin panel — "Fixture library update available (7,200 fixtures)." User initiates download, or it runs silently in the background (TBD UX).
4. Individual fixture GDTF files are downloaded on first use, not bulk-downloaded upfront.

This mirrors how Vectorworks handles fixture symbol library updates — notification on launch, user-controlled download.

---

## UI Changes

### Fixture Edit Dialog (Add Fixture / Bulk Edit)

**New "DMX Footprint" section** below the DMX patch fields:

```
Footprint  [___1___]  channels
           [Search fixture library…]  ← opens GDTF picker
```

- Footprint field is always visible and always user-editable.
- "Search fixture library" button opens the GDTF picker inline or as a modal.

**GDTF Picker:**

1. User types manufacturer + model name (fuzzy match against `gdtf_cache` + bundled set)
2. Results list shows matched fixtures
3. Selecting a fixture shows its available modes:
   ```
   ○  Basic (8ch)
   ●  Standard (18ch)          ← current selection
   ○  Extended 16-bit (32ch)
   ```
4. Confirming writes `mode` = selected mode name, `dmx_footprint` = channel count
5. If fixture not found locally, offers "Download from library" (fetches from CDN, caches)

**Mode field** is also exposed as a plain text input for power users who know their mode name and just want to type it.

### Equipment Manager Grid

No change to the grid columns — `dmx_footprint` is a detail-level field, not a sort/filter priority. It will be available as an optional visible column (off by default).

---

## DMX Map Updates

With `dmx_footprint` available, the map shades the full address range per fixture:

- A fixture at address 1 with footprint 18 fills addresses 1–18
- Conflict detection extended: a second fixture at address 10 (even if a single-channel fixture) conflicts with the multi-channel fixture above
- Cell tooltip updated: show `Ch {channel} · {type} · {mode} ({footprint}ch)` when footprint > 1

The `buildUniverseMap` function in `DMXMap.tsx` currently maps one address per fixture. It needs to iterate `dmx_address` through `dmx_address + dmx_footprint - 1` and mark all cells as belonging to that fixture. Intentional sharing logic (`isIntentionalAddressSharing`) still applies at the address level.

---

## MVR Integration (Issue #30)

When importing MVR:

- `<GDTFType>` in the MVR fixture instance → look up GDTF file in local cache
- `<GDTFMode>` → matches `<DMXMode Name>` in the GDTF file → look up channel count → write to `dmx_footprint`
- `<GDTFMode>` value also written to `fixture.mode`

This means MVR import gives accurate footprints automatically with no user intervention for Vectorworks users.

---

## Implementation Phases

### Phase 1 — User-editable footprint (no GDTF) ✅ COMPLETE

1. ✅ Migration: `ALTER TABLE fixtures ADD COLUMN dmx_footprint INTEGER NOT NULL DEFAULT 1`
2. ✅ Add `dmx_footprint` and `mode` to `FIXTURE_ALLOWED_FIELDS`
3. ✅ Expose `dmx_footprint` in Add Fixture dialog and Bulk Edit dialog
4. ✅ Update `DMXMap.tsx` to shade full address range per fixture (multi-cell blocks with thick outer border, thin inner dividers)
5. ✅ Update conflict detection in `validation.ts` to check full ranges (not just start addresses)
6. ✅ Bug fix: `dmx_footprint` added to `FixtureSchema` Zod validation (was missing — caused silent stripping before DB write)
7. ✅ Bug fix: `position` field made optional in schema (was incorrectly required)
8. ✅ Bug fix: DMX auto-increment in Add Fixture dialog now uses `rawAddress += i * dmxFootprint` (was `+= i`)
9. ✅ DMXMap now calls `loadFixtures()` on mount so footprint data is always fresh

### Phase 2 — Bundled GDTF starter set + picker UI ✅ COMPLETE

1. ✅ `gdtf_cache` SQLite table with `modes_json` pre-parsed column
2. ✅ `GdtfService`: ZIP extraction, XML parsing, `gdtf-bundled/` scan, `gdtf:search` / `gdtf:getModes` IPC
3. ✅ `GdtfPickerDialog`: fuzzy search, fixture + mode selection, channel count display
4. ✅ Wired into Add Fixture and Bulk Edit dialogs — on select auto-fills manufacturer, model, type, mode, dmx_footprint
5. ⬜ `gdtf-bundled/` starter files not yet added (maintainer step — ~200 common fixtures)

### Phase 3 — CDN sync + update notifications ✅ COMPLETE

1. ✅ Supabase Storage bucket `gdtf-library` (public) — migration `017_gdtf_library_bucket.sql`
2. ✅ `scripts/sync-gdtf-library.mjs` — GDTF-Share REST API → manifest.json → Supabase Storage upload
3. ✅ **8,033 fixtures live** in manifest (hash `9bcf41fe2e17a451`, 4.5 MB, March 2026)
4. ✅ GitHub Actions workflow `sync-gdtf-library.yml` (GDTF_USERNAME / GDTF_PASSWORD / SUPABASE_SERVICE_ROLE_KEY secrets configured)
5. ✅ `GdtfService.applyManifestUpdate()` — single SQLite transaction bulk-upsert of all manifest fixtures
6. ✅ `gdtf:applyUpdate` IPC + preload wiring
7. ✅ `GdtfLibraryUpdateBanner` — shows on launch when CDN version_hash differs; "Update Now" button; auto-dismisses on success; shows progress and error states
8. ✅ electron-vite watch config extended to `packages/shared/src/**` so main process restarts on schema changes

### Phase 4 — MVR integration (Issue #30) ⬜ PLANNED

- Consume `<GDTFType>` and `<GDTFMode>` from MVR import
- Wire to GDTF cache for automatic footprint resolution
- `<GDTFMode>` value also written to `fixture.mode`

---

## Resolved Questions

- **Bulk download UX**: "Update Now" button in dismissible banner — user-initiated. Individual fixture downloads from CDN on first use (future, not yet implemented).
- **CDN hosting**: Supabase Storage ✅ — bucket `gdtf-library` is live.
- **GDTF-Share sync credentials**: Stored as GitHub Actions secrets (`GDTF_USERNAME`, `GDTF_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`) — not distributed to end users. ✅
- **Bundled fixture selection**: Deferred — `gdtf-bundled/` directory scaffolded but empty. Maintainer step.
