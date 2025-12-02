import { Palette, Sun, Moon, Monitor, Save } from 'lucide-react';
import { useThemeStore, accentColors } from '../../store/themeStore';

export function ThemeAppearance() {
  const {
    mode,
    accentColor,
    uiDensity,
    fontScale,
    setMode,
    setAccentColor,
    setUIDensity,
    setFontScale
  } = useThemeStore();

  const accentColorOptions: Array<{ name: string; value: typeof accentColor }> = [
    { name: 'Blue', value: 'blue' },
    { name: 'Purple', value: 'purple' },
    { name: 'Green', value: 'green' },
    { name: 'Orange', value: 'orange' },
    { name: 'Red', value: 'red' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Theme & Appearance</h2>
        <p className="text-gray-600 dark:text-gray-400">Customize the look and feel of your application</p>
      </div>

      {/* Info: Changes apply immediately */}
      <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ✨ <strong>Changes apply immediately</strong> - no need to save! Your preferences are automatically saved.
        </p>
      </div>

      {/* Theme Mode */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Palette className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Theme Mode</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setMode('light')}
            className={`p-4 border-2 rounded-lg transition-all ${
              mode === 'light'
                ? 'border-blue-500 dark:border-blue-500 bg-blue-100 dark:bg-blue-600/25'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Sun className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <div className={`font-medium ${mode === 'light' ? 'text-blue-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>Light</div>
            <div className={`text-xs mt-1 ${mode === 'light' ? 'text-blue-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>Light color scheme</div>
          </button>

          <button
            onClick={() => setMode('dark')}
            className={`p-4 border-2 rounded-lg transition-all ${
              mode === 'dark'
                ? 'border-blue-500 dark:border-blue-500 bg-blue-100 dark:bg-blue-600/25'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Moon className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
            <div className={`font-medium ${mode === 'dark' ? 'text-blue-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>Dark</div>
            <div className={`text-xs mt-1 ${mode === 'dark' ? 'text-blue-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>Dark color scheme</div>
          </button>

          <button
            onClick={() => setMode('system')}
            className={`p-4 border-2 rounded-lg transition-all ${
              mode === 'system'
                ? 'border-blue-500 dark:border-blue-500 bg-blue-100 dark:bg-blue-600/25'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
            <div className={`font-medium ${mode === 'system' ? 'text-blue-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>System</div>
            <div className={`text-xs mt-1 ${mode === 'system' ? 'text-blue-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>Follow system theme</div>
          </button>
        </div>
      </div>

      {/* Accent Color */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Accent Color</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <strong>Controls:</strong> Color used for buttons, links, highlights, and interactive elements throughout the app.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {accentColorOptions.map((option) => {
            const colors = accentColors[option.value];
            return (
              <button
                key={option.value}
                onClick={() => setAccentColor(option.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  accentColor === option.value
                    ? 'border-gray-900 dark:border-white scale-105'
                    : 'border-gray-200 dark:border-gray-600 hover:scale-102'
                }`}
              >
                <div
                  className="w-12 h-12 mx-auto rounded-lg mb-2"
                  style={{ backgroundColor: colors.primary }}
                />
                <div className="text-sm font-medium text-gray-900 dark:text-white">{option.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* UI Density */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">UI Density</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <strong>Controls:</strong> Spacing between UI elements. "Comfortable" adds more padding and spacing for easier clicking.
          "Compact" reduces spacing to fit more content on screen at once.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setUIDensity('comfortable')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              uiDensity === 'comfortable'
                ? 'border-blue-500 dark:border-blue-500 bg-blue-100 dark:bg-blue-600/25'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className={`font-medium mb-1 ${uiDensity === 'comfortable' ? 'text-blue-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>Comfortable</div>
            <div className={`text-sm ${uiDensity === 'comfortable' ? 'text-blue-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>More spacing between elements</div>
          </button>

          <button
            onClick={() => setUIDensity('compact')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              uiDensity === 'compact'
                ? 'border-blue-500 dark:border-blue-500 bg-blue-100 dark:bg-blue-600/25'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className={`font-medium mb-1 ${uiDensity === 'compact' ? 'text-blue-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>Compact</div>
            <div className={`text-sm ${uiDensity === 'compact' ? 'text-blue-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>Denser layout, more content visible</div>
          </button>
        </div>
      </div>

      {/* Font Scale */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Font Scale</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <strong>Controls:</strong> Size of all text in the application UI (menus, buttons, labels, etc.). Does not affect project content.
          Increase for better readability or decrease to fit more information on screen.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Text Size: {fontScale}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Adjust text size for better readability</div>
            </div>
            <span className="text-2xl text-gray-900 dark:text-white" style={{ fontSize: `${fontScale}%` }}>Aa</span>
          </div>

          <input
            type="range"
            min="75"
            max="125"
            step="5"
            value={fontScale}
            onChange={(e) => setFontScale(parseInt(e.target.value))}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>75%</span>
            <span>100%</span>
            <span>125%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
