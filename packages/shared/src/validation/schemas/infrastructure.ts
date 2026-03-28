/**
 * Infrastructure Schema
 *
 * Validation schema for network and infrastructure equipment entities
 */

import { z } from 'zod';
import { extendBaseEntity, OptionalIDSchema } from '../base';
import { isValidIPv4 } from '../../utils/networkValidation';

/**
 * Port type options
 */
export const PortTypeSchema = z.enum(['ethernet', 'dmx', 'fiber', 'power', 'other']);

/**
 * Port status options
 */
export const PortStatusSchema = z.enum(['active', 'inactive', 'error']);

/**
 * Port Assignment validation schema
 *
 * Defines port connections and configurations for infrastructure equipment
 */
export const PortAssignmentSchema = z.object({
  port: z.number().int().positive(),
  connected_to: z.string().optional(), // Legacy free text

  // Port linking - structured connections
  linked_fixture_id: OptionalIDSchema,
  linked_equipment_id: OptionalIDSchema,
  linked_port: z.number().int().positive().optional(),

  type: PortTypeSchema.optional(),
  vlan: z.number().int().min(1).max(4094).optional(), // Valid VLAN range
  status: PortStatusSchema.optional(),
  notes: z.string().optional(),
});

/**
 * Infrastructure Equipment Category
 */
export const InfrastructureCategorySchema = z.enum([
  'network',
  'data_distribution',
  'audio',
  'video',
]);

/**
 * Infrastructure Equipment validation schema
 *
 * Validates all fields for infrastructure equipment including:
 * - Core identification (name, manufacturer, model)
 * - Network information (IP, MAC, subnet, gateway)
 * - Port assignments
 * - Power information (voltage, amperage, wattage)
 * - Power rack linking (dimmer/PD racks)
 * - Location
 * - Notes & status
 */
export const InfrastructureEquipmentSchema = extendBaseEntity({
  project_id: z.string().min(1, 'Project ID is required'),

  // Core identification (required)
  name: z.string().min(1, 'Equipment name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  status: z.string().min(1, 'Status is required'),

  // Core identification (optional)
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  category: InfrastructureCategorySchema.optional(),

  // Network information (all optional)
  ip_address: z
    .string()
    .refine((v) => v === '' || isValidIPv4(v), 'Invalid IP address')
    .optional(),
  mac_address: z.string().optional(),
  subnet_mask: z
    .string()
    .refine((v) => v === '' || isValidIPv4(v), 'Invalid subnet mask')
    .optional(),
  gateway: z
    .string()
    .refine((v) => v === '' || isValidIPv4(v), 'Invalid gateway address')
    .optional(),
  vlan_id: z.number().int().min(1).max(4094).optional(),
  hostname: z.string().optional(),

  // Port assignments
  port_assignments: z.array(PortAssignmentSchema).optional(),
  port_count: z.number().int().nonnegative().optional(),

  // Power information
  voltage: z.number().nonnegative().optional(),
  amperage: z.number().nonnegative().optional(),
  wattage: z.number().nonnegative().optional(),
  phase: z.string().optional(),

  // Power rack linking
  dimmer_rack_id: OptionalIDSchema,
  dimmer_channel_number: z.number().int().positive().optional(),
  pd_rack_id: OptionalIDSchema,
  pd_circuit_number: z.number().int().positive().optional(),
  pd_breaker_number: z.number().int().positive().optional(),
  circuit: z.string().optional(),
  circuit_number: z.number().int().positive().optional(),

  // Location
  location: z.string().optional(),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  position_z: z.number().optional(),

  // Notes
  notes: z.string().optional(),
});

/**
 * Type exports (inferred from schemas)
 */
export type PortType = z.infer<typeof PortTypeSchema>;
export type PortStatus = z.infer<typeof PortStatusSchema>;
export type PortAssignment = z.infer<typeof PortAssignmentSchema>;
export type InfrastructureCategory = z.infer<typeof InfrastructureCategorySchema>;
export type InfrastructureEquipment = z.infer<typeof InfrastructureEquipmentSchema>;

/**
 * Schema for creating a new infrastructure equipment (without id and timestamps)
 */
export const CreateInfrastructureEquipmentSchema = InfrastructureEquipmentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/**
 * Schema for updating infrastructure equipment (all fields optional except id)
 */
export const UpdateInfrastructureEquipmentSchema = InfrastructureEquipmentSchema.partial().required(
  {
    id: true,
  },
);

/**
 * Create infrastructure equipment type
 */
export type CreateInfrastructureEquipment = z.infer<typeof CreateInfrastructureEquipmentSchema>;

/**
 * Update infrastructure equipment type
 */
export type UpdateInfrastructureEquipment = z.infer<typeof UpdateInfrastructureEquipmentSchema>;
