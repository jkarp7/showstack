import { useState } from 'react';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, logoPath: string, enabledModules: string[]) => void;
}

export function NewProjectDialog({ isOpen, onClose, onCreate }: NewProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [enabledModules, setEnabledModules] = useState<string[]>(['production']); // Production is default/unlocked

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim(), logoPath, enabledModules);
      // Reset form
      setName('');
      setDescription('');
      setLogoPath('');
      setEnabledModules(['production']);
      onClose();
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setLogoPath('');
    setEnabledModules(['production']);
    onClose();
  };

  const handleLogoUpload = async () => {
    if (typeof window !== 'undefined' && window.api?.dialog) {
      const filePath = await window.api.dialog.openImage();
      if (filePath) {
        setLogoPath(filePath);
      }
    } else {
      console.warn('Dialog API not available');
    }
  };

  const toggleModule = (module: string) => {
    if (enabledModules.includes(module)) {
      setEnabledModules(enabledModules.filter(m => m !== module));
    } else {
      setEnabledModules([...enabledModules, module]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">Create New Project</h2>

        <form onSubmit={handleSubmit}>
          {/* Project Name */}
          <div className="mb-4">
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Hamilton National Tour 2025"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="project-description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          {/* Logo Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Show Logo
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogoUpload}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
              >
                {logoPath ? 'Change Logo' : 'Upload Logo'}
              </button>
              {logoPath && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>✓</span>
                  <span className="truncate max-w-xs">{logoPath}</span>
                  <button
                    type="button"
                    onClick={() => setLogoPath('')}
                    className="text-red-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used as project preview image (JPG, PNG recommended)
            </p>
          </div>

          {/* Module Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Modules to Use
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-650">
                <input
                  type="checkbox"
                  checked={enabledModules.includes('production')}
                  onChange={() => toggleModule('production')}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-medium">ShowStack:Production</div>
                  <p className="text-xs text-gray-400">Fixture management & technical planning</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-650">
                <input
                  type="checkbox"
                  checked={enabledModules.includes('manager')}
                  onChange={() => toggleModule('manager')}
                  disabled={true}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">ShowStack:Manager</span>
                    <span className="px-2 py-0.5 bg-gray-600 text-xs rounded">Locked</span>
                  </div>
                  <p className="text-xs text-gray-400">Tour scheduling & logistics</p>
                </div>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
              disabled={!name.trim() || enabledModules.length === 0}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
