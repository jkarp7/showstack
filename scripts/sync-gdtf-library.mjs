/**
 * sync-gdtf-library.mjs
 *
 * Syncs the GDTF Share fixture library to ShowStack's Supabase Storage CDN.
 *
 * What it does:
 *   1. Logs into the GDTF Share API with app credentials
 *   2. Fetches the full fixture list (7,000+ fixtures with mode names + DMX footprints)
 *   3. Deduplicates to the latest revision per fixture UUID
 *   4. Transforms to ShowStack's manifest format
 *   5. Computes a SHA-256 hash of the fixture data
 *   6. Checks the existing manifest on the CDN — skips upload if unchanged
 *   7. Uploads manifest.json to Supabase Storage (public bucket)
 *
 * The manifest is the only thing uploaded — no .gdtf files are downloaded or stored.
 * Mode names and DMX footprints come directly from the GDTF Share list API response.
 *
 * Environment variables required:
 *   GDTF_SHARE_USER          GDTF Share account username
 *   GDTF_SHARE_PASSWORD      GDTF Share account password
 *   SUPABASE_URL             e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY Service role key for Storage uploads
 *   GDTF_STORAGE_BUCKET      Storage bucket name (default: gdtf-library)
 *   FORCE_UPDATE             Set to "true" to upload even if hash is unchanged
 */

import { createHash } from 'crypto';

const GDTF_API_BASE = 'https://gdtf-share.com/apis/public';
const BUCKET = process.env.GDTF_STORAGE_BUCKET ?? 'gdtf-library';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FORCE = process.env.FORCE_UPDATE === 'true';

// ── Validation ───────────────────────────────────────────────────────────────

function requireEnv(...keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// ── GDTF Share API ───────────────────────────────────────────────────────────

async function login() {
  console.log('→ Logging into GDTF Share...');
  const res = await fetch(`${GDTF_API_BASE}/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: process.env.GDTF_SHARE_USER,
      password: process.env.GDTF_SHARE_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`Login failed: HTTP ${res.status}`);
  }

  const body = await res.json();
  if (!body.result) {
    throw new Error(`Login rejected: ${body.error ?? 'unknown error'}`);
  }

  // Extract session cookie from Set-Cookie header
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('No session cookie received after login');
  }

  // Take just the first cookie value (e.g. "PHPSESSID=abc123; Path=/; ...")
  const cookie = setCookie.split(';')[0].trim();
  console.log('  ✓ Logged in');
  return cookie;
}

async function getFixtureList(cookie) {
  console.log('→ Fetching fixture list...');
  const res = await fetch(`${GDTF_API_BASE}/getList.php`, {
    headers: { Cookie: cookie },
  });

  if (!res.ok) {
    throw new Error(`getList failed: HTTP ${res.status}`);
  }

  const body = await res.json();
  if (!body.result) {
    throw new Error(`getList rejected: ${body.error ?? 'unknown error'}`);
  }

  console.log(`  ✓ Received ${body.list.length} revisions`);
  return body.list;
}

// ── Transform ─────────────────────────────────────────────────────────────────

/**
 * Normalise the modes array from GDTF Share.
 * The API returns modes in a slightly irregular shape — defensively flatten
 * and filter to only objects with name + dmxfootprint.
 */
function normaliseModes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .flat()
    .filter((m) => m && typeof m === 'object' && 'name' in m && 'dmxfootprint' in m)
    .map((m) => ({
      name: String(m.name),
      channel_count: Number(m.dmxfootprint) || 0,
    }))
    .filter((m) => m.channel_count > 0);
}

function buildManifest(list) {
  console.log('→ Building manifest...');

  // Deduplicate: keep the highest-rid revision per fixture UUID
  const byUuid = new Map();
  for (const item of list) {
    const existing = byUuid.get(item.uuid);
    if (!existing || Number(item.rid) > Number(existing.rid)) {
      byUuid.set(item.uuid, item);
    }
  }
  console.log(`  Deduplicated to ${byUuid.size} unique fixtures`);

  // Transform to ShowStack format
  const fixtures = [...byUuid.values()]
    .map((item) => {
      const modes = normaliseModes(item.modes);
      if (modes.length === 0) return null; // skip fixtures with no usable modes

      return {
        id: `${item.manufacturer}/${item.fixture}`,
        manufacturer: item.manufacturer,
        model: item.fixture,
        rid: Number(item.rid),
        rating: Math.round(parseFloat(item.rating) * 10) / 10 || 0,
        uploader: item.uploader, // "Manuf." or "User"
        modes,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.model.localeCompare(b.model));

  console.log(`  ${fixtures.length} fixtures with valid modes`);

  // Hash the fixture data (not the timestamp) so hash only changes when data changes
  const dataHash = createHash('sha256').update(JSON.stringify(fixtures)).digest('hex').slice(0, 16);

  const manifest = {
    version_hash: dataHash,
    updated_at: Math.floor(Date.now() / 1000),
    fixture_count: fixtures.length,
    fixtures,
  };

  return manifest;
}

// ── Supabase Storage ──────────────────────────────────────────────────────────

async function fetchExistingHash() {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/manifest.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const existing = await res.json();
    return existing?.version_hash ?? null;
  } catch {
    return null;
  }
}

async function uploadManifest(manifest) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/manifest.json`;
  const body = JSON.stringify(manifest, null, 2);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'x-upsert': 'true',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed: HTTP ${res.status} — ${text}`);
  }

  return body.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  requireEnv('GDTF_SHARE_USER', 'GDTF_SHARE_PASSWORD', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');

  const cookie = await login();
  const list = await getFixtureList(cookie);
  const manifest = buildManifest(list);

  console.log(`→ New manifest hash: ${manifest.version_hash}`);

  if (!FORCE) {
    console.log('→ Checking existing CDN manifest...');
    const existingHash = await fetchExistingHash();
    if (existingHash) {
      console.log(`  Existing hash: ${existingHash}`);
    } else {
      console.log('  No existing manifest found (first run)');
    }

    if (existingHash === manifest.version_hash) {
      console.log('✓ No changes — CDN is already up to date. Skipping upload.');
      return;
    }
  }

  console.log(`→ Uploading manifest to ${BUCKET}/manifest.json...`);
  const bytes = await uploadManifest(manifest);
  console.log(
    `✓ Uploaded ${(bytes / 1024).toFixed(1)} KB — ${manifest.fixture_count} fixtures, hash ${manifest.version_hash}`,
  );
}

main().catch((err) => {
  console.error('✗ Sync failed:', err.message);
  process.exit(1);
});
