/**
 * FontCustomizationControls
 * Controls for customizing font family, size, weight, and style
 */

import React, { useState } from 'react';
import { FontStyle } from '../../types/paperworkTemplate';

interface FontCustomizationControlsProps {
  fontStyle?: FontStyle;
  onChange: (fontStyle: FontStyle) => void;
}

const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
];

const FONT_SIZES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24];

const SPACING_PRESETS = [
  { value: 1.0, label: 'Compact' },
  { value: 1.5, label: 'Cozy' },
  { value: 2.0, label: 'Roomy' },
];

export function FontCustomizationControls({
  fontStyle = {},
  onChange,
}: FontCustomizationControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customHeaderSize, setCustomHeaderSize] = useState('');
  const [customBodySize, setCustomBodySize] = useState('');

  const currentFont = fontStyle.fontFamily || 'Arial, sans-serif';
  const currentHeaderFontSize = fontStyle.headerFontSize || 11;
  const currentFontSize = fontStyle.fontSize || 10;
  const currentFontWeight = fontStyle.fontWeight || 'normal';
  const currentFontStyleValue = fontStyle.fontStyle || 'normal';
  const currentLineHeight = fontStyle.lineHeight || 1.5;

  const handleFontFamilyChange = (fontFamily: string) => {
    onChange({ ...fontStyle, fontFamily });
  };

  const handleHeaderFontSizeChange = (value: string) => {
    const size = Number(value);
    if (value === 'custom') {
      setCustomHeaderSize('');
      return;
    }
    if (!isNaN(size) && size > 0) {
      onChange({ ...fontStyle, headerFontSize: size });
      setCustomHeaderSize('');
    }
  };

  const handleCustomHeaderSizeChange = (value: string) => {
    setCustomHeaderSize(value);
    const size = Number(value);
    if (!isNaN(size) && size > 0) {
      onChange({ ...fontStyle, headerFontSize: size });
    }
  };

  const handleFontSizeChange = (value: string) => {
    const size = Number(value);
    if (value === 'custom') {
      setCustomBodySize('');
      return;
    }
    if (!isNaN(size) && size > 0) {
      onChange({ ...fontStyle, fontSize: size });
      setCustomBodySize('');
    }
  };

  const handleCustomBodySizeChange = (value: string) => {
    setCustomBodySize(value);
    const size = Number(value);
    if (!isNaN(size) && size > 0) {
      onChange({ ...fontStyle, fontSize: size });
    }
  };

  const handleFontWeightChange = (fontWeight: 'normal' | 'bold') => {
    onChange({ ...fontStyle, fontWeight });
  };

  const handleFontStyleChange = (fontStyleValue: 'normal' | 'italic') => {
    onChange({ ...fontStyle, fontStyle: fontStyleValue });
  };

  const handleSpacingChange = (lineHeight: number) => {
    onChange({ ...fontStyle, lineHeight });
  };

  // Check if current size is in preset list
  const headerSizeInPresets = FONT_SIZES.includes(currentHeaderFontSize);
  const bodySizeInPresets = FONT_SIZES.includes(currentFontSize);

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 text-white text-left transition flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Font Settings</span>
        </div>
        <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="bg-gray-850 p-3 space-y-3">
          {/* Font Family */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Font Family</label>
            <select
              value={currentFont}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Header Font Size */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Header Font Size</label>
            <div className="flex gap-2">
              <select
                value={headerSizeInPresets ? currentHeaderFontSize : 'custom'}
                onChange={(e) => handleHeaderFontSizeChange(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}pt
                  </option>
                ))}
                <option value="custom">Custom...</option>
              </select>
              {(!headerSizeInPresets || customHeaderSize !== '') && (
                <input
                  type="number"
                  min="6"
                  max="72"
                  step="0.5"
                  value={customHeaderSize !== '' ? customHeaderSize : currentHeaderFontSize}
                  onChange={(e) => handleCustomHeaderSizeChange(e.target.value)}
                  placeholder="Custom"
                  className="w-20 px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Body Font Size */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Body Font Size</label>
            <div className="flex gap-2">
              <select
                value={bodySizeInPresets ? currentFontSize : 'custom'}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}pt
                  </option>
                ))}
                <option value="custom">Custom...</option>
              </select>
              {(!bodySizeInPresets || customBodySize !== '') && (
                <input
                  type="number"
                  min="6"
                  max="72"
                  step="0.5"
                  value={customBodySize !== '' ? customBodySize : currentFontSize}
                  onChange={(e) => handleCustomBodySizeChange(e.target.value)}
                  placeholder="Custom"
                  className="w-20 px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Font Weight */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Font Weight</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFontWeightChange('normal')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition ${
                  currentFontWeight === 'normal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => handleFontWeightChange('bold')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition font-bold ${
                  currentFontWeight === 'bold'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Bold
              </button>
            </div>
          </div>

          {/* Font Style */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Font Style</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFontStyleChange('normal')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition ${
                  currentFontStyleValue === 'normal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => handleFontStyleChange('italic')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition italic ${
                  currentFontStyleValue === 'italic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Italic
              </button>
            </div>
          </div>

          {/* Spacing */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Spacing</label>
            <div className="flex gap-2">
              {SPACING_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSpacingChange(preset.value)}
                  className={`flex-1 px-3 py-1.5 text-xs rounded transition ${
                    currentLineHeight === preset.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2 border-t border-gray-700">
            <button
              onClick={() => onChange({})}
              className="w-full px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
