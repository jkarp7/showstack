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
  const aStr = String(a);
  const bStr = String(b);

  // Natural sort: extract numbers and compare
  const aMatch = aStr.match(/(\d+)/);
  const bMatch = bStr.match(/(\d+)/);

  if (aMatch && bMatch) {
    const aNum = parseInt(aMatch[1]);
    const bNum = parseInt(bMatch[1]);

    if (aNum !== bNum) {
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
  }

  // Fall back to string comparison
  const comparison = aStr.localeCompare(bStr);
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

  // Convert to array and sort by group value
  return Array.from(grouped.entries())
    .map(([groupValue, items]) => ({ groupValue, items }))
    .sort((a, b) => a.groupValue.localeCompare(b.groupValue));
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
