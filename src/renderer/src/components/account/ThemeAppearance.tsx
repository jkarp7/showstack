import { useState } from 'react';
import { Palette, Sun, Moon, Monitor, Save } from 'lucide-react';

export function ThemeAppearance() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [accentColor, setAccentColor] = useState('#3B82F6');
  const [uiDensity, setUiDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [fontScale, setFontScale] = useState(100);

  const handleSave = async () => {
    // TODO: Implement save
    console.log('Saving theme settings...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Theme & Appearance</h2>
        <p className="text-gray-600">Customize the look and feel of your application</p>
      </div>

      {/* Theme Mode */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-blue-600" />
          <span>Theme Mode</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setThemeMode('light')}
            className={`p-4 border-2 rounded-lg transition-all ${
              themeMode === 'light'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Sun className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <div className="font-medium text-gray-900">Light</div>
            <div className="text-xs text-gray-500 mt-1">Light color scheme</div>
          </button>

          <button
            onClick={() => setThemeMode('dark')}
            className={`p-4 border-2 rounded-lg transition-all ${
              themeMode === 'dark'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Moon className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
            <div className="font-medium text-gray-900">Dark</div>
            <div className="text-xs text-gray-500 mt-1">Dark color scheme</div>
          </button>

          <button
            onClick={() => setThemeMode('system')}
            className={`p-4 border-2 rounded-lg transition-all ${
              themeMode === 'system'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <div className="font-medium text-gray-900">System</div>
            <div className="text-xs text-gray-500 mt-1">Follow system theme</div>
          </button>
        </div>
      </div>

      {/* Accent Color */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Accent Color</h3>

        <div className="flex items-center gap-4">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-16 h-16 rounded-lg cursor-pointer"
          />
          <div>
            <div className="font-medium text-gray-900">{accentColor.toUpperCase()}</div>
            <div className="text-sm text-gray-500">Click to choose a custom accent color</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'].map(color => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                accentColor === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* UI Density */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">UI Density</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setUiDensity('comfortable')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              uiDensity === 'comfortable'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900 mb-1">Comfortable</div>
            <div className="text-sm text-gray-500">More spacing between elements</div>
          </button>

          <button
            onClick={() => setUiDensity('compact')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              uiDensity === 'compact'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900 mb-1">Compact</div>
            <div className="text-sm text-gray-500">Denser layout, more content visible</div>
          </button>
        </div>
      </div>

      {/* Font Scale */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Font Scale</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Text Size: {fontScale}%</div>
              <div className="text-sm text-gray-500">Adjust text size for better readability</div>
            </div>
            <span className="text-2xl text-gray-900" style={{ fontSize: `${fontScale}%` }}>Aa</span>
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

          <div className="flex justify-between text-xs text-gray-500">
            <span>75%</span>
            <span>100%</span>
            <span>125%</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}
