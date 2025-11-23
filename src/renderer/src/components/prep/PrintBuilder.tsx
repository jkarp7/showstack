import { useState, useEffect } from 'react';
import type { PrintTemplate, PrintSection, PrintSectionType, PrepProject } from '../../types/prep';
import { LayoutDesigner } from './layout/LayoutDesigner';

interface PrintBuilderProps {
  currentProject: PrepProject;
  template: PrintTemplate | null;
  onTemplateChange: (template: PrintTemplate) => void;
  onSaveTemplate: (template: PrintTemplate) => void;
}

interface DraggableSection {
  type: PrintSectionType;
  label: string;
  description: string;
  defaultConfig: any;
}

const availableSections: DraggableSection[] = [
  {
    type: 'cover',
    label: 'Cover Page',
    description: 'Title, logo, and production info',
    defaultConfig: { showLogo: true, showDate: true }
  },
  {
    type: 'project-details',
    label: 'Project Details',
    description: 'Production name, order date, etc.',
    defaultConfig: { includeFields: ['production_name', 'order_date', 'disciplines'] }
  },
  {
    type: 'venue-info',
    label: 'Venue Information',
    description: 'Venue name, city, state, contact',
    defaultConfig: { includeContact: true, includeAddress: true }
  },
  {
    type: 'schedule',
    label: 'Schedule',
    description: 'Load-in, tech, show dates',
    defaultConfig: {
      dateFormat: 'MM/DD/YYYY',
      includeDates: ['load_in_date', 'opening_night_date', 'closing_date', 'load_out_date']
    }
  },
  {
    type: 'contacts',
    label: 'Contacts',
    description: 'GM, PM, LD, ALD contacts',
    defaultConfig: { contactTypes: ['gm', 'pm', 'ld', 'ald', 'pe'] }
  },
  {
    type: 'equipment-by-section',
    label: 'Equipment by Section',
    description: 'Full equipment list by section',
    defaultConfig: {
      groupBy: 'section',
      showVenueColumn: true,
      showWeightColumn: false,
      showPowerColumn: false,
      showRevisionMarkers: true
    }
  },
  {
    type: 'equipment-summary',
    label: 'Equipment Summary',
    description: 'Totals and summary statistics',
    defaultConfig: { groupBy: 'discipline' }
  },
  {
    type: 'notes',
    label: 'Notes',
    description: 'General conditions and notes',
    defaultConfig: { noteType: 'general_notes' }
  },
  {
    type: 'revision-summary',
    label: 'Revision Summary',
    description: 'Change history (if revisions exist)',
    defaultConfig: {
      showRevisionDetails: true,
      includeChangelog: true,
      onlyShowIfRevisions: true
    }
  },
  {
    type: 'custom-text',
    label: 'Custom Text',
    description: 'Custom text block',
    defaultConfig: { customText: '', fontSize: 12, alignment: 'left' }
  },
  {
    type: 'page-break',
    label: 'Page Break',
    description: 'Start new page',
    defaultConfig: {}
  },
];

