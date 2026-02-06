/**
 * Phase label utility functions for ShowStack
 * Handles custom phase labeling at the project level
 */

import { Phase } from '../types/power';

export interface PhaseLabels {
  phase_label_a?: string;
  phase_label_b?: string;
  phase_label_c?: string;
}

/**
 * Get the label for a specific phase
 * Falls back to the default phase letter if no custom label is set
 */
export function getPhaseLabel(phase: Phase, labels?: PhaseLabels): string {
  if (!labels) {
    return phase;
  }

  switch (phase) {
    case 'A':
      return labels.phase_label_a || 'A';
    case 'B':
      return labels.phase_label_b || 'B';
    case 'C':
      return labels.phase_label_c || 'C';
    default:
      return phase;
  }
}

/**
 * Format a phase label for display
 * Returns empty string if phase is undefined/null
 */
export function formatPhaseLabel(phase: Phase | undefined, labels?: PhaseLabels): string {
  if (!phase) {
    return '';
  }

  return getPhaseLabel(phase, labels);
}

/**
 * Get all phase labels as an array
 * Useful for displaying phase options in dropdowns
 */
export function getAllPhaseLabels(labels?: PhaseLabels): Array<{ value: Phase; label: string }> {
  return [
    { value: 'A' as Phase, label: getPhaseLabel('A', labels) },
    { value: 'B' as Phase, label: getPhaseLabel('B', labels) },
    { value: 'C' as Phase, label: getPhaseLabel('C', labels) },
  ];
}

/**
 * Check if custom phase labels are configured
 */
export function hasCustomPhaseLabels(labels?: PhaseLabels): boolean {
  if (!labels) return false;

  return (
    (labels.phase_label_a !== undefined && labels.phase_label_a !== 'A') ||
    (labels.phase_label_b !== undefined && labels.phase_label_b !== 'B') ||
    (labels.phase_label_c !== undefined && labels.phase_label_c !== 'C')
  );
}

/**
 * Get default phase labels (A, B, C)
 */
export function getDefaultPhaseLabels(): PhaseLabels {
  return {
    phase_label_a: 'A',
    phase_label_b: 'B',
    phase_label_c: 'C',
  };
}
