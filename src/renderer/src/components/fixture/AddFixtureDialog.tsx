import { useState } from 'react';
import { Fixture } from '../../types';

interface AddFixtureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (fixtures: Partial<Fixture>[]) => void;
  existingFixturesCount: number;
}

export function AddFixtureDialog({ isOpen, onClose, onAdd, existingFixturesCount }: AddFixtureDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [position, setPosition] = useState('');
  const [unit, setUnit] = useState<string>('');
  const [type, setType] = useState('Source Four 26°');
  const [purpose, setPurpose] = useState('');
  const [channel, setChannel] = useState<string>('');
  const [dimmer, setDimmer] = useState('');
  const [circuit, setCircuit] = useState('');
  const [color, setColor] = useState('');
  const [gobo, setGobo] = useState('');
  const [location, setLocation] = useState('');
  const [wattage, setWattage] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Active');
  const [notOnPlot, setNotOnPlot] = useState(false);

  // Auto-increment options
  const [autoIncrementUnit, setAutoIncrementUnit] = useState(true);
  const [autoIncrementChannel, setAutoIncrementChannel] = useState(true);
  const [autoIncrementDimmer, setAutoIncrementDimmer] = useState(false);
  const [autoIncrementCircuit, setAutoIncrementCircuit] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fixtures: Partial<Fixture>[] = [];
    for (let i = 0; i < quantity; i++) {
      const fixture: Partial<Fixture> = {
        position: position || undefined,
        type: type || undefined,
        purpose: purpose || undefined,
        color: color || undefined,
        gobo: gobo || undefined,
        location: location || undefined,
        notes: notes || undefined,
        status: notOnPlot ? 'Not on Plot' : status || undefined,
      };

      // Handle unit with auto-increment
      if (unit) {
        const unitNum = parseInt(unit);
        fixture.unit = autoIncrementUnit ? unitNum + i : unitNum;
      }

      // Handle channel with auto-increment
      if (channel) {
        const channelNum = parseInt(channel);
        if (!isNaN(channelNum)) {
          fixture.channel = String(autoIncrementChannel ? channelNum + i : channelNum);
        } else {
          fixture.channel = channel;
        }
      }

      // Handle dimmer with auto-increment
      if (dimmer) {
        const dimmerNum = parseInt(dimmer);
        if (!isNaN(dimmerNum)) {
          fixture.dimmer = String(autoIncrementDimmer ? dimmerNum + i : dimmerNum);
        } else {
          fixture.dimmer = dimmer;
        }
      }

      // Handle circuit with auto-increment
      if (circuit) {
        const circuitNum = parseInt(circuit);
        if (!isNaN(circuitNum)) {
          fixture.circuit = String(autoIncrementCircuit ? circuitNum + i : circuitNum);
        } else {
          fixture.circuit = circuit;
        }
      }

      // Handle wattage
      if (wattage) {
        const wattageNum = parseInt(wattage);
        if (!isNaN(wattageNum)) {
          fixture.wattage = wattageNum;
        }
      }

      fixtures.push(fixture);
    }

    onAdd(fixtures);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setQuantity(1);
    setPosition('');
    setUnit('');
    setType('Source Four 26°');
    setPurpose('');
    setChannel('');
    setDimmer('');
    setCircuit('');
    setColor('');
    setGobo('');
    setLocation('');
    setWattage('');
    setNotes('');
    setStatus('Active');
    setNotOnPlot(false);
    setAutoIncrementUnit(true);
    setAutoIncrementChannel(true);
    setAutoIncrementDimmer(false);
    setAutoIncrementCircuit(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Add Fixture(s)</h2>

        <form onSubmit={handleSubmit}>
          {/* Quantity and Not on Plot */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">
                Number of Fixtures
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notOnPlot}
                  onChange={(e) => setNotOnPlot(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">Not on Plot</span>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-2">
                Position
              </label>
              <input
                id="position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., 1st Electric, FOH"
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-300 mb-2">
                Unit #
                {quantity > 1 && (
                  <label className="ml-3 inline-flex items-center gap-1 text-xs font-normal">
                    <input
                      type="checkbox"
                      checked={autoIncrementUnit}
                      onChange={(e) => setAutoIncrementUnit(e.target.checked)}
                      className="w-3 h-3"
                    />
                    Auto-increment
                  </label>
                )}
              </label>
              <input
                id="unit"
                type="number"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Unit number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                Type
              </label>
              <input
                id="type"
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Fixture type"
              />
            </div>
            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-300 mb-2">
                Purpose
              </label>
              <input
                id="purpose"
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Lighting purpose"
              />
            </div>
          </div>

          {/* Technical Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="channel" className="block text-sm font-medium text-gray-300 mb-2">
                Channel
                {quantity > 1 && (
                  <label className="ml-3 inline-flex items-center gap-1 text-xs font-normal">
                    <input
                      type="checkbox"
                      checked={autoIncrementChannel}
                      onChange={(e) => setAutoIncrementChannel(e.target.checked)}
                      className="w-3 h-3"
                    />
                    Auto-increment
                  </label>
                )}
              </label>
              <input
                id="channel"
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Control channel"
              />
            </div>
            <div>
              <label htmlFor="dimmer" className="block text-sm font-medium text-gray-300 mb-2">
                Dimmer
                {quantity > 1 && (
                  <label className="ml-3 inline-flex items-center gap-1 text-xs font-normal">
                    <input
                      type="checkbox"
                      checked={autoIncrementDimmer}
                      onChange={(e) => setAutoIncrementDimmer(e.target.checked)}
                      className="w-3 h-3"
                    />
                    Auto-increment
                  </label>
                )}
              </label>
              <input
                id="dimmer"
                type="text"
                value={dimmer}
                onChange={(e) => setDimmer(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Dimmer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="circuit" className="block text-sm font-medium text-gray-300 mb-2">
                Circuit
                {quantity > 1 && (
                  <label className="ml-3 inline-flex items-center gap-1 text-xs font-normal">
                    <input
                      type="checkbox"
                      checked={autoIncrementCircuit}
                      onChange={(e) => setAutoIncrementCircuit(e.target.checked)}
                      className="w-3 h-3"
                    />
                    Auto-increment
                  </label>
                )}
              </label>
              <input
                id="circuit"
                type="text"
                value={circuit}
                onChange={(e) => setCircuit(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Circuit"
              />
            </div>
            <div>
              <label htmlFor="wattage" className="block text-sm font-medium text-gray-300 mb-2">
                Wattage
              </label>
              <input
                id="wattage"
                type="number"
                value={wattage}
                onChange={(e) => setWattage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Watts"
              />
            </div>
          </div>

          {/* Appearance */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-2">
                Color
              </label>
              <input
                id="color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., R80, L201"
              />
            </div>
            <div>
              <label htmlFor="gobo" className="block text-sm font-medium text-gray-300 mb-2">
                Gobo
              </label>
              <input
                id="gobo"
                type="text"
                value={gobo}
                onChange={(e) => setGobo(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Gobo pattern"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Physical location"
              />
            </div>
          </div>

          {/* Status and Notes */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={notOnPlot}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="Active">Active</option>
                <option value="Spare">Spare</option>
                <option value="Rental">Rental</option>
                <option value="Needs Repair">Needs Repair</option>
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {quantity > 1 && `Will create ${quantity} fixture${quantity === 1 ? '' : 's'}`}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
              >
                Add Fixture{quantity > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
