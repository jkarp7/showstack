/**
 * Page Layout Template Schema
 *
 * Validation schemas for visual page layout designer system
 */

import { z } from 'zod';
import { extendBaseEntity } from '../base';

/**
 * Print section types that can use page layouts
 */
export const PrintSectionTypeSchema = z.enum([
  'cover',
  'project-details',
  'venue-info',
  'schedule',
  'contacts',
  'equipment-by-section',
  'equipment-summary',
  'notes',
  'revision-summary',
  'custom-text',
  'paperwork-header',
  'page-break',
  'label_5160',
  'label_5163',
  'label_5164',
  'label_8160',
  'label_5167',
]);

/**
 * Element types that can be placed on the canvas
 */
export const LayoutElementTypeSchema = z.enum([
  'dataField',
  'text',
  'image',
  'table',
  'shape',
  'equipment_list',
  'notes_content',
  'revision_log',
]);

/**
 * Data field types that can be displayed
 */
export const DataFieldTypeSchema = z.enum([
  // Production fields
  'production_name',
  'venue',
  'venue_city',
  'venue_state',
  'order_date',
  'prep_start_date',
  'prep_end_date',
  'load_in_date',
  'first_preview_date',
  'opening_night_date',
  'closing_date',
  'load_out_date',
  // Contact fields
  'gm_name',
  'gm_company',
  'gm_email',
  'gm_phone',
  'pm_name',
  'pm_company',
  'pm_email',
  'pm_phone',
  'ld_name',
  'ld_email',
  'ld_phone',
  'ald_name',
  'ald_email',
  'ald_phone',
  'pe_name',
  'pe_email',
  'pe_phone',
  // Project fields
  'current_revision',
  'disciplines',
  'logo',
  // Paperwork-specific fields
  'report_title',
  'revision_date',
  'generated_date',
  // Fixture summary fields
  'total_fixtures',
  'total_wattage',
  'total_amperage',
  'universe_count',
  'fixture_type_count',
  // Infrastructure summary fields
  'total_infrastructure',
  'network_equipment_count',
  'audio_equipment_count',
  'video_equipment_count',
  'data_distribution_count',
  'total_ports',
  'active_infrastructure',
  'inactive_infrastructure',
]);

/**
 * Shape types for visual elements
 */
export const ShapeTypeSchema = z.enum(['rectangle', 'line', 'divider']);

/**
 * Configuration for data field elements
 */
export const DataFieldConfigSchema = z.object({
  fieldType: DataFieldTypeSchema,
  label: z.string().optional(), // Optional label to show before the value
  showLabel: z.boolean().optional(),
  dateFormat: z.string().optional(), // For date fields
});

/**
 * Configuration for text elements
 */
export const TextConfigSchema = z.object({
  content: z.string(),
  placeholder: z.string().optional(),
});

/**
 * Configuration for image elements
 */
export const ImageConfigSchema = z.object({
  src: z.string().optional(), // URL or base64
  altText: z.string().optional(),
  objectFit: z.enum(['contain', 'cover', 'fill']).optional(),
});

/**
 * Configuration for table elements
 */
export const TableConfigSchema = z.object({
  contactTypes: z.array(z.string()), // Which contacts to include
  showHeaders: z.boolean().optional(),
  columns: z.array(
    z.object({
      field: z.string(),
      label: z.string(),
      width: z.number().optional(),
    }),
  ),
});

/**
 * Configuration for shape elements
 */
export const ShapeConfigSchema = z.object({
  shapeType: ShapeTypeSchema,
  thickness: z.number().optional(),
  color: z.string().optional(),
});

/**
 * Configuration for equipment list elements (dynamic content)
 */
export const EquipmentListConfigSchema = z.object({
  // Equipment list is rendered dynamically from project data
});

/**
 * Configuration for notes content elements (dynamic content)
 */
export const NotesContentConfigSchema = z.object({
  noteType: z.enum(['general_conditions', 'general_notes', 'fixture_notes']).optional(),
});

/**
 * Configuration for revision log elements (dynamic content)
 */
export const RevisionLogConfigSchema = z.object({
  // Revision log is rendered dynamically from project data
});

/**
 * Union type for all element configurations
 */
export const ElementConfigSchema = z.union([
  DataFieldConfigSchema,
  TextConfigSchema,
  ImageConfigSchema,
  TableConfigSchema,
  ShapeConfigSchema,
  EquipmentListConfigSchema,
  NotesContentConfigSchema,
  RevisionLogConfigSchema,
]);

/**
 * Font weight options (CSS font-weight values)
 */
export const FontWeightSchema = z.enum([
  'normal',
  'bold',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
]);

/**
 * Styling options for elements
 */
