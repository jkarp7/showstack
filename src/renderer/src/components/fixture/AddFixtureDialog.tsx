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
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [purpose, setPurpose] = useState('');
  const [channel, setChannel] = useState<string>('');
  const [address, setAddress] = useState('');
  const [dimmer, setDimmer] = useState('');
  const [circuit, setCircuit] = useState('');
  const [circuitNumber, setCircuitNumber] = useState('');
  const [color, setColor] = useState('');
  const [gobo, setGobo] = useState('');
  const [accessories, setAccessories] = useState('');
  const [location, setLocation] = useState('');
  const [system, setSystem] = useState('');
  const [wattage, setWattage] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Active');
  const [notOnPlot, setNotOnPlot] = useState(false);

  // Auto-increment options
  const [autoIncrementUnit, setAutoIncrementUnit] = useState(true);
  const [autoIncrementChannel, setAutoIncrementChannel] = useState(true);
  const [autoIncrementAddress, setAutoIncrementAddress] = useState(false);
  const [autoIncrementDimmer, setAutoIncrementDimmer] = useState(false);
  const [autoIncrementCircuit, setAutoIncrementCircuit] = useState(false);
  const [autoIncrementCircuitNumber, setAutoIncrementCircuitNumber] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fixtures: Partial<Fixture>[] = [];
    for (let i = 0; i < quantity; i++) {
      const fixture: Partial<Fixture> = {
        position: position || undefined,
        type: type || undefined,
        manufacturer: manufacturer || undefined,
        model: model || undefined,
        purpose: purpose || undefined,
        color: color || undefined,
        gobo: gobo || undefined,
        location: location || undefined,
        system: system || undefined,
        notes: notes || undefined,
        status: notOnPlot ? 'Not on Plot' : status || undefined,
      };

      // Handle accessories (comma-separated to array)
      if (accessories) {
        fixture.accessories = accessories.split(',').map(a => a.trim()).filter(Boolean);
      }

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

      // Handle address with auto-increment and DMX calculation
      if (address) {
        let currentAddress = address;

        // If auto-incrementing, calculate new address for this fixture
        if (autoIncrementAddress && i > 0) {
          // Parse the base address to get starting raw address
          let rawAddress: number;
          if (address.includes('/')) {
            const parts = address.split('/');
            const baseUniverse = parseInt(parts[0]);
            const baseDmx = parseInt(parts[1]);
            rawAddress = (baseUniverse - 1) * 512 + baseDmx;
          } else {
            rawAddress = parseInt(address);
          }

          if (!isNaN(rawAddress)) {
            rawAddress += i;
            const universe = Math.ceil(rawAddress / 512);
            const dmx = ((rawAddress - 1) % 512) + 1;
            currentAddress = `${universe}/${dmx}`;
          }
        }

        // Parse and set universe/dmx_address
        if (currentAddress.includes('/')) {
          const parts = currentAddress.split('/');
          if (parts.length === 2) {
            const universe = parseInt(parts[0]);
            const dmx = parseInt(parts[1]);
            if (!isNaN(universe) && !isNaN(dmx)) {
              fixture.universe = universe;
              fixture.dmx_address = dmx;
            }
          }
        } else {
          const rawAddress = parseInt(currentAddress);
          if (!isNaN(rawAddress) && rawAddress > 0) {
            fixture.universe = Math.ceil(rawAddress / 512);
            fixture.dmx_address = ((rawAddress - 1) % 512) + 1;
          }
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

      // Handle circuit name with auto-increment
      if (circuit) {
        const circuitNum = parseInt(circuit);
        if (!isNaN(circuitNum)) {
          fixture.circuit = String(autoIncrementCircuit ? circuitNum + i : circuitNum);
        } else {
          fixture.circuit = circuit;
        }
      }

      // Handle circuit number with auto-increment
      if (circuitNumber) {
        const circuitNum = parseInt(circuitNumber);
        if (!isNaN(circuitNum)) {
          fixture.circuit_number = String(autoIncrementCircuitNumber ? circuitNum + i : circuitNum);
        } else {
          fixture.circuit_number = circuitNumber;
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
    setManufacturer('');
    setModel('');
    setPurpose('');
    setChannel('');
    setAddress('');
    setDimmer('');
    setCircuit('');
    setCircuitNumber('');
    setColor('');
    setGobo('');
    setAccessories('');
    setLocation('');
    setSystem('');
    setWattage('');
    setNotes('');
    setStatus('Active');
    setNotOnPlot(false);
    setAutoIncrementUnit(true);
    setAutoIncrementChannel(true);
    setAutoIncrementAddress(false);
    setAutoIncrementDimmer(false);
    setAutoIncrementCircuit(false);
    setAutoIncrementCircuitNumber(false);
    onClose();
  };

  const inputClass = "w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500";
  const labelClass = "text-xs font-medium text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Add Fixture(s)</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-[1fr_240px] gap-6 p-6 overflow-y-auto">
            {/* Left Side: Input Fields */}
            <div className="space-y-3">
              {/* Position & Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Position</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className={inputClass}
                    placeholder="e.g., 1st Electric"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Unit #
                    {quantity > 1 && (
                      <label className="ml-2 inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={autoIncrementUnit}
                          onChange={(e) => setAutoIncrementUnit(e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span className="text-[10px]">Auto</span>
                      </label>
                    )}
                  </label>
                  <input
                    type="number"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={inputClass}
                    placeholder="#"
                  />
                </div>
              </div>

              {/* Type & Purpose */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Type</label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={inputClass}
                    placeholder="Fixture type"
                  />
                </div>
                <div>
                  <label className={labelClass}>Purpose</label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className={inputClass}
                    placeholder="Purpose"
                  />
                </div>
              </div>

              {/* Manufacturer & Model */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Manufacturer</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className={inputClass}
                    placeholder="e.g., ETC"
                  />
                </div>
                <div>
                  <label className={labelClass}>Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className={inputClass}
                    placeholder="Model"
                  />
                </div>
              </div>

              {/* Channel & Address */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>
                    Channel
                    {quantity > 1 && (
                      <label className="ml-2 inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={autoIncrementChannel}
                          onChange={(e) => setAutoIncrementChannel(e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span className="text-[10px]">Auto</span>
                      </label>
                    )}
                  </label>
                  <input
                    type="text"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className={inputClass}
                    placeholder="Channel"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Address
                    {quantity > 1 && (
                      <label className="ml-2 inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={autoIncrementAddress}
                          onChange={(e) => setAutoIncrementAddress(e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span className="text-[10px]">Auto</span>
                      </label>
                    )}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputClass}
                    placeholder="1/1 or 1"
                  />
                </div>
              </div>

              {/* Dimmer & Circuit Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>
                    Dimmer
                    {quantity > 1 && (
                      <label className="ml-2 inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={autoIncrementDimmer}
                          onChange={(e) => setAutoIncrementDimmer(e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span className="text-[10px]">Auto</span>
                      </label>
                    )}
                  </label>
                  <input
                    type="text"
                    value={dimmer}
                    onChange={(e) => setDimmer(e.target.value)}
                    className={inputClass}
                    placeholder="Dimmer"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Circuit Name
                    {quantity > 1 && (
                      <label className="ml-2 inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={autoIncrementCircuit}
                          onChange={(e) => setAutoIncrementCircuit(e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span className="text-[10px]">Auto</span>
                      </label>
                    )}
                  </label>
                  <input
                    type="text"
                    value={circuit}
                    onChange={(e) => setCircuit(e.target.value)}
                    className={inputClass}
                    placeholder="Circuit"
                  />
                </div>
              </div>

              {/* Circuit # & Wattage */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>
                    Circuit #
                    {quantity > 1 && (
                      <label className="ml-2 inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={autoIncrementCircuitNumber}
                          onChange={(e) => setAutoIncrementCircuitNumber(e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span className="text-[10px]">Auto</span>
                      </label>
                    )}
                  </label>
                  <input
                    type="text"
                    value={circuitNumber}
                    onChange={(e) => setCircuitNumber(e.target.value)}
                    className={inputClass}
                    placeholder="Circuit #"
                  />
                </div>
                <div>
                  <label className={labelClass}>Wattage</label>
                  <input
                    type="number"
                    value={wattage}
                    onChange={(e) => setWattage(e.target.value)}
                    className={inputClass}
                    placeholder="Watts"
                  />
                </div>
              </div>

              {/* Color, Gobo, Accessories */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelClass}>Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className={inputClass}
                    placeholder="R80"
                  />
                </div>
                <div>
                  <label className={labelClass}>Gobo</label>
                  <input
                    type="text"
                    value={gobo}
                    onChange={(e) => setGobo(e.target.value)}
                    className={inputClass}
                    placeholder="Gobo"
                  />
                </div>
                <div>
                  <label className={labelClass}>Accessories</label>
                  <input
                    type="text"
                    value={accessories}
                    onChange={(e) => setAccessories(e.target.value)}
                    className={inputClass}
                    placeholder="comma,separated"
                  />
                </div>
              </div>

              {/* Location & System */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputClass}
                    placeholder="Location"
                  />
                </div>
                <div>
                  <label className={labelClass}>System</label>
                  <input
                    type="text"
                    value={system}
                    onChange={(e) => setSystem(e.target.value)}
                    className={inputClass}
                    placeholder="System"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={labelClass}>Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputClass}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            {/* Right Side: Quantity & Status */}
            <div className="space-y-4">
              {/* Number of Fixtures */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Fixtures
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-center text-lg font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={status === 'Active' && !notOnPlot}
                      onChange={() => {
                        setStatus('Active');
                        setNotOnPlot(false);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Spare"
                      checked={status === 'Spare' && !notOnPlot}
                      onChange={() => {
                        setStatus('Spare');
                        setNotOnPlot(false);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Spare</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Rental"
                      checked={status === 'Rental' && !notOnPlot}
                      onChange={() => {
                        setStatus('Rental');
                        setNotOnPlot(false);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Rental</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Needs Repair"
                      checked={status === 'Needs Repair' && !notOnPlot}
                      onChange={() => {
                        setStatus('Needs Repair');
                        setNotOnPlot(false);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Needs Repair</span>
                  </label>
                </div>
              </div>

              {/* Not on Plot */}
              <div className="pt-2 border-t border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notOnPlot}
                    onChange={(e) => setNotOnPlot(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Not on Plot</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer - Buttons */}
          <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
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
              Add {quantity > 1 ? `${quantity} Fixtures` : 'Fixture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
