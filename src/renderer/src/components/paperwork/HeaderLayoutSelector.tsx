import { HeaderLayoutConfig, HeaderLayoutPreset, HEADER_PRESET_FIELDS } from '../../types/paperwork';

interface HeaderLayoutSelectorProps {
  currentLayout: HeaderLayoutConfig;
  onChange: (layout: HeaderLayoutConfig) => void;
}

export function HeaderLayoutSelector({ currentLayout, onChange }: HeaderLayoutSelectorProps) {
  const handlePresetChange = (preset: HeaderLayoutPreset) => {
    onChange({
      preset,
      fields: HEADER_PRESET_FIELDS[preset]
    });
  };

  const handleFieldToggle = (field: keyof typeof currentLayout.fields) => {
    if (field === 'customTitle') return; // Skip customTitle toggle

    onChange({
      ...currentLayout,
      preset: 'custom', // Automatically switch to custom when manually toggling
      fields: {
        ...currentLayout.fields,
        [field]: !currentLayout.fields[field]
      }
    });
  };

  const handleCustomTitleChange = (value: string) => {
    onChange({
      ...currentLayout,
      fields: {
        ...currentLayout.fields,
        customTitle: value
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Header Preset
        </label>
        <select
          value={currentLayout.preset}
          onChange={(e) => handlePresetChange(e.target.value as HeaderLayoutPreset)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="standard">Standard</option>
          <option value="minimal">Minimal</option>
          <option value="detailed">Detailed</option>
          <option value="logo-focused">Logo-Focused</option>
          <option value="custom">Custom</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {currentLayout.preset === 'standard' && 'Title, project name, venue, designer, and generated date'}
          {currentLayout.preset === 'minimal' && 'Title only - clean and simple'}
          {currentLayout.preset === 'detailed' && 'All fields including production staff, dates, and revision info'}
          {currentLayout.preset === 'logo-focused' && 'Large centered logo with title and project name'}
          {currentLayout.preset === 'custom' && 'Customize which fields to show'}
        </p>
      </div>

      {/* Field Toggles - Always visible but read-only for presets other than custom */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Header Fields
          {currentLayout.preset !== 'custom' && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              (Select "Custom" preset to edit)
            </span>
          )}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.fields.showTitle}
              onChange={() => handleFieldToggle('showTitle')}
              disabled={currentLayout.preset !== 'custom'}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Title</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.fields.showProjectName}
              onChange={() => handleFieldToggle('showProjectName')}
              disabled={currentLayout.preset !== 'custom'}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Project Name</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.fields.showLogo}
              onChange={() => handleFieldToggle('showLogo')}
              disabled={currentLayout.preset !== 'custom'}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Logo</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.fields.showVenue}
              onChange={() => handleFieldToggle('showVenue')}
              disabled={currentLayout.preset !== 'custom'}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Venue</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.fields.showDesigner}
              onChange={() => handleFieldToggle('showDesigner')}
              disabled={currentLayout.preset !== 'custom'}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Designer</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.fields.showProductionStaff}
              onChange={() => handleFieldToggle('showProductionStaff')}
              disabled={currentLayout.preset !== 'custom'}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Production Staff</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.fields.showDates}
              onChange={() => handleFieldToggle('showDates')}
              disabled={currentLayout.preset !== 'custom'}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Dates</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.fields.showRevision}
              onChange={() => handleFieldToggle('showRevision')}
              disabled={currentLayout.preset !== 'custom'}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Revision</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentLayout.fields.showGeneratedDate}
              onChange={() => handleFieldToggle('showGeneratedDate')}
              disabled={currentLayout.preset !== 'custom'}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Generated Date</span>
          </label>
        </div>
      </div>

      {/* Custom Title Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom Title (Optional)
        </label>
        <input
          type="text"
          value={currentLayout.fields.customTitle || ''}
          onChange={(e) => handleCustomTitleChange(e.target.value)}
          placeholder="Leave blank to use default report title"
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Override the default report title with your own custom text
        </p>
      </div>
    </div>
  );
}
