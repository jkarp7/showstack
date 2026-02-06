import { useState, useEffect } from 'react';
import { InfrastructureEquipment, PortAssignment } from '../../types/infrastructure';
import { PortAssignmentEditor } from './PortAssignmentEditor';

interface EditInfrastructureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<InfrastructureEquipment>) => Promise<void>;
  equipment: InfrastructureEquipment | null;
}

export function EditInfrastructureDialog({
  isOpen,
  onClose,
  onUpdate,
  equipment,
}: EditInfrastructureDialogProps) {
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState<'network' | 'data_distribution' | 'audio' | 'video'>(
    'network',
  );
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [hostname, setHostname] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Active');
  const [portCount, setPortCount] = useState(0);
  const [portAssignments, setPortAssignments] = useState<PortAssignment[]>([]);

  // Populate form when equipment changes
  useEffect(() => {
    if (equipment) {
      setName(equipment.name || '');
      setManufacturer(equipment.manufacturer || '');
      setModel(equipment.model || '');
      setQuantity(equipment.quantity || 1);
      setCategory(equipment.category || 'network');
      setIpAddress(equipment.ip_address || '');
      setMacAddress(equipment.mac_address || '');
      setHostname(equipment.hostname || '');
      setLocation(equipment.location || '');
      setNotes(equipment.notes || '');
      setStatus(equipment.status || 'Active');
      setPortCount(equipment.port_count || 0);
      setPortAssignments(equipment.port_assignments || []);
    }
  }, [equipment]);

  if (!isOpen || !equipment) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Please enter an equipment name');
      return;
    }

    const updates: Partial<InfrastructureEquipment> = {
      name: name.trim(),
      manufacturer: manufacturer.trim() || undefined,
      model: model.trim() || undefined,
      quantity,
      category,
      ip_address: ipAddress.trim() || undefined,
      mac_address: macAddress.trim() || undefined,
      hostname: hostname.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      port_count: portCount > 0 ? portCount : undefined,
      port_assignments: portCount > 0 ? portAssignments : undefined,
    };

    try {
      await onUpdate(equipment.id, updates);
      onClose();
    } catch (error) {
      console.error('Failed to update equipment:', error);
      alert('Failed to update equipment. Please try again.');
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Infrastructure Equipment
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Equipment Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., FOH Network Switch"
                autoFocus
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Cisco, Netgear"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., SG350-28"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="network">Network Equipment</option>
                <option value="data_distribution">Data Distribution</option>
                <option value="audio">Audio Equipment</option>
                <option value="video">Video Equipment</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IP Address
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., 10.0.1.100"
              />
            </div>

            {/* MAC Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                MAC Address
              </label>
              <input
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., 00:1A:2B:3C:4D:5E"
              />
            </div>

            {/* Hostname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hostname
              </label>
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., foh-switch-01"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., FOH, Stage Right"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Spare">Spare</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Additional notes..."
              />
            </div>

            {/* Port Assignments */}
            <div className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Port Configuration
              </h3>
              <PortAssignmentEditor
                equipmentId={equipment.id}
                portCount={portCount}
                onPortCountChange={setPortCount}
                portAssignments={portAssignments}
                onPortAssignmentsChange={setPortAssignments}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
