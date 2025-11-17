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

  return (
    <div className={rowClass} onClick={onClick}>
      <div className="w-12 flex items-center justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}} // Handled by row click
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4"
        />
      </div>
      <EditableCell
        value={fixture.position || ''}
        onChange={(val) => onCellEdit(fixture.id, 'position', val)}
        className="w-16"
      />
      <EditableCell
        value={fixture.unit?.toString() || ''}
        onChange={(val) => onCellEdit(fixture.id, 'unit', val)}
        className="w-16"
      />
      <EditableCell
        value={fixture.type || ''}
        onChange={(val) => onCellEdit(fixture.id, 'type', val)}
        className="w-64"
      />
      <EditableCell
        value={fixture.purpose || ''}
        onChange={(val) => onCellEdit(fixture.id, 'purpose', val)}
        className="w-48"
      />
      <EditableCell
        value={fixture.channel || ''}
        onChange={(val) => onCellEdit(fixture.id, 'channel', val)}
        className="w-20"
      />
      <EditableCell
        value={fixture.dimmer || ''}
        onChange={(val) => onCellEdit(fixture.id, 'dimmer', val)}
        className="w-20"
      />
      <EditableCell
        value={fixture.circuit || ''}
        onChange={(val) => onCellEdit(fixture.id, 'circuit', val)}
        className="w-20"
      />
      <EditableCell
        value={fixture.color || ''}
        onChange={(val) => onCellEdit(fixture.id, 'color', val)}
        className="w-24"
      />
      <EditableCell
        value={fixture.location || ''}
        onChange={(val) => onCellEdit(fixture.id, 'location', val)}
        className="w-24"
      />
      <EditableCell
        value={fixture.notes || ''}
        onChange={(val) => onCellEdit(fixture.id, 'notes', val)}
        className="flex-1"
      />
    </div>
  );
});
