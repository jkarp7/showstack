import { describe, it, expect } from 'vitest';
import {
  wattsToKW,
  ampsToWatts,
  wattsToAmps,
  calculateDimmerRackCapacity,
  calculateDimmerRackLoad,
  getDimmerRackSummary,
  calculatePDRackCapacity,
  calculatePDRackLoad,
  getPDRackSummary,
  calculatePhaseBalance,
  calculateServicePowerSummaries,
  calculateProjectPowerSummary,
  checkRackCapacity,
  formatPower,
  formatAmps,
  formatPercentage
} from '../powerCalculations';
import type { DimmerRack, PDRack, Phase } from '../../types/power';

/**
 * Comprehensive tests for power calculation utilities
 * Target: 80% coverage with 25-30 test cases
 */

// ============================================
// Conversion Utilities Tests
// ============================================

describe('Power Conversion Utilities', () => {
  describe('wattsToKW', () => {
    it('should convert watts to kilowatts', () => {
      expect(wattsToKW(1000)).toBe(1);
      expect(wattsToKW(2400)).toBe(2.4);
      expect(wattsToKW(500)).toBe(0.5);
    });

    it('should handle zero watts', () => {
      expect(wattsToKW(0)).toBe(0);
    });

    it('should handle fractional watts', () => {
      expect(wattsToKW(1500)).toBe(1.5);
      expect(wattsToKW(750)).toBe(0.75);
    });
  });

  describe('ampsToWatts', () => {
    it('should convert amps to watts with default 120V', () => {
      expect(ampsToWatts(10)).toBe(1200);
      expect(ampsToWatts(20)).toBe(2400);
    });

    it('should convert amps to watts with custom voltage', () => {
      expect(ampsToWatts(10, 208)).toBe(2080);
      expect(ampsToWatts(20, 240)).toBe(4800);
    });

    it('should handle zero amps', () => {
      expect(ampsToWatts(0)).toBe(0);
      expect(ampsToWatts(0, 208)).toBe(0);
    });

    it('should handle fractional amps', () => {
      expect(ampsToWatts(5.5, 120)).toBe(660);
    });
  });

  describe('wattsToAmps', () => {
    it('should convert watts to amps with default 120V', () => {
      expect(wattsToAmps(1200)).toBe(10);
      expect(wattsToAmps(2400)).toBe(20);
    });

    it('should convert watts to amps with custom voltage', () => {
      expect(wattsToAmps(2080, 208)).toBe(10);
      expect(wattsToAmps(4800, 240)).toBe(20);
    });

    it('should handle zero watts', () => {
      expect(wattsToAmps(0)).toBe(0);
    });

    it('should handle fractional results', () => {
      expect(wattsToAmps(1800, 120)).toBe(15);
    });
  });
});

// ============================================
// Dimmer Rack Calculation Tests
// ============================================

