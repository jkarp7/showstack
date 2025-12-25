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
  showLogo: boolean;
  customTitle: string;
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
  colorMode: 'bw',
  marginTop: 0.5,
  marginBottom: 0.5,
  marginLeft: 0.25,
  marginRight: 0.25
};

const DEFAULT_METADATA: MetadataOptions = {
  showVenue: true,
  showDates: true,
  showDesigners: true,
  showProductionStaff: false,
  showProjectName: true,
  showPageNumbers: true,
  showGeneratedDate: true,
  showLogo: false,
  customTitle: ''
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

      // Check if this is a dual color (e.g., "R26+R119")
      const dualColorMatch = color.match(/^([^+]+)\+(.+)$/);

      if (dualColorMatch) {
        // Split dual colors into individual colors
        const [, color1, color2] = dualColorMatch;
        const colors = [color1.trim(), color2.trim()];

        colors.forEach(individualColor => {
          const key = `${individualColor}|||${gelInfo.size}|||${gelInfo.cutsPerSheet}`;

          if (!acc[key]) {
            acc[key] = {
              color: individualColor,
              size: gelInfo.size,
              cutsPerSheet: gelInfo.cutsPerSheet,
              count: 0
            };
          }
          acc[key].count++;
        });
      } else {
        // Single color
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
      }

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

  // Gel color database - Complete GAM, LEE, and Rosco theatrical gels (628 colors)
  // Converted from manufacturer RGB values to hex format
  const gelColors: Record<string, string> = {
    // GAM (G prefix)
    'G105': '#BCFB93', 'G106': '#A5B7CD', 'G107': '#B4FCF7', 'G108': '#FFABA0',
    'G110': '#E921A3', 'G120': '#ED3D95', 'G130': '#F15A9A', 'G140': '#B90DA4',
    'G150': '#C00060', 'G155': '#FBAAD2', 'G160': '#FCA3D1', 'G170': '#FA67B4',
    'G180': '#F91C5E', 'G190': '#FC8DAE', 'G195': '#FD91B7', 'G220': '#CE044B',
    'G235': '#F93548', 'G245': '#D00615', 'G250': '#740010', 'G260': '#FC7C99',
    'G270': '#6F0000', 'G280': '#FF0909', 'G290': '#E61100', 'G305': '#FE96AB',
    'G315': '#FD473E', 'G320': '#FC5525', 'G323': '#FF2020', 'G325': '#FEAD96',
    'G330': '#B6776D', 'G335': '#9F0000', 'G340': '#FED0A7', 'G343': '#701000',
    'G345': '#FF0000', 'G350': '#FC6727', 'G360': '#F0CEB3', 'G363': '#FFDFAF',
    'G364': '#DF9340', 'G365': '#F0CEB3', 'G370': '#705050', 'G375': '#FC7B36',
    'G380': '#7C5245', 'G385': '#FDB488', 'G390': '#362729', 'G420': '#FDCA60',
    'G440': '#FEE8BA', 'G450': '#E69D17', 'G460': '#F8FC52', 'G470': '#EFFF39',
    'G480': '#F5EB1B', 'G510': '#FCF9BA', 'G520': '#C6FFA7', 'G535': '#60FF89',
    'G540': '#91FF5C', 'G570': '#1AE20A', 'G650': '#006A00', 'G655': '#000C00',
    'G660': '#00B304', 'G680': '#26B571', 'G685': '#002C10', 'G690': '#003820',
    'G710': '#3A7661', 'G720': '#77E3FF', 'G725': '#005870', 'G730': '#00667B',
    'G740': '#00A7E6', 'G750': '#0082A8', 'G760': '#226F77', 'G770': '#2F98A4',
    'G780': '#36B0BE', 'G790': '#689DFF', 'G810': '#003EB0', 'G815': '#00346C',
    'G820': '#93B9FF', 'G830': '#DBC6FF', 'G835': '#00005C', 'G840': '#5E00F9',
    'G842': '#008AFF', 'G845': '#000058', 'G847': '#000060', 'G848': '#00006C',
    'G850': '#4000AA', 'G860': '#9859FF', 'G870': '#00D3FF', 'G880': '#5800EC',
    'G882': '#001C48', 'G885': '#0084A0', 'G888': '#001838', 'G890': '#020988',
    'G905': '#00006C', 'G910': '#100064', 'G915': '#0C005C', 'G920': '#F1DBFF',
    'G925': '#00000C', 'G930': '#000010', 'G940': '#071ABE', 'G945': '#45026C',
    'G948': '#0C0020', 'G950': '#410262', 'G960': '#8A04D2', 'G970': '#AF22FB',
    'G980': '#E0AAFD', 'G990': '#69049F', 'G995': '#24001C', 'G1510': '#FFFFFF',
    'G1514': '#C7B8BD', 'G1515': '#A0A090', 'G1516': '#747474', 'G1517': '#646464',
    'G1518': '#101010', 'G1520': '#000078', 'G1523': '#000060', 'G1526': '#001888',
    'G1529': '#1414DC', 'G1532': '#70A0E0', 'G1535': '#6868D9', 'G1540': '#FF0000',
    'G1543': '#E91800', 'G1546': '#D72000', 'G1549': '#5C2000', 'G1552': '#B85804',
    'G1555': '#FC842C', 'G1556': '#3D1E1E', 'G1557': '#1E0808', 'G1558': '#100808',
    'G1560': '#E1E15C', 'G1565': '#FF2100', 'G1570': '#D02F00', 'G1575': '#CA6800',
    'G1580': '#681030', 'G1581': '#680F30', 'G1582': '#FF40EC', 'G1583': '#FF617F',
    'G1584': '#FF81B8', 'G1585': '#3A5008', 'G1587': '#8EAA00', 'G1588': '#82A000',
    'G1589': '#82A000', 'G1590': '#600000',

    // LEE Filters (L prefix)
    'L2': '#FF5BFC', 'L3': '#EDE2FF', 'L4': '#FFBB92', 'L7': '#FFFFB2',
    'L8': '#FF722C', 'L9': '#FFDB82', 'L10': '#F8FF22', 'L13': '#FFDC68',
    'L15': '#FFBA09', 'L17': '#FF963F', 'L19': '#FF3404', 'L20': '#FFA313',
    'L21': '#FF6905', 'L22': '#FF4C01', 'L24': '#FF3F22', 'L25': '#FF5615',
    'L26': '#FF1801', 'L27': '#FF1005', 'L29': '#FF1900', 'L35': '#FFBAD7',
    'L36': '#FF8AB5', 'L46': '#FF1E38', 'L48': '#B63FFF', 'L49': '#AA10FF',
    'L52': '#9170FF', 'L53': '#C2C3FF', 'L58': '#441FFF', 'L61': '#A4C0FF',
    'L63': '#89A9FF', 'L68': '#182DFF', 'L71': '#1300FF', 'L75': '#1D26FF',
    'L79': '#1318FF', 'L85': '#120CFF', 'L88': '#B0FF44', 'L89': '#4DFF53',
    'L90': '#1CFF3E', 'L100': '#E9FF2E', 'L101': '#FFF216', 'L102': '#FFE132',
    'L103': '#FFEDA7', 'L104': '#FFCD13', 'L105': '#FF8303', 'L106': '#FF1F01',
    'L107': '#FF948F', 'L108': '#FFA961', 'L109': '#FFA199', 'L110': '#FF9DC9',
    'L111': '#FF69A3', 'L113': '#FF1E28', 'L115': '#23A2FF', 'L116': '#0987FF',
    'L117': '#77B5FF', 'L118': '#1858FF', 'L119': '#1012FF', 'L120': '#1206FF',
    'L121': '#87FF49', 'L122': '#62FF5F', 'L124': '#1FFF71', 'L126': '#9C0AFF',
    'L127': '#FF6F83', 'L128': '#FF26AB', 'L131': '#4BC1FF', 'L132': '#1128FF',
    'L134': '#FF8F2A', 'L135': '#FF4500', 'L136': '#BA98FF', 'L137': '#685EFF',
    'L138': '#C1FF84', 'L139': '#15FF27', 'L140': '#468AFF', 'L141': '#1146FF',
    'L142': '#4943FF', 'L143': '#3164FF', 'L144': '#3377FF', 'L147': '#FFA241',
    'L148': '#FF3349', 'L151': '#FFC09F', 'L152': '#FFCEA1', 'L153': '#FFB7B5',
    'L154': '#FFCEB8', 'L156': '#FFC46C', 'L157': '#FF695E', 'L158': '#FF6C02',
    'L159': '#FFFCD9', 'L161': '#3252FF', 'L162': '#FFDDB5', 'L164': '#FF3108',
    'L165': '#2448FF', 'L169': '#D7C1FF', 'L170': '#A774FF', 'L172': '#1163FF',
    'L174': '#4F6DFF', 'L176': '#FF9672', 'L179': '#FFA809', 'L180': '#3615FF',
    'L181': '#1A00FF', 'L182': '#FF2302', 'L183': '#124FFF', 'L184': '#FFF1D9',
    'L186': '#FFE0E8', 'L187': '#FFE0C8', 'L188': '#FFEDD3', 'L189': '#FBFFCA',
    'L191': '#EAFDFF', 'L192': '#FF6B94', 'L194': '#7259FF', 'L195': '#130DFF',
    'L196': '#3F66FF', 'L197': '#282FFF', 'L198': '#1A11FF', 'L199': '#411DFF',
    'L200': '#313EFF', 'L201': '#647BFF', 'L202': '#9BB2FF', 'L203': '#C3D3FF',
    'L204': '#FFBF4D', 'L205': '#FFDF8B', 'L206': '#FFEEB7', 'L207': '#FFC148',
    'L208': '#FFBE4B', 'L212': '#FFFFBE', 'L213': '#D5FFD0', 'L217': '#FFFCFA',
    'L218': '#E0EAFF', 'L219': '#74E0FF', 'L221': '#FFFAFB', 'L223': '#FFF6D5',
    'L224': '#7D8CFF', 'L230': '#FFE596', 'L232': '#FFC55C', 'L236': '#FFBD5A',
    'L237': '#FF9955', 'L238': '#FFA994', 'L241': '#71B6FF', 'L242': '#9CFFF2',
    'L243': '#AEFFC7', 'L244': '#CFFF9E', 'L245': '#E3FFC4', 'L246': '#F0FFDD',
    'L247': '#FFB0E6', 'L248': '#FFD3F0', 'L249': '#FFE7F8', 'L278': '#F8FFED',
    'L279': '#FFF2F8', 'L281': '#7789FF', 'L283': '#4559FF', 'L285': '#FFCC61',
    'L286': '#FFA728', 'L287': '#FF9317', 'L322': '#4AFDFF', 'L323': '#25EDFF',
    'L327': '#18FF99', 'L328': '#FF3AD1', 'L332': '#FF1D5E', 'L343': '#340FFF',
    'L345': '#813EFF', 'L352': '#285AFF', 'L353': '#3A88FF', 'L354': '#2695FF',
    'L363': '#100DFF', 'L366': '#4053FF', 'L441': '#FFBE4C', 'L442': '#FFE085',
    'L443': '#FFF1BB', 'L444': '#FFF8DE', 'L500': '#4656FF', 'L501': '#8192FF',
    'L502': '#B3BDFF', 'L503': '#D6DCFF', 'L504': '#B1E8FF', 'L505': '#B7FF3D',
    'L506': '#FFD6A1', 'L507': '#FF3500', 'L508': '#220AFF', 'L511': '#FF720A',
    'L512': '#FF6005', 'L513': '#F1FF67', 'L514': '#EEFF41', 'L525': '#2A37FF',
    'L550': '#65FF02', 'L600': '#667AFF', 'L601': '#8894FF', 'L602': '#98A8FF',
    'L603': '#9FAFFF', 'L604': '#FFB557', 'L642': '#FFE103', 'L643': '#FFE20D',
    'L650': '#FFEC61', 'L651': '#FFAF42', 'L652': '#FF7918', 'L653': '#FF8F1C',
    'L700': '#2F0DFF', 'L701': '#451BFF', 'L702': '#B8ADFF', 'L703': '#8554FF',
    'L704': '#A078FF', 'L705': '#8C62FF', 'L706': '#3419FF', 'L708': '#8F9EFF',
    'L709': '#7679FF', 'L710': '#3231FF', 'L711': '#5867FF', 'L712': '#3641FF',
    'L713': '#1101FF', 'L714': '#181DFF', 'L715': '#1812FF', 'L716': '#1209FF',
    'L717': '#667AFF', 'L718': '#9BAEFF', 'L719': '#3C49FF', 'L720': '#586BFF',
    'L721': '#1216FF', 'L722': '#0F17FF', 'L723': '#1B1EFF', 'L724': '#3771FF',
    'L725': '#7BADFF', 'L727': '#054FFF', 'L728': '#97CFFF', 'L729': '#0366FF',
    'L730': '#BFFDFF', 'L731': '#D0FFE8', 'L733': '#DEFFCE', 'L735': '#00FFA7',
    'L736': '#0CFF25', 'L738': '#6FFF30', 'L740': '#57FF0F', 'L741': '#FFE402',
    'L742': '#FFC145', 'L744': '#FFC650', 'L746': '#FF9B13', 'L747': '#FFB57D',
    'L748': '#FF76A3', 'L749': '#FFCEBA', 'L750': '#FFFEFE', 'L763': '#FFF5AE',
    'L764': '#FFEE8D', 'L765': '#FFF066', 'L767': '#FFDC0C', 'L768': '#FFAC04',
    'L770': '#FF9505', 'L773': '#FFB571', 'L774': '#FFD095', 'L775': '#FFB566',
    'L776': '#FFAB56', 'L777': '#FF6F03', 'L778': '#FF5A03', 'L779': '#FF6F32',
    'L780': '#FF5200', 'L781': '#FF3B02', 'L787': '#FF0B01', 'L789': '#FF2200',
    'L790': '#FFB28D', 'L791': '#FFB292', 'L793': '#FF1E82', 'L794': '#FF90E2',
    'L795': '#F125FF', 'L797': '#6E03FF', 'L798': '#3A07FF', 'L799': '#1900FF',

    // Roscolux (R prefix)
    'R1': '#FFAB79', 'R2': '#FFDAA5', 'R3': '#FFBC73', 'R4': '#FFC086',
    'R5': '#FFD8C3', 'R6': '#FEFFCD', 'R7': '#FFFFC0', 'R8': '#FFEEAD',
    'R9': '#FFDC7A', 'R10': '#F3FF2E', 'R11': '#FFED43', 'R12': '#FEFF2C',
    'R13': '#FFE36B', 'R14': '#FFD827', 'R15': '#FFC50E', 'R16': '#FFC24E',
    'R17': '#FFA54E', 'R18': '#FFAC45', 'R19': '#FF3D00', 'R20': '#FFA613',
    'R21': '#FF8109', 'R22': '#FF5401', 'R23': '#FF640B', 'R24': '#FF4415',
    'R25': '#FF3404', 'R26': '#FF2307', 'R27': '#FF1300', 'R30': '#FF935B',
    'R31': '#FF8E7A', 'R32': '#FF6441', 'R33': '#FFC8E2', 'R34': '#FF939F',
    'R35': '#FFC1CF', 'R36': '#FF93A7', 'R37': '#FFBBF5', 'R38': '#FFB9D5',
    'R39': '#FF2178', 'R40': '#FF712C', 'R41': '#FF471C', 'R42': '#FF2B25',
    'R43': '#FF5A8F', 'R44': '#FF5BD3', 'R45': '#FF3444', 'R46': '#FF2127',
    'R47': '#954FFF', 'R48': '#DD4FFF', 'R49': '#F818FF', 'R50': '#FF523F',
    'R51': '#CBB5FF', 'R52': '#A97FFF', 'R53': '#CAC6FF', 'R54': '#B8A6FF',
    'R55': '#847EFF', 'R56': '#330FFF', 'R57': '#7B56FF', 'R58': '#5427FF',
    'R59': '#2A01FF', 'R60': '#99B0FF', 'R61': '#AAC0FF', 'R62': '#7DA3FF',
    'R63': '#8FA9FF', 'R64': '#4155FF', 'R65': '#3767FF', 'R66': '#95C3FF',
    'R67': '#304AFF', 'R68': '#1D25FF', 'R69': '#173EFF', 'R70': '#548AFF',
    'R71': '#3168FF', 'R72': '#3B78FF', 'R73': '#3885FF', 'R74': '#1009FF',
    'R75': '#1443FF', 'R76': '#1037FF', 'R77': '#1435FF', 'R78': '#4142FF',
    'R79': '#1814FF', 'R80': '#141FFF', 'R81': '#2427FF', 'R82': '#261AFF',
    'R83': '#130FFF', 'R84': '#272AFF', 'R85': '#1609FF', 'R86': '#8AFF4E',
    'R87': '#E4FFC2', 'R88': '#D0FF96', 'R89': '#60FF74', 'R91': '#3CFFA4',
    'R92': '#78FFFE', 'R93': '#5CD3FF', 'R96': '#EEFF7E', 'R99': '#FFC48D',
    'R302': '#FFF0D6', 'R303': '#FF9D41', 'R304': '#FFCD9B', 'R305': '#FFCEA8',
    'R310': '#FAFF59', 'R312': '#FFF419', 'R313': '#FFE834', 'R316': '#FFB85A',
    'R317': '#FFA144', 'R318': '#FF8441', 'R321': '#FF9633', 'R324': '#FF411B',
    'R325': '#FF4A0D', 'R331': '#FFB095', 'R332': '#FF5828', 'R333': '#FFD5F6',
    'R336': '#FF93D1', 'R337': '#FFACD9', 'R339': '#FF2E74', 'R342': '#FF282B',
    'R343': '#FF4F7D', 'R344': '#FF50E7', 'R346': '#FF29CD', 'R347': '#9E06FF',
    'R348': '#B22CFF', 'R349': '#FF23FB', 'R351': '#DDCAFF', 'R353': '#7B68FF',
    'R355': '#574EFF', 'R356': '#8C67FF', 'R357': '#3B11FF', 'R358': '#4D09FF',
    'R359': '#2912FF', 'R360': '#A3B7FF', 'R361': '#3342FF', 'R362': '#728BFF',
    'R363': '#82B3FF', 'R364': '#566FFF', 'R365': '#6A81FF', 'R366': '#3B6BFF',
    'R367': '#3850FF', 'R368': '#2D3AFF', 'R369': '#2456FF', 'R370': '#1F86FF',
    'R374': '#2E92FF', 'R375': '#207AFF', 'R376': '#3170FF', 'R377': '#2812FF',
    'R378': '#3E3CFF', 'R381': '#1F18FF', 'R382': '#2000FF', 'R383': '#1908FF',
    'R384': '#1402FF', 'R385': '#1900FF', 'R386': '#7EFF68', 'R388': '#C2FF88',
    'R389': '#45FF93', 'R392': '#2F9CFF', 'R393': '#18ADFF', 'R395': '#17ABFF',
    'R397': '#FFFEF6', 'R398': '#F1F8FF', 'R2001': '#FF2307', 'R2002': '#FF7A21',
    'R2003': '#FFCC14', 'R2004': '#25FF55', 'R2005': '#2CA5FF', 'R2006': '#141FFF',
    'R2007': '#2C35FF', 'R2008': '#2612FF', 'R2009': '#741FFF', 'R2010': '#EB49FF',
    'R3102': '#FFC250', 'R3106': '#FFA940', 'R3107': '#FFFFBE', 'R3134': '#FFEDAB',
    'R3150': '#FFFC63', 'R3152': '#FF901B', 'R3202': '#6A81FF', 'R3203': '#839CFF',
    'R3204': '#A3B7FF', 'R3206': '#B5C4FF', 'R3208': '#CDD7FF', 'R3216': '#EBF0FF',
    'R3220': '#2C35FF', 'R3304': '#D0FF95', 'R3308': '#FFBBF4', 'R3309': '#FFCAEE',
    'R3310': '#FF8840', 'R3313': '#FFD5F6', 'R3314': '#FFE9F8', 'R3315': '#E4FFC3',
    'R3316': '#F4FFDC', 'R3317': '#FBFFE4', 'R3318': '#FFF2EF', 'R3407': '#FFAD49',
    'R3408': '#FFD585', 'R3409': '#FFEBBF', 'R3410': '#FFF5D8', 'R3411': '#FFB85B',
    'R3420': '#FF7A21', 'R3441': '#FFBB4D', 'R3442': '#FFDF88', 'R3443': '#FFF3C1',
    'R3444': '#FFF8DA', 'R4215': '#B6BBFF', 'R4230': '#838BFF', 'R4260': '#504EFF',
    'R4290': '#2C21FF', 'R4307': '#E8FDFF', 'R4315': '#D5F9FF', 'R4330': '#AAE7FF',
    'R4360': '#75D8FF', 'R4390': '#4EC3FF', 'R4415': '#D8FFB9', 'R4430': '#B3FF87',
    'R4460': '#86FF56', 'R4490': '#62FF3B', 'R4515': '#FBFFB3', 'R4530': '#F7FF85',
    'R4560': '#F6FF4C', 'R4590': '#FBFF31', 'R4615': '#FFD5C2', 'R4630': '#FFB08D',
    'R4660': '#FF7F4D', 'R4690': '#FF5725', 'R4715': '#FBCEFF', 'R4730': '#F6A0FF',
    'R4760': '#EA5EFF', 'R4790': '#EB49FF', 'R4815': '#FFD0DF', 'R4830': '#FFA6BE',
    'R4860': '#FF7C93', 'R4890': '#FF5660', 'R4915': '#D0BBFF', 'R4930': '#B893FF',
    'R4960': '#8A53FF', 'R4990': '#632EFF'
  };

  // Helper to get a single gel color hex value
  const getSingleGelColor = (colorValue: string): string | undefined => {
    if (!colorValue) return undefined;

    // Parse gel color code
    let gelCode = colorValue.trim().toUpperCase();

    // If it's a number-only, default to Rosco (R prefix)
    if (/^\d+$/.test(gelCode)) {
      gelCode = 'R' + gelCode;
    }

    // Return the gel color if found, otherwise default to frosty white for frosts/diffusion
    return gelColors[gelCode] || '#F5F5F5';
  };

  // Helper function to get gel color hex value(s) - supports dual colors like "L202+R119"
  const getGelColor = (colorValue: string): string | string[] | undefined => {
    if (!colorValue) return undefined;

    // Check for dual colors (e.g., "L202+R119" or "L202 + R119")
    const dualColorMatch = colorValue.match(/^([^+]+)\+(.+)$/);
    if (dualColorMatch) {
      const [, color1, color2] = dualColorMatch;
      const gel1 = getSingleGelColor(color1.trim());
      const gel2 = getSingleGelColor(color2.trim());
      if (gel1 && gel2) {
        return [gel1, gel2];
      }
    }

    // Single color
    return getSingleGelColor(colorValue);
  };

  // Helper function to render color with swatch
  const renderColorCell = (color: string) => {
    if (color === '-' || !color) return <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">-</td>;

    const gelColor = getGelColor(color);

    return (
      <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">
        <div className="flex items-center gap-1">
          {/* Color swatch - supports dual colors */}
          {Array.isArray(gelColor) ? (
            // Dual color swatch - overlapping diagonal squares
            <div className="relative w-3 h-3 flex-shrink-0 print:w-2 print:h-2" title={`${color} (${gelColor[0]} + ${gelColor[1]})`}>
              {/* First color - top left */}
              <div
                className="absolute w-2 h-2 rounded-sm border border-gray-400 dark:border-gray-600 print:w-1.5 print:h-1.5"
                style={{
                  backgroundColor: gelColor[0],
                  top: 0,
                  left: 0,
                  zIndex: 2
                }}
              />
              {/* Second color - bottom right */}
              <div
                className="absolute w-2 h-2 rounded-sm border border-gray-400 dark:border-gray-600 print:w-1.5 print:h-1.5"
                style={{
                  backgroundColor: gelColor[1],
                  bottom: 0,
                  right: 0,
                  zIndex: 1
                }}
              />
            </div>
          ) : gelColor ? (
            // Single color swatch
            <div
              className="w-3 h-3 rounded border border-gray-400 dark:border-gray-600 flex-shrink-0 print:w-2 print:h-2"
              style={{ backgroundColor: gelColor }}
              title={`${color} (${gelColor})`}
            />
          ) : (
            // No color found - show empty swatch
            <div
              className="w-3 h-3 rounded border border-gray-400 dark:border-gray-600 flex-shrink-0 bg-gray-200 dark:bg-gray-700 print:w-2 print:h-2"
              title={color || 'No color'}
            />
          )}
          <span className="text-xs print:text-[8pt]">{color}</span>
        </div>
      </td>
    );
  };

  const renderMetadataHeader = () => {
    if (!projectData) return null;

    // Determine title to display
    const reportTitle = metadata.customTitle ||
      `${REPORT_TEMPLATES.find(t => t.id === selectedReport)?.name || 'Report'} - ${projectName}`;

    // Build venue string
    const venueStr = [
      projectData.venue,
      projectData.venue_city,
      projectData.venue_state
    ].filter(Boolean).join(', ');

    return (
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 print:bg-white print:border-black print:mb-6">
        <div className="flex items-start justify-between mb-4">
          {/* Title Section */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 print:text-black">
              {reportTitle}
            </h1>
            {metadata.showProjectName && projectName && (
              <p className="text-lg text-gray-700 dark:text-gray-300 print:text-gray-800">
                {projectName}
              </p>
            )}
          </div>

          {/* Logo Section */}
          {metadata.showLogo && projectData.logo_path && (
            <div className="ml-6">
              <img
                src={`file://${projectData.logo_path}`}
                alt="Company Logo"
                className="max-h-24 max-w-48 object-contain print:max-h-20"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm border-t border-gray-200 dark:border-gray-700 pt-4 print:border-gray-400">
          {/* Venue Information */}
          {metadata.showVenue && venueStr && (
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">Venue:</span>
              <span className="ml-2 text-gray-900 dark:text-white print:text-black">{venueStr}</span>
            </div>
          )}

          {/* Lighting Designer */}
          {metadata.showDesigners && projectData.lighting_designer && (
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">Lighting Designer:</span>
              <span className="ml-2 text-gray-900 dark:text-white print:text-black">{projectData.lighting_designer}</span>
              {projectData.lighting_designer_email && (
                <div className="ml-2 text-xs text-gray-600 dark:text-gray-400 print:text-gray-700">
                  {projectData.lighting_designer_email}
                </div>
              )}
              {projectData.lighting_designer_phone && (
                <div className="ml-2 text-xs text-gray-600 dark:text-gray-400 print:text-gray-700">
                  {projectData.lighting_designer_phone}
                </div>
              )}
            </div>
          )}

          {/* Generated Date */}
          {metadata.showGeneratedDate && (
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">Generated:</span>
              <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
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
            <table className="w-full text-xs border-collapse border border-gray-400 dark:border-gray-600 print:text-[8pt] print:border-black">
              <thead className="bg-gray-800 dark:bg-gray-700 text-white print:bg-black print:text-white">
                <tr>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Chan</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Dim</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Position</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Unit #</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Type</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Watt</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Purpose</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Color</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 print:bg-white">
                {channelHookupData.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-300 dark:border-gray-700 print:border-black ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900 print:bg-gray-100' : 'bg-white dark:bg-gray-800 print:bg-white'}`}>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.channel}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.dimmer}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.position}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.unit}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.type}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.wattage}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.purpose}</td>
                    {renderColorCell(row.color)}
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'dimmer-schedule':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-400 dark:border-gray-600 print:text-[8pt] print:border-black">
              <thead className="bg-gray-800 dark:bg-gray-700 text-white print:bg-black print:text-white">
                <tr>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Dim</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Chan</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Position</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Unit #</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Type</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Watt</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Purpose</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Color</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 print:bg-white">
                {dimmerScheduleData.flatMap((group, groupIdx) =>
                  group.fixtures.map((fixture, fixtureIdx) => {
                    const flatIdx = dimmerScheduleData.slice(0, groupIdx).reduce((sum, g) => sum + g.fixtures.length, 0) + fixtureIdx;
                    return (
                      <tr key={`${groupIdx}-${fixtureIdx}`} className={`border-b border-gray-300 dark:border-gray-700 print:border-black ${flatIdx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900 print:bg-gray-100' : 'bg-white dark:bg-gray-800 print:bg-white'}`}>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixtureIdx === 0 ? group.dimmer : '""'}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.channel}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.position}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.unit}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.type}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.wattage}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.purpose}</td>
                        {renderColorCell(fixture.color)}
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.notes}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );

      case 'circuit-list':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-400 dark:border-gray-600 print:text-[8pt] print:border-black">
              <thead className="bg-gray-800 dark:bg-gray-700 text-white print:bg-black print:text-white">
                <tr>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Circuit</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Dim</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Chan</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Position</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Unit #</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Type</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Watt</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Purpose</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Color</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 print:bg-white">
                {circuitListData.flatMap((group, i) =>
                  group.fixtures.map((fixture, j) => {
                    const flatIdx = circuitListData.slice(0, i).reduce((sum, g) => sum + g.fixtures.length, 0) + j;
                    return (
                      <tr key={`${i}-${j}`} className={`border-b border-gray-300 dark:border-gray-700 print:border-black ${flatIdx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900 print:bg-gray-100' : 'bg-white dark:bg-gray-800 print:bg-white'}`}>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{j === 0 ? group.circuit : '""'}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.dimmer}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.channel}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.position}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.unit}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.type}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.wattage}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.purpose}</td>
                        {renderColorCell(fixture.color)}
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{fixture.notes}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );

      case 'dmx-addresses':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-400 dark:border-gray-600 print:text-[8pt] print:border-black">
              <thead className="bg-gray-800 dark:bg-gray-700 text-white print:bg-black print:text-white">
                <tr>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Address</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Chan</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Dim</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Position</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Unit #</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Type</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Watt</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Purpose</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Color</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 print:bg-white">
                {dmxAddressData.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-300 dark:border-gray-700 print:border-black ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900 print:bg-gray-100' : 'bg-white dark:bg-gray-800 print:bg-white'}`}>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.address}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.channel}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.dimmer}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.position}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.unit}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.type}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.wattage}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.purpose}</td>
                    {renderColorCell(row.color)}
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.notes}</td>
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
              <table className="w-full text-xs border-collapse border border-gray-400 dark:border-gray-600 print:text-[8pt] print:border-black">
                <thead className="bg-gray-800 dark:bg-gray-700 text-white print:bg-black print:text-white">
                  <tr>
                    <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Color</th>
                    <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Gel Size</th>
                    <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Cuts Needed</th>
                    <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Sheets Required</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 print:bg-white">
                  {colorScheduleData.map((row, i) => {
                    const gelColor = getGelColor(row.color);

                    return (
                      <tr key={i} className={`border-b border-gray-300 dark:border-gray-700 print:border-black ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900 print:bg-gray-100' : 'bg-white dark:bg-gray-800 print:bg-white'}`}>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0 font-medium">
                          <div className="flex items-center gap-2">
                            {/* Color swatch - supports dual colors */}
                            {Array.isArray(gelColor) ? (
                              // Dual color swatch - overlapping diagonal squares
                              <div className="relative w-4 h-4 flex-shrink-0" title={`${row.color} (${gelColor[0]} + ${gelColor[1]})`}>
                                {/* First color - top left */}
                                <div
                                  className="absolute w-3 h-3 rounded-sm border border-gray-400 dark:border-gray-600"
                                  style={{
                                    backgroundColor: gelColor[0],
                                    top: 0,
                                    left: 0,
                                    zIndex: 2
                                  }}
                                />
                                {/* Second color - bottom right */}
                                <div
                                  className="absolute w-3 h-3 rounded-sm border border-gray-400 dark:border-gray-600"
                                  style={{
                                    backgroundColor: gelColor[1],
                                    bottom: 0,
                                    right: 0,
                                    zIndex: 1
                                  }}
                                />
                              </div>
                            ) : gelColor ? (
                              // Single color swatch
                              <div
                                className="w-4 h-4 rounded border border-gray-400 dark:border-gray-600 flex-shrink-0"
                                style={{ backgroundColor: gelColor }}
                                title={`${row.color} (${gelColor})`}
                              />
                            ) : (
                              // No color found - show empty swatch
                              <div
                                className="w-4 h-4 rounded border border-gray-400 dark:border-gray-600 flex-shrink-0 bg-gray-200 dark:bg-gray-700"
                                title={row.color || 'No color'}
                              />
                            )}
                            <span>{row.color}</span>
                          </div>
                        </td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0 text-gray-600 dark:text-gray-400">{row.size}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.cuts}</td>
                        <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.sheets}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
                * Calculations based on actual color frame sizes for fixture types
              </div>
            </div>

            {/* Summary by color */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Total Sheets by Color</h3>
              <table className="w-full text-xs border-collapse border border-gray-400 dark:border-gray-600 print:text-[8pt] print:border-black">
                <thead className="bg-gray-800 dark:bg-gray-700 text-white print:bg-black print:text-white">
                  <tr>
                    <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Color</th>
                    <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Total Sheets</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 print:bg-white">
                  {Object.entries(colorTotals)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([color, sheets], i) => {
                      const gelColor = getGelColor(color);

                      return (
                        <tr key={i} className={`border-b border-gray-300 dark:border-gray-700 print:border-black ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900 print:bg-gray-100' : 'bg-white dark:bg-gray-800 print:bg-white'}`}>
                          <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0 font-medium">
                            <div className="flex items-center gap-2">
                              {/* Color swatch - supports dual colors */}
                              {Array.isArray(gelColor) ? (
                                // Dual color swatch - overlapping diagonal squares
                                <div className="relative w-4 h-4 flex-shrink-0" title={`${color} (${gelColor[0]} + ${gelColor[1]})`}>
                                  {/* First color - top left */}
                                  <div
                                    className="absolute w-3 h-3 rounded-sm border border-gray-400 dark:border-gray-600"
                                    style={{
                                      backgroundColor: gelColor[0],
                                      top: 0,
                                      left: 0,
                                      zIndex: 2
                                    }}
                                  />
                                  {/* Second color - bottom right */}
                                  <div
                                    className="absolute w-3 h-3 rounded-sm border border-gray-400 dark:border-gray-600"
                                    style={{
                                      backgroundColor: gelColor[1],
                                      bottom: 0,
                                      right: 0,
                                      zIndex: 1
                                    }}
                                  />
                                </div>
                              ) : gelColor ? (
                                // Single color swatch
                                <div
                                  className="w-4 h-4 rounded border border-gray-400 dark:border-gray-600 flex-shrink-0"
                                  style={{ backgroundColor: gelColor }}
                                  title={`${color} (${gelColor})`}
                                />
                              ) : (
                                // No color found - show empty swatch
                                <div
                                  className="w-4 h-4 rounded border border-gray-400 dark:border-gray-600 flex-shrink-0 bg-gray-200 dark:bg-gray-700"
                                  title={color || 'No color'}
                                />
                              )}
                              <span>{color}</span>
                            </div>
                          </td>
                          <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0 font-bold text-yellow-400">{sheets}</td>
                        </tr>
                      );
                    })}
                  <tr className="bg-gray-800 dark:bg-gray-700 text-white print:bg-black print:text-white font-bold border border-gray-300 dark:border-gray-700 print:border-black">
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">TOTAL</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0 text-yellow-400">
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
            <table className="w-full text-xs border-collapse border border-gray-400 dark:border-gray-600 print:text-[8pt] print:border-black">
              <thead className="bg-gray-800 dark:bg-gray-700 text-white print:bg-black print:text-white">
                <tr>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Gobo/Template</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Quantity Needed</th>
                  <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Size</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 print:bg-white">
                {goboScheduleData.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-300 dark:border-gray-700 print:border-black ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900 print:bg-gray-100' : 'bg-white dark:bg-gray-800 print:bg-white'}`}>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0 font-medium">{row.gobo}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.count}</td>
                    <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.size}</td>
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
              <table className="w-full text-xs border-collapse border border-gray-400 dark:border-gray-600 print:text-[8pt] print:border-black">
                <thead className="bg-gray-800 dark:bg-gray-700 text-white print:bg-black print:text-white">
                  <tr>
                    <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Wattage</th>
                    <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Count</th>
                    <th className="px-2 py-1 text-left border border-gray-400 dark:border-gray-600 font-bold text-xs print:border-black print:text-[9pt]">Total Wattage</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 print:bg-white">
                  {powerSummaryData.breakdown.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-300 dark:border-gray-700 print:border-black ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900 print:bg-gray-100' : 'bg-white dark:bg-gray-800 print:bg-white'}`}>
                      <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.wattage}W</td>
                      <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.count}</td>
                      <td className="px-2 py-0.5 border border-gray-300 dark:border-gray-700 print:border-black print:py-0">{row.totalWattage}W</td>
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
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex-shrink-0">
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0">
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-1.5 flex items-center justify-between flex-shrink-0">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {REPORT_TEMPLATES.find(t => t.id === selectedReport)?.description}
        </p>
        <div className="text-[10px] text-gray-500">
          {PAGE_SIZES[pageSetup.size].name} • {pageSetup.orientation} • {pageSetup.colorMode === 'color' ? 'Color' : 'B&W'}
        </div>
      </div>

      {/* Main Content - Report Display */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
        <div className="max-w-full mx-auto report-content">
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

            {/* Custom Title Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Custom Title (Optional)
              </label>
              <input
                type="text"
                value={metadata.customTitle}
                onChange={(e) => setMetadata({ ...metadata, customTitle: e.target.value })}
                placeholder={`${REPORT_TEMPLATES.find(t => t.id === selectedReport)?.name || 'Report'} - ${projectName}`}
                className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to use default title
              </p>
            </div>

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
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={metadata.showLogo}
                  onChange={(e) => setMetadata({ ...metadata, showLogo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show Company Logo</span>
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
