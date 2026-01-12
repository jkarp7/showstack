import { useState } from 'react';
import type {
  LayoutElement,
  ElementStyle,
  ElementConfig,
  DataFieldConfig,
  TextConfig,
  ImageConfig,
  TableConfig,
  ShapeConfig,
  DataFieldType,
  ShapeType
} from '../../../types/prep';
import { ColorPicker } from './ColorPicker';

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
      <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-6 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">👆</div>
          <div className="text-sm">Select an element to edit</div>
        </div>
      </div>
    );
  }

  const updateConfig = (configUpdates: Partial<ElementConfig>) => {
    onUpdate({
      config: { ...element.config, ...configUpdates } as ElementConfig
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
    <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg flex flex-col h-full">
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
                {/* Image Preview */}
                {(element.config as ImageConfig).src && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">Preview</div>
                    <div className="w-full h-32 bg-gray-900 border border-gray-600 rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={(element.config as ImageConfig).src}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <FormField label="Upload Image">
                  <div className="flex gap-2">
                    <label className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded cursor-pointer text-center transition">
                      Choose File
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // SECURITY: Validate MIME type (matches backend whitelist)
                            const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
                            if (!ALLOWED_TYPES.includes(file.type)) {
                              alert('Invalid file type. Allowed: PNG, JPG, GIF, WebP');
                              e.target.value = ''; // Reset input
                              return;
                            }

                            // Validate file size (2MB max)
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Image must be smaller than 2MB');
                              e.target.value = ''; // Reset input
                              return;
                            }

                            // Convert to base64
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              updateConfig({ src: base64 });
                            };
                            reader.onerror = () => {
                              alert('Failed to read image file');
                              e.target.value = ''; // Reset input
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {(element.config as ImageConfig).src && (
                      <button
                        onClick={() => updateConfig({ src: '' })}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                        title="Clear image"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF, WebP • Max 2MB
                  </div>
                </FormField>

                {/* URL Input (Alternative) */}
                <FormField label="Or Enter URL">
                  <input
                    type="text"
                    value={(element.config as ImageConfig).src || ''}
                    onChange={(e) => updateConfig({ src: e.target.value })}
                    placeholder="https://example.com/image.png"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                  />
                </FormField>

                <FormField label="Object Fit">
                  <select
                    value={(element.config as ImageConfig).objectFit || 'contain'}
                    onChange={(e) => updateConfig({ objectFit: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                  >
                    <option value="contain">Contain (fit inside)</option>
                    <option value="cover">Cover (fill and crop)</option>
                    <option value="fill">Fill (stretch)</option>
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    How the image fits within the element bounds
                  </div>
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
              isCollapsed={collapsedSections.has('typography')}
              onToggle={toggleSection}
            >
              {/* Font Family and Size - Side by Side */}
              <div className="grid grid-cols-2 gap-2">
                {/* Font Family */}
                <select
                  value={element.style.fontFamily || 'Arial'}
                  onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>

                {/* Font Size */}
                <select
                  value={element.style.fontSize || 12}
                  onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="8">8pt</option>
                  <option value="10">10pt</option>
                  <option value="12">12pt</option>
                  <option value="14">14pt</option>
                  <option value="16">16pt</option>
                  <option value="18">18pt</option>
                  <option value="24">24pt</option>
                  <option value="36">36pt</option>
                  <option value="48">48pt</option>
                  <option value="72">72pt</option>
                </select>
              </div>

              {/* Text Style - 4 Button Row (B, I, U, S) */}
              <div className="grid grid-cols-4 gap-1">
                {/* Bold Toggle */}
                <button
                  onClick={() => updateStyle({
                    fontWeight: element.style.fontWeight === 'bold' ? 'normal' : 'bold'
                  })}
                  className={`px-3 py-2 rounded font-bold transition text-sm ${
                    element.style.fontWeight === 'bold'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Bold"
                  type="button"
                >
                  B
                </button>

                {/* Italic Toggle */}
                <button
                  onClick={() => updateStyle({
                    fontStyle: element.style.fontStyle === 'italic' ? 'normal' : 'italic'
                  })}
                  className={`px-3 py-2 rounded italic transition text-sm ${
                    element.style.fontStyle === 'italic'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Italic"
                  type="button"
                >
                  I
                </button>

                {/* Underline Toggle */}
                <button
                  onClick={() => updateStyle({
                    textDecoration: element.style.textDecoration === 'underline' ? 'none' : 'underline'
                  })}
                  className={`px-3 py-2 rounded underline transition text-sm ${
                    element.style.textDecoration === 'underline'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Underline"
                  type="button"
                >
                  U
                </button>

                {/* Strikethrough Toggle */}
                <button
                  onClick={() => updateStyle({
                    textDecoration: element.style.textDecoration === 'line-through' ? 'none' : 'line-through'
                  })}
                  className={`px-3 py-2 rounded line-through transition text-sm ${
                    element.style.textDecoration === 'line-through'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Strikethrough"
                  type="button"
                >
                  S
                </button>
              </div>

              {/* Text Alignment - 4 Icon Buttons */}
              <div className="grid grid-cols-4 gap-1">
                {/* Left Align */}
                <button
                  onClick={() => updateStyle({ textAlign: 'left' })}
                  className={`px-3 py-2 rounded transition flex items-center justify-center ${
                    element.style.textAlign === 'left' || !element.style.textAlign
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Align Left"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                  </svg>
                </button>

                {/* Center Align */}
                <button
                  onClick={() => updateStyle({ textAlign: 'center' })}
                  className={`px-3 py-2 rounded transition flex items-center justify-center ${
                    element.style.textAlign === 'center'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Align Center"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                  </svg>
                </button>

                {/* Right Align */}
                <button
                  onClick={() => updateStyle({ textAlign: 'right' })}
                  className={`px-3 py-2 rounded transition flex items-center justify-center ${
                    element.style.textAlign === 'right'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Align Right"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                  </svg>
                </button>

                {/* Justify */}
                <button
                  onClick={() => updateStyle({ textAlign: 'justify' })}
                  className={`px-3 py-2 rounded transition flex items-center justify-center ${
                    element.style.textAlign === 'justify'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title="Justify"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <FormField label="Line Height">
                <input
                  type="range"
                  value={element.style.lineHeight || 1.5}
                  onChange={(e) => updateStyle({ lineHeight: parseFloat(e.target.value) })}
                  min="0.8"
                  max="3.0"
                  step="0.1"
                  className="w-full"
                />
                <div className="text-xs text-gray-400 mt-1 text-center">
                  {(element.style.lineHeight || 1.5).toFixed(1)}
                </div>
              </FormField>

              <FormField label="Letter Spacing (px)">
                <input
                  type="number"
                  value={element.style.letterSpacing || 0}
                  onChange={(e) => updateStyle({ letterSpacing: parseInt(e.target.value) })}
                  min="-2"
                  max="10"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
            </CollapsibleSection>

            {/* Colors */}
            <CollapsibleSection
              id="colors"
              title="Colors"
              isCollapsed={collapsedSections.has('colors')}
              onToggle={toggleSection}
            >
              <FormField label="Text Color">
                <ColorPicker
                  value={element.style.color || '#000000'}
                  onChange={(color) => updateStyle({ color })}
                  label=""
                />
              </FormField>

              <FormField label="Background Color">
                <ColorPicker
                  value={element.style.backgroundColor || '#ffffff'}
                  onChange={(color) => updateStyle({ backgroundColor: color })}
                  allowTransparent={true}
                  label=""
                />
              </FormField>
            </CollapsibleSection>

            {/* Fill & Borders */}
            <CollapsibleSection
              id="fill-borders"
              title="Fill & Borders"
              isCollapsed={collapsedSections.has('fill-borders')}
              onToggle={toggleSection}
            >
              {/* Fill Controls - Show for shapes only */}
              {element.element_type === 'shape' && (
                <div className="mb-4 pb-4 border-b border-gray-700">
                  <h5 className="text-xs font-semibold text-gray-400 uppercase mb-3">Fill</h5>

                  <FormField label="">
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={element.style.backgroundColor !== 'transparent'}
                        onChange={(e) => updateStyle({
                          backgroundColor: e.target.checked ? '#000000' : 'transparent'
                        })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-300">Enable fill</span>
                    </label>
                  </FormField>

                  {element.style.backgroundColor !== 'transparent' && (
                    <FormField label="Fill Color">
                      <ColorPicker
                        value={element.style.backgroundColor || '#000000'}
                        onChange={(color) => updateStyle({ backgroundColor: color })}
                        showOpacity={true}
                        opacity={element.style.opacity}
                        onOpacityChange={(opacity) => updateStyle({ opacity })}
                        label=""
                      />
                    </FormField>
                  )}
                </div>
              )}

              {/* Border Controls */}
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-3">Border</h5>

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
                <ColorPicker
                  value={element.style.borderColor || '#000000'}
                  onChange={(color) => updateStyle({ borderColor: color })}
                  label=""
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
              isCollapsed={collapsedSections.has('spacing')}
              onToggle={toggleSection}
            >
              <FormField label="Padding">
                {/* Link Padding Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={element.style.paddingTop === undefined}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Link padding - use unified value
                        const unified = element.style.padding || 8;
                        updateStyle({
                          padding: unified,
                          paddingTop: undefined,
                          paddingRight: undefined,
                          paddingBottom: undefined,
                          paddingLeft: undefined
                        });
                      } else {
                        // Unlink - convert to individual
                        const current = element.style.padding || 8;
                        updateStyle({
                          padding: undefined,
                          paddingTop: current,
                          paddingRight: current,
                          paddingBottom: current,
                          paddingLeft: current
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">Link padding</span>
                </label>

                {/* Unified Padding (when linked) */}
                {element.style.paddingTop === undefined && (
                  <input
                    type="number"
                    value={element.style.padding || 8}
                    onChange={(e) => updateStyle({ padding: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                    placeholder="All sides"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                  />
                )}

                {/* Individual Padding (when unlinked) */}
                {element.style.paddingTop !== undefined && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Top</label>
                      <input
                        type="number"
                        value={element.style.paddingTop || 0}
                        onChange={(e) => updateStyle({ paddingTop: parseInt(e.target.value) })}
                        min="0"
                        max="100"
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Right</label>
                      <input
                        type="number"
                        value={element.style.paddingRight || 0}
                        onChange={(e) => updateStyle({ paddingRight: parseInt(e.target.value) })}
                        min="0"
                        max="100"
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Bottom</label>
                      <input
                        type="number"
                        value={element.style.paddingBottom || 0}
                        onChange={(e) => updateStyle({ paddingBottom: parseInt(e.target.value) })}
                        min="0"
                        max="100"
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Left</label>
                      <input
                        type="number"
                        value={element.style.paddingLeft || 0}
                        onChange={(e) => updateStyle({ paddingLeft: parseInt(e.target.value) })}
                        min="0"
                        max="100"
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                )}
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
