/**
 * ReportTypeSelector
 * Dropdown for selecting the active report type
 */

import React, { useState, useRef, useEffect } from 'react';
import { ReportType } from '../../types/paperworkTemplate';

interface ReportTypeOption {
  id: ReportType;
  name: string;
  icon: string;
}

const REPORT_TYPE_OPTIONS: ReportTypeOption[] = [
  { id: 'channel-hookup', name: 'Channel Hookup', icon: '📊' },
  { id: 'dimmer-schedule', name: 'Dimmer Schedule', icon: '⚡' },
  { id: 'circuit-list', name: 'Circuit List', icon: '🔌' },
  { id: 'dmx-addresses', name: 'DMX Address List', icon: '🎛️' },
  { id: 'color-schedule', name: 'Color Schedule', icon: '🎨' },
  { id: 'gobo-schedule', name: 'Gobo Schedule', icon: '🎭' },
  { id: 'power-summary', name: 'Power Summary', icon: '⚙️' },
  { id: 'infrastructure-list', name: 'Infrastructure Equipment List', icon: '🔧' },
  { id: 'network-summary', name: 'Network Summary', icon: '🌐' },
  { id: 'port-assignments', name: 'Port Assignments', icon: '🔌' },
  { id: 'infrastructure-power', name: 'Infrastructure Power', icon: '⚡' },
  { id: 'infrastructure-location', name: 'Infrastructure by Location', icon: '📍' }
];

interface ReportTypeSelectorProps {
  value: ReportType;
  onChange: (reportType: ReportType) => void;
}

export function ReportTypeSelector({ value, onChange }: ReportTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = REPORT_TYPE_OPTIONS.find(opt => opt.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (reportType: ReportType) => {
    onChange(reportType);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-left transition flex items-center justify-between border border-gray-700"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{selectedOption?.icon}</span>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Report Type</div>
            <div className="text-sm font-medium">{selectedOption?.name}</div>
          </div>
        </div>
        <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {REPORT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-700 last:border-b-0 ${
                value === option.id ? 'bg-blue-600 hover:bg-blue-700' : ''
              }`}
            >
              <span className="text-xl">{option.icon}</span>
              <span className="text-sm">{option.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
