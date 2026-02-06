import { create } from 'zustand';
import type {
  ShopOrderProject,
  ShopOrderSection,
  ShopOrderItem,
  ShopOrderRevision,
  ShopOrderNote,
  Discipline,
  PrintTemplate,
} from '../types/shopOrder';

// Type guard for window.api
const hasAPI = (): boolean => {
  return typeof window !== 'undefined' && 'api' in window && window.api !== undefined;
};

interface ShopOrderStore {
  // Current project
  currentProject: ShopOrderProject | null;

  // Related data for current project
  sections: ShopOrderSection[];
  items: ShopOrderItem[];
  revisions: ShopOrderRevision[];
  notes: ShopOrderNote[];
  printTemplates: PrintTemplate[];
  currentTemplate: PrintTemplate | null;

  // All projects (for project list view)
  allProjects: ShopOrderProject[];

  // Loading states
  isLoading: boolean;

  // ===== PROJECT ACTIONS =====
  loadAllProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (data: {
    production_name: string;
    disciplines?: Discipline[];
    parent_project_id?: string;
    venue?: string;
  }) => Promise<ShopOrderProject | undefined>;
  updateProject: (id: string, updates: Partial<ShopOrderProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  syncFromParent: (
    projectId: string,
    parentProjectId: string,
  ) => Promise<{
    success: boolean;
    syncedFields?: string[];
    message?: string;
    error?: string;
  }>;

  // ===== SECTION ACTIONS =====
  loadSections: (projectId: string) => Promise<void>;
  createSection: (data: {
    prep_project_id: string;
    name: string;
    discipline: Discipline;
    sort_order?: number;
  }) => Promise<void>;
  updateSection: (id: string, updates: Partial<ShopOrderSection>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;

  // ===== EQUIPMENT ITEM ACTIONS =====
  loadItems: (projectId: string) => Promise<void>;
  loadItemsBySection: (sectionId: string) => Promise<void>;
  createItem: (data: {
    section_id: string;
    description: string;
    active_qty?: number;
    spare_qty?: number;
    venue_qty?: number;
    sort_order?: number;
  }) => Promise<void>;
  updateItem: (id: string, updates: Partial<ShopOrderItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // ===== REVISION ACTIONS =====
  loadRevisions: (projectId: string) => Promise<void>;
  createRevision: (data: {
    prep_project_id: string;
    revision_number: number;
    notes?: string;
  }) => Promise<void>;
  setRevisionZero: (projectId: string, notes?: string) => Promise<void>;
  generateRevision: (projectId: string, notes?: string) => Promise<void>;
  deleteRevision: (projectId: string, revisionId: string) => Promise<void>;

  // ===== NOTE ACTIONS =====
  loadNotes: (projectId: string, type?: 'general' | 'equipment' | 'revision') => Promise<void>;
  createNote: (data: {
    prep_project_id: string;
    type: 'general' | 'equipment' | 'revision';
    content: string;
    section_id?: string;
    revision_num?: number;
  }) => Promise<void>;
  updateNote: (id: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // ===== PRINT TEMPLATE ACTIONS =====
  loadPrintTemplates: (projectId: string) => Promise<void>;
  setCurrentTemplate: (template: PrintTemplate | null) => void;
  saveTemplate: (template: PrintTemplate) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;

  // ===== UTILITY ACTIONS =====
  clearCurrentProject: () => void;
}

export const useShopOrderStore = create<ShopOrderStore>((set, get) => ({
  currentProject: null,
  sections: [],
  items: [],
  revisions: [],
  notes: [],
  printTemplates: [],
  currentTemplate: null,
  allProjects: [],
  isLoading: false,

  // ===== PROJECT ACTIONS =====
  loadAllProjects: async () => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    set({ isLoading: true });
    try {
      const projects = await window.api.prep.projects.getAll();
      set({ allProjects: projects, isLoading: false });
    } catch (error) {
      console.error('Failed to load prep projects:', error);
      set({ isLoading: false });
    }
  },

  loadProject: async (id: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    set({ isLoading: true });
    try {
      const project = await window.api.prep.projects.getById(id);
      if (project) {
        set({ currentProject: project });
        // Load related data
        await Promise.all([
          get().loadSections(id),
          get().loadItems(id),
          get().loadRevisions(id),
          get().loadNotes(id),
        ]);
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to load prep project:', error);
      set({ isLoading: false });
    }
  },

  createProject: async (data) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      // If linked to parent project, fetch parent data to populate fields
      let parentData = {};
      if (data.parent_project_id) {
        try {
          const parentProject = await window.api.projects.getById(data.parent_project_id);
          if (parentProject) {
            // Map parent project fields to prep project fields
            parentData = {
              parent_project_id: data.parent_project_id,
              venue: parentProject.venue,
              // Map logo
              logo_url: parentProject.logo_path,
              logo_storage_path: parentProject.logo_path,
              // Map designers
              ld_name: parentProject.lighting_designer,
              ld_email: parentProject.lighting_designer_email,
              ld_phone: parentProject.lighting_designer_phone,
              // Map production staff
              pm_name: parentProject.production_manager,
              pm_email: parentProject.production_manager_email,
              pm_phone: parentProject.production_manager_phone,
              pm_company: parentProject.production_manager_company,
              gm_name: parentProject.general_manager,
              gm_email: parentProject.general_manager_email,
              gm_phone: parentProject.general_manager_phone,
              gm_company: parentProject.general_manager_company,
              pe_name: parentProject.electrician,
              pe_email: parentProject.electrician_email,
              pe_phone: parentProject.electrician_phone,
            };
          }
        } catch (error) {
          console.error('Failed to load parent project:', error);
        }
      }

      const project = await window.api.prep.projects.create({
        production_name: data.production_name,
        venue: data.venue,
        disciplines: JSON.stringify(data.disciplines || ['lighting']),
        order_date: Date.now(),
        current_revision: 0,
        ...parentData, // Merge in parent project data
      });

      set((state) => ({
        allProjects: [project, ...state.allProjects],
        currentProject: project,
      }));

      return project;
    } catch (error) {
      console.error('Failed to create prep project:', error);
    }
  },

  updateProject: async (id, updates) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      console.log('🔧 prepStore.updateProject called with id:', id, 'updates:', updates);
      const updated = await window.api.prep.projects.update(id, updates);
      console.log('📦 API returned updated project:', updated);

      // Check specific fields that were updated
      Object.keys(updates).forEach((key) => {
        console.log(`🔍 Field ${key}: sent="${updates[key]}" received="${updated[key]}"`);
      });

      set((state) => ({
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
        allProjects: state.allProjects.map((p) => (p.id === id ? updated : p)),
      }));
      console.log('✅ State updated. New currentProject:', get().currentProject);
    } catch (error) {
      console.error('Failed to update prep project:', error);
    }
  },

  deleteProject: async (id) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      await window.api.prep.projects.delete(id);
      set((state) => ({
        allProjects: state.allProjects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }));
    } catch (error) {
      console.error('Failed to delete prep project:', error);
    }
  },

