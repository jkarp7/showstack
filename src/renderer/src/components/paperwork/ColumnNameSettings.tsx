/**
 * ColumnNameSettings
 * Controls for managing column name display options (full/short/custom)
 */

import React, { useState } from 'react';
import { PaperworkColumnConfig, ColumnDisplayMode } from '../../types/paperworkTemplate';

interface ColumnNameSettingsProps {
  columns: PaperworkColumnConfig[];
  onChange: (columns: PaperworkColumnConfig[]) => void;
}

export function ColumnNameSettings({ columns, onChange }: ColumnNameSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [globalMode, setGlobalMode] = useState<ColumnDisplayMode>('full');

  // Handle global display mode change
  const handleGlobalModeChange = (mode: ColumnDisplayMode) => {
    setGlobalMode(mode);
    const updatedColumns = columns.map(col => ({ ...col, displayMode: mode }));
    onChange(updatedColumns);
  };

  // Handle custom label change for individual column
  const handleCustomLabelChange = (columnId: string, customLabel: string) => {
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, customLabel } : col
    );
    onChange(updatedColumns);
  };

  const visibleColumns = columns.filter(c => c.visible);

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 text-white text-left transition flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Column Names</span>
          <span className="text-xs text-gray-400">
            ({globalMode === 'full' ? 'Full' : globalMode === 'short' ? 'Short' : 'Custom'})
          </span>
        </div>
        <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="bg-gray-850 p-3 space-y-3">
          {/* Display Mode Selector */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Display Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleGlobalModeChange('full')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition ${
                  globalMode === 'full'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Full
              </button>
              <button
                onClick={() => handleGlobalModeChange('short')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition ${
                  globalMode === 'short'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Short
              </button>
              <button
                onClick={() => handleGlobalModeChange('custom')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition ${
                  globalMode === 'custom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Custom Label Editor (only shown in custom mode) */}
          {globalMode === 'custom' && (
            <div className="max-h-64 overflow-y-auto">
              <label className="text-xs text-gray-400 mb-2 block">Custom Labels</label>
              <div className="space-y-1.5">
                {visibleColumns.map(col => (
                  <div key={col.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-24 truncate" title={col.label}>
                      {col.label}:
                    </span>
                    <input
                      type="text"
                      value={col.customLabel || col.label}
                      onChange={(e) => handleCustomLabelChange(col.id, e.target.value)}
                      placeholder={col.label}
                      className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Text */}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
            {globalMode === 'full' && 'Showing full column names'}
            {globalMode === 'short' && 'Showing abbreviated column names'}
            {globalMode === 'custom' && 'Using custom column names (edit above)'}
          </div>
        </div>
      )}
    </div>
  );
}
