import { create } from 'zustand';
import type {
  PrepProject,
  PrepSection,
  PrepEquipmentItem,
  PrepRevision,
  PrepNote,
  Discipline,
} from '../types/prep';

// Type guard for window.api
const hasAPI = (): boolean => {
  return typeof window !== 'undefined' && 'api' in window && window.api !== undefined;
};

interface PrepStore {
  // Current project
  currentProject: PrepProject | null;

  // Related data for current project
  sections: PrepSection[];
  items: PrepEquipmentItem[];
  revisions: PrepRevision[];
  notes: PrepNote[];

  // All projects (for project list view)
  allProjects: PrepProject[];

  // Loading states
  isLoading: boolean;

  // ===== PROJECT ACTIONS =====
  loadAllProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (data: {
    production_name: string;
    disciplines?: Discipline[];
  }) => Promise<PrepProject | undefined>;
  updateProject: (id: string, updates: Partial<PrepProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // ===== SECTION ACTIONS =====
  loadSections: (projectId: string) => Promise<void>;
  createSection: (data: {
    prep_project_id: string;
    name: string;
    discipline: Discipline;
    sort_order?: number;
  }) => Promise<void>;
  updateSection: (id: string, updates: Partial<PrepSection>) => Promise<void>;
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
  updateItem: (id: string, updates: Partial<PrepEquipmentItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // ===== REVISION ACTIONS =====
  loadRevisions: (projectId: string) => Promise<void>;
  createRevision: (data: {
    prep_project_id: string;
    revision_number: number;
    notes?: string;
  }) => Promise<void>;
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

  // ===== UTILITY ACTIONS =====
  clearCurrentProject: () => void;
}

export const usePrepStore = create<PrepStore>((set, get) => ({
  currentProject: null,
  sections: [],
  items: [],
  revisions: [],
  notes: [],
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
      const project = await window.api.prep.projects.create({
        production_name: data.production_name,
        disciplines: JSON.stringify(data.disciplines || ['lighting']),
        order_date: Date.now(),
        current_revision: 0,
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
      Object.keys(updates).forEach(key => {
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
      const sectionsMap = new Map(sections.map(s => [s.id, s]));

      let changes: any[] = [];

      if (currentProject.current_revision === 0) {
        // First revision - mark all current items as additions
        changes = items.map(item => ({
          item_id: item.id,
          change_type: 'addition',
          description: item.description,
          section_name: sectionsMap.get(item.section_id)?.name,
          new_values: {
            description: item.description,
            active_qty: item.active_qty,
            spare_qty: item.spare_qty,
            venue_qty: item.venue_qty,
          }
        }));
      } else {
        // Subsequent revisions - detect changes from last revision
        // Reconstruct the state at the last revision using the last revision's change log
        const lastRevisionNumber = currentProject.current_revision;

        // Get items that existed at last revision
        const itemsAtLastRevision = items.filter(item => {
          const addedBy = item.added_in_revision || 0;
          const removedBy = item.removed_in_revision || Infinity;
          return addedBy <= lastRevisionNumber && removedBy > lastRevisionNumber;
        });

        // Get the last revision's change log to reconstruct state
        const lastRevision = revisions.find(r => r.revision_number === lastRevisionNumber);
        const lastChangeLog = lastRevision
          ? (typeof lastRevision.change_log === 'string'
              ? JSON.parse(lastRevision.change_log)
              : lastRevision.change_log)
          : [];

        // Create a map of items with their state at last revision
        const previousItemsMap = new Map(itemsAtLastRevision.map(item => [item.id, { ...item }]));

        // Apply the old values from the last revision's change log
        for (const change of lastChangeLog) {
          if (change.change_type === 'modification' && change.old_values) {
            const item = previousItemsMap.get(change.item_id);
            if (item) {
              // Restore old values for fields that were modified in the last revision
              Object.assign(item, change.old_values);
            }
          } else if (change.change_type === 'addition') {
            // Items added in last revision didn't exist before, so remove them from previous state
            previousItemsMap.delete(change.item_id);
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
        })
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
      const revisionToDelete = revisions.find(r => r.id === revisionId);
      if (!revisionToDelete) {
        throw new Error('Revision not found');
      }

      // Only allow deleting the most recent revision
      if (revisionToDelete.revision_number !== currentProject.current_revision) {
        throw new Error('Can only delete the most recent revision');
      }

      // Remove revision tracking from items
      const changeLog = typeof revisionToDelete.change_log === 'string'
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
        })
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

  // ===== UTILITY ACTIONS =====
  clearCurrentProject: () => {
    set({
      currentProject: null,
      sections: [],
      items: [],
      revisions: [],
      notes: [],
    });
  },
}));
