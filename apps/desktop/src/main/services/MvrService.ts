/**
 * MvrService — parses MVR (My Virtual Rig) files and resolves GDTF footprint data.
 *
 * MVR files are ZIP archives containing GeneralSceneDescription.xml.
 * Fixtures within are organized in Layers (which map to lighting positions).
 *
 * GDTF resolution: each fixture carries a <GDTFSpec> filename of the form
 *   {Manufacturer}@{Model}@{Revision}.gdtf
 * and a <GDTFMode> name. We look up the manufacturer+model in gdtf_cache and
 * find the matching mode to auto-populate dmx_footprint.
 */

import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import { getAppDatabase } from '../database';
import { logger } from '../utils/logger';
import type { GdtfMode } from './GdtfService';

export interface MvrFixture {
  name: string; // Fixture @_name (instrument type from Vectorworks)
  uuid: string;
  layerName: string; // Parent Layer name → maps to lighting position
  gdtfSpec?: string; // e.g. "ETC@Source_Four@v2_0.gdtf"
  gdtfMode?: string; // e.g. "Standard (8ch)"
  fixtureId?: string; // <FixtureID> → channel
  unitNumber?: number; // <UnitNumber>
  universe?: number; // derived from absolute DMX address
  dmxAddress?: number; // within-universe address (1–512)
  manufacturer?: string;
  model?: string;
  dmxFootprint?: number;
  gdtfResolved: boolean;
}

export interface MvrParseResult {
  fixtures: MvrFixture[];
  warnings: string[];
}

const mvrParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (tagName) =>
    ['Layer', 'Fixture', 'GroupObject', 'SceneObject', 'Address'].includes(tagName),
});

/**
 * Parse GDTFSpec filename into manufacturer + model.
 * Format: {Manufacturer}@{Model}@{Revision}.gdtf  (underscores = spaces)
 */
function parseGdtfSpec(gdtfSpec: string): { manufacturer: string; model: string } | null {
  const withoutExt = gdtfSpec.replace(/\.gdtf$/i, '');
  const parts = withoutExt.split('@');
  if (parts.length < 2) return null;
  return {
    manufacturer: parts[0].replace(/_/g, ' ').trim(),
    model: parts[1].replace(/_/g, ' ').trim(),
  };
}

/**
 * Recursively collect Fixture nodes from a ChildList array, passing the
 * enclosing layer name through to each fixture.
 */
function collectFixtures(
  childList: any[],
  layerName: string,
): Array<{ fixture: any; layerName: string }> {
  const results: Array<{ fixture: any; layerName: string }> = [];
  if (!Array.isArray(childList)) return results;

  for (const child of childList) {
    if (child.Fixture) {
      const arr = Array.isArray(child.Fixture) ? child.Fixture : [child.Fixture];
      for (const f of arr) results.push({ fixture: f, layerName });
    }
    for (const containerTag of ['GroupObject', 'SceneObject']) {
      if (child[containerTag]) {
        const containers = Array.isArray(child[containerTag])
          ? child[containerTag]
          : [child[containerTag]];
        for (const c of containers) {
          if (c.ChildList) {
            const nested = Array.isArray(c.ChildList) ? c.ChildList : [c.ChildList];
            results.push(...collectFixtures(nested, layerName));
          }
        }
      }
    }
  }
  return results;
}

