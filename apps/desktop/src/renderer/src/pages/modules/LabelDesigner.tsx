import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logger } from '../../utils/logger';
import { useFixtureStore } from '../../store/fixtureStore';
import { promptAndMigrate, needsMigration } from '../../utils/shop-order/labelMigration';

type LabelType = 'cable' | 'circuit' | 'fixture' | 'dimmer' | 'custom';
type PrinterType = 'dymo-450' | 'brother-pt' | 'zebra' | 'avery-sheet';
type GraphicType = 'line' | 'rectangle' | 'circle' | 'text';

interface AveryTemplate {
  id: string;
  name: string;
  labelsPerSheet: number;
  columns: number;
  rows: number;
  labelWidth: number; // inches
  labelHeight: number; // inches
  marginTop: number;
  marginLeft: number;
  gapX: number;
  gapY: number;
}

interface LabelGraphic {
  id: string;
  type: GraphicType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  stroke?: boolean;
  strokeWidth?: number;
}

interface CustomLabelDesign {
  id: string;
  name: string;
  description: string;
  labelType: LabelType;
  printerType: PrinterType;
  averyTemplate?: string;
  width: number;
  height: number;
  graphics: LabelGraphic[];
  created: number;
  updated: number;
}

interface LabelTemplate {
  type: LabelType;
  name: string;
  description: string;
  fields: string[];
}

const LABEL_TEMPLATES: LabelTemplate[] = [
  {
    type: 'cable',
    name: 'Cable Labels',
    description: 'Labels for multi-cables and power cables',
    fields: ['Cable Name', 'Circuit Numbers', 'Destination', 'Notes'],
  },
  {
    type: 'circuit',
    name: 'Circuit Labels',
    description: 'Labels for circuit breakers and patch panels',
    fields: ['Circuit Number', 'Dimmer', 'Load', 'Location'],
  },
  {
    type: 'fixture',
    name: 'Fixture Labels',
    description: 'Labels for individual fixtures',
    fields: ['Position', 'Channel', 'Color', 'Purpose'],
  },
  {
    type: 'dimmer',
    name: 'Dimmer Labels',
    description: 'Labels for dimmer racks',
    fields: ['Dimmer Number', 'Circuit', 'Load', 'Phase'],
  },
  {
    type: 'custom',
    name: 'Custom Labels',
    description: 'Create your own label format',
    fields: [],
  },
];

// Popular Avery label templates
const AVERY_TEMPLATES: AveryTemplate[] = [
  {
    id: '5160',
    name: 'Avery 5160 - Address Labels (1" × 2-5/8")',
    labelsPerSheet: 30,
    columns: 3,
    rows: 10,
    labelWidth: 2.625,
    labelHeight: 1,
    marginTop: 0.5,
    marginLeft: 0.1875,
    gapX: 0.125,
    gapY: 0,
  },
  {
    id: '5163',
    name: 'Avery 5163 - Shipping Labels (2" × 4")',
    labelsPerSheet: 10,
    columns: 2,
    rows: 5,
    labelWidth: 4,
    labelHeight: 2,
    marginTop: 0.5,
    marginLeft: 0.15625,
    gapX: 0.1875,
    gapY: 0,
  },
  {
    id: '5164',
    name: 'Avery 5164 - Shipping Labels (3-1/3" × 4")',
    labelsPerSheet: 6,
    columns: 2,
    rows: 3,
    labelWidth: 4,
    labelHeight: 3.33,
    marginTop: 0.5,
    marginLeft: 0.15625,
    gapX: 0.1875,
    gapY: 0,
  },
  {
    id: '8160',
    name: 'Avery 8160 - White Address Labels (1" × 2-5/8")',
    labelsPerSheet: 30,
    columns: 3,
    rows: 10,
    labelWidth: 2.625,
    labelHeight: 1,
    marginTop: 0.5,
    marginLeft: 0.21875,
    gapX: 0.125,
    gapY: 0,
  },
  {
    id: '5167',
    name: 'Avery 5167 - Return Address (1/2" × 1-3/4")',
    labelsPerSheet: 80,
    columns: 4,
    rows: 20,
    labelWidth: 1.75,
    labelHeight: 0.5,
    marginTop: 0.5,
    marginLeft: 0.3125,
    gapX: 0.1875,
    gapY: 0,
  },
];

