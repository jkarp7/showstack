/**
 * Power calculation utilities for ShowStack
 * Handles power distribution calculations, phase balancing, and capacity warnings
 */

import {
  DimmerRack,
  PDRack,
  RackPowerSummary,
  PhaseBalance,
  ProjectPowerSummary,
  ServicePowerSummary,
  PowerWarning,
  Phase,
  CapacityCheckResult,
  CAPACITY_WARNING_THRESHOLD,
  CAPACITY_CRITICAL_THRESHOLD,
  PHASE_IMBALANCE_WARNING_THRESHOLD,
  PHASE_IMBALANCE_CRITICAL_THRESHOLD
} from '../types/power';

// ============================================
// Conversion Utilities
// ============================================

/**
 * Convert watts to kilowatts
 */
export function wattsToKW(watts: number): number {
  return watts / 1000;
}

/**
 * Convert amperage to watts (P = V × I)
 * @param amps Current in amperes
 * @param voltage Voltage (default 120V)
 */
export function ampsToWatts(amps: number, voltage: number = 120): number {
  return amps * voltage;
}

/**
 * Convert watts to amperage (I = P / V)
 * @param watts Power in watts
 * @param voltage Voltage (default 120V)
 */
export function wattsToAmps(watts: number, voltage: number = 120): number {
  return watts / voltage;
}

// ============================================
// Dimmer Rack Calculations
// ============================================

/**
 * Calculate total capacity for a dimmer rack (in kW)
 * @param rack The dimmer rack
 * @param modules Optional module configurations for per-circuit power calculations
 */
export function calculateDimmerRackCapacity(
  rack: DimmerRack,
  modules?: Array<{ start_circuit: number; end_circuit: number; watts_per_circuit: number; module_type: string }>
): number {
  // If module configurations are provided, calculate capacity based on them
  if (modules && modules.length > 0) {
    const totalWatts = modules.reduce((sum, module) => {
      // Only count circuits that produce power (not thrupower)
      if (module.module_type === 'thrupower') return sum;

      const circuitCount = module.end_circuit - module.start_circuit + 1;
      return sum + (circuitCount * (module.watts_per_circuit || 2400));
    }, 0);
    return wattsToKW(totalWatts);
  }

  // Fall back to old calculation if no modules configured
  const defaultModules = Math.ceil(rack.circuit_count / (rack.channels_per_module || 12));
  const totalWatts = defaultModules * (rack.watts_per_module || 2400);
  return wattsToKW(totalWatts);
}

/**
 * Calculate current load for a dimmer rack
 */
export function calculateDimmerRackLoad(
  rack: DimmerRack,
  fixtures: Array<{ dimmer_rack_id?: string; wattage?: number }>
): number {
  const rackFixtures = fixtures.filter(f => f.dimmer_rack_id === rack.id);
  const totalWatts = rackFixtures.reduce((sum, f) => sum + (f.wattage || 0), 0);
  return wattsToKW(totalWatts);
}

/**
 * Get dimmer rack power summary
 * @param modules Optional module configurations for per-circuit power calculations
 */
export function getDimmerRackSummary(
  rack: DimmerRack,
  fixtures: Array<{ dimmer_rack_id?: string; dimmer_channel_number?: number; wattage?: number }>,
  modules?: Array<{ start_circuit: number; end_circuit: number; watts_per_circuit: number; module_type: string }>
): RackPowerSummary {
  const capacity = calculateDimmerRackCapacity(rack, modules);
  const load = calculateDimmerRackLoad(rack, fixtures);
  const utilization = capacity > 0 ? (load / capacity) * 100 : 0;

  // Count unique circuits used
  const rackFixtures = fixtures.filter(f => f.dimmer_rack_id === rack.id && f.dimmer_channel_number);
  const usedCircuits = new Set(
    rackFixtures.map(f => f.dimmer_channel_number!)
  ).size;

  const warnings: string[] = [];
  if (utilization >= CAPACITY_CRITICAL_THRESHOLD) {
    warnings.push(`Rack at ${utilization.toFixed(1)}% capacity (CRITICAL)`);
  } else if (utilization >= CAPACITY_WARNING_THRESHOLD) {
    warnings.push(`Rack at ${utilization.toFixed(1)}% capacity (WARNING)`);
  }

  return {
    rack_id: rack.id,
    rack_name: rack.name,
    rack_type: 'dimmer',
    total_capacity_kw: capacity,
    total_load_kw: load,
    utilization_percentage: utilization,
    circuits_total: rack.circuit_count,
    circuits_used: usedCircuits,
    circuits_available: rack.circuit_count - usedCircuits,
    warnings
  };
}

