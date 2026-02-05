/**
 * Report Organizer
 * Logic for grouping, sorting, and organizing report data
 */

import { ReportOrganization, PaperworkColumnConfig } from '../../types/paperworkTemplate';

export interface ReportDataItem {
  [key: string]: any;
}

export interface ReportGroup {
  groupValue: string;
  items: ReportDataItem[];
}

export interface OrganizedReportData {
  groups: ReportGroup[];
  hasGroups: boolean;
}

export function organizeReportData(
  data: ReportDataItem[],
  organization: ReportOrganization,
  columns: PaperworkColumnConfig[]
): OrganizedReportData {
  // Step 1: Sort
  const sorted = sortItems([...data], organization);

  // Step 2: Group
  if (organization.groupBy) {
    const groups = groupItems(sorted, organization.groupBy);
    return { groups, hasGroups: true };
  }

  // No grouping - return as single group
  return {
    groups: [{ groupValue: '', items: sorted }],
    hasGroups: false
  };
}

function sortItems(
  items: ReportDataItem[],
  organization: ReportOrganization
): ReportDataItem[] {
  const { sortBy, sortDirection = 'asc' } = organization;

  if (!sortBy) return items;

  return items.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    return compareValues(aVal, bVal, sortDirection);
  });
}

function compareValues(a: any, b: any, direction: 'asc' | 'desc'): number {
  // Handle nulls/undefined
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // Number comparison
  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a;
  }

  // String comparison with natural sort for numbers
  const aStr = String(a).trim();
  const bStr = String(b).trim();

  // Check if both strings are purely numeric (with optional leading zeros)
  const aIsNumeric = /^\d+$/.test(aStr);
  const bIsNumeric = /^\d+$/.test(bStr);

  if (aIsNumeric && bIsNumeric) {
    const aNum = parseInt(aStr, 10);
    const bNum = parseInt(bStr, 10);
    return direction === 'asc' ? aNum - bNum : bNum - aNum;
  }

  // Natural sort: extract numbers from strings with text
  const aMatch = aStr.match(/(\d+)/);
  const bMatch = bStr.match(/(\d+)/);

  if (aMatch && bMatch) {
    const aNum = parseInt(aMatch[1], 10);
    const bNum = parseInt(bMatch[1], 10);

    if (aNum !== bNum) {
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
  }

  // Fall back to string comparison
  const comparison = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
  return direction === 'asc' ? comparison : -comparison;
}

function groupItems(items: ReportDataItem[], groupBy: string): ReportGroup[] {
  const grouped = new Map<string, ReportDataItem[]>();

  for (const item of items) {
    const groupValue = String(item[groupBy] || 'Unknown');

    if (!grouped.has(groupValue)) {
      grouped.set(groupValue, []);
    }
    grouped.get(groupValue)!.push(item);
  }

  // Convert to array and sort by group value using natural sort
  return Array.from(grouped.entries())
    .map(([groupValue, items]) => ({ groupValue, items }))
    .sort((a, b) => {
      // Use the same natural sort logic as compareValues
      const aStr = a.groupValue.trim();
      const bStr = b.groupValue.trim();

      // Check if both are purely numeric
      const aIsNumeric = /^\d+$/.test(aStr);
      const bIsNumeric = /^\d+$/.test(bStr);

      if (aIsNumeric && bIsNumeric) {
        return parseInt(aStr, 10) - parseInt(bStr, 10);
      }

      // Natural sort with embedded numbers
      return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
    });
}

export function calculateGroupSummary(group: ReportGroup): {
  total: number;
  totalPower?: number;
} {
  return {
    total: group.items.length,
    totalPower: group.items.reduce((sum, item) => {
      return sum + (Number(item.wattage) || 0);
    }, 0)
  };
}
