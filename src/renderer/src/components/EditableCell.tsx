import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function EditableCell({ value, onChange, className }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className={clsx('px-2 text-sm', className)} onClick={(e) => e.stopPropagation()}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-gray-700 border border-blue-500 rounded px-1 py-0.5 text-white focus:outline-none"
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="cursor-text hover:bg-gray-700 rounded px-1 py-0.5 truncate"
        >
          {value || <span className="text-gray-500">—</span>}
        </div>
      )}
    </div>
  );
}