// ============================================
// PD Rack Calculations
// ============================================

/**
 * Calculate total capacity for a PD rack (in kW)
 */
export function calculatePDRackCapacity(rack: PDRack): number {
  const ampsPerBreaker = rack.amps_per_breaker || 20;
  const wattsPerCircuit = ampsPerBreaker * rack.voltage;
  const totalWatts = rack.circuit_count * wattsPerCircuit;
  return wattsToKW(totalWatts);
}

/**
 * Calculate current load for a PD rack
 */
export function calculatePDRackLoad(
  rack: PDRack,
  fixtures: Array<{ pd_rack_id?: string; wattage?: number; amperage?: number }>
): number {
  const rackFixtures = fixtures.filter(f => f.pd_rack_id === rack.id);
  const totalWatts = rackFixtures.reduce((sum, f) => {
    if (f.wattage) return sum + f.wattage;
    if (f.amperage) return sum + ampsToWatts(f.amperage, rack.voltage);
    return sum;
  }, 0);
  return wattsToKW(totalWatts);
}

/**
 * Get PD rack power summary
 */
export function getPDRackSummary(
  rack: PDRack,
  fixtures: Array<{ pd_rack_id?: string; pd_circuit_number?: number; wattage?: number; amperage?: number }>
): RackPowerSummary {
  const capacity = calculatePDRackCapacity(rack);
  const load = calculatePDRackLoad(rack, fixtures);
  const utilization = capacity > 0 ? (load / capacity) * 100 : 0;

  // Count unique circuits used
  const usedCircuits = new Set(
    fixtures
      .filter(f => f.pd_rack_id === rack.id && f.pd_circuit_number)
      .map(f => f.pd_circuit_number!)
  ).size;

  const warnings: string[] = [];
  if (utilization >= CAPACITY_CRITICAL_THRESHOLD) {
    warnings.push(`Rack at ${utilization.toFixed(1)}% capacity (CRITICAL)`);
  } else if (utilization >= CAPACITY_WARNING_THRESHOLD) {
    warnings.push(`Rack at ${utilization.toFixed(1)}% capacity (WARNING)`);
  }

  return {
    rack_id: rack.id,
    rack_name: rack.name,
    rack_type: 'pd',
    total_capacity_kw: capacity,
    total_load_kw: load,
    utilization_percentage: utilization,
    circuits_total: rack.circuit_count,
    circuits_used: usedCircuits,
    circuits_available: rack.circuit_count - usedCircuits,
    warnings
  };
}

// ============================================
// Phase Balance Calculations
// ============================================

/**
 * Calculate phase balance for 3-phase systems
 */
export function calculatePhaseBalance(
  fixtures: Array<{ phase?: Phase; wattage?: number; amperage?: number }>,
  voltage: number = 208
): PhaseBalance {
  // Sum loads by phase
  const phaseLoads = { A: 0, B: 0, C: 0 };

  fixtures.forEach(f => {
    if (!f.phase) return;

    let watts = f.wattage || 0;
    if (!watts && f.amperage) {
      watts = ampsToWatts(f.amperage, voltage);
    }

    const amps = wattsToAmps(watts, voltage);
    phaseLoads[f.phase] += amps;
  });

  const phaseA = phaseLoads.A;
  const phaseB = phaseLoads.B;
  const phaseC = phaseLoads.C;
  const totalLoad = phaseA + phaseB + phaseC;
  const averageLoad = totalLoad / 3;

  // Calculate imbalance percentage
  const maxPhase = Math.max(phaseA, phaseB, phaseC);
  const minPhase = Math.min(phaseA, phaseB, phaseC);
  const maxImbalance = averageLoad > 0
    ? ((maxPhase - minPhase) / averageLoad) * 100
    : 0;

  const isBalanced = maxImbalance < PHASE_IMBALANCE_WARNING_THRESHOLD;

  const warnings: string[] = [];
  if (maxImbalance >= PHASE_IMBALANCE_CRITICAL_THRESHOLD) {
    warnings.push(`Phase imbalance is ${maxImbalance.toFixed(1)}% (CRITICAL - should be <${PHASE_IMBALANCE_CRITICAL_THRESHOLD}%)`);
  } else if (maxImbalance >= PHASE_IMBALANCE_WARNING_THRESHOLD) {
    warnings.push(`Phase imbalance is ${maxImbalance.toFixed(1)}% (WARNING - should be <${PHASE_IMBALANCE_WARNING_THRESHOLD}%)`);
  }

  return {
    phase_a_load: phaseA,
    phase_b_load: phaseB,
    phase_c_load: phaseC,
    total_load: totalLoad,
    average_load: averageLoad,
    max_imbalance_percentage: maxImbalance,
    is_balanced: isBalanced,
    warnings
  };
}

