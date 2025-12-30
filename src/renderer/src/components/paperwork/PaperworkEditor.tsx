/**
 * PaperworkEditor
 * Integrated editor for creating and customizing paperwork report templates
 */

import React, { useState, useCallback, useMemo } from 'react';
import { PaperworkTemplate, ReportType } from '../../types/paperworkTemplate';
import { PaperworkColumnConfig, ReportOrganization } from '../../types/paperworkTemplate';
import { PaperworkTemplateLibrary } from './PaperworkTemplateLibrary';
import { ColumnConfigurationPanel } from './ColumnConfigurationPanel';
import { GroupingSortingControls } from './GroupingSortingControls';
import { ReportTableRenderer } from './ReportTableRenderer';
import { usePaperworkTemplates, useActiveTemplate } from '../../hooks/usePaperworkTemplates';
import { getReportData } from '../../utils/paperwork/dataConnector';
import { organizeReportData } from '../../utils/paperwork/reportOrganizer';

interface PaperworkEditorProps {
  reportType: ReportType;
  projectId?: string;
  onExport?: (template: PaperworkTemplate) => void;
  onHeaderDesign?: (template: PaperworkTemplate) => void;
}

export function PaperworkEditor({
  reportType,
  projectId = 'default-project',
  onExport,
  onHeaderDesign
}: PaperworkEditorProps) {
  // Template management
  const {
    templates,
    loading: templatesLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate
  } = usePaperworkTemplates({ reportType, autoLoad: true });

  const { activeTemplate, setActiveTemplate } = useActiveTemplate();

  // Editor state
  const [showLibrary, setShowLibrary] = useState(true);
  const [previewScale, setPreviewScale] = useState(100);
  const [templateName, setTemplateName] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get report data for preview
  const reportData = useMemo(() => {
    return getReportData(reportType, projectId);
  }, [reportType, projectId]);

  // Organize data based on current organization settings
  const organizedData = useMemo(() => {
    if (!activeTemplate || !reportData.length) return { groups: [], hasGroups: false };

    return organizeReportData(
      reportData,
      activeTemplate.organization,
      activeTemplate.columns
    );
  }, [reportData, activeTemplate]);

  // Handle template load
  const handleLoadTemplate = useCallback((template: PaperworkTemplate) => {
    setActiveTemplate(template);
    setTemplateName(template.name);
    setHasUnsavedChanges(false);
  }, [setActiveTemplate]);

  // Handle column changes
  const handleColumnsChange = useCallback((newColumns: PaperworkColumnConfig[]) => {
    if (!activeTemplate) return;

    const updatedTemplate = {
      ...activeTemplate,
      columns: newColumns
    };

    setActiveTemplate(updatedTemplate);
    setHasUnsavedChanges(true);
  }, [activeTemplate, setActiveTemplate]);

  // Handle organization changes
  const handleOrganizationChange = useCallback((newOrganization: ReportOrganization) => {
    if (!activeTemplate) return;

    const updatedTemplate = {
      ...activeTemplate,
      organization: newOrganization
    };

    setActiveTemplate(updatedTemplate);
    setHasUnsavedChanges(true);
  }, [activeTemplate, setActiveTemplate]);

  // Save template
  const handleSaveTemplate = useCallback(async () => {
    if (!activeTemplate) return;

    try {
      if (activeTemplate.id) {
        // Update existing template
        await updateTemplate(activeTemplate.id, {
          name: templateName || activeTemplate.name,
          columns: activeTemplate.columns,
          organization: activeTemplate.organization
        });
      } else {
        // Create new template
        await createTemplate({
          name: templateName || `Custom ${reportType}`,
          reportType,
          columns: activeTemplate.columns,
          organization: activeTemplate.organization,
          pageSetup: activeTemplate.pageSetup,
          isSystem: false
        });
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  }, [activeTemplate, templateName, reportType, updateTemplate, createTemplate]);

  // Save as new template
  const handleSaveAsNewTemplate = useCallback(async (name: string) => {
    if (!activeTemplate) return;

    try {
      await createTemplate({
        name,
        reportType,
        columns: activeTemplate.columns,
        organization: activeTemplate.organization,
        pageSetup: activeTemplate.pageSetup,
        isSystem: false
      });

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  }, [activeTemplate, reportType, createTemplate]);

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
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Template Library Sidebar */}
      {showLibrary && (
        <div className="w-80 border-r border-gray-700 flex flex-col">
          <PaperworkTemplateLibrary
            reportType={reportType}
            templates={templates}
            activeTemplateId={activeTemplate?.id}
            onLoadTemplate={handleLoadTemplate}
            onDeleteTemplate={deleteTemplate}
            onDuplicateTemplate={duplicateTemplate}
          />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
                const name = window.prompt('Template name:', `${templateName} (Copy)`);
                if (name) handleSaveAsNewTemplate(name);
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
          </div>
        </div>

        {/* Editor Content */}
        {activeTemplate ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Configuration Panel */}
            <div className="w-96 border-r border-gray-700 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Grouping & Sorting */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                    Organization
                  </h3>
                  <GroupingSortingControls
                    organization={activeTemplate.organization}
                    columns={activeTemplate.columns}
                    onChange={handleOrganizationChange}
                  />
                </div>

                {/* Column Configuration */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                    Columns
                  </h3>
                  <ColumnConfigurationPanel
                    columns={activeTemplate.columns}
                    reportType={reportType}
                    onChange={handleColumnsChange}
                  />
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="flex-1 bg-gray-850 overflow-hidden flex flex-col">
              {/* Preview Controls */}
              <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Preview ({reportData.length} items)
                </div>

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
                    transition: 'transform 0.2s'
                  }}
                >
                  <ReportTableRenderer
                    columns={activeTemplate.columns}
                    data={organizedData}
                    reportType={reportType}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
    </div>
  );
}
