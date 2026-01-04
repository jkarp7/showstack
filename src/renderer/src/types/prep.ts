/**
 * ShowStack:Prep Type Definitions
 * Professional equipment ordering and specification tool
 */

// Discipline types for multi-discipline support
export type Discipline = 'lighting' | 'audio' | 'video' | 'rigging' | 'scenic' | 'props';

// Note types for the 3-tier notes system
export type NoteType = 'general_conditions' | 'general_notes' | 'fixture_notes' | 'revision';

// Contact information interface
export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
}

// Additional discipline-specific contacts
export interface AdditionalContact extends Contact {
  role: string;
  discipline?: Discipline;
}

/**
 * Prep Project - Main shop order/specification document
 */
export interface PrepProject {
  id: string;
  user_id?: string;
  parent_project_id?: string; // Optional link to parent ShowStack project

  // Production Information
  production_name: string;
  venue?: string;
  venue_city?: string;
  venue_state?: string;
  order_date: number;
  original_order_date?: number;

  // Show Dates
  prep_start_date?: string;
  prep_end_date?: string;
  load_in_date?: string;
  first_preview_date?: string;
  opening_night_date?: string;
  closing_date?: string;
  load_out_date?: string;

  // Standard Contacts
  gm_name?: string;
  gm_company?: string;
  gm_email?: string;
  gm_phone?: string;
  pm_name?: string;
  pm_company?: string;
  pm_email?: string;
  pm_phone?: string;
  ld_name?: string;
  ld_email?: string;
  ld_phone?: string;
  ald_name?: string;
  ald_email?: string;
  ald_phone?: string;
  pe_name?: string;
  pe_email?: string;
  pe_phone?: string;

  // Additional discipline contacts (stored as JSON)
  additional_contacts?: AdditionalContact[];

  // Logo
  logo_url?: string;
  logo_storage_path?: string;

  // Disciplines enabled for this project
  disciplines: Discipline[];

  // Current revision number (0-5, 0 = no revisions yet)
  current_revision: number;

  // Metadata
  created_at: number;
  updated_at: number;
}

/**
 * Section - Organizational grouping of equipment
 * e.g., "Moving Lights", "LED Fixtures", "Audio Consoles"
 */
export interface PrepSection {
  id: string;
  prep_project_id: string;

  name: string;
  discipline: Discipline;
  sort_order: number;
  page_break: boolean;
  notes?: string; // Optional section notes displayed below section header

  created_at: number;
  updated_at: number;
}

/**
 * Equipment Item - Individual piece of equipment in a shop order
 */
export interface PrepEquipmentItem {
  id: string;
  section_id: string;

  description: string;
  active_qty: number;
  spare_qty: number;
  venue_qty: number;

  // Calculated fields
  total_qty: number; // active_qty + spare_qty
  venue_active: number; // Portion of venue equipment allocated to active
  venue_spare: number; // Portion of venue equipment allocated to spare

  // Optional fields
  weight?: number;
  power?: number;
  notes?: string;

  sort_order: number;

  // Revision tracking
  added_in_revision?: number;
  removed_in_revision?: number;
  modified_in_revision?: number;

  created_at: number;
  updated_at: number;
}

/**
 * Change types for revision tracking
 */
export type ChangeType = 'addition' | 'deletion' | 'modification';

/**
 * Individual change in a revision
 */
export interface ItemChange {
  item_id: string;
  change_type: ChangeType;
  description: string;
  section_name?: string;
  old_values?: Partial<PrepEquipmentItem>;
  new_values?: Partial<PrepEquipmentItem>;
}

/**
 * Revision - Snapshot of changes between versions
 */
export interface PrepRevision {
  id: string;
  prep_project_id: string;

  revision_number: number; // 1-5
  revision_date: number;
  notes?: string;
  change_log: ItemChange[]; // Automatically generated change summary

  created_at: number;
  updated_at: number;
}

/**
 * Note - 3-tier notes system
 */
export interface PrepNote {
  id: string;
  prep_project_id: string;

  type: NoteType;
  content: string;
  format: 'plain' | 'bullets' | 'numbered';

  created_at: number;
  updated_at: number;
}

/**
 * Note Template - Reusable standard language for notes
 */
export interface PrepNoteTemplate {
  id: string;
  user_id?: string;

  type: 'general_conditions' | 'general_notes' | 'fixture_notes';
  name: string;
  content: string;
  is_default: number; // 0 or 1 (boolean as integer for SQLite)

  created_at: number;
  updated_at: number;
}

/**
 * Helper types for creating/updating records
 */
