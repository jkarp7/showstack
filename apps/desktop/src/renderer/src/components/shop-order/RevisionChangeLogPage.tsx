import React, { useState, useMemo } from 'react';
import { useShopOrderStore } from '../../store/shopOrderStore';
import type { ShopOrderItem } from '../../types/shopOrder';
import { detectRevisionChanges, parseSpareSnapshot } from '../../utils/revisionUtils';

interface RevisionChangeLogPageProps {
  projectId: string;
}

type ChangeFilter = 'all' | 'addition' | 'modification' | 'deletion';

/**
 * RevisionChangeLogPage - Shows detailed change log for revisions
 *
 * Displays additions, deletions, and modifications between revisions
 * Shows old → new quantity comparisons
 * Can be filtered by change type
 */
export function RevisionChangeLogPage({ projectId }: RevisionChangeLogPageProps) {
  const { currentProject, sections, items, revisions } = useShopOrderStore();
  const [selectedRevision, setSelectedRevision] = useState<number | null>(null);
  const [filter, setFilter] = useState<ChangeFilter>('all');

  if (!currentProject) {
    return <div className="p-8 text-center text-gray-500">No project loaded</div>;
  }

  const currentRevision = currentProject.current_revision;
  const availableRevisions = Array.from({ length: currentRevision + 1 }, (_, i) => i).slice(1); // Skip Rev 0

  // Get the selected revision (default to current)
  const activeRevision = selectedRevision !== null ? selectedRevision : currentRevision;

  // Get the revision record to access spare_snapshot
  const revisionRecord = revisions.find((r) => r.revision_number === activeRevision);
  const spareSnapshot = revisionRecord
    ? parseSpareSnapshot(revisionRecord.spare_snapshot)
    : undefined;

  // Detect changes for the selected revision
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO: move early return below hooks
  const changes = useMemo(() => {
    if (activeRevision === 0) return [];
    const allChanges = detectRevisionChanges(
      items,
      activeRevision - 1,
      activeRevision,
      spareSnapshot,
    );

    // Apply filter
    if (filter === 'all') return allChanges;
    return allChanges.filter((change) => change.change_type === filter);
  }, [items, activeRevision, spareSnapshot, filter]);

  // Group changes by section
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TODO: move early return below hooks
  const changesBySection = useMemo(() => {
    const grouped = new Map<string, typeof changes>();
    changes.forEach((change) => {
      const item = items.find((i) => i.id === change.item_id);
      if (item) {
        const sectionId = item.section_id;
        if (!grouped.has(sectionId)) {
          grouped.set(sectionId, []);
        }
        grouped.get(sectionId)!.push(change);
      }
    });
    return grouped;
  }, [changes, items]);

  // Get section name
  const getSectionName = (sectionId: string): string => {
    const section = sections.find((s) => s.id === sectionId);
    return section?.name || 'Unknown Section';
  };

  // Get item description
  const getItemDescription = (itemId: string): string => {
    const item = items.find((i) => i.id === itemId);
    return item?.description || 'Unknown Item';
  };

  const handlePrint = async () => {
    try {
      await window.api.prep.print.revisionChangeLog(projectId, activeRevision);
    } catch (error) {
      console.error('Error printing revision change log:', error);
    }
  };

  // Calculate summary stats
  const stats = {
    additions: changes.filter((c) => c.change_type === 'addition').length,
    modifications: changes.filter((c) => c.change_type === 'modification').length,
    deletions: changes.filter((c) => c.change_type === 'deletion').length,
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Revision Change Log
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {currentProject.production_name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Revision Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Revision:</label>
            <select
              value={activeRevision}
              onChange={(e) => setSelectedRevision(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {availableRevisions.map((rev) => (
                <option key={rev} value={rev}>
                  Rev {rev}
                </option>
              ))}
            </select>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ChangeFilter)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Changes</option>
              <option value="addition">Additions</option>
              <option value="modification">Modifications</option>
              <option value="deletion">Deletions</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Print Report
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {activeRevision === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Rev 0 has no changes (it's the initial version)
            </div>
          ) : changes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No changes found for Rev {activeRevision}
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Rev {activeRevision} Summary (vs Rev {activeRevision - 1})
                </h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Changes:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {changes.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-600 dark:text-green-400">Additions:</span>
                    <span className="ml-2 font-semibold text-green-700 dark:text-green-300">
                      {stats.additions}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">Modifications:</span>
                    <span className="ml-2 font-semibold text-blue-700 dark:text-blue-300">
                      {stats.modifications}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-600 dark:text-red-400">Deletions:</span>
                    <span className="ml-2 font-semibold text-red-700 dark:text-red-300">
                      {stats.deletions}
                    </span>
                  </div>
                </div>
              </div>

              {/* Changes by Section */}
              {Array.from(changesBySection.entries()).map(([sectionId, sectionChanges]) => (
                <div key={sectionId} className="mb-8">
                  {/* Section Header */}
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg border-b-2 border-gray-300 dark:border-gray-600">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white uppercase">
                      {getSectionName(sectionId)} ({sectionChanges.length} changes)
                    </h3>
                  </div>

                  {/* Changes Table */}
                  <div className="overflow-hidden rounded-b-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Old Qty
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            →
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            New Qty
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Spare Change
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {sectionChanges.map((change) => {
                          const oldActive = change.old_values?.active_qty ?? 0;
                          const newActive = change.new_values?.active_qty ?? 0;
                          const oldSpare = change.old_values?.spare_qty ?? 0;
                          const newSpare = change.new_values?.spare_qty ?? 0;
                          const spareDiff = newSpare - oldSpare;

                          let typeColor = 'text-gray-600 dark:text-gray-400';
                          let typeBg = 'bg-gray-100 dark:bg-gray-800';
                          if (change.change_type === 'addition') {
                            typeColor = 'text-green-700 dark:text-green-300';
                            typeBg = 'bg-green-100 dark:bg-green-900/30';
                          } else if (change.change_type === 'deletion') {
                            typeColor = 'text-red-700 dark:text-red-300';
                            typeBg = 'bg-red-100 dark:bg-red-900/30';
                          } else if (change.change_type === 'modification') {
                            typeColor = 'text-blue-700 dark:text-blue-300';
                            typeBg = 'bg-blue-100 dark:bg-blue-900/30';
                          }

                          return (
                            <tr
                              key={change.item_id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                              <td
                                className={`px-4 py-3 text-xs font-medium uppercase ${typeBg} ${typeColor}`}
                              >
                                {change.change_type === 'addition' && '+ Add'}
                                {change.change_type === 'deletion' && '− Del'}
                                {change.change_type === 'modification' && '~ Mod'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {getItemDescription(change.item_id)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                {change.change_type === 'addition' ? '—' : oldActive}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-400">
                                {change.change_type !== 'addition' &&
                                  change.change_type !== 'deletion' &&
                                  '→'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
                                {change.change_type === 'deletion' ? '—' : newActive}
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                {spareDiff === 0 ? (
                                  <span className="text-gray-400">—</span>
                                ) : (
                                  <span
                                    className={
                                      spareDiff > 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }
                                  >
                                    {spareDiff > 0 ? '+' : ''}
                                    {spareDiff}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
