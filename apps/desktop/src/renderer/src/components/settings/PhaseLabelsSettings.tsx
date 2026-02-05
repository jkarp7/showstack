import { useState } from 'react';
import { Zap, RotateCcw, Save } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { getDefaultPhaseLabels, hasCustomPhaseLabels } from '../../utils/phaseLabels';

export function PhaseLabelsSettings() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateProject = useProjectStore((state) => state.updateProject);

  const [phaseLabels, setPhaseLabels] = useState({
    phase_label_a: currentProject?.phase_label_a || 'A',
    phase_label_b: currentProject?.phase_label_b || 'B',
    phase_label_c: currentProject?.phase_label_c || 'C'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const hasChanges =
    phaseLabels.phase_label_a !== (currentProject?.phase_label_a || 'A') ||
    phaseLabels.phase_label_b !== (currentProject?.phase_label_b || 'B') ||
    phaseLabels.phase_label_c !== (currentProject?.phase_label_c || 'C');

  const isUsingCustomLabels = hasCustomPhaseLabels(phaseLabels);

  const handleSave = async () => {
    if (!currentProject) {
      setSaveMessage({ type: 'error', text: 'No project selected' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateProject(currentProject.id, {
        phase_label_a: phaseLabels.phase_label_a,
        phase_label_b: phaseLabels.phase_label_b,
        phase_label_c: phaseLabels.phase_label_c
      });

      setSaveMessage({ type: 'success', text: 'Phase labels saved successfully' });

      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save phase labels:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save phase labels' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = getDefaultPhaseLabels();
    setPhaseLabels({
      phase_label_a: defaults.phase_label_a!,
      phase_label_b: defaults.phase_label_b!,
      phase_label_c: defaults.phase_label_c!
    });
  };

  if (!currentProject) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Phase Labels</h2>
          <p className="text-gray-600 dark:text-gray-400">Customize phase labels for power distribution</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <p className="text-yellow-800 dark:text-yellow-200">Please select or create a project to configure phase labels</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Phase Labels</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Customize power phase labels for <span className="font-semibold">{currentProject.name}</span>
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Custom Phase Labels</span>
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Customize how power phases are labeled throughout this project. Common alternatives include numeric (1/2/3) or
          line notation (L1/L2/L3). Changes apply to all power displays, reports, and exports.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phase A Label
            </label>
            <input
              type="text"
              value={phaseLabels.phase_label_a}
              onChange={(e) => setPhaseLabels({ ...phaseLabels, phase_label_a: e.target.value })}
              maxLength={10}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="A"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: A</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phase B Label
            </label>
            <input
              type="text"
              value={phaseLabels.phase_label_b}
              onChange={(e) => setPhaseLabels({ ...phaseLabels, phase_label_b: e.target.value })}
              maxLength={10}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="B"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: B</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phase C Label
            </label>
            <input
              type="text"
              value={phaseLabels.phase_label_c}
              onChange={(e) => setPhaseLabels({ ...phaseLabels, phase_label_c: e.target.value })}
              maxLength={10}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="C"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: C</p>
          </div>
        </div>

        {/* Common Presets */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Common Presets</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPhaseLabels({ phase_label_a: 'A', phase_label_b: 'B', phase_label_c: 'C' })}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition"
            >
              A / B / C (Default)
            </button>
            <button
              onClick={() => setPhaseLabels({ phase_label_a: '1', phase_label_b: '2', phase_label_c: '3' })}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition"
            >
              1 / 2 / 3 (Numeric)
            </button>
            <button
              onClick={() => setPhaseLabels({ phase_label_a: 'L1', phase_label_b: 'L2', phase_label_c: 'L3' })}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition"
            >
              L1 / L2 / L3 (Line)
            </button>
            <button
              onClick={() => setPhaseLabels({ phase_label_a: 'X', phase_label_b: 'Y', phase_label_c: 'Z' })}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition"
            >
              X / Y / Z
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Preview</h4>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-blue-800 dark:text-blue-300">Phase labels will appear as:</span>
            <div className="flex gap-3">
              <span className="px-2 py-1 bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded font-mono">
                {phaseLabels.phase_label_a || 'A'}
              </span>
              <span className="px-2 py-1 bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded font-mono">
                {phaseLabels.phase_label_b || 'B'}
              </span>
              <span className="px-2 py-1 bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded font-mono">
                {phaseLabels.phase_label_c || 'C'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {saveMessage && (
        <div
          className={`p-4 rounded-lg border ${
            saveMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleReset}
          disabled={!isUsingCustomLabels}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Default</span>
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
