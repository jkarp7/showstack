// ============================================================================
// FIXTURE TYPES
// ============================================================================

export interface Fixture {
  id: string;
  position: string;
  unit?: number;
  type: string;
  purpose?: string;
  channel?: string;
  dimmer?: string;
  circuit?: string;
  color?: string;
  gobo?: string;
  location?: string;
  wattage?: number;
  notes?: string;
}

export interface FixtureStore {
  fixtures: Fixture[];
  addFixture: (fixture: Partial<Fixture>) => void;
  updateFixture: (id: string, updates: Partial<Fixture>) => void;
  deleteFixture: (id: string) => void;
  deleteMultiple: (ids: string[]) => void;
}

// ============================================================================
// PROJECT & VENUE TYPES
// ============================================================================

export interface Venue {
  id: string;
  name: string;
  address?: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  designer?: string;

  // Venue information
  venue?: Venue;
  venueId?: string; // Reference to venue if using separate venue records

  // Date fields
  createdDate: string; // ISO 8601 date string
  lastModifiedDate: string;
  showDates: string[]; // Array of ISO 8601 date strings for performance dates
  loadInDate?: string;
  focusDate?: string;
  techRehearsalDate?: string;
  dressRehearsalDate?: string;
  openingDate?: string;
  closingDate?: string;
  strikeDate?: string;

  // Prep-related fields
  prepStatus: 'not-started' | 'in-progress' | 'completed' | 'archived';
  prepStartDate?: string;
  prepCompletedDate?: string;

  // Project metadata
  status: 'planning' | 'prep' | 'load-in' | 'tech' | 'running' | 'strike' | 'archived';
  budget?: number;
  totalFixtures?: number;
  notes?: string;
}

export interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Partial<Project>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

// ============================================================================
// PREP MODULE TYPES
// ============================================================================

export interface PrepTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  category: 'equipment' | 'ordering' | 'scheduling' | 'documentation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignedTo?: string;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
  createdDate: string;
  lastModifiedDate: string;
}

export interface PrepChecklist {
  id: string;
  projectId: string;
  name: string;
  items: PrepChecklistItem[];
  createdDate: string;
  lastModifiedDate: string;
}

export interface PrepChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedDate?: string;
  completedBy?: string;
}

export interface ShopOrder {
  id: string;
  projectId: string;
  orderNumber?: string;
  vendor?: string;
  orderDate: string;
  neededByDate?: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'received' | 'cancelled';
  items: ShopOrderItem[];
  notes?: string;
  totalCost?: number;
  createdDate: string;
  lastModifiedDate: string;
}

export interface ShopOrderItem {
  id: string;
  description: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  category?: string;
  notes?: string;
  received: boolean;
  receivedDate?: string;
  receivedQuantity?: number;
}

export interface PrepStore {
  tasks: PrepTask[];
  checklists: PrepChecklist[];
  shopOrders: ShopOrder[];

  // Task management
  addTask: (task: Partial<PrepTask>) => void;
  updateTask: (id: string, updates: Partial<PrepTask>) => void;
  deleteTask: (id: string) => void;

  // Checklist management
  addChecklist: (checklist: Partial<PrepChecklist>) => void;
  updateChecklist: (id: string, updates: Partial<PrepChecklist>) => void;
  deleteChecklist: (id: string) => void;
  toggleChecklistItem: (checklistId: string, itemId: string) => void;

  // Shop order management
  addShopOrder: (order: Partial<ShopOrder>) => void;
  updateShopOrder: (id: string, updates: Partial<ShopOrder>) => void;
  deleteShopOrder: (id: string) => void;
  addOrderItem: (orderId: string, item: Partial<ShopOrderItem>) => void;
  updateOrderItem: (orderId: string, itemId: string, updates: Partial<ShopOrderItem>) => void;
  deleteOrderItem: (orderId: string, itemId: string) => void;
}

// ============================================================================
// PRINT/SHOP ORDER OUTPUT TYPES
// ============================================================================

export type PrintSectionType =
  | 'cover'
  | 'project-details'
  | 'venue-info'
  | 'schedule'
  | 'shop-order-items'
  | 'notes'
  | 'revision-summary'
  | 'custom-text'
  | 'custom-table'
  | 'image'
  | 'page-break';

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
  logoUrl?: string;
  showDate?: boolean;

  // Project details
  includeFields?: string[];

  // Venue info
  includeContact?: boolean;
  includeAddress?: boolean;

  // Schedule
  dateFormat?: string;
  includeDates?: ('showDates' | 'loadInDate' | 'focusDate' | 'techRehearsalDate' | 'openingDate' | 'strikeDate')[];

  // Shop order items
  columns?: string[];
  groupBy?: string;
  sortBy?: string;
  showTotals?: boolean;

  // Notes
  noteText?: string;

  // Revision summary
  showRevisionDetails?: boolean;
  includeChangelog?: boolean;

  // Custom text
  customText?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  alignment?: 'left' | 'center' | 'right';

  // Custom table
  tableData?: any[][];
  tableHeaders?: string[];

  // Image
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlignment?: 'left' | 'center' | 'right';

  // Page break
  pageBreakBefore?: boolean;
}

export interface PrintTemplate {
  id: string;
  name: string;
  description?: string;
  sections: PrintSection[];
  pageSettings: PrintPageSettings;
  createdDate: string;
  lastModifiedDate: string;
  isDefault?: boolean;
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
}

export interface Revision {
  id: string;
  projectId: string;
  version: string;
  description: string;
  changes: RevisionChange[];
  createdBy?: string;
  createdDate: string;
}

export interface RevisionChange {
  id: string;
  type: 'added' | 'modified' | 'deleted';
  entityType: 'fixture' | 'task' | 'order' | 'other';
  entityId: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

export interface PrintStore {
  templates: PrintTemplate[];
  currentTemplate: PrintTemplate | null;
  revisions: Revision[];

  // Template management
  addTemplate: (template: Partial<PrintTemplate>) => void;
  updateTemplate: (id: string, updates: Partial<PrintTemplate>) => void;
  deleteTemplate: (id: string) => void;
  setCurrentTemplate: (template: PrintTemplate | null) => void;
  duplicateTemplate: (id: string, newName: string) => void;

  // Section management
  addSection: (templateId: string, section: Partial<PrintSection>) => void;
  updateSection: (templateId: string, sectionId: string, updates: Partial<PrintSection>) => void;
  deleteSection: (templateId: string, sectionId: string) => void;
  reorderSections: (templateId: string, sectionIds: string[]) => void;

  // Revision management
  addRevision: (revision: Partial<Revision>) => void;
  getRevisionsByProject: (projectId: string) => Revision[];
}
