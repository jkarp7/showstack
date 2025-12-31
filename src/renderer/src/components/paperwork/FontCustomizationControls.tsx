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
  { value: 'Tahoma, sans-serif', label: 'Tahoma' }
];

export function FontCustomizationControls({ fontStyle = {}, onChange }: FontCustomizationControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentFont = fontStyle.fontFamily || 'Arial, sans-serif';
  const currentFontSize = fontStyle.fontSize || 10;
  const currentHeaderFontSize = fontStyle.headerFontSize || 11;
  const currentFontWeight = fontStyle.fontWeight || 'normal';
  const currentFontStyleValue = fontStyle.fontStyle || 'normal';
  const currentLineHeight = fontStyle.lineHeight || 1.2;

  const handleFontFamilyChange = (fontFamily: string) => {
    onChange({ ...fontStyle, fontFamily });
  };

  const handleFontSizeChange = (fontSize: number) => {
    onChange({ ...fontStyle, fontSize });
  };

  const handleHeaderFontSizeChange = (headerFontSize: number) => {
    onChange({ ...fontStyle, headerFontSize });
  };

  const handleFontWeightChange = (fontWeight: 'normal' | 'bold') => {
    onChange({ ...fontStyle, fontWeight });
  };

  const handleFontStyleChange = (fontStyleValue: 'normal' | 'italic') => {
    onChange({ ...fontStyle, fontStyle: fontStyleValue });
  };

  const handleLineHeightChange = (lineHeight: number) => {
    onChange({ ...fontStyle, lineHeight });
  };

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
              {FONT_FAMILIES.map(font => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Body Font Size: {currentFontSize}pt
            </label>
            <input
              type="range"
              min="6"
              max="16"
              step="0.5"
              value={currentFontSize}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Header Font Size */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Header Font Size: {currentHeaderFontSize}pt
            </label>
            <input
              type="range"
              min="7"
              max="18"
              step="0.5"
              value={currentHeaderFontSize}
              onChange={(e) => handleHeaderFontSizeChange(Number(e.target.value))}
              className="w-full"
            />
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

          {/* Line Height */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Line Height: {currentLineHeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.1"
              value={currentLineHeight}
              onChange={(e) => handleLineHeightChange(Number(e.target.value))}
              className="w-full"
            />
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