export const ElementStyleSchema = z.object({
  // Typography
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: FontWeightSchema.optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),

  // Colors
  color: z.string().optional(),
  backgroundColor: z.string().optional(),

  // Borders
  borderWidth: z.number().optional(),
  borderStyle: z.enum(['none', 'solid', 'dashed', 'dotted']).optional(),
  borderColor: z.string().optional(),
  borderRadius: z.number().optional(),

  // Spacing
  padding: z.number().optional(),
  paddingTop: z.number().optional(),
  paddingRight: z.number().optional(),
  paddingBottom: z.number().optional(),
  paddingLeft: z.number().optional(),

  // Display
  opacity: z.number().optional(),
});

/**
 * Layout element placed on the canvas
 */
export const LayoutElementSchema = extendBaseEntity({
  element_type: LayoutElementTypeSchema,
  config: ElementConfigSchema,

  // Grid position (required)
  grid_column: z.number().int().nonnegative(),
  grid_row: z.number().int().nonnegative(),
  column_span: z.number().int().positive(),
  row_span: z.number().int().positive(),

  // Layer (z-index)
  layer: z.number().int().nonnegative(),

  // Styling
  style: ElementStyleSchema,
});

/**
 * Page layout template config (stored as JSON in database)
 */
export const PageLayoutTemplateConfigSchema = z.object({
  backgroundColor: z.string().optional(), // Hex color code (e.g., '#ffffff')
});

/**
 * Page layout template (app-level user preference)
 */
export const PageLayoutTemplateSchema = extendBaseEntity({
  user_id: z.string().optional(), // Optional user identifier

  // Template identification (required)
  name: z.string().min(1, 'Template name is required'),
  page_type: PrintSectionTypeSchema,
  is_default: z.boolean(),

  // Grid configuration (required)
  grid_columns: z.number().int().positive(),
  grid_rows: z.number().int().positive(),
  grid_gap: z.number().nonnegative(), // pixels

  // Page settings (required)
  page_width: z.number().positive(), // pixels
  page_height: z.number().positive(), // pixels

  // Template configuration (optional)
  description: z.string().optional(),
  config: PageLayoutTemplateConfigSchema.optional(),

  // Elements (optional, can be empty array)
  elements: z.array(LayoutElementSchema).optional(),
});

/**
 * Type exports (inferred from schemas)
 */
export type PrintSectionType = z.infer<typeof PrintSectionTypeSchema>;
export type LayoutElementType = z.infer<typeof LayoutElementTypeSchema>;
export type DataFieldType = z.infer<typeof DataFieldTypeSchema>;
export type ShapeType = z.infer<typeof ShapeTypeSchema>;
export type DataFieldConfig = z.infer<typeof DataFieldConfigSchema>;
export type TextConfig = z.infer<typeof TextConfigSchema>;
export type ImageConfig = z.infer<typeof ImageConfigSchema>;
export type TableConfig = z.infer<typeof TableConfigSchema>;
export type ShapeConfig = z.infer<typeof ShapeConfigSchema>;
export type EquipmentListConfig = z.infer<typeof EquipmentListConfigSchema>;
export type NotesContentConfig = z.infer<typeof NotesContentConfigSchema>;
export type RevisionLogConfig = z.infer<typeof RevisionLogConfigSchema>;
export type ElementConfig = z.infer<typeof ElementConfigSchema>;
export type FontWeight = z.infer<typeof FontWeightSchema>;
export type ElementStyle = z.infer<typeof ElementStyleSchema>;
export type LayoutElement = z.infer<typeof LayoutElementSchema>;
export type PageLayoutTemplateConfig = z.infer<typeof PageLayoutTemplateConfigSchema>;
export type PageLayoutTemplate = z.infer<typeof PageLayoutTemplateSchema>;

/**
 * Schema for creating a new layout element (without id and timestamps)
 */
export const CreateLayoutElementSchema = LayoutElementSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/**
 * Schema for creating a new page layout template (without id, timestamps, and elements)
 */
export const CreatePageLayoutTemplateSchema = PageLayoutTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  elements: true,
});

/**
 * Schema for updating a layout element (all fields optional except id)
 */
export const UpdateLayoutElementSchema = LayoutElementSchema.partial().required({ id: true });

/**
 * Schema for updating a page layout template (all fields optional except id)
 */
export const UpdatePageLayoutTemplateSchema = PageLayoutTemplateSchema.partial().required({
  id: true,
});

/**
 * Create types
 */
export type CreateLayoutElement = z.infer<typeof CreateLayoutElementSchema>;
export type CreatePageLayoutTemplate = z.infer<typeof CreatePageLayoutTemplateSchema>;

/**
 * Update types
 */
export type UpdateLayoutElement = z.infer<typeof UpdateLayoutElementSchema>;
export type UpdatePageLayoutTemplate = z.infer<typeof UpdatePageLayoutTemplateSchema>;