// ============================================
// Project-Wide Power Summary
// ============================================

/**
 * Calculate power summaries grouped by building service
 */
export function calculateServicePowerSummaries(
  dimmerRackSummaries: RackPowerSummary[],
  pdRackSummaries: RackPowerSummary[],
  dimmerRacks: DimmerRack[],
  pdRacks: PDRack[]
): ServicePowerSummary[] {
  // Create a map of rack_id to building_service
  const rackServiceMap = new Map<string, string>();

  dimmerRacks.forEach(rack => {
    rackServiceMap.set(rack.id, rack.building_service || 'Unassigned');
  });

  pdRacks.forEach(rack => {
    rackServiceMap.set(rack.id, rack.building_service || 'Unassigned');
  });

  // Group summaries by service
  const serviceGroups = new Map<string, RackPowerSummary[]>();

  [...dimmerRackSummaries, ...pdRackSummaries].forEach(summary => {
    const service = rackServiceMap.get(summary.rack_id) || 'Unassigned';

    if (!serviceGroups.has(service)) {
      serviceGroups.set(service, []);
    }

    serviceGroups.get(service)!.push(summary);
  });

  // Calculate service summaries
  const serviceSummaries: ServicePowerSummary[] = [];

  serviceGroups.forEach((racks, serviceName) => {
    const totalCapacity = racks.reduce((sum, r) => sum + r.total_capacity_kw, 0);
    const totalLoad = racks.reduce((sum, r) => sum + r.total_load_kw, 0);
    const utilization = totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0;

    const warnings: string[] = [];

    // Check for service-level warnings
    if (utilization >= CAPACITY_CRITICAL_THRESHOLD) {
      warnings.push(`${serviceName} at ${utilization.toFixed(1)}% capacity (CRITICAL)`);
    } else if (utilization >= CAPACITY_WARNING_THRESHOLD) {
      warnings.push(`${serviceName} at ${utilization.toFixed(1)}% capacity (WARNING)`);
    }

    // Include rack-level warnings
    racks.forEach(rack => {
      if (rack.warnings.length > 0) {
        warnings.push(...rack.warnings.map(w => `${rack.rack_name}: ${w}`));
      }
    });

    serviceSummaries.push({
      service_name: serviceName,
      total_capacity_kw: totalCapacity,
      total_load_kw: totalLoad,
      utilization_percentage: utilization,
      racks,
      warnings
    });
  });

  // Sort by service name, with "Unassigned" last
  serviceSummaries.sort((a, b) => {
    if (a.service_name === 'Unassigned') return 1;
    if (b.service_name === 'Unassigned') return -1;
    return a.service_name.localeCompare(b.service_name);
  });

  return serviceSummaries;
}

/**
 * Calculate overall project power summary
 */
