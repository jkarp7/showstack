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
    description: 'List fixtures grouped by color',
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

export function Paperwork() {
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
      position: fixture.position || '-',
      unit: fixture.unit || '-',
      type: fixture.type || '-',
      purpose: fixture.purpose || '-',
      channel: fixture.channel || '-',
      dimmer: fixture.dimmer || '-',
      circuit: fixture.circuit_number || fixture.circuit || '-',
      color: fixture.color || '-',
      gobo: fixture.gobo || '-',
      wattage: fixture.wattage || '-',
      location: fixture.location || '-'
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
          position: f.position || '-',
          type: f.type || '-',
          channel: f.channel || '-',
          wattage: f.wattage || '-',
          color: f.color || '-'
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
          position: f.position || '-',
          type: f.type || '-',
          dimmer: f.dimmer || '-',
          location: f.location || '-',
          wattage: f.wattage || '-'
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
        universe: fixture.universe || '-',
        address: fixture.dmx_address || '-',
        position: fixture.position || '-',
        type: fixture.type || '-',
        purpose: fixture.purpose || '-',
        channel: fixture.channel || '-'
      }));
  }, [fixtures]);

  // Generate Color Schedule data
  const colorScheduleData = useMemo(() => {
    const grouped = fixtures.reduce((acc, fixture) => {
      const color = fixture.color || 'No Color';
      if (!acc[color]) acc[color] = [];
      acc[color].push(fixture);
      return acc;
    }, {} as Record<string, Fixture[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([color, fixtures]) => ({
        color,
        count: fixtures.length,
        fixtures: fixtures.map(f => ({
          position: f.position || '-',
          type: f.type || '-',
          channel: f.channel || '-',
          purpose: f.purpose || '-',
          location: f.location || '-'
        }))
      }));
  }, [fixtures]);

  // Generate Gobo Schedule data
  const goboScheduleData = useMemo(() => {
    const grouped = fixtures.reduce((acc, fixture) => {
      const gobo = fixture.gobo || 'No Gobo';
      if (!acc[gobo]) acc[gobo] = [];
      acc[gobo].push(fixture);
      return acc;
    }, {} as Record<string, Fixture[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([gobo, fixtures]) => ({
        gobo,
        count: fixtures.length,
        fixtures: fixtures.map(f => ({
          position: f.position || '-',
          type: f.type || '-',
          channel: f.channel || '-',
          color: f.color || '-',
          purpose: f.purpose || '-'
        }))
      }));
  }, [fixtures]);

  // Generate Power Summary data
  const powerSummaryData = useMemo(() => {
    const totalWattage = fixtures.reduce((sum, f) => sum + (f.wattage || 0), 0);
    const totalAmperage = totalWattage / 120; // Assuming 120V
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
      breakdown: Object.entries(fixturesByWattage)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([wattage, count]) => ({
          wattage,
          count,
          totalWattage: (Number(wattage) * count).toFixed(0)
        }))
    };
  }, [fixtures]);

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

  const handleExportPDF = () => {
    const reportName = REPORT_TEMPLATES.find(t => t.id === selectedReport)?.name;
    alert(`Exporting ${reportName} to PDF with ${pageSetup.size.toUpperCase()} ${pageSetup.orientation} layout...`);
    // TODO: Implement PDF export
  };

  const handlePrint = () => {
    window.print();
  };

  const renderMetadataHeader = () => {
    if (!projectData) return null;

    return (
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border-b-2 border-gray-600 print:bg-white print:border-black">
        {metadata.showProjectName && (
          <h1 className="text-2xl font-bold mb-2">{projectName}</h1>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {metadata.showVenue && projectData.venue && (
            <div><span className="text-gray-400">Venue:</span> {projectData.venue}</div>
          )}
          {metadata.showDesigners && projectData.lighting_designer && (
            <div><span className="text-gray-400">Lighting Designer:</span> {projectData.lighting_designer}</div>
          )}
          {metadata.showGeneratedDate && (
            <div><span className="text-gray-400">Generated:</span> {new Date().toLocaleDateString()}</div>
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
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Pos</th>
                  <th className="px-3 py-2 text-left">Unit</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Purpose</th>
                  <th className="px-3 py-2 text-left">Chan</th>
                  <th className="px-3 py-2 text-left">Dim</th>
                  <th className="px-3 py-2 text-left">Ckt</th>
                  <th className="px-3 py-2 text-left">Color</th>
                  <th className="px-3 py-2 text-left">Gobo</th>
                  <th className="px-3 py-2 text-left">W</th>
                  <th className="px-3 py-2 text-left">Location</th>
                </tr>
              </thead>
              <tbody>
                {channelHookupData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-gray-800">
                    <td className="px-3 py-2">{row.position}</td>
                    <td className="px-3 py-2">{row.unit}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.purpose}</td>
                    <td className="px-3 py-2">{row.channel}</td>
                    <td className="px-3 py-2">{row.dimmer}</td>
                    <td className="px-3 py-2">{row.circuit}</td>
                    <td className="px-3 py-2">{row.color}</td>
                    <td className="px-3 py-2">{row.gobo}</td>
                    <td className="px-3 py-2">{row.wattage}</td>
                    <td className="px-3 py-2">{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'dimmer-schedule':
        return (
          <div className="space-y-6">
            {dimmerScheduleData.map((group, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-400">Dimmer: {group.dimmer}</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Position</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Channel</th>
                      <th className="px-3 py-2 text-left">Color</th>
                      <th className="px-3 py-2 text-left">Wattage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.fixtures.map((fixture, j) => (
                      <tr key={j} className="border-b border-gray-700">
                        <td className="px-3 py-2">{fixture.position}</td>
                        <td className="px-3 py-2">{fixture.type}</td>
                        <td className="px-3 py-2">{fixture.channel}</td>
                        <td className="px-3 py-2">{fixture.color}</td>
                        <td className="px-3 py-2">{fixture.wattage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        );

      case 'circuit-list':
        return (
          <div className="space-y-6">
            {circuitListData.map((group, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-400">Circuit: {group.circuit}</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Position</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Dimmer</th>
                      <th className="px-3 py-2 text-left">Location</th>
                      <th className="px-3 py-2 text-left">Wattage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.fixtures.map((fixture, j) => (
                      <tr key={j} className="border-b border-gray-700">
                        <td className="px-3 py-2">{fixture.position}</td>
                        <td className="px-3 py-2">{fixture.type}</td>
                        <td className="px-3 py-2">{fixture.dimmer}</td>
                        <td className="px-3 py-2">{fixture.location}</td>
                        <td className="px-3 py-2">{fixture.wattage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        );

      case 'dmx-addresses':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Universe</th>
                  <th className="px-3 py-2 text-left">Address</th>
                  <th className="px-3 py-2 text-left">Position</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Purpose</th>
                  <th className="px-3 py-2 text-left">Channel</th>
                </tr>
              </thead>
              <tbody>
                {dmxAddressData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-gray-800">
                    <td className="px-3 py-2">{row.universe}</td>
                    <td className="px-3 py-2">{row.address}</td>
                    <td className="px-3 py-2">{row.position}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.purpose}</td>
                    <td className="px-3 py-2">{row.channel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'color-schedule':
        return (
          <div className="space-y-6">
            {colorScheduleData.map((group, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-400">
                    Color: {group.color}
                  </h3>
                  <span className="text-sm text-gray-400">{group.count} fixture{group.count !== 1 ? 's' : ''}</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Position</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Channel</th>
                      <th className="px-3 py-2 text-left">Purpose</th>
                      <th className="px-3 py-2 text-left">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.fixtures.map((fixture, j) => (
                      <tr key={j} className="border-b border-gray-700">
                        <td className="px-3 py-2">{fixture.position}</td>
                        <td className="px-3 py-2">{fixture.type}</td>
                        <td className="px-3 py-2">{fixture.channel}</td>
                        <td className="px-3 py-2">{fixture.purpose}</td>
                        <td className="px-3 py-2">{fixture.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        );

      case 'gobo-schedule':
        return (
          <div className="space-y-6">
            {goboScheduleData.map((group, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-400">
                    Gobo: {group.gobo}
                  </h3>
                  <span className="text-sm text-gray-400">{group.count} fixture{group.count !== 1 ? 's' : ''}</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Position</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Channel</th>
                      <th className="px-3 py-2 text-left">Color</th>
                      <th className="px-3 py-2 text-left">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.fixtures.map((fixture, j) => (
                      <tr key={j} className="border-b border-gray-700">
                        <td className="px-3 py-2">{fixture.position}</td>
                        <td className="px-3 py-2">{fixture.type}</td>
                        <td className="px-3 py-2">{fixture.channel}</td>
                        <td className="px-3 py-2">{fixture.color}</td>
                        <td className="px-3 py-2">{fixture.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        );

      case 'power-summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-2">Total Fixtures</div>
                <div className="text-3xl font-bold text-blue-400">{powerSummaryData.totalFixtures}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-2">Total Wattage</div>
                <div className="text-3xl font-bold text-yellow-400">{powerSummaryData.totalWattage}W</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-2">Total Amperage (120V)</div>
                <div className="text-3xl font-bold text-red-400">{powerSummaryData.totalAmperage}A</div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Power Breakdown by Wattage</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Wattage</th>
                    <th className="px-3 py-2 text-left">Count</th>
                    <th className="px-3 py-2 text-left">Total Wattage</th>
                  </tr>
                </thead>
                <tbody>
                  {powerSummaryData.breakdown.map((row, i) => (
                    <tr key={i} className="border-b border-gray-700">
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
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/modules')}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              ← Home
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{projectName}</h1>
                <span className="text-gray-500">•</span>
                <span className="text-lg text-gray-400">Paperwork Generator</span>
              </div>
              <p className="text-sm text-gray-400">
                {currentReport ? `${currentReport.name} • ` : ''}{fixtures.length} fixtures
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLoadDialog(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              📂 Load Report
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              💾 Save Report
            </button>
            <button
              onClick={() => setShowPageSetup(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              📄 Page Setup
            </button>
            <button
              onClick={() => setShowMetadataOptions(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              ⚙️ Options
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
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
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {REPORT_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedReport(template.id)}
              className={`px-4 py-2 rounded whitespace-nowrap transition flex items-center gap-2 ${
                selectedReport === template.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{template.icon}</span>
              <span>{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Report Description */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {REPORT_TEMPLATES.find(t => t.id === selectedReport)?.description}
        </p>
        <div className="text-xs text-gray-500">
          {PAGE_SIZES[pageSetup.size].name} • {pageSetup.orientation} • {pageSetup.colorMode === 'color' ? 'Color' : 'B&W'}
        </div>
      </div>

      {/* Main Content - Report Display */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {renderMetadataHeader()}
          {renderReport()}
        </div>
      </main>

      {/* Page Setup Dialog */}
      {showPageSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Page Setup</h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Page Size</label>
                <select
                  value={pageSetup.size}
                  onChange={(e) => setPageSetup({ ...pageSetup, size: e.target.value as PageSize })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
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
                  <label className="block text-xs text-gray-400 mb-1">Top</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={pageSetup.marginTop}
                    onChange={(e) => setPageSetup({ ...pageSetup, marginTop: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Bottom</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={pageSetup.marginBottom}
                    onChange={(e) => setPageSetup({ ...pageSetup, marginBottom: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Left</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={pageSetup.marginLeft}
                    onChange={(e) => setPageSetup({ ...pageSetup, marginLeft: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Right</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={pageSetup.marginRight}
                    onChange={(e) => setPageSetup({ ...pageSetup, marginRight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowPageSetup(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
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
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
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
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
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
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Save Custom Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Report Name</label>
                <input
                  type="text"
                  value={saveReportName}
                  onChange={(e) => setSaveReportName(e.target.value)}
                  placeholder="My Channel Hookup"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div className="text-xs text-gray-400">
                Saves: Report type, page setup, and metadata options
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
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
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Load Custom Report</h2>
            {customReports.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="mb-4">No saved reports yet</p>
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
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
                      className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition cursor-pointer group"
                      onClick={() => handleLoadReport(report)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{report.name}</h3>
                          {report.description && (
                            <p className="text-sm text-gray-400 mb-2">{report.description}</p>
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
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
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
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
        <div>ShowStack:Production - Paperwork Generator</div>
        <div>{customReports.length} saved report{customReports.length !== 1 ? 's' : ''} • v0.1.0-alpha</div>
      </footer>
    </div>
  );
}
