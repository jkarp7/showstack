import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right' | 'enter') => void;
  shouldFocus?: boolean;
  suggestions?: string[];
}

export function EditableCell({
  value,
  onChange,
  className,
  style,
  readOnly = false,
  onNavigate,
  shouldFocus = false,
  suggestions = []
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle external focus trigger
  useEffect(() => {
    if (shouldFocus && !readOnly) {
      setIsEditing(true);
    }
  }, [shouldFocus, readOnly]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const commitAndNavigate = (direction: 'up' | 'down' | 'left' | 'right' | 'enter') => {
    if (editValue !== value) {
      onChange(editValue);
    }
    setIsEditing(false);
    if (onNavigate) {
      onNavigate(direction);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitAndNavigate('enter');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitAndNavigate(e.shiftKey ? 'left' : 'right');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commitAndNavigate('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commitAndNavigate('down');
    } else if (e.key === 'ArrowLeft' && inputRef.current && inputRef.current.selectionStart === 0) {
      // Only navigate if cursor is at the beginning
      e.preventDefault();
      commitAndNavigate('left');
    } else if (e.key === 'ArrowRight' && inputRef.current && inputRef.current.selectionStart === inputRef.current.value.length) {
      // Only navigate if cursor is at the end
      e.preventDefault();
      commitAndNavigate('right');
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  // Generate a unique ID for the datalist
  const datalistId = `datalist-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx('px-2 text-sm', className)} style={style} onClick={(e) => e.stopPropagation()}>
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-white dark:bg-gray-700 border border-blue-500 rounded px-1 py-0.5 text-gray-900 dark:text-white focus:outline-none"
            list={suggestions.length > 0 ? datalistId : undefined}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <datalist id={datalistId}>
              {suggestions.map((suggestion, index) => (
                <option key={index} value={suggestion} />
              ))}
            </datalist>
          )}
        </>
      ) : (
        <div
          onClick={() => !readOnly && setIsEditing(true)}
          className={clsx(
            'rounded px-1 py-0.5 truncate',
            readOnly
              ? 'cursor-default text-gray-500 dark:text-gray-400 italic'
              : 'cursor-text hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          {value || <span className="text-gray-400 dark:text-gray-500">—</span>}
        </div>
      )}
    </div>
  );
}
