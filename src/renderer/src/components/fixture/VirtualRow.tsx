import { memo } from 'react';
import { Fixture } from '../types';
import { EditableCell } from './EditableCell';
import { COLUMN_CONFIGS, ColumnVisibility, ColumnKey } from '../../types/columns';

interface VirtualRowProps {
  fixture: Fixture;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onCellEdit: (fixtureId: string, field: keyof Fixture, value: string) => void;
  columnVisibility: ColumnVisibility;
}

export const VirtualRow = memo(function VirtualRow({
  fixture,
  isSelected,
  onClick,
  onCellEdit,
  columnVisibility,
}: VirtualRowProps) {
  const rowClass = `flex items-center h-10 border-b border-gray-800 hover:bg-gray-800 ${
    isSelected ? 'bg-blue-900 hover:bg-blue-800' : ''
  }`;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    // Let the click propagate to the row for selection logic
    onClick(e);
  };

  const getCellValue = (key: ColumnKey): string => {
    const value = fixture[key];
    if (value === undefined || value === null) return '';
    return String(value);
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
          className="w-4 h-4 pointer-events-none"
        />
      </div>
      {COLUMN_CONFIGS.filter(col => columnVisibility[col.key]).map(col => (
        <EditableCell
          key={col.key}
          value={getCellValue(col.key)}
          onChange={(val) => onCellEdit(fixture.id, col.key, val)}
          className={`${col.width} flex-shrink-0`}
        />
      ))}
    </div>
  );
});