export function calculateProjectPowerSummary(
  dimmerRacks: DimmerRack[],
  pdRacks: PDRack[],
  fixtures: Array<{
    dimmer_rack_id?: string;
    dimmer_channel_number?: number;
    pd_rack_id?: string;
    pd_circuit_number?: number;
    wattage?: number;
    amperage?: number;
    phase?: Phase;
  }>,
  rackModules?: Map<string, Array<{ start_circuit: number; end_circuit: number; watts_per_circuit: number; module_type: string }>>
): ProjectPowerSummary {
  // Calculate summaries for all racks
  const dimmerSummaries = dimmerRacks.map(rack => {
    const modules = rackModules?.get(rack.id);
    return getDimmerRackSummary(rack, fixtures, modules);
  });
  const pdSummaries = pdRacks.map(rack => getPDRackSummary(rack, fixtures));

  // Calculate totals
  const totalCapacity =
    dimmerSummaries.reduce((sum, s) => sum + s.total_capacity_kw, 0) +
    pdSummaries.reduce((sum, s) => sum + s.total_capacity_kw, 0);

  const totalLoad =
    dimmerSummaries.reduce((sum, s) => sum + s.total_load_kw, 0) +
    pdSummaries.reduce((sum, s) => sum + s.total_load_kw, 0);

  const overallUtilization = totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0;

  // Calculate phase balance
  const phaseBalance = calculatePhaseBalance(fixtures);

  // Calculate service summaries
  const services = calculateServicePowerSummaries(
    dimmerSummaries,
    pdSummaries,
    dimmerRacks,
    pdRacks
  );

  // Collect all warnings
  const warnings: PowerWarning[] = [];
  const criticalWarnings: PowerWarning[] = [];

  // Rack capacity warnings
  [...dimmerSummaries, ...pdSummaries].forEach(summary => {
    summary.warnings.forEach(warning => {
      const powerWarning: PowerWarning = {
        type: 'capacity',
        severity: warning.includes('CRITICAL') ? 'critical' : 'warning',
        message: warning,
        rack_id: summary.rack_id,
        rack_name: summary.rack_name
      };

      if (powerWarning.severity === 'critical') {
        criticalWarnings.push(powerWarning);
      } else {
        warnings.push(powerWarning);
      }
    });
  });

  // Phase balance warnings
  phaseBalance.warnings.forEach(warning => {
    const powerWarning: PowerWarning = {
      type: 'phase_imbalance',
      severity: warning.includes('CRITICAL') ? 'critical' : 'warning',
      message: warning
    };

    if (powerWarning.severity === 'critical') {
      criticalWarnings.push(powerWarning);
    } else {
      warnings.push(powerWarning);
    }
  });

  return {
    total_load_kw: totalLoad,
    total_capacity_kw: totalCapacity,
    overall_utilization: overallUtilization,
    dimmer_racks: dimmerSummaries,
    pd_racks: pdSummaries,
    services,
    phase_balance: phaseBalance,
    warnings,
    critical_warnings: criticalWarnings
  };
}

// ============================================
// Capacity Checking
// ============================================

/**
 * Check if a rack has capacity for additional fixtures
 */
export function checkRackCapacity(
  rack: DimmerRack | PDRack,
  fixtures: Array<{ dimmer_rack_id?: string; pd_rack_id?: string; dimmer_channel_number?: number; pd_circuit_number?: number }>,
  isDimmerRack: boolean
): CapacityCheckResult {
  const circuitKey = isDimmerRack ? 'dimmer_channel_number' : 'pd_circuit_number';
  const rackIdKey = isDimmerRack ? 'dimmer_rack_id' : 'pd_rack_id';

  const usedCircuits = new Set(
    fixtures
      .filter(f => f[rackIdKey] === rack.id && f[circuitKey])
      .map(f => f[circuitKey]!)
  ).size;

  const available = rack.circuit_count - usedCircuits;
  const percentageUsed = (usedCircuits / rack.circuit_count) * 100;

  const warnings: string[] = [];
  if (percentageUsed >= CAPACITY_CRITICAL_THRESHOLD) {
    warnings.push('Rack is at full capacity');
  } else if (percentageUsed >= CAPACITY_WARNING_THRESHOLD) {
    warnings.push('Rack is nearing capacity');
  }

  return {
    has_capacity: available > 0,
    circuits_available: available,
    percentage_used: percentageUsed,
    warnings
  };
}

/**
 * Format power value for display
 */
export function formatPower(kw: number, precision: number = 2): string {
  if (kw >= 1) {
    return `${kw.toFixed(precision)} kW`;
  }
  return `${(kw * 1000).toFixed(0)} W`;
}

/**
 * Format amperage for display
 */
export function formatAmps(amps: number, precision: number = 1): string {
  return `${amps.toFixed(precision)} A`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number, precision: number = 1): string {
  return `${percentage.toFixed(precision)}%`;
}
