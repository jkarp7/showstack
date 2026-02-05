/**
 * Shop Order Schema
 *
 * Validation schemas for ShowStack:Prep (shop order/specification) entities
 */

import { z } from 'zod';
import { extendBaseEntity, OptionalIDSchema, OptionalTimestampSchema } from '../base';

/**
 * Discipline types for multi-discipline support
 */
export const DisciplineSchema = z.enum(['lighting', 'audio', 'video', 'rigging', 'scenic', 'props']);

/**
 * Note types for the 3-tier notes system
 */
export const NoteTypeSchema = z.enum(['general_conditions', 'general_notes', 'fixture_notes', 'revision']);

/**
 * Contact information schema
 */
export const ContactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional()
});

/**
 * Additional discipline-specific contact schema
 */
export const AdditionalContactSchema = ContactSchema.extend({
  role: z.string(),
  discipline: DisciplineSchema.optional()
});

/**
 * Shop Order Project validation schema
 *
 * Main shop order/specification document with:
 * - Production information
 * - Show dates
 * - Team contacts (GM, PM, LD, ALD, PE)
 * - Additional discipline contacts
 * - Logo and disciplines
 * - Revision tracking
 */
export const ShopOrderProjectSchema = extendBaseEntity({
  user_id: z.string().optional(),
  parent_project_id: OptionalIDSchema,

  // Production Information (required)
  production_name: z.string().min(1, 'Production name is required'),
  order_date: z.number().int().positive('Order date must be positive'),

  // Production Information (optional)
  venue: z.string().optional(),
  venue_city: z.string().optional(),
  venue_state: z.string().optional(),
  original_order_date: z.number().int().positive().optional(),

  // Show Dates (all optional, stored as strings for flexible formatting)
  prep_start_date: z.string().optional(),
  prep_end_date: z.string().optional(),
  load_in_date: z.string().optional(),
  first_preview_date: z.string().optional(),
  opening_night_date: z.string().optional(),
  closing_date: z.string().optional(),
  load_out_date: z.string().optional(),

  // General Manager Contact
  gm_name: z.string().optional(),
  gm_company: z.string().optional(),
  gm_email: z.string().email().optional().or(z.literal('')),
  gm_phone: z.string().optional(),

  // Production Manager Contact
  pm_name: z.string().optional(),
  pm_company: z.string().optional(),
  pm_email: z.string().email().optional().or(z.literal('')),
  pm_phone: z.string().optional(),

  // Lighting Designer Contact
  ld_name: z.string().optional(),
  ld_email: z.string().email().optional().or(z.literal('')),
  ld_phone: z.string().optional(),

  // Associate Lighting Designer Contact
  ald_name: z.string().optional(),
  ald_email: z.string().email().optional().or(z.literal('')),
  ald_phone: z.string().optional(),

  // Production Electrician Contact
  pe_name: z.string().optional(),
  pe_email: z.string().email().optional().or(z.literal('')),
  pe_phone: z.string().optional(),

  // Additional discipline contacts (stored as JSON array in database)
  additional_contacts: z.array(AdditionalContactSchema).optional(),

  // Logo
  logo_url: z.string().url().optional().or(z.literal('')),
  logo_storage_path: z.string().optional(),

  // Disciplines enabled for this project (required)
  disciplines: z.array(DisciplineSchema).min(1, 'At least one discipline is required'),

  // Current revision number (0-5, 0 = no revisions yet)
  current_revision: z.number().int().min(0).max(5)
});

/**
 * Shop Order Section validation schema
 *
 * Organizational grouping of equipment (e.g., "Moving Lights", "LED Fixtures")
 */
export const ShopOrderSectionSchema = extendBaseEntity({
  prep_project_id: z.string().min(1, 'Prep project ID is required'),

  // Section details (required)
  name: z.string().min(1, 'Section name is required'),
  discipline: DisciplineSchema,
  sort_order: z.number().int().nonnegative(),
  page_break: z.boolean(),

  // Section notes (optional)
  notes: z.string().optional()
});

/**
 * Shop Order Item validation schema
 *
 * Individual piece of equipment in a shop order
 */
export const ShopOrderItemSchema = extendBaseEntity({
  section_id: z.string().min(1, 'Section ID is required'),

  // Item details (required)
  description: z.string().min(1, 'Description is required'),
  active_qty: z.number().int().nonnegative(),
  spare_qty: z.number().int().nonnegative(),
  venue_qty: z.number().int().nonnegative(),

  // Calculated fields (required)
  total_qty: z.number().int().nonnegative(),
  venue_active: z.number().nonnegative(),
  venue_spare: z.number().nonnegative(),

  // Optional fields
  weight: z.number().nonnegative().optional(),
  power: z.number().nonnegative().optional(),
  notes: z.string().optional(),

  // Sort order
  sort_order: z.number().int().nonnegative(),

  // Revision tracking (old columns - kept for rollback safety)
  added_in_revision: z.number().int().min(0).max(5).optional(),
  removed_in_revision: z.number().int().min(0).max(5).optional(),
  modified_in_revision: z.number().int().min(0).max(5).optional(),

  // NEW: Table-based revision tracking
  revision_quantities: z.string().optional(), // JSON string: { "0": 10, "1": 12, "2": 8 }
  deleted_in_revision: z.number().int().min(0).max(5).optional()
});

/**
 * Change types for revision tracking
 */
export const ChangeTypeSchema = z.enum(['addition', 'deletion', 'modification']);