const PRINTERS = {
  'dymo-450': 'Dymo LabelWriter 450',
  'brother-pt': 'Brother P-Touch',
  zebra: 'Zebra ZD420',
  'avery-sheet': 'Avery Sheet Labels (Standard Printer)',
};

export function LabelDesigner() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const currentProjectId = routeProjectId || 'default-project';
  const { fixtures, loadFixtures } = useFixtureStore();
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Label settings
  const [selectedTemplate, setSelectedTemplate] = useState<LabelType>('cable');
  const [printerType, setPrinterType] = useState<PrinterType>('avery-sheet');
  const [averyTemplate, setAveryTemplate] = useState<string>('5160');
  const [graphics, setGraphics] = useState<LabelGraphic[]>([]);
  const [selectedGraphic, setSelectedGraphic] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<GraphicType>('text');

  // Custom designs management
  const [customDesigns, setCustomDesigns] = useState<CustomLabelDesign[]>([]);
  const [currentDesign, setCurrentDesign] = useState<CustomLabelDesign | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDesignName, setSaveDesignName] = useState('');
  const [saveDesignDescription, setSaveDesignDescription] = useState('');
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // Canvas state
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Batch label generation
  const [batchMode, setBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(10);

  // Get current dimensions
  const currentAveryTemplate = AVERY_TEMPLATES.find((t) => t.id === averyTemplate);
  const labelWidth =
    printerType === 'avery-sheet' && currentAveryTemplate
      ? currentAveryTemplate.labelWidth * 96 // Convert inches to pixels (96 DPI)
      : printerType === 'dymo-450'
        ? 144
        : printerType === 'brother-pt'
          ? 180
          : 144;
  const labelHeight =
    printerType === 'avery-sheet' && currentAveryTemplate
      ? currentAveryTemplate.labelHeight * 96
      : printerType === 'dymo-450'
        ? 36
        : printerType === 'brother-pt'
          ? 54
          : 36;

  // Load fixtures, project info, and custom designs
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
        logger.error('Failed to load project info:', error);
      }
    };

    const loadCustomDesigns = () => {
      try {
        const stored = localStorage.getItem(`showstack_labelDesigns_${currentProjectId}`);
        if (stored) {
          const designs = JSON.parse(stored) as CustomLabelDesign[];
          setCustomDesigns(designs);
        }
      } catch (error) {
        logger.error('Failed to load custom designs:', error);
      }
    };

    loadProjectInfo();
    loadCustomDesigns();
  }, [loadFixtures, currentProjectId]);

  // Check for label migration needs
  useEffect(() => {
    const checkMigration = async () => {
      if (currentProjectId && needsMigration(currentProjectId)) {
        // Prompt user and migrate if they confirm
        await promptAndMigrate(currentProjectId);
        // Reload page to show migrated designs
        window.location.reload();
      }
    };

    checkMigration();
  }, [currentProjectId]);

  // Initialize canvas with default labels
  useEffect(() => {
    if (selectedTemplate !== 'custom' && graphics.length === 0) {
      const template = LABEL_TEMPLATES.find((t) => t.type === selectedTemplate);
      if (template) {
        const newGraphics: LabelGraphic[] = template.fields.map((field, i) => ({
          id: `text-${Date.now()}-${i}`,
          type: 'text',
          x: labelWidth / 2,
          y: 20 + i * 25,
          text: field,
          fontSize: 12,
          fontWeight: 'normal',
        }));
        setGraphics(newGraphics);
      }
    }
  }, [selectedTemplate, labelWidth]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, labelWidth, labelHeight);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, labelWidth, labelHeight);

    // Draw graphics
    graphics.forEach((graphic) => {
      ctx.save();

      if (graphic.id === selectedGraphic) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
      } else {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = graphic.strokeWidth || 1;
        ctx.setLineDash([]);
      }

      switch (graphic.type) {
        case 'text':
          ctx.fillStyle = '#000000';
          ctx.font = `${graphic.fontWeight === 'bold' ? 'bold ' : ''}${graphic.fontSize || 12}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(graphic.text || '', graphic.x, graphic.y);
          break;

        case 'rectangle':
          if (graphic.stroke) {
            ctx.strokeRect(graphic.x, graphic.y, graphic.width || 50, graphic.height || 30);
          } else {
            ctx.fillStyle = '#000000';
            ctx.fillRect(graphic.x, graphic.y, graphic.width || 50, graphic.height || 30);
          }
          break;

        case 'line':
          ctx.beginPath();
          ctx.moveTo(graphic.x, graphic.y);
          ctx.lineTo(graphic.x + (graphic.width || 50), graphic.y + (graphic.height || 0));
          ctx.stroke();
          break;

        case 'circle':
          ctx.beginPath();
          ctx.arc(graphic.x, graphic.y, graphic.radius || 20, 0, 2 * Math.PI);
          if (graphic.stroke) {
            ctx.stroke();
          } else {
            ctx.fillStyle = '#000000';
            ctx.fill();
          }
          break;
      }

      ctx.restore();
    });
  }, [graphics, selectedGraphic, labelWidth, labelHeight]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing graphic
    for (let i = graphics.length - 1; i >= 0; i--) {
      const g = graphics[i];
      const isHit =
        g.type === 'text'
          ? Math.abs(g.x - x) < 50 && Math.abs(g.y - y) < 10
          : g.type === 'rectangle'
            ? x >= g.x && x <= g.x + (g.width || 0) && y >= g.y && y <= g.y + (g.height || 0)
            : g.type === 'circle'
              ? Math.sqrt((g.x - x) ** 2 + (g.y - y) ** 2) <= (g.radius || 0)
              : false;

      if (isHit) {
        setSelectedGraphic(g.id);
        return;
      }
    }

    // Add new graphic
    if (selectedTool === 'text') {
      const newGraphic: LabelGraphic = {
        id: `text-${Date.now()}`,
        type: 'text',
        x,
        y,
        text: 'Label Text',
        fontSize: 12,
        fontWeight: 'normal',
      };
      setGraphics([...graphics, newGraphic]);
      setSelectedGraphic(newGraphic.id);
    } else if (selectedTool === 'circle') {
      const newGraphic: LabelGraphic = {
        id: `circle-${Date.now()}`,
        type: 'circle',
        x,
        y,
        radius: 20,
        stroke: true,
        strokeWidth: 2,
      };
      setGraphics([...graphics, newGraphic]);
      setSelectedGraphic(newGraphic.id);
    } else {
      setDragStart({ x, y });
      setIsDrawing(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update temporary graphic
    const width = x - dragStart.x;
    const height = y - dragStart.y;

    // Preview on canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Redraw to show preview
      ctx.strokeStyle = '#3b82f6';
      ctx.setLineDash([5, 5]);
      if (selectedTool === 'rectangle') {
        ctx.strokeRect(dragStart.x, dragStart.y, width, height);
      } else if (selectedTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(dragStart.x, dragStart.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = x - dragStart.x;
    const height = y - dragStart.y;

    if (selectedTool === 'rectangle') {
      const newGraphic: LabelGraphic = {
        id: `rect-${Date.now()}`,
        type: 'rectangle',
        x: dragStart.x,
        y: dragStart.y,
        width: Math.abs(width),
        height: Math.abs(height),
        stroke: true,
        strokeWidth: 2,
      };
      setGraphics([...graphics, newGraphic]);
      setSelectedGraphic(newGraphic.id);
    } else if (selectedTool === 'line') {
      const newGraphic: LabelGraphic = {
        id: `line-${Date.now()}`,
        type: 'line',
        x: dragStart.x,
        y: dragStart.y,
        width: width,
        height: height,
        strokeWidth: 2,
      };
      setGraphics([...graphics, newGraphic]);
      setSelectedGraphic(newGraphic.id);
    }

    setIsDrawing(false);
    setDragStart(null);
  };

  const updateSelectedGraphic = (updates: Partial<LabelGraphic>) => {
    if (!selectedGraphic) return;
    setGraphics(graphics.map((g) => (g.id === selectedGraphic ? { ...g, ...updates } : g)));
  };

  const deleteSelectedGraphic = () => {
    if (!selectedGraphic) return;
    setGraphics(graphics.filter((g) => g.id !== selectedGraphic));
    setSelectedGraphic(null);
  };

  const handleUseTemplate = (templateType: LabelType) => {
    const template = LABEL_TEMPLATES.find((t) => t.type === templateType);
    if (!template) return;

    let newGraphics: LabelGraphic[] = [];

    // Create pre-designed templates based on type
    switch (templateType) {
      case 'cable':
        newGraphics = [
          {
            id: `text-${Date.now()}-1`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.25,
            text: 'CABLE NAME',
            fontSize: 16,
            fontWeight: 'bold',
          },
          {
            id: `line-${Date.now()}-1`,
            type: 'line',
            x: 10,
            y: labelHeight * 0.45,
            width: labelWidth - 20,
            height: 0,
            strokeWidth: 2,
          },
          {
            id: `text-${Date.now()}-2`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.65,
            text: 'Circuits 1-12',
            fontSize: 12,
            fontWeight: 'normal',
          },
          {
            id: `text-${Date.now()}-3`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.85,
            text: 'To: Location',
            fontSize: 10,
            fontWeight: 'normal',
          },
        ];
        break;

      case 'circuit':
        newGraphics = [
          {
            id: `rect-${Date.now()}-1`,
            type: 'rectangle',
            x: 5,
            y: 5,
            width: labelWidth - 10,
            height: labelHeight - 10,
            stroke: true,
            strokeWidth: 2,
          },
          {
            id: `text-${Date.now()}-1`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.3,
            text: 'CKT 24',
            fontSize: 18,
            fontWeight: 'bold',
          },
          {
            id: `text-${Date.now()}-2`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.55,
            text: 'Dimmer 3/6',
            fontSize: 12,
            fontWeight: 'normal',
          },
          {
            id: `text-${Date.now()}-3`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.75,
            text: '1.2kW',
            fontSize: 10,
            fontWeight: 'normal',
          },
        ];
        break;

      case 'fixture':
        newGraphics = [
          {
            id: `text-${Date.now()}-1`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.25,
            text: 'POS 12',
            fontSize: 14,
            fontWeight: 'bold',
          },
          {
            id: `text-${Date.now()}-2`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.5,
            text: 'CH 112',
            fontSize: 14,
            fontWeight: 'bold',
          },
          {
            id: `text-${Date.now()}-3`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.75,
            text: 'R80 • Purpose',
            fontSize: 10,
            fontWeight: 'normal',
          },
        ];
        break;

      case 'dimmer':
        newGraphics = [
          {
            id: `rect-${Date.now()}-1`,
            type: 'rectangle',
            x: 5,
            y: 5,
            width: labelWidth - 10,
            height: labelHeight - 10,
            stroke: true,
            strokeWidth: 3,
          },
          {
            id: `text-${Date.now()}-1`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.3,
            text: 'DIMMER 3/6',
            fontSize: 16,
            fontWeight: 'bold',
          },
          {
            id: `text-${Date.now()}-2`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.55,
            text: 'Circuit 24',
            fontSize: 12,
            fontWeight: 'normal',
          },
          {
            id: `text-${Date.now()}-3`,
            type: 'text',
            x: labelWidth / 2,
            y: labelHeight * 0.75,
            text: '1200W • Phase A',
            fontSize: 10,
            fontWeight: 'normal',
          },
        ];
        break;

      default:
        // Custom - start blank
        newGraphics = [];
    }

    setGraphics(newGraphics);
    setSelectedGraphic(null);
    setSelectedTemplate(templateType);
  };

  const handleSaveDesign = () => {
    const design: CustomLabelDesign = {
      id: currentDesign?.id || `design-${Date.now()}`,
      name: saveDesignName,
      description: saveDesignDescription,
      labelType: selectedTemplate,
      printerType,
      averyTemplate: printerType === 'avery-sheet' ? averyTemplate : undefined,
      width: labelWidth,
      height: labelHeight,
      graphics: graphics,
      created: currentDesign?.created || Date.now(),
      updated: Date.now(),
    };

    const updatedDesigns = currentDesign
      ? customDesigns.map((d) => (d.id === design.id ? design : d))
      : [...customDesigns, design];

    setCustomDesigns(updatedDesigns);
    localStorage.setItem(
      `showstack_labelDesigns_${currentProjectId}`,
      JSON.stringify(updatedDesigns),
    );

    setCurrentDesign(design);
    setShowSaveDialog(false);
    setSaveDesignName('');
    setSaveDesignDescription('');
  };

  const handleLoadDesign = (design: CustomLabelDesign) => {
    setCurrentDesign(design);
    setSelectedTemplate(design.labelType);
    setPrinterType(design.printerType);
    if (design.averyTemplate) setAveryTemplate(design.averyTemplate);
    setGraphics(design.graphics);
    setShowLoadDialog(false);
  };

  const handleDeleteDesign = (designId: string) => {
    if (!confirm('Delete this label design?')) return;
    const updatedDesigns = customDesigns.filter((d) => d.id !== designId);
    setCustomDesigns(updatedDesigns);
    localStorage.setItem(
      `showstack_labelDesigns_${currentProjectId}`,
      JSON.stringify(updatedDesigns),
    );
    if (currentDesign?.id === designId) setCurrentDesign(null);
  };

  const handlePrintLabels = () => {
    if (printerType === 'avery-sheet' && currentAveryTemplate) {
      alert(
        `Printing ${currentAveryTemplate.labelsPerSheet} labels per sheet (${currentAveryTemplate.name})...`,
      );
    } else if (batchMode) {
      alert(`Printing ${batchCount} labels on ${PRINTERS[printerType]}...`);
    } else {
      alert(`Printing label on ${PRINTERS[printerType]}...`);
    }
    // TODO: Implement actual printing via Electron IPC
  };

  const handleExportLabels = () => {
    alert('Exporting labels to PDF...');
    // TODO: Implement PDF export
  };

  const selectedGraphicData = graphics.find((g) => g.id === selectedGraphic);

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{projectName}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentDesign ? `Editing: ${currentDesign.name}` : 'Design professional labels'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLoadDialog(true)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
            >
              Load Design
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
            >
              Save Design
            </button>
            <button
              onClick={handleExportLabels}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
            >
              Export PDF
            </button>
            <button
              onClick={handlePrintLabels}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
            >
              Print
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel - Tools & Settings */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Drawing Tools */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400 uppercase">
                Drawing Tools
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedTool('text')}
                  className={`p-3 rounded text-sm transition ${
                    selectedTool === 'text'
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setSelectedTool('rectangle')}
                  className={`p-3 rounded text-sm transition ${
                    selectedTool === 'rectangle'
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  Rectangle
                </button>
                <button
                  onClick={() => setSelectedTool('circle')}
                  className={`p-3 rounded text-sm transition ${
                    selectedTool === 'circle'
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  Circle
                </button>
                <button
                  onClick={() => setSelectedTool('line')}
                  className={`p-3 rounded text-sm transition ${
                    selectedTool === 'line'
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  Line
                </button>
              </div>
            </div>

            {/* Selected Graphic Properties */}
            {selectedGraphicData && (
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    {selectedGraphicData.type} Properties
                  </h3>
                  <button
                    onClick={deleteSelectedGraphic}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Delete
                  </button>
                </div>

                {selectedGraphicData.type === 'text' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Text"
                      value={selectedGraphicData.text || ''}
                      onChange={(e) => updateSelectedGraphic({ text: e.target.value })}
                      className="w-full px-2 py-1 bg-gray-300 dark:bg-gray-600 border border-gray-500 rounded text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="8"
                        max="48"
                        value={selectedGraphicData.fontSize || 12}
                        onChange={(e) =>
                          updateSelectedGraphic({ fontSize: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 bg-gray-300 dark:bg-gray-600 border border-gray-500 rounded text-sm"
                      />
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={selectedGraphicData.fontWeight === 'bold'}
                          onChange={(e) =>
                            updateSelectedGraphic({
                              fontWeight: e.target.checked ? 'bold' : 'normal',
                            })
                          }
                        />
                        <span className="text-sm">Bold</span>
                      </label>
                    </div>
                  </div>
                )}

                {selectedGraphicData.type === 'rectangle' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Width"
                        value={selectedGraphicData.width || 50}
                        onChange={(e) => updateSelectedGraphic({ width: Number(e.target.value) })}
                        className="flex-1 px-2 py-1 bg-gray-300 dark:bg-gray-600 border border-gray-500 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        value={selectedGraphicData.height || 30}
                        onChange={(e) => updateSelectedGraphic({ height: Number(e.target.value) })}
                        className="flex-1 px-2 py-1 bg-gray-300 dark:bg-gray-600 border border-gray-500 rounded text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={selectedGraphicData.stroke}
                        onChange={(e) => updateSelectedGraphic({ stroke: e.target.checked })}
                      />
                      <span className="text-sm">Outline only</span>
                    </label>
                  </div>
                )}

                {selectedGraphicData.type === 'circle' && (
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Radius"
                      value={selectedGraphicData.radius || 20}
                      onChange={(e) => updateSelectedGraphic({ radius: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-300 dark:bg-gray-600 border border-gray-500 rounded text-sm"
                    />
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={selectedGraphicData.stroke}
                        onChange={(e) => updateSelectedGraphic({ stroke: e.target.checked })}
                      />
                      <span className="text-sm">Outline only</span>
                    </label>
                  </div>
                )}

                {(selectedGraphicData.type === 'line' || selectedGraphicData.stroke) && (
                  <div>
                    <label className="block text-sm mb-1">Line Width</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={selectedGraphicData.strokeWidth || 1}
                      onChange={(e) =>
                        updateSelectedGraphic({ strokeWidth: Number(e.target.value) })
                      }
                      className="w-20 px-2 py-1 bg-gray-300 dark:bg-gray-600 border border-gray-500 rounded text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Quick Templates */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400 uppercase">
                Quick Templates
              </h3>
              <div className="space-y-2">
                {LABEL_TEMPLATES.filter((t) => t.type !== 'custom').map((template) => (
                  <button
                    key={template.type}
                    onClick={() => handleUseTemplate(template.type)}
                    className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400 uppercase">
                Quick Actions
              </h3>
              <button
                onClick={() => {
                  setGraphics([]);
                  setSelectedGraphic(null);
                }}
                className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
              >
                Clear All
              </button>
            </div>

            {/* Printer Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Printer Type</label>
              <select
                value={printerType}
                onChange={(e) => setPrinterType(e.target.value as PrinterType)}
                className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
              >
                {Object.entries(PRINTERS).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Avery Template Selection */}
            {printerType === 'avery-sheet' && (
              <div>
                <label className="block text-sm font-medium mb-2">Avery Template</label>
                <select
                  value={averyTemplate}
                  onChange={(e) => setAveryTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                >
                  {AVERY_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {currentAveryTemplate && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {currentAveryTemplate.labelsPerSheet} labels per sheet (
                    {currentAveryTemplate.columns} × {currentAveryTemplate.rows})
                  </div>
                )}
              </div>
            )}

            {/* Batch Mode */}
            {printerType !== 'avery-sheet' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="batch"
                    checked={batchMode}
                    onChange={(e) => setBatchMode(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="batch" className="text-sm font-medium">
                    Batch Print
                  </label>
                </div>
                {batchMode && (
                  <div className="flex items-center gap-2">
                    <label className="flex-1 text-sm">Number:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={batchCount}
                      onChange={(e) => setBatchCount(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Canvas Preview */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Label Preview</h2>
              <div className="flex items-center gap-4">
                {printerType === 'avery-sheet' && (
                  <button
                    onClick={() => {
                      // Open visual designer for the selected Avery template
                      navigate(`/project/${currentProjectId}/prep/label-designer/${averyTemplate}`);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit with Visual Designer
                  </button>
                )}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round((labelWidth / 96) * 10) / 10}" ×{' '}
                  {Math.round((labelHeight / 96) * 10) / 10}" ({labelWidth}px × {labelHeight}px)
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-6 flex justify-center">
              <canvas
                ref={canvasRef}
                width={labelWidth}
                height={labelHeight}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="border-2 border-gray-600 cursor-crosshair"
                style={{
                  maxWidth: '100%',
                  imageRendering: 'crisp-edges',
                }}
              />
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>• Click to add {selectedTool} elements</p>
              <p>• Click and drag for rectangles and lines</p>
              <p>• Click an element to select and edit properties</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Design Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Save Label Design</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Design Name</label>
                <input
                  type="text"
                  value={saveDesignName}
                  onChange={(e) => setSaveDesignName(e.target.value)}
                  placeholder="My Cable Labels"
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={saveDesignDescription}
                  onChange={(e) => setSaveDesignDescription(e.target.value)}
                  placeholder="Description of this label design..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDesign}
                  disabled={!saveDesignName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50"
                >
                  Save Design
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Design Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Load Label Design</h2>
            {customDesigns.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <p className="mb-4">No saved designs yet</p>
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
                  {customDesigns.map((design) => (
                    <div
                      key={design.id}
                      className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-300 dark:bg-gray-600 transition cursor-pointer group"
                      onClick={() => handleLoadDesign(design)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{design.name}</h3>
                          {design.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {design.description}
                            </p>
                          )}
                          <div className="text-xs text-gray-500">
                            {PRINTERS[design.printerType]}
                            {design.averyTemplate && ` - Avery ${design.averyTemplate}`}
                            {' • '}
                            {new Date(design.updated).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDesign(design.id);
                          }}
                          className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
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
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
        <div>ShowStack:Lighting - Label Designer</div>
        <div>
          {customDesigns.length} saved design{customDesigns.length !== 1 ? 's' : ''}
        </div>
      </footer>
    </div>
  );
}
