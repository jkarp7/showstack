import { useState } from 'react';
import type { PrepRevision, PrepProject, ItemChange } from '../../types/prep';

interface RevisionPanelProps {
  project: PrepProject;
  revisions: PrepRevision[];
  onGenerateRevision: (notes?: string) => Promise<void>;
  onCompareRevisions: (rev1: number, rev2: number) => void;
}

export function RevisionPanel({
  project,
  revisions,
  onGenerateRevision,
  onCompareRevisions
}: RevisionPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);

  const handleGenerateRevision = async () => {
    if (project.current_revision >= 5) {
      alert('Maximum of 5 revisions reached');
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerateRevision(revisionNotes || undefined);
      setRevisionNotes('');
      setShowNotes(false);
    } catch (error) {
      console.error('Failed to generate revision:', error);
      alert('Failed to generate revision');
    } finally {
      setIsGenerating(false);
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
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Revisions</h2>
          <p className="text-sm text-gray-400 mt-1">
            Current: Rev {project.current_revision} | {5 - project.current_revision} remaining
          </p>
        </div>
        <button
          onClick={() => setShowNotes(!showNotes)}
          disabled={isGenerating || project.current_revision >= 5}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition"
        >
          {isGenerating ? 'Generating...' : 'Generate Revision'}
        </button>
      </div>

      {/* Notes input */}
      {showNotes && (
        <div className="mb-4 p-4 bg-gray-700 border border-gray-600 rounded">
          <label className="block text-sm font-medium mb-2">
            Revision Notes (optional)
          </label>
          <textarea
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            placeholder="Describe the changes in this revision..."
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            rows={3}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleGenerateRevision}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded text-sm transition"
            >
              Create Revision
            </button>
            <button
              onClick={() => {
                setShowNotes(false);
                setRevisionNotes('');
              }}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Revisions list */}
      <div className="space-y-3">
        {sortedRevisions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
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
                className="border border-gray-600 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedRevision(isExpanded ? null : revision.id)}
                  className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-650 text-left transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">
                      Revision {revision.revision_number}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(revision.revision_date).toLocaleString()} •{' '}
                      {changeLog.length} change{changeLog.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-gray-750">
                    {revision.notes && (
                      <div className="mb-3 p-3 bg-gray-700 rounded text-sm">
                        <div className="text-gray-400 text-xs mb-1">Notes:</div>
                        {revision.notes}
                      </div>
                    )}

                    <div className="space-y-2">
                      {changeLog.length === 0 ? (
                        <p className="text-sm text-gray-500">No changes detected</p>
                      ) : (
                        changeLog.map((change: ItemChange, idx: number) => (
                          <div
                            key={idx}
                            className="text-sm p-2 bg-gray-700 rounded flex items-start gap-2"
                          >
                            <span className={`font-bold ${getChangeTypeColor(change.change_type)} mt-0.5`}>
                              {getChangeTypeSymbol(change.change_type)}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium">{change.description}</div>
                              {change.section_name && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Section: {change.section_name}
                                </div>
                              )}
                              {change.change_type === 'modification' && change.old_values && (
                                <div className="text-xs text-gray-400 mt-1">
                                  <div>Changes:</div>
                                  <ul className="ml-4 mt-1 space-y-0.5">
                                    {Object.entries(change.old_values).map(([key, oldVal]) => {
                                      const newVal = (change.new_values as any)?.[key];
                                      if (oldVal === newVal) return null;
                                      return (
                                        <li key={key}>
                                          {key}: <span className="text-red-400">{String(oldVal)}</span>{' '}
                                          → <span className="text-green-400">{String(newVal)}</span>
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
