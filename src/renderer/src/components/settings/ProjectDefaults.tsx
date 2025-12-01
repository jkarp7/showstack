import { useState } from 'react';
import { FileText, Save } from 'lucide-react';

export function ProjectDefaults() {
  const [productionName, setProductionName] = useState('');
  const [venue, setVenue] = useState('');
  const [designer, setDesigner] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Defaults</h2>
        <p className="text-gray-600 dark:text-gray-400">Set default values for new projects</p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Default Project Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Production Name Template</label>
            <input type="text" value={productionName} onChange={(e) => setProductionName(e.target.value)} placeholder="Untitled Production" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Venue</label>
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="TBD" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Lighting Designer</label>
            <input type="text" value={designer} onChange={(e) => setDesigner(e.target.value)} placeholder="From User Profile" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Default Contacts</h3>
        <div className="space-y-3">
          {['General Manager', 'Production Manager', 'Master Electrician'].map(role => (
            <div key={role} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{role}</div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Name" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input type="email" placeholder="Email" className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => console.log('Save')} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium">
          <Save className="w-4 h-4" />
          <span>Save Defaults</span>
        </button>
      </div>
    </div>
  );
}
