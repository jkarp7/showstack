import { useState, useEffect } from 'react';
import { Zap, Plus, Edit, Trash2, Lock } from 'lucide-react';
import { PhaseDistributionTemplate, PhaseDistribution } from '../../types/phaseTemplate';
import { useProjectStore } from '../../store/projectStore';
import { getPhaseLabel } from '../../utils/phaseLabels';
import { PhaseTemplateEditor } from './PhaseTemplateEditor';
import { logger } from '../../utils/logger';

interface PhaseTemplateManagerProps {
  projectId?: string;
  onSelectTemplate?: (template: PhaseDistributionTemplate) => void;
}

export function PhaseTemplateManager({
  projectId = 'default-project',
  onSelectTemplate,
}: PhaseTemplateManagerProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const [templates, setTemplates] = useState<PhaseDistributionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PhaseDistributionTemplate | undefined>(
    undefined,
  );

  useEffect(() => {
    loadTemplates();
  }, [projectId]);

  const loadTemplates = async () => {
    if (!window.api?.phaseTemplates) return;

    setLoading(true);
    try {
      const allTemplates = await window.api.phaseTemplates.getAll(projectId);
      setTemplates(allTemplates);
    } catch (error) {
      logger.error('Error loading phase templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Delete template "${templateName}"?`)) return;

    try {
      await window.api.phaseTemplates.delete(templateId);
      await loadTemplates();
    } catch (error) {
      logger.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(undefined);
    setShowEditor(true);
  };

  const handleEditTemplate = (template: PhaseDistributionTemplate) => {
    // Parse the JSON string to object for editing
    const templateWithParsedDistribution = {
      ...template,
      phase_distribution: JSON.parse(template.phase_distribution as any) as PhaseDistribution,
    };
    setEditingTemplate(templateWithParsedDistribution);
    setShowEditor(true);
  };

  const handleSaveTemplate = async (
    templateData: Omit<
      PhaseDistributionTemplate,
      'id' | 'created_at' | 'updated_at' | 'is_system' | 'project_id'
    >,
  ) => {
    try {
      if (editingTemplate) {
        // Update existing template
        await window.api.phaseTemplates.update(editingTemplate.id, {
          name: templateData.name,
          description: templateData.description,
          phase_config: templateData.phase_config,
          circuit_count: templateData.circuit_count,
          phase_distribution: JSON.stringify(templateData.phase_distribution),
        });
      } else {
        // Create new template
        await window.api.phaseTemplates.create(
          {
            name: templateData.name,
            description: templateData.description,
            phase_config: templateData.phase_config,
            circuit_count: templateData.circuit_count,
            phase_distribution: JSON.stringify(templateData.phase_distribution),
          },
          projectId,
        );
      }
      await loadTemplates();
      setShowEditor(false);
      setEditingTemplate(undefined);
    } catch (error) {
      logger.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingTemplate(undefined);
  };

  const renderPhasePreview = (distribution: PhaseDistribution) => {
    const phaseLabels = currentProject
      ? {
          phase_label_a: currentProject.phase_label_a,
          phase_label_b: currentProject.phase_label_b,
          phase_label_c: currentProject.phase_label_c,
        }
      : undefined;

    const circuits = Object.keys(distribution).sort((a, b) => parseInt(a) - parseInt(b));
    const preview = circuits.slice(0, 8).map((circuit) => {
      const phase = distribution[circuit];
      return getPhaseLabel(phase, phaseLabels);
    });

    return (
      <div className="flex gap-1 items-center">
        {preview.map((label, idx) => (
          <span
            key={idx}
            className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono"
          >
            {label}
          </span>
        ))}
        {circuits.length > 8 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            +{circuits.length - 8} more
          </span>
        )}
      </div>
    );
  };

  const calculateBalance = (distribution: PhaseDistribution) => {
    const counts = { A: 0, B: 0, C: 0 };
    Object.values(distribution).forEach((phase) => {
      counts[phase]++;
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading templates...</div>
    );
  }

  const systemTemplates = templates.filter((t) => t.is_system);
  const userTemplates = templates.filter((t) => !t.is_system);

  return (
    <div className="space-y-6">
      {/* System Templates */}
      {systemTemplates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span>System Templates</span>
            </h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {systemTemplates.map((template) => {
              const distribution = JSON.parse(template.phase_distribution) as PhaseDistribution;
              const balance = calculateBalance(distribution);

              return (
                <div
                  key={template.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  onClick={() => onSelectTemplate?.(template)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                      )}
                      <div className="mt-3 space-y-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {template.circuit_count} circuits • {template.phase_config} phase
                        </div>
                        {renderPhasePreview(distribution)}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Balance: A={balance.A}, B={balance.B}, C={balance.C}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Templates */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span>Custom Templates</span>
          </h3>
          <button
            onClick={handleCreateTemplate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>

        {userTemplates.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {userTemplates.map((template) => {
              const distribution = JSON.parse(template.phase_distribution) as PhaseDistribution;
              const balance = calculateBalance(distribution);

              return (
                <div
                  key={template.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex justify-between items-start">
                    <div
                      className="flex-1"
                      onClick={() => onSelectTemplate?.(template)}
                      role="button"
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                      )}
                      <div className="mt-3 space-y-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {template.circuit_count} circuits • {template.phase_config} phase
                        </div>
                        {renderPhasePreview(distribution)}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Balance: A={balance.A}, B={balance.B}, C={balance.C}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id, template.name)}
                        className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <p>No custom templates yet</p>
            <p className="text-sm mt-1">
              Create a template to save your phase distribution patterns
            </p>
          </div>
        )}
      </div>

      {/* Phase Template Editor Dialog */}
      {showEditor && (
        <PhaseTemplateEditor
          template={editingTemplate}
          projectId={projectId}
          onSave={handleSaveTemplate}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