describe('Dimmer Rack Calculations', () => {
  const mockDimmerRack: DimmerRack = {
    id: 'rack-1',
    project_id: 'project-1',
    name: 'Dimmer Rack A',
    rack_identifier: 'A',
    rack_type: 'dimmer',
    circuit_count: 96,
    channels_per_module: 12,
    watts_per_module: 2400,
    location: 'Stage Right',
    phase: 'A',
    service_type: '208V 3-Phase',
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  describe('calculateDimmerRackCapacity', () => {
    it('should calculate capacity with default module config', () => {
      // 96 circuits / 12 per module = 8 modules * 2400W = 19.2kW
      const capacity = calculateDimmerRackCapacity(mockDimmerRack);
      expect(capacity).toBe(19.2);
    });

    it('should calculate capacity with custom module configurations', () => {
      const modules = [
        { start_circuit: 1, end_circuit: 12, watts_per_circuit: 2400, module_type: 'dimmer' },
        { start_circuit: 13, end_circuit: 24, watts_per_circuit: 2400, module_type: 'dimmer' }
      ];
      // 2 modules * 12 circuits * 2400W = 57.6kW
      const capacity = calculateDimmerRackCapacity(mockDimmerRack, modules);
      expect(capacity).toBe(57.6);
    });

    it('should exclude thrupower modules from capacity', () => {
      const modules = [
        { start_circuit: 1, end_circuit: 12, watts_per_circuit: 2400, module_type: 'dimmer' },
        { start_circuit: 13, end_circuit: 24, watts_per_circuit: 0, module_type: 'thrupower' }
      ];
      // Only first module counts: 12 * 2400 = 28.8kW
      const capacity = calculateDimmerRackCapacity(mockDimmerRack, modules);
      expect(capacity).toBe(28.8);
    });

    it('should handle empty module array', () => {
      const capacity = calculateDimmerRackCapacity(mockDimmerRack, []);
      // Falls back to default calculation
      expect(capacity).toBe(19.2);
    });
  });

  describe('calculateDimmerRackLoad', () => {
    it('should calculate load from fixtures', () => {
      const fixtures = [
        { dimmer_rack_id: 'rack-1', wattage: 1200 },
        { dimmer_rack_id: 'rack-1', wattage: 1200 },
        { dimmer_rack_id: 'rack-1', wattage: 2400 }
      ];
      // Total: 4800W = 4.8kW
      const load = calculateDimmerRackLoad(mockDimmerRack, fixtures);
      expect(load).toBe(4.8);
    });

    it('should filter fixtures by rack ID', () => {
      const fixtures = [
        { dimmer_rack_id: 'rack-1', wattage: 1200 },
        { dimmer_rack_id: 'rack-2', wattage: 5000 }, // Different rack
        { dimmer_rack_id: 'rack-1', wattage: 2400 }
      ];
      // Only rack-1 fixtures: 3600W = 3.6kW
      const load = calculateDimmerRackLoad(mockDimmerRack, fixtures);
      expect(load).toBe(3.6);
    });

    it('should handle fixtures with no wattage', () => {
      const fixtures = [
        { dimmer_rack_id: 'rack-1', wattage: 1200 },
        { dimmer_rack_id: 'rack-1' }, // No wattage
        { dimmer_rack_id: 'rack-1', wattage: 0 }
      ];
      const load = calculateDimmerRackLoad(mockDimmerRack, fixtures);
      expect(load).toBe(1.2);
    });

    it('should return zero for rack with no fixtures', () => {
      const load = calculateDimmerRackLoad(mockDimmerRack, []);
      expect(load).toBe(0);
    });
  });

  describe('getDimmerRackSummary', () => {
    it('should generate complete rack summary', () => {
      const fixtures = [
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 1, wattage: 1200 },
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 2, wattage: 1200 },
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 3, wattage: 2400 }
      ];
      const summary = getDimmerRackSummary(mockDimmerRack, fixtures);

      expect(summary.rack_id).toBe('rack-1');
      expect(summary.rack_name).toBe('Dimmer Rack A');
      expect(summary.rack_type).toBe('dimmer');
      expect(summary.total_load_kw).toBe(4.8);
      expect(summary.total_capacity_kw).toBe(19.2);
      expect(summary.circuits_used).toBe(3);
      expect(summary.circuits_available).toBe(93);
    });

    it('should calculate utilization percentage', () => {
      const fixtures = [
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 1, wattage: 9600 } // 50% of 19.2kW
      ];
      const summary = getDimmerRackSummary(mockDimmerRack, fixtures);
      expect(summary.utilization_percentage).toBe(50);
    });

    it('should generate warning at 80% capacity', () => {
      // 19.2kW capacity * 0.81 = 15.552kW (81%)
      const fixtures = [
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 1, wattage: 15552 }
      ];
      const summary = getDimmerRackSummary(mockDimmerRack, fixtures);
      expect(summary.warnings).toHaveLength(1);
      expect(summary.warnings[0]).toContain('WARNING');
    });

    it('should generate critical warning at 100% capacity', () => {
      // 19.2kW capacity * 1.0 = 19.2kW (100%)
      const fixtures = [
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 1, wattage: 19200 }
      ];
      const summary = getDimmerRackSummary(mockDimmerRack, fixtures);
      expect(summary.warnings).toHaveLength(1);
      expect(summary.warnings[0]).toContain('CRITICAL');
    });

    it('should count unique circuits only', () => {
      const fixtures = [
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 1, wattage: 600 },
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 1, wattage: 600 }, // Duplicate circuit
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 2, wattage: 1200 }
      ];
      const summary = getDimmerRackSummary(mockDimmerRack, fixtures);
      expect(summary.circuits_used).toBe(2); // Only circuits 1 and 2
    });
  });
});

