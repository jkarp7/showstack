import { describe, it, expect } from 'vitest';
import {
  parseCircuitNumber,
  parseCircuitName,
  calculateChannelNumber,
  linkToDimmerRack,
  linkToPDRack,
  autoLinkCircuit,
} from '../circuitParser';
import type { DimmerRack, PDRack } from '../../types/power';

/**
 * Comprehensive tests for circuit parser utilities
 * Target: 80% coverage with 15-20 test cases
 */

// Mock racks for testing
const mockDimmerRacks: DimmerRack[] = [
  {
    id: 'rack-1',
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
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'rack-2',
    project_id: 'project-1',
    name: 'FOH Dimmer',
    rack_identifier: 'FOH',
    rack_type: 'dimmer',
    circuit_count: 48,
    channels_per_module: 12,
    watts_per_module: 2400,
    location: 'FOH',
    phase: 'B',
    service_type: '208V 3-Phase',
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

const mockPDRacks: PDRack[] = [
  {
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
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'pd-2',
    project_id: 'project-1',
    name: 'Deck PD',
    rack_identifier: 'DECK',
    rack_type: 'pd',
    circuit_count: 24,
    voltage: 208,
    amps_per_breaker: 20,
    location: 'Deck',
    phase: 'B',
    service_type: '208V 3-Phase',
    notes: '',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

// ============================================
// Circuit Number Parsing Tests
// ============================================

describe('parseCircuitNumber', () => {
  it('should return number as-is', () => {
    expect(parseCircuitNumber(5)).toBe(5);
    expect(parseCircuitNumber(12)).toBe(12);
  });

  it('should parse simple string numbers', () => {
    expect(parseCircuitNumber('5')).toBe(5);
    expect(parseCircuitNumber('12')).toBe(12);
  });

  it('should handle point notation for power thru chains', () => {
    expect(parseCircuitNumber('1.2')).toBe(1); // Base circuit 1
    expect(parseCircuitNumber('1.3')).toBe(1);
    expect(parseCircuitNumber('5.1')).toBe(5);
  });

  it('should return 0 for invalid inputs', () => {
    expect(parseCircuitNumber('abc')).toBe(0);
    expect(parseCircuitNumber('')).toBe(0);
    expect(parseCircuitNumber('.')).toBe(0);
  });

  it('should handle multiple decimals gracefully', () => {
    expect(parseCircuitNumber('1.2.3')).toBe(1); // Takes first part
  });
});

// ============================================
// Circuit Name Parsing Tests
// ============================================

describe('parseCircuitName', () => {
  describe('Traditional format (AA, AB, etc.)', () => {
    it('should parse simple two-letter format', () => {
      const result = parseCircuitName('AA');
      expect(result).not.toBeNull();
      expect(result?.rackIdentifier).toBe('A');
      expect(result?.socapexLetter).toBe('A');
    });

    it('should parse with rack identifier and socapex', () => {
      const result = parseCircuitName('AB');
      expect(result?.rackIdentifier).toBe('A');
      expect(result?.socapexLetter).toBe('B');
    });

    it('should handle longer rack identifiers', () => {
      const result = parseCircuitName('XYZ');
      expect(result?.rackIdentifier).toBe('XY');
      expect(result?.socapexLetter).toBe('Z');
    });

    it('should convert to uppercase', () => {
      const result = parseCircuitName('ab');
      expect(result?.rackIdentifier).toBe('A');
      expect(result?.socapexLetter).toBe('B');
    });
  });

  describe('Hyphenated format (FOH-A, DECK-B, etc.)', () => {
    it('should parse hyphenated format', () => {
      const result = parseCircuitName('FOH-A');
      expect(result?.rackIdentifier).toBe('FOH');
      expect(result?.socapexLetter).toBe('A');
    });

    it('should parse underscore format', () => {
      const result = parseCircuitName('DECK_B');
      expect(result?.rackIdentifier).toBe('DECK');
      expect(result?.socapexLetter).toBe('B');
    });

    it('should handle multi-word rack names', () => {
      const result = parseCircuitName('STAGE-LEFT-A');
      expect(result?.rackIdentifier).toBe('STAGE-LEFT');
      expect(result?.socapexLetter).toBe('A');
    });

    it('should handle lowercase hyphenated format', () => {
      const result = parseCircuitName('foh-a');
      expect(result?.rackIdentifier).toBe('FOH');
      expect(result?.socapexLetter).toBe('A');
    });
  });

  describe('Edge cases', () => {
    it('should return null for empty string', () => {
      expect(parseCircuitName('')).toBeNull();
    });

    it('should return null for single character', () => {
      expect(parseCircuitName('A')).toBeNull();
    });

    it('should trim whitespace', () => {
      const result = parseCircuitName('  FOH-A  ');
      expect(result?.rackIdentifier).toBe('FOH');
      expect(result?.socapexLetter).toBe('A');
    });
  });
});

// ============================================
// Channel Number Calculation Tests
// ============================================

describe('calculateChannelNumber', () => {
  it('should calculate channel for socapex A (circuits 1-6)', () => {
    expect(calculateChannelNumber('A', 1)).toBe(1);
    expect(calculateChannelNumber('A', 6)).toBe(6);
  });

  it('should calculate channel for socapex B (circuits 7-12)', () => {
    expect(calculateChannelNumber('B', 1)).toBe(7);
    expect(calculateChannelNumber('B', 6)).toBe(12);
  });

  it('should calculate channel for socapex C (circuits 13-18)', () => {
    expect(calculateChannelNumber('C', 1)).toBe(13);
    expect(calculateChannelNumber('C', 6)).toBe(18);
  });

  it('should calculate channel for higher socapex letters', () => {
    // D = index 3, circuit 1 = (3 * 6) + 1 = 19
    expect(calculateChannelNumber('D', 1)).toBe(19);
    // Z = index 25, circuit 1 = (25 * 6) + 1 = 151
    expect(calculateChannelNumber('Z', 1)).toBe(151);
  });

  it('should return circuit number directly if > 6', () => {
    // Assume user entered actual channel number
    expect(calculateChannelNumber('A', 15)).toBe(15);
    expect(calculateChannelNumber('B', 100)).toBe(100);
  });

  it('should handle zero and edge case circuit numbers', () => {
    expect(calculateChannelNumber('A', 0)).toBe(0);
    expect(calculateChannelNumber('Z', 6)).toBe(156); // (25 * 6) + 6
  });
});

// ============================================
// Dimmer Rack Linking Tests
// ============================================

describe('linkToDimmerRack', () => {
  it('should link to dimmer rack A', () => {
    const result = linkToDimmerRack('AA', 1, mockDimmerRacks);
    expect(result.rackId).toBe('rack-1');
    expect(result.rackName).toBe('Dimmer Rack A');
    expect(result.channelNumber).toBe(1); // Socapex A, circuit 1
    expect(result.error).toBeUndefined();
  });

  it('should link to FOH dimmer rack', () => {
    const result = linkToDimmerRack('FOH-B', 3, mockDimmerRacks);
    expect(result.rackId).toBe('rack-2');
    expect(result.rackName).toBe('FOH Dimmer');
    expect(result.channelNumber).toBe(9); // Socapex B, circuit 3 = 7 + 3 = 9
    expect(result.error).toBeUndefined();
  });

  it('should calculate correct channel for socapex B', () => {
    const result = linkToDimmerRack('AB', 2, mockDimmerRacks);
    expect(result.channelNumber).toBe(8); // Socapex B, circuit 2 = 6 + 2 = 8
  });

  it('should return error for invalid circuit format', () => {
    const result = linkToDimmerRack('', 1, mockDimmerRacks);
    expect(result.error).toBe('Invalid circuit format');
    expect(result.rackId).toBeNull();
  });

  it('should return error when rack not found', () => {
    const result = linkToDimmerRack('NOTFOUND-A', 1, mockDimmerRacks);
    expect(result.error).toContain('No dimmer rack found');
    expect(result.rackId).toBeNull();
  });

  it('should return error when channel exceeds rack capacity', () => {
    // Rack A has 96 circuits
    const result = linkToDimmerRack('AA', 97, mockDimmerRacks);
    expect(result.error).toContain('exceeds rack capacity');
    expect(result.rackId).toBeNull();
  });

  it('should be case-insensitive for rack matching', () => {
    const result = linkToDimmerRack('foh-a', 1, mockDimmerRacks);
    expect(result.rackId).toBe('rack-2');
  });
});

// ============================================
// PD Rack Linking Tests
// ============================================

describe('linkToPDRack', () => {
  it('should link to PD rack', () => {
    const result = linkToPDRack('PD1-A', 1, mockPDRacks);
    expect(result.rackId).toBe('pd-1');
    expect(result.rackName).toBe('PD Rack 1');
    expect(result.channelNumber).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('should link to DECK PD rack', () => {
    const result = linkToPDRack('DECK-A', 3, mockPDRacks);
    expect(result.rackId).toBe('pd-2');
    expect(result.rackName).toBe('Deck PD');
    expect(result.channelNumber).toBe(3);
  });

  it('should return error when PD rack not found', () => {
    const result = linkToPDRack('NOTFOUND-A', 1, mockPDRacks);
    expect(result.error).toContain('No PD rack found');
    expect(result.rackId).toBeNull();
  });

  it('should return error when circuit exceeds capacity', () => {
    // PD2 has 24 circuits
    const result = linkToPDRack('DECK-A', 25, mockPDRacks);
    expect(result.error).toContain('exceeds rack capacity');
  });
});

// ============================================
// Auto-Link Tests
// ============================================

describe('autoLinkCircuit', () => {
  it('should auto-link to dimmer rack when found', () => {
    const result = autoLinkCircuit('AA', 1, mockDimmerRacks, mockPDRacks);
    expect(result.dimmer_rack_id).toBe('rack-1');
    expect(result.dimmer_channel_number).toBe(1);
    expect(result.pd_rack_id).toBeUndefined();
  });

  it('should auto-link to PD rack when dimmer not found', () => {
    const result = autoLinkCircuit('PD1-A', 1, mockDimmerRacks, mockPDRacks);
    expect(result.pd_rack_id).toBe('pd-1');
    expect(result.pd_circuit_number).toBe(1);
    expect(result.dimmer_rack_id).toBeUndefined();
  });

  it('should handle point notation circuit numbers', () => {
    // Circuit "1.2" should link as circuit 1
    const result = autoLinkCircuit('AA', '1.2', mockDimmerRacks, mockPDRacks);
    expect(result.dimmer_rack_id).toBe('rack-1');
    expect(result.dimmer_channel_number).toBe(1);
  });

  it('should return error when no racks match', () => {
    const result = autoLinkCircuit('UNKNOWN-A', 1, mockDimmerRacks, mockPDRacks);
    expect(result.error).toBeTruthy();
    expect(result.dimmer_rack_id).toBeUndefined();
    expect(result.pd_rack_id).toBeUndefined();
  });

  it('should return empty object for missing inputs', () => {
    expect(autoLinkCircuit('', 1, mockDimmerRacks, mockPDRacks)).toEqual({});
    expect(autoLinkCircuit('AA', '', mockDimmerRacks, mockPDRacks)).toEqual({});
    expect(autoLinkCircuit('AA', 0, mockDimmerRacks, mockPDRacks)).toEqual({});
  });

  it('should prefer dimmer racks over PD racks', () => {
    // If both have same identifier (unlikely but test the logic)
    const result = autoLinkCircuit('FOH-A', 1, mockDimmerRacks, mockPDRacks);
    expect(result.dimmer_rack_id).toBe('rack-2');
    expect(result.pd_rack_id).toBeUndefined();
  });
});