export type CreatePrepProject = Omit<PrepProject, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePrepProject = Partial<Omit<PrepProject, 'id' | 'created_at' | 'updated_at'>>;

export type CreatePrepSection = Omit<PrepSection, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePrepSection = Partial<Omit<PrepSection, 'id' | 'created_at' | 'updated_at'>>;

export type CreatePrepEquipmentItem = Omit<PrepEquipmentItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePrepEquipmentItem = Partial<
  Omit<PrepEquipmentItem, 'id' | 'created_at' | 'updated_at'>
>;

export type CreatePrepRevision = Omit<PrepRevision, 'id' | 'created_at' | 'updated_at'>;
export type CreatePrepNote = Omit<PrepNote, 'id' | 'created_at' | 'updated_at'>;

/**
 * View models for UI display
 */
export interface PrepProjectWithStats extends PrepProject {
  section_count: number;
  item_count: number;
  total_weight?: number;
  total_power?: number;
}

export interface PrepSectionWithItems extends PrepSection {
  items: PrepEquipmentItem[];
}

/**
 * Venue equipment allocation calculation result
 */
export interface VenueAllocation {
  venue_active: number;
  venue_spare: number;
}

/**
 * Duplicate detection result
 */
export interface DuplicateMatch {
  item1: PrepEquipmentItem;
  item2: PrepEquipmentItem;
  similarity: number;
}

/**
 * Filter and sort options for equipment table
 */
export interface EquipmentFilters {
  search?: string;
  discipline?: Discipline;
  section_id?: string;
  show_venue_only?: boolean;
}

export interface EquipmentSortOptions {
  field: keyof PrepEquipmentItem;
  direction: 'asc' | 'desc';
}

/**
 * Print Template System for Shop Order Output
 */

export type PrintSectionType =
  | 'cover'
  | 'project-details'
  | 'venue-info'
  | 'schedule'
  | 'contacts'
  | 'equipment-by-section'
  | 'equipment-summary'
  | 'notes'
  | 'revision-summary'
  | 'custom-text'
  | 'paperwork-header'
  | 'page-break'
  | 'label_5160'
  | 'label_5163'
  | 'label_5164'
  | 'label_8160'
  | 'label_5167';

export interface PrintSection {
  id: string;
  type: PrintSectionType;
  order: number;
  enabled: boolean;
  config: PrintSectionConfig;
}

export interface PrintSectionConfig {
  // Cover page
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showDate?: boolean;

  // Project details
  includeFields?: string[];

  // Venue info
  includeContact?: boolean;
  includeAddress?: boolean;

  // Schedule
  dateFormat?: string;
  includeDates?: string[];

  // Contacts
  contactTypes?: string[]; // 'gm', 'pm', 'ld', 'ald', 'pe', 'additional'

  // Equipment
  groupBy?: 'section' | 'discipline' | 'none';
  showVenueColumn?: boolean;
  showWeightColumn?: boolean;
  showPowerColumn?: boolean;
  showRevisionMarkers?: boolean;

  // Notes
  noteType?: NoteType;
  customText?: string;

  // Revision summary
  showRevisionDetails?: boolean;
  includeChangelog?: boolean;
  onlyShowIfRevisions?: boolean; // Only render if currentProject.current_revision > 0

  // Custom text
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  alignment?: 'left' | 'center' | 'right';

  // Page break
  pageBreakBefore?: boolean;
}

export interface PrintTemplate {
  id: string;
  prep_project_id?: string; // null if global template
  name: string;
  description?: string;
  sections: PrintSection[];
  pageSettings: PrintPageSettings;
  isDefault?: boolean;
  created_at: number;
  updated_at: number;
}

export interface PrintPageSettings {
  pageSize: 'letter' | 'legal' | 'a4' | 'tabloid';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  headerText?: string;
  footerText?: string;
  showPageNumbers?: boolean;
  fontSize?: number;
  fontFamily?: string;
}

/**
 * Visual Page Layout Designer System
 */

// Element types that can be placed on the canvas
export type LayoutElementType = 'dataField' | 'text' | 'image' | 'table' | 'shape' | 'equipment_list' | 'notes_content' | 'revision_log';

