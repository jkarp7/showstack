import { getDatabase, saveDatabase } from '../index';
import { v4 as uuidv4 } from 'uuid';
import {
  PaginationOptions,
  PaginatedResult,
  normalizePaginationOptions,
  buildOrderByClause,
  buildPaginatedResult
} from '../utils/pagination';

// Extended Fixture interface matching database schema with LightWright parity
export interface Fixture {
  id: string;
  project_id?: string;

  // Position & Identification (LightWright: Position, Unit #, Instrument Type, Mark)
  position?: string;
  unit_number?: number;
  type?: string;
  manufacturer?: string;
  model?: string;
  purpose?: string;
  mark?: string;

  // Control (LightWright: Address, Channel, Universe, DMX #, Console Level)
  channel?: string;
  universe?: number;
  dmx_address?: number;
  mode?: string;
  console_level?: string;

  // Power (LightWright: Dimmer, Circuit Name, Circuit #, Load, Dimmer Phase)
  dimmer?: string;
  circuit?: string;        // Circuit name
  circuit_number?: string; // Circuit #
  phase?: string;
  wattage?: number;        // Load
  amperage?: number;

  // Color & Accessories (LightWright: Color, Gobo, Gobo Size, Accessory, Color Frame)
  color?: string;
  color_frame?: string;
  gobo?: string;
  gobo_size?: string;
  template_size?: string;
  accessories?: string[];

  // Cables (LightWright: Cable, Data Cable)
  cable?: string;
  data_cable?: string;

  // Location (LightWright: Position, Location)
  location?: string;
  position_x?: number;
  position_y?: number;
  position_z?: number;

  // Focus (LightWright: Focus L/R, U/D, Note, Cut submenu, Status)
  focus_lr?: string;
  focus_ud?: string;
  focus_note?: string;
  focus_cut_us?: string;
  focus_cut_ds?: string;
  focus_cut_sr?: string;
  focus_cut_sl?: string;
  focus_cut_top?: string;
  focus_cut_bottom?: string;
  focus_status?: string;

  // System & Scenery (LightWright: System, Scenery)
  system?: string;
  scenery?: string;

  // Vectorworks Integration (LightWright: Vectorworks submenu)
  vw_layer?: string;
  vw_label_legend?: string;
  vw_class?: string;
  vw_x_coordinate?: number;
  vw_y_coordinate?: number;
  vw_z_coordinate?: number;
  vw_symbol_rotation?: number;
  vw_focus_point?: string;
  on_light_plot?: boolean;
  vw_uid?: string;
  vw_symbol?: string;

  // ShowStack ID (LightWright: Lightwright ID)
  showstack_id?: string;

  // Status & Notes
  status?: string;
  notes?: string;
  work_note_status?: string;
  hidden?: boolean;
  color_flag?: 'hot' | 'spare' | 'special' | 'dimmer_doubles' | 'two_fer' | null;

  // Custom fields (JSON) - LightWright: User Columns (24)
  custom_fields?: Record<string, any>;

  // Audit Trail (LightWright: When, What, and Who Changed)
  changed_at?: number;
  changed_what?: string;
  changed_who?: string;

  // Metadata
  created_at?: number;
  updated_at?: number;

  // Computed/Virtual fields (not in database)
  address?: string; // Computed from universe/dmx_address as "universe/dmx_address"

  // Legacy POC compatibility
  unit?: number; // alias for unit_number
}

export function getAllFixtures(projectId: string = 'default-project'): Fixture[] {
  const db = getDatabase();

  const fixtures = db.prepare(`
    SELECT * FROM fixtures
    WHERE project_id = ?
    ORDER BY CAST(position AS INTEGER), position
  `).all(projectId);

  return fixtures.map((fixture: any) => {
    // Compute address from universe and dmx_address
    let address: string | undefined;
    if (fixture.universe && fixture.dmx_address) {
      address = `${fixture.universe}/${fixture.dmx_address}`;
    }

    return {
      ...fixture,
      unit: fixture.unit_number, // Compatibility alias
      address, // Computed field
      accessories: fixture.accessories ? JSON.parse(fixture.accessories) : [],
      custom_fields: fixture.custom_fields ? JSON.parse(fixture.custom_fields) : {},
      on_light_plot: Boolean(fixture.on_light_plot) // Convert to boolean
    } as Fixture;
  });
}

