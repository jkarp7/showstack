import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFixtureStore } from '../../store/fixtureStore';
import { Fixture } from '../../types';

type ReportType = 'channel-hookup' | 'dimmer-schedule' | 'circuit-list' | 'dmx-addresses' |
                  'power-summary' | 'color-schedule' | 'gobo-schedule';
type PageSize = 'letter' | 'legal' | 'a4' | 'tabloid';
type Orientation = 'portrait' | 'landscape';
type ColorMode = 'color' | 'bw';

interface PageSetup {
  size: PageSize;
  orientation: Orientation;
  colorMode: ColorMode;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

interface MetadataOptions {
  showVenue: boolean;
  showDates: boolean;
  showDesigners: boolean;
  showProductionStaff: boolean;
  showProjectName: boolean;
  showPageNumbers: boolean;
  showGeneratedDate: boolean;
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  reportType: ReportType;
  pageSetup: PageSetup;
  metadata: MetadataOptions;
  created: number;
  updated: number;
}

interface ReportTemplate {
  id: ReportType;
  name: string;
  description: string;
  icon: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'channel-hookup',
    name: 'Channel Hookup',
    description: 'Complete fixture list with channel assignments, dimmers, and circuits',
    icon: '📊'
  },
  {
    id: 'dimmer-schedule',
    name: 'Dimmer Schedule',
    description: 'List fixtures organized by dimmer assignment',
    icon: '⚡'
  },
  {
    id: 'circuit-list',
    name: 'Circuit List',
    description: 'List fixtures by circuit number and location',
    icon: '🔌'
  },
  {
    id: 'dmx-addresses',
    name: 'DMX Address List',
    description: 'All DMX addresses with universe and fixture information',
    icon: '🎛️'
  },
  {
    id: 'color-schedule',
    name: 'Color Schedule',
    description: 'Calculate gel requirements by color and fixture size',
    icon: '🎨'
  },
  {
    id: 'gobo-schedule',
    name: 'Gobo Schedule',
    description: 'List fixtures grouped by gobo/template',
    icon: '🎭'
  },
  {
    id: 'power-summary',
    name: 'Power Summary',
    description: 'Calculate total power consumption and requirements',
    icon: '⚙️'
  }
];

const PAGE_SIZES = {
  letter: { name: 'Letter (8.5" × 11")', width: 8.5, height: 11 },
  legal: { name: 'Legal (8.5" × 14")', width: 8.5, height: 14 },
  a4: { name: 'A4 (210mm × 297mm)', width: 8.27, height: 11.69 },
  tabloid: { name: 'Tabloid (11" × 17")', width: 11, height: 17 }
};

const DEFAULT_PAGE_SETUP: PageSetup = {
  size: 'letter',
  orientation: 'portrait',
  colorMode: 'color',
  marginTop: 0.75,
  marginBottom: 0.75,
  marginLeft: 0.75,
  marginRight: 0.75
};

const DEFAULT_METADATA: MetadataOptions = {
  showVenue: true,
  showDates: true,
  showDesigners: true,
  showProductionStaff: false,
  showProjectName: true,
  showPageNumbers: true,
  showGeneratedDate: true
};

interface PaperworkProps {
  embedded?: boolean;
}

