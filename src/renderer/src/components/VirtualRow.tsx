import { memo } from 'react';
import { Fixture } from '../types';
import { EditableCell } from './EditableCell';

interface VirtualRowProps {
  fixture: Fixture;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onCellEdit: (fixtureId: string, field: keyof Fixture, value: string) => void;
}

export const VirtualRow = memo(function VirtualRow({
  fixture,
  isSelected,
  onClick,
  onCellEdit,
}: VirtualRowProps) {
  const rowClass = `flex items-center h-10 border-b border-gray-800 hover:bg-gray-800 ${
    isSelected ? 'bg-blue-900 hover:bg-blue-800' : ''
  }`;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    // Let the click propagate to the row for selection logic
    onClick(e);
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
      <EditableCell
        value={fixture.position || ''}
        onChange={(val) => onCellEdit(fixture.id, 'position', val)}
        className="w-32 flex-shrink-0"
      />
      <EditableCell
        value={fixture.unit?.toString() || ''}
        onChange={(val) => onCellEdit(fixture.id, 'unit', val)}
        className="w-20 flex-shrink-0"
      />
      <EditableCell
        value={fixture.type || ''}
        onChange={(val) => onCellEdit(fixture.id, 'type', val)}
        className="w-64 flex-shrink-0"
      />
      <EditableCell
        value={fixture.purpose || ''}
        onChange={(val) => onCellEdit(fixture.id, 'purpose', val)}
        className="w-48 flex-shrink-0"
      />
      <EditableCell
        value={fixture.channel || ''}
        onChange={(val) => onCellEdit(fixture.id, 'channel', val)}
        className="w-20 flex-shrink-0"
      />
      <EditableCell
        value={fixture.dimmer || ''}
        onChange={(val) => onCellEdit(fixture.id, 'dimmer', val)}
        className="w-20 flex-shrink-0"
      />
      <EditableCell
        value={fixture.circuit || ''}
        onChange={(val) => onCellEdit(fixture.id, 'circuit', val)}
        className="w-20 flex-shrink-0"
      />
      <EditableCell
        value={fixture.color || ''}
        onChange={(val) => onCellEdit(fixture.id, 'color', val)}
        className="w-24 flex-shrink-0"
      />
      <EditableCell
        value={fixture.location || ''}
        onChange={(val) => onCellEdit(fixture.id, 'location', val)}
        className="w-32 flex-shrink-0"
      />
      <EditableCell
        value={fixture.notes || ''}
        onChange={(val) => onCellEdit(fixture.id, 'notes', val)}
        className="flex-1 min-w-48"
      />
    </div>
  );
});
