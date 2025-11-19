import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFixtureStore } from '../../store/fixtureStore';

type LabelType = 'cable' | 'circuit' | 'fixture' | 'dimmer' | 'custom';
type LabelSize = 'small' | 'medium' | 'large';
type PrinterType = 'dymo-450' | 'brother-pt' | 'zebra';

interface LabelTemplate {
  type: LabelType;
  name: string;
  description: string;
  icon: string;
  fields: string[];
}

const LABEL_TEMPLATES: LabelTemplate[] = [
  {
    type: 'cable',
    name: 'Cable Labels',
    description: 'Labels for multi-cables and power cables',
    icon: '🔌',
    fields: ['Cable Name', 'Circuit Numbers', 'Destination', 'Notes']
  },
  {
    type: 'circuit',
    name: 'Circuit Labels',
    description: 'Labels for circuit breakers and patch panels',
    icon: '⚡',
    fields: ['Circuit Number', 'Dimmer', 'Load', 'Location']
  },
  {
    type: 'fixture',
    name: 'Fixture Labels',
    description: 'Labels for individual fixtures',
    icon: '💡',
    fields: ['Position', 'Channel', 'Color', 'Purpose']
  },
  {
    type: 'dimmer',
    name: 'Dimmer Labels',
    description: 'Labels for dimmer racks',
    icon: '🎛️',
    fields: ['Dimmer Number', 'Circuit', 'Load', 'Phase']
  },
  {
    type: 'custom',
    name: 'Custom Labels',
    description: 'Create your own label format',
    icon: '✏️',
    fields: []
  }
];

const LABEL_SIZES = {
  small: { name: '1/4" x 2"', width: 144, height: 18 },      // Dymo small
  medium: { name: '1/2" x 2"', width: 144, height: 36 },     // Dymo medium
  large: { name: '3/4" x 2.5"', width: 180, height: 54 }     // Brother
};

const PRINTERS = {
  'dymo-450': 'Dymo LabelWriter 450',
  'brother-pt': 'Brother P-Touch',
  'zebra': 'Zebra ZD420'
};

