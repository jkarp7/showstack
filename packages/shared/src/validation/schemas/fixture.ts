// @ts-nocheck
/**
 * Fixture Schema
 *
 * Validation schema for lighting fixture entities
 * Based on LightWright field structure
 */

import { z } from 'zod';
import { extendBaseEntity, OptionalIDSchema, OptionalTimestampSchema } from '../base';

/**
 * Color flag options for fixtures
 */
export const ColorFlagSchema = z
  .enum(['hot', 'spare', 'special', 'dimmer_doubles', 'two_fer'])
  .nullable()
  .optional();

/**
 * Fixture validation schema
 *
 * Validates all fields for a lighting fixture including:
 * - Position & identification
 * - Control (DMX, channels, universe)
 * - Power (dimmer, circuit, wattage)
 * - Color & accessories
 * - Cables & location
 * - Vectorworks integration
 * - Custom fields & audit trail
 */
export const FixtureSchema = extendBaseEntity({
  project_id: OptionalIDSchema,

  // Position & Identification (required fields)
  position: z.string().optional(),
  type: z.string().min(1, 'Fixture type is required'),

  // Position & Identification (optional fields)
  unit: z.number().int().positive().optional(),
  unit_number: z.number().int().positive().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  purpose: z.string().optional(),
  mark: z.string().optional(),

  // Control
  channel: z.string().optional(),
  universe: z.number().int().min(1).max(32768).optional(),
  dmx_address: z.number().int().min(1).max(512).optional(),
  dmx_footprint: z.number().int().min(1).max(512).optional(),
  mode: z.string().optional(),
  console_level: z.string().optional(),

  // Power
  dimmer: z.string().optional(),
  circuit: z.string().optional(),
  circuit_number: z.string().optional(),
  phase: z.string().optional(),
  wattage: z.number().nonnegative().optional(),
  amperage: z.number().nonnegative().optional(),

  // Color & Accessories
  color: z.string().optional(),
  color_frame: z.string().optional(),
  gobo: z.string().optional(),
  gobo_size: z.string().optional(),
  template_size: z.string().optional(),
  accessories: z.array(z.string()).optional(),

  // Cables
  cable: z.string().optional(),
  data_cable: z.string().optional(),

  // Location
  location: z.string().optional(),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  position_z: z.number().optional(),

  // System & Scenery
  system: z.string().optional(),
  scenery: z.string().optional(),

  // Vectorworks Integration
  vw_layer: z.string().optional(),
  vw_label_legend: z.string().optional(),
  vw_class: z.string().optional(),
  vw_x_coordinate: z.number().optional(),
  vw_y_coordinate: z.number().optional(),
  vw_z_coordinate: z.number().optional(),
  vw_symbol_rotation: z.number().optional(),
  vw_focus_point: z.string().optional(),
  on_light_plot: z.boolean().optional(),
  vw_uid: z.string().optional(),
  vw_symbol: z.string().optional(),

  // ShowStack ID
  showstack_id: z.string().optional(),

  // Status & Notes
  status: z.string().optional(),
  notes: z.string().optional(),
  work_note_status: z.string().optional(),
  hidden: z.boolean().optional(),

  // Color Flag
  color_flag: ColorFlagSchema,

  // Custom fields (flexible JSON)
  custom_fields: z.record(z.any()).optional(),

  // Audit Trail
  changed_at: OptionalTimestampSchema,
  changed_what: z.string().optional(),
  changed_who: z.string().optional(),

  // Computed/Virtual fields
  address: z.string().optional(),
});

/**
 * Fixture type (inferred from schema)
 */
export type Fixture = z.infer<typeof FixtureSchema>;

/**
 * Schema for creating a new fixture (without id and timestamps)
 */
export const CreateFixtureSchema = FixtureSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/**
 * Schema for updating a fixture (all fields optional except id)
 */
export const UpdateFixtureSchema = FixtureSchema.partial().required({ id: true });

/**
 * Create fixture type
 */
export type CreateFixture = z.infer<typeof CreateFixtureSchema>;

/**
 * Update fixture type
 */
export type UpdateFixture = z.infer<typeof UpdateFixtureSchema>;
