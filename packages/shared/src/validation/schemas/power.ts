/**
 * Power Schema
 *
 * Validation schemas for power distribution entities (dimmer racks and PD racks)
 */

import { z } from 'zod';
import { extendBaseEntity, OptionalIDSchema } from '../base';

/**
 * Module type options for dimmer modules
 */
export const ModuleTypeSchema = z.enum(['dimmer', 'relay', 'constant_current', 'thrupower']);

/**
 * Phase configuration for electrical systems
 */
export const PhaseConfigSchema = z.enum(['single', 'split', 'three']);

/**
 * Phase designation (A, B, C)
 */
export const PhaseSchema = z.enum(['A', 'B', 'C']);

/**
 * Valid circuit count options
 */
export const CircuitCountSchema = z.union([
  z.literal(12),
  z.literal(24),
  z.literal(48),
  z.literal(96)
]);

/**
 * Valid voltage options
 */
export const VoltageSchema = z.union([
  z.literal(120),
  z.literal(208),
  z.literal(230),
  z.literal(240)
]);

/**
 * Dimmer Rack Module validation schema
 *
 * Defines module type for a circuit range within a dimmer rack
 */
export const DimmerRackModuleSchema = extendBaseEntity({
  rack_id: z.string().min(1, 'Rack ID is required'),

  // Circuit range (required)
  start_circuit: z.number().int().positive('Start circuit must be positive'),
  end_circuit: z.number().int().positive('End circuit must be positive'),
  module_type: ModuleTypeSchema,

  // Power specifications (optional)
  watts_per_circuit: z.number().nonnegative().optional(),
  notes: z.string().optional()
});

/**
 * Dimmer Rack validation schema
 *
 * For dimmed loads (conventional fixtures, LED with dimming)
 */
export const DimmerRackSchema = extendBaseEntity({
  project_id: z.string().min(1, 'Project ID is required'),

  // Rack identification (required)
  name: z.string().min(1, 'Rack name is required'),
  circuit_count: CircuitCountSchema,

  // Rack identification (optional)
  rack_identifier: z.string().optional(), // e.g., "A", "FOH", "ML", "DECK"
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  module_type: ModuleTypeSchema.optional(),
  channels_per_module: z.number().int().positive().optional(),
  watts_per_module: z.number().nonnegative().optional(),

  // Location and service
  location: z.string().optional(),
  building_service: z.string().optional(), // Service A, B, C, etc.

  // Notes
  notes: z.string().optional()
});

/**
 * PD (Power Distribution) Rack validation schema
 *
 * For direct power (non-dimmed loads)
 */
export const PDRackSchema = extendBaseEntity({
  project_id: z.string().min(1, 'Project ID is required'),

  // Rack identification (required)
  name: z.string().min(1, 'Rack name is required'),
  voltage: VoltageSchema,
  circuit_count: CircuitCountSchema,

  // Rack identification (optional)
  rack_identifier: z.string().optional(), // e.g., "Z", "FOH", "DECK"

  // Dual voltage support
  is_dual_voltage: z.boolean().optional(),
  secondary_voltage: z.number().nonnegative().optional(),

  // Phase and breaker configuration
  phase_config: PhaseConfigSchema.optional(),
  amps_per_breaker: z.number().nonnegative().optional(),

  // Location and service
  location: z.string().optional(),
  building_service: z.string().optional(), // Service A, B, C, etc.

  // Notes
  notes: z.string().optional()
});

/**
 * Type exports (inferred from schemas)
 */
export type ModuleType = z.infer<typeof ModuleTypeSchema>;
export type PhaseConfig = z.infer<typeof PhaseConfigSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type DimmerRackModule = z.infer<typeof DimmerRackModuleSchema>;
export type DimmerRack = z.infer<typeof DimmerRackSchema>;
export type PDRack = z.infer<typeof PDRackSchema>;

/**
 * Schemas for creating (without id and timestamps)
 */
export const CreateDimmerRackModuleSchema = DimmerRackModuleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const CreateDimmerRackSchema = DimmerRackSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const CreatePDRackSchema = PDRackSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

/**
 * Schemas for updating (all fields optional except id)
 */
export const UpdateDimmerRackModuleSchema = DimmerRackModuleSchema.partial().required({ id: true });
export const UpdateDimmerRackSchema = DimmerRackSchema.partial().required({ id: true });
export const UpdatePDRackSchema = PDRackSchema.partial().required({ id: true });

/**
 * Create types
 */
export type CreateDimmerRackModule = z.infer<typeof CreateDimmerRackModuleSchema>;
export type CreateDimmerRack = z.infer<typeof CreateDimmerRackSchema>;
export type CreatePDRack = z.infer<typeof CreatePDRackSchema>;

/**
 * Update types
 */
export type UpdateDimmerRackModule = z.infer<typeof UpdateDimmerRackModuleSchema>;
export type UpdateDimmerRack = z.infer<typeof UpdateDimmerRackSchema>;
export type UpdatePDRack = z.infer<typeof UpdatePDRackSchema>;
