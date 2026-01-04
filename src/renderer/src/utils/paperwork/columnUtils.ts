/**
 * Column Utilities
 * Helper functions for working with column configurations
 */

import { PaperworkColumnConfig } from '../../types/paperworkTemplate';

/**
 * Get the display label for a column based on its displayMode
 */
export function getColumnDisplayLabel(column: PaperworkColumnConfig, allColumns?: PaperworkColumnConfig[]): string {
  const mode = column.displayMode || 'full';

  // If this column is merged with others, show combined label
  if (column.combinedWith && column.combinedWith.length > 0 && allColumns) {
    const labels: string[] = [getBasicLabel(column, mode)];

    // Add labels of merged columns
    column.combinedWith.forEach(columnId => {
      const mergedCol = allColumns.find(c => c.id === columnId);
      if (mergedCol) {
        labels.push(getBasicLabel(mergedCol, mode));
      }
    });

    return labels.join(' + ');
  }

  // Otherwise, return the basic label
  const label = getBasicLabel(column, mode);
  // Uncomment for debugging:
  // if (column.id === 'col-channel') console.log('🏷️ Label for channel:', { mode, label, shortLabel: column.shortLabel });
  return label;
}

/**
 * Get the basic label for a column without merge logic
 */
function getBasicLabel(column: PaperworkColumnConfig, mode: 'full' | 'short' | 'custom'): string {
  switch (mode) {
    case 'short':
      return column.shortLabel || column.label;
    case 'custom':
      return column.customLabel || column.label;
    case 'full':
    default:
      return column.label;
  }
}