export function Paperwork({ embedded = false }: PaperworkProps = {}) {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const currentProjectId = routeProjectId || 'default-project';
  const { fixtures, loadFixtures } = useFixtureStore();
  const [selectedReport, setSelectedReport] = useState<ReportType>('channel-hookup');
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const [projectData, setProjectData] = useState<any>(null);

  // Page setup and metadata
  const [pageSetup, setPageSetup] = useState<PageSetup>(DEFAULT_PAGE_SETUP);
  const [metadata, setMetadata] = useState<MetadataOptions>(DEFAULT_METADATA);
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [showMetadataOptions, setShowMetadataOptions] = useState(false);

  // Custom reports
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [currentReport, setCurrentReport] = useState<CustomReport | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveReportName, setSaveReportName] = useState('');
  const [saveReportDescription, setSaveReportDescription] = useState('');

  // Power calculation voltage
  const [voltage, setVoltage] = useState<number>(120);

  // Load fixtures, project info, and custom reports
  useEffect(() => {
    loadFixtures();

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

    const loadCustomReports = () => {
      try {
        const stored = localStorage.getItem(`showstack_customReports_${currentProjectId}`);
        if (stored) {
          const reports = JSON.parse(stored) as CustomReport[];
          setCustomReports(reports);
        }
      } catch (error) {
        console.error('Failed to load custom reports:', error);
      }
    };

    loadProjectInfo();
    loadCustomReports();
  }, [loadFixtures, currentProjectId]);

  // Helper function to determine gel size and cuts per sheet based on fixture type
  const getGelInfo = (fixtureType: string): { size: string; cutsPerSheet: number } => {
    const type = fixtureType.toLowerCase();

    // Par16 "Birdie" - 2-7/8x2-7/8 - 30 cuts
    if (type.includes('par16') || type.includes('birdie')) {
      return { size: '2-7/8" × 2-7/8"', cutsPerSheet: 30 };
    }

    // 3" Fresnel "Inky" - 3-1/4x3-1/4 - 30 cuts
    if (type.includes('inky') || (type.includes('3') && type.includes('fresnel'))) {
      return { size: '3-1/4" × 3-1/4"', cutsPerSheet: 30 };
    }

    // Source 4 5° / XDLT 10° - 14x14 - 1 cut
    if ((type.includes('source') && type.includes('5')) ||
        (type.includes('s4') && type.includes('5')) ||
        (type.includes('xdlt') && type.includes('10'))) {
      return { size: '14" × 14"', cutsPerSheet: 1 };
    }

    // XDLT 5° - 17-1/2x17-1/2 - 1 cut
    if (type.includes('xdlt') && type.includes('5')) {
      return { size: '17-1/2" × 17-1/2"', cutsPerSheet: 1 };
    }

    // Source 4 10° - 12x12 - 2 cuts
    if ((type.includes('source') && type.includes('10')) ||
        (type.includes('s4') && type.includes('10'))) {
      return { size: '12" × 12"', cutsPerSheet: 2 };
    }

    // PAR 64 / 8" Fresnel / XDLT 14° + 19° - 10x10 - 4 cuts
    if (type.includes('par') && type.includes('64') ||
        (type.includes('8') && type.includes('fresnel')) ||
        (type.includes('xdlt') && (type.includes('14') || type.includes('19')))) {
      return { size: '10" × 10"', cutsPerSheet: 4 };
    }

    // Source 4 PAR / XDLT 26° + 36° + 50° + 70° - 7.5x7.5 - 6 cuts
    if ((type.includes('source') || type.includes('s4') || type.includes('xdlt')) &&
        (type.includes('par') || type.includes('26') || type.includes('36') ||
         type.includes('50') || type.includes('70'))) {
      return { size: '7-1/2" × 7-1/2"', cutsPerSheet: 6 };
    }

    // Source 4 (standard) - 6.25x6.25 - 9 cuts
    if (type.includes('source') || type.includes('s4') || type.includes('eos')) {
      return { size: '6-1/4" × 6-1/4"', cutsPerSheet: 9 };
    }

    // Default - assume medium fixture (6.25x6.25) - 9 cuts
    return { size: '6-1/4" × 6-1/4" (estimated)', cutsPerSheet: 9 };
  };

  // Sort fixtures by position for reports
  const sortedFixtures = useMemo(() => {
    return [...fixtures].sort((a, b) => {
      const aPos = a.position || '';
      const bPos = b.position || '';
      return aPos.localeCompare(bPos);
    });
  }, [fixtures]);

  // Generate Channel Hookup data
  const channelHookupData = useMemo(() => {
    return sortedFixtures.map(fixture => ({
      channel: fixture.channel || '-',
      dimmer: fixture.dimmer || '-',
      position: fixture.position || '-',
      unit: fixture.unit || '-',
      type: fixture.type || '-',
      wattage: fixture.wattage || '-',
      purpose: fixture.purpose || '-',
      color: fixture.color || '-',
      notes: fixture.notes || '-'
    }));
  }, [sortedFixtures]);

  // Generate Dimmer Schedule data
  const dimmerScheduleData = useMemo(() => {
    const grouped = fixtures.reduce((acc, fixture) => {
      const dimmer = fixture.dimmer || 'Unassigned';
      if (!acc[dimmer]) acc[dimmer] = [];
      acc[dimmer].push(fixture);
      return acc;
    }, {} as Record<string, Fixture[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dimmer, fixtures]) => ({
        dimmer,
        fixtures: fixtures.map(f => ({
          channel: f.channel || '-',
          position: f.position || '-',
          unit: f.unit || '-',
          type: f.type || '-',
          wattage: f.wattage || '-',
          purpose: f.purpose || '-',
          color: f.color || '-',
          notes: f.notes || '-'
        }))
      }));
  }, [fixtures]);

  // Generate Circuit List data
  const circuitListData = useMemo(() => {
    const grouped = fixtures.reduce((acc, fixture) => {
      const circuit = fixture.circuit_number || fixture.circuit || 'Unassigned';
      if (!acc[circuit]) acc[circuit] = [];
      acc[circuit].push(fixture);
      return acc;
    }, {} as Record<string, Fixture[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([circuit, fixtures]) => ({
        circuit,
        fixtures: fixtures.map(f => ({
          dimmer: f.dimmer || '-',
          channel: f.channel || '-',
          position: f.position || '-',
          unit: f.unit || '-',
          type: f.type || '-',
          wattage: f.wattage || '-',
          purpose: f.purpose || '-',
          color: f.color || '-',
          notes: f.notes || '-'
        }))
      }));
  }, [fixtures]);

  // Generate DMX Address List data
  const dmxAddressData = useMemo(() => {
    return fixtures
      .filter(f => f.universe || f.dmx_address)
      .sort((a, b) => {
        const aUni = a.universe || 0;
        const bUni = b.universe || 0;
        if (aUni !== bUni) return aUni - bUni;
        const aAddr = a.dmx_address || 0;
        const bAddr = b.dmx_address || 0;
        return aAddr - bAddr;
      })
      .map(fixture => ({
        address: fixture.universe && fixture.dmx_address
          ? `${fixture.universe}/${fixture.dmx_address}`
          : (fixture.dmx_address || '-'),
        channel: fixture.channel || '-',
        dimmer: fixture.dimmer || '-',
        position: fixture.position || '-',
        unit: fixture.unit || '-',
        type: fixture.type || '-',
        wattage: fixture.wattage || '-',
        purpose: fixture.purpose || '-',
        color: fixture.color || '-',
        notes: fixture.notes || '-'
      }));
  }, [fixtures]);

  // Generate Color Schedule data (gel calculations with real size-based calculations)
  const colorScheduleData = useMemo(() => {
    // Group by color and gel size
    const grouped = fixtures.reduce((acc, fixture) => {
      const color = fixture.color || 'No Color';
      if (color === 'No Color') return acc;

      const gelInfo = getGelInfo(fixture.type || '');
      const key = `${color}|||${gelInfo.size}|||${gelInfo.cutsPerSheet}`;

      if (!acc[key]) {
        acc[key] = {
          color,
          size: gelInfo.size,
          cutsPerSheet: gelInfo.cutsPerSheet,
          count: 0
        };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, { color: string; size: string; cutsPerSheet: number; count: number }>);

    return Object.values(grouped)
      .sort((a, b) => {
        // Sort by color first, then by size
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        return a.size.localeCompare(b.size);
      })
      .map(item => ({
        color: item.color,
        size: item.size,
        cuts: item.count,
        sheets: Math.ceil(item.count / item.cutsPerSheet)
      }));
  }, [fixtures]);

  // Generate Gobo Schedule data (gobo inventory)
  const goboScheduleData = useMemo(() => {
    const grouped = fixtures.reduce((acc, fixture) => {
      const gobo = fixture.gobo || 'No Gobo';
      if (!acc[gobo]) {
        acc[gobo] = {
          count: 0,
          size: fixture.type || '-' // Using fixture type as proxy for gobo size
        };
      }
      acc[gobo].count++;
      return acc;
    }, {} as Record<string, { count: number; size: string }>);

    return Object.entries(grouped)
      .filter(([gobo]) => gobo !== 'No Gobo') // Exclude fixtures with no gobo
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([gobo, data]) => ({
        gobo,
        count: data.count,
        size: data.size
      }));
  }, [fixtures]);

  // Generate Power Summary data
  const powerSummaryData = useMemo(() => {
    const totalWattage = fixtures.reduce((sum, f) => sum + (f.wattage || 0), 0);
    const totalAmperage = totalWattage / voltage;
    const fixturesByWattage = fixtures
      .filter(f => f.wattage)
      .reduce((acc, f) => {
        const wattage = f.wattage!.toString();
        acc[wattage] = (acc[wattage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalFixtures: fixtures.length,
      totalWattage: totalWattage.toFixed(0),
      totalAmperage: totalAmperage.toFixed(2),
      voltage,
      breakdown: Object.entries(fixturesByWattage)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([wattage, count]) => ({
          wattage,
          count,
          totalWattage: (Number(wattage) * count).toFixed(0)
        }))
    };
  }, [fixtures, voltage]);

  const handleSaveReport = () => {
    const report: CustomReport = {
      id: currentReport?.id || `report-${Date.now()}`,
      name: saveReportName,
      description: saveReportDescription,
      reportType: selectedReport,
      pageSetup,
      metadata,
      created: currentReport?.created || Date.now(),
      updated: Date.now()
    };

    const updatedReports = currentReport
      ? customReports.map(r => r.id === report.id ? report : r)
      : [...customReports, report];

    setCustomReports(updatedReports);
    localStorage.setItem(`showstack_customReports_${currentProjectId}`, JSON.stringify(updatedReports));

    setCurrentReport(report);
    setShowSaveDialog(false);
    setSaveReportName('');
    setSaveReportDescription('');
  };

  const handleLoadReport = (report: CustomReport) => {
    setCurrentReport(report);
    setSelectedReport(report.reportType);
    setPageSetup(report.pageSetup);
    setMetadata(report.metadata);
    setShowLoadDialog(false);
  };

  const handleDeleteReport = (reportId: string) => {
    if (!confirm('Delete this custom report?')) return;
    const updatedReports = customReports.filter(r => r.id !== reportId);
    setCustomReports(updatedReports);
    localStorage.setItem(`showstack_customReports_${currentProjectId}`, JSON.stringify(updatedReports));
    if (currentReport?.id === reportId) setCurrentReport(null);
  };

  const handleExportPDF = async () => {
    if (!window.api?.paperwork) {
      alert('PDF export is not available');
      return;
    }

    try {
      const reportName = REPORT_TEMPLATES.find(t => t.id === selectedReport)?.name || 'Report';

      // Get the rendered HTML content
      const reportElement = document.querySelector('.report-content');
      if (!reportElement) {
        alert('Report content not found');
        return;
      }

      // Create a complete HTML document with styles
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${reportName} - ${projectName}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                color: #1f2937;
                background: white;
                padding: ${pageSetup.marginTop}in ${pageSetup.marginRight}in ${pageSetup.marginBottom}in ${pageSetup.marginLeft}in;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1rem;
              }
              th, td {
                padding: 0.5rem;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
              }
              th {
                background-color: #f3f4f6;
                font-weight: 600;
              }
              h1 {
                font-size: 1.5rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
              }
              h2 {
                font-size: 1.25rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
              }
              h3 {
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 0.75rem;
                color: #3b82f6;
              }
              p {
                margin-bottom: 0.5rem;
              }
              .grid {
                display: grid;
                gap: 1rem;
              }
              .card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 0.5rem;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
              }
              @media print {
                body { margin: 0; padding: ${pageSetup.marginTop}in ${pageSetup.marginRight}in ${pageSetup.marginBottom}in ${pageSetup.marginLeft}in; }
                .card { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            ${reportElement.innerHTML}
          </body>
        </html>
      `;

      const filename = `${projectName}_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      const result = await window.api.paperwork.exportPDF(htmlContent, filename, pageSetup);

      if (result.success) {
        alert(`PDF exported successfully to:\n${result.filePath}`);
      } else if (!result.canceled) {
        alert('Failed to export PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('An error occurred while exporting PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Gel color database (common theatrical gels)
  const gelColors: Record<string, string> = {
    // Roscolux
    'R02': '#FFA885', 'R08': '#F9D5AA', 'R09': '#FFE5CC', 'R17': '#FFD4CC',
    'R19': '#FF9980', 'R20': '#FFCC99', 'R23': '#FF9966', 'R26': '#FF6633',
    'R33': '#FF3300', 'R43': '#FFC299', 'R51': '#FFDD99', 'R54': '#FFE5B3',
    'R79': '#5599FF', 'R80': '#6699FF', 'R83': '#4D88FF', 'R92': '#FFCCFF',
    'R99': '#FFE6E6', 'R119': '#3366CC', 'R132': '#FFE6CC', 'R161': '#99CCFF',
    'R337': '#FFD4CC', 'R350': '#CCCCFF', 'R358': '#FFE5E5', 'R359': '#FFEEFF',
    'R360': '#FFCCCC',
    // GAM
    'G100': '#FFE5CC', 'G150': '#FFD4B3', 'G180': '#FFB366', 'G205': '#FFCC99',
    'G235': '#FF9980', 'G250': '#FF6633', 'G280': '#FF3300', 'G330': '#5599FF',
    'G350': '#CCCCFF', 'G370': '#99CCFF', 'G385': '#6699FF', 'G395': '#FFD4CC',
    'G470': '#FFCCFF', 'G480': '#FFE6E6', 'G490': '#FFEEFF', 'G530': '#66FF66',
    'G570': '#FFFF66', 'G590': '#FF66CC', 'G640': '#3366CC', 'G720': '#99FFFF',
    'G750': '#CCFF99', 'G860': '#FFCCCC', 'G890': '#FFE5E5', 'G940': '#CCCCCC',
    // Lee
    'L101': '#FFEECC', 'L102': '#FFDDAA', 'L103': '#FFE5CC', 'L104': '#FFEEDD',
    'L105': '#FFD4B3', 'L106': '#FF9966', 'L107': '#FFB380', 'L108': '#FFCC99',
    'L109': '#FFC299', 'L110': '#FF9980', 'L111': '#FF8866', 'L115': '#6699FF',
    'L116': '#5588EE', 'L117': '#99BBFF', 'L118': '#3366CC', 'L119': '#3355BB',
    'L120': '#4477DD', 'L126': '#FFE5E5', 'L127': '#FFD4D4', 'L128': '#FFC2C2',
    'L132': '#FFE6CC', 'L135': '#FFB3CC', 'L136': '#FFCCFF', 'L137': '#FF99DD',
    'L147': '#FFE5CC', 'L148': '#FFDDAA', 'L152': '#FFE5CC', 'L154': '#FFD4CC',
    'L157': '#FFE5E5', 'L158': '#FFCCDD', 'L161': '#99CCFF', 'L162': '#BBDDFF',
    'L164': '#FFCCCC', 'L170': '#FFE6E6', 'L172': '#CCCCFF', 'L174': '#CCBBFF',
    'L176': '#FFD4CC', 'L179': '#FFCC99', 'L180': '#FFB366', 'L181': '#FFDDCC',
    'L182': '#FFE5DD', 'L192': '#FFCCCC', 'L194': '#FFE5CC', 'L195': '#FF9980',
    'L196': '#FFB399', 'L197': '#FFE6E6', 'L200': '#FFEECC', 'L201': '#FFEEDD',
    'L202': '#FFDDAA', 'L203': '#FFE5CC', 'L204': '#FFEEDD', 'L205': '#FFD4CC',
    'L206': '#FFCCAA', 'L223': '#FF3300', 'L224': '#FFE5CC', 'L225': '#FFDDBB',
    'L226': '#FFE6DD', 'L236': '#FF9980', 'L247': '#FF6633', 'L248': '#FFCC99',
    'L254': '#FFE5E5', 'L270': '#FFCCCC', 'L271': '#FFD4D4', 'L285': '#FFE5CC',
    'L328': '#FFEEFF', 'L353': '#FFE5E5', 'L363': '#FFCCCC', 'L778': '#66FF66',
    'L790': '#FFFF66',
  };

  // Helper function to render color with swatch
  const renderColorCell = (color: string) => {
    if (color === '-' || !color) return <td className="px-3 py-2">-</td>;

    // Parse gel color (supports R80, L201, G100, 80, etc.)
    let gelCode = color.trim().toUpperCase();

    // Add prefix if just a number
    if (/^\d+$/.test(gelCode)) {
      // Try common prefixes
      gelCode = 'R' + gelCode; // Default to Roscolux
    }

    // Check if it's a known gel color
    const gelColor = gelColors[gelCode];

    return (
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-gray-400 flex-shrink-0"
            style={{
              backgroundColor: gelColor || '#ddd',
              borderColor: '#999'
            }}
            title={gelColor ? `${color} (${gelColor})` : color}
          />
          <span>{color}</span>
        </div>
      </td>
    );
  };

  const renderMetadataHeader = () => {
    if (!projectData) return null;

    return (
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border-b-2 border-gray-600 print:bg-white print:border-black">
        {metadata.showProjectName && (
          <h1 className="text-2xl font-bold mb-2">{projectName}</h1>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {metadata.showVenue && projectData.venue && (
            <div><span className="text-gray-600 dark:text-gray-400">Venue:</span> {projectData.venue}</div>
          )}
          {metadata.showDesigners && projectData.lighting_designer && (
            <div><span className="text-gray-600 dark:text-gray-400">Lighting Designer:</span> {projectData.lighting_designer}</div>
          )}
          {metadata.showGeneratedDate && (
            <div><span className="text-gray-600 dark:text-gray-400">Generated:</span> {new Date().toLocaleDateString()}</div>
          )}
        </div>
      </div>
    );
  };

  const renderReport = () => {
    switch (selectedReport) {
      case 'channel-hookup':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Chan</th>
                  <th className="px-3 py-2 text-left">Dim</th>
                  <th className="px-3 py-2 text-left">Position</th>
                  <th className="px-3 py-2 text-left">Unit #</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Watt</th>
                  <th className="px-3 py-2 text-left">Purpose</th>
                  <th className="px-3 py-2 text-left">Color</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {channelHookupData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-white dark:bg-gray-800">
                    <td className="px-3 py-2">{row.channel}</td>
                    <td className="px-3 py-2">{row.dimmer}</td>
                    <td className="px-3 py-2">{row.position}</td>
                    <td className="px-3 py-2">{row.unit}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.wattage}</td>
                    <td className="px-3 py-2">{row.purpose}</td>
                    {renderColorCell(row.color)}
                    <td className="px-3 py-2">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'dimmer-schedule':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Dim</th>
                  <th className="px-3 py-2 text-left">Chan</th>
                  <th className="px-3 py-2 text-left">Position</th>
                  <th className="px-3 py-2 text-left">Unit #</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Watt</th>
                  <th className="px-3 py-2 text-left">Purpose</th>
                  <th className="px-3 py-2 text-left">Color</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {dimmerScheduleData.flatMap((group, i) =>
                  group.fixtures.map((fixture, j) => (
                    <tr key={`${i}-${j}`} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-3 py-2">{j === 0 ? group.dimmer : '""'}</td>
                      <td className="px-3 py-2">{fixture.channel}</td>
                      <td className="px-3 py-2">{fixture.position}</td>
                      <td className="px-3 py-2">{fixture.unit}</td>
                      <td className="px-3 py-2">{fixture.type}</td>
                      <td className="px-3 py-2">{fixture.wattage}</td>
                      <td className="px-3 py-2">{fixture.purpose}</td>
                      {renderColorCell(fixture.color)}
                      <td className="px-3 py-2">{fixture.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );

      case 'circuit-list':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Circuit</th>
                  <th className="px-3 py-2 text-left">Dim</th>
                  <th className="px-3 py-2 text-left">Chan</th>
                  <th className="px-3 py-2 text-left">Position</th>
                  <th className="px-3 py-2 text-left">Unit #</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Watt</th>
                  <th className="px-3 py-2 text-left">Purpose</th>
                  <th className="px-3 py-2 text-left">Color</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {circuitListData.flatMap((group, i) =>
                  group.fixtures.map((fixture, j) => (
                    <tr key={`${i}-${j}`} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-3 py-2">{j === 0 ? group.circuit : '""'}</td>
                      <td className="px-3 py-2">{fixture.dimmer}</td>
                      <td className="px-3 py-2">{fixture.channel}</td>
                      <td className="px-3 py-2">{fixture.position}</td>
                      <td className="px-3 py-2">{fixture.unit}</td>
                      <td className="px-3 py-2">{fixture.type}</td>
                      <td className="px-3 py-2">{fixture.wattage}</td>
                      <td className="px-3 py-2">{fixture.purpose}</td>
                      {renderColorCell(fixture.color)}
                      <td className="px-3 py-2">{fixture.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );

      case 'dmx-addresses':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Address</th>
                  <th className="px-3 py-2 text-left">Chan</th>
                  <th className="px-3 py-2 text-left">Dim</th>
                  <th className="px-3 py-2 text-left">Position</th>
                  <th className="px-3 py-2 text-left">Unit #</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Watt</th>
                  <th className="px-3 py-2 text-left">Purpose</th>
                  <th className="px-3 py-2 text-left">Color</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {dmxAddressData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-white dark:bg-gray-800">
                    <td className="px-3 py-2">{row.address}</td>
                    <td className="px-3 py-2">{row.channel}</td>
                    <td className="px-3 py-2">{row.dimmer}</td>
                    <td className="px-3 py-2">{row.position}</td>
                    <td className="px-3 py-2">{row.unit}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.wattage}</td>
                    <td className="px-3 py-2">{row.purpose}</td>
                    {renderColorCell(row.color)}
                    <td className="px-3 py-2">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'color-schedule':
        // Calculate totals by color
        const colorTotals = colorScheduleData.reduce((acc, row) => {
          if (!acc[row.color]) acc[row.color] = 0;
          acc[row.color] += row.sheets;
          return acc;
        }, {} as Record<string, number>);

        return (
          <div className="space-y-6">
            {/* Detailed breakdown by size */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Gel Requirements - Detailed Breakdown</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-200 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Color</th>
                    <th className="px-3 py-2 text-left">Gel Size</th>
                    <th className="px-3 py-2 text-left">Cuts Needed</th>
                    <th className="px-3 py-2 text-left">Sheets Required</th>
                  </tr>
                </thead>
                <tbody>
                  {colorScheduleData.map((row, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-750">
                      <td className="px-3 py-2 font-medium">{row.color}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.size}</td>
                      <td className="px-3 py-2">{row.cuts}</td>
                      <td className="px-3 py-2">{row.sheets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
                * Calculations based on actual color frame sizes for fixture types
              </div>
            </div>

            {/* Summary by color */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Total Sheets by Color</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-200 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Color</th>
                    <th className="px-3 py-2 text-left">Total Sheets</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(colorTotals)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([color, sheets], i) => (
                      <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-750">
                        <td className="px-3 py-2 font-medium">{color}</td>
                        <td className="px-3 py-2 font-bold text-yellow-400">{sheets}</td>
                      </tr>
                    ))}
                  <tr className="bg-gray-200 dark:bg-gray-700 font-bold">
                    <td className="px-3 py-2">TOTAL</td>
                    <td className="px-3 py-2 text-yellow-400">
                      {Object.values(colorTotals).reduce((sum, n) => sum + n, 0)} sheets
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'gobo-schedule':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Gobo Requirements</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-200 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Gobo/Template</th>
                  <th className="px-3 py-2 text-left">Quantity Needed</th>
                  <th className="px-3 py-2 text-left">Size</th>
                </tr>
              </thead>
              <tbody>
                {goboScheduleData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-750">
                    <td className="px-3 py-2 font-medium">{row.gobo}</td>
                    <td className="px-3 py-2">{row.count}</td>
                    <td className="px-3 py-2">{row.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
              * Size based on fixture type
            </div>
          </div>
        );

      case 'power-summary':
        return (
          <div className="space-y-6">
            {/* Voltage Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">System Voltage:</label>
              <select
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
              >
                <option value={120}>120V (US Standard)</option>
                <option value={208}>208V (US 3-Phase)</option>
                <option value={220}>220V (International)</option>
                <option value={230}>230V (EU Standard)</option>
                <option value={240}>240V (UK/AU Standard)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Fixtures</div>
                <div className="text-3xl font-bold text-blue-400">{powerSummaryData.totalFixtures}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Wattage</div>
                <div className="text-3xl font-bold text-yellow-400">{powerSummaryData.totalWattage}W</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Amperage ({voltage}V)</div>
                <div className="text-3xl font-bold text-red-400">{powerSummaryData.totalAmperage}A</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Power Breakdown by Wattage</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-200 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Wattage</th>
                    <th className="px-3 py-2 text-left">Count</th>
                    <th className="px-3 py-2 text-left">Total Wattage</th>
                  </tr>
                </thead>
                <tbody>
                  {powerSummaryData.breakdown.map((row, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-3 py-2">{row.wattage}W</td>
                      <td className="px-3 py-2">{row.count}</td>
                      <td className="px-3 py-2">{row.totalWattage}W</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!embedded && (
              <button
                onClick={() => navigate('/modules')}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
              >
                ← Home
              </button>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{projectName}</h1>
                {!embedded && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-lg text-gray-600 dark:text-gray-400">Paperwork Generator</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentReport ? `${currentReport.name} • ` : ''}{fixtures.length} fixtures
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLoadDialog(true)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
            >
              📂 Load Report
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
            >
              💾 Save Report
            </button>
            <button
              onClick={() => setShowPageSetup(true)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
            >
              📄 Page Setup
            </button>
            <button
              onClick={() => setShowMetadataOptions(true)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
            >
              ⚙️ Options
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
            >
              📄 Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* Report Selection */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {REPORT_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedReport(template.id)}
              className={`px-4 py-2 rounded whitespace-nowrap transition flex items-center gap-2 ${
                selectedReport === template.id
                  ? 'bg-blue-600 text-gray-900 dark:text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span>{template.icon}</span>
              <span>{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Report Description */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {REPORT_TEMPLATES.find(t => t.id === selectedReport)?.description}
        </p>
        <div className="text-xs text-gray-500">
          {PAGE_SIZES[pageSetup.size].name} • {pageSetup.orientation} • {pageSetup.colorMode === 'color' ? 'Color' : 'B&W'}
        </div>
      </div>

      {/* Main Content - Report Display */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto report-content">
          {renderMetadataHeader()}
          {renderReport()}
        </div>
      </main>

      {/* Page Setup Dialog */}
      {showPageSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Page Setup</h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Page Size</label>
                <select
                  value={pageSetup.size}
                  onChange={(e) => setPageSetup({ ...pageSetup, size: e.target.value as PageSize })}
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                >
                  {Object.entries(PAGE_SIZES).map(([key, info]) => (
                    <option key={key} value={key}>{info.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Orientation</label>
                <select
                  value={pageSetup.orientation}
                  onChange={(e) => setPageSetup({ ...pageSetup, orientation: e.target.value as Orientation })}
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color Mode</label>
                <select
                  value={pageSetup.colorMode}
                  onChange={(e) => setPageSetup({ ...pageSetup, colorMode: e.target.value as ColorMode })}
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                >
                  <option value="color">Color</option>
                  <option value="bw">Black & White</option>
                </select>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Margins (inches)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Top</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={pageSetup.marginTop}
                    onChange={(e) => setPageSetup({ ...pageSetup, marginTop: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Bottom</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={pageSetup.marginBottom}
                    onChange={(e) => setPageSetup({ ...pageSetup, marginBottom: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Left</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={pageSetup.marginLeft}
                    onChange={(e) => setPageSetup({ ...pageSetup, marginLeft: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Right</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={pageSetup.marginRight}
                    onChange={(e) => setPageSetup({ ...pageSetup, marginRight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowPageSetup(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Options Dialog */}
      {showMetadataOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Report Options</h2>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadata.showProjectName}
                  onChange={(e) => setMetadata({ ...metadata, showProjectName: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show Project Name</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadata.showVenue}
                  onChange={(e) => setMetadata({ ...metadata, showVenue: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show Venue</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadata.showDates}
                  onChange={(e) => setMetadata({ ...metadata, showDates: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show Show Dates</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadata.showDesigners}
                  onChange={(e) => setMetadata({ ...metadata, showDesigners: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show Designers</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadata.showProductionStaff}
                  onChange={(e) => setMetadata({ ...metadata, showProductionStaff: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show Production Staff</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadata.showPageNumbers}
                  onChange={(e) => setMetadata({ ...metadata, showPageNumbers: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show Page Numbers</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadata.showGeneratedDate}
                  onChange={(e) => setMetadata({ ...metadata, showGeneratedDate: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show Generated Date</span>
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowMetadataOptions(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Report Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Save Custom Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Report Name</label>
                <input
                  type="text"
                  value={saveReportName}
                  onChange={(e) => setSaveReportName(e.target.value)}
                  placeholder="My Channel Hookup"
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={saveReportDescription}
                  onChange={(e) => setSaveReportDescription(e.target.value)}
                  placeholder="Description of this report configuration..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Saves: Report type, page setup, and metadata options
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReport}
                  disabled={!saveReportName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50"
                >
                  Save Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Report Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Load Custom Report</h2>
            {customReports.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <p className="mb-4">No saved reports yet</p>
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {customReports.map(report => (
                    <div
                      key={report.id}
                      className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-300 dark:bg-gray-600 transition cursor-pointer group"
                      onClick={() => handleLoadReport(report)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{report.name}</h3>
                          {report.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{report.description}</p>
                          )}
                          <div className="text-xs text-gray-500">
                            {REPORT_TEMPLATES.find(t => t.id === report.reportType)?.name}
                            {' • '}
                            {PAGE_SIZES[report.pageSetup.size].name}
                            {' • '}
                            {new Date(report.updated).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report.id);
                          }}
                          className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowLoadDialog(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>ShowStack:Production - Paperwork Generator</div>
        <div>{customReports.length} saved report{customReports.length !== 1 ? 's' : ''} • v0.1.0-alpha</div>
      </footer>
    </div>
  );
}
