import { ReactNode } from 'react';

export type InspectorContent = 'groups' | 'conditionalFormatting' | 'fixtureProperties';

const TABS: { id: InspectorContent; label: string }[] = [
  { id: 'groups', label: 'Groups' },
  { id: 'conditionalFormatting', label: 'Formatting' },
];

interface InspectorPanelProps {
  content: InspectorContent;
  onContentChange: (content: InspectorContent) => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * InspectorPanel — composable sidebar shell.
 *
 * Owns layout, tab switching, show/hide, and styling tokens. Content is provided
 * by children so each tool (Smart Groups, Conditional Formatting, etc.) renders
 * inside the same shell without the shell knowing about their internals.
 *
 * All colors and sizing come from CSS custom properties so the visual layer
 * can be updated during the broader UI overhaul without touching this file.
 */
export function InspectorPanel({
  content,
  onContentChange,
  onClose,
  children,
}: InspectorPanelProps) {
  return (
    <aside
      className="inspector-panel flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      style={{ width: 'var(--inspector-width, 280px)', minWidth: 220, maxWidth: 400 }}
      aria-label="Inspector"
    >
      {/* Tab bar + close button */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex flex-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onContentChange(tab.id)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                content === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-pressed={content === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          aria-label="Close inspector"
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M1 1l10 10M11 1L1 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
    </aside>
  );
}
