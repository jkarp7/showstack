/**
 * Phase Distribution Template types for ShowStack
 * Allows saving and reusing phase assignment patterns across racks
 */

import { Phase, PhaseConfig } from './power';

/**
 * Phase distribution map
 * Maps circuit numbers (as strings) to phases
 * Example: {"1": "A", "2": "B", "3": "A", "4": "B", ...}
 */
export type PhaseDistribution = Record<string, Phase>;

/**
 * Phase Distribution Template
 * Stores a reusable phase assignment pattern
 */
export interface PhaseDistributionTemplate {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  phase_config: PhaseConfig; // 'single', 'split', or 'three'
  circuit_count: 12 | 24 | 48 | 96;
  phase_distribution: PhaseDistribution; // JSON: circuit number -> phase
  is_system: boolean; // System (built-in) vs user template
  created_at: number;
  updated_at: number;
}

/**
 * Form data for creating/editing a phase template
 */
export interface PhaseTemplateFormData {
  name: string;
  description?: string;
  phase_config: PhaseConfig;
  circuit_count: 12 | 24 | 48 | 96;
  phase_distribution: PhaseDistribution;
}

/**
 * Built-in system templates
 */
export const SYSTEM_PHASE_TEMPLATES: Omit<PhaseDistributionTemplate, 'id' | 'project_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'AB Phasing (Alternating)',
    description: 'Alternates between Phase A and Phase B',
    phase_config: 'split',
    circuit_count: 24,
    is_system: true,
    phase_distribution: {
      '1': 'A', '2': 'B', '3': 'A', '4': 'B',
      '5': 'A', '6': 'B', '7': 'A', '8': 'B',
      '9': 'A', '10': 'B', '11': 'A', '12': 'B',
      '13': 'A', '14': 'B', '15': 'A', '16': 'B',
      '17': 'A', '18': 'B', '19': 'A', '20': 'B',
      '21': 'A', '22': 'B', '23': 'A', '24': 'B'
    }
  },
  {
    name: 'AC Phasing (Alternating)',
    description: 'Alternates between Phase A and Phase C',
    phase_config: 'split',
    circuit_count: 24,
    is_system: true,
    phase_distribution: {
      '1': 'A', '2': 'C', '3': 'A', '4': 'C',
      '5': 'A', '6': 'C', '7': 'A', '8': 'C',
      '9': 'A', '10': 'C', '11': 'A', '12': 'C',
      '13': 'A', '14': 'C', '15': 'A', '16': 'C',
      '17': 'A', '18': 'C', '19': 'A', '20': 'C',
      '21': 'A', '22': 'C', '23': 'A', '24': 'C'
    }
  },
  {
    name: 'BC Phasing (Alternating)',
    description: 'Alternates between Phase B and Phase C',
    phase_config: 'split',
    circuit_count: 24,
    is_system: true,
    phase_distribution: {
      '1': 'B', '2': 'C', '3': 'B', '4': 'C',
      '5': 'B', '6': 'C', '7': 'B', '8': 'C',
      '9': 'B', '10': 'C', '11': 'B', '12': 'C',
      '13': 'B', '14': 'C', '15': 'B', '16': 'C',
      '17': 'B', '18': 'C', '19': 'B', '20': 'C',
      '21': 'B', '22': 'C', '23': 'B', '24': 'C'
    }
  },
  {
    name: 'Three Phase ABC (Sequential)',
    description: 'Rotates through Phase A, B, C in sequence',
    phase_config: 'three',
    circuit_count: 24,
    is_system: true,
    phase_distribution: {
      '1': 'A', '2': 'B', '3': 'C', '4': 'A',
      '5': 'B', '6': 'C', '7': 'A', '8': 'B',
      '9': 'C', '10': 'A', '11': 'B', '12': 'C',
      '13': 'A', '14': 'B', '15': 'C', '16': 'A',
      '17': 'B', '18': 'C', '19': 'A', '20': 'B',
      '21': 'C', '22': 'A', '23': 'B', '24': 'C'
    }
  },
  {
    name: 'Single Phase A',
    description: 'All circuits on Phase A',
    phase_config: 'single',
    circuit_count: 24,
    is_system: true,
    phase_distribution: Object.fromEntries(
      Array.from({ length: 24 }, (_, i) => [(i + 1).toString(), 'A' as Phase])
    )
  },
  {
    name: 'Single Phase B',
    description: 'All circuits on Phase B',
    phase_config: 'single',
    circuit_count: 24,
    is_system: true,
    phase_distribution: Object.fromEntries(
      Array.from({ length: 24 }, (_, i) => [(i + 1).toString(), 'B' as Phase])
    )
  },
  {
    name: 'Single Phase C',
    description: 'All circuits on Phase C',
    phase_config: 'single',
    circuit_count: 24,
    is_system: true,
    phase_distribution: Object.fromEntries(
      Array.from({ length: 24 }, (_, i) => [(i + 1).toString(), 'C' as Phase])
    )
  }
];

/**
 * Generate a phase distribution for a given circuit count and pattern
 */
export function generatePhaseDistribution(
  circuitCount: number,
  pattern: 'ab' | 'ac' | 'bc' | 'abc' | 'a' | 'b' | 'c'
): PhaseDistribution {
  const distribution: PhaseDistribution = {};

  for (let i = 1; i <= circuitCount; i++) {
    switch (pattern) {
      case 'ab':
        distribution[i.toString()] = i % 2 === 1 ? 'A' : 'B';
        break;
      case 'ac':
        distribution[i.toString()] = i % 2 === 1 ? 'A' : 'C';
        break;
      case 'bc':
        distribution[i.toString()] = i % 2 === 1 ? 'B' : 'C';
        break;
      case 'abc':
        const phases: Phase[] = ['A', 'B', 'C'];
        distribution[i.toString()] = phases[(i - 1) % 3];
        break;
      case 'a':
        distribution[i.toString()] = 'A';
        break;
      case 'b':
        distribution[i.toString()] = 'B';
        break;
      case 'c':
        distribution[i.toString()] = 'C';
        break;
    }
  }

  return distribution;
}

/**
 * Calculate phase balance for a template
 */
export function calculateTemplatePhaseBalance(distribution: PhaseDistribution): {
  a: number;
  b: number;
  c: number;
  total: number;
} {
  const counts = { a: 0, b: 0, c: 0 };

  Object.values(distribution).forEach(phase => {
    if (phase === 'A') counts.a++;
    else if (phase === 'B') counts.b++;
    else if (phase === 'C') counts.c++;
  });

  return {
    ...counts,
    total: counts.a + counts.b + counts.c
  };
}
