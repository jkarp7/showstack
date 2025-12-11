import { useState, useEffect } from 'react';
import type { PrintTemplate, PrepProject } from '../../types/prep';
import { PrintBuilder } from './PrintBuilder';
import { PageRenderer } from './PageRenderer';

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
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

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
        pageSize: 'Letter',
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
        { id: 's4', type: 'page-break', order: 3, enabled: true, config: {} },

        // Page 3: Notes
        {
          id: 's5',
          type: 'notes',
          order: 4,
          enabled: true,
          config: {
            noteType: 'general_notes'
          }
        },
        { id: 's6', type: 'page-break', order: 5, enabled: true, config: {} },

        // Page 4: Revision Summary
        {
          id: 's7',
          type: 'revision-summary',
          order: 6,
          enabled: true,
          config: {
            showRevisionDetails: true,
            includeChangelog: true,
            onlyShowIfRevisions: true
          }
        },
        { id: 's8', type: 'page-break', order: 7, enabled: true, config: {} },

        // Page 5: Equipment by Section
        {
          id: 's9',
          type: 'equipment-by-section',
          order: 8,
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

  const handlePrint = async () => {
    try {
      const result = await window.api.prep.print(currentProject.id, template);

      if (result.success) {
        // Print dialog was shown and user either printed or canceled
        // We don't need to show a success message since the OS print dialog handles that
      }
    } catch (error) {
      console.error('Error printing:', error);
      alert('Failed to open print dialog. Please try again.');
    }
  };

  if (!template) return null;

  // Get enabled sections that are not page breaks
  const contentSections = template.sections
    .filter(s => s.enabled && s.type !== 'page-break')
    .sort((a, b) => a.order - b.order);

  const totalPages = contentSections.length;
  const currentSection = contentSections[currentPageIndex];

  return (
    <div className="flex h-full gap-4">
      {/* Left Side - Preview Area */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
        {/* Navigation Controls */}
        {totalPages > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition"
            >
              ← Previous
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPageIndex + 1} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPageIndex(Math.min(totalPages - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === totalPages - 1}
              className="px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition"
            >
              Next →
            </button>
          </div>
        )}

        {/* Page Preview */}
        <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-700 p-2">
          <div className="w-full h-full flex items-center justify-center">
            {totalPages > 0 && currentSection ? (
              <PageRenderer
                section={currentSection}
                project={currentProject}
                pageSettings={template.pageSettings}
                pageNumber={currentPageIndex + 1}
              />
            ) : (
              <div className="text-center p-12 text-gray-400">
                <div className="text-lg mb-2">No Pages to Display</div>
                <div className="text-sm">
                  Add sections using "Arrange Sections" to see the preview.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Settings Panel */}
      <div className="w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Print Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {template.name}
            {template.isDefault && <span className="ml-2 text-blue-400">• Default</span>}
          </p>
        </div>

        {/* Page Settings */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-3">Page Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Page Size</label>
              <select
                value={template.pageSettings.pageSize}
                onChange={(e) => onTemplateChange({
                  ...template,
                  pageSettings: { ...template.pageSettings, pageSize: e.target.value as any },
                  updated_at: Date.now()
                })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
              >
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
                <option value="a4">A4</option>
                <option value="tabloid">Tabloid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Orientation</label>
              <select
                value={template.pageSettings.orientation}
                onChange={(e) => onTemplateChange({
                  ...template,
                  pageSettings: { ...template.pageSettings, orientation: e.target.value as any },
                  updated_at: Date.now()
                })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
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
                  className="w-4 h-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show page numbers</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section Info */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2">Sections</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full h-full max-w-7xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Arrange Sections</h3>
              <button
                onClick={() => setShowSectionEditor(false)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
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
