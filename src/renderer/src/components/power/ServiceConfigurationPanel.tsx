import { Settings, Plus, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

interface ServiceConfigurationPanelProps {
  projectId: string;
}

export function ServiceConfigurationPanel({ projectId }: ServiceConfigurationPanelProps) {
  const services = useSettingsStore((state) => state.powerServices.services);
  const updatePowerServices = useSettingsStore((state) => state.updatePowerServices);

  const handleAddService = () => {
    const newServices = [...services, { name: `Service ${String.fromCharCode(65 + services.length)}`, capacity_amps: 400 }];
    updatePowerServices({ services: newServices });
  };

  const handleRemoveService = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    updatePowerServices({ services: newServices });
  };

  const handleUpdateService = (index: number, updates: Partial<{ name: string; capacity_amps: number }>) => {
    const newServices = services.map((s, i) => i === index ? { ...s, ...updates } : s);
    updatePowerServices({ services: newServices });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Building Services</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Define electrical service capacities for load balancing calculations
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {services.map((service, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => handleUpdateService(index, { name: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Service A"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacity (Amps)
                </label>
                <input
                  type="number"
                  min="0"
                  value={service.capacity_amps}
                  onChange={(e) => handleUpdateService(index, { capacity_amps: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="400"
                />
              </div>
            </div>

            <button
              onClick={() => handleRemoveService(index)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
              title="Remove service"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddService}
        className="mt-4 flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
      >
        <Plus className="w-4 h-4" />
        Add Service
      </button>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Tip:</strong> Service capacities are used for load balancing calculations.
          When you assign racks to a service, the system will calculate total load vs. capacity
          to help prevent overloading your building's electrical service.
        </p>
      </div>
    </div>
  );
}
