import { useState, useEffect } from 'react';
import { DimmerRack, MODULE_TYPE_OPTIONS, ModuleType } from '../../types/power';
import { DimmerRackModule } from '../../../../main/database/queries/dimmerRackModules';

interface ModuleConfigDialogProps {
  rack: DimmerRack;
  onClose: () => void;
}

export function ModuleConfigDialog({ rack, onClose }: ModuleConfigDialogProps) {
  const [modules, setModules] = useState<DimmerRackModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, [rack.id]);

  const loadModules = async () => {
    if (!window.api?.dimmerRackModules) {
      console.error('dimmerRackModules API not available');
      setIsLoading(false);
      return;
    }

    try {
      const modules = await window.api.dimmerRackModules.getByRackId(rack.id);
      setModules(modules);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModule = async () => {
    if (!window.api?.dimmerRackModules) return;

    // Find the next available circuit range
    const lastModule = modules.length > 0 ? modules[modules.length - 1] : null;
    const startCircuit = lastModule ? lastModule.end_circuit + 1 : 1;
    const endCircuit = Math.min(startCircuit + 11, rack.circuit_count);

    if (startCircuit > rack.circuit_count) {
      alert('No more circuits available in this rack');
      return;
    }

    try {
      await window.api.dimmerRackModules.create({
        rack_id: rack.id,
        start_circuit: startCircuit,
        end_circuit: endCircuit,
        module_type: 'dimmer',
        watts_per_circuit: 2400
      });
      await loadModules();
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Failed to create module');
    }
  };

  const handleUpdateModule = async (id: string, updates: Partial<DimmerRackModule>) => {
    if (!window.api?.dimmerRackModules) return;

    try {
      await window.api.dimmerRackModules.update(id, updates);
      await loadModules();
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Failed to update module');
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!window.api?.dimmerRackModules) return;
    if (!confirm('Delete this module configuration?')) return;

    try {
      await window.api.dimmerRackModules.delete(id);
      await loadModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Failed to delete module');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Configure Modules: {rack.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Define module types for circuit ranges ({rack.circuit_count} total circuits)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading modules...
            </div>
          ) : (
            <>
              {/* Module List */}
              {modules.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {modules.map(module => (
                    <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Circuit Range */}
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Circuit Range
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={module.start_circuit}
                              onChange={e => handleUpdateModule(module.id, { start_circuit: parseInt(e.target.value) })}
                              min={1}
                              max={rack.circuit_count}
                              className="w-20 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                            />
                            <span className="text-gray-500 dark:text-gray-400">to</span>
                            <input
                              type="number"
                              value={module.end_circuit}
                              onChange={e => handleUpdateModule(module.id, { end_circuit: parseInt(e.target.value) })}
                              min={module.start_circuit}
                              max={rack.circuit_count}
                              className="w-20 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Module Type */}
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Module Type
                          </label>
                          <select
                            value={module.module_type}
                            onChange={e => handleUpdateModule(module.id, { module_type: e.target.value as ModuleType })}
                            className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                          >
                            {MODULE_TYPE_OPTIONS.map(type => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Watts per Circuit */}
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Watts/Circuit
                          </label>
                          <input
                            type="number"
                            value={module.watts_per_circuit || 2400}
                            onChange={e => handleUpdateModule(module.id, { watts_per_circuit: parseInt(e.target.value) })}
                            className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                          />
                        </div>

                        {/* Notes */}
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={module.notes || ''}
                            onChange={e => handleUpdateModule(module.id, { notes: e.target.value })}
                            placeholder="Optional"
                            className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                          />
                        </div>

                        {/* Delete Button */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => handleDeleteModule(module.id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition"
                            title="Delete module"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No modules configured. Click "Add Module" to start.
                </div>
              )}

              {/* Add Module Button */}
              <button
                onClick={handleAddModule}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                + Add Module
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
