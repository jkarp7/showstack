/**
 * GdtfService — parses GDTF fixture files and manages the gdtf_cache table.
 *
 * GDTF files are ZIP archives containing description.xml. The relevant
 * channel count lives at:
 *   <GDTF> > <FixtureType> > <DMXModes> > <DMXMode Name="..."> > <DMXChannels> > <DMXChannel> × N
 *
 * This service:
 * 1. Scans the bundled GDTF directory on startup and upserts into gdtf_cache.
 * 2. Exposes search / getModes for IPC handlers.
 */

import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import { app } from 'electron';
import { getAppDatabase } from '../database';
import { logger } from '../utils/logger';
import { getSetting, setSetting } from '../database/queries/settings';

export interface GdtfMode {
  name: string;
  channel_count: number;
}

export interface GdtfSearchResult {
  id: string;
  manufacturer: string;
  model: string;
  source: string;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (tagName) => ['DMXMode', 'DMXChannel'].includes(tagName),
});

/**
 * Parse a .gdtf (ZIP) file and extract DMX mode info.
 * Returns null if the file is unreadable or has no modes.
 */
export function parseGdtfFile(filePath: string): GdtfMode[] | null {
  try {
    const zip = new AdmZip(filePath);
    const entry = zip.getEntry('description.xml');
    if (!entry) {
      logger.warn(`GDTF file missing description.xml`, { filePath });
      return null;
    }

    const xml = entry.getData().toString('utf8');
    const parsed = xmlParser.parse(xml);

    const dmxModes: any[] = parsed?.GDTF?.FixtureType?.DMXModes?.DMXMode ?? [];

    if (!Array.isArray(dmxModes) || dmxModes.length === 0) return null;

    const modes: GdtfMode[] = dmxModes.map((modeNode: any) => {
      const name: string = modeNode['@_Name'] ?? 'Unknown';
      const channels: any[] = modeNode?.DMXChannels?.DMXChannel ?? [];
      const channelCount = Array.isArray(channels) ? channels.length : 0;
      return { name, channel_count: channelCount };
    });

    return modes.filter((m) => m.channel_count > 0);
  } catch (err) {
    logger.warn(`Failed to parse GDTF file`, {
      filePath,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Build a cache ID from manufacturer + model slug.
 */
function makeId(manufacturer: string, model: string): string {
  return `${manufacturer}/${model}`;
}

/**
 * Scan a directory recursively for .gdtf files.
 * Expected layout: {dir}/{Manufacturer}/{Model}.gdtf
 */
function* walkGdtfDir(
  dir: string,
): Generator<{ filePath: string; manufacturer: string; model: string }> {
  if (!fs.existsSync(dir)) return;
  for (const mfr of fs.readdirSync(dir)) {
    const mfrPath = path.join(dir, mfr);
    if (!fs.statSync(mfrPath).isDirectory()) continue;
    for (const file of fs.readdirSync(mfrPath)) {
      if (!file.endsWith('.gdtf')) continue;
      const model = file.slice(0, -5); // strip .gdtf
      yield { filePath: path.join(mfrPath, file), manufacturer: mfr, model };
    }
  }
}

export class GdtfService {
  /**
   * Scan the bundled GDTF directory and populate gdtf_cache for any
   * files not already cached. Called once after app DB is ready.
   */
  scanBundled(bundledDir: string): void {
    const db = getAppDatabase();
    const upsert = db.prepare(`
      INSERT OR REPLACE INTO gdtf_cache
        (id, manufacturer, model, revision_id, source, cached_at, file_path, modes_json)
      VALUES (?, ?, ?, NULL, 'bundled', ?, ?, ?)
    `);

    let added = 0;
    for (const { filePath, manufacturer, model } of walkGdtfDir(bundledDir)) {
      const id = makeId(manufacturer, model);
      const existing = db
        .prepare(`SELECT id FROM gdtf_cache WHERE id = ? AND source = 'bundled'`)
        .get(id);
      if (existing) continue;

      const modes = parseGdtfFile(filePath);
      if (!modes || modes.length === 0) continue;

      upsert.run(id, manufacturer, model, Date.now(), filePath, JSON.stringify(modes));
      added++;
    }

    if (added > 0) {
      logger.info(`GDTF bundled scan: added ${added} fixtures to cache`);
    }
  }

  /**
   * Fuzzy search against manufacturer + model in gdtf_cache.
   * Returns up to 50 results ordered by manufacturer then model.
   */
  search(query: string): GdtfSearchResult[] {
    const db = getAppDatabase();
    const q = `%${query.replace(/%/g, '').replace(/_/g, '')}%`;
    return db
      .prepare(
        `
        SELECT id, manufacturer, model, source
        FROM gdtf_cache
        WHERE manufacturer LIKE ? OR model LIKE ?
        ORDER BY manufacturer, model
        LIMIT 50
      `,
      )
      .all(q, q) as GdtfSearchResult[];
  }

  /**
   * Return parsed modes for a specific gdtf_cache entry by id.
   */
  getModes(id: string): GdtfMode[] {
    const db = getAppDatabase();
    const row = db.prepare(`SELECT modes_json FROM gdtf_cache WHERE id = ?`).get(id) as
      | { modes_json: string }
      | undefined;
    if (!row) return [];
    try {
      return JSON.parse(row.modes_json) as GdtfMode[];
    } catch {
      return [];
    }
  }

  /**
   * Fetch the CDN manifest and compare with the stored hash.
   * Manifest URL: {cdnUrl}/manifest.json
   * Manifest shape: { version_hash: string, updated_at: number, fixture_count: number }
   * Stored hash key: 'gdtf_library_version_hash' in app_settings_kv
   * Returns: { hasUpdate: boolean, versionHash: string, fixtureCount: number } or null on network failure
   */
  async checkForUpdates(
    cdnUrl: string,
  ): Promise<{ hasUpdate: boolean; versionHash: string; fixtureCount: number } | null> {
    try {
      const manifestUrl = `${cdnUrl}/manifest.json`;
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        logger.warn(`GDTF CDN manifest fetch failed`, {
          status: response.status,
          url: manifestUrl,
        });
        return null;
      }
      const manifest = (await response.json()) as {
        version_hash: string;
        updated_at: number;
        fixture_count: number;
      };

      // Persist the check timestamp
      setSetting('gdtf_library_checked_at', Date.now().toString());

      const storedHash = getSetting('gdtf_library_version_hash');
      const hasUpdate = manifest.version_hash !== storedHash;

      return {
        hasUpdate,
        versionHash: manifest.version_hash,
        fixtureCount: manifest.fixture_count,
      };
    } catch (err) {
      logger.warn(`GDTF CDN update check failed`, {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  /**
   * Download a single .gdtf file from CDN, save to userData cache dir, parse modes,
   * upsert into gdtf_cache.
   * CDN path: {cdnUrl}/{manufacturer}/{model}.gdtf
   * Local cache: {userData}/gdtf-library/{manufacturer}/{model}.gdtf
   * Returns GdtfMode[] on success, throws on failure.
   */
  async downloadFixture(cdnUrl: string, manufacturer: string, model: string): Promise<GdtfMode[]> {
    const url = `${cdnUrl}/${encodeURIComponent(manufacturer)}/${encodeURIComponent(model)}.gdtf`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CDN returned ${response.status} for ${url}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    const cacheDir = path.join(app.getPath('userData'), 'gdtf-library', manufacturer);
    fs.mkdirSync(cacheDir, { recursive: true });
    const filePath = path.join(cacheDir, `${model}.gdtf`);
    fs.writeFileSync(filePath, buffer);

    const modes = parseGdtfFile(filePath);
    if (!modes || modes.length === 0) {
      throw new Error(`No valid DMX modes found in downloaded fixture`);
    }

    const id = makeId(manufacturer, model);
    const db = getAppDatabase();
    db.prepare(
      `
      INSERT OR REPLACE INTO gdtf_cache
        (id, manufacturer, model, revision_id, source, cached_at, file_path, modes_json)
      VALUES (?, ?, ?, NULL, 'cdn', ?, ?, ?)
    `,
    ).run(id, manufacturer, model, Date.now(), filePath, JSON.stringify(modes));

    logger.info(`GDTF CDN fixture downloaded and cached`, { id });
    return modes;
  }

  /**
   * Get current library status from app_settings_kv.
   * Returns: { versionHash: string | null, checkedAt: number | null }
   */
  getLibraryStatus(): { versionHash: string | null; checkedAt: number | null } {
    const versionHash = getSetting('gdtf_library_version_hash');
    const checkedAtStr = getSetting('gdtf_library_checked_at');
    const checkedAt = checkedAtStr !== null ? parseInt(checkedAtStr, 10) : null;
    return { versionHash, checkedAt };
  }

  /**
   * Download the full manifest from CDN and bulk-upsert all fixtures into gdtf_cache.
   * Uses a transaction for performance with 7,000+ fixtures.
   * Stores the new version hash on success.
   * Returns the number of fixtures upserted, or throws on failure.
   */
  async applyManifestUpdate(cdnUrl: string): Promise<number> {
    const manifestUrl = `${cdnUrl}/manifest.json`;
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: HTTP ${response.status}`);
    }

    const manifest = (await response.json()) as {
      version_hash: string;
      fixture_count: number;
      fixtures: Array<{
        id: string;
        manufacturer: string;
        model: string;
        rid: number;
        modes: Array<{ name: string; channel_count: number }>;
      }>;
    };

    if (!Array.isArray(manifest.fixtures)) {
      throw new Error('Manifest missing fixtures array');
    }

    const db = getAppDatabase();
    const upsert = db.prepare(`
      INSERT OR REPLACE INTO gdtf_cache
        (id, manufacturer, model, revision_id, source, cached_at, file_path, modes_json)
      VALUES (?, ?, ?, ?, 'cdn-manifest', ?, '', ?)
    `);

    const now = Date.now();
    const runAll = db.transaction((fixtures: typeof manifest.fixtures) => {
      for (const fixture of fixtures) {
        upsert.run(
          fixture.id,
          fixture.manufacturer,
          fixture.model,
          fixture.rid,
          now,
          JSON.stringify(fixture.modes),
        );
      }
    });

    runAll(manifest.fixtures);

    setSetting('gdtf_library_version_hash', manifest.version_hash);
    setSetting('gdtf_library_checked_at', now.toString());

    logger.info(`GDTF manifest applied: ${manifest.fixtures.length} fixtures upserted`, {
      versionHash: manifest.version_hash,
    });

    return manifest.fixtures.length;
  }

  /**
   * Persist manifest hash after a successful update check.
   */
  storeVersionHash(hash: string): void {
    setSetting('gdtf_library_version_hash', hash);
  }
}

export const gdtfService = new GdtfService();