export class MvrService {
  /**
   * Open an MVR file, parse its fixtures, and resolve GDTF footprints where possible.
   * Throws if the file is unreadable or not a valid MVR ZIP.
   */
  parseMvr(filePath: string): MvrParseResult {
    const warnings: string[] = [];
    const fixtures: MvrFixture[] = [];

    const zip = new AdmZip(filePath);
    const entry = zip.getEntry('GeneralSceneDescription.xml');
    if (!entry) {
      throw new Error('Not a valid MVR file: missing GeneralSceneDescription.xml');
    }

    const xml = entry.getData().toString('utf8');
    const doc = mvrParser.parse(xml);

    const rawLayers =
      doc?.GeneralSceneDescription?.Scene?.Layers?.Layer ?? doc?.MVR?.Layers?.Layer ?? [];
    const layers = Array.isArray(rawLayers) ? rawLayers : [rawLayers];

    for (const layer of layers) {
      const layerName: string = layer['@_name'] ?? layer['@_Name'] ?? 'Unknown Position';

      const childLists = layer.ChildList
        ? Array.isArray(layer.ChildList)
          ? layer.ChildList
          : [layer.ChildList]
        : [];

      for (const { fixture: f } of collectFixtures(childLists, layerName)) {
        const gdtfSpec: string | undefined =
          typeof f.GDTFSpec === 'string' ? f.GDTFSpec : undefined;
        const gdtfMode: string | undefined =
          typeof f.GDTFMode === 'string' ? f.GDTFMode : undefined;

        // Parse primary DMX address (break="0")
        let universe: number | undefined;
        let dmxAddress: number | undefined;
        if (f.Addresses) {
          const addrs = f.Addresses.Address;
          const addrArray = Array.isArray(addrs) ? addrs : addrs != null ? [addrs] : [];
          const primary =
            addrArray.find((a: any) => String(a['@_break'] ?? a['@_Break'] ?? '') === '0') ??
            addrArray[0];
          if (primary != null) {
            const raw =
              typeof primary === 'object'
                ? Number(primary['#text'] ?? primary['@_value'] ?? primary)
                : Number(primary);
            if (!isNaN(raw) && raw > 0) {
              universe = Math.floor((raw - 1) / 512) + 1;
              dmxAddress = ((raw - 1) % 512) + 1;
            }
          }
        }

        // Resolve GDTF manufacturer/model/footprint
        let manufacturer: string | undefined;
        let model: string | undefined;
        let dmxFootprint: number | undefined;
        let gdtfResolved = false;

        if (gdtfSpec) {
          const parsed = parseGdtfSpec(gdtfSpec);
          if (parsed) {
            manufacturer = parsed.manufacturer;
            model = parsed.model;
            const modes = this.lookupModes(parsed.manufacturer, parsed.model);
            if (modes && gdtfMode) {
              const matched =
                modes.find((m) => m.name === gdtfMode) ??
                modes.find((m) => m.name.toLowerCase() === gdtfMode.toLowerCase());
              if (matched) {
                dmxFootprint = matched.channel_count;
                gdtfResolved = true;
              } else {
                warnings.push(`Mode "${gdtfMode}" not found for ${manufacturer} ${model}`);
              }
            } else if (!modes) {
              warnings.push(`Fixture not in GDTF cache: ${manufacturer} / ${model}`);
            }
          }
        }

        const rawFixtureId = f.FixtureID;
        const fixtureId = rawFixtureId != null ? String(rawFixtureId) : undefined;
        const rawUnit = f.UnitNumber;
        const unitNumber = rawUnit != null && !isNaN(Number(rawUnit)) ? Number(rawUnit) : undefined;

        fixtures.push({
          name: String(f['@_name'] ?? f['@_Name'] ?? ''),
          uuid: String(f['@_uuid'] ?? f['@_UUID'] ?? ''),
          layerName,
          gdtfSpec,
          gdtfMode,
          fixtureId,
          unitNumber,
          universe,
          dmxAddress,
          manufacturer,
          model,
          dmxFootprint,
          gdtfResolved,
        });
      }
    }

    logger.info('MVR parsed', {
      fixtures: fixtures.length,
      gdtfResolved: fixtures.filter((f) => f.gdtfResolved).length,
      warnings: warnings.length,
    });

    return { fixtures, warnings };
  }

  /**
   * Look up pre-parsed mode data from gdtf_cache by manufacturer + model.
   * Tries exact match first, then case-insensitive match.
   */
  private lookupModes(manufacturer: string, model: string): GdtfMode[] | null {
    const db = getAppDatabase();
    const id = `${manufacturer}/${model}`;
    let row = db.prepare('SELECT modes_json FROM gdtf_cache WHERE id = ?').get(id) as
      | { modes_json: string }
      | undefined;

    if (!row) {
      row = db
        .prepare(
          'SELECT modes_json FROM gdtf_cache WHERE LOWER(manufacturer) = LOWER(?) AND LOWER(model) = LOWER(?)',
        )
        .get(manufacturer, model) as { modes_json: string } | undefined;
    }

    if (!row) return null;
    try {
      return JSON.parse(row.modes_json) as GdtfMode[];
    } catch {
      return null;
    }
  }
}

export const mvrService = new MvrService();
