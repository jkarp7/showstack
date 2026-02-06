import { useMemo, useState, useEffect } from 'react';
import {
  DimmerRack,
  PDRack,
  ProjectPowerSummary,
  RackPowerSummary,
  ServicePowerSummary,
} from '../../types/power';
import {
  calculateProjectPowerSummary,
  formatPower,
  formatAmps,
  formatPercentage,
} from '../../utils/powerCalculations';
import { DimmerRackModule } from '../../../../main/database/queries/dimmerRackModules';

interface PowerSummaryPanelProps {
  dimmerRacks: DimmerRack[];
  pdRacks: PDRack[];
  fixtures: Array<{
    dimmer_rack_id?: string;
    dimmer_channel_number?: number;
    pd_rack_id?: string;
    pd_circuit_number?: number;
    wattage?: number;
    amperage?: number;
    phase?: 'A' | 'B' | 'C';
  }>;
  className?: string;
}

export function PowerSummaryPanel({
  dimmerRacks,
  pdRacks,
  fixtures,
  className = '',
}: PowerSummaryPanelProps) {
  // Load module configurations for dimmer racks
  const [rackModules, setRackModules] = useState<Map<string, DimmerRackModule[]>>(new Map());
  const [viewMode, setViewMode] = useState<'by-service' | 'by-type'>('by-service');

  useEffect(() => {
    const loadModules = async () => {
      if (!window.api?.dimmerRackModules) return;

      const modulesMap = new Map<string, DimmerRackModule[]>();

      // Load modules for each dimmer rack
      await Promise.all(
        dimmerRacks.map(async (rack) => {
          try {
            const modules = await window.api.dimmerRackModules.getByRackId(rack.id);
            if (modules.length > 0) {
              modulesMap.set(rack.id, modules);
            }
          } catch (error) {
            console.error(`Error loading modules for rack ${rack.id}:`, error);
          }
        }),
      );

      setRackModules(modulesMap);
    };

    loadModules();
  }, [dimmerRacks]);

  // Calculate power summary
  const summary: ProjectPowerSummary = useMemo(() => {
    return calculateProjectPowerSummary(dimmerRacks, pdRacks, fixtures, rackModules);
  }, [dimmerRacks, pdRacks, fixtures, rackModules]);

  // Helper to render rack summary row
  const renderRackRow = (rack: RackPowerSummary) => {
    const hasWarning = rack.warnings.length > 0;
    const isCritical = rack.warnings.some((w) => w.includes('CRITICAL'));

    return (
      <div
        key={rack.rack_id}
        className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${
          isCritical
            ? 'bg-red-50 dark:bg-red-900/20'
            : hasWarning
              ? 'bg-yellow-50 dark:bg-yellow-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{rack.rack_name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {rack.rack_type === 'dimmer' ? 'Dimmer Rack' : 'PD Rack'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatPower(rack.total_load_kw)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Load</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatPower(rack.total_capacity_kw)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Capacity</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {rack.circuits_used}/{rack.circuits_total}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Circuits</div>
        </div>
        <div className="text-right">
          <div
            className={`text-sm font-medium ${
              rack.utilization_percentage >= 100
                ? 'text-red-600 dark:text-red-400'
                : rack.utilization_percentage >= 80
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
            }`}
          >
            {formatPercentage(rack.utilization_percentage)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Utilization</div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Power Summary</h3>
        {summary.services && summary.services.length > 0 && (
          <div className="flex gap-2 bg-gray-200 dark:bg-gray-600 rounded p-1">
            <button
              onClick={() => setViewMode('by-service')}
              className={`px-3 py-1 text-sm rounded transition ${
                viewMode === 'by-service'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              By Service
            </button>
            <button
              onClick={() => setViewMode('by-type')}
              className={`px-3 py-1 text-sm rounded transition ${
                viewMode === 'by-type'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              By Type
            </button>
          </div>
        )}
      </div>

      {/* Overall Summary */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPower(summary.total_load_kw)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Load</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPower(summary.total_capacity_kw)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Capacity</div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold ${
                summary.overall_utilization >= 100
                  ? 'text-red-600 dark:text-red-400'
                  : summary.overall_utilization >= 80
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-green-600 dark:text-green-400'
              }`}
            >
              {formatPercentage(summary.overall_utilization)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Overall Utilization</div>
          </div>
        </div>
      </div>

      {/* Phase Balance (if applicable) */}
      {summary.phase_balance && summary.phase_balance.total_load > 0 && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Phase Balance
          </h4>
          <div className="space-y-3">
            {/* Phase A */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Phase A</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatAmps(summary.phase_balance.phase_a_load)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      summary.phase_balance.total_load > 0
                        ? (summary.phase_balance.phase_a_load / summary.phase_balance.total_load) *
                          300
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Phase B */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Phase B</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatAmps(summary.phase_balance.phase_b_load)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      summary.phase_balance.total_load > 0
                        ? (summary.phase_balance.phase_b_load / summary.phase_balance.total_load) *
                          300
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Phase C */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Phase C</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatAmps(summary.phase_balance.phase_c_load)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      summary.phase_balance.total_load > 0
                        ? (summary.phase_balance.phase_c_load / summary.phase_balance.total_load) *
                          300
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Imbalance indicator */}
            <div className="mt-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Imbalance: </span>
              <span
                className={`font-medium ${
                  summary.phase_balance.max_imbalance_percentage >= 25
                    ? 'text-red-600 dark:text-red-400'
                    : summary.phase_balance.max_imbalance_percentage >= 15
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                }`}
              >
                {formatPercentage(summary.phase_balance.max_imbalance_percentage)}
                {summary.phase_balance.max_imbalance_percentage >= 25
                  ? ' 🚨 CRITICAL'
                  : summary.phase_balance.max_imbalance_percentage >= 15
                    ? ' ⚠️  WARNING'
                    : ' ✓ OK'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Service Grouped View */}
      {viewMode === 'by-service' && summary.services && summary.services.length > 0 ? (
        <div>
          {summary.services.map((service) => (
            <div key={service.service_name}>
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {service.service_name} ({service.racks.length} racks)
                  </h4>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Load: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatPower(service.total_load_kw)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Capacity: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatPower(service.total_capacity_kw)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Utilization: </span>
                      <span
                        className={`font-medium ${
                          service.utilization_percentage >= 100
                            ? 'text-red-600 dark:text-red-400'
                            : service.utilization_percentage >= 80
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {formatPercentage(service.utilization_percentage)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>{service.racks.map(renderRackRow)}</div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Dimmer Racks */}
          {summary.dimmer_racks.length > 0 && (
            <div>
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Dimmer Racks ({summary.dimmer_racks.length})
                </h4>
              </div>
              <div>{summary.dimmer_racks.map(renderRackRow)}</div>
            </div>
          )}

          {/* PD Racks */}
          {summary.pd_racks.length > 0 && (
            <div>
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  PD Racks ({summary.pd_racks.length})
                </h4>
              </div>
              <div>{summary.pd_racks.map(renderRackRow)}</div>
            </div>
          )}
        </>
      )}

      {/* Warnings */}
      {(summary.critical_warnings.length > 0 || summary.warnings.length > 0) && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Alerts</h4>
          <div className="space-y-2">
            {summary.critical_warnings.map((warning, idx) => (
              <div
                key={`critical-${idx}`}
                className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
              >
                <span className="mt-0.5">🚨</span>
                <span>{warning.message}</span>
              </div>
            ))}
            {summary.warnings.map((warning, idx) => (
              <div
                key={`warning-${idx}`}
                className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-400"
              >
                <span className="mt-0.5">⚠️</span>
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {summary.dimmer_racks.length === 0 && summary.pd_racks.length === 0 && (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">⚡</div>
          <p>No power racks configured</p>
          <p className="text-sm mt-1">Add dimmer racks and PD racks to track power distribution</p>
        </div>
      )}
    </div>
  );
}