/**
 * Individual change in a revision
 */
export const ItemChangeSchema = z.object({
  item_id: z.string().min(1),
  change_type: ChangeTypeSchema,
  description: z.string(),
  section_name: z.string().optional(),
  old_values: z.record(z.any()).optional(), // Partial<ShopOrderItem>
  new_values: z.record(z.any()).optional() // Partial<ShopOrderItem>
});

/**
 * Shop Order Revision validation schema
 *
 * Snapshot of changes between versions
 */
export const ShopOrderRevisionSchema = extendBaseEntity({
  prep_project_id: z.string().min(1, 'Prep project ID is required'),

  // Revision details (required)
  revision_number: z.number().int().min(1).max(5),
  revision_date: z.number().int().positive('Revision date must be positive'),

  // Revision notes and change log (optional)
  notes: z.string().optional(),
  change_log: z.array(ItemChangeSchema), // Automatically generated change summary
  spare_snapshot: z.string().optional() // JSON: snapshot of spare quantities { "item_id": spare_qty }
});

/**
 * Shop Order Note validation schema
 *
 * 3-tier notes system for general conditions, general notes, and fixture notes
 */
export const ShopOrderNoteSchema = extendBaseEntity({
  prep_project_id: z.string().min(1, 'Prep project ID is required'),

  // Note details (required)
  type: NoteTypeSchema,
  content: z.string(),
  format: z.enum(['plain', 'bullets', 'numbered'])
});

/**
 * Shop Order Note Template validation schema
 *
 * Reusable standard language for notes
 */
export const ShopOrderNoteTemplateSchema = extendBaseEntity({
  user_id: z.string().optional(),

  // Template details (required)
  type: z.enum(['general_conditions', 'general_notes', 'fixture_notes']),
  name: z.string().min(1, 'Template name is required'),
  content: z.string(),
  is_default: z.number().int().min(0).max(1) // 0 or 1 (boolean as integer for SQLite)
});

/**
 * Type exports (inferred from schemas)
 */
export type Discipline = z.infer<typeof DisciplineSchema>;
export type NoteType = z.infer<typeof NoteTypeSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type AdditionalContact = z.infer<typeof AdditionalContactSchema>;
export type ShopOrderProject = z.infer<typeof ShopOrderProjectSchema>;
export type ShopOrderSection = z.infer<typeof ShopOrderSectionSchema>;
export type ShopOrderItem = z.infer<typeof ShopOrderItemSchema>;
export type ChangeType = z.infer<typeof ChangeTypeSchema>;
export type ItemChange = z.infer<typeof ItemChangeSchema>;
export type ShopOrderRevision = z.infer<typeof ShopOrderRevisionSchema>;
export type ShopOrderNote = z.infer<typeof ShopOrderNoteSchema>;
export type ShopOrderNoteTemplate = z.infer<typeof ShopOrderNoteTemplateSchema>;

/**
 * Schemas for creating (without id and timestamps)
 */
export const CreateShopOrderProjectSchema = ShopOrderProjectSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const CreateShopOrderSectionSchema = ShopOrderSectionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const CreateShopOrderItemSchema = ShopOrderItemSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const CreateShopOrderRevisionSchema = ShopOrderRevisionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const CreateShopOrderNoteSchema = ShopOrderNoteSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const CreateShopOrderNoteTemplateSchema = ShopOrderNoteTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

/**
 * Schemas for updating (all fields optional except id)
 */
export const UpdateShopOrderProjectSchema = ShopOrderProjectSchema.partial().required({ id: true });
export const UpdateShopOrderSectionSchema = ShopOrderSectionSchema.partial().required({ id: true });
export const UpdateShopOrderItemSchema = ShopOrderItemSchema.partial().required({ id: true });
export const UpdateShopOrderRevisionSchema = ShopOrderRevisionSchema.partial().required({ id: true });
export const UpdateShopOrderNoteSchema = ShopOrderNoteSchema.partial().required({ id: true });
export const UpdateShopOrderNoteTemplateSchema = ShopOrderNoteTemplateSchema.partial().required({ id: true });

/**
 * Create types (inferred from create schemas)
 */
export type CreateShopOrderProject = z.infer<typeof CreateShopOrderProjectSchema>;
export type CreateShopOrderSection = z.infer<typeof CreateShopOrderSectionSchema>;
export type CreateShopOrderItem = z.infer<typeof CreateShopOrderItemSchema>;
export type CreateShopOrderRevision = z.infer<typeof CreateShopOrderRevisionSchema>;
export type CreateShopOrderNote = z.infer<typeof CreateShopOrderNoteSchema>;
export type CreateShopOrderNoteTemplate = z.infer<typeof CreateShopOrderNoteTemplateSchema>;

/**
 * Update types (inferred from update schemas)
 */
export type UpdateShopOrderProject = z.infer<typeof UpdateShopOrderProjectSchema>;
export type UpdateShopOrderSection = z.infer<typeof UpdateShopOrderSectionSchema>;
export type UpdateShopOrderItem = z.infer<typeof UpdateShopOrderItemSchema>;
export type UpdateShopOrderRevision = z.infer<typeof UpdateShopOrderRevisionSchema>;
export type UpdateShopOrderNote = z.infer<typeof UpdateShopOrderNoteSchema>;
export type UpdateShopOrderNoteTemplate = z.infer<typeof UpdateShopOrderNoteTemplateSchema>;
