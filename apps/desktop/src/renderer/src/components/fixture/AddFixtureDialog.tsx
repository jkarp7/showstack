import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { Fixture } from '../../types';
import { DimmerRack, PDRack } from '../../types/power';

interface AutoFillSuggestions {
  positions: string[];
  purposes: string[];
  colors: string[];
  manufacturers: string[];
  models: string[];
  systems: string[];
  gobos: string[];
  types: string[];
  locations: string[];
}

interface AddFixtureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (fixtures: Partial<Fixture>[]) => void;
  existingFixturesCount: number;
  autoFillSuggestions?: AutoFillSuggestions;
}

interface QueuedBatch {
  id: string;
  quantity: number;
  description: string;
  fixtures: Partial<Fixture>[];
}

export function AddFixtureDialog({
  isOpen,
  onClose,
  onAdd,
  existingFixturesCount,
  autoFillSuggestions,
}: AddFixtureDialogProps) {
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

  // Power rack assignments
  const [dimmerRackId, setDimmerRackId] = useState<string>('');
  const [dimmerModuleNumber, setDimmerModuleNumber] = useState<string>('');
  const [dimmerChannelNumber, setDimmerChannelNumber] = useState<string>('');
  const [pdRackId, setPdRackId] = useState<string>('');
  const [pdCircuitNumber, setPdCircuitNumber] = useState<string>('');
  const [pdBreakerNumber, setPdBreakerNumber] = useState<string>('');

  // Available racks (loaded from database)
  const [dimmerRacks, setDimmerRacks] = useState<DimmerRack[]>([]);
  const [pdRacks, setPdRacks] = useState<PDRack[]>([]);

  // Auto-increment options
  const [autoIncrementUnit, setAutoIncrementUnit] = useState(true);
  const [autoIncrementChannel, setAutoIncrementChannel] = useState(true);
  const [autoIncrementAddress, setAutoIncrementAddress] = useState(false);
  const [autoIncrementDimmer, setAutoIncrementDimmer] = useState(false);
  const [autoIncrementCircuit, setAutoIncrementCircuit] = useState(false);
  const [autoIncrementCircuitNumber, setAutoIncrementCircuitNumber] = useState(false);

  // Batch queue
  const [queue, setQueue] = useState<QueuedBatch[]>([]);

  // Load power racks when dialog opens
  useEffect(() => {
    if (!isOpen || !window.api?.dimmerRacks || !window.api?.pdRacks) return;

    const loadRacks = async () => {
      try {
        const [dimmer, pd] = await Promise.all([
          window.api.dimmerRacks.getAll(),
          window.api.pdRacks.getAll(),
        ]);
        setDimmerRacks(dimmer);
        setPdRacks(pd);
      } catch (error) {
        logger.error('Failed to load power racks:', error);
      }
    };

    loadRacks();
  }, [isOpen]);

  if (!isOpen) return null;

  // Build fixtures array from current form values
  const buildFixtures = (): Partial<Fixture>[] => {
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
        fixture.accessories = accessories
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
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

      // Handle power rack assignments
      if (dimmerRackId) {
        fixture.dimmer_rack_id = dimmerRackId;
      }
      if (dimmerModuleNumber) {
        const moduleNum = parseInt(dimmerModuleNumber);
        if (!isNaN(moduleNum)) {
          fixture.dimmer_module_number = moduleNum;
        }
      }
      if (dimmerChannelNumber) {
        const channelNum = parseInt(dimmerChannelNumber);
        if (!isNaN(channelNum)) {
          fixture.dimmer_channel_number = channelNum;
        }
      }
      if (pdRackId) {
        fixture.pd_rack_id = pdRackId;
      }
      if (pdCircuitNumber) {
        const circuitNum = parseInt(pdCircuitNumber);
        if (!isNaN(circuitNum)) {
          fixture.pd_circuit_number = circuitNum;
        }
      }
      if (pdBreakerNumber) {
        const breakerNum = parseInt(pdBreakerNumber);
        if (!isNaN(breakerNum)) {
          fixture.pd_breaker_number = breakerNum;
        }
      }

      fixtures.push(fixture);
    }

    return fixtures;
  };

  // Generate description for a batch
  const generateDescription = (): string => {
    const parts: string[] = [`${quantity}x`];
    if (type) parts.push(type);
    if (position) parts.push(`@ ${position}`);
    if (unit) parts.push(`#${unit}${autoIncrementUnit && quantity > 1 ? '+' : ''}`);
    if (channel) parts.push(`Ch ${channel}${autoIncrementChannel && quantity > 1 ? '+' : ''}`);
    return parts.join(' ');
  };

  // Add current form to queue
  const handleAddToQueue = () => {
    const fixtures = buildFixtures();
    const batch: QueuedBatch = {
      id: `${Date.now()}-${Math.random()}`,
      quantity,
      description: generateDescription(),
      fixtures,
    };
    setQueue([...queue, batch]);

    // Reset form for next batch
    resetForm();
  };

  // Add all queued batches to worksheet
  const handleAddAll = () => {
    const allFixtures = queue.flatMap((batch) => batch.fixtures);
    onAdd(allFixtures);
    handleClose();
  };

  // Add current batch directly (skip queue)
  const handleAddNow = () => {
    const fixtures = buildFixtures();
    onAdd(fixtures);
    handleClose();
  };

  // Remove batch from queue
  const handleRemoveBatch = (batchId: string) => {
    setQueue(queue.filter((b) => b.id !== batchId));
  };

  const resetForm = () => {
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
    setDimmerRackId('');
    setDimmerModuleNumber('');
    setDimmerChannelNumber('');
    setPdRackId('');
    setPdCircuitNumber('');
    setPdBreakerNumber('');
  };

  const handleClose = () => {
    // Reset form
    resetForm();
    setAutoIncrementUnit(true);
    setAutoIncrementChannel(true);
    setAutoIncrementAddress(false);
    setAutoIncrementDimmer(false);
    setAutoIncrementCircuit(false);
    setAutoIncrementCircuitNumber(false);
    // Clear queue
    setQueue([]);
    onClose();
  };

  const inputClass =
    'w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500';
  const labelClass = 'text-xs font-medium text-gray-300 mb-1';

  const totalFixturesInQueue = queue.reduce((sum, batch) => sum + batch.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">Add Fixture(s)</h2>
          {queue.length > 0 && (
            <span className="text-sm text-gray-400">
              {queue.length} {queue.length === 1 ? 'batch' : 'batches'} ({totalFixturesInQueue}{' '}
              fixtures) in queue
            </span>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-[1fr_200px_280px] gap-6 p-6 overflow-y-auto">
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
                    list="position-suggestions"
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
                    list="type-suggestions"
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
                    list="purpose-suggestions"
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
                    list="manufacturer-suggestions"
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
                    list="model-suggestions"
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

              {/* Power Distribution Section */}
              {(dimmerRacks.length > 0 || pdRacks.length > 0) && (
                <>
                  <div className="pt-3 border-t border-gray-600">
                    <h4 className="text-xs font-semibold text-gray-300 mb-2">Power Distribution</h4>
                  </div>

                  {/* Dimmer Rack Assignment */}
                  {dimmerRacks.length > 0 && (
                    <>
                      <div>
                        <label className={labelClass}>Dimmer Rack</label>
                        <select
                          value={dimmerRackId}
                          onChange={(e) => setDimmerRackId(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">None</option>
                          {dimmerRacks.map((rack) => (
                            <option key={rack.id} value={rack.id}>
                              {rack.name} ({rack.circuit_count} circuits)
                            </option>
                          ))}
                        </select>
                      </div>

                      {dimmerRackId && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelClass}>Module #</label>
                            <input
                              type="number"
                              value={dimmerModuleNumber}
                              onChange={(e) => setDimmerModuleNumber(e.target.value)}
                              className={inputClass}
                              placeholder="Module"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Dimmer Channel #</label>
                            <input
                              type="number"
                              value={dimmerChannelNumber}
                              onChange={(e) => setDimmerChannelNumber(e.target.value)}
                              className={inputClass}
                              placeholder="Channel"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* PD Rack Assignment */}
                  {pdRacks.length > 0 && (
                    <>
                      <div>
                        <label className={labelClass}>PD Rack</label>
                        <select
                          value={pdRackId}
                          onChange={(e) => setPdRackId(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">None</option>
                          {pdRacks.map((rack) => (
                            <option key={rack.id} value={rack.id}>
                              {rack.name} ({rack.voltage}V, {rack.circuit_count} circuits)
                            </option>
                          ))}
                        </select>
                      </div>

                      {pdRackId && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelClass}>PD Circuit #</label>
                            <input
                              type="number"
                              value={pdCircuitNumber}
                              onChange={(e) => setPdCircuitNumber(e.target.value)}
                              className={inputClass}
                              placeholder="Circuit"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Breaker #</label>
                            <input
                              type="number"
                              value={pdBreakerNumber}
                              onChange={(e) => setPdBreakerNumber(e.target.value)}
                              className={inputClass}
                              placeholder="Breaker"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

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
                    list="color-suggestions"
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
                    list="gobo-suggestions"
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
                    list="location-suggestions"
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
                    list="system-suggestions"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-center text-lg font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
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

            {/* Right Side: Batch Queue */}
            <div className="border-l border-gray-700 pl-6 flex flex-col">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Batch Queue</h3>

              {queue.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm text-center p-4">
                  No batches queued.
                  <br />
                  Fill out the form and click
                  <br />
                  "Add to Queue" to queue fixtures.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  {queue.map((batch) => (
                    <div
                      key={batch.id}
                      className="bg-gray-700 rounded p-2 text-xs group hover:bg-gray-650 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {batch.description}
                          </div>
                          <div className="text-gray-400 mt-0.5">
                            {batch.quantity} {batch.quantity === 1 ? 'fixture' : 'fixtures'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveBatch(batch.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"
                          title="Remove from queue"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {queue.length > 0 && (
                <button
                  onClick={handleAddAll}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition"
                >
                  Add All to Worksheet ({totalFixturesInQueue})
                </button>
              )}
            </div>
          </div>

          {/* Footer - Buttons */}
          <div className="px-6 py-4 border-t border-gray-700 flex justify-between">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
            >
              Cancel
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddToQueue}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-medium transition"
              >
                Add to Queue
              </button>
              <button
                type="button"
                onClick={handleAddNow}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
              >
                Add Now ({quantity})
              </button>
            </div>
          </div>
        </div>

        {/* Datalist elements for auto-fill suggestions */}
        {autoFillSuggestions && (
          <>
            <datalist id="position-suggestions">
              {autoFillSuggestions.positions.map((pos) => (
                <option key={pos} value={pos} />
              ))}
            </datalist>
            <datalist id="type-suggestions">
              {autoFillSuggestions.types.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
            <datalist id="purpose-suggestions">
              {autoFillSuggestions.purposes.map((purpose) => (
                <option key={purpose} value={purpose} />
              ))}
            </datalist>
            <datalist id="manufacturer-suggestions">
              {autoFillSuggestions.manufacturers.map((mfr) => (
                <option key={mfr} value={mfr} />
              ))}
            </datalist>
            <datalist id="model-suggestions">
              {autoFillSuggestions.models.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
            <datalist id="color-suggestions">
              {autoFillSuggestions.colors.map((color) => (
                <option key={color} value={color} />
              ))}
            </datalist>
            <datalist id="gobo-suggestions">
              {autoFillSuggestions.gobos.map((gobo) => (
                <option key={gobo} value={gobo} />
              ))}
            </datalist>
            <datalist id="location-suggestions">
              {autoFillSuggestions.locations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
            <datalist id="system-suggestions">
              {autoFillSuggestions.systems.map((sys) => (
                <option key={sys} value={sys} />
              ))}
            </datalist>
          </>
        )}
      </div>
    </div>
  );
}
