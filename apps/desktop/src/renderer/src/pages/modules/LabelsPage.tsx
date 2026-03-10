/**
 * LabelsPage — Phase 5 of UI Redesign.
 *
 * Replaces the LabelDesigner.tsx intermediate list page. The visual designer
 * (LabelLayoutDesigner) is the single implementation; label type selection
 * happens via an inline "New Label" dialog rather than a separate page.
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import LabelLayoutDesigner from '../../components/shop-order/label/LabelLayoutDesigner';
import { AVERY_TEMPLATES } from '../../utils/shop-order/labelGridCalculator';

const TEMPLATES = Object.values(AVERY_TEMPLATES);

export function LabelsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string>(TEMPLATES[0]?.code ?? '5160');

  if (!projectId) return null;

  // ── Template picker ──────────────────────────────────────────────────────
  if (!selectedCode) {
    return (
      <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white items-center justify-center p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-full max-w-md p-6">
          <h2 className="text-lg font-semibold mb-1">New Label</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Choose a label template to get started.
          </p>

          <div className="space-y-2 mb-6">
            {TEMPLATES.map((t) => {
              const isSelected = pendingCode === t.code;
              return (
                <button
                  key={t.code}
                  onClick={() => setPendingCode(t.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {/* Selection dot */}
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-500'
                    }`}
                  />

                  {/* Label info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}
                    >
                      Avery {t.code} — {t.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t.widthInches}" × {t.heightInches}" &nbsp;·&nbsp; {t.labelsPerRow} ×{' '}
                      {t.labelsPerColumn} per sheet
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setSelectedCode(pendingCode)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Open Designer
          </button>
        </div>
      </div>
    );
  }

  // ── Designer ─────────────────────────────────────────────────────────────
  return (
    <LabelLayoutDesigner
      projectId={projectId}
      templateCode={selectedCode}
      onSave={() => {
        // Stay in designer after save — user can start a new label via "New Label" button
      }}
      onCancel={() => setSelectedCode(null)}
    />
  );
}
