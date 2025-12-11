import { useState } from 'react';
import type { PrepRevision, PrepProject, ItemChange } from '../../types/prep';

interface RevisionPanelProps {
  project: PrepProject;
  revisions: PrepRevision[];
  onGenerateRevision: (notes?: string) => Promise<void>;
  onDeleteRevision: (revisionId: string) => Promise<void>;
  onCompareRevisions: (rev1: number, rev2: number) => void;
}

export function RevisionPanel({
  project,
  revisions,
  onGenerateRevision,
  onDeleteRevision,
  onCompareRevisions
}: RevisionPanelProps) {
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteRevision = async (revisionId: string, revisionNumber: number) => {
    if (revisionNumber !== project.current_revision) {
      alert('Can only delete the most recent revision');
      return;
    }

    if (!confirm(`Delete Revision ${revisionNumber}? This cannot be undone.`)) {
      return;
    }

    setDeletingId(revisionId);
    try {
      await onDeleteRevision(revisionId);
    } catch (error) {
      console.error('Failed to delete revision:', error);
      alert('Failed to delete revision');
    } finally {
      setDeletingId(null);
    }
  };

  const getChangeTypeColor = (type: 'addition' | 'deletion' | 'modification'): string => {
    switch (type) {
      case 'addition':
        return 'text-green-400';
      case 'deletion':
        return 'text-red-400';
      case 'modification':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getChangeTypeSymbol = (type: 'addition' | 'deletion' | 'modification'): string => {
    switch (type) {
      case 'addition':
        return '+';
      case 'deletion':
        return '−';
      case 'modification':
        return '~';
      default:
        return '•';
    }
  };

  const sortedRevisions = [...revisions].sort((a, b) => b.revision_number - a.revision_number);

  return (
    <div>
      {/* Revisions list */}
      <div className="space-y-3">
        {sortedRevisions.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-500">
            <p>No revisions yet</p>
            <p className="text-sm mt-1">Generate your first revision to track changes</p>
          </div>
        ) : (
          sortedRevisions.map((revision) => {
            const changeLog = typeof revision.change_log === 'string'
              ? JSON.parse(revision.change_log)
              : revision.change_log;
            const isExpanded = expandedRevision === revision.id;

            return (
              <div
                key={revision.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
              >
                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedRevision(isExpanded ? null : revision.id)}
                    className="flex-1 text-left hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-2 py-1 -ml-2 transition text-gray-900 dark:text-white"
                  >
                    <div>
                      <div className="font-medium">
                        Revision {revision.revision_number}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(revision.revision_date).toLocaleString()} •{' '}
                        {changeLog.length} change{changeLog.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    {revision.revision_number === project.current_revision && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRevision(revision.id, revision.revision_number);
                        }}
                        disabled={deletingId === revision.id}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-600/20 hover:bg-red-200 dark:hover:bg-red-600/30 rounded text-xs text-red-600 dark:text-red-400 transition disabled:opacity-50"
                        title="Delete this revision"
                      >
                        {deletingId === revision.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                    <span className="text-gray-600 dark:text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-750">
                    {revision.notes && (
                      <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white">
                        <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Notes:</div>
                        {revision.notes}
                      </div>
                    )}

                    <div className="space-y-2">
                      {changeLog.length === 0 ? (
                        <p className="text-sm text-gray-600 dark:text-gray-500">No changes detected</p>
                      ) : (
                        changeLog.map((change: ItemChange, idx: number) => (
                          <div
                            key={idx}
                            className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded flex items-start gap-2 text-gray-900 dark:text-white"
                          >
                            <span className={`font-bold ${getChangeTypeColor(change.change_type)} mt-0.5`}>
                              {getChangeTypeSymbol(change.change_type)}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium">{change.description}</div>
                              {change.section_name && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Section: {change.section_name}
                                </div>
                              )}
                              {change.change_type === 'modification' && change.old_values && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  <div>Changes:</div>
                                  <ul className="ml-4 mt-1 space-y-0.5">
                                    {Object.entries(change.old_values).map(([key, oldVal]) => {
                                      const newVal = (change.new_values as any)?.[key];
                                      if (oldVal === newVal) return null;
                                      return (
                                        <li key={key}>
                                          {key}: <span className="text-red-600 dark:text-red-400">{String(oldVal)}</span>{' '}
                                          → <span className="text-green-600 dark:text-green-400">{String(newVal)}</span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
