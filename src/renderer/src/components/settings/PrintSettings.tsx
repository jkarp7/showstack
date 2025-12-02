import { Printer, FileText, Save } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export function PrintSettings() {
  const print = useSettingsStore((state) => state.print);
  const updatePrint = useSettingsStore((state) => state.updatePrint);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Print Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure default print and PDF export settings</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Page Setup</span>
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <strong>Controls:</strong> Default page size, orientation, and resolution for all PDF exports and printed shop orders.
          These settings can be overridden per project.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paper Size</label>
            <select value={print.paperSize} onChange={(e) => updatePrint({ paperSize: e.target.value as any })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="letter">Letter (8.5" × 11")</option>
              <option value="legal">Legal (8.5" × 14")</option>
              <option value="tabloid">Tabloid (11" × 17")</option>
              <option value="a4">A4</option>
              <option value="a3">A3</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Standard theatrical shop orders typically use Tabloid (11" × 17")
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Orientation</label>
            <select value={print.orientation} onChange={(e) => updatePrint({ orientation: e.target.value as any })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Landscape is recommended for plot layouts with wide stages
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution (DPI)</label>
            <select value={print.dpi} onChange={(e) => updatePrint({ dpi: parseInt(e.target.value) as any })} className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="150">150 DPI (Draft)</option>
              <option value="300">300 DPI (Standard)</option>
              <option value="600">600 DPI (High Quality)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Higher DPI produces sharper prints but larger file sizes. 300 DPI is recommended for professional shop orders.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>PDF Export Options</span>
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <strong>Controls:</strong> Additional options for PDF exports, such as watermarks for draft documents.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Include Watermark</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Add "DRAFT" watermark to PDFs for work-in-progress documents</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={print.includeWatermark} onChange={(e) => updatePrint({ includeWatermark: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => console.log('Save')} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium">
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
}