export function LabelDesigner() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const currentProjectId = routeProjectId || 'default-project';
  const { fixtures, loadFixtures } = useFixtureStore();
  const [projectName, setProjectName] = useState<string>('Untitled Project');

  // Label settings
  const [selectedTemplate, setSelectedTemplate] = useState<LabelType>('cable');
  const [labelSize, setLabelSize] = useState<LabelSize>('medium');
  const [printerType, setPrinterType] = useState<PrinterType>('dymo-450');
  const [labelText, setLabelText] = useState({
    line1: '',
    line2: '',
    line3: '',
    line4: ''
  });
  const [fontSize, setFontSize] = useState(12);
  const [isBold, setIsBold] = useState(false);
  const [showBorder, setShowBorder] = useState(false);

  // Batch label generation
  const [batchMode, setBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(10);

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

  // Update label preview when template changes
  useEffect(() => {
    const template = LABEL_TEMPLATES.find(t => t.type === selectedTemplate);
    if (template && template.type !== 'custom') {
      setLabelText({
        line1: template.fields[0] || '',
        line2: template.fields[1] || '',
        line3: template.fields[2] || '',
        line4: template.fields[3] || ''
      });
    }
  }, [selectedTemplate]);

  const sizeInfo = LABEL_SIZES[labelSize];

  const handlePrintLabels = () => {
    if (batchMode) {
      alert(`Printing ${batchCount} labels...`);
    } else {
      alert('Printing label...');
    }
    // TODO: Implement actual printing via Electron IPC
  };

  const handleExportLabels = () => {
    alert('Exporting labels to PDF/CSV...');
    // TODO: Implement export functionality
  };

  const handleGenerateFromFixtures = () => {
    alert(`Generate labels from ${fixtures.length} fixtures...`);
    // TODO: Implement fixture-based label generation
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
                <span className="text-lg text-gray-400">Label Designer</span>
              </div>
              <p className="text-sm text-gray-400">Design and print labels for your production</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLabels}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              💾 Export
            </button>
            <button
              onClick={handlePrintLabels}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Settings */}
        <div className="w-96 bg-gray-800 border-r border-gray-700 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Label Template</h3>
              <div className="space-y-2">
                {LABEL_TEMPLATES.map(template => (
                  <button
                    key={template.type}
                    onClick={() => setSelectedTemplate(template.type)}
                    className={`w-full text-left p-3 rounded transition ${
                      selectedTemplate === template.type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs opacity-75">{template.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Printer Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Printer</label>
              <select
                value={printerType}
                onChange={(e) => setPrinterType(e.target.value as PrinterType)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {Object.entries(PRINTERS).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            {/* Label Size */}
            <div>
              <label className="block text-sm font-medium mb-2">Label Size</label>
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as LabelSize)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {Object.entries(LABEL_SIZES).map(([key, info]) => (
                  <option key={key} value={key}>{info.name}</option>
                ))}
              </select>
            </div>

            {/* Label Text */}
            <div>
              <label className="block text-sm font-medium mb-2">Label Text</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Line 1"
                  value={labelText.line1}
                  onChange={(e) => setLabelText({ ...labelText, line1: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
                <input
                  type="text"
                  placeholder="Line 2"
                  value={labelText.line2}
                  onChange={(e) => setLabelText({ ...labelText, line2: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
                <input
                  type="text"
                  placeholder="Line 3 (optional)"
                  value={labelText.line3}
                  onChange={(e) => setLabelText({ ...labelText, line3: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
                <input
                  type="text"
                  placeholder="Line 4 (optional)"
                  value={labelText.line4}
                  onChange={(e) => setLabelText({ ...labelText, line4: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            {/* Formatting */}
            <div>
              <label className="block text-sm font-medium mb-2">Formatting</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="flex-1">Font Size:</label>
                  <input
                    type="number"
                    min="8"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bold"
                    checked={isBold}
                    onChange={(e) => setIsBold(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="bold">Bold Text</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="border"
                    checked={showBorder}
                    onChange={(e) => setShowBorder(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="border">Show Border</label>
                </div>
              </div>
            </div>

            {/* Batch Mode */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="batch"
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="batch" className="font-medium">Batch Print</label>
              </div>
              {batchMode && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex-1">Number of Labels:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={batchCount}
                      onChange={(e) => setBatchCount(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <button
                    onClick={handleGenerateFromFixtures}
                    className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                  >
                    Generate from Fixtures ({fixtures.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Preview</h2>

            <div className="bg-gray-800 rounded-lg p-8 mb-6">
              <div className="flex justify-center">
                {/* Label Preview */}
                <div
                  className="bg-white text-black relative"
                  style={{
                    width: `${sizeInfo.width * 2}px`,
                    height: `${sizeInfo.height * 2}px`,
                    border: showBorder ? '2px solid black' : 'none'
                  }}
                >
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-2">
                    {labelText.line1 && (
                      <div
                        style={{
                          fontSize: `${fontSize * 1.5}px`,
                          fontWeight: isBold ? 'bold' : 'normal'
                        }}
                      >
                        {labelText.line1}
                      </div>
                    )}
                    {labelText.line2 && (
                      <div
                        style={{
                          fontSize: `${fontSize * 1.2}px`,
                          fontWeight: isBold ? 'bold' : 'normal'
                        }}
                      >
                        {labelText.line2}
                      </div>
                    )}
                    {labelText.line3 && (
                      <div
                        style={{
                          fontSize: `${fontSize}px`,
                          fontWeight: isBold ? 'bold' : 'normal'
                        }}
                      >
                        {labelText.line3}
                      </div>
                    )}
                    {labelText.line4 && (
                      <div
                        style={{
                          fontSize: `${fontSize}px`,
                          fontWeight: isBold ? 'bold' : 'normal'
                        }}
                      >
                        {labelText.line4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center mt-4 text-sm text-gray-400">
                {sizeInfo.name} ({sizeInfo.width}px × {sizeInfo.height}px)
              </div>
            </div>

            {/* Example Labels */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Example Labels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Cable Label Example</div>
                  <div className="bg-white text-black p-2 text-center text-xs">
                    <div className="font-bold">MAIN STAGE LEFT</div>
                    <div>Circuits 1-12</div>
                    <div>To: SL Box 1</div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Circuit Label Example</div>
                  <div className="bg-white text-black p-2 text-center text-xs">
                    <div className="font-bold">CIRCUIT 24</div>
                    <div>Dimmer 3/6</div>
                    <div>1.2kW</div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Fixture Label Example</div>
                  <div className="bg-white text-black p-2 text-center text-xs">
                    <div className="font-bold">POS 12</div>
                    <div>CH 112</div>
                    <div>R80 • Downstage SR</div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Dimmer Label Example</div>
                  <div className="bg-white text-black p-2 text-center text-xs">
                    <div className="font-bold">DIMMER 3/6</div>
                    <div>Circuit 24</div>
                    <div>1200W • Phase A</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
        <div>ShowStack:Production - Label Designer</div>
        <div>v0.1.0-alpha</div>
      </footer>
    </div>
  );
}
