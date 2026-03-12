import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COLOR_FLAG_DEFINITIONS, ColorFlagType } from '../../types/highlighting';
import type { FixtureGroup } from '../../types/group';

interface RowContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onSetFlag: (flag: ColorFlagType | null) => void;
  onHide: () => void;
  currentFlag?: ColorFlagType | null;
  isHidden?: boolean;
  groups?: FixtureGroup[];
  fixturePinnedGroupIds?: Set<string>;
  onPinToGroup?: (groupId: string) => void;
  onUnpinFromGroup?: (groupId: string) => void;
}

export function RowContextMenu({
  x,
  y,
  onClose,
  onSetFlag,
  onHide,
  currentFlag,
  isHidden,
  groups,
  fixturePinnedGroupIds,
  onPinToGroup,
  onUnpinFromGroup,
}: RowContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Start invisible — position is corrected after the first render once we
  // know the actual rendered dimensions.
  const [position, setPosition] = useState({ x, y, visible: false });

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;

    const { offsetWidth: w, offsetHeight: h } = el;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;

    let ax = x;
    let ay = y;

    if (ax + w + margin > vw) ax = vw - w - margin;
    if (ay + h + margin > vh) ay = vh - h - margin;
    if (ax < margin) ax = margin;
    if (ay < margin) ay = margin;

    setPosition({ x: ax, y: ay, visible: true });
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
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg py-1 min-w-[200px] overflow-y-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        visibility: position.visible ? 'visible' : 'hidden',
        maxHeight: `calc(100vh - 16px)`,
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

      {/* Pin to Group */}
      {groups && groups.length > 0 && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Pin to Group
          </div>
          {groups.map((group) => {
            const isPinned = fixturePinnedGroupIds?.has(group.id) ?? false;
            return (
              <button
                key={group.id}
                onClick={() => {
                  if (isPinned) {
                    onUnpinFromGroup?.(group.id);
                  } else {
                    onPinToGroup?.(group.id);
                  }
                  onClose();
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: group.color ?? '#9CA3AF',
                    flexShrink: 0,
                  }}
                />
                <span className="text-sm flex-1">{group.name}</span>
                {isPinned && (
                  <span className="text-xs text-blue-500 dark:text-blue-400">pinned</span>
                )}
              </button>
            );
          })}
        </>
      )}
    </div>
  );

  return createPortal(menuContent, document.body);
}
