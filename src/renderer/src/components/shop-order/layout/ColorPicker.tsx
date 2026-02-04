import { useState, useEffect } from 'react';

interface ColorPickerProps {
  value: string; // Current color (hex format)
  onChange: (color: string) => void;
  opacity?: number; // Optional opacity (0-1)
  onOpacityChange?: (opacity: number) => void;
  label?: string; // Optional label
  showOpacity?: boolean; // Show opacity slider
  allowTransparent?: boolean; // Show "transparent" option
}

// Preset color swatches
const PRESET_COLORS = [
  // Row 1
  '#000000', // Black
  '#FFFFFF', // White
  '#3B82F6', // Blue
  '#EF4444', // Red
  // Row 2
  '#10B981', // Green
  '#F59E0B', // Amber
  '#6B7280', // Gray
  '#8B5CF6', // Purple
  // Row 3
  '#0EA5E9', // Sky
  '#059669', // Emerald
  '#F43F5E', // Rose
  '#64748B', // Slate
];

const STORAGE_KEY = 'showstack_customColors';
const MAX_CUSTOM_COLORS = 12;

interface CustomColorStorage {
  version: number;
  colors: string[];
  lastUpdated: number;
}

// localStorage management functions
function loadCustomColors(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data: CustomColorStorage = JSON.parse(stored);
    return data.colors || [];
  } catch (error) {
    console.warn('Failed to load custom colors:', error);
    return [];
  }
}

function saveCustomColors(colors: string[]): void {
  try {
    const data: CustomColorStorage = {
      version: 1,
      colors: colors.slice(0, MAX_CUSTOM_COLORS),
      lastUpdated: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save custom colors:', error);
  }
}

function addCustomColor(color: string, existing: string[]): string[] {
  const upperColor = color.toUpperCase();

  // Don't add if already exists
  if (existing.includes(upperColor)) {
    return existing;
  }

  // Add to beginning, remove oldest if exceeds max
  const updated = [upperColor, ...existing];
  return updated.slice(0, MAX_CUSTOM_COLORS);
}

function removeCustomColor(color: string, existing: string[]): string[] {
  return existing.filter(c => c !== color);
}

// Hex validation and formatting
function isValidHex(hex: string): boolean {
  const cleanHex = hex.replace('#', '');
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex);
}

function formatHex(hex: string): string {
  let cleaned = hex.replace('#', '').toUpperCase();

  // Expand 3-digit hex to 6-digit
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map(c => c + c)
      .join('');
  }

  return `#${cleaned}`;
}

export function ColorPicker({
  value,
  onChange,
  opacity,
  onOpacityChange,
  label,
  showOpacity = false,
  allowTransparent = false
}: ColorPickerProps) {
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [hexInput, setHexInput] = useState<string>('');
  const [hexError, setHexError] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Load custom colors on mount
  useEffect(() => {
    setCustomColors(loadCustomColors());
  }, []);

  // Sync hex input with value prop
  useEffect(() => {
    setHexInput(value.replace('#', ''));
  }, [value]);

  const handlePresetClick = (color: string) => {
    onChange(color);
    setHexError(false);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexInput(e.target.value);
    setHexError(false);
  };

  const handleHexInputBlur = () => {
    const inputValue = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;

    if (isValidHex(inputValue)) {
      const formatted = formatHex(inputValue);
      onChange(formatted);
      setHexInput(formatted.replace('#', ''));
      setHexError(false);
    } else {
      setHexError(true);
    }
  };

  const handleHexInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleHexInputBlur();
    }
  };

  const handleSaveCustomColor = () => {
    const updated = addCustomColor(value, customColors);
    setCustomColors(updated);
    saveCustomColors(updated);
  };

  const handleRemoveCustomColor = (color: string) => {
    const updated = removeCustomColor(color, customColors);
    setCustomColors(updated);
    saveCustomColors(updated);
  };

  const handleTransparent = () => {
    onChange('transparent');
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      )}

      {/* Preset Color Swatches */}
      <div className="grid grid-cols-4 gap-2">
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            onClick={() => handlePresetClick(color)}
            className={`w-10 h-10 rounded border-2 transition-all ${
              value.toUpperCase() === color
                ? 'border-blue-500 ring-2 ring-blue-400'
                : 'border-gray-600 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color }}
            title={color}
            type="button"
          />
        ))}
      </div>

      {/* Custom Colors Section */}
      {customColors.length > 0 && (
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase">Custom Colors</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {customColors.map(color => (
              <div key={color} className="relative group flex-shrink-0">
                <button
                  onClick={() => handlePresetClick(color)}
                  className={`w-9 h-9 rounded border-2 transition-all ${
                    value.toUpperCase() === color
                      ? 'border-blue-500 ring-2 ring-blue-400'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                  type="button"
                />
                {/* Remove button on hover */}
                <button
                  onClick={() => handleRemoveCustomColor(color)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  title="Remove color"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Current Color Button */}
      {customColors.length < MAX_CUSTOM_COLORS && value !== 'transparent' && (
        <button
          onClick={handleSaveCustomColor}
          className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors flex items-center justify-center gap-2"
          type="button"
        >
          <span className="text-lg">+</span>
          Save current color
        </button>
      )}

      {/* Hex Input */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Hex Code</label>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-sm">#</span>
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            onBlur={handleHexInputBlur}
            onKeyDown={handleHexInputKeyDown}
            placeholder="FFFFFF"
            maxLength={6}
            className={`flex-1 px-2 py-1.5 bg-gray-700 border ${
              hexError ? 'border-red-500' : 'border-gray-600'
            } rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 ${
              hexError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
            }`}
          />
        </div>
        {hexError && (
          <p className="text-xs text-red-400 mt-1">Invalid hex code</p>
        )}
      </div>

      {/* Transparent Button */}
      {allowTransparent && (
        <button
          onClick={handleTransparent}
          className={`w-full px-3 py-2 rounded transition-colors text-sm ${
            value === 'transparent'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          type="button"
        >
          Transparent
        </button>
      )}

      {/* Opacity Slider */}
      {showOpacity && onOpacityChange && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Opacity</label>
          <input
            type="range"
            value={(opacity !== undefined ? opacity : 1) * 100}
            onChange={e => onOpacityChange(parseInt(e.target.value) / 100)}
            min="0"
            max="100"
            step="1"
            className="w-full"
          />
          <div className="text-xs text-gray-400 mt-1 text-center">
            {Math.round((opacity !== undefined ? opacity : 1) * 100)}%
          </div>
        </div>
      )}

      {/* Advanced Color Picker Toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          type="button"
        >
          {showAdvanced ? '− Hide' : '+ Show'} advanced color picker
        </button>

        {showAdvanced && (
          <div className="mt-2">
            <input
              type="color"
              value={value === 'transparent' ? '#000000' : value}
              onChange={e => onChange(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
