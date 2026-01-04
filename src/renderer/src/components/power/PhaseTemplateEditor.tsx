import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { PhaseDistributionTemplate, PhaseDistribution, generatePhaseDistribution, calculateTemplatePhaseBalance } from '../../types/phaseTemplate';
import { Phase, PhaseConfig } from '../../types/power';
import { useProjectStore } from '../../store/projectStore';
import { getPhaseLabel } from '../../utils/phaseLabels';

interface PhaseTemplateEditorProps {
  template?: PhaseDistributionTemplate;
  projectId: string;
  onSave: (template: Omit<PhaseDistributionTemplate, 'id' | 'created_at' | 'updated_at' | 'is_system' | 'project_id'>) => void;
  onClose: () => void;
}

export function PhaseTemplateEditor({ template, projectId, onSave, onClose }: PhaseTemplateEditorProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [phaseConfig, setPhaseConfig] = useState<PhaseConfig>(template?.phase_config || 'split');
  const [circuitCount, setCircuitCount] = useState<12 | 24 | 48 | 96>(template?.circuit_count || 24);
  const [phaseDistribution, setPhaseDistribution] = useState<PhaseDistribution>(
    template?.phase_distribution || generatePhaseDistribution(24, 'ab')
  );

  const phaseLabels = currentProject ? {
    phase_label_a: currentProject.phase_label_a,
    phase_label_b: currentProject.phase_label_b,
    phase_label_c: currentProject.phase_label_c
  } : undefined;

  // Update phase distribution when circuit count or phase config changes
  useEffect(() => {
    if (!template) {
      // Auto-generate distribution based on phase config
      let pattern: 'ab' | 'ac' | 'bc' | 'abc' | 'a' | 'b' | 'c' = 'ab';
      if (phaseConfig === 'single') {
        pattern = 'a';
      } else if (phaseConfig === 'split') {
        pattern = 'ab';
      } else if (phaseConfig === 'three') {
        pattern = 'abc';
      }
      setPhaseDistribution(generatePhaseDistribution(circuitCount, pattern));
    }
  }, [circuitCount, phaseConfig, template]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      phase_config: phaseConfig,
      circuit_count: circuitCount,
      phase_distribution: phaseDistribution
    });
  };

  const handlePhaseChange = (circuit: string, phase: Phase) => {
    setPhaseDistribution({
      ...phaseDistribution,
      [circuit]: phase
    });
  };

  const handleQuickPattern = (pattern: 'ab' | 'ac' | 'bc' | 'abc' | 'a' | 'b' | 'c') => {
    setPhaseDistribution(generatePhaseDistribution(circuitCount, pattern));
  };

  const balance = calculateTemplatePhaseBalance(phaseDistribution);
  const circuits = Object.keys(phaseDistribution).sort((a, b) => parseInt(a) - parseInt(b));

  const getPhaseOptions = (): Phase[] => {
    if (phaseConfig === 'single') return ['A'];
    if (phaseConfig === 'split') return ['A', 'B'];
    return ['A', 'B', 'C'];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {template ? 'Edit Template' : 'Create Phase Distribution Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Custom AB Pattern"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this phase distribution pattern..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phase Configuration
                </label>
                <select
                  value={phaseConfig}
                  onChange={(e) => setPhaseConfig(e.target.value as PhaseConfig)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="single">Single Phase</option>
                  <option value="split">Split Phase (2-phase)</option>
                  <option value="three">Three Phase</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Circuit Count
                </label>
                <select
                  value={circuitCount}
                  onChange={(e) => setCircuitCount(parseInt(e.target.value) as 12 | 24 | 48 | 96)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={12}>12 circuits</option>
                  <option value={24}>24 circuits</option>
                  <option value={48}>48 circuits</option>
                  <option value={96}>96 circuits</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Patterns */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Patterns
            </label>
            <div className="flex flex-wrap gap-2">
              {phaseConfig === 'single' && (
                <>
                  <button
                    onClick={() => handleQuickPattern('a')}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition"
                  >
                    All {getPhaseLabel('A', phaseLabels)}
                  </button>
                </>
              )}
              {phaseConfig === 'split' && (
                <>
                  <button
                    onClick={() => handleQuickPattern('ab')}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition"
                  >
                    {getPhaseLabel('A', phaseLabels)}/{getPhaseLabel('B', phaseLabels)} Alternating
                  </button>
                  <button
                    onClick={() => handleQuickPattern('ac')}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition"
                  >
                    {getPhaseLabel('A', phaseLabels)}/{getPhaseLabel('C', phaseLabels)} Alternating
                  </button>
                  <button
                    onClick={() => handleQuickPattern('bc')}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition"
                  >
                    {getPhaseLabel('B', phaseLabels)}/{getPhaseLabel('C', phaseLabels)} Alternating
                  </button>
                </>
              )}
              {phaseConfig === 'three' && (
                <button
                  onClick={() => handleQuickPattern('abc')}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition"
                >
                  {getPhaseLabel('A', phaseLabels)}/{getPhaseLabel('B', phaseLabels)}/{getPhaseLabel('C', phaseLabels)} Sequential
                </button>
              )}
            </div>
          </div>

          {/* Phase Balance */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Phase Balance</h4>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">{getPhaseLabel('A', phaseLabels)}:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{balance.A} circuits</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">{getPhaseLabel('B', phaseLabels)}:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{balance.B} circuits</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">{getPhaseLabel('C', phaseLabels)}:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{balance.C} circuits</span>
              </div>
            </div>
          </div>

          {/* Phase Assignment Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Circuit Phase Assignment
            </label>
            <div className="grid grid-cols-12 gap-2">
              {circuits.map((circuit) => (
                <div key={circuit} className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {circuit}
                  </span>
                  <select
                    value={phaseDistribution[circuit]}
                    onChange={(e) => handlePhaseChange(circuit, e.target.value as Phase)}
                    className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-mono"
                  >
                    {getPhaseOptions().map((phase) => (
                      <option key={phase} value={phase}>
                        {getPhaseLabel(phase, phaseLabels)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </label>
            <div className="flex flex-wrap gap-1">
              {circuits.map((circuit) => (
                <span
                  key={circuit}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono"
                >
                  {getPhaseLabel(phaseDistribution[circuit], phaseLabels)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {template ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
