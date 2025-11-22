import React, { useState } from 'react';
import { usePrintStore } from '../store/printStore';
import { PrintSection, PrintSectionType } from '../types';

interface DraggableSection {
  id: string;
  type: PrintSectionType;
  label: string;
  description: string;
}

const availableSections: DraggableSection[] = [
  { id: 'cover', type: 'cover', label: 'Cover Page', description: 'Project title and branding' },
  { id: 'project-details', type: 'project-details', label: 'Project Details', description: 'Client, designer, status info' },
  { id: 'venue-info', type: 'venue-info', label: 'Venue Information', description: 'Venue name, location, contact' },
  { id: 'schedule', type: 'schedule', label: 'Schedule', description: 'Load-in, tech, show dates' },
  { id: 'shop-order-items', type: 'shop-order-items', label: 'Shop Order Items', description: 'Order items table' },
  { id: 'notes', type: 'notes', label: 'Notes', description: 'Custom notes section' },
  { id: 'revision-summary', type: 'revision-summary', label: 'Revision Summary', description: 'Change history' },
  { id: 'custom-text', type: 'custom-text', label: 'Custom Text', description: 'Custom text block' },
  { id: 'custom-table', type: 'custom-table', label: 'Custom Table', description: 'Custom data table' },
  { id: 'image', type: 'image', label: 'Image', description: 'Logo or photo' },
  { id: 'page-break', type: 'page-break', label: 'Page Break', description: 'Start new page' },
];

export const PrintBuilder: React.FC = () => {
  const { templates, currentTemplate, setCurrentTemplate, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate, addSection, updateSection, deleteSection, reorderSections } = usePrintStore();

  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [draggedFromBuilder, setDraggedFromBuilder] = useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');

  // Load default template if none selected
  React.useEffect(() => {
    if (!currentTemplate && templates.length > 0) {
      setCurrentTemplate(templates.find(t => t.isDefault) || templates[0]);
    }
  }, [currentTemplate, templates, setCurrentTemplate]);

  const handleDragStart = (sectionId: string, fromBuilder: boolean) => {
    setDraggedSection(sectionId);
    setDraggedFromBuilder(fromBuilder);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnBuilder = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    if (!currentTemplate || !draggedSection) return;

    if (draggedFromBuilder) {
      // Reordering existing sections
      const sections = [...currentTemplate.sections];
      const draggedIndex = sections.findIndex(s => s.id === draggedSection);
      const section = sections[draggedIndex];

      sections.splice(draggedIndex, 1);
      const insertIndex = targetIndex !== undefined ? targetIndex : sections.length;
      sections.splice(insertIndex, 0, section);

      // Update order values
      const reorderedSections = sections.map((s, idx) => ({ ...s, order: idx }));
      reorderSections(currentTemplate.id, reorderedSections.map(s => s.id));
    } else {
      // Adding new section from palette
      const sectionType = availableSections.find(s => s.id === draggedSection);
      if (sectionType) {
        addSection(currentTemplate.id, {
          type: sectionType.type,
          order: targetIndex !== undefined ? targetIndex : currentTemplate.sections.length,
          enabled: true,
          config: {},
        });
      }
    }

    setDraggedSection(null);
    setDraggedFromBuilder(false);
  };

  const handleDropOnSection = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!currentTemplate) return;

    const targetIndex = currentTemplate.sections.findIndex(s => s.id === targetSectionId);
    handleDropOnBuilder(e, targetIndex);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (currentTemplate) {
      deleteSection(currentTemplate.id, sectionId);
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
      }
    }
  };

  const handleToggleSection = (sectionId: string) => {
    if (!currentTemplate) return;
    const section = currentTemplate.sections.find(s => s.id === sectionId);
    if (section) {
      updateSection(currentTemplate.id, sectionId, { enabled: !section.enabled });
    }
  };

  const handleSaveAsTemplate = () => {
    if (!currentTemplate || !templateName.trim()) return;

    duplicateTemplate(currentTemplate.id, templateName);
    setTemplateName('');
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setCurrentTemplate(template || null);
  };

  const getSectionLabel = (type: PrintSectionType): string => {
    return availableSections.find(s => s.type === type)?.label || type;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Template Selection */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Templates</h2>

        <div className="space-y-2 mb-6">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentTemplate?.id === template.id
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="font-medium text-sm">{template.name}</div>
              {template.isDefault && (
                <div className="text-xs text-gray-500 mt-1">Default</div>
              )}
            </button>
          ))}
        </div>

        {/* Save as Template */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold mb-2">Save Current as Template</h3>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
          />
          <button
            onClick={handleSaveAsTemplate}
            disabled={!templateName.trim() || !currentTemplate}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Template
          </button>
        </div>
      </div>

      {/* Center - Section Palette */}
      <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Available Sections</h2>
        <p className="text-sm text-gray-600 mb-4">Drag sections to the builder to add them</p>

        <div className="space-y-2">
          {availableSections.map(section => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(section.id, false)}
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900">{section.label}</div>
              <div className="text-xs text-gray-600 mt-1">{section.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area - Builder */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {currentTemplate?.name || 'Select a template'}
              </h2>
              {currentTemplate && (
                <div className="text-sm text-gray-600">
                  {currentTemplate.sections.filter(s => s.enabled).length} sections enabled
                </div>
              )}
            </div>

            {currentTemplate ? (
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnBuilder(e)}
                className="min-h-96 space-y-2"
              >
                {currentTemplate.sections.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-500">
                    Drag sections here to build your print layout
                  </div>
                ) : (
                  currentTemplate.sections
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
                            ? 'border-blue-500 bg-blue-50'
                            : section.enabled
                            ? 'border-gray-200 bg-white hover:border-gray-300'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-400 text-sm font-mono w-8">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {getSectionLabel(section.type)}
                              </div>
                              {section.type === 'page-break' && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Start new page
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSection(section.id);
                              }}
                              className={`px-3 py-1 text-xs rounded-md ${
                                section.enabled
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {section.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSection(section.id);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Section config preview */}
                        {selectedSectionId === section.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-xs text-gray-600">
                              Configuration options will appear here
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Select a template from the left to begin
              </div>
            )}
          </div>

          {/* Page Settings */}
          {currentTemplate && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Page Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Size
                  </label>
                  <select
                    value={currentTemplate.pageSettings.pageSize}
                    onChange={(e) => updateTemplate(currentTemplate.id, {
                      pageSettings: {
                        ...currentTemplate.pageSettings,
                        pageSize: e.target.value as any,
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                    <option value="a4">A4</option>
                    <option value="tabloid">Tabloid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orientation
                  </label>
                  <select
                    value={currentTemplate.pageSettings.orientation}
                    onChange={(e) => updateTemplate(currentTemplate.id, {
                      pageSettings: {
                        ...currentTemplate.pageSettings,
                        orientation: e.target.value as any,
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