export function PrintBuilder({ currentProject, template, onTemplateChange, onSaveTemplate }: PrintBuilderProps) {
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [draggedFromBuilder, setDraggedFromBuilder] = useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [editingLayoutFor, setEditingLayoutFor] = useState<PrintSectionType | null>(null);

  // Initialize with default template if none provided
  useEffect(() => {
    if (!template) {
      const defaultTemplate = createDefaultTemplate(currentProject.id);
      onTemplateChange(defaultTemplate);
    }
  }, [template, currentProject.id, onTemplateChange]);

  const createDefaultTemplate = (projectId: string): PrintTemplate => {
    const now = Date.now();
    return {
      id: `template-${now}`,
      prep_project_id: projectId,
      name: 'ShowStack Default Template',
      description: 'Professional shop order with all essential sections',
      isDefault: true,
      created_at: now,
      updated_at: now,
      pageSettings: {
        pageSize: 'letter',
        orientation: 'portrait',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        showPageNumbers: true,
        fontSize: 10,
        fontFamily: 'Arial',
      },
      sections: [
        // Page 1: Cover
        {
          id: 's1',
          type: 'cover',
          order: 0,
          enabled: true,
          config: {
            showLogo: true,
            showDate: true,
            title: 'ELECTRICS SHOP ORDER',
            subtitle: 'For Bid Only'
          }
        },
        { id: 's2', type: 'page-break', order: 1, enabled: true, config: {} },

        // Page 2: Contacts & Dates
        {
          id: 's3',
          type: 'contacts',
          order: 2,
          enabled: true,
          config: {
            contactTypes: ['gm', 'pm', 'ld', 'ald', 'pe']
          }
        },
        {
          id: 's4',
          type: 'schedule',
          order: 3,
          enabled: true,
          config: {
            includeDates: ['prep_start_date', 'prep_end_date', 'load_in_date', 'first_preview_date', 'opening_night_date', 'closing_date']
          }
        },
        { id: 's5', type: 'page-break', order: 4, enabled: true, config: {} },

        // Page 3: General Notes & Conditions
        {
          id: 's6',
          type: 'notes',
          order: 5,
          enabled: true,
          config: {
            noteType: 'general_conditions'
          }
        },
        { id: 's7', type: 'page-break', order: 6, enabled: true, config: {} },

        // Page 4+: Revision Summary (only if revisions exist)
        {
          id: 's8',
          type: 'revision-summary',
          order: 7,
          enabled: true,
          config: {
            showRevisionDetails: true,
            includeChangelog: true,
            onlyShowIfRevisions: true
          }
        },
        { id: 's9', type: 'page-break', order: 8, enabled: true, config: {} },

        // Main pages: Equipment by Section
        {
          id: 's10',
          type: 'equipment-by-section',
          order: 9,
          enabled: true,
          config: {
            groupBy: 'section',
            showVenueColumn: true,
            showWeightColumn: false,
            showPowerColumn: false,
            showRevisionMarkers: true
          }
        },
      ],
    };
  };

  const handleDragStart = (sectionId: string, fromBuilder: boolean) => {
    setDraggedSection(sectionId);
    setDraggedFromBuilder(fromBuilder);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnBuilder = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    if (!template || !draggedSection) return;

    const sections = [...template.sections];

    if (draggedFromBuilder) {
      // Reordering existing section
      const draggedIndex = sections.findIndex(s => s.id === draggedSection);
      const [removed] = sections.splice(draggedIndex, 1);
      const insertIndex = targetIndex !== undefined ? targetIndex : sections.length;
      sections.splice(insertIndex, 0, removed);
    } else {
      // Adding new section from palette
      const sectionType = availableSections.find(s => s.type === draggedSection);
      if (sectionType) {
        const newSection: PrintSection = {
          id: `section-${Date.now()}`,
          type: sectionType.type,
          order: targetIndex !== undefined ? targetIndex : sections.length,
          enabled: true,
          config: sectionType.defaultConfig,
        };
        sections.splice(newSection.order, 0, newSection);
      }
    }

    // Update order values
    const reorderedSections = sections.map((s, idx) => ({ ...s, order: idx }));
    onTemplateChange({ ...template, sections: reorderedSections, updated_at: Date.now() });

    setDraggedSection(null);
    setDraggedFromBuilder(false);
  };

  const handleDropOnSection = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!template) return;

    const targetIndex = template.sections.findIndex(s => s.id === targetSectionId);
    handleDropOnBuilder(e, targetIndex);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!template) return;
    const sections = template.sections.filter(s => s.id !== sectionId);
    const reorderedSections = sections.map((s, idx) => ({ ...s, order: idx }));
    onTemplateChange({ ...template, sections: reorderedSections, updated_at: Date.now() });
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  };

  const handleToggleSection = (sectionId: string) => {
    if (!template) return;
    const sections = template.sections.map(s =>
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    );
    onTemplateChange({ ...template, sections, updated_at: Date.now() });
  };

  const handleSaveTemplate = () => {
    if (!template || !templateName.trim()) return;
    onSaveTemplate({ ...template, name: templateName, updated_at: Date.now() });
    setTemplateName('');
    setShowSaveDialog(false);
  };

  const getSectionLabel = (type: PrintSectionType): string => {
    return availableSections.find(s => s.type === type)?.label || type;
  };

  // Check if section supports visual layout editing
  const supportsLayoutEditing = (type: PrintSectionType): boolean => {
    return ['cover', 'contacts', 'notes', 'project-details', 'venue-info', 'schedule'].includes(type);
  };

  if (!template) return null;

  return (
    <div className="flex h-full gap-4">
      {/* Left Sidebar - Section Palette */}
      <div className="w-80 bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <h3 className="text-sm font-semibold text-gray-300 uppercase mb-3">Available Sections</h3>
        <p className="text-xs text-gray-500 mb-4">Drag sections to the builder to add them</p>

        <div className="space-y-2">
          {availableSections.map(section => (
            <div
              key={section.type}
              draggable
              onDragStart={() => handleDragStart(section.type, false)}
              className="p-3 bg-gray-700 border border-gray-600 rounded cursor-move hover:bg-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="font-medium text-sm text-gray-200">{section.label}</div>
              <div className="text-xs text-gray-400 mt-1">{section.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">{template.name}</h3>
            <p className="text-sm text-gray-400">{template.sections.filter(s => s.enabled).length} sections enabled</p>
          </div>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Save as Template
          </button>
        </div>

        {/* Page Settings - Moved to top */}
        <div className="mb-6 pb-6 border-b border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 uppercase mb-4">Page Settings</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Page Size</label>
              <select
                value={template.pageSettings.pageSize}
                onChange={(e) => onTemplateChange({
                  ...template,
                  pageSettings: { ...template.pageSettings, pageSize: e.target.value as any },
                  updated_at: Date.now()
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
                <option value="a4">A4</option>
                <option value="tabloid">Tabloid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Orientation</label>
              <select
                value={template.pageSettings.orientation}
                onChange={(e) => onTemplateChange({
                  ...template,
                  pageSettings: { ...template.pageSettings, orientation: e.target.value as any },
                  updated_at: Date.now()
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.pageSettings.showPageNumbers ?? true}
                  onChange={(e) => onTemplateChange({
                    ...template,
                    pageSettings: { ...template.pageSettings, showPageNumbers: e.target.checked },
                    updated_at: Date.now()
                  })}
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded"
                />
                <span className="text-sm text-gray-300">Show page numbers</span>
              </label>
            </div>
          </div>
        </div>

        {/* Sections Builder */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 uppercase mb-4">Print Sections</h4>
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnBuilder(e)}
            className="min-h-96 space-y-2"
          >
          {template.sections.length === 0 ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center text-gray-500">
              Drag sections here to build your print layout
            </div>
          ) : (
            template.sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(section.id, true)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSection(e, section.id)}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`p-4 border rounded-lg cursor-move transition-all ${
                    selectedSectionId === section.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : section.enabled
                      ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      : 'border-gray-700 bg-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-500 text-sm font-mono w-8">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">
                          {getSectionLabel(section.type)}
                        </div>
                        {section.type === 'page-break' && (
                          <div className="text-xs text-gray-500 mt-1">
                            Start new page
                          </div>
                        )}
                        {section.type === 'revision-summary' && section.config.onlyShowIfRevisions && (
                          <div className="text-xs text-yellow-500 mt-1">
                            ⚠ Only shown if revisions exist
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {supportsLayoutEditing(section.type) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLayoutFor(section.type);
                          }}
                          className="px-3 py-1 text-xs rounded-md bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30 transition"
                          title="Customize page layout"
                        >
                          Edit Layout
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSection(section.id);
                        }}
                        className={`px-3 py-1 text-xs rounded-md ${
                          section.enabled
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                            : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                        }`}
                      >
                        {section.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(section.id);
                        }}
                        className="p-1 text-red-400 hover:bg-red-900/20 rounded transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
          </div>
        </div>
      </div>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-white">Save Template</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout Designer Modal */}
      {editingLayoutFor && (
        <LayoutDesigner
          projectId={currentProject.id}
          currentProject={currentProject}
          pageType={editingLayoutFor}
          onClose={() => setEditingLayoutFor(null)}
        />
      )}
    </div>
  );
}
