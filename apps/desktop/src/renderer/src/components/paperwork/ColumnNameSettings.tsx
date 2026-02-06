/**
 * ColumnNameSettings
 * Controls for managing column name display options (full/short/custom)
 */

import React, { useState, useEffect } from 'react';
import {
  PaperworkColumnConfig,
  ColumnDisplayMode,
  ReportType,
} from '../../types/paperworkTemplate';
import { getAllAvailableColumns } from '../../utils/paperwork/columnDefaults';

interface ColumnNameSettingsProps {
  columns: PaperworkColumnConfig[];
  onChange: (columns: PaperworkColumnConfig[]) => void;
  reportType: ReportType;
}

export function ColumnNameSettings({ columns, onChange, reportType }: ColumnNameSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get current display mode from columns
  const currentDisplayMode =
    columns.length > 0 && columns[0].displayMode ? columns[0].displayMode : 'full';
  const [globalMode, setGlobalMode] = useState<ColumnDisplayMode>(currentDisplayMode);

  // Sync globalMode with actual column displayMode when columns change
  useEffect(() => {
    if (columns.length > 0 && columns[0].displayMode && columns[0].displayMode !== globalMode) {
      setGlobalMode(columns[0].displayMode);
    }
  }, [columns]);

  // Get all available columns for this report type
  const allAvailableColumns = getAllAvailableColumns(reportType);

  // Merge with current columns to preserve custom labels
  const columnsWithCustomLabels = allAvailableColumns.map((availableCol) => {
    const currentCol = columns.find((c) => c.id === availableCol.id);
    return {
      ...availableCol,
      customLabel: currentCol?.customLabel || '',
      displayMode: currentCol?.displayMode || currentDisplayMode,
    };
  });

  // Handle global display mode change
  const handleGlobalModeChange = (mode: ColumnDisplayMode) => {
    setGlobalMode(mode);

    // Update displayMode and merge in shortLabel from defaults if missing
    const updatedColumns = columns.map((col) => {
      const defaultCol = allAvailableColumns.find((c) => c.id === col.id);
      return {
        ...col,
        displayMode: mode,
        // Merge in shortLabel from defaults if not present
        shortLabel: col.shortLabel || defaultCol?.shortLabel,
      };
    });

    onChange(updatedColumns);
  };

  // Handle custom label change only
  const handleCustomLabelChange = (columnId: string, customLabel: string) => {
    const updatedColumns = columns.map((col) =>
      col.id === columnId ? { ...col, customLabel } : col,
    );
    onChange(updatedColumns);
  };

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

          {/* Custom Label Editor - Shows all available columns */}
          <div className="max-h-80 overflow-y-auto">
            <label className="text-xs text-gray-400 mb-2 block">
              Custom Column Labels (showing all {columnsWithCustomLabels.length} available columns)
            </label>
            <div className="space-y-2">
              {columnsWithCustomLabels.map((col) => (
                <div key={col.id} className="bg-gray-800 p-2 rounded">
                  {/* Column Info - Read Only */}
                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                    <div>
                      <span className="text-gray-500">Full:</span>
                      <span className="ml-1 text-gray-300">{col.label}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Short:</span>
                      <span className="ml-1 text-gray-300">{col.shortLabel || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          columns.find((c) => c.id === col.id)?.visible
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {columns.find((c) => c.id === col.id)?.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  {/* Custom Label Input - Editable */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16 flex-shrink-0">Custom:</span>
                    <input
                      type="text"
                      value={col.customLabel || ''}
                      onChange={(e) => handleCustomLabelChange(col.id, e.target.value)}
                      placeholder={col.shortLabel || col.label}
                      className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Text */}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
            Currently displaying:{' '}
            <span className="text-blue-400 font-semibold">
              {globalMode === 'full' ? 'Full' : globalMode === 'short' ? 'Short' : 'Custom'}
            </span>{' '}
            labels (highlighted above)
          </div>
        </div>
      )}
    </div>
  );
}
