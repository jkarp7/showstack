import { useState } from 'react';

export interface ExportHeaderOptions {
  includeShowName: boolean;
  includeLogo: boolean;
  includeDesigner: boolean;
  includeVenue: boolean;
  includeDate: boolean;
  customTitle: string;
  format: 'csv' | 'eos' | 'grandma2' | 'grandma3';
}

interface ExportHeaderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportHeaderOptions) => void;
  defaultFormat: 'csv' | 'eos' | 'grandma2' | 'grandma3';
  projectName: string;
}

export function ExportHeaderDialog({
  isOpen,
  onClose,
  onExport,
  defaultFormat,
  projectName
}: ExportHeaderDialogProps) {
  const [options, setOptions] = useState<ExportHeaderOptions>({
    includeShowName: true,
    includeLogo: false,
    includeDesigner: true,
    includeVenue: true,
    includeDate: true,
    customTitle: '',
    format: defaultFormat
  });

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(options);
    onClose();
  };

  const formatLabels = {
    csv: 'CSV',
    eos: 'ETC Eos',
    grandma2: 'GrandMA2',
    grandma3: 'GrandMA3'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export to {formatLabels[defaultFormat]}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Customize header information for your export
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Custom Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Title (Optional)
            </label>
            <input
              type="text"
              value={options.customTitle}
              onChange={(e) => setOptions({ ...options, customTitle: e.target.value })}
              placeholder={`${projectName} - Equipment List`}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave blank to use default title
            </p>
          </div>

          {/* Header Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Include in Header
            </label>
            <div className="space-y-3">
              {/* Show Name */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeShowName}
                  onChange={(e) => setOptions({ ...options, includeShowName: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                />
                <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">
                  Show/Production Name
                </span>
              </label>

              {/* Logo */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeLogo}
                  onChange={(e) => setOptions({ ...options, includeLogo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                />
                <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">
                  Company/Project Logo
                  <span className="text-gray-500 dark:text-gray-400 ml-2">(PDF exports only)</span>
                </span>
              </label>

              {/* Designer */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeDesigner}
                  onChange={(e) => setOptions({ ...options, includeDesigner: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                />
                <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">
                  Lighting Designer Info (Name, Email, Phone)
                </span>
              </label>

              {/* Venue */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeVenue}
                  onChange={(e) => setOptions({ ...options, includeVenue: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                />
                <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">
                  Venue Information (Name, City, State)
                </span>
              </label>

              {/* Date */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeDate}
                  onChange={(e) => setOptions({ ...options, includeDate: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                />
                <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">
                  Export Date
                </span>
              </label>
            </div>
          </div>

          {/* Format-specific notice */}
          {defaultFormat === 'csv' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>CSV Format:</strong> Headers will be added as comment lines at the top of the file. Logo display is not supported in CSV format.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
