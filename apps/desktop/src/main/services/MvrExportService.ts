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
import { z } from 'zod';
import { getAllFixtures, Fixture } from '../database/queries/fixtures';
import { getAppDatabase } from '../database';
import { logger } from '../utils/logger';

const GdtfCacheRowSchema = z.object({ file_path: z.string() });

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

const MM_TO_METERS = 0.001;

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
 * Returns the file path if found and accessible, null otherwise.
 */
async function lookupCachedGdtfPath(manufacturer: string, model: string): Promise<string | null> {
  const db = getAppDatabase();
  const id = `${manufacturer}/${model}`;

  let rowData: unknown = db.prepare('SELECT file_path FROM gdtf_cache WHERE id = ?').get(id);

  if (!rowData) {
    rowData = db
      .prepare(
        'SELECT file_path FROM gdtf_cache WHERE manufacturer = ? COLLATE NOCASE AND model = ? COLLATE NOCASE',
      )
      .get(manufacturer, model);
  }

  const parsed = GdtfCacheRowSchema.safeParse(rowData);
  if (!parsed.success) return null;

  const { file_path } = parsed.data;

  try {
    await fs.promises.access(file_path);
    return file_path;
  } catch (err) {
    logger.warn('Error checking GDTF file existence', {
      path: file_path,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export class MvrExportService {
  /**
   * Export all fixtures from a project to an MVR file at the given output path.
   */
  async export(
    projectId: string,
    outputPath: string,
    projectName: string,
  ): Promise<MvrExportResult> {
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

    // Build Layer elements (async to allow non-blocking GDTF path lookups)
    const layers = await Promise.all(
      Array.from(byPosition.entries()).map(async ([posName, posFixtures]) => {
        const fixtureElements = await Promise.all(
          posFixtures.map((f) => this.buildFixtureElement(f, gdtfFiles)),
        );
        return {
          '@_name': posName,
          '@_uuid': this.pseudoUuid(posName),
          ChildList: fixtureElements.length > 0 ? { Fixture: fixtureElements } : undefined,
        };
      }),
    );

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

    // Bundle GDTF files in parallel
    const bundleResults = await Promise.all(
      Array.from(gdtfFiles.entries()).map(async ([specFilename, filePath]) => {
        try {
          const gdtfData = await fs.promises.readFile(filePath);
          zip.addFile(specFilename, gdtfData);
          return true;
        } catch (err) {
          logger.warn('Failed to bundle GDTF file', {
            specFilename,
            filePath,
            error: err instanceof Error ? err.message : String(err),
          });
          return false;
        }
      }),
    );
    const gdtfBundled = bundleResults.filter(Boolean).length;

    await zip.writeZipPromise(outputPath);

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

  private async buildFixtureElement(
    f: Fixture,
    gdtfFiles: Map<string, string>,
  ): Promise<Record<string, unknown>> {
    const el: Record<string, unknown> = {
      '@_name': f.type ?? f.model ?? 'Fixture',
      '@_uuid': f.id,
    };

    // GDTFSpec + GDTFMode — only when manufacturer and model are set
    if (f.manufacturer?.trim() && f.model?.trim()) {
      const manufacturer = f.manufacturer.trim();
      const model = f.model.trim();
      const specFilename = toGdtfSpec(manufacturer, model);
      el.GDTFSpec = specFilename;
      if (f.mode?.trim()) {
        el.GDTFMode = f.mode.trim();
      }
      // Register GDTF file for bundling if available in cache
      if (!gdtfFiles.has(specFilename)) {
        const cachedPath = await lookupCachedGdtfPath(manufacturer, model);
        if (cachedPath) {
          gdtfFiles.set(specFilename, cachedPath);
        }
      }
    }

    // DMX address (absolute: (universe-1)*512 + dmx_address)
    if (f.universe != null && f.universe > 0 && f.dmx_address != null && f.dmx_address > 0) {
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
      el.Position = {
        '@_x': (f.vw_x_coordinate * MM_TO_METERS).toFixed(4),
        '@_y': (f.vw_y_coordinate * MM_TO_METERS).toFixed(4),
        '@_z': (f.vw_z_coordinate * MM_TO_METERS).toFixed(4),
      };
    }

    return el;
  }

  /**
   * Generate a stable pseudo-UUID from a string (deterministic, not cryptographic).
   * Used for Layer UUIDs so re-exports produce the same file.
   */
  private pseudoUuid(seed: string): string {
    // FNV-1a 32-bit hash constants
    const FNV_OFFSET_BASIS = 0x811c9dc5;
    const FNV_PRIME = 0x01000193;

    let h = FNV_OFFSET_BASIS;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = (h * FNV_PRIME) >>> 0;
    }
    const hex = h.toString(16).padStart(8, '0');
    return `${hex}-0000-4000-8000-000000000000`;
  }
}

export const mvrExportService = new MvrExportService();
