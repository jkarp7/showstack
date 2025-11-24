import { useState, useEffect } from 'react';
import type { PrintTemplate, PrepProject } from '../../types/prep';
import { PrintBuilder } from './PrintBuilder';

interface PrintPreviewProps {
  currentProject: PrepProject;
  template: PrintTemplate | null;
  onTemplateChange: (template: PrintTemplate) => void;
  onSaveTemplate: (template: PrintTemplate) => void;
}

export function PrintPreview({
  currentProject,
  template,
  onTemplateChange,
  onSaveTemplate
}: PrintPreviewProps) {
  const [showSectionEditor, setShowSectionEditor] = useState(false);

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

  const handleExportPDF = async () => {
    try {
      const result = await window.api.prep.exportPDF(currentProject.id, template);

      if (result.canceled) {
        // User canceled the save dialog
        return;
      }

      if (result.success) {
        alert(`PDF exported successfully to:\n${result.filePath}`);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    // TODO: Implement print functionality
    console.log('Print clicked');
    alert('Print functionality coming soon!');
  };

  if (!template) return null;

  return (
    <div className="flex h-full gap-4">
      {/* Left Side - Preview Area */}
      <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-lg flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-300 mb-2">Preview Coming Soon</h4>
            <p className="text-sm text-gray-500 max-w-md">
              Live page rendering with navigation and thumbnails will be available in the next update.
              Use "Arrange Sections" to configure your print template.
            </p>
            <div className="mt-6">
              <p className="text-xs text-gray-600 mb-2">Current Template:</p>
              <p className="text-sm text-gray-400">
                {template.sections.filter(s => s.enabled).length} sections enabled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Settings Panel */}
      <div className="w-96 bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Print Settings</h3>
          <p className="text-sm text-gray-400 mt-1">
            {template.name}
            {template.isDefault && <span className="ml-2 text-blue-400">• Default</span>}
          </p>
        </div>

        {/* Page Settings */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-300 uppercase mb-3">Page Settings</h4>
          <div className="space-y-4">
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
            <div>
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

        {/* Section Info */}
        <div className="mb-6 pb-6 border-b border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 uppercase mb-2">Sections</h4>
          <p className="text-sm text-gray-400">
            {template.sections.filter(s => s.enabled).length} sections enabled
          </p>
          <button
            onClick={() => setShowSectionEditor(true)}
            className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm"
          >
            Arrange Sections
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition text-sm"
          >
            Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition text-sm"
          >
            Print
          </button>
        </div>
      </div>

      {/* Section Editor Modal (PrintBuilder) */}
      {showSectionEditor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-8">
          <div className="bg-gray-900 rounded-lg w-full h-full max-w-7xl max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Arrange Sections</h3>
              <button
                onClick={() => setShowSectionEditor(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden p-4">
              <PrintBuilder
                currentProject={currentProject}
                template={template}
                onTemplateChange={onTemplateChange}
                onSaveTemplate={onSaveTemplate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
