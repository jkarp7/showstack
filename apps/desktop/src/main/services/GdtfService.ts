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
import { getAppDatabase } from '../database';
import { logger } from '../utils/logger';

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
}

export const gdtfService = new GdtfService();