/**
 * Allowed sort fields for fixture pagination.
 * These are validated against to prevent SQL injection.
 * Object.freeze() provides runtime immutability protection.
 */
const FIXTURE_SORT_FIELDS = Object.freeze([
  'position',
  'unit_number',
  'channel',
  'universe',
  'dmx_address',
  'type',
  'purpose',
  'dimmer',
  'circuit',
  'color',
  'status',
  'created_at',
  'updated_at'
] as const);

/**
 * Get fixtures with pagination support.
 * Use this for large datasets to improve performance and memory usage.
 *
 * @param projectId - Project ID to filter by
 * @param options - Pagination options (offset, limit, sortBy, sortOrder)
 * @returns Paginated result with fixtures and metadata
 *
 * @example
 * ```typescript
 * // Get first page of 50 fixtures sorted by position
 * const page1 = getFixturesPaginated('project-id', { offset: 0, limit: 50 });
 *
 * // Get second page sorted by channel descending
 * const page2 = getFixturesPaginated('project-id', {
 *   offset: 50,
 *   limit: 50,
 *   sortBy: 'channel',
 *   sortOrder: 'DESC'
 * });
 * ```
 */
export function getFixturesPaginated(
  projectId: string = 'default-project',
  options: Partial<PaginationOptions> = {}
): PaginatedResult<Fixture> {
  const db = getDatabase();
  const normalized = normalizePaginationOptions(options, FIXTURE_SORT_FIELDS);
  const orderBy = buildOrderByClause(normalized.sortBy, normalized.sortOrder, FIXTURE_SORT_FIELDS);

  // Get total count
  const countResult = db.prepare(
    'SELECT COUNT(*) as count FROM fixtures WHERE project_id = ?'
  ).get(projectId) as { count: number };

  // Get paginated data
  const fixtures = db.prepare(`
    SELECT * FROM fixtures
    WHERE project_id = ?
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(projectId, normalized.limit, normalized.offset);

  // Transform fixtures (same as getAllFixtures)
  const transformedFixtures = fixtures.map((fixture: any) => {
    let address: string | undefined;
    if (fixture.universe && fixture.dmx_address) {
      address = `${fixture.universe}/${fixture.dmx_address}`;
    }

    return {
      ...fixture,
      unit: fixture.unit_number,
      address,
      accessories: fixture.accessories ? JSON.parse(fixture.accessories) : [],
      custom_fields: fixture.custom_fields ? JSON.parse(fixture.custom_fields) : {},
      on_light_plot: Boolean(fixture.on_light_plot)
    } as Fixture;
  });

  return buildPaginatedResult(transformedFixtures, countResult.count, normalized);
}

export function createFixture(
  fixture: Partial<Fixture>,
  projectId: string = 'default-project'
): Fixture {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();

  // Serialize arrays and objects
  const accessories = fixture.accessories ? JSON.stringify(fixture.accessories) : null;
  const customFields = fixture.custom_fields ? JSON.stringify(fixture.custom_fields) : null;

  db.prepare(`
    INSERT INTO fixtures (
      id, project_id, position, unit_number, type, manufacturer, model, purpose,
      channel, universe, dmx_address, dimmer, circuit, circuit_number,
      color, gobo, accessories, location, system, wattage,
      status, notes, custom_fields, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    projectId,
    fixture.position || '',
    fixture.unit_number || fixture.unit || null,
    fixture.type || '',
    fixture.manufacturer || null,
    fixture.model || null,
    fixture.purpose || '',
    fixture.channel || '',
    fixture.universe || null,
    fixture.dmx_address || null,
    fixture.dimmer || '',
    fixture.circuit || '',
    fixture.circuit_number || null,
    fixture.color || '',
    fixture.gobo || '',
    accessories,
    fixture.location || '',
    fixture.system || null,
    fixture.wattage || null,
    fixture.status || 'active',
    fixture.notes || '',
    customFields,
    now,
    now
  );

  saveDatabase();
  return getFixtureById(id);
}

/**
 * Allowed fields for fixture updates.
 * Frozen to prevent runtime modification (security hardening).
 */
const FIXTURE_ALLOWED_FIELDS = Object.freeze([
  'position', 'unit_number', 'type', 'manufacturer', 'model', 'purpose',
  'channel', 'universe', 'dmx_address', 'dimmer', 'circuit', 'circuit_number',
  'color', 'gobo', 'accessories', 'location', 'system', 'wattage',
  'status', 'notes', 'custom_fields',
  'dimmer_rack_id', 'dimmer_channel_number', 'pd_rack_id', 'pd_circuit_number',
  'hidden', 'color_flag'
] as const);

type FixtureAllowedField = typeof FIXTURE_ALLOWED_FIELDS[number];

function isFixtureAllowedField(field: string): field is FixtureAllowedField {
  return FIXTURE_ALLOWED_FIELDS.includes(field as FixtureAllowedField) || field === 'unit';
}

export function updateFixture(id: string, updates: Partial<Fixture>): Fixture {
  const db = getDatabase();
  const now = Date.now();

  const fields = Object.keys(updates).filter(isFixtureAllowedField);

  if (fields.length === 0) {
    return getFixtureById(id);
  }

  // Map 'unit' to 'unit_number' for compatibility
  const mappedUpdates = { ...updates };
  if ('unit' in mappedUpdates) {
    mappedUpdates.unit_number = mappedUpdates.unit;
    delete mappedUpdates.unit;
  }

  // Serialize arrays and objects for database storage
  if ('accessories' in mappedUpdates && Array.isArray(mappedUpdates.accessories)) {
    mappedUpdates.accessories = JSON.stringify(mappedUpdates.accessories) as any;
  }
  if ('custom_fields' in mappedUpdates && typeof mappedUpdates.custom_fields === 'object') {
    mappedUpdates.custom_fields = JSON.stringify(mappedUpdates.custom_fields) as any;
  }

  // Filter out 'unit' alias (which maps to unit_number) - cast needed since 'unit' is allowed by isFixtureAllowedField but not in type
  const filteredFields = fields.filter((f): f is FixtureAllowedField => (f as string) !== 'unit');

  const setClause = filteredFields
    .map(f => f === 'unit_number' ? 'unit_number = ?' : `${f} = ?`)
    .join(', ');

  const values = filteredFields
    .map(f => f === 'unit_number' ? mappedUpdates.unit_number : mappedUpdates[f]);

  db.prepare(`
    UPDATE fixtures
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `).run(...values, now, id);

  saveDatabase();
  return getFixtureById(id);
}

export function deleteFixture(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM fixtures WHERE id = ?').run(id);
  saveDatabase();
}

export function deleteMultipleFixtures(ids: string[]): void {
  const db = getDatabase();
  if (ids.length === 0) return;

  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM fixtures WHERE id IN (${placeholders})`).run(...ids);
  saveDatabase();
}

function getFixtureById(id: string): Fixture {
  const db = getDatabase();
  const fixture = db.prepare('SELECT * FROM fixtures WHERE id = ?').get(id);

  if (!fixture) {
    throw new Error(`Fixture with id ${id} not found`);
  }

  // Compute address from universe and dmx_address
  let address: string | undefined;
  if ((fixture as any).universe && (fixture as any).dmx_address) {
    address = `${(fixture as any).universe}/${(fixture as any).dmx_address}`;
  }

  return {
    ...(fixture as any),
    unit: (fixture as any).unit_number,
    address, // Computed field
    accessories: (fixture as any).accessories ? JSON.parse((fixture as any).accessories) : [],
    custom_fields: (fixture as any).custom_fields ? JSON.parse((fixture as any).custom_fields) : {},
    on_light_plot: Boolean((fixture as any).on_light_plot) // Convert to boolean
  };
}
