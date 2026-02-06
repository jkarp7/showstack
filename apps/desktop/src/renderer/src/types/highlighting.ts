/**
 * Conditional formatting rules for row highlighting
 */

import { Fixture } from './index';

export type HighlightConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty';

export interface HighlightRule {
  id: string;
  name: string;
  enabled: boolean;
  field: keyof Fixture;
  operator: HighlightConditionOperator;
  value: string;
  color: string; // Hex color for highlighting
  priority: number; // Higher priority rules override lower priority
}

export const DEFAULT_HIGHLIGHT_RULES: HighlightRule[] = [
  {
    id: 'spare-circuits',
    name: 'Spare Circuits',
    enabled: true,
    field: 'type',
    operator: 'equals',
    value: 'Spare Circuit',
    color: '#FEF3C7', // Light yellow
    priority: 1,
  },
  {
    id: 'practicals',
    name: 'Practicals',
    enabled: true,
    field: 'type',
    operator: 'contains',
    value: 'Practical',
    color: '#DBEAFE', // Light blue
    priority: 1,
  },
];

/**
 * Evaluate if a fixture matches a highlight rule
 */
export function evaluateHighlightRule(fixture: Fixture, rule: HighlightRule): boolean {
  if (!rule.enabled) return false;

  const fieldValue = String(fixture[rule.field] || '');
  const ruleValue = rule.value.toLowerCase();
  const fieldValueLower = fieldValue.toLowerCase();

  switch (rule.operator) {
    case 'equals':
      return fieldValueLower === ruleValue;
    case 'not_equals':
      return fieldValueLower !== ruleValue;
    case 'contains':
      return fieldValueLower.includes(ruleValue);
    case 'not_contains':
      return !fieldValueLower.includes(ruleValue);
    case 'starts_with':
      return fieldValueLower.startsWith(ruleValue);
    case 'ends_with':
      return fieldValueLower.endsWith(ruleValue);
    case 'is_empty':
      return fieldValue === '';
    case 'is_not_empty':
      return fieldValue !== '';
    default:
      return false;
  }
}

/**
 * Get the highlight color for a fixture based on all rules
 * Returns the color from the highest priority matching rule
 */
export function getHighlightColorForFixture(
  fixture: Fixture,
  rules: HighlightRule[],
): string | null {
  const matchingRules = rules
    .filter((rule) => evaluateHighlightRule(fixture, rule))
    .sort((a, b) => b.priority - a.priority); // Sort by priority descending

  return matchingRules.length > 0 ? matchingRules[0].color : null;
}

/**
 * Color flag definitions - appear on labels
 */
export const COLOR_FLAG_DEFINITIONS = {
  hot: {
    label: 'Hot Circuit',
    color: '#EF4444', // Red
    description: 'Circuit is always hot/live',
  },
  spare: {
    label: 'Spare',
    color: '#F59E0B', // Amber
    description: 'Spare circuit/fixture',
  },
  special: {
    label: 'Special',
    color: '#8B5CF6', // Purple
    description: 'Special handling required',
  },
  dimmer_doubles: {
    label: 'Dimmer Doubles',
    color: '#10B981', // Green
    description: 'Two circuits on one dimmer',
  },
  two_fer: {
    label: 'Two-Fer',
    color: '#3B82F6', // Blue
    description: 'Two fixtures on one circuit',
  },
} as const;

export type ColorFlagType = keyof typeof COLOR_FLAG_DEFINITIONS;
