import { ReactNode } from 'react';

export type InspectorContent = 'groups' | 'conditionalFormatting' | 'fixtureProperties';

interface InspectorPanelProps {
  /** Which content panel is active */
  content: InspectorContent;
  onClose: () => void;
  children: ReactNode;
}

/**
 * InspectorPanel — composable sidebar shell.
 *
 * Owns layout, show/hide, and styling tokens. Content is provided by children
 * so each tool (Smart Groups, Conditional Formatting, etc.) renders inside
 * the same shell without the shell knowing about their internals.
 *
 * All colors and sizing come from CSS custom properties so the visual layer
 * can be updated during the broader UI overhaul without touching this file.
 */
export function InspectorPanel({ onClose, children }: InspectorPanelProps) {
  return (
    <aside
      className="inspector-panel flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      style={{ width: 'var(--inspector-width, 280px)', minWidth: 220, maxWidth: 400 }}
      aria-label="Inspector"
    >
      {/* Close button */}
      <div className="flex items-center justify-end px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={onClose}
          aria-label="Close inspector"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}
