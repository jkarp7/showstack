import { create } from 'zustand';
import { PrintStore, PrintTemplate, PrintSection, Revision } from '../types';

// Default print template with required sections
const createDefaultTemplate = (): PrintTemplate => {
  const now = new Date().toISOString();
  return {
    id: 'default-template',
    name: 'Default Shop Order',
    description: 'Standard shop order with all default sections',
    isDefault: true,
    createdDate: now,
    lastModifiedDate: now,
    pageSettings: {
      pageSize: 'letter',
      orientation: 'portrait',
      margins: {
        top: 0.75,
        right: 0.75,
        bottom: 0.75,
        left: 0.75,
      },
      showPageNumbers: true,
    },
    sections: [
      // Cover page
      {
        id: 'section-cover',
        type: 'cover',
        order: 0,
        enabled: true,
        config: {
          showLogo: true,
          showDate: true,
        },
      },
      // Page break after cover
      {
        id: 'section-break-1',
        type: 'page-break',
        order: 1,
        enabled: true,
        config: {},
      },
      // Project details page
      {
        id: 'section-project',
        type: 'project-details',
        order: 2,
        enabled: true,
        config: {
          includeFields: ['name', 'client', 'designer', 'status'],
        },
      },
      // Venue info
      {
        id: 'section-venue',
        type: 'venue-info',
        order: 3,
        enabled: true,
        config: {
          includeContact: true,
          includeAddress: true,
        },
      },
      // Schedule
      {
        id: 'section-schedule',
        type: 'schedule',
        order: 4,
        enabled: true,
        config: {
          dateFormat: 'MMM DD, YYYY',
          includeDates: ['loadInDate', 'focusDate', 'techRehearsalDate', 'openingDate', 'strikeDate'],
        },
      },
      // Page break after project details
      {
        id: 'section-break-2',
        type: 'page-break',
        order: 5,
        enabled: true,
        config: {},
      },
      // Shop order items
      {
        id: 'section-items',
        type: 'shop-order-items',
        order: 6,
        enabled: true,
        config: {
          columns: ['description', 'quantity', 'category', 'unitCost', 'totalCost', 'received'],
          showTotals: true,
        },
      },
      // Page break after items
      {
        id: 'section-break-3',
        type: 'page-break',
        order: 7,
        enabled: true,
        config: {},
      },
      // Notes page
      {
        id: 'section-notes',
        type: 'notes',
        order: 8,
        enabled: true,
        config: {
          noteText: 'Additional notes and instructions...',
        },
      },
      // Page break before revision summary
      {
        id: 'section-break-4',
        type: 'page-break',
        order: 9,
        enabled: true,
        config: {},
      },
      // Revision summary (only shown if revisions exist)
      {
        id: 'section-revisions',
        type: 'revision-summary',
        order: 10,
        enabled: true,
        config: {
          showRevisionDetails: true,
          includeChangelog: true,
        },
      },
    ],
  };
};

export const usePrintStore = create<PrintStore>((set, get) => ({
  templates: [createDefaultTemplate()],
  currentTemplate: null,
  revisions: [],

  // Template management
  addTemplate: (template) =>
    set((state) => {
      const now = new Date().toISOString();
      const newTemplate: PrintTemplate = {
        id: `template-${Date.now()}`,
        name: template.name || 'Untitled Template',
        sections: template.sections || [],
        pageSettings: template.pageSettings || {
          pageSize: 'letter',
          orientation: 'portrait',
          margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
          showPageNumbers: true,
        },
        createdDate: now,
        lastModifiedDate: now,
        isDefault: false,
        ...template,
      };
      return { templates: [...state.templates, newTemplate] };
    }),

  updateTemplate: (id, updates) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id
          ? { ...t, ...updates, lastModifiedDate: new Date().toISOString() }
          : t
      ),
      currentTemplate:
        state.currentTemplate?.id === id
          ? { ...state.currentTemplate, ...updates, lastModifiedDate: new Date().toISOString() }
          : state.currentTemplate,
    })),

  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
    })),

  setCurrentTemplate: (template) =>
    set({ currentTemplate: template }),

  duplicateTemplate: (id, newName) =>
    set((state) => {
      const templateToDuplicate = state.templates.find((t) => t.id === id);
      if (!templateToDuplicate) return state;

      const now = new Date().toISOString();
      const newTemplate: PrintTemplate = {
        ...templateToDuplicate,
        id: `template-${Date.now()}`,
        name: newName,
        isDefault: false,
        createdDate: now,
        lastModifiedDate: now,
        sections: templateToDuplicate.sections.map((s) => ({
          ...s,
          id: `section-${Date.now()}-${s.order}`,
        })),
      };

      return { templates: [...state.templates, newTemplate] };
    }),

  // Section management
  addSection: (templateId, section) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              sections: [
                ...t.sections,
                {
                  id: `section-${Date.now()}`,
                  type: section.type || 'custom-text',
                  order: section.order ?? t.sections.length,
                  enabled: section.enabled ?? true,
                  config: section.config || {},
                  ...section,
                } as PrintSection,
              ],
              lastModifiedDate: new Date().toISOString(),
            }
          : t
      ),
    })),

  updateSection: (templateId, sectionId, updates) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              sections: t.sections.map((s) =>
                s.id === sectionId ? { ...s, ...updates } : s
              ),
              lastModifiedDate: new Date().toISOString(),
            }
          : t
      ),
    })),

  deleteSection: (templateId, sectionId) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              sections: t.sections.filter((s) => s.id !== sectionId),
              lastModifiedDate: new Date().toISOString(),
            }
          : t
      ),
    })),

  reorderSections: (templateId, sectionIds) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              sections: sectionIds.map((id, index) => {
                const section = t.sections.find((s) => s.id === id);
                return section ? { ...section, order: index } : null;
              }).filter((s): s is PrintSection => s !== null),
              lastModifiedDate: new Date().toISOString(),
            }
          : t
      ),
    })),

  // Revision management
  addRevision: (revision) =>
    set((state) => {
      const now = new Date().toISOString();
      const newRevision: Revision = {
        id: `revision-${Date.now()}`,
        projectId: revision.projectId || '',
        version: revision.version || '1.0',
        description: revision.description || '',
        changes: revision.changes || [],
        createdDate: now,
        ...revision,
      };
      return { revisions: [...state.revisions, newRevision] };
    }),

  getRevisionsByProject: (projectId) =>
    get().revisions.filter((r) => r.projectId === projectId),
}));