  syncFromParent: async (projectId: string, parentProjectId: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return { success: false, error: 'API not available' };
    }

    try {
      // Fetch parent project
      const parentProject = await window.api.projects.getById(parentProjectId);
      if (!parentProject) {
        return { success: false, error: 'Parent project not found' };
      }

      // Build update object with all fields that exist on parent
      const updates: any = {};
      const syncedFields: string[] = [];

      // Venue
      if (parentProject.venue) {
        updates.venue = parentProject.venue;
        syncedFields.push('venue');
      }
      if (parentProject.venue_city) {
        updates.venue_city = parentProject.venue_city;
        syncedFields.push('venue_city');
      }
      if (parentProject.venue_state) {
        updates.venue_state = parentProject.venue_state;
        syncedFields.push('venue_state');
      }

      // Dates - map from parent project's show_dates object
      if (parentProject.show_dates) {
        const showDates = parentProject.show_dates;

        if (showDates.prep_start) {
          updates.prep_start_date = showDates.prep_start;
          syncedFields.push('prep_start_date');
        }
        if (showDates.prep_end) {
          updates.prep_end_date = showDates.prep_end;
          syncedFields.push('prep_end_date');
        }
        if (showDates.load_in) {
          updates.load_in_date = showDates.load_in;
          syncedFields.push('load_in_date');
        }
        if (showDates.tech) {
          updates.first_preview_date = showDates.tech; // Map tech to first_preview
          syncedFields.push('first_preview_date');
        }
        if (showDates.previews) {
          updates.first_preview_date = showDates.previews;
          syncedFields.push('first_preview_date');
        }
        if (showDates.opening) {
          updates.opening_night_date = showDates.opening;
          syncedFields.push('opening_night_date');
        }
        if (showDates.closing) {
          updates.closing_date = showDates.closing;
          syncedFields.push('closing_date');
        }
        if (showDates.load_out) {
          updates.load_out_date = showDates.load_out;
          syncedFields.push('load_out_date');
        }
      }

      // Contacts - try various field name patterns
      const contactFieldMap: Record<string, string[]> = {
        // LD
        ld_name: ['lighting_designer', 'ld_name', 'designer'],
        ld_email: ['lighting_designer_email', 'ld_email'],
        ld_phone: ['lighting_designer_phone', 'ld_phone'],
        // PM
        pm_name: ['production_manager', 'pm_name'],
        pm_email: ['production_manager_email', 'pm_email'],
        pm_phone: ['production_manager_phone', 'pm_phone'],
        pm_company: ['production_manager_company', 'pm_company'],
        // GM
        gm_name: ['general_manager', 'gm_name'],
        gm_email: ['general_manager_email', 'gm_email'],
        gm_phone: ['general_manager_phone', 'gm_phone'],
        gm_company: ['general_manager_company', 'gm_company'],
        // PE
        pe_name: ['electrician', 'pe_name', 'production_electrician'],
        pe_email: ['electrician_email', 'pe_email', 'production_electrician_email'],
        pe_phone: ['electrician_phone', 'pe_phone', 'production_electrician_phone'],
      };

      for (const [prepField, parentFieldOptions] of Object.entries(contactFieldMap)) {
        for (const parentField of parentFieldOptions) {
          if ((parentProject as any)[parentField]) {
            updates[prepField] = (parentProject as any)[parentField];
            syncedFields.push(prepField);
            break; // Use first match
          }
        }
      }

      // Associate Lighting Designer - sync first associate to ald_name/ald_email/ald_phone
      if (parentProject.lighting_associates) {
        try {
          const lightingAssociates =
            typeof parentProject.lighting_associates === 'string'
              ? JSON.parse(parentProject.lighting_associates)
              : parentProject.lighting_associates;

          if (Array.isArray(lightingAssociates) && lightingAssociates.length > 0) {
            const firstAssociate = lightingAssociates[0];
            if (firstAssociate.name) {
              updates.ald_name = firstAssociate.name;
              syncedFields.push('ald_name');
            }
            if (firstAssociate.email) {
              updates.ald_email = firstAssociate.email;
              syncedFields.push('ald_email');
            }
            if (firstAssociate.phone) {
              updates.ald_phone = firstAssociate.phone;
              syncedFields.push('ald_phone');
            }
          }
        } catch (e) {
          console.error('Failed to parse lighting_associates for ALD sync:', e);
        }
      }

      // Associate Designers - sync from parent project's associate arrays
      const additionalContacts: any[] = [];

      // Lighting Associates
      if (parentProject.lighting_associates) {
        try {
          const lightingAssociates =
            typeof parentProject.lighting_associates === 'string'
              ? JSON.parse(parentProject.lighting_associates)
              : parentProject.lighting_associates;

          if (Array.isArray(lightingAssociates)) {
            lightingAssociates.forEach((assoc: any) => {
              additionalContacts.push({
                role: 'Associate Lighting Designer',
                discipline: 'lighting',
                name: assoc.name || assoc,
                email: assoc.email || '',
                phone: assoc.phone || '',
              });
            });
          }
        } catch (e) {
          console.error('Failed to parse lighting_associates:', e);
        }
      }

      // Audio Associates
      if (parentProject.audio_associates) {
        try {
          const audioAssociates =
            typeof parentProject.audio_associates === 'string'
              ? JSON.parse(parentProject.audio_associates)
              : parentProject.audio_associates;

          if (Array.isArray(audioAssociates)) {
            audioAssociates.forEach((assoc: any) => {
              additionalContacts.push({
                role: 'Associate Audio Designer',
                discipline: 'audio',
                name: assoc.name || assoc,
                email: assoc.email || '',
                phone: assoc.phone || '',
              });
            });
          }
        } catch (e) {
          console.error('Failed to parse audio_associates:', e);
        }
      }

      // Video Associates
      if (parentProject.video_associates) {
        try {
          const videoAssociates =
            typeof parentProject.video_associates === 'string'
              ? JSON.parse(parentProject.video_associates)
              : parentProject.video_associates;

          if (Array.isArray(videoAssociates)) {
            videoAssociates.forEach((assoc: any) => {
              additionalContacts.push({
                role: 'Associate Video Designer',
                discipline: 'video',
                name: assoc.name || assoc,
                email: assoc.email || '',
                phone: assoc.phone || '',
              });
            });
          }
        } catch (e) {
          console.error('Failed to parse video_associates:', e);
        }
      }

      if (additionalContacts.length > 0) {
        updates.additional_contacts = JSON.stringify(additionalContacts);
        syncedFields.push('additional_contacts');
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await window.api.prep.projects.update(projectId, updates);

        // Reload project
        await get().loadProject(projectId);

        return {
          success: true,
          syncedFields,
          message: `Synced ${syncedFields.length} fields from parent project`,
        };
      } else {
        return {
          success: false,
          error: 'No matching fields found to sync',
        };
      }
    } catch (error) {
      console.error('Failed to sync from parent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync from parent',
      };
    }
  },

  // ===== SECTION ACTIONS =====
  loadSections: async (projectId: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const sections = await window.api.prep.sections.getByProjectId(projectId);
      set({ sections });
    } catch (error) {
      console.error('Failed to load prep sections:', error);
    }
  },

  createSection: async (data) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const section = await window.api.prep.sections.create(data);
      set((state) => ({
        sections: [...state.sections, section],
      }));
    } catch (error) {
      console.error('Failed to create prep section:', error);
    }
  },

  updateSection: async (id, updates) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const updated = await window.api.prep.sections.update(id, updates);
      set((state) => ({
        sections: state.sections.map((s) => (s.id === id ? updated : s)),
      }));
    } catch (error) {
      console.error('Failed to update prep section:', error);
    }
  },

  deleteSection: async (id) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      await window.api.prep.sections.delete(id);
      set((state) => ({
        sections: state.sections.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete prep section:', error);
    }
  },

  // ===== EQUIPMENT ITEM ACTIONS =====
  loadItems: async (projectId: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const items = await window.api.prep.items.getByProjectId(projectId);
      set({ items });
    } catch (error) {
      console.error('Failed to load prep items:', error);
    }
  },

  loadItemsBySection: async (sectionId: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const items = await window.api.prep.items.getBySectionId(sectionId);
      set({ items });
    } catch (error) {
      console.error('Failed to load prep items by section:', error);
    }
  },

  createItem: async (data) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const item = await window.api.prep.items.create(data);
      set((state) => ({
        items: [...state.items, item],
      }));
    } catch (error) {
      console.error('Failed to create prep item:', error);
    }
  },

  updateItem: async (id, updates) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const updated = await window.api.prep.items.update(id, updates);
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? updated : i)),
      }));
    } catch (error) {
      console.error('Failed to update prep item:', error);
    }
  },

  deleteItem: async (id) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      await window.api.prep.items.delete(id);
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete prep item:', error);
    }
  },

  // ===== REVISION ACTIONS =====
  loadRevisions: async (projectId: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const revisions = await window.api.prep.revisions.getByProjectId(projectId);
      set({ revisions });
    } catch (error) {
      console.error('Failed to load prep revisions:', error);
    }
  },

  createRevision: async (data) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const revision = await window.api.prep.revisions.create({
        ...data,
        change_log: JSON.stringify([]), // Will be populated by change detection
      });
      set((state) => ({
        revisions: [...state.revisions, revision],
      }));
    } catch (error) {
      console.error('Failed to create prep revision:', error);
    }
  },

  setRevisionZero: async (projectId: string, notes?: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    const { currentProject, items, sections } = get();

    if (!currentProject || currentProject.id !== projectId) {
      console.error('No current project loaded');
      return;
    }

    if (currentProject.current_revision !== 0) {
      throw new Error('Revision 0 can only be set when current revision is 0');
    }

    if (items.length === 0) {
      throw new Error('Cannot set Revision 0 with no equipment items');
    }

    try {
      // Create sections map for change detection
      const sectionsMap = new Map(sections.map((s) => [s.id, s]));

      // Create baseline snapshot - all current items are "additions" at Revision 0
      const changes = items.map((item) => ({
        item_id: item.id,
        change_type: 'addition',
        description: item.description,
        section_name: sectionsMap.get(item.section_id)?.name,
        new_values: {
          description: item.description,
          active_qty: item.active_qty,
          spare_qty: item.spare_qty,
          venue_qty: item.venue_qty,
        },
      }));

      // Create Revision 0
      await window.api.prep.revisions.create({
        prep_project_id: projectId,
        revision_number: 0,
        notes: notes || 'Initial baseline',
        change_log: JSON.stringify(changes),
      });

      // Mark all current items as added_in_revision: 0
      for (const item of items) {
        await window.api.prep.items.update(item.id, {
          added_in_revision: 0,
        });
      }

      // Reload revisions and items to reflect changes
      await get().loadRevisions(projectId);
      await get().loadItems(projectId);

      console.log('Revision 0 baseline set successfully');
    } catch (error) {
      console.error('Failed to set revision 0:', error);
      throw error;
    }
  },

  generateRevision: async (projectId: string, notes?: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    const { currentProject, items, sections, revisions } = get();

    if (!currentProject || currentProject.id !== projectId) {
      console.error('No current project loaded');
      return;
    }

    if (currentProject.current_revision >= 5) {
      throw new Error('Maximum of 5 revisions reached');
    }

    try {
      // Import change detection utilities
      const { detectChanges, createSnapshot } = await import('../utils/revisionUtils');

      const newRevisionNumber = currentProject.current_revision + 1;

      // Create sections map for change detection
      const sectionsMap = new Map(sections.map((s) => [s.id, s]));

      let changes: any[] = [];

      // Check if Revision 0 exists (baseline has been set)
      const hasRevisionZero = revisions.some((r) => r.revision_number === 0);

      if (currentProject.current_revision === 0 && !hasRevisionZero) {
        // No baseline set - mark all current items as additions
        changes = items.map((item) => ({
          item_id: item.id,
          change_type: 'addition',
          description: item.description,
          section_name: sectionsMap.get(item.section_id)?.name,
          new_values: {
            description: item.description,
            active_qty: item.active_qty,
            spare_qty: item.spare_qty,
            venue_qty: item.venue_qty,
          },
        }));
      } else {
        // Subsequent revisions - detect changes from last revision
        // Reconstruct the state at the last revision using the last revision's change log
        const lastRevisionNumber = currentProject.current_revision;

        // Get items that existed at last revision
        const itemsAtLastRevision = items.filter((item) => {
          const addedBy = item.added_in_revision || 0;
          const removedBy = item.removed_in_revision || Infinity;
          return addedBy <= lastRevisionNumber && removedBy > lastRevisionNumber;
        });

        // Get the last revision's change log to reconstruct state
        const lastRevision = revisions.find((r) => r.revision_number === lastRevisionNumber);
        const lastChangeLog = lastRevision
          ? typeof lastRevision.change_log === 'string'
            ? JSON.parse(lastRevision.change_log)
            : lastRevision.change_log
          : [];

        // Create a map of items with their state at last revision
        const previousItemsMap = new Map(itemsAtLastRevision.map((item) => [item.id, { ...item }]));

        // Restore the state at the last revision
        // We need to find the last known state for each item by looking through all revisions
        // up to and including the last revision
        const sortedRevisions = revisions
          .filter((r) => r.revision_number <= lastRevisionNumber)
          .sort((a, b) => a.revision_number - b.revision_number);

        // Build a map of item_id -> last known state
        const lastKnownStates = new Map();
        for (const rev of sortedRevisions) {
          const changeLog =
            typeof rev.change_log === 'string' ? JSON.parse(rev.change_log) : rev.change_log;

          for (const change of changeLog) {
            if (change.new_values) {
              // Update the last known state for this item
              lastKnownStates.set(change.item_id, change.new_values);
            }
          }
        }

        // Apply the last known states to restore items to their state at last revision
        for (const [itemId, values] of lastKnownStates) {
          const item = previousItemsMap.get(itemId);
          if (item) {
            Object.assign(item, values);
          }
        }

        const previousItems = Array.from(previousItemsMap.values());
        const currentSnapshot = createSnapshot(items, sections);
        const previousSnapshot = createSnapshot(previousItems, sections);

        changes = detectChanges(previousSnapshot, currentSnapshot, sectionsMap);
      }

      // Create the revision
      const revision = await window.api.prep.revisions.create({
        prep_project_id: projectId,
        revision_number: newRevisionNumber,
        notes,
        change_log: JSON.stringify(changes),
      });

      // Update project's current_revision
      await window.api.prep.projects.update(projectId, {
        current_revision: newRevisionNumber,
      });

      // Update items with revision tracking (batch updates without triggering individual store updates)
      await Promise.all(
        changes.map(async (change) => {
          if (change.change_type === 'addition') {
            return window.api.prep.items.update(change.item_id, {
              added_in_revision: newRevisionNumber,
            });
          } else if (change.change_type === 'modification') {
            return window.api.prep.items.update(change.item_id, {
              modified_in_revision: newRevisionNumber,
            });
          } else if (change.change_type === 'deletion') {
            return window.api.prep.items.update(change.item_id, {
              removed_in_revision: newRevisionNumber,
            });
          }
        }),
      );

      // Reload project data once after all updates
      await get().loadProject(projectId);
    } catch (error) {
      console.error('Failed to generate revision:', error);
      throw error;
    }
  },

  deleteRevision: async (projectId: string, revisionId: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    const { currentProject, revisions } = get();

    if (!currentProject || currentProject.id !== projectId) {
      console.error('No current project loaded');
      return;
    }

    try {
      const revisionToDelete = revisions.find((r) => r.id === revisionId);
      if (!revisionToDelete) {
        throw new Error('Revision not found');
      }

      // Only allow deleting the most recent revision
      if (revisionToDelete.revision_number !== currentProject.current_revision) {
        throw new Error('Can only delete the most recent revision');
      }

      // Remove revision tracking from items
      const changeLog =
        typeof revisionToDelete.change_log === 'string'
          ? JSON.parse(revisionToDelete.change_log)
          : revisionToDelete.change_log;

      await Promise.all(
        changeLog.map(async (change: any) => {
          try {
            if (change.change_type === 'addition') {
              return await window.api.prep.items.update(change.item_id, {
                added_in_revision: null,
              });
            } else if (change.change_type === 'modification') {
              return await window.api.prep.items.update(change.item_id, {
                modified_in_revision: null,
              });
            } else if (change.change_type === 'deletion') {
              return await window.api.prep.items.update(change.item_id, {
                removed_in_revision: null,
              });
            }
          } catch (error) {
            // Item might not exist anymore, skip it
            console.warn(`Could not update item ${change.item_id}:`, error);
          }
        }),
      );

      // Delete the revision
      await window.api.prep.revisions.delete(revisionId);

      // Update project's current_revision
      await window.api.prep.projects.update(projectId, {
        current_revision: currentProject.current_revision - 1,
      });

      // Reload project data
      await get().loadProject(projectId);
    } catch (error) {
      console.error('Failed to delete revision:', error);
      throw error;
    }
  },

  // ===== NOTE ACTIONS =====
  loadNotes: async (projectId: string, type?: 'general' | 'equipment' | 'revision') => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const notes = await window.api.prep.notes.getByProjectId(projectId, type);
      set({ notes });
    } catch (error) {
      console.error('Failed to load prep notes:', error);
    }
  },

  createNote: async (data) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const note = await window.api.prep.notes.create(data);
      set((state) => ({
        notes: [note, ...state.notes],
      }));
    } catch (error) {
      console.error('Failed to create prep note:', error);
    }
  },

  updateNote: async (id, content) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      const updated = await window.api.prep.notes.update(id, content);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updated : n)),
      }));
    } catch (error) {
      console.error('Failed to update prep note:', error);
    }
  },

  deleteNote: async (id) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    try {
      await window.api.prep.notes.delete(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete prep note:', error);
    }
  },

  // ===== PRINT TEMPLATE ACTIONS =====
  loadPrintTemplates: async (projectId: string) => {
    if (!hasAPI()) {
      console.warn('API not available - using default template');
      return;
    }

    try {
      const templates = await window.api.prep.printTemplates?.getByProjectId(projectId);
      set({ printTemplates: templates || [] });
    } catch (error) {
      console.error('Failed to load print templates:', error);
      set({ printTemplates: [] });
    }
  },

  setCurrentTemplate: (template: PrintTemplate | null) => {
    set({ currentTemplate: template });
  },

  saveTemplate: async (template: PrintTemplate) => {
    if (!hasAPI()) {
      console.warn('API not available - storing template locally');
      set((state) => ({
        printTemplates: [...state.printTemplates, template],
        currentTemplate: template,
      }));
      return;
    }

    try {
      const saved = await window.api.prep.printTemplates?.save(template);
      if (saved) {
        set((state) => ({
          printTemplates: [...state.printTemplates.filter((t) => t.id !== saved.id), saved],
          currentTemplate: saved,
        }));
      }
    } catch (error) {
      console.error('Failed to save print template:', error);
    }
  },

  deleteTemplate: async (templateId: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      set((state) => ({
        printTemplates: state.printTemplates.filter((t) => t.id !== templateId),
        currentTemplate: state.currentTemplate?.id === templateId ? null : state.currentTemplate,
      }));
      return;
    }

    try {
      await window.api.prep.printTemplates?.delete(templateId);
      set((state) => ({
        printTemplates: state.printTemplates.filter((t) => t.id !== templateId),
        currentTemplate: state.currentTemplate?.id === templateId ? null : state.currentTemplate,
      }));
    } catch (error) {
      console.error('Failed to delete print template:', error);
    }
  },

  // ===== UTILITY ACTIONS =====
  clearCurrentProject: () => {
    set({
      currentProject: null,
      sections: [],
      items: [],
      revisions: [],
      notes: [],
      printTemplates: [],
      currentTemplate: null,
    });
  },
}));
