/**
 * Conflict Resolution Dialog Component
 *
 * Displays when sync conflicts are detected, showing local vs remote values
 * and allowing the user to choose which version to keep.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Format a value for display in the conflict dialog
 * Truncates large objects to prevent UI issues
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(empty)';
  }
  if (typeof value === 'object') {
    const json = JSON.stringify(value, null, 2);
    return json.length > 500 ? json.substring(0, 500) + '...' : json;
  }
  return String(value);
}

/**
 * Format a timestamp for display
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleString();
}

export interface SyncConflict {
  id: string;
  tableName: string;
  recordId: string;
  fieldName: string;
  localValue: unknown;
  remoteValue: unknown;
  localTimestamp: Date;
  remoteTimestamp: Date;
}

interface ConflictResolutionDialogProps {
  conflicts: SyncConflict[];
  onResolve: (resolutions: Map<string, 'local' | 'remote'>) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function ConflictResolutionDialog({
  conflicts,
  onResolve,
  onClose,
  isOpen,
}: ConflictResolutionDialogProps): JSX.Element | null {
  const [resolutions, setResolutions] = useState<Map<string, 'local' | 'remote'>>(
    () => new Map()
  );
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(
    () => new Set()
  );
  const [applyToAll, setApplyToAll] = useState<'local' | 'remote' | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset state when conflicts change
  useEffect(() => {
    setResolutions(new Map());
    setExpandedConflicts(new Set());
    setApplyToAll(null);
  }, [conflicts]);

  const allResolved = conflicts.every((c) => resolutions.has(c.id));

  /**
   * Attempts to close the dialog, showing a confirmation if there are
   * partial resolutions that would be lost.
   * @returns true if the dialog was closed, false if the user cancelled
   */
  const attemptClose = useCallback((): boolean => {
    // Show confirmation if user has started resolving but hasn't finished
    // Check allResolved inline to avoid stale closure
    const isAllResolved = conflicts.every((c) => resolutions.has(c.id));
    if (resolutions.size > 0 && !isAllResolved) {
      const confirmed = window.confirm(
        'You have unresolved conflicts. Are you sure you want to close?'
      );
      if (!confirmed) return false;
    }
    onClose();
    return true;
  }, [resolutions, conflicts, onClose]);

  // Focus dialog and handle Escape key when open
  useEffect(() => {
    if (!isOpen) return;

    // Focus the dialog
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        attemptClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, attemptClose]);

  if (!isOpen || conflicts.length === 0) {
    return null;
  }

  const handleResolutionChange = (conflictId: string, choice: 'local' | 'remote') => {
    setResolutions((prev) => {
      const next = new Map(prev);
      next.set(conflictId, choice);
      return next;
    });
    setApplyToAll(null); // Clear "apply to all" when individual choice made
  };

  const handleApplyToAll = (choice: 'local' | 'remote') => {
    setApplyToAll(choice);
    setResolutions(() => {
      const next = new Map<string, 'local' | 'remote'>();
      conflicts.forEach((c) => next.set(c.id, choice));
      return next;
    });
  };

  const toggleExpanded = (conflictId: string) => {
    setExpandedConflicts((prev) => {
      const next = new Set(prev);
      if (next.has(conflictId)) {
        next.delete(conflictId);
      } else {
        next.add(conflictId);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (allResolved) {
      onResolve(resolutions);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={attemptClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
        tabIndex={-1}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col outline-none"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <div className="p-2 bg-yellow-100 rounded-full">
            <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
          </div>
          <div>
            <h2 id="conflict-dialog-title" className="text-lg font-semibold text-gray-900">
              Resolve Sync Conflicts
            </h2>
            <p className="text-sm text-gray-500">
              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} found.
              Choose which version to keep.
            </p>
          </div>
          <button
            onClick={attemptClose}
            className="ml-auto p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
          <span className="text-sm text-gray-600">Apply to all:</span>
          <button
            onClick={() => handleApplyToAll('local')}
            className={`px-3 py-1 text-sm rounded border transition ${
              applyToAll === 'local'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            Keep Local
          </button>
          <button
            onClick={() => handleApplyToAll('remote')}
            className={`px-3 py-1 text-sm rounded border transition ${
              applyToAll === 'remote'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            Keep Remote
          </button>
        </div>

        {/* Conflicts List */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="space-y-3">
            {conflicts.map((conflict) => {
              const isExpanded = expandedConflicts.has(conflict.id);
              const resolution = resolutions.get(conflict.id);

              return (
                <div
                  key={conflict.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Conflict Header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleExpanded(conflict.id)}
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">
                        {conflict.tableName}
                      </span>
                      <span className="text-gray-400 mx-2">/</span>
                      <span className="text-gray-600">{conflict.fieldName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {resolution && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            resolution === 'local'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {resolution === 'local' ? 'Local' : 'Remote'}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Conflict Details */}
                  {isExpanded && (
                    <div className="px-4 py-3 space-y-3">
                      {/* Values Comparison */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Local Value */}
                        <div
                          className={`p-3 rounded border-2 cursor-pointer transition ${
                            resolution === 'local'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => handleResolutionChange(conflict.id, 'local')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Local (Your Version)
                            </span>
                            {resolution === 'local' && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-24">
                            {formatValue(conflict.localValue)}
                          </pre>
                          <p className="text-xs text-gray-400 mt-1">
                            Modified: {formatTimestamp(conflict.localTimestamp)}
                          </p>
                        </div>

                        {/* Remote Value */}
                        <div
                          className={`p-3 rounded border-2 cursor-pointer transition ${
                            resolution === 'remote'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                          onClick={() => handleResolutionChange(conflict.id, 'remote')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Remote (Server Version)
                            </span>
                            {resolution === 'remote' && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-24">
                            {formatValue(conflict.remoteValue)}
                          </pre>
                          <p className="text-xs text-gray-400 mt-1">
                            Modified: {formatTimestamp(conflict.remoteTimestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {resolutions.size} of {conflicts.length} resolved
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={attemptClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allResolved}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Resolutions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
