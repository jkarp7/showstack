/**
 * PaperworkEditor
 * Integrated editor for creating and customizing paperwork report templates
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PaperworkTemplate, ReportType } from '../../types/paperworkTemplate';
import { PaperworkColumnConfig, ReportOrganization } from '../../types/paperworkTemplate';
import { ReportTypeSelector } from './ReportTypeSelector';
import { ColumnVisibilityControls } from './ColumnVisibilityControls';
import { ColumnNameSettings } from './ColumnNameSettings';
import { FontCustomizationControls } from './FontCustomizationControls';
import { PaperworkTemplateLibrary } from './PaperworkTemplateLibrary';
import { ReportTableRenderer } from './ReportTableRenderer';
import { usePaperworkTemplates, useActiveTemplate } from '../../hooks/usePaperworkTemplates';
import { getReportData } from '../../utils/paperwork/dataConnector';
import { organizeReportData } from '../../utils/paperwork/reportOrganizer';

interface PaperworkEditorProps {
  reportType: ReportType;
  projectId?: string;
  onExport?: (template: PaperworkTemplate) => void;
  onBatchExport?: () => void;
  onHeaderDesign?: (template: PaperworkTemplate) => void;
  onReportTypeChange?: (reportType: ReportType) => void;
}

export function PaperworkEditor({
  reportType,
  projectId = 'default-project',
  onExport,
  onBatchExport,
  onHeaderDesign,
  onReportTypeChange,
}: PaperworkEditorProps) {
  // Template management
  const {
    templates,
    loading: templatesLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  } = usePaperworkTemplates({ reportType, autoLoad: true });

  const { activeTemplate, loadTemplate, updateActiveTemplate } = useActiveTemplate();

  // Editor state
  const [showLibrary, setShowLibrary] = useState(true);
  const [previewScale, setPreviewScale] = useState(100);
  const [templateName, setTemplateName] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');

  // Auto-load default system template when report type changes
  useEffect(() => {
    if (templates.length > 0 && !templatesLoading) {
      // Find the first system template for this report type
      const defaultTemplate = templates.find((t) => t.isSystem);
      if (defaultTemplate && (!activeTemplate || activeTemplate.reportType !== reportType)) {
        handleLoadTemplate(defaultTemplate);
      }
    }
  }, [reportType, templates, templatesLoading]);

  // Get report data for preview (async)
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const data = await getReportData(reportType, projectId);
      if (!cancelled) {
        setReportData(data);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [reportType, projectId]);

  // Organize data based on current organization settings
  const organizedData = useMemo(() => {
    if (!activeTemplate || !reportData.length) return { groups: [], hasGroups: false };

    return organizeReportData(reportData, activeTemplate.organization, activeTemplate.columns);
  }, [reportData, activeTemplate]);

  // Handle template load
  const handleLoadTemplate = useCallback(
    (template: PaperworkTemplate) => {
      loadTemplate(template);
      setTemplateName(template.name);
      setHasUnsavedChanges(false);
    },
    [loadTemplate],
  );

  // Handle column changes
  const handleColumnsChange = useCallback(
    (newColumns: PaperworkColumnConfig[]) => {
      if (!activeTemplate) return;

      updateActiveTemplate({ columns: newColumns });
      setHasUnsavedChanges(true);
    },
    [activeTemplate, updateActiveTemplate],
  );

  // Handle organization changes
  const handleOrganizationChange = useCallback(
    (newOrganization: ReportOrganization) => {
      if (!activeTemplate) return;

      updateActiveTemplate({ organization: newOrganization });
      setHasUnsavedChanges(true);
    },
    [activeTemplate, updateActiveTemplate],
  );

  // Handle font style changes
  const handleFontStyleChange = useCallback(
    (newFontStyle: any) => {
      if (!activeTemplate) return;

      updateActiveTemplate({
        pageSetup: {
          ...activeTemplate.pageSetup,
          fontStyle: newFontStyle,
        },
      });
      setHasUnsavedChanges(true);
    },
    [activeTemplate, updateActiveTemplate],
  );

  // Save as new template
  const handleSaveAsNewTemplate = useCallback(
    async (name: string) => {
      if (!activeTemplate) {
        alert('No template to save');
        return;
      }

      try {
        console.log('Creating new template:', name);
        const result = await createTemplate({
          name,
          reportType,
          columns: activeTemplate.columns,
          organization: activeTemplate.organization,
          pageSetup: activeTemplate.pageSetup,
          isSystem: false,
        });

        if (result) {
          setHasUnsavedChanges(false);
          // Load the newly created template
          loadTemplate(result);
          setTemplateName(result.name);
          alert(`Template "${name}" created successfully!`);
          console.log('Template created:', result);
        } else {
          alert('Failed to create template - check console for errors');
        }
      } catch (error) {
        console.error('Failed to create template:', error);
        alert(
          `Error creating template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    [activeTemplate, reportType, createTemplate, loadTemplate],
  );

  // Save template
  const handleSaveTemplate = useCallback(async () => {
    if (!activeTemplate) {
      alert('No template to save');
      return;
    }

    // If this is a system template, create a copy instead of updating
    if (activeTemplate.isSystem) {
      const newName = `${activeTemplate.name} (Custom)`;
      await handleSaveAsNewTemplate(newName);
      return;
    }

    try {
      let result;
      if (activeTemplate.id) {
        // Update existing custom template
        console.log('Updating template:', activeTemplate.id);
        result = await updateTemplate(activeTemplate.id, {
          name: templateName || activeTemplate.name,
          columns: activeTemplate.columns,
          organization: activeTemplate.organization,
          pageSetup: activeTemplate.pageSetup,
        });
      } else {
        // Create new template
        console.log('Creating new template');
        result = await createTemplate({
          name: templateName || `Custom ${reportType}`,
          reportType,
          columns: activeTemplate.columns,
          organization: activeTemplate.organization,
          pageSetup: activeTemplate.pageSetup,
          isSystem: false,
        });
      }

      if (result) {
        setHasUnsavedChanges(false);
        // Update active template to reflect saved state
        loadTemplate(result);
        setTemplateName(result.name);
        alert('Template saved successfully!');
        console.log('Template saved:', result);
      } else {
        alert('Failed to save template - check console for errors');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert(`Error saving template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [
    activeTemplate,
    templateName,
    reportType,
    updateTemplate,
    createTemplate,
    handleSaveAsNewTemplate,
    loadTemplate,
  ]);

  // Handle template duplication
  const handleDuplicateTemplate = useCallback(
    async (template: PaperworkTemplate) => {
      try {
        console.log('Duplicating template:', template.id, template.name);
        const newName = `${template.name} (Copy)`;
        const result = await duplicateTemplate(template.id, newName);
        if (result) {
          // Load the duplicated template
          handleLoadTemplate(result);
          alert(`Template "${newName}" created successfully!`);
          console.log('Template duplicated:', result);
        } else {
          alert('Failed to duplicate template - check console for errors');
        }
      } catch (error) {
        console.error('Failed to duplicate template:', error);
        alert(
          `Error duplicating template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    [duplicateTemplate, handleLoadTemplate],
  );

  // Handle template deletion
  const handleDeleteTemplate = useCallback(
    async (templateId: string) => {
      try {
        console.log('Deleting template:', templateId);
        const success = await deleteTemplate(templateId);
        if (success) {
          // If we deleted the active template, clear it
          if (activeTemplate?.id === templateId) {
            // Load the first available template
            if (templates.length > 1) {
              const nextTemplate = templates.find((t) => t.id !== templateId);
              if (nextTemplate) {
                handleLoadTemplate(nextTemplate);
              }
            }
          }
          alert('Template deleted successfully!');
          console.log('Template deleted:', templateId);
        } else {
          alert('Failed to delete template - check console for errors');
        }
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert(
          `Error deleting template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    [deleteTemplate, activeTemplate, templates, handleLoadTemplate],
  );

  // Handle template creation
  const handleCreateNewTemplate = useCallback(() => {
    // Create a blank template based on current report type
    if (!activeTemplate) {
      alert('No template loaded to base new template on');
      return;
    }

    // Prompt for name
    setSaveAsName(`New ${reportType} Template`);
    setShowSaveAsDialog(true);
  }, [activeTemplate, reportType]);

  // Handle header design
  const handleHeaderDesign = useCallback(() => {
    if (activeTemplate && onHeaderDesign) {
      onHeaderDesign(activeTemplate);
    }
  }, [activeTemplate, onHeaderDesign]);

  // Handle export
  const handleExport = useCallback(() => {
    if (activeTemplate && onExport) {
      onExport(activeTemplate);
    }
  }, [activeTemplate, onExport]);

  return (
    <div className="flex h-full bg-gray-900 text-gray-100">
      {/* Template Library Sidebar */}
      {showLibrary && (
        <div className="w-80 border-r border-gray-700 flex flex-col">
          {/* Report Type Selector - Fixed at top */}
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <ReportTypeSelector
              value={reportType}
              onChange={(newReportType) => {
                if (onReportTypeChange) {
                  onReportTypeChange(newReportType);
                }
              }}
            />
          </div>

          {/* Scrollable Controls Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Column Visibility Controls */}
            {activeTemplate && (
              <div className="flex-shrink-0">
                <ColumnVisibilityControls
                  reportType={reportType}
                  columns={activeTemplate.columns}
                  onChange={handleColumnsChange}
                />
              </div>
            )}

            {/* Column Name Settings */}
            {activeTemplate && (
              <div className="flex-shrink-0">
                <ColumnNameSettings
                  columns={activeTemplate.columns}
                  onChange={handleColumnsChange}
                  reportType={reportType}
                />
              </div>
            )}

            {/* Font Customization Controls */}
            {activeTemplate && (
              <div className="flex-shrink-0">
                <FontCustomizationControls
                  fontStyle={activeTemplate.pageSetup.fontStyle}
                  onChange={handleFontStyleChange}
                />
              </div>
            )}

            {/* Template Library */}
            <div className="flex-shrink-0">
              <PaperworkTemplateLibrary
                templates={templates}
                currentTemplate={activeTemplate}
                onLoadTemplate={handleLoadTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onDuplicateTemplate={handleDuplicateTemplate}
                onCreateNew={handleCreateNewTemplate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title={showLibrary ? 'Hide Library' : 'Show Library'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Template name..."
                className="bg-gray-700 text-gray-100 px-3 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {hasUnsavedChanges && (
                <span className="text-yellow-500 text-sm">• Unsaved changes</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveTemplate}
              disabled={!activeTemplate || !hasUnsavedChanges}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Save
            </button>

            <button
              onClick={() => {
                setSaveAsName(`${templateName || activeTemplate?.name || 'Template'} (Copy)`);
                setShowSaveAsDialog(true);
              }}
              disabled={!activeTemplate}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg transition-colors"
            >
              Save As...
            </button>

            <div className="w-px h-6 bg-gray-600 mx-2" />

            <button
              onClick={handleHeaderDesign}
              disabled={!activeTemplate}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Design Header
            </button>

            <button
              onClick={handleExport}
              disabled={!activeTemplate}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors"
            >
              Export PDF
            </button>

            {onBatchExport && (
              <button
                onClick={onBatchExport}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors"
              >
                📦 Batch Export
              </button>
            )}
          </div>
        </div>

        {/* Editor Content */}
        {activeTemplate ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Live Preview */}
            <div className="flex-1 bg-gray-850 overflow-hidden flex flex-col">
              {/* Preview Controls */}
              <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-400">Preview ({reportData.length} items)</div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    Zoom:
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={previewScale}
                      onChange={(e) => setPreviewScale(Number(e.target.value))}
                      className="w-32"
                    />
                    <span className="w-12 text-right">{previewScale}%</span>
                  </label>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-auto p-8">
                <div
                  style={{
                    transform: `scale(${previewScale / 100})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s',
                  }}
                >
                  <ReportTableRenderer
                    columns={activeTemplate.columns}
                    data={organizedData}
                    reportType={reportType}
                    organization={activeTemplate.organization}
                    fontStyle={activeTemplate.pageSetup.fontStyle}
                    onColumnsChange={handleColumnsChange}
                    onOrganizationChange={handleOrganizationChange}
                    editable={true}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg mb-2">No template selected</p>
              <p className="text-sm">
                {showLibrary
                  ? 'Select a template from the library to begin'
                  : 'Click the menu icon to show the template library'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save As Dialog */}
      {showSaveAsDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-8"
          style={{ zIndex: 10000 }}
        >
          <div className="bg-gray-800 rounded-lg w-full max-w-md shadow-xl text-white">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">Save Template As...</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Template Name:
              </label>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && saveAsName.trim()) {
                    handleSaveAsNewTemplate(saveAsName.trim());
                    setShowSaveAsDialog(false);
                  } else if (e.key === 'Escape') {
                    setShowSaveAsDialog(false);
                  }
                }}
                autoFocus
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowSaveAsDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (saveAsName.trim()) {
                    handleSaveAsNewTemplate(saveAsName.trim());
                    setShowSaveAsDialog(false);
                  }
                }}
                disabled={!saveAsName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
