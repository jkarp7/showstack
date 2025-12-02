import { memo } from 'react';
import { Fixture } from '../types';
import { EditableCell } from './EditableCell';
import { COLUMN_CONFIGS, ColumnVisibility, ColumnKey, getOrderedColumns } from '../../types/columns';

interface VirtualRowProps {
  fixture: Fixture;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onCellEdit: (fixtureId: string, field: keyof Fixture, value: string) => void;
  columnVisibility: ColumnVisibility;
  columnOrder: ColumnKey[];
  columnWidths: Partial<Record<ColumnKey, number>>;
  getColumnWidth: (col: any) => number;
}

export const VirtualRow = memo(function VirtualRow({
  fixture,
  isSelected,
  onClick,
  onCellEdit,
  columnVisibility,
  columnOrder,
  columnWidths,
  getColumnWidth,
}: VirtualRowProps) {
  // Get ordered column configs
  const orderedColumns = getOrderedColumns(columnOrder);
  const rowClass = `flex items-center h-10 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 ${
    isSelected ? 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800' : ''
  }`;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    // Let the click propagate to the row for selection logic
    onClick(e);
  };

  const getCellValue = (key: ColumnKey): string => {
    // Handle user columns stored in custom_fields
    if (key.startsWith('user')) {
      const userValue = fixture.custom_fields?.[key];
      if (userValue === undefined || userValue === null) return '';
      return String(userValue);
    }

    const value = fixture[key];
    if (value === undefined || value === null) return '';

    // Handle arrays (like accessories)
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    // Handle booleans (like on_light_plot)
    if (typeof value === 'boolean') {
      return value ? '✓' : '';
    }

    // Handle timestamps (like changed_at, created_at)
    if ((key === 'changed_at' || key === 'created_at' || key === 'updated_at') && typeof value === 'number') {
      return new Date(value).toLocaleString();
    }

    return String(value);
  };

  const isFieldReadOnly = (key: ColumnKey): boolean => {
    // Computed fields are read-only
    const config = COLUMN_CONFIGS.find(c => c.key === key);
    return config?.isComputed || false;
  };

  return (
    <div className={rowClass}>
      <div
        className="w-12 flex items-center justify-center flex-shrink-0 cursor-pointer"
        onClick={handleCheckboxClick}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}} // Handled by click
          className="w-4 h-4 pointer-events-none accent-blue-600"
        />
      </div>
      {orderedColumns.filter(col => columnVisibility[col.key]).map(col => {
        const colWidth = getColumnWidth(col);
        return (
          <EditableCell
            key={col.key}
            value={getCellValue(col.key)}
            onChange={(val) => onCellEdit(fixture.id, col.key, val)}
            className="flex-shrink-0"
            style={{ width: `${colWidth}px` }}
            readOnly={isFieldReadOnly(col.key)}
          />
        );
      })}
    </div>
  );
});
