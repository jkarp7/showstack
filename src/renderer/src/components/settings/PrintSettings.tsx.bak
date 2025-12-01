import { useState } from 'react';
import { Printer, FileText, Save } from 'lucide-react';

export function PrintSettings() {
  const [paperSize, setPaperSize] = useState('letter');
  const [orientation, setOrientation] = useState('portrait');
  const [dpi, setDpi] = useState(300);
  const [includeWatermark, setIncludeWatermark] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Print Settings</h2>
        <p className="text-gray-600">Configure default print and PDF export settings</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-blue-600" />
          <span>Page Setup</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          <strong>Controls:</strong> Default page size, orientation, and resolution for all PDF exports and printed shop orders.
          These settings can be overridden per project.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
            <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="letter">Letter (8.5" × 11")</option>
              <option value="legal">Legal (8.5" × 14")</option>
              <option value="tabloid">Tabloid (11" × 17")</option>
              <option value="a4">A4</option>
              <option value="a3">A3</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Standard theatrical shop orders typically use Tabloid (11" × 17")
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
            <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Landscape is recommended for plot layouts with wide stages
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Resolution (DPI)</label>
            <select value={dpi} onChange={(e) => setDpi(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="150">150 DPI (Draft)</option>
              <option value="300">300 DPI (Standard)</option>
              <option value="600">600 DPI (High Quality)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Higher DPI produces sharper prints but larger file sizes. 300 DPI is recommended for professional shop orders.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>PDF Export Options</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          <strong>Controls:</strong> Additional options for PDF exports, such as watermarks for draft documents.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Include Watermark</div>
              <div className="text-sm text-gray-500">Add "DRAFT" watermark to PDFs for work-in-progress documents</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={includeWatermark} onChange={(e) => setIncludeWatermark(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
