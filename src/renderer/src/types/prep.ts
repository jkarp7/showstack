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
