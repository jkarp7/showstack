# GDTF Personality Library — Implementation Plan

**Status:** Planned
**Relates to:** DMX Map visualization (partial), Issue #30 (MVR import)
**Blocking:** Full DMX Map footprint display

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

### Phase 1 — User-editable footprint (no GDTF)

1. Migration: `ALTER TABLE fixtures ADD COLUMN dmx_footprint INTEGER NOT NULL DEFAULT 1`
2. Add `dmx_footprint` and `mode` to `FIXTURE_ALLOWED_FIELDS`
3. Expose `dmx_footprint` in Add Fixture dialog and Bulk Edit dialog
4. Update `DMXMap.tsx` to shade full address range per fixture
5. Update conflict detection in `validation.ts` to check full ranges (not just start addresses)

This phase can ship independently and immediately improves the DMX Map for any user who sets footprints manually.

### Phase 2 — Bundled GDTF starter set + picker UI

1. Curate and bundle ~200 common fixtures in `resources/gdtf/`
2. Parse all bundled files at first launch → populate `gdtf_cache`
3. GDTF picker UI in fixture edit dialog (search, mode select, auto-fill)
4. IPC handlers: `gdtf:search`, `gdtf:getModes`, `gdtf:downloadFixture`

### Phase 3 — CDN sync + update notifications

1. Set up Supabase Storage bucket + manifest endpoint
2. Scheduled sync from GDTF-Share → bucket (GitHub Action)
3. Update check on app launch; notification UI
4. On-demand CDN download from picker when fixture not in local cache

### Phase 4 — MVR integration (Issue #30)

- Consume `<GDTFType>` and `<GDTFMode>` from MVR import
- Wire to GDTF cache for automatic footprint resolution

---

## Open Questions

- **Bulk download UX**: Silent background download vs. user-initiated? Probably user-initiated for the initial "update available" flow, silent for individual fixture lookups.
- **CDN hosting**: Supabase Storage is the path of least resistance given existing infrastructure. Alternatively, GitHub Releases (free, no backend needed, but less flexible for partial updates).
- **Bundled fixture selection**: Need to define the ~200 fixture curated set. Priority: most common rental stock in North American theatrical/touring market. ETC Source Four family, MAC family, Chauvet Professional, Robe, GLP, Clay Paky top candidates.
- **GDTF-Share sync credentials**: App credentials stored as GitHub/Supabase secrets, never distributed to end users.
