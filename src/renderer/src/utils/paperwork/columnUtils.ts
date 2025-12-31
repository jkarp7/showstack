/**
 * Column Utilities
 * Helper functions for working with column configurations
 */

import { PaperworkColumnConfig } from '../../types/paperworkTemplate';

/**
 * Get the display label for a column based on its displayMode
 */
export function getColumnDisplayLabel(column: PaperworkColumnConfig): string {
  const mode = column.displayMode || 'full';

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