// ============================================
// PD Rack Calculation Tests
// ============================================

describe('PD Rack Calculations', () => {
  const mockPDRack: PDRack = {
    id: 'pd-1',
    project_id: 'project-1',
    name: 'PD Rack 1',
    rack_identifier: 'PD1',
    rack_type: 'pd',
    circuit_count: 48,
    voltage: 208,
    amps_per_breaker: 20,
    location: 'Downstage',
    phase: 'B',
    service_type: '208V 3-Phase',
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  describe('calculatePDRackCapacity', () => {
    it('should calculate capacity based on amps per breaker', () => {
      // 48 circuits * 20A * 208V = 199.68kW
      const capacity = calculatePDRackCapacity(mockPDRack);
      expect(capacity).toBe(199.68);
    });

    it('should handle different amperage ratings', () => {
      const rack30A = { ...mockPDRack, amps_per_breaker: 30 };
      // 48 * 30 * 208 = 299.52kW
      const capacity = calculatePDRackCapacity(rack30A);
      expect(capacity).toBe(299.52);
    });

    it('should handle different voltages', () => {
      const rack240V = { ...mockPDRack, voltage: 240 };
      // 48 * 20 * 240 = 230.4kW
      const capacity = calculatePDRackCapacity(rack240V);
      expect(capacity).toBe(230.4);
    });
  });

  describe('calculatePDRackLoad', () => {
    it('should calculate load from wattage', () => {
      const fixtures = [
        { pd_rack_id: 'pd-1', wattage: 2400 },
        { pd_rack_id: 'pd-1', wattage: 1200 }
      ];
      const load = calculatePDRackLoad(mockPDRack, fixtures);
      expect(load).toBe(3.6);
    });

    it('should calculate load from amperage when wattage missing', () => {
      const fixtures = [
        { pd_rack_id: 'pd-1', amperage: 10 } // 10A * 208V = 2080W
      ];
      const load = calculatePDRackLoad(mockPDRack, fixtures);
      expect(load).toBe(2.08);
    });

    it('should prefer wattage over amperage when both present', () => {
      const fixtures = [
        { pd_rack_id: 'pd-1', wattage: 3000, amperage: 10 }
      ];
      const load = calculatePDRackLoad(mockPDRack, fixtures);
      expect(load).toBe(3); // Uses wattage, not amperage
    });

    it('should filter by rack ID', () => {
      const fixtures = [
        { pd_rack_id: 'pd-1', wattage: 2400 },
        { pd_rack_id: 'pd-2', wattage: 5000 }, // Different rack
        { pd_rack_id: 'pd-1', wattage: 1200 }
      ];
      const load = calculatePDRackLoad(mockPDRack, fixtures);
      expect(load).toBe(3.6);
    });
  });

  describe('getPDRackSummary', () => {
    it('should generate complete PD rack summary', () => {
      const fixtures = [
        { pd_rack_id: 'pd-1', pd_circuit_number: 1, wattage: 2400 },
        { pd_rack_id: 'pd-1', pd_circuit_number: 2, wattage: 1200 }
      ];
      const summary = getPDRackSummary(mockPDRack, fixtures);

      expect(summary.rack_id).toBe('pd-1');
      expect(summary.rack_name).toBe('PD Rack 1');
      expect(summary.rack_type).toBe('pd');
      expect(summary.total_load_kw).toBe(3.6);
      expect(summary.circuits_used).toBe(2);
      expect(summary.circuits_available).toBe(46);
    });

    it('should count unique circuits', () => {
      const fixtures = [
        { pd_rack_id: 'pd-1', pd_circuit_number: 1, wattage: 1200 },
        { pd_rack_id: 'pd-1', pd_circuit_number: 1, wattage: 1200 }, // Duplicate
        { pd_rack_id: 'pd-1', pd_circuit_number: 2, wattage: 2400 }
      ];
      const summary = getPDRackSummary(mockPDRack, fixtures);
      expect(summary.circuits_used).toBe(2);
    });
  });
});

// ============================================
// Phase Balance Tests
// ============================================

describe('Phase Balance Calculations', () => {
  describe('calculatePhaseBalance', () => {
    it('should calculate balanced 3-phase loads', () => {
      const fixtures = [
        { phase: 'A' as Phase, wattage: 2080 }, // 10A at 208V
        { phase: 'B' as Phase, wattage: 2080 },
        { phase: 'C' as Phase, wattage: 2080 }
      ];
      const balance = calculatePhaseBalance(fixtures, 208);

      expect(balance.phase_a_load).toBe(10);
      expect(balance.phase_b_load).toBe(10);
      expect(balance.phase_c_load).toBe(10);
      expect(balance.total_load).toBe(30);
      expect(balance.average_load).toBe(10);
      expect(balance.max_imbalance_percentage).toBe(0);
      expect(balance.is_balanced).toBe(true);
    });

    it('should detect phase imbalance', () => {
      const fixtures = [
        { phase: 'A' as Phase, wattage: 4160 }, // 20A
        { phase: 'B' as Phase, wattage: 2080 }, // 10A
        { phase: 'C' as Phase, wattage: 2080 }  // 10A
      ];
      const balance = calculatePhaseBalance(fixtures, 208);

      expect(balance.phase_a_load).toBeCloseTo(20, 1);
      expect(balance.phase_b_load).toBeCloseTo(10, 1);
      expect(balance.phase_c_load).toBeCloseTo(10, 1);
      // Max imbalance: (20 - 10) / 13.33 * 100 = 75%
      expect(balance.max_imbalance_percentage).toBeGreaterThan(50);
      expect(balance.is_balanced).toBe(false);
    });

    it('should handle amperage when wattage missing', () => {
      const fixtures = [
        { phase: 'A' as Phase, amperage: 10 },
        { phase: 'B' as Phase, amperage: 10 },
        { phase: 'C' as Phase, amperage: 10 }
      ];
      const balance = calculatePhaseBalance(fixtures, 208);

      expect(balance.phase_a_load).toBe(10);
      expect(balance.phase_b_load).toBe(10);
      expect(balance.phase_c_load).toBe(10);
    });

    it('should ignore fixtures without phase assignment', () => {
      const fixtures = [
        { phase: 'A' as Phase, wattage: 2080 },
        { wattage: 5000 }, // No phase
        { phase: 'B' as Phase, wattage: 2080 }
      ];
      const balance = calculatePhaseBalance(fixtures, 208);

      expect(balance.phase_a_load).toBeCloseTo(10, 1);
      expect(balance.phase_b_load).toBeCloseTo(10, 1);
      expect(balance.phase_c_load).toBe(0);
    });

    it('should generate warning at 15% imbalance', () => {
      // Create 16% imbalance
      const fixtures = [
        { phase: 'A' as Phase, wattage: 2496 }, // 12A
        { phase: 'B' as Phase, wattage: 2080 }, // 10A
        { phase: 'C' as Phase, wattage: 2080 }  // 10A
      ];
      const balance = calculatePhaseBalance(fixtures, 208);

      expect(balance.warnings).toHaveLength(1);
      expect(balance.warnings[0]).toContain('WARNING');
    });

    it('should generate critical warning at 25% imbalance', () => {
      // Create 50% imbalance
      const fixtures = [
        { phase: 'A' as Phase, wattage: 4160 }, // 20A
        { phase: 'B' as Phase, wattage: 2080 }, // 10A
        { phase: 'C' as Phase, wattage: 2080 }  // 10A
      ];
      const balance = calculatePhaseBalance(fixtures, 208);

      expect(balance.warnings).toHaveLength(1);
      expect(balance.warnings[0]).toContain('CRITICAL');
    });

    it('should handle empty fixture array', () => {
      const balance = calculatePhaseBalance([], 208);

      expect(balance.total_load).toBe(0);
      expect(balance.average_load).toBe(0);
      expect(balance.max_imbalance_percentage).toBe(0);
    });
  });
});

// ============================================
// Capacity Checking Tests
// ============================================

describe('Capacity Checking', () => {
  const mockRack: DimmerRack = {
    id: 'rack-1',
    project_id: 'project-1',
    name: 'Test Rack',
    rack_identifier: 'T1',
    rack_type: 'dimmer',
    circuit_count: 96,
    channels_per_module: 12,
    watts_per_module: 2400,
    location: 'Stage',
    phase: 'A',
    service_type: '208V 3-Phase',
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  describe('checkRackCapacity', () => {
    it('should show capacity available when rack not full', () => {
      const fixtures = [
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 1 },
        { dimmer_rack_id: 'rack-1', dimmer_channel_number: 2 }
      ];
      const result = checkRackCapacity(mockRack, fixtures, true);

      expect(result.has_capacity).toBe(true);
      expect(result.circuits_available).toBe(94);
      expect(result.percentage_used).toBeCloseTo(2.08, 1);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn at 80% capacity', () => {
      const fixtures = Array.from({ length: 78 }, (_, i) => ({
        dimmer_rack_id: 'rack-1',
        dimmer_channel_number: i + 1
      }));
      const result = checkRackCapacity(mockRack, fixtures, true);

      expect(result.percentage_used).toBeCloseTo(81.25, 1);
      expect(result.warnings).toContain('Rack is nearing capacity');
    });

    it('should show critical at 100% capacity', () => {
      const fixtures = Array.from({ length: 96 }, (_, i) => ({
        dimmer_rack_id: 'rack-1',
        dimmer_channel_number: i + 1
      }));
      const result = checkRackCapacity(mockRack, fixtures, true);

      expect(result.has_capacity).toBe(false);
      expect(result.circuits_available).toBe(0);
      expect(result.percentage_used).toBe(100);
      expect(result.warnings).toContain('Rack is at full capacity');
    });

    it('should work for PD racks', () => {
      const pdRack: PDRack = {
        id: 'pd-1',
        project_id: 'project-1',
        name: 'PD Rack',
        rack_identifier: 'PD1',
        rack_type: 'pd',
        circuit_count: 48,
        voltage: 208,
        amps_per_breaker: 20,
        location: 'Stage',
        phase: 'A',
        service_type: '208V 3-Phase',
        notes: '',
        created_at: Date.now(),
        updated_at: Date.now()
      };

      const fixtures = [
        { pd_rack_id: 'pd-1', pd_circuit_number: 1 },
        { pd_rack_id: 'pd-1', pd_circuit_number: 2 }
      ];
      const result = checkRackCapacity(pdRack, fixtures, false);

      expect(result.has_capacity).toBe(true);
      expect(result.circuits_available).toBe(46);
    });
  });
});

// ============================================
// Format Utilities Tests
// ============================================

describe('Format Utilities', () => {
  describe('formatPower', () => {
    it('should format kilowatts for values >= 1kW', () => {
      expect(formatPower(1)).toBe('1.00 kW');
      expect(formatPower(2.5)).toBe('2.50 kW');
      expect(formatPower(10.123)).toBe('10.12 kW');
    });

    it('should format watts for values < 1kW', () => {
      expect(formatPower(0.5)).toBe('500 W');
      expect(formatPower(0.75)).toBe('750 W');
      expect(formatPower(0.123)).toBe('123 W');
    });

    it('should respect precision parameter for kW', () => {
      expect(formatPower(2.12345, 3)).toBe('2.123 kW');
      expect(formatPower(2.12345, 1)).toBe('2.1 kW');
    });

    it('should handle zero', () => {
      expect(formatPower(0)).toBe('0 W');
    });
  });

  describe('formatAmps', () => {
    it('should format amperage with precision', () => {
      expect(formatAmps(10)).toBe('10.0 A');
      expect(formatAmps(15.5)).toBe('15.5 A');
      expect(formatAmps(20.123)).toBe('20.1 A');
    });

    it('should respect precision parameter', () => {
      expect(formatAmps(10.123, 2)).toBe('10.12 A');
      expect(formatAmps(10.123, 0)).toBe('10 A');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with precision', () => {
      expect(formatPercentage(50)).toBe('50.0%');
      expect(formatPercentage(75.5)).toBe('75.5%');
      expect(formatPercentage(99.999)).toBe('100.0%');
    });

    it('should respect precision parameter', () => {
      expect(formatPercentage(75.123, 2)).toBe('75.12%');
      expect(formatPercentage(75.123, 0)).toBe('75%');
    });
  });
});

// ============================================
// PD Rack Summary Tests
// ============================================

describe('getPDRackSummary', () => {
  const mockPDRack: PDRack = {
    id: 'pd-1',
    project_id: 'project-1',
    name: 'PD Rack 1',
    rack_identifier: 'PD1',
    rack_type: 'pd',
    circuit_count: 48,
    voltage: 208,
    amps_per_breaker: 20,
    location: 'Stage',
    phase: 'A',
    service_type: '208V 3-Phase',
    building_service: 'Service A',
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  it('should calculate PD rack summary', () => {
    const fixtures = [
      { pd_rack_id: 'pd-1', pd_circuit_number: 1, wattage: 1000 },
      { pd_rack_id: 'pd-1', pd_circuit_number: 2, wattage: 2000 }
    ];

    const summary = getPDRackSummary(mockPDRack, fixtures);

    expect(summary.rack_id).toBe('pd-1');
    expect(summary.rack_name).toBe('PD Rack 1');
    expect(summary.total_load_kw).toBe(3); // 3000W = 3kW
    expect(summary.total_capacity_kw).toBe(199.68); // 48 circuits * 20A * 208V / 1000
  });

  it('should calculate utilization percentage', () => {
    const fixtures = [
      { pd_rack_id: 'pd-1', pd_circuit_number: 1, wattage: 100000 } // 100kW
    ];

    const summary = getPDRackSummary(mockPDRack, fixtures);

    expect(summary.utilization_percentage).toBeGreaterThan(0);
    expect(summary.utilization_percentage).toBeLessThanOrEqual(100);
  });

  it('should generate warnings at capacity thresholds', () => {
    const fixtures = [
      { pd_rack_id: 'pd-1', pd_circuit_number: 1, wattage: 190000 } // ~95% of 199.68kW
    ];

    const summary = getPDRackSummary(mockPDRack, fixtures);

    expect(summary.warnings.length).toBeGreaterThan(0);
  });
});

// ============================================
// Service Power Summary Tests
// ============================================

describe('calculateServicePowerSummaries', () => {
  const mockDimmerRack: DimmerRack = {
    id: 'dimmer-1',
    project_id: 'project-1',
    name: 'Dimmer Rack A',
    rack_identifier: 'A',
    rack_type: 'dimmer',
    circuit_count: 96,
    channels_per_module: 12,
    watts_per_module: 2400,
    location: 'Stage',
    phase: 'A',
    service_type: '208V 3-Phase',
    building_service: 'Service A',
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  const mockPDRack: PDRack = {
    id: 'pd-1',
    project_id: 'project-1',
    name: 'PD Rack 1',
    rack_identifier: 'PD1',
    rack_type: 'pd',
    circuit_count: 48,
    voltage: 208,
    amps_per_breaker: 20,
    location: 'Stage',
    phase: 'A',
    service_type: '208V 3-Phase',
    building_service: 'Service A',
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  const mockPDRack2: PDRack = {
    ...mockPDRack,
    id: 'pd-2',
    name: 'PD Rack 2',
    rack_identifier: 'PD2',
    building_service: 'Service B'
  };

  it('should group summaries by building service', () => {
    const dimmerSummaries = [{
      rack_id: 'dimmer-1',
      rack_name: 'Dimmer Rack A',
      total_capacity_kw: 100,
      total_load_kw: 50,
      utilization_percentage: 50,
      circuit_count: 96,
      warnings: []
    }];

    const pdSummaries = [
      {
        rack_id: 'pd-1',
        rack_name: 'PD Rack 1',
        total_capacity_kw: 200,
        total_load_kw: 100,
        utilization_percentage: 50,
        circuit_count: 48,
        warnings: []
      },
      {
        rack_id: 'pd-2',
        rack_name: 'PD Rack 2',
        total_capacity_kw: 200,
        total_load_kw: 150,
        utilization_percentage: 75,
        circuit_count: 48,
        warnings: []
      }
    ];

    const serviceSummaries = calculateServicePowerSummaries(
      dimmerSummaries,
      pdSummaries,
      [mockDimmerRack],
      [mockPDRack, mockPDRack2]
    );

    expect(serviceSummaries.length).toBe(2); // Service A and Service B
    expect(serviceSummaries.find(s => s.service_name === 'Service A')).toBeDefined();
    expect(serviceSummaries.find(s => s.service_name === 'Service B')).toBeDefined();
  });

  it('should aggregate capacity and load by service', () => {
    const dimmerSummaries = [{
      rack_id: 'dimmer-1',
      rack_name: 'Dimmer Rack A',
      total_capacity_kw: 100,
      total_load_kw: 50,
      utilization_percentage: 50,
      circuit_count: 96,
      warnings: []
    }];

    const pdSummaries = [{
      rack_id: 'pd-1',
      rack_name: 'PD Rack 1',
      total_capacity_kw: 200,
      total_load_kw: 100,
      utilization_percentage: 50,
      circuit_count: 48,
      warnings: []
    }];

    const serviceSummaries = calculateServicePowerSummaries(
      dimmerSummaries,
      pdSummaries,
      [mockDimmerRack],
      [mockPDRack]
    );

    const serviceA = serviceSummaries.find(s => s.service_name === 'Service A')!;
    expect(serviceA.total_capacity_kw).toBe(300); // 100 + 200
    expect(serviceA.total_load_kw).toBe(150); // 50 + 100
  });

  it('should sort services with "Unassigned" last', () => {
    const dimmerRackUnassigned: DimmerRack = {
      ...mockDimmerRack,
      id: 'dimmer-2',
      building_service: undefined
    };

    const dimmerSummaries = [
      {
        rack_id: 'dimmer-1',
        rack_name: 'Dimmer Rack A',
        total_capacity_kw: 100,
        total_load_kw: 50,
        utilization_percentage: 50,
        circuit_count: 96,
        warnings: []
      },
      {
        rack_id: 'dimmer-2',
        rack_name: 'Dimmer Rack B',
        total_capacity_kw: 100,
        total_load_kw: 50,
        utilization_percentage: 50,
        circuit_count: 96,
        warnings: []
      }
    ];

    const serviceSummaries = calculateServicePowerSummaries(
      dimmerSummaries,
      [],
      [mockDimmerRack, dimmerRackUnassigned],
      []
    );

    expect(serviceSummaries[serviceSummaries.length - 1].service_name).toBe('Unassigned');
  });

  it('should propagate rack warnings to service level', () => {
    const dimmerSummaries = [{
      rack_id: 'dimmer-1',
      rack_name: 'Dimmer Rack A',
      total_capacity_kw: 100,
      total_load_kw: 90,
      utilization_percentage: 90,
      circuit_count: 96,
      warnings: ['Rack at 90% capacity']
    }];

    const serviceSummaries = calculateServicePowerSummaries(
      dimmerSummaries,
      [],
      [mockDimmerRack],
      []
    );

    const serviceA = serviceSummaries.find(s => s.service_name === 'Service A')!;
    expect(serviceA.warnings.length).toBeGreaterThan(0);
    expect(serviceA.warnings.some(w => w.includes('Dimmer Rack A'))).toBe(true);
  });
});

// ============================================
// Project Power Summary Tests
// ============================================

describe('calculateProjectPowerSummary', () => {
  const mockDimmerRack: DimmerRack = {
    id: 'dimmer-1',
    project_id: 'project-1',
    name: 'Dimmer Rack A',
    rack_identifier: 'A',
    rack_type: 'dimmer',
    circuit_count: 96,
    channels_per_module: 12,
    watts_per_module: 2400,
    location: 'Stage',
    phase: 'A',
    service_type: '208V 3-Phase',
    building_service: 'Service A',
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  const mockPDRack: PDRack = {
    id: 'pd-1',
    project_id: 'project-1',
    name: 'PD Rack 1',
    rack_identifier: 'PD1',
    rack_type: 'pd',
    circuit_count: 48,
    voltage: 208,
    amps_per_breaker: 20,
    location: 'Stage',
    phase: 'A',
    service_type: '208V 3-Phase',
    building_service: 'Service A',
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  it('should calculate project-wide power summary', () => {
    const fixtures = [
      { dimmer_rack_id: 'dimmer-1', dimmer_channel_number: 1, wattage: 750, phase: 'A' as Phase },
      { pd_rack_id: 'pd-1', pd_circuit_number: 1, wattage: 1000, phase: 'B' as Phase }
    ];

    const summary = calculateProjectPowerSummary(
      [mockDimmerRack],
      [mockPDRack],
      fixtures
    );

    expect(summary.total_capacity_kw).toBeGreaterThan(0);
    expect(summary.total_load_kw).toBe(1.75); // 750W + 1000W = 1.75kW
    expect(summary.overall_utilization).toBeGreaterThan(0);
  });

  it('should include phase balance in project summary', () => {
    const fixtures = [
      { dimmer_rack_id: 'dimmer-1', dimmer_channel_number: 1, wattage: 4160, phase: 'A' as Phase }, // 20A
      { dimmer_rack_id: 'dimmer-1', dimmer_channel_number: 2, wattage: 2080, phase: 'B' as Phase }, // 10A
      { dimmer_rack_id: 'dimmer-1', dimmer_channel_number: 3, wattage: 2080, phase: 'C' as Phase }  // 10A
    ];

    const summary = calculateProjectPowerSummary(
      [mockDimmerRack],
      [mockPDRack],
      fixtures
    );

    expect(summary.phase_balance).toBeDefined();
    expect(summary.phase_balance.max_imbalance_percentage).toBeGreaterThan(0);
  });

  it('should aggregate service summaries', () => {
    const fixtures = [
      { dimmer_rack_id: 'dimmer-1', dimmer_channel_number: 1, wattage: 750, phase: 'A' as Phase }
    ];

    const summary = calculateProjectPowerSummary(
      [mockDimmerRack],
      [mockPDRack],
      fixtures
    );

    expect(summary.services).toBeDefined();
    expect(summary.services.length).toBeGreaterThan(0);
  });

  it('should collect all warnings and critical warnings', () => {
    const fixtures = [
      // High load to trigger warnings
      { dimmer_rack_id: 'dimmer-1', dimmer_channel_number: 1, wattage: 150000, phase: 'A' as Phase },
      { pd_rack_id: 'pd-1', pd_circuit_number: 1, wattage: 150000, phase: 'B' as Phase }
    ];

    const summary = calculateProjectPowerSummary(
      [mockDimmerRack],
      [mockPDRack],
      fixtures
    );

    // Should have warnings due to high utilization
    expect(summary.warnings.length + summary.critical_warnings.length).toBeGreaterThan(0);
  });
});
