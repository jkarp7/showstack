/**
 * MvrExportService — generates MVR (My Virtual Rig) export files.
 *
 * MVR is a ZIP archive containing:
 *   GeneralSceneDescription.xml  — fixture and scene data
 *   {Manufacturer}@{Model}@Rev.gdtf  — bundled GDTF files (when cached locally)
 *
 * Fixtures are grouped into Layers by position (lighting position → MVR Layer).
 * DMX addresses are converted to MVR's absolute format: (universe-1)*512 + dmx_address.
 */

import AdmZip from 'adm-zip';
import * as fs from 'fs';
import { XMLBuilder } from 'fast-xml-parser';
import { getAllFixtures, Fixture } from '../database/queries/fixtures';
import { getAppDatabase } from '../database';
import { logger } from '../utils/logger';

export interface MvrExportResult {
  success: boolean;
  fixtureCount: number;
  layerCount: number;
  gdtfBundled: number;
  error?: string;
}

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
});

/**
 * Convert ShowStack manufacturer+model to GDTFSpec filename format.
 * Spaces → underscores; format: {Manufacturer}@{Model}@Rev.gdtf
 */
function toGdtfSpec(manufacturer: string, model: string): string {
  const mfr = manufacturer.trim().replace(/\s+/g, '_');
  const mdl = model.trim().replace(/\s+/g, '_');
  return `${mfr}@${mdl}@Rev.gdtf`;
}

/**
 * Look up the cached GDTF file path for a fixture from gdtf_cache.
 * Returns the file path if found, null otherwise.
 */
function lookupCachedGdtfPath(manufacturer: string, model: string): string | null {
  const db = getAppDatabase();
  const id = `${manufacturer}/${model}`;

  let row = db.prepare('SELECT file_path FROM gdtf_cache WHERE id = ?').get(id) as
    | { file_path: string }
    | undefined;

  if (!row) {
    row = db
      .prepare(
        'SELECT file_path FROM gdtf_cache WHERE LOWER(manufacturer) = LOWER(?) AND LOWER(model) = LOWER(?)',
      )
      .get(manufacturer, model) as { file_path: string } | undefined;
  }

  if (!row?.file_path) return null;

  try {
    if (fs.existsSync(row.file_path)) return row.file_path;
  } catch (err) {
    logger.warn('Error checking GDTF file existence', {
      path: row.file_path,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}

export class MvrExportService {
  /**
   * Export all fixtures from a project to an MVR file at the given output path.
   */
  export(projectId: string, outputPath: string, projectName: string): MvrExportResult {
    const fixtures = getAllFixtures(projectId).filter((f) => f.status !== 'hidden');

    // Group fixtures by position → one MVR Layer per position
    const byPosition = new Map<string, Fixture[]>();
    for (const f of fixtures) {
      const pos = f.position?.trim() || 'Unassigned';
      if (!byPosition.has(pos)) byPosition.set(pos, []);
      byPosition.get(pos)!.push(f);
    }

    // Collect GDTF files to bundle (deduplicated by spec filename)
    const gdtfFiles = new Map<string, string>(); // specFilename → local file path

    // Build Layer elements
    const layers = Array.from(byPosition.entries()).map(([posName, posFixtures]) => {
      const fixtures = posFixtures.map((f) => this.buildFixtureElement(f, gdtfFiles));
      return {
        '@_name': posName,
        '@_uuid': this.pseudoUuid(posName),
        ChildList: fixtures.length > 0 ? { Fixture: fixtures } : undefined,
      };
    });

    // Build the full XML document object
    const doc = {
      '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
      GeneralSceneDescription: {
        '@_verMajor': '1',
        '@_verMinor': '6',
        UserData: {
          Data: {
            '@_provider': 'ShowStack',
            '@_ver': '1.0',
            '@_projectName': projectName,
          },
        },
        Scene: {
          Layers: {
            Layer: layers,
          },
        },
      },
    };

    const xml = xmlBuilder.build(doc);

    // Create the ZIP
    const zip = new AdmZip();
    zip.addFile('GeneralSceneDescription.xml', Buffer.from(xml, 'utf8'));

    // Bundle GDTF files
    let gdtfBundled = 0;
    for (const [specFilename, filePath] of gdtfFiles) {
      try {
        const gdtfData = fs.readFileSync(filePath);
        zip.addFile(specFilename, gdtfData);
        gdtfBundled++;
      } catch (err) {
        logger.warn('Failed to bundle GDTF file', {
          specFilename,
          filePath,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    zip.writeZip(outputPath);

    const result: MvrExportResult = {
      success: true,
      fixtureCount: fixtures.length,
      layerCount: byPosition.size,
      gdtfBundled,
    };

    logger.info('MVR export complete', {
      fixtureCount: result.fixtureCount,
      layerCount: result.layerCount,
      gdtfBundled: result.gdtfBundled,
    });
    return result;
  }

  private buildFixtureElement(f: Fixture, gdtfFiles: Map<string, string>): Record<string, unknown> {
    const el: Record<string, unknown> = {
      '@_name': f.type ?? f.model ?? 'Fixture',
      '@_uuid': f.id,
    };

    // GDTFSpec + GDTFMode — only when manufacturer and model are set
    if (f.manufacturer?.trim() && f.model?.trim()) {
      const specFilename = toGdtfSpec(f.manufacturer, f.model);
      el.GDTFSpec = specFilename;
      if (f.mode?.trim()) {
        el.GDTFMode = f.mode;
      }
      // Register GDTF file for bundling if available in cache
      if (!gdtfFiles.has(specFilename)) {
        const cachedPath = lookupCachedGdtfPath(f.manufacturer, f.model);
        if (cachedPath) {
          gdtfFiles.set(specFilename, cachedPath);
        }
      }
    }

    // DMX address (absolute: (universe-1)*512 + dmx_address)
    if (f.universe != null && f.dmx_address != null) {
      const absoluteAddr = (f.universe - 1) * 512 + f.dmx_address;
      el.Addresses = {
        Address: {
          '@_break': '0',
          '#text': String(absoluteAddr),
        },
      };
    }

    if (f.channel != null) el.FixtureID = String(f.channel);
    if (f.unit_number != null) el.UnitNumber = f.unit_number;

    // Optional: 3D position from VW coordinates
    if (f.vw_x_coordinate != null && f.vw_y_coordinate != null && f.vw_z_coordinate != null) {
      // MVR uses metres; VW coordinates are typically in mm — convert
      const scale = 0.001;
      el.Position = {
        '@_x': (f.vw_x_coordinate * scale).toFixed(4),
        '@_y': (f.vw_y_coordinate * scale).toFixed(4),
        '@_z': (f.vw_z_coordinate * scale).toFixed(4),
      };
    }

    return el;
  }

  /**
   * Generate a stable pseudo-UUID from a string (deterministic, not cryptographic).
   * Used for Layer UUIDs so re-exports produce the same file.
   */
  private pseudoUuid(seed: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    const hex = h.toString(16).padStart(8, '0');
    return `${hex}-0000-4000-8000-000000000000`;
  }
}

export const mvrExportService = new MvrExportService();
