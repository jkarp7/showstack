import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFixtureStore } from '../../store/fixtureStore';
import { Fixture } from '../../types';

type ReportType = 'channel-hookup' | 'dimmer-schedule' | 'circuit-list' | 'dmx-addresses' | 'power-summary';

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
    id: 'power-summary',
    name: 'Power Summary',
    description: 'Calculate total power consumption and requirements',
    icon: '⚙️'
  }
];

export function Paperwork() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const currentProjectId = routeProjectId || 'default-project';
  const { fixtures, loadFixtures } = useFixtureStore();
  const [selectedReport, setSelectedReport] = useState<ReportType>('channel-hookup');
  const [projectName, setProjectName] = useState<string>('Untitled Project');

  // Load fixtures and project info
  useEffect(() => {
    loadFixtures();

    const loadProjectInfo = async () => {
      if (!window.api?.projects) return;
      try {
        const project = await window.api.projects.getById(currentProjectId);
        if (project?.name) {
          setProjectName(project.name);
        }
      } catch (error) {
        console.error('Failed to load project info:', error);
      }
    };

    loadProjectInfo();
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
          wattage: f.wattage || '-'
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
          location: f.location || '-'
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

  const handleExportPDF = () => {
    alert('PDF export coming soon! This will generate a printable PDF of the selected report.');
  };

  const handlePrint = () => {
    window.print();
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
                      <th className="px-3 py-2 text-left">Wattage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.fixtures.map((fixture, j) => (
                      <tr key={j} className="border-b border-gray-700">
                        <td className="px-3 py-2">{fixture.position}</td>
                        <td className="px-3 py-2">{fixture.type}</td>
                        <td className="px-3 py-2">{fixture.channel}</td>
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
                    </tr>
                  </thead>
                  <tbody>
                    {group.fixtures.map((fixture, j) => (
                      <tr key={j} className="border-b border-gray-700">
                        <td className="px-3 py-2">{fixture.position}</td>
                        <td className="px-3 py-2">{fixture.type}</td>
                        <td className="px-3 py-2">{fixture.dimmer}</td>
                        <td className="px-3 py-2">{fixture.location}</td>
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
              <p className="text-sm text-gray-400">{fixtures.length} fixtures</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <p className="text-sm text-gray-400">
          {REPORT_TEMPLATES.find(t => t.id === selectedReport)?.description}
        </p>
      </div>

      {/* Main Content - Report Display */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {renderReport()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
        <div>ShowStack:Production - Paperwork Generator</div>
        <div>v0.1.0-alpha</div>
      </footer>
    </div>
  );
}
