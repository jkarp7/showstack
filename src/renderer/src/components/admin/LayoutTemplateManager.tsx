import { useState, useEffect } from 'react';
import { Download, Upload, RefreshCw, FileJson, AlertCircle, CheckCircle, X } from 'lucide-react';

export function LayoutTemplateManager() {
  const [layouts, setLayouts] = useState<any[]>([]);
  const [defaultLayoutFiles, setDefaultLayoutFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadLayouts();
    loadDefaultLayoutFiles();
  }, []);

  const loadLayouts = async () => {
    try {
      const allLayouts = await window.api.prep.layoutTemplates.getByProjectId('', '');
      const defaultLayouts = allLayouts.filter((l: any) => l.is_default);
      setLayouts(defaultLayouts);
    } catch (error) {
      console.error('Error loading layouts:', error);
      showNotification('error', 'Failed to load layouts');
    }
  };

  const loadDefaultLayoutFiles = async () => {
    try {
      const result = await window.api.admin.getDefaultLayoutFiles();
      if (result.success) {
        setDefaultLayoutFiles(result.files);
      }
    } catch (error) {
      console.error('Error loading default layout files:', error);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleExportLayout = async (templateId: string) => {
    try {
      setIsLoading(true);
      const result = await window.api.admin.exportLayout(templateId);

      if (result.canceled) {
        showNotification('info', 'Export canceled');
        return;
      }

      if (result.success) {
        showNotification('success', `Layout exported to ${result.filePath}`);
      } else {
        showNotification('error', 'Failed to export layout');
      }
    } catch (error) {
      console.error('Error exporting layout:', error);
      showNotification('error', 'An error occurred while exporting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAllLayouts = async () => {
    try {
      setIsLoading(true);
      const result = await window.api.admin.exportAllDefaultLayouts();

      if (result.canceled) {
        showNotification('info', 'Export canceled');
        return;
      }

      if (result.success) {
        showNotification(
          'success',
          `Exported ${result.count} layout${result.count !== 1 ? 's' : ''} to ${result.directory}`
        );
        await loadDefaultLayoutFiles();
      } else {
        showNotification('error', 'Failed to export layouts');
      }
    } catch (error) {
      console.error('Error exporting all layouts:', error);
      showNotification('error', 'An error occurred while exporting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportLayouts = async () => {
    try {
      setIsLoading(true);
      const result = await window.api.admin.importLayouts();

      if (result.canceled) {
        showNotification('info', 'Import canceled');
        return;
      }

      if (result.success) {
        let message = `Imported ${result.count} layout${result.count !== 1 ? 's' : ''}`;
        if (result.errors && result.errors.length > 0) {
          message += ` with ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`;
        }
        showNotification(result.errors && result.errors.length > 0 ? 'error' : 'success', message);

        // Log errors to console for debugging
        if (result.errors) {
          console.error('Import errors:', result.errors);
        }

        await loadLayouts();
      } else {
        showNotification('error', 'Failed to import layouts');
      }
    } catch (error) {
      console.error('Error importing layouts:', error);
      showNotification('error', 'An error occurred while importing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToFactory = async () => {
    if (!confirm('Are you sure you want to reset all default layouts to factory settings? This will delete any customizations.')) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await window.api.admin.resetLayoutsToFactory();

      if (result.success) {
        showNotification('success', 'Layouts reset to factory defaults');
        await loadLayouts();
      } else {
        showNotification('error', 'Failed to reset layouts');
      }
    } catch (error) {
      console.error('Error resetting layouts:', error);
      showNotification('error', 'An error occurred while resetting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : notification.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <FileJson className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Layout Template Management</h2>
        <p className="text-gray-600">
          Export, import, and manage default page layout templates for ShowStack:Prep
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportAllLayouts}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>Export All Default Layouts</span>
          </button>

          <button
            onClick={handleImportLayouts}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            <span>Import Layouts from JSON</span>
          </button>

          <button
            onClick={handleResetToFactory}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Reset to Factory Defaults</span>
          </button>
        </div>
      </div>

      {/* Default Layout Files Info */}
      {defaultLayoutFiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <FileJson className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Default Layout JSON Files</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {defaultLayoutFiles.map((file) => (
                  <li key={file} className="font-mono">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Current Default Layouts */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Current Default Layouts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {layouts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No default layouts found. Use the "Reset to Factory Defaults" button to create them.
            </div>
          ) : (
            layouts.map((layout) => (
              <div key={layout.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{layout.name}</h4>
                    {layout.description && (
                      <p className="text-sm text-gray-600 mt-1">{layout.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Type: <span className="font-mono">{layout.page_type}</span></span>
                      <span>Grid: {layout.grid_columns}x{layout.grid_rows}</span>
                      <span>Size: {layout.page_width}x{layout.page_height}px</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExportLayout(layout.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Export</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">How to Use</h4>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Export all default layouts to save current templates as JSON files</li>
          <li>Edit JSON files in the exported directory or use the Layout Designer</li>
          <li>Import modified JSON files to update default layouts</li>
          <li>Use "Reset to Factory Defaults" to restore original templates</li>
        </ol>
      </div>
    </div>
  );
}
