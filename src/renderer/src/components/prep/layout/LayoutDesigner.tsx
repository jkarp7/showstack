import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ElementPalette } from './ElementPalette';
import { LayoutCanvas } from './LayoutCanvas';
import { ElementInspector } from './ElementInspector';
import type {
  PageLayoutTemplate,
  LayoutElement,
  PrintSectionType,
  DataFieldConfig,
  TextConfig,
  ImageConfig,
  TableConfig,
  ShapeConfig,
  PrepProject
} from '../../../types/prep';

interface LayoutDesignerProps {
  projectId: string;
  pageType: PrintSectionType;
  onSave?: (template: PageLayoutTemplate) => void;
  onClose: () => void;
  initialTemplate?: PageLayoutTemplate;
}

export function LayoutDesigner({
  projectId,
  pageType,
  onSave,
  onClose,
  initialTemplate
}: LayoutDesignerProps) {
  // Initialize template
  const [template, setTemplate] = useState<PageLayoutTemplate>(() => {
    if (initialTemplate) {
      return initialTemplate;
    }

    // Create default template with temp ID
    const now = Date.now();
    return {
      id: `temp-${uuidv4()}`,
      prep_project_id: projectId,
      name: `${pageType} Layout`,
      page_type: pageType,
      grid_columns: 12,
      grid_rows: 20,
      grid_gap: 8,
      page_width: 816, // 8.5" at 96 DPI
      page_height: 1056, // 11" at 96 DPI
      elements: [],
      is_default: false,
      created_at: now,
      updated_at: now
    };
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggedPaletteElement, setDraggedPaletteElement] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<PageLayoutTemplate[]>([]);

  // Load available templates on mount
  useEffect(() => {
    async function loadTemplates() {
      try {
        const templates = await window.api.prep.layoutTemplates.getByProjectId(projectId, pageType);
        setAvailableTemplates(templates);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    }
    loadTemplates();
  }, [projectId, pageType]);

  // Get selected element
  const selectedElement = selectedElementId
    ? template.elements.find(el => el.id === selectedElementId) || null
    : null;

  // Handle drag start from palette
  const handlePaletteDragStart = useCallback((element: any) => {
    setDraggedPaletteElement(element);
  }, []);

  // Handle drag end from palette (cleanup)
  const handlePaletteDragEnd = useCallback(() => {
    // Clear dragged element after a brief delay to allow drop to process
    setTimeout(() => setDraggedPaletteElement(null), 100);
  }, []);

  // Handle drop on canvas
  const handleElementDrop = useCallback((gridColumn: number, gridRow: number) => {
    if (!draggedPaletteElement) return;

    const now = Date.now();
    const newElement: LayoutElement = {
      id: uuidv4(),
      element_type: draggedPaletteElement.type,
      config: createDefaultConfig(draggedPaletteElement),
      grid_column: gridColumn,
      grid_row: gridRow,
      column_span: getDefaultSpan(draggedPaletteElement.type).columnSpan,
      row_span: getDefaultSpan(draggedPaletteElement.type).rowSpan,
      layer: template.elements.length, // Place on top
      style: createDefaultStyle(draggedPaletteElement.type),
      created_at: now,
      updated_at: now
    };

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      updated_at: now
    }));

    setDraggedPaletteElement(null);
    setSelectedElementId(newElement.id);
    setHasChanges(true);
  }, [draggedPaletteElement, template.elements.length]);

  // Handle element move
  const handleElementMove = useCallback((elementId: string, gridColumn: number, gridRow: number) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId
          ? { ...el, grid_column: gridColumn, grid_row: gridRow, updated_at: Date.now() }
          : el
      ),
      updated_at: Date.now()
    }));
    setHasChanges(true);
  }, []);

  // Handle element resize
  const handleElementResize = useCallback((elementId: string, columnSpan: number, rowSpan: number) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId
          ? { ...el, column_span: columnSpan, row_span: rowSpan, updated_at: Date.now() }
          : el
      ),
      updated_at: Date.now()
    }));
    setHasChanges(true);
  }, []);

  // Handle element update from inspector
  const handleElementUpdate = useCallback((updates: Partial<LayoutElement>) => {
    if (!selectedElementId) return;

    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === selectedElementId
          ? { ...el, ...updates, updated_at: Date.now() }
          : el
      ),
      updated_at: Date.now()
    }));
    setHasChanges(true);
  }, [selectedElementId]);

  // Handle element delete
  const handleElementDelete = useCallback((elementId: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId),
      updated_at: Date.now()
    }));
    setSelectedElementId(null);
    setHasChanges(true);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      // Convert elements to database format (stringify JSON fields)
      const dbElements = template.elements.map(el => ({
        ...el,
        config: JSON.stringify(el.config),
        style: JSON.stringify(el.style)
      }));

      // Determine if this is a create or update operation
      const isNew = !template.id || template.id.startsWith('temp-');

      if (isNew) {
        // Create new template
        const result = await window.api.prep.layoutTemplates.create(
          {
            prep_project_id: projectId,
            name: template.name,
            description: template.description,
            page_type: pageType,
            grid_columns: template.grid_columns,
            grid_rows: template.grid_rows,
            grid_gap: template.grid_gap,
            page_width: template.page_width,
            page_height: template.page_height,
            is_default: template.is_default
          },
          dbElements
        );

        // Update template with returned ID
        const savedElements = await window.api.prep.layoutTemplates.getElements(result.id);

        const parsedElements = savedElements.map(el => ({
          ...el,
          config: JSON.parse(el.config),
          style: JSON.parse(el.style)
        }));

        setTemplate({
          ...result,
          elements: parsedElements
        });
      } else {
        // Update existing template
        await window.api.prep.layoutTemplates.update(
          template.id,
          {
            name: template.name,
            description: template.description,
            grid_columns: template.grid_columns,
            grid_rows: template.grid_rows,
            grid_gap: template.grid_gap,
            page_width: template.page_width,
            page_height: template.page_height,
            is_default: template.is_default
          },
          dbElements
        );
      }

      setHasChanges(false);

      // Call optional callback
      if (onSave) {
        onSave(template);
      }
    } catch (error) {
      console.error('Error saving layout template:', error);
      alert('Failed to save layout template. Please try again.');
    }
  }, [template, projectId, pageType, onSave]);

  // Handle load template
  const handleLoadTemplate = useCallback(async (templateId: string) => {
    try {
      const loadedTemplate = await window.api.prep.layoutTemplates.getById(templateId);
      const loadedElements = await window.api.prep.layoutTemplates.getElements(templateId);

      // Parse JSON fields
      const parsedElements = loadedElements.map(el => ({
        ...el,
        config: JSON.parse(el.config),
        style: JSON.parse(el.style)
      }));

      setTemplate({
        ...loadedTemplate,
        elements: parsedElements
      });

      setSelectedElementId(null);
      setHasChanges(false);
      setShowLoadDialog(false);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template. Please try again.');
    }
  }, []);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirm) return;
    }
    onClose();
  }, [hasChanges, onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Layout Designer</h2>
          <p className="text-sm text-gray-400 mt-1">
            Designing: <span className="text-white font-medium">{pageType}</span> page
            {hasChanges && <span className="text-yellow-500 ml-2">• Unsaved changes</span>}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {availableTemplates.length > 0 && (
            <button
              onClick={() => setShowLoadDialog(true)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
            >
              Load Template
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Layout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left: Element Palette */}
        <ElementPalette
          onDragStart={handlePaletteDragStart}
          onDragEnd={handlePaletteDragEnd}
        />

        {/* Center: Canvas */}
        <LayoutCanvas
          template={template}
          selectedElementId={selectedElementId}
          onElementSelect={setSelectedElementId}
          onElementDrop={handleElementDrop}
          onElementMove={handleElementMove}
          onElementResize={handleElementResize}
          onElementDelete={handleElementDelete}
        />

        {/* Right: Inspector */}
        <ElementInspector
          element={selectedElement}
          onUpdate={handleElementUpdate}
          onDelete={() => selectedElementId && handleElementDelete(selectedElementId)}
          maxColumns={template.grid_columns}
          maxRows={template.grid_rows}
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          💡 <span className="font-medium">Tip:</span> Drag elements from the palette onto the canvas, then use the inspector to customize
        </div>
        <div className="text-xs text-gray-500">
          Grid: {template.grid_columns}×{template.grid_rows} •
          Page: {template.page_width}×{template.page_height}px
        </div>
      </div>

      {/* Load Template Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">Load Template</h3>
              <p className="text-sm text-gray-400 mt-1">
                Select a saved layout template to load
              </p>
            </div>

            {/* Template List */}
            <div className="flex-1 overflow-y-auto p-6">
              {availableTemplates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No saved templates found for this page type
                </div>
              ) : (
                <div className="space-y-3">
                  {availableTemplates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleLoadTemplate(tmpl.id)}
                      className="w-full p-4 bg-gray-700 hover:bg-gray-650 border border-gray-600 hover:border-blue-500 rounded text-left transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                            {tmpl.name}
                          </div>
                          {tmpl.description && (
                            <div className="text-sm text-gray-400 mt-1">
                              {tmpl.description}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>
                              Grid: {tmpl.grid_columns}×{tmpl.grid_rows}
                            </span>
                            <span>
                              Page: {tmpl.page_width}×{tmpl.page_height}px
                            </span>
                            {tmpl.is_default === 1 && (
                              <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions

function createDefaultConfig(paletteElement: any): any {
  switch (paletteElement.type) {
    case 'dataField':
      return {
        fieldType: paletteElement.subType,
        showLabel: true,
        label: paletteElement.label
      } as DataFieldConfig;

    case 'text':
      return {
        content: 'Enter your text here...',
        placeholder: 'Text content'
      } as TextConfig;

    case 'image':
      return {
        src: '',
        altText: 'Image',
        objectFit: 'contain'
      } as ImageConfig;

    case 'table':
      return {
        contactTypes: ['gm', 'pm', 'ld'],
        showHeaders: true,
        columns: [
          { field: 'name', label: 'Name', width: 150 },
          { field: 'company', label: 'Company', width: 150 },
          { field: 'email', label: 'Email', width: 200 },
          { field: 'phone', label: 'Phone', width: 120 }
        ]
      } as TableConfig;

    case 'shape':
      return {
        shapeType: paletteElement.subType || 'rectangle',
        thickness: 1,
        color: '#000000'
      } as ShapeConfig;

    default:
      return {};
  }
}

function getDefaultSpan(elementType: string): { columnSpan: number; rowSpan: number } {
  switch (elementType) {
    case 'dataField':
      return { columnSpan: 4, rowSpan: 1 };
    case 'text':
      return { columnSpan: 6, rowSpan: 2 };
    case 'image':
      return { columnSpan: 4, rowSpan: 4 };
    case 'table':
      return { columnSpan: 12, rowSpan: 6 };
    case 'shape':
      return { columnSpan: 12, rowSpan: 1 };
    default:
      return { columnSpan: 3, rowSpan: 2 };
  }
}

function createDefaultStyle(elementType: string): any {
  const baseStyle = {
    fontFamily: 'Arial',
    fontSize: 12,
    fontWeight: 'normal' as const,
    textAlign: 'left' as const,
    color: '#000000',
    backgroundColor: 'transparent',
    padding: 8,
    borderWidth: 0,
    borderStyle: 'none' as const,
    borderColor: '#000000',
    borderRadius: 0,
    opacity: 1
  };

  switch (elementType) {
    case 'dataField':
      return { ...baseStyle, fontSize: 14, fontWeight: 'bold' as const };
    case 'text':
      return baseStyle;
    case 'shape':
      return { ...baseStyle, backgroundColor: '#000000', padding: 0 };
    default:
      return baseStyle;
  }
}
