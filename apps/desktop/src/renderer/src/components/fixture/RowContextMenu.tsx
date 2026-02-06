import { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { COLOR_FLAG_DEFINITIONS, ColorFlagType } from '../../types/highlighting';

interface RowContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onSetFlag: (flag: ColorFlagType | null) => void;
  onHide: () => void;
  currentFlag?: ColorFlagType | null;
  isHidden?: boolean;
}

export function RowContextMenu({
  x,
  y,
  onClose,
  onSetFlag,
  onHide,
  currentFlag,
  isHidden,
}: RowContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position to prevent menu from going off-screen
  const adjustedPosition = useMemo(() => {
    const menuWidth = 200;
    const menuHeight = 300; // Approximate

    let adjustedX = x;
    let adjustedY = y;

    // Prevent overflow right
    if (x + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - 10;
    }

    // Prevent overflow bottom
    if (y + menuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - 10;
    }

    // Prevent overflow left
    if (adjustedX < 0) {
      adjustedX = 10;
    }

    // Prevent overflow top
    if (adjustedY < 0) {
      adjustedY = 10;
    }

    return { x: adjustedX, y: adjustedY };
  }, [x, y]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg py-1 min-w-[200px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {/* Set Flag submenu */}
      <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
        Set Flag
      </div>

      {Object.entries(COLOR_FLAG_DEFINITIONS).map(([key, def]) => (
        <button
          key={key}
          onClick={() => {
            onSetFlag(key as ColorFlagType);
            onClose();
          }}
          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <div className="w-3 h-3 rounded" style={{ backgroundColor: def.color }} />
          <span className="text-sm">
            {def.label}
            {currentFlag === key && ' ✓'}
          </span>
        </button>
      ))}

      <button
        onClick={() => {
          onSetFlag(null);
          onClose();
        }}
        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
      >
        Clear Flag {!currentFlag && '✓'}
      </button>

      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

      {/* Hide/Unhide */}
      <button
        onClick={() => {
          onHide();
          onClose();
        }}
        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
      >
        {isHidden ? 'Unhide' : 'Hide'}
      </button>
    </div>
  );

  return createPortal(menuContent, document.body);
}