// Data fields that can be displayed
export type DataFieldType =
  | 'production_name'
  | 'venue'
  | 'venue_city'
  | 'venue_state'
  | 'order_date'
  | 'prep_start_date'
  | 'prep_end_date'
  | 'load_in_date'
  | 'first_preview_date'
  | 'opening_night_date'
  | 'closing_date'
  | 'load_out_date'
  | 'gm_name'
  | 'gm_company'
  | 'gm_email'
  | 'gm_phone'
  | 'pm_name'
  | 'pm_company'
  | 'pm_email'
  | 'pm_phone'
  | 'ld_name'
  | 'ld_email'
  | 'ld_phone'
  | 'ald_name'
  | 'ald_email'
  | 'ald_phone'
  | 'pe_name'
  | 'pe_email'
  | 'pe_phone'
  | 'current_revision'
  | 'disciplines'
  | 'logo'
  // Paperwork-specific fields
  | 'report_title'
  | 'revision_date'
  | 'generated_date'
  // Fixture summary fields
  | 'total_fixtures'
  | 'total_wattage'
  | 'total_amperage'
  | 'universe_count'
  | 'fixture_type_count'
  // Infrastructure summary fields
  | 'total_infrastructure'
  | 'network_equipment_count'
  | 'audio_equipment_count'
  | 'video_equipment_count'
  | 'data_distribution_count'
  | 'total_ports'
  | 'active_infrastructure'
  | 'inactive_infrastructure';

// Shape types for visual elements
export type ShapeType = 'rectangle' | 'line' | 'divider';

// Configuration for data field elements
export interface DataFieldConfig {
  fieldType: DataFieldType;
  label?: string; // Optional label to show before the value
  showLabel?: boolean;
  dateFormat?: string; // For date fields
}

// Configuration for text elements
export interface TextConfig {
  content: string;
  placeholder?: string;
}

// Configuration for image elements
export interface ImageConfig {
  src?: string; // URL or base64
  altText?: string;
  objectFit?: 'contain' | 'cover' | 'fill';
}

// Configuration for table elements
export interface TableConfig {
  contactTypes: string[]; // Which contacts to include
  showHeaders?: boolean;
  columns: {
    field: string;
    label: string;
    width?: number;
  }[];
}

// Configuration for shape elements
export interface ShapeConfig {
  shapeType: ShapeType;
  thickness?: number;
  color?: string;
}

// Configuration for equipment list elements (dynamic content)
export interface EquipmentListConfig {
  // Equipment list is rendered dynamically from project data
}

// Configuration for notes content elements (dynamic content)
export interface NotesContentConfig {
  noteType?: 'general_conditions' | 'general_notes' | 'fixture_notes';
}

// Configuration for revision log elements (dynamic content)
export interface RevisionLogConfig {
  // Revision log is rendered dynamically from project data
}

// Union type for all element configurations
export type ElementConfig =
  | DataFieldConfig
  | TextConfig
  | ImageConfig
  | TableConfig
  | ShapeConfig
  | EquipmentListConfig
  | NotesContentConfig
  | RevisionLogConfig;

// Styling options for elements
export interface ElementStyle {
  // Typography
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'line-through';
  lineHeight?: number;
  letterSpacing?: number;

  // Colors
  color?: string;
  backgroundColor?: string;

  // Borders
  borderWidth?: number;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  borderColor?: string;
  borderRadius?: number;

  // Spacing
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;

  // Display
  opacity?: number;
}

// Layout element placed on the canvas
export interface LayoutElement {
  id: string;
  element_type: LayoutElementType;
  config: ElementConfig;

  // Grid position
  grid_column: number;
  grid_row: number;
  column_span: number;
  row_span: number;

  // Layer (z-index)
  layer: number;

  // Styling
  style: ElementStyle;

  created_at: number;
  updated_at: number;
}

// Page layout template config (stored as JSON in database)
export interface PageLayoutTemplateConfig {
  backgroundColor?: string; // Hex color code (e.g., '#ffffff')
}

// Page layout template (app-level user preference)
export interface PageLayoutTemplate {
  id: string;
  user_id?: string; // Optional user identifier
  name: string;
  description?: string;
  page_type: PrintSectionType;

  // Grid configuration
  grid_columns: number;
  grid_rows: number;
  grid_gap: number; // pixels

  // Page settings
  page_width: number; // pixels
  page_height: number; // pixels

  // Template configuration (JSON)
  config?: PageLayoutTemplateConfig;

  elements: LayoutElement[];

  is_default: boolean;
  created_at: number;
  updated_at: number;
}

// Helper types for creating/updating
export type CreateLayoutTemplate = Omit<PageLayoutTemplate, 'id' | 'created_at' | 'updated_at' | 'elements'>;
export type UpdateLayoutTemplate = Partial<Omit<PageLayoutTemplate, 'id' | 'created_at' | 'updated_at'>>;

export type CreateLayoutElement = Omit<LayoutElement, 'id' | 'created_at' | 'updated_at'>;
export type UpdateLayoutElement = Partial<Omit<LayoutElement, 'id' | 'created_at' | 'updated_at'>>;
