/**
 * Paperwork Module
 * Refactored to use PaperworkEditor with template system
 * Preserves batch export functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useParams } from 'react-router-dom';
import { logger } from '../../utils/logger';
import { useFixtureStore } from '../../store/fixtureStore';
import { useInfrastructureStore } from '../../store/infrastructureStore';
import { ReportType, PageSetup, DEFAULT_PAGE_SETUP } from '../../types/paperwork';
import { PaperworkTemplate } from '../../types/paperworkTemplate';
import { PaperworkEditor } from '../../components/paperwork/PaperworkEditor';
import { PaperworkHeaderDesigner } from '../../components/paperwork/PaperworkHeaderDesigner';
import { ReportTableRenderer } from '../../components/paperwork/ReportTableRenderer';
import { getReportData } from '../../utils/paperwork/dataConnector';
import { organizeReportData } from '../../utils/paperwork/reportOrganizer';
import {
  renderHeaderHTML,
  renderFooterHTML,
  renderHeaderTemplate,
  renderFooterTemplate,
  calculateDataRange,
} from '../../utils/paperwork/headerRenderer';

const REPORT_TEMPLATES = [
  { id: 'channel-hookup', name: 'Channel Hookup' },
  { id: 'dimmer-schedule', name: 'Dimmer Schedule' },
  { id: 'circuit-list', name: 'Circuit List' },
  { id: 'dmx-addresses', name: 'DMX Address List' },
  { id: 'color-schedule', name: 'Color Schedule' },
  { id: 'gobo-schedule', name: 'Gobo Schedule' },
  { id: 'power-summary', name: 'Power Summary' },
  { id: 'color-cut-report', name: 'Color Cut Report' },
  { id: 'infrastructure-list', name: 'Infrastructure Equipment List' },
  { id: 'network-summary', name: 'Network Summary' },
  { id: 'port-assignments', name: 'Port Assignments' },
  { id: 'infrastructure-power', name: 'Infrastructure Power' },
  { id: 'infrastructure-location', name: 'Infrastructure by Location' },
] as const;

export function Paperwork() {
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
  const [selectedReportsForBatch, setSelectedReportsForBatch] = useState<Set<ReportType>>(
    new Set(),
  );
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
        logger.error('Failed to load project info:', error);
      }
    };

    loadProjectInfo();
  }, [loadFixtures, loadEquipment, currentProjectId]);

  // Handle single PDF export
  const handleExportPDF = useCallback(
    async (template: PaperworkTemplate) => {
      if (!window.api?.paperwork || !template) {
        alert('PDF export is not available');
        return;
      }

      try {
        logger.info('Starting PDF export for template:', template.name);

        // Get report data
        const reportData = await getReportData(template.reportType, currentProjectId);
        const organizedData = organizeReportData(
          reportData,
          template.organization,
          template.columns,
        );

        logger.info('Report data loaded:', reportData.length, 'items');
        logger.info('Organized data:', organizedData);

        // Render the table to HTML using React server-side rendering
        const tableHTML = renderToStaticMarkup(
          <ReportTableRenderer
            columns={template.columns}
            data={organizedData}
            reportType={template.reportType}
            organization={template.organization}
            fontStyle={template.pageSetup.fontStyle}
            editable={false}
          />,
        );

        logger.info('Table HTML rendered, length:', tableHTML.length);

        // Prepare header/footer data
        const headerData = {
          reportTitle: template.name,
          productionName: projectName,
          ldName: projectData?.lighting_designer || '',
          venue: projectData?.venue || '',
          date: new Date().toLocaleDateString(),
        };

        // Calculate data range for footer
        const dataRange = calculateDataRange(template.reportType, reportData);
        const userName = 'User'; // TODO: Get from user preferences/settings

        // Render header and footer HTML with print-friendly grid layout
        let headerHTML = '';
        if (template.headerTemplateId) {
          logger.info('Rendering header template:', template.headerTemplateId);
          headerHTML = (await renderHeaderHTML(template.headerTemplateId, headerData)) || '';
        }
        const footerHTML = renderFooterHTML(userName, dataRange);

        // Create HTML document with table-based layout for repeating headers
        const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${template.name} - ${projectName}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: ${template.pageSetup.fontStyle?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'};
                font-size: ${template.pageSetup.fontStyle?.fontSize || 10}pt;
                line-height: ${template.pageSetup.fontStyle?.lineHeight || 1.2};
                color: #000;
                background: white;
              }

              /* Wrapper table for repeating headers */
              .report-wrapper {
                width: 100%;
                border-collapse: collapse;
              }

              .report-wrapper thead {
                display: table-header-group; /* Ensures thead repeats on each page */
              }

              .report-wrapper tbody {
                display: table-row-group;
              }

              .report-wrapper td {
                border: none;
                padding: 0;
                vertical-align: top;
              }

              /* Data table styling */
              table.data-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1rem;
              }

              table.data-table th,
              table.data-table td {
                padding: 8px;
                text-align: left;
                border-left: none;
                border-right: none;
              }

              table.data-table th {
                background-color: transparent;
                font-weight: ${template.pageSetup.fontStyle?.fontWeight || 'bold'};
                font-size: ${template.pageSetup.fontStyle?.headerFontSize || 11}pt;
                border-top: 2px solid #9ca3af;
                border-bottom: 2px solid #9ca3af;
              }

              table.data-table td {
                border-top: 1px solid #d1d5db;
                border-bottom: 1px solid #d1d5db;
              }

              table.data-table td {
                font-size: ${template.pageSetup.fontStyle?.fontSize || 10}pt;
              }

              h3 {
                color: #2563eb;
                margin-top: 20px;
                margin-bottom: 16px;
                font-size: 14pt;
              }

              @media print {
                .report-wrapper thead {
                  display: table-header-group;
                }
              }
            </style>
          </head>
          <body>
            <table class="report-wrapper">
              <thead>
                <tr>
                  <td>
                    ${headerHTML}
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    ${tableHTML}
                  </td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

        const filename = `${projectName}_${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

        logger.info('Calling PDF export API with filename:', filename);

        const result = await window.api.paperwork.exportPDF(
          htmlContent,
          filename,
          pageSetup,
          template.pageSetup.fontStyle?.fontFamily ||
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        );

        if (result.success) {
          logger.info('PDF exported successfully');
        }
      } catch (error) {
        logger.error('Error exporting PDF:', error);
        alert('Failed to export PDF');
      }
    },
    [currentProjectId, projectName, pageSetup],
  );

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

    try {
      // Load all templates first
      const allTemplates = await window.api.paperworkTemplates.getAll();

      // Collect all report sections
      const reportSections: string[] = [];
      let defaultFontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      let defaultFontSize = 10;

      for (let i = 0; i < reportsToExport.length; i++) {
        const reportType = reportsToExport[i];
        const reportTemplate = REPORT_TEMPLATES.find((t) => t.id === reportType);
        const reportName = reportTemplate?.name || 'Report';

        setBatchProgress({
          current: i + 1,
          total: totalReports,
          reportName: `Preparing ${reportName}...`,
        });

        try {
          // Find the system template for this report type
          const template = allTemplates.find((t) => t.reportType === reportType && t.isSystem);

          if (!template) {
            logger.error(`No template found for report type: ${reportType}`);
            continue;
          }

          // Store first template's font settings for consistency
          if (i === 0) {
            defaultFontFamily = template.pageSetup.fontStyle?.fontFamily || defaultFontFamily;
            defaultFontSize = template.pageSetup.fontStyle?.fontSize || defaultFontSize;
          }

          logger.info(`Batch export: Rendering ${reportName} using template:`, template.name);

          // Get report data
          const reportData = await getReportData(reportType, currentProjectId);
          const organizedData = organizeReportData(
            reportData,
            template.organization,
            template.columns,
          );

          logger.info(`Batch export: ${reportName} has ${reportData.length} items`);

          // Render the table to HTML using React server-side rendering
          const tableHTML = renderToStaticMarkup(
            <ReportTableRenderer
              columns={template.columns}
              data={organizedData}
              reportType={template.reportType}
              organization={template.organization}
              fontStyle={template.pageSetup.fontStyle}
              editable={false}
            />,
          );

          // Render header from template if available
          let headerHTML = '';
          if (template.headerTemplateId) {
            headerHTML =
              (await renderHeaderHTML(template.headerTemplateId, {
                reportTitle: template.name,
                productionName: projectName,
                ldName: projectData?.lighting_designer || '',
                venue: projectData?.venue || '',
                date: new Date().toLocaleDateString(),
              })) || '';
          }

          // Calculate data range for footer
          const dataRange = calculateDataRange(reportType, reportData);
          const userName = 'User'; // TODO: Get from user preferences/settings

          // Render footer
          const footerHTML = renderFooterHTML(userName, dataRange);

          // Create report section with wrapper table for repeating headers
          const reportSection = `
            <section class="report-section">
              <table class="report-wrapper">
                <thead>
                  <tr>
                    <td>
                      ${headerHTML}
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      ${tableHTML}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          `;

          reportSections.push(reportSection);
        } catch (error) {
          logger.error(`Error rendering ${reportName}:`, error);
        }
      }

      if (reportSections.length === 0) {
        alert('No reports were successfully generated');
        return;
      }

      // Update progress for export
      setBatchProgress({
        current: totalReports,
        total: totalReports,
        reportName: 'Generating PDF...',
      });

      // Combine all sections into a single HTML document
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Batch Export - ${projectName}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: ${defaultFontFamily};
                font-size: ${defaultFontSize}pt;
                line-height: 1.2;
                color: #000;
                background: white;
                padding: ${pageSetup.marginTop}in ${pageSetup.marginRight}in ${pageSetup.marginBottom}in ${pageSetup.marginLeft}in;
              }

              /* Report section styling */
              .report-section {
                page-break-before: always;
                counter-reset: page 1; /* Reset page counter for each report */
              }

              .report-section:first-child {
                page-break-before: avoid; /* Don't break before first report */
              }

              /* Wrapper table for repeating headers */
              .report-wrapper {
                width: 100%;
                border-collapse: collapse;
              }

              .report-wrapper thead {
                display: table-header-group; /* Ensures thead repeats on each page */
              }

              .report-wrapper tbody {
                display: table-row-group;
              }

              .report-wrapper td {
                border: none;
                padding: 0;
                vertical-align: top;
              }

              h1 {
                font-size: 20pt;
                margin-bottom: 8pt;
                color: #1f2937;
              }

              .report-meta {
                margin-bottom: 12pt;
                color: #6b7280;
                font-size: ${defaultFontSize}pt;
              }

              /* Data table styling */
              table.data-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1rem;
              }

              table.data-table th,
              table.data-table td {
                padding: 8px;
                text-align: left;
                border-left: none;
                border-right: none;
              }

              table.data-table th {
                background-color: transparent;
                font-weight: bold;
                font-size: ${defaultFontSize + 1}pt;
                border-top: 2px solid #9ca3af;
                border-bottom: 2px solid #9ca3af;
              }

              table.data-table td {
                font-size: ${defaultFontSize}pt;
                border-top: 1px solid #d1d5db;
                border-bottom: 1px solid #d1d5db;
              }

              h3 {
                color: #2563eb;
                margin-top: 20px;
                margin-bottom: 16px;
                font-size: 14pt;
              }

              @media print {
                body {
                  margin: 0;
                  padding: ${pageSetup.marginTop}in ${pageSetup.marginRight}in ${pageSetup.marginBottom}in ${pageSetup.marginLeft}in;
                }

                .report-section {
                  page-break-before: always;
                }

                .report-section:first-child {
                  page-break-before: avoid;
                }

                .report-wrapper thead {
                  display: table-header-group;
                }
              }

              /* Page counter for each report section */
              @page {
                @bottom-center {
                  content: counter(page);
                }
              }
            </style>
          </head>
          <body>
            ${reportSections.join('\n')}
          </body>
        </html>
      `;

      const filename = `${projectName}_Batch_Export_${new Date().toISOString().split('T')[0]}.pdf`;

      const result = await window.api.paperwork.exportPDF(htmlContent, filename, pageSetup);

      if (result.success) {
        alert(`Successfully exported ${reportSections.length} reports to a single PDF`);
        logger.info('Batch export: Successfully created combined PDF');
      } else {
        alert('Batch export failed');
      }
    } catch (error) {
      logger.error('Batch export error:', error);
      alert('Batch export failed');
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress({ current: 0, total: 0, reportName: '' });
    }
  }, [selectedReportsForBatch, currentProjectId, projectName, pageSetup]);

  // Toggle batch selection
  const toggleBatchSelection = useCallback((reportType: ReportType) => {
    setSelectedReportsForBatch((prev) => {
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
      {/* Main Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PaperworkEditor
          reportType={selectedReport}
          projectId={currentProjectId}
          onExport={handleExportPDF}
          onBatchExport={() => {
            logger.info('Batch Export clicked from editor toolbar');
            setShowBatchExport(true);
          }}
          onHeaderDesign={(template) => {
            setCurrentTemplate(template);
            setShowHeaderDesigner(true);
          }}
          onReportTypeChange={setSelectedReport}
        />
      </div>

      {/* Header Designer Modal */}
      {showHeaderDesigner && currentTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50">
          <PaperworkHeaderDesigner
            projectId={currentProjectId}
            reportType={currentTemplate.reportType}
            headerTemplateId={currentTemplate.headerTemplateId}
            onSave={async (headerTemplateId: string) => {
              // Save the header template ID to the paperwork template
              // Skip for system templates - they already reference default-paperwork-header
              try {
                logger.info('Header template saved:', headerTemplateId);

                // Only update the paperwork template if it's NOT a system template
                if (!currentTemplate.isSystem) {
                  logger.info(
                    'Updating paperwork template:',
                    currentTemplate.id,
                    'with header:',
                    headerTemplateId,
                  );
                  await window.api.paperworkTemplates.update(currentTemplate.id, {
                    headerTemplateId,
                  });
                  logger.info('Header template ID saved to paperwork template');
                } else {
                  logger.info(
                    'Skipping paperwork template update (system template) - header changes saved',
                  );
                }

                setShowHeaderDesigner(false);
              } catch (error) {
                logger.error('Failed to save header template:', error);
                alert('Failed to save header template');
              }
            }}
            onCancel={() => setShowHeaderDesigner(false)}
          />
        </div>
      )}

      {/* Batch Export Dialog */}
      {showBatchExport && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-8"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">Batch Export Reports</h2>
              <p className="text-sm text-gray-400 mt-1">Select reports to export as PDFs</p>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {REPORT_TEMPLATES.map((template) => (
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
                    <span className="flex-1">{template.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedReportsForBatch.size} report{selectedReportsForBatch.size !== 1 ? 's' : ''}{' '}
                selected
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
                  Export {selectedReportsForBatch.size} Report
                  {selectedReportsForBatch.size !== 1 ? 's' : ''}
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
            <h3 className="text-xl font-bold mb-2">Exporting Reports...</h3>
            <p className="text-gray-400 mb-4">{batchProgress.reportName}</p>
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
