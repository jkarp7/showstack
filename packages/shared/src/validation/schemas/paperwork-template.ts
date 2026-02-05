/**
 * Paperwork Template Schema
 *
 * Validation schemas for paperwork template configuration entities
 */

import { z } from 'zod';
import { extendBaseEntity, OptionalIDSchema } from '../base';

/**
 * Report types for fixtures
 */
export const FixtureReportTypeSchema = z.enum([
  'channel-hookup',
  'dimmer-schedule',
  'circuit-list',
  'dmx-addresses',
  'power-summary',
  'color-schedule',
  'gobo-schedule',
  'color-cut-report'
]);

/**
 * Report types for infrastructure
 */
export const InfrastructureReportTypeSchema = z.enum([
  'infrastructure-list',
  'network-summary',
  'port-assignments',
  'infrastructure-power',
  'infrastructure-location'
]);

/**
 * Combined report type
 */
export const ReportTypeSchema = z.union([FixtureReportTypeSchema, InfrastructureReportTypeSchema]);

/**
 * Column format types for display formatting
 */
export const ColumnFormatTypeSchema = z.enum([
  'text',
  'number',
  'power',
  'amperage',
  'boolean',
  'date',
  'color'
]);

/**
 * Column display mode for header labels
 */
export const ColumnDisplayModeSchema = z.enum(['full', 'short', 'custom']);

/**
 * Column configuration for paperwork report tables
 */
export const PaperworkColumnConfigSchema = z.object({
  id: z.string().min(1),
  field: z.string().min(1), // 'channel', 'dimmer', 'position', etc.
  label: z.string().min(1), // Full label
  shortLabel: z.string().optional(), // Short/abbreviated label
  customLabel: z.string().optional(), // User-defined custom label
  displayMode: ColumnDisplayModeSchema.optional(), // Which label to display (default: 'full')
  width: z.number().nonnegative(), // percentage
  visible: z.boolean(),
  format: ColumnFormatTypeSchema.optional(),
  combinedWith: z.array(z.string()).optional(), // e.g., ['position', 'unit'] -> "FOH 1"
  separator: z.string().optional() // Separator for merged columns (default: ' • ')
});

/**
 * Grouping and sorting configuration
 */
export const ReportOrganizationSchema = z.object({
  groupBy: z.string().optional(), // 'dimmer', 'circuit', 'position', 'type', 'none'
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  showGroupHeaders: z.boolean().optional(),
  groupPageBreaks: z.boolean().optional()
});

/**
 * Font style options
 */
export const FontStyleSchema = z.object({
  fontFamily: z.string().optional(), // e.g., 'Arial', 'Times New Roman', 'Helvetica'
  fontSize: z.number().positive().optional(), // Base font size in points (default: 10)
  headerFontSize: z.number().positive().optional(), // Header font size in points (default: 11)
  fontWeight: z.enum(['normal', 'bold']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  lineHeight: z.number().positive().optional() // Line height multiplier (default: 1.2)
});

/**
 * Page setup configuration
 */
export const PageSetupSchema = z.object({
  size: z.enum(['letter', 'legal', 'a4', 'tabloid']),
  orientation: z.enum(['portrait', 'landscape']),
  colorMode: z.enum(['color', 'bw']),
  marginTop: z.number().nonnegative(),
  marginRight: z.number().nonnegative(),
  marginBottom: z.number().nonnegative(),
  marginLeft: z.number().nonnegative(),
  fontStyle: FontStyleSchema.optional() // Font customization settings
});

/**
 * Paperwork Template validation schema
 *
 * Complete paperwork template configuration including:
 * - Template identification (name, description, type)
 * - Header/Footer layout references
 * - Column configuration for report body
 * - Organization (grouping, sorting)
 * - Page setup (size, orientation, margins, fonts)
 */
export const PaperworkTemplateSchema = extendBaseEntity({
  // Template identification (required)
  name: z.string().min(1, 'Template name is required'),
  reportType: ReportTypeSchema,
  columns: z.array(PaperworkColumnConfigSchema).min(1, 'At least one column is required'),
  organization: ReportOrganizationSchema,
  pageSetup: PageSetupSchema,
  isSystem: z.boolean(),

  // Template identification (optional)
  description: z.string().optional(),

  // Header/Footer layout (references page_layout_templates)
  headerTemplateId: OptionalIDSchema,
  footerTemplateId: OptionalIDSchema
});

/**
 * Type exports (inferred from schemas)
 */
export type FixtureReportType = z.infer<typeof FixtureReportTypeSchema>;
export type InfrastructureReportType = z.infer<typeof InfrastructureReportTypeSchema>;
export type ReportType = z.infer<typeof ReportTypeSchema>;
export type ColumnFormatType = z.infer<typeof ColumnFormatTypeSchema>;
export type ColumnDisplayMode = z.infer<typeof ColumnDisplayModeSchema>;
export type PaperworkColumnConfig = z.infer<typeof PaperworkColumnConfigSchema>;
export type ReportOrganization = z.infer<typeof ReportOrganizationSchema>;
export type FontStyle = z.infer<typeof FontStyleSchema>;
export type PageSetup = z.infer<typeof PageSetupSchema>;
export type PaperworkTemplate = z.infer<typeof PaperworkTemplateSchema>;

/**
 * Schema for creating a new paperwork template (without id and timestamps)
 */
export const CreatePaperworkTemplateSchema = PaperworkTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

/**
 * Schema for updating a paperwork template (all fields optional except id, isSystem readonly)
 */
export const UpdatePaperworkTemplateSchema = PaperworkTemplateSchema.omit({
  isSystem: true
})
  .partial()
  .required({ id: true });

/**
 * Create paperwork template type
 */
export type CreatePaperworkTemplate = z.infer<typeof CreatePaperworkTemplateSchema>;

/**
 * Update paperwork template type
 */
export type UpdatePaperworkTemplate = z.infer<typeof UpdatePaperworkTemplateSchema>;
