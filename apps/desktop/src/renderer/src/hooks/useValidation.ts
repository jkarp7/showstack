import { useMemo } from 'react';
import { useFixtureStore } from '../store/fixtureStore';
import { useInfrastructureStore } from '../store/infrastructureStore';
import { runValidation } from '../utils/validation';
import { ValidationIssue, ValidationSidebarItem } from '../types/validation';

export interface ValidationSummary {
  issues: ValidationIssue[];
  badgeCounts: Record<ValidationSidebarItem, { errors: number; warnings: number }>;
  /** Per-fixture worst severity for inline grid highlighting. */
  fixtureIssueMap: Map<string, 'error' | 'warning'>;
}

const EMPTY: ValidationSummary = {
  issues: [],
  badgeCounts: {
    fixtures: { errors: 0, warnings: 0 },
    infrastructure: { errors: 0, warnings: 0 },
    racks: { errors: 0, warnings: 0 },
  },
  fixtureIssueMap: new Map(),
};

export function useValidation(): ValidationSummary {
  const fixtures = useFixtureStore((state) => state.fixtures);
  const equipment = useInfrastructureStore((state) => state.equipment);

  return useMemo(() => {
    if (!fixtures.length && !equipment.length) return EMPTY;

    const issues = runValidation(fixtures, equipment);
    if (!issues.length) return EMPTY;

    const badgeCounts: ValidationSummary['badgeCounts'] = {
      fixtures: { errors: 0, warnings: 0 },
      infrastructure: { errors: 0, warnings: 0 },
      racks: { errors: 0, warnings: 0 },
    };

    const fixtureIssueMap = new Map<string, 'error' | 'warning'>();

    for (const issue of issues) {
      if (issue.severity === 'error') badgeCounts[issue.sidebarItem].errors++;
      else badgeCounts[issue.sidebarItem].warnings++;

      if (issue.sidebarItem === 'fixtures') {
        for (const id of issue.entityIds) {
          // errors win over warnings
          if (issue.severity === 'error' || !fixtureIssueMap.has(id)) {
            fixtureIssueMap.set(id, issue.severity);
          }
        }
      }
    }

    return { issues, badgeCounts, fixtureIssueMap };
  }, [fixtures, equipment]);
}
