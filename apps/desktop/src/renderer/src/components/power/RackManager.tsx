import { useState, useEffect } from 'react';
import {
  DimmerRack,
  PDRack,
  DimmerRackFormData,
  PDRackFormData,
  CIRCUIT_COUNT_OPTIONS,
  VOLTAGE_OPTIONS,
  MODULE_TYPE_OPTIONS,
  PHASE_CONFIG_OPTIONS,
  BUILDING_SERVICE_OPTIONS,
} from '../../types/power';
import { ModuleConfigDialog } from './ModuleConfigDialog';

interface RackManagerProps {
  projectId?: string;
  onRacksChange?: () => void;
}

type RackType = 'dimmer' | 'pd';

export function RackManager({ projectId = 'default-project', onRacksChange }: RackManagerProps) {
  const [dimmerRacks, setDimmerRacks] = useState<DimmerRack[]>([]);
  const [pdRacks, setPDRacks] = useState<PDRack[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [rackTypeToAdd, setRackTypeToAdd] = useState<RackType>('dimmer');
  const [editingRack, setEditingRack] = useState<{
    type: RackType;
    rack: DimmerRack | PDRack;
  } | null>(null);
  const [configuringModulesRack, setConfiguringModulesRack] = useState<DimmerRack | null>(null);

  // Load racks
  useEffect(() => {
    loadRacks();
  }, [projectId]);

  const loadRacks = async () => {
    if (!window.api?.dimmerRacks || !window.api?.pdRacks) return;

    try {
      const [dimmer, pd] = await Promise.all([
        window.api.dimmerRacks.getAll(projectId),
        window.api.pdRacks.getAll(projectId),
      ]);
      setDimmerRacks(dimmer);
      setPDRacks(pd);
    } catch (error) {
      console.error('Error loading racks:', error);
    }
  };

  const handleAddRack = (type: RackType) => {
    setRackTypeToAdd(type);
    setShowAddDialog(true);
  };

  const handleEditRack = (type: RackType, rack: DimmerRack | PDRack) => {
    setEditingRack({ type, rack });
    setShowAddDialog(true);
  };

  const handleDeleteRack = async (type: RackType, rackId: string, rackName: string) => {
    if (!confirm(`Delete ${rackName}?`)) return;

    try {
      if (type === 'dimmer') {
        await window.api.dimmerRacks.delete(rackId);
      } else {
        await window.api.pdRacks.delete(rackId);
      }
      await loadRacks();
      onRacksChange?.();
    } catch (error) {
      console.error('Error deleting rack:', error);
      alert('Failed to delete rack');
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingRack(null);
  };

  const handleSaveComplete = async () => {
    await loadRacks();
    handleCloseDialog();
    onRacksChange?.();
  };

  const handleConfigureModules = (rack: DimmerRack) => {
    setConfiguringModulesRack(rack);
  };

  const handleCloseModulesDialog = () => {
    setConfiguringModulesRack(null);
  };

  return (
    <div className="space-y-6">
      {/* Dimmer Racks Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dimmer Racks</h3>
          <button
            onClick={() => handleAddRack('dimmer')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
          >
            + Add Dimmer Rack
          </button>
        </div>

        {dimmerRacks.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {dimmerRacks.map((rack) => (
              <div
                key={rack.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{rack.name}</h4>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                      {rack.rack_identifier && <div>Identifier: {rack.rack_identifier}</div>}
                      {rack.manufacturer && <div>Manufacturer: {rack.manufacturer}</div>}
                      {rack.model && <div>Model: {rack.model}</div>}
                      <div>Circuits: {rack.circuit_count}</div>
                      <div>Type: {rack.module_type || 'dimmer'}</div>
                      <div>Channels/Module: {rack.channels_per_module || 12}</div>
                      <div>Watts/Module: {rack.watts_per_module || 2400}W</div>
                      {rack.location && <div>Location: {rack.location}</div>}
                      {rack.building_service && <div>Service: {rack.building_service}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleConfigureModules(rack)}
                      className="px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition"
                    >
                      Configure Modules
                    </button>
                    <button
                      onClick={() => handleEditRack('dimmer', rack)}
                      className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRack('dimmer', rack.id, rack.name)}
                      className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <p>No dimmer racks configured</p>
          </div>
        )}
      </div>

      {/* PD Racks Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PD Racks</h3>
          <button
            onClick={() => handleAddRack('pd')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
          >
            + Add PD Rack
          </button>
        </div>

        {pdRacks.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pdRacks.map((rack) => (
              <div
                key={rack.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{rack.name}</h4>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                      {rack.rack_identifier && <div>Identifier: {rack.rack_identifier}</div>}
                      <div>
                        Voltage: {rack.voltage}V
                        {rack.is_dual_voltage &&
                          rack.secondary_voltage &&
                          ` + ${rack.secondary_voltage}V`}
                      </div>
                      <div>Circuits: {rack.circuit_count}</div>
                      {rack.phase_config && <div>Phase: {rack.phase_config}</div>}
                      <div>Amps/Breaker: {rack.amps_per_breaker || 20}A</div>
                      {rack.location && <div>Location: {rack.location}</div>}
                      {rack.building_service && <div>Service: {rack.building_service}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditRack('pd', rack)}
                      className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRack('pd', rack.id, rack.name)}
                      className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <p>No PD racks configured</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {showAddDialog && (
        <RackDialog
          type={editingRack ? editingRack.type : rackTypeToAdd}
          rack={editingRack?.rack}
          projectId={projectId}
          onClose={handleCloseDialog}
          onSave={handleSaveComplete}
        />
      )}

      {/* Module Configuration Dialog */}
      {configuringModulesRack && (
        <ModuleConfigDialog rack={configuringModulesRack} onClose={handleCloseModulesDialog} />
      )}
    </div>
  );
}

// Dialog for adding/editing racks
interface RackDialogProps {
  type: RackType;
  rack?: DimmerRack | PDRack;
  projectId: string;
  onClose: () => void;
  onSave: () => void;
}

function RackDialog({ type, rack, projectId, onClose, onSave }: RackDialogProps) {
  const isEditing = !!rack;
  const isDimmer = type === 'dimmer';

  // Form state
  const [formData, setFormData] = useState<DimmerRackFormData | PDRackFormData>(() => {
    if (isDimmer) {
      const dimmerRack = rack as DimmerRack | undefined;
      return {
        name: dimmerRack?.name || '',
        rack_identifier: dimmerRack?.rack_identifier || '',
        manufacturer: dimmerRack?.manufacturer || '',
        model: dimmerRack?.model || '',
        circuit_count: dimmerRack?.circuit_count || 24,
        module_type: dimmerRack?.module_type || 'dimmer',
        channels_per_module: dimmerRack?.channels_per_module || 12,
        watts_per_module: dimmerRack?.watts_per_module || 2400,
        location: dimmerRack?.location || '',
        notes: dimmerRack?.notes || '',
        building_service: dimmerRack?.building_service || '',
      } as DimmerRackFormData;
    } else {
      const pdRack = rack as PDRack | undefined;
      return {
        name: pdRack?.name || '',
        rack_identifier: pdRack?.rack_identifier || '',
        voltage: pdRack?.voltage || 208,
        is_dual_voltage: pdRack?.is_dual_voltage || false,
        secondary_voltage: pdRack?.secondary_voltage,
        circuit_count: pdRack?.circuit_count || 24,
        phase_config: pdRack?.phase_config || 'three',
        amps_per_breaker: pdRack?.amps_per_breaker || 20,
        location: pdRack?.location || '',
        notes: pdRack?.notes || '',
        building_service: pdRack?.building_service || '',
      } as PDRackFormData;
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a rack name');
      return;
    }

    setIsSaving(true);
    try {
      if (isDimmer) {
        if (isEditing) {
          await window.api.dimmerRacks.update(rack.id, formData);
        } else {
          await window.api.dimmerRacks.create(formData as DimmerRackFormData, projectId);
        }
      } else {
        if (isEditing) {
          await window.api.pdRacks.update(rack.id, formData);
        } else {
          await window.api.pdRacks.create(formData as PDRackFormData, projectId);
        }
      }
      onSave();
    } catch (error) {
      console.error('Error saving rack:', error);
      alert('Failed to save rack');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit' : 'Add'} {isDimmer ? 'Dimmer' : 'PD'} Rack
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name and Identifier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rack Identifier
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (e.g., "A", "FOH", "ML")
                </span>
              </label>
              <input
                type="text"
                value={formData.rack_identifier || ''}
                onChange={(e) =>
                  setFormData({ ...formData, rack_identifier: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isDimmer ? 'A, B, FOH...' : 'Z, Y, PD...'}
              />
            </div>
          </div>

          {isDimmer ? (
            <>
              {/* Dimmer-specific fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={(formData as DimmerRackFormData).manufacturer || ''}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={(formData as DimmerRackFormData).model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Circuit Count *
                </label>
                <select
                  value={(formData as DimmerRackFormData).circuit_count}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      circuit_count: Number(e.target.value) as 12 | 24 | 48 | 96,
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CIRCUIT_COUNT_OPTIONS.map((count) => (
                    <option key={count} value={count}>
                      {count} circuits
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Module Type
                  </label>
                  <select
                    value={(formData as DimmerRackFormData).module_type}
                    onChange={(e) =>
                      setFormData({ ...formData, module_type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MODULE_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Channels/Module
                  </label>
                  <input
                    type="number"
                    value={(formData as DimmerRackFormData).channels_per_module || 12}
                    onChange={(e) =>
                      setFormData({ ...formData, channels_per_module: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Watts/Module
                  </label>
                  <input
                    type="number"
                    value={(formData as DimmerRackFormData).watts_per_module || 2400}
                    onChange={(e) =>
                      setFormData({ ...formData, watts_per_module: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* PD-specific fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Primary Voltage *
                  </label>
                  <select
                    value={(formData as PDRackFormData).voltage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        voltage: Number(e.target.value) as 120 | 208 | 230 | 240,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {VOLTAGE_OPTIONS.map((voltage) => (
                      <option key={voltage} value={voltage}>
                        {voltage}V
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Circuit Count *
                  </label>
                  <select
                    value={(formData as PDRackFormData).circuit_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        circuit_count: Number(e.target.value) as 12 | 24 | 48 | 96,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CIRCUIT_COUNT_OPTIONS.map((count) => (
                      <option key={count} value={count}>
                        {count} circuits
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dual Voltage */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData as PDRackFormData).is_dual_voltage || false}
                    onChange={(e) =>
                      setFormData({ ...formData, is_dual_voltage: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dual Voltage Rack
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      (Has both 120V and 208V outputs)
                    </span>
                  </span>
                </label>
              </div>

              {(formData as PDRackFormData).is_dual_voltage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Secondary Voltage
                  </label>
                  <select
                    value={(formData as PDRackFormData).secondary_voltage || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, secondary_voltage: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select voltage...</option>
                    {VOLTAGE_OPTIONS.filter((v) => v !== (formData as PDRackFormData).voltage).map(
                      (voltage) => (
                        <option key={voltage} value={voltage}>
                          {voltage}V
                        </option>
                      ),
                    )}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phase Config
                  </label>
                  <select
                    value={(formData as PDRackFormData).phase_config}
                    onChange={(e) =>
                      setFormData({ ...formData, phase_config: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PHASE_CONFIG_OPTIONS.map((config) => (
                      <option key={config} value={config}>
                        {config}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amps/Breaker
                  </label>
                  <input
                    type="number"
                    value={(formData as PDRackFormData).amps_per_breaker || 20}
                    onChange={(e) =>
                      setFormData({ ...formData, amps_per_breaker: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Common fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Stage Right, FOH, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Building Service
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (for load planning)
                </span>
              </label>
              <select
                value={formData.building_service || 'None'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    building_service: e.target.value === 'None' ? '' : e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BUILDING_SERVICE_OPTIONS.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
