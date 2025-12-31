/**
 * Paperwork Module
 * Refactored to use PaperworkEditor with template system
 * Preserves batch export functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFixtureStore } from '../../store/fixtureStore';
import { useInfrastructureStore } from '../../store/infrastructureStore';
import { ReportType, PageSetup, DEFAULT_PAGE_SETUP } from '../../types/paperwork';
import { PaperworkTemplate } from '../../types/paperworkTemplate';
import { PaperworkEditor } from '../../components/paperwork/PaperworkEditor';
import { PaperworkHeaderDesigner } from '../../components/paperwork/PaperworkHeaderDesigner';
import { ReportTableRenderer } from '../../components/paperwork/ReportTableRenderer';
import { getReportData } from '../../utils/paperwork/dataConnector';
import { organizeReportData } from '../../utils/paperwork/reportOrganizer';

const REPORT_TEMPLATES = [
  { id: 'channel-hookup', name: 'Channel Hookup', icon: '📊' },
  { id: 'dimmer-schedule', name: 'Dimmer Schedule', icon: '⚡' },
  { id: 'circuit-list', name: 'Circuit List', icon: '🔌' },
  { id: 'dmx-addresses', name: 'DMX Address List', icon: '🎛️' },
  { id: 'color-schedule', name: 'Color Schedule', icon: '🎨' },
  { id: 'gobo-schedule', name: 'Gobo Schedule', icon: '🎭' },
  { id: 'power-summary', name: 'Power Summary', icon: '⚙️' },
  { id: 'infrastructure-list', name: 'Infrastructure Equipment List', icon: '🔧' },
  { id: 'network-summary', name: 'Network Summary', icon: '🌐' },
  { id: 'port-assignments', name: 'Port Assignments', icon: '🔌' },
  { id: 'infrastructure-power', name: 'Infrastructure Power', icon: '⚡' },
  { id: 'infrastructure-location', name: 'Infrastructure by Location', icon: '📍' }
] as const;

interface PaperworkProps {
  embedded?: boolean;
}

export function Paperwork({ embedded = false }: PaperworkProps = {}) {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const currentProjectId = routeProjectId || 'default-project';

  // Store access
  const { fixtures, loadFixtures } = useFixtureStore();
  const { equipment: infrastructure, loadEquipment } = useInfrastructureStore();

  // Module state
  const [selectedReport, setSelectedReport] = useState<ReportType>('channel-hookup');
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [projectData, setProjectData] = useState<any>(null);
  const [pageSetup, setPageSetup] = useState<PageSetup>(DEFAULT_PAGE_SETUP);

  // UI state
  const [showHeaderDesigner, setShowHeaderDesigner] = useState(false);
  const [showBatchExport, setShowBatchExport] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<PaperworkTemplate | null>(null);

  // Batch export state
  const [selectedReportsForBatch, setSelectedReportsForBatch] = useState<Set<ReportType>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, reportName: '' });

  // Load data on mount
  useEffect(() => {
    loadFixtures();
    loadEquipment(currentProjectId);

    const loadProjectInfo = async () => {
      if (!window.api?.projects) return;
      try {
        const project = await window.api.projects.getById(currentProjectId);
        if (project) {
          setProjectName(project.name || 'Untitled Project');
          setProjectData(project);
        }
      } catch (error) {
        console.error('Failed to load project info:', error);
      }
    };

    loadProjectInfo();
  }, [loadFixtures, loadEquipment, currentProjectId]);

  // Handle single PDF export
  const handleExportPDF = useCallback(async (template: PaperworkTemplate) => {
    if (!window.api?.paperwork || !template) {
      alert('PDF export is not available');
      return;
    }

    try {
      // Get report data
      const reportData = getReportData(template.reportType, currentProjectId);
      const organizedData = organizeReportData(reportData, template.organization, template.columns);

      // Create hidden element for rendering
      const tempContainer = document.createElement('div');
      tempContainer.className = 'report-content';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);

      // Render to hidden element (simplified - would need actual rendering)
      tempContainer.innerHTML = `<div class="report-preview">${template.name} Report</div>`;

      // Create HTML document
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${template.name} - ${projectName}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                color: #1f2937;
                background: white;
                padding: ${pageSetup.marginTop}in ${pageSetup.marginRight}in ${pageSetup.marginBottom}in ${pageSetup.marginLeft}in;
              }
              table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
              th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
              th { background-color: #f3f4f6; font-weight: 600; }
              @media print {
                body { margin: 0; padding: ${pageSetup.marginTop}in ${pageSetup.marginRight}in ${pageSetup.marginBottom}in ${pageSetup.marginLeft}in; }
              }
            </style>
          </head>
          <body>
            ${tempContainer.innerHTML}
          </body>
        </html>
      `;

      const filename = `${projectName}_${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      const result = await window.api.paperwork.exportPDF(htmlContent, filename, pageSetup);

      // Cleanup
      document.body.removeChild(tempContainer);

      if (result.success) {
        console.log('PDF exported successfully');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  }, [currentProjectId, projectName, pageSetup]);

  // Handle batch export
  const handleBatchExport = useCallback(async () => {
    if (selectedReportsForBatch.size === 0) {
      alert('Please select at least one report to export');
      return;
    }

    if (!window.api?.paperwork) {
      alert('PDF export is not available');
      return;
    }

    setShowBatchExport(false);
    setIsBatchProcessing(true);

    const reportsToExport = Array.from(selectedReportsForBatch);
    const totalReports = reportsToExport.length;
    let successCount = 0;

    try {
      for (let i = 0; i < reportsToExport.length; i++) {
        const reportType = reportsToExport[i];
        const reportTemplate = REPORT_TEMPLATES.find(t => t.id === reportType);
        const reportName = reportTemplate?.name || 'Report';

        setBatchProgress({ current: i + 1, total: totalReports, reportName });

        // Get report data
        const reportData = getReportData(reportType, currentProjectId);

        // Create simple HTML (simplified for now)
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${reportName} - ${projectName}</title>
              <style>
                body { font-family: sans-serif; padding: 1in; }
                h1 { margin-bottom: 1rem; }
              </style>
            </head>
            <body>
              <h1>${reportName}</h1>
              <p>${reportData.length} items</p>
            </body>
          </html>
        `;

        const filename = `${projectName}_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

        try {
          const result = await window.api.paperwork.exportPDF(htmlContent, filename, pageSetup);
          if (result.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`Error exporting ${reportName}:`, error);
        }

        // Small delay between exports
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      alert(`Successfully exported ${successCount} of ${totalReports} reports`);
    } catch (error) {
      console.error('Batch export error:', error);
      alert('Batch export failed');
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress({ current: 0, total: 0, reportName: '' });
    }
  }, [selectedReportsForBatch, currentProjectId, projectName, pageSetup]);

  // Toggle batch selection
  const toggleBatchSelection = useCallback((reportType: ReportType) => {
    setSelectedReportsForBatch(prev => {
      const next = new Set(prev);
      if (next.has(reportType)) {
        next.delete(reportType);
      } else {
        next.add(reportType);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Top Navigation Bar */}
      {!embedded && (
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/modules')}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              >
                ← Modules
              </button>
              <div>
                <h1 className="text-xl font-bold">{projectName}</h1>
                <p className="text-sm text-gray-400">
                  Paperwork Generator • {fixtures.length} fixtures • {infrastructure.length} infrastructure
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBatchExport(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition"
              >
                📦 Batch Export
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PaperworkEditor
          reportType={selectedReport}
          projectId={currentProjectId}
          onExport={handleExportPDF}
          onHeaderDesign={(template) => {
            setCurrentTemplate(template);
            setShowHeaderDesigner(true);
          }}
          onReportTypeChange={setSelectedReport}
        />
      </div>

      {/* Header Designer Modal */}
      {showHeaderDesigner && currentTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-8">
          <div className="bg-gray-900 rounded-lg w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold">Design Header - {currentTemplate.name}</h2>
              <button
                onClick={() => setShowHeaderDesigner(false)}
                className="p-2 hover:bg-gray-800 rounded transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <PaperworkHeaderDesigner
                projectId={currentProjectId}
                reportType={currentTemplate.reportType}
                onSave={() => setShowHeaderDesigner(false)}
                onCancel={() => setShowHeaderDesigner(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Batch Export Dialog */}
      {showBatchExport && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-8">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">Batch Export Reports</h2>
              <p className="text-sm text-gray-400 mt-1">
                Select reports to export as PDFs
              </p>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {REPORT_TEMPLATES.map(template => (
                  <label
                    key={template.id}
                    className="flex items-center gap-3 p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReportsForBatch.has(template.id as ReportType)}
                      onChange={() => toggleBatchSelection(template.id as ReportType)}
                      className="w-4 h-4"
                    />
                    <span>{template.icon}</span>
                    <span className="flex-1">{template.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedReportsForBatch.size} report{selectedReportsForBatch.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBatchExport(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchExport}
                  disabled={selectedReportsForBatch.size === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition"
                >
                  Export {selectedReportsForBatch.size} Report{selectedReportsForBatch.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Processing Overlay */}
      {isBatchProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-bold mb-2">Exporting Reports...</h3>
            <p className="text-gray-400 mb-4">
              {batchProgress.reportName}
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">
              {batchProgress.current} of {batchProgress.total}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
