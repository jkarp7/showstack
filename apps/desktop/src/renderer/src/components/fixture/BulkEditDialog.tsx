import { useState } from 'react';
import { Fixture } from '../../types';
import { COLOR_FLAG_DEFINITIONS, ColorFlagType } from '../../types/highlighting';

interface BulkEditDialogProps {
  isOpen: boolean;
  selectedCount: number;
  selectedIds: string[];
  onClose: () => void;
  onSubmit: (updates: Partial<Fixture>) => void;
  onAutoNumber: (field: keyof Fixture, start: number, increment: number) => void;
}

export function BulkEditDialog({
  isOpen,
  selectedCount,
  selectedIds,
  onClose,
  onSubmit,
  onAutoNumber,
}: BulkEditDialogProps) {
  const [updates, setUpdates] = useState<Partial<Fixture>>({});
  const [showAutoNumber, setShowAutoNumber] = useState(false);
  const [autoNumberField, setAutoNumberField] = useState<keyof Fixture>('channel');
  const [autoNumberStart, setAutoNumberStart] = useState<number>(1);
  const [autoNumberIncrement, setAutoNumberIncrement] = useState<number>(1);

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    control: false,
    power: false,
    colorAccessories: false,
    location: false,
    focus: false,
    flagsVisibility: false,
    other: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only submit non-empty fields
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(
        ([_, value]) => value !== '' && value !== undefined && value !== null,
      ),
    );
    onSubmit(filteredUpdates as Partial<Fixture>);
    setUpdates({});
    onClose();
  };

  const handleAutoNumberSubmit = () => {
    onAutoNumber(autoNumberField, autoNumberStart, autoNumberIncrement);
    setShowAutoNumber(false);
    onClose();
  };

  const handleChange = (field: keyof Fixture, value: string | number | null) => {
    setUpdates((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bulk Edit {selectedCount} Fixture{selectedCount > 1 ? 's' : ''}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Only filled fields will be updated. Leave blank to keep existing values.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-3">
            {/* BASIC INFORMATION */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('basic')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-left transition"
              >
                <span className="font-medium text-gray-900 dark:text-white">Basic Information</span>
                <span className="text-gray-500">{expandedSections.basic ? '▼' : '▶'}</span>
              </button>
              {expandedSections.basic && (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <input
                      type="text"
                      value={updates.type || ''}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={updates.manufacturer || ''}
                      onChange={(e) => handleChange('manufacturer', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={updates.model || ''}
                      onChange={(e) => handleChange('model', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Purpose
                    </label>
                    <input
                      type="text"
                      value={updates.purpose || ''}
                      onChange={(e) => handleChange('purpose', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mark
                    </label>
                    <input
                      type="text"
                      value={updates.mark || ''}
                      onChange={(e) => handleChange('mark', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unit Number
                    </label>
                    <input
                      type="number"
                      value={updates.unit_number !== undefined ? updates.unit_number : ''}
                      onChange={(e) =>
                        handleChange(
                          'unit_number',
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CONTROL */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('control')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-left transition"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  Control & Addressing
                </span>
                <span className="text-gray-500">{expandedSections.control ? '▼' : '▶'}</span>
              </button>
              {expandedSections.control && (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Channel
                    </label>
                    <input
                      type="text"
                      value={updates.channel || ''}
                      onChange={(e) => handleChange('channel', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Universe
                    </label>
                    <input
                      type="number"
                      value={updates.universe !== undefined ? updates.universe : ''}
                      onChange={(e) =>
                        handleChange('universe', e.target.value ? parseInt(e.target.value) : null)
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                      min="0"
                      max="32767"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      DMX Address
                    </label>
                    <input
                      type="number"
                      value={updates.dmx_address !== undefined ? updates.dmx_address : ''}
                      onChange={(e) =>
                        handleChange(
                          'dmx_address',
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                      min="1"
                      max="512"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mode
                    </label>
                    <input
                      type="text"
                      value={updates.mode || ''}
                      onChange={(e) => handleChange('mode', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* POWER & CIRCUITS */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('power')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-left transition"
              >
                <span className="font-medium text-gray-900 dark:text-white">Power & Circuits</span>
                <span className="text-gray-500">{expandedSections.power ? '▼' : '▶'}</span>
              </button>
              {expandedSections.power && (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dimmer
                    </label>
                    <input
                      type="text"
                      value={updates.dimmer || ''}
                      onChange={(e) => handleChange('dimmer', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Circuit Name
                    </label>
                    <input
                      type="text"
                      value={updates.circuit || ''}
                      onChange={(e) => handleChange('circuit', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Circuit Number
                    </label>
                    <input
                      type="text"
                      value={updates.circuit_number || ''}
                      onChange={(e) => handleChange('circuit_number', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phase
                    </label>
                    <select
                      value={updates.phase || ''}
                      onChange={(e) => handleChange('phase', e.target.value || null)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                    >
                      <option value="">Leave blank to skip</option>
                      <option value="A">Phase A</option>
                      <option value="B">Phase B</option>
                      <option value="C">Phase C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Wattage
                    </label>
                    <input
                      type="number"
                      value={updates.wattage !== undefined ? updates.wattage : ''}
                      onChange={(e) =>
                        handleChange('wattage', e.target.value ? parseInt(e.target.value) : null)
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amperage
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={updates.amperage !== undefined ? updates.amperage : ''}
                      onChange={(e) =>
                        handleChange('amperage', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                      min="0"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* COLOR & ACCESSORIES */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('colorAccessories')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-left transition"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  Color & Accessories
                </span>
                <span className="text-gray-500">
                  {expandedSections.colorAccessories ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.colorAccessories && (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      value={updates.color || ''}
                      onChange={(e) => handleChange('color', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color Frame
                    </label>
                    <input
                      type="text"
                      value={updates.color_frame || ''}
                      onChange={(e) => handleChange('color_frame', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gobo
                    </label>
                    <input
                      type="text"
                      value={updates.gobo || ''}
                      onChange={(e) => handleChange('gobo', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gobo Size
                    </label>
                    <input
                      type="text"
                      value={updates.gobo_size || ''}
                      onChange={(e) => handleChange('gobo_size', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Template Size
                    </label>
                    <input
                      type="text"
                      value={updates.template_size || ''}
                      onChange={(e) => handleChange('template_size', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* LOCATION */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('location')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-left transition"
              >
                <span className="font-medium text-gray-900 dark:text-white">Location</span>
                <span className="text-gray-500">{expandedSections.location ? '▼' : '▶'}</span>
              </button>
              {expandedSections.location && (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={updates.location || ''}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cable
                    </label>
                    <input
                      type="text"
                      value={updates.cable || ''}
                      onChange={(e) => handleChange('cable', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data Cable
                    </label>
                    <input
                      type="text"
                      value={updates.data_cable || ''}
                      onChange={(e) => handleChange('data_cable', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* FOCUS */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('focus')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-left transition"
              >
                <span className="font-medium text-gray-900 dark:text-white">Focus Information</span>
                <span className="text-gray-500">{expandedSections.focus ? '▼' : '▶'}</span>
              </button>
              {expandedSections.focus && (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Focus L/R
                    </label>
                    <input
                      type="text"
                      value={updates.focus_lr || ''}
                      onChange={(e) => handleChange('focus_lr', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Focus U/D
                    </label>
                    <input
                      type="text"
                      value={updates.focus_ud || ''}
                      onChange={(e) => handleChange('focus_ud', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Focus Note
                    </label>
                    <textarea
                      value={updates.focus_note || ''}
                      onChange={(e) => handleChange('focus_note', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Focus Status
                    </label>
                    <select
                      value={updates.focus_status || ''}
                      onChange={(e) => handleChange('focus_status', e.target.value || null)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                    >
                      <option value="">Leave blank to skip</option>
                      <option value="Complete">Complete</option>
                      <option value="Incomplete">Incomplete</option>
                      <option value="Needs Attention">Needs Attention</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* OTHER */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('other')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-left transition"
              >
                <span className="font-medium text-gray-900 dark:text-white">Other Information</span>
                <span className="text-gray-500">{expandedSections.other ? '▼' : '▶'}</span>
              </button>
              {expandedSections.other && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        System
                      </label>
                      <input
                        type="text"
                        value={updates.system || ''}
                        onChange={(e) => handleChange('system', e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                        placeholder="Leave blank to skip"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Scenery
                      </label>
                      <input
                        type="text"
                        value={updates.scenery || ''}
                        onChange={(e) => handleChange('scenery', e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                        placeholder="Leave blank to skip"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={updates.status || ''}
                        onChange={(e) => handleChange('status', e.target.value || null)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      >
                        <option value="">Leave blank to skip</option>
                        <option value="Active">Active</option>
                        <option value="Cut">Cut</option>
                        <option value="Spare">Spare</option>
                        <option value="Dark">Dark</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Work Note Status
                      </label>
                      <select
                        value={updates.work_note_status || ''}
                        onChange={(e) => handleChange('work_note_status', e.target.value || null)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      >
                        <option value="">Leave blank to skip</option>
                        <option value="Complete">Complete</option>
                        <option value="Pending">Pending</option>
                        <option value="Issue">Issue</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={updates.notes || ''}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      placeholder="Leave blank to skip"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Flags & Visibility Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('flagsVisibility')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-left transition"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  Flags & Visibility
                </span>
                <span className="text-gray-500">
                  {expandedSections.flagsVisibility ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.flagsVisibility && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Color Flag (appears on labels)
                    </label>
                    <select
                      value={updates.color_flag || ''}
                      onChange={(e) => handleChange('color_flag', (e.target.value || null) as any)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                    >
                      <option value="">No Flag (Clear)</option>
                      {Object.entries(COLOR_FLAG_DEFINITIONS).map(([key, def]) => (
                        <option key={key} value={key}>
                          {def.label} - {def.description}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Color flags appear as vertical bars on row edges and on printed labels
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Visibility
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleChange('hidden', false)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition"
                      >
                        Show (Unhide)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange('hidden', true)}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition"
                      >
                        Hide from Table
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Hidden fixtures can be shown with the "Show Hidden" filter checkbox
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-Number Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAutoNumber(!showAutoNumber)}
                className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 flex items-center justify-between text-left transition"
              >
                <span className="font-medium text-purple-900 dark:text-purple-100">
                  Auto-Number Fields
                </span>
                <span className="text-purple-600 dark:text-purple-400">
                  {showAutoNumber ? '▼' : '▶'}
                </span>
              </button>

              {showAutoNumber && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Automatically number selected fixtures in sequence.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Field
                      </label>
                      <select
                        value={autoNumberField as string}
                        onChange={(e) => setAutoNumberField(e.target.value as keyof Fixture)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      >
                        <option value="channel">Channel</option>
                        <option value="unit">Unit</option>
                        <option value="unit_number">Unit Number</option>
                        <option value="dmx_address">DMX Address</option>
                        <option value="universe">Universe</option>
                        <option value="circuit_number">Circuit Number</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start At
                      </label>
                      <input
                        type="number"
                        value={autoNumberStart}
                        onChange={(e) => setAutoNumberStart(parseInt(e.target.value) || 1)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Increment
                      </label>
                      <input
                        type="number"
                        value={autoNumberIncrement}
                        onChange={(e) => setAutoNumberIncrement(parseInt(e.target.value) || 1)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoNumberSubmit}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition"
                  >
                    Apply Auto-Number to {selectedCount} Fixture{selectedCount > 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded text-gray-900 dark:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
            >
              Update {selectedCount} Fixture{selectedCount > 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
