import { useState } from 'react';
import type {
  LayoutElement,
  ElementStyle,
  DataFieldConfig,
  TextConfig,
  ImageConfig,
  TableConfig,
  ShapeConfig,
  DataFieldType,
  ShapeType
} from '../../../types/prep';

interface ElementInspectorProps {
  element: LayoutElement | null;
  onUpdate: (updates: Partial<LayoutElement>) => void;
  onDelete: () => void;
  maxColumns: number;
  maxRows: number;
}

export function ElementInspector({
  element,
  onUpdate,
  onDelete,
  maxColumns,
  maxRows
}: ElementInspectorProps) {
  const [activeSection, setActiveSection] = useState<'config' | 'style' | 'position'>('config');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  if (!element) {
    return (
      <div className="w-80 bg-gray-800 border border-gray-700 rounded-lg p-6 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">👆</div>
          <div className="text-sm">Select an element to edit</div>
        </div>
      </div>
    );
  }

  const updateConfig = (configUpdates: Partial<any>) => {
    onUpdate({
      config: { ...element.config, ...configUpdates }
    });
  };

  const updateStyle = (styleUpdates: Partial<ElementStyle>) => {
    onUpdate({
      style: { ...element.style, ...styleUpdates }
    });
  };

  const updatePosition = (positionUpdates: Partial<{
    grid_column: number;
    grid_row: number;
    column_span: number;
    row_span: number;
    layer: number;
  }>) => {
    onUpdate(positionUpdates);
  };

  return (
    <div className="w-80 bg-gray-800 border border-gray-700 rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase">Element Inspector</h3>
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white text-xs rounded transition"
          >
            Delete
          </button>
        </div>

        <div className="text-xs text-gray-400 mb-3">
          Type: <span className="text-gray-900 dark:text-white font-mono">{element.element_type}</span>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSection('config')}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition ${
              activeSection === 'config'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Config
          </button>
          <button
            onClick={() => setActiveSection('style')}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition ${
              activeSection === 'style'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Style
          </button>
          <button
            onClick={() => setActiveSection('position')}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition ${
              activeSection === 'position'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Position
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeSection === 'config' && (
          <>
            {/* Data Field Configuration */}
            {element.element_type === 'dataField' && (
              <ConfigSection title="Data Field">
                <FormField label="Field Type">
                  <select
                    value={(element.config as DataFieldConfig).fieldType}
                    onChange={(e) => updateConfig({ fieldType: e.target.value as DataFieldType })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                  >
                    <option value="production_name">Production Name</option>
                    <option value="venue">Venue</option>
                    <option value="venue_city">Venue City</option>
                    <option value="venue_state">Venue State</option>
                    <option value="order_date">Order Date</option>
                    <option value="load_in_date">Load In Date</option>
                    <option value="opening_night_date">Opening Night</option>
                    <option value="closing_date">Closing Date</option>
                    <option value="gm_name">GM Name</option>
                    <option value="pm_name">PM Name</option>
                    <option value="ld_name">LD Name</option>
                    <option value="logo">Logo</option>
                  </select>
                </FormField>

                <FormField label="Label">
                  <input
                    type="text"
                    value={(element.config as DataFieldConfig).label || ''}
                    onChange={(e) => updateConfig({ label: e.target.value })}
                    placeholder="Optional label"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                  />
                </FormField>

                <FormField label="">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(element.config as DataFieldConfig).showLabel || false}
                      onChange={(e) => updateConfig({ showLabel: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Show label</span>
                  </label>
                </FormField>
              </ConfigSection>
            )}

            {/* Text Configuration */}
            {element.element_type === 'text' && (
              <ConfigSection title="Text Content">
                <FormField label="Content">
                  <textarea
                    value={(element.config as TextConfig).content}
                    onChange={(e) => updateConfig({ content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                  />
                </FormField>
              </ConfigSection>
            )}

            {/* Image Configuration */}
            {element.element_type === 'image' && (
              <ConfigSection title="Image">
                <FormField label="Source URL">
                  <input
                    type="text"
                    value={(element.config as ImageConfig).src || ''}
                    onChange={(e) => updateConfig({ src: e.target.value })}
                    placeholder="https://... or base64"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                  />
                </FormField>

                <FormField label="Object Fit">
                  <select
                    value={(element.config as ImageConfig).objectFit || 'contain'}
                    onChange={(e) => updateConfig({ objectFit: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                  >
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                  </select>
                </FormField>
              </ConfigSection>
            )}

            {/* Shape Configuration */}
            {element.element_type === 'shape' && (
              <ConfigSection title="Shape">
                <FormField label="Shape Type">
                  <select
                    value={(element.config as ShapeConfig).shapeType}
                    onChange={(e) => updateConfig({ shapeType: e.target.value as ShapeType })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="line">Line</option>
                    <option value="divider">Divider</option>
                  </select>
                </FormField>

                <FormField label="Color">
                  <input
                    type="color"
                    value={(element.config as ShapeConfig).color || '#000000'}
                    onChange={(e) => updateConfig({ color: e.target.value })}
                    className="w-full h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                  />
                </FormField>

                <FormField label="Thickness (px)">
                  <input
                    type="number"
                    value={(element.config as ShapeConfig).thickness || 1}
                    onChange={(e) => updateConfig({ thickness: parseInt(e.target.value) })}
                    min="1"
                    max="20"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                  />
                </FormField>
              </ConfigSection>
            )}

            {/* Table Configuration */}
            {element.element_type === 'table' && (
              <ConfigSection title="Contact Table">
                <FormField label="">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(element.config as TableConfig).showHeaders !== false}
                      onChange={(e) => updateConfig({ showHeaders: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Show headers</span>
                  </label>
                </FormField>
                <div className="text-xs text-gray-500 mt-2">
                  Table columns are configured automatically based on contact types
                </div>
              </ConfigSection>
            )}
          </>
        )}

        {activeSection === 'style' && (
          <>
            {/* Typography */}
            <CollapsibleSection
              id="typography"
              title="Typography"
              icon="🔤"
              isCollapsed={collapsedSections.has('typography')}
              onToggle={toggleSection}
            >
              <FormField label="Font Family">
                <select
                  value={element.style.fontFamily || 'Arial'}
                  onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </FormField>

              <FormField label="Font Size (px)">
                <input
                  type="number"
                  value={element.style.fontSize || 12}
                  onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
                  min="6"
                  max="72"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>

              <FormField label="Font Weight">
                <select
                  value={element.style.fontWeight || 'normal'}
                  onChange={(e) => updateStyle({ fontWeight: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="300">Light</option>
                  <option value="500">Medium</option>
                  <option value="600">Semi Bold</option>
                  <option value="700">Bold</option>
                  <option value="900">Black</option>
                </select>
              </FormField>

              <FormField label="Text Align">
                <select
                  value={element.style.textAlign || 'left'}
                  onChange={(e) => updateStyle({ textAlign: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </FormField>
            </CollapsibleSection>

            {/* Colors */}
            <CollapsibleSection
              id="colors"
              title="Colors"
              icon="🎨"
              isCollapsed={collapsedSections.has('colors')}
              onToggle={toggleSection}
            >
              <FormField label="Text Color">
                <input
                  type="color"
                  value={element.style.color || '#000000'}
                  onChange={(e) => updateStyle({ color: e.target.value })}
                  className="w-full h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                />
              </FormField>

              <FormField label="Background Color">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={element.style.backgroundColor || '#ffffff'}
                    onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                    className="flex-1 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                  />
                  <button
                    onClick={() => updateStyle({ backgroundColor: 'transparent' })}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-900 dark:text-white text-xs rounded transition"
                  >
                    Clear
                  </button>
                </div>
              </FormField>
            </CollapsibleSection>

            {/* Borders */}
            <CollapsibleSection
              id="borders"
              title="Borders"
              icon="🔲"
              isCollapsed={collapsedSections.has('borders')}
              onToggle={toggleSection}
            >
              <FormField label="Border Width (px)">
                <input
                  type="number"
                  value={element.style.borderWidth || 0}
                  onChange={(e) => updateStyle({ borderWidth: parseInt(e.target.value) })}
                  min="0"
                  max="20"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                />
              </FormField>

              <FormField label="Border Style">
                <select
                  value={element.style.borderStyle || 'solid'}
                  onChange={(e) => updateStyle({ borderStyle: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                >
                  <option value="none">None</option>
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </FormField>

              <FormField label="Border Color">
                <input
                  type="color"
                  value={element.style.borderColor || '#000000'}
                  onChange={(e) => updateStyle({ borderColor: e.target.value })}
                  className="w-full h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                />
              </FormField>

              <FormField label="Border Radius (px)">
                <input
                  type="number"
                  value={element.style.borderRadius || 0}
                  onChange={(e) => updateStyle({ borderRadius: parseInt(e.target.value) })}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                />
              </FormField>
            </CollapsibleSection>

            {/* Spacing */}
            <CollapsibleSection
              id="spacing"
              title="Spacing"
              icon="📏"
              isCollapsed={collapsedSections.has('spacing')}
              onToggle={toggleSection}
            >
              <FormField label="Padding (px)">
                <input
                  type="number"
                  value={element.style.padding || 8}
                  onChange={(e) => updateStyle({ padding: parseInt(e.target.value) })}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                />
              </FormField>

              <FormField label="Opacity">
                <input
                  type="range"
                  value={element.style.opacity !== undefined ? element.style.opacity : 1}
                  onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) })}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round((element.style.opacity || 1) * 100)}%
                </div>
              </FormField>
            </CollapsibleSection>
          </>
        )}

        {activeSection === 'position' && (
          <>
            {/* Grid Position */}
            <CollapsibleSection
              id="grid-position"
              title="Grid Position"
              icon="📍"
              isCollapsed={collapsedSections.has('grid-position')}
              onToggle={toggleSection}
            >
              <FormField label="Column">
                <input
                  type="number"
                  value={element.grid_column}
                  onChange={(e) => updatePosition({ grid_column: Math.max(0, Math.min(maxColumns - 1, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max={maxColumns - 1}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                />
              </FormField>

              <FormField label="Row">
                <input
                  type="number"
                  value={element.grid_row}
                  onChange={(e) => updatePosition({ grid_row: Math.max(0, Math.min(maxRows - 1, parseInt(e.target.value) || 0)) })}
                  min="0"
                  max={maxRows - 1}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                />
              </FormField>
            </CollapsibleSection>

            {/* Size */}
            <CollapsibleSection
              id="size"
              title="Size"
              icon="📐"
              isCollapsed={collapsedSections.has('size')}
              onToggle={toggleSection}
            >
              <FormField label="Column Span">
                <input
                  type="number"
                  value={element.column_span}
                  onChange={(e) => updatePosition({ column_span: Math.max(1, Math.min(maxColumns - element.grid_column, parseInt(e.target.value) || 1)) })}
                  min="1"
                  max={maxColumns - element.grid_column}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                />
              </FormField>

              <FormField label="Row Span">
                <input
                  type="number"
                  value={element.row_span}
                  onChange={(e) => updatePosition({ row_span: Math.max(1, Math.min(maxRows - element.grid_row, parseInt(e.target.value) || 1)) })}
                  min="1"
                  max={maxRows - element.grid_row}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                />
              </FormField>
            </CollapsibleSection>

            {/* Layer */}
            <CollapsibleSection
              id="layer"
              title="Layer"
              icon="📚"
              isCollapsed={collapsedSections.has('layer')}
              onToggle={toggleSection}
            >
              <FormField label="Z-Index">
                <input
                  type="number"
                  value={element.layer}
                  onChange={(e) => updatePosition({ layer: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                />
              </FormField>
              <div className="text-xs text-gray-500">
                Higher numbers appear on top
              </div>
            </CollapsibleSection>
          </>
        )}
      </div>
    </div>
  );
}

// Helper Components
function CollapsibleSection({
  id,
  title,
  icon,
  children,
  isCollapsed,
  onToggle,
  defaultExpanded = true
}: {
  id: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggle: (id: string) => void;
  defaultExpanded?: boolean;
}) {
  const collapsed = isCollapsed;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-750">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <h4 className="text-xs font-semibold text-gray-300 uppercase">{title}</h4>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            collapsed ? '-rotate-90' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!collapsed && (
        <div className="p-3 pt-0 space-y-3 border-t border-gray-700/50">
          {children}
        </div>
      )}
    </div>
  );
}

// Legacy ConfigSection for backward compatibility
function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-700 rounded-lg p-3 bg-gray-750">
      <h4 className="text-xs font-semibold text-gray-300 uppercase mb-3">{title}</h4>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="block text-sm text-gray-300 mb-1">{label}</label>}
      {children}
    </div>
  );
}
