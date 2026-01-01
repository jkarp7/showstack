/**
 * ColumnMergeDialog
 * Modal dialog for configuring column merges
 */

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PaperworkColumnConfig } from '../../types/paperworkTemplate';
import { ReportDataItem } from '../../utils/paperwork/reportOrganizer';

interface ColumnMergeDialogProps {
  primaryColumn: PaperworkColumnConfig;
  availableColumns: PaperworkColumnConfig[];
  previewData?: ReportDataItem[];
  onConfirm: (mergedColumnIds: string[], separator: string) => void;
  onCancel: () => void;
}

const SEPARATOR_OPTIONS = [
  { value: ' ', label: 'Space' },
  { value: ' • ', label: 'Bullet (•)' },
  { value: ' - ', label: 'Dash (-)' },
  { value: ', ', label: 'Comma (,)' },
  { value: ' | ', label: 'Pipe (|)' },
  { value: '\n', label: 'New Line' },
  { value: 'custom', label: 'Custom...' }
];

export function ColumnMergeDialog({
  primaryColumn,
  availableColumns,
  previewData = [],
  onConfirm,
  onCancel
}: ColumnMergeDialogProps) {
  // Initialize with existing merge data if editing an existing merge
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(
    primaryColumn.combinedWith || []
  );
  const [separator, setSeparator] = useState(primaryColumn.separator || ' • ');
  const [customSeparator, setCustomSeparator] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const isEditingMerge = (primaryColumn.combinedWith?.length || 0) > 0;

  // Handle column selection toggle
  const toggleColumnSelection = (columnId: string) => {
    setSelectedColumnIds(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      }
      return [...prev, columnId];
    });
  };

  // Handle separator change
  const handleSeparatorChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true);
      setSeparator(customSeparator || '');
    } else {
      setShowCustomInput(false);
      setSeparator(value);
    }
  };

  // Generate preview values
  const previewValues = useMemo(() => {
    if (previewData.length === 0) return [];

    return previewData.slice(0, 5).map(item => {
      const values = [item[primaryColumn.field]];
      selectedColumnIds.forEach(colId => {
        const col = availableColumns.find(c => c.id === colId);
        if (col) {
          values.push(item[col.field]);
        }
      });
      const finalSeparator = showCustomInput ? customSeparator : separator;
      return values.filter(v => v != null && v !== '').join(finalSeparator);
    });
  }, [primaryColumn, selectedColumnIds, availableColumns, separator, customSeparator, showCustomInput, previewData]);

  // Handle confirm
  const handleConfirm = () => {
    const finalSeparator = showCustomInput ? customSeparator : separator;
    onConfirm(selectedColumnIds, finalSeparator);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-8" style={{ zIndex: 10000 }}>
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl shadow-xl text-white">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">
            {isEditingMerge ? 'Edit Column Merge' : 'Merge Columns'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {isEditingMerge
              ? `Editing merged column: ${primaryColumn.label}`
              : `Select multiple columns to merge with ${primaryColumn.label}`}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Column Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-300">
                Select columns to merge (check multiple):
              </label>
              {selectedColumnIds.length > 0 && (
                <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                  {selectedColumnIds.length} selected
                </span>
              )}
            </div>
            <div className="space-y-2">
              {availableColumns.map(col => (
                <label
                  key={col.id}
                  className={`flex items-center gap-3 p-3 rounded cursor-pointer transition ${
                    selectedColumnIds.includes(col.id)
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedColumnIds.includes(col.id)}
                    onChange={() => toggleColumnSelection(col.id)}
                    className="w-4 h-4"
                  />
                  <span className="flex-1">{col.label}</span>
                </label>
              ))}
            </div>
            {availableColumns.length === 0 && (
              <p className="text-sm text-gray-400 italic">No columns available to merge</p>
            )}
          </div>

          {/* Separator Selection */}
          {selectedColumnIds.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Separator:
              </label>
              <select
                value={showCustomInput ? 'custom' : separator}
                onChange={(e) => handleSeparatorChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SEPARATOR_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {showCustomInput && (
                <input
                  type="text"
                  value={customSeparator}
                  onChange={(e) => {
                    setCustomSeparator(e.target.value);
                    setSeparator(e.target.value);
                  }}
                  placeholder="Enter custom separator..."
                  className="w-full mt-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )}

          {/* Live Preview */}
          {selectedColumnIds.length > 0 && previewValues.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Preview (first 5 rows):
              </label>
              <div className="bg-gray-900 rounded p-4 space-y-2">
                {previewValues.map((value, index) => (
                  <div key={index} className="text-sm font-mono text-gray-300">
                    {value || <span className="text-gray-500 italic">(empty)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedColumnIds.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Select columns to merge to see a preview</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedColumnIds.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition"
          >
            {selectedColumnIds.length === 0
              ? 'Select columns to merge'
              : selectedColumnIds.length === 1
              ? 'Merge 2 columns'
              : `Merge ${selectedColumnIds.length + 1} columns`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
