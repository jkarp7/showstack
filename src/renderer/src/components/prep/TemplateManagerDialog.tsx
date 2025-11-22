import { useState, useEffect } from 'react';
import type { PrepNoteTemplate } from '../../types/prep';

interface TemplateManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateManagerDialog({ isOpen, onClose }: TemplateManagerDialogProps) {
  const [selectedType, setSelectedType] = useState<'general_conditions' | 'general_notes' | 'fixture_notes'>('general_conditions');
  const [templates, setTemplates] = useState<PrepNoteTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<PrepNoteTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, selectedType]);

  const loadTemplates = async () => {
    try {
      const allTemplates = await window.api.prep.noteTemplates.getAll(selectedType);
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setFormName('');
    setFormContent('');
    setFormIsDefault(false);
  };

  const handleEdit = (template: PrepNoteTemplate) => {
    setIsCreating(false);
    setEditingTemplate(template);
    setFormName(template.name);
    setFormContent(template.content);
    setFormIsDefault(template.is_default === 1);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      if (editingTemplate) {
        // Update existing
        await window.api.prep.noteTemplates.update(editingTemplate.id, {
          name: formName.trim(),
          content: formContent,
          is_default: formIsDefault ? 1 : 0,
        });
      } else {
        // Create new
        await window.api.prep.noteTemplates.create({
          type: selectedType,
          name: formName.trim(),
          content: formContent,
          is_default: formIsDefault ? 1 : 0,
        });
      }

      // Reset form and reload
      setIsCreating(false);
      setEditingTemplate(null);
      setFormName('');
      setFormContent('');
      setFormIsDefault(false);
      loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) {
      return;
    }

    try {
      await window.api.prep.noteTemplates.delete(templateId);
      loadTemplates();

      // Clear form if we were editing this template
      if (editingTemplate?.id === templateId) {
        setIsCreating(false);
        setEditingTemplate(null);
        setFormName('');
        setFormContent('');
        setFormIsDefault(false);
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingTemplate(null);
    setFormName('');
    setFormContent('');
    setFormIsDefault(false);
  };

  if (!isOpen) return null;

  const typeLabels = {
    general_conditions: 'General Conditions',
    general_notes: 'General Notes',
    fixture_notes: 'Fixture Notes',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Template Manager</h2>
          <p className="text-sm text-gray-400 mt-1">
            Create and manage reusable note templates
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Template List */}
            <div>
              {/* Type Tabs */}
              <div className="flex gap-2 mb-4">
                {(['general_conditions', 'general_notes', 'fixture_notes'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      handleCancel();
                    }}
                    className={`px-3 py-2 rounded text-sm font-medium transition ${
                      selectedType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {typeLabels[type]}
                  </button>
                ))}
              </div>

              {/* New Template Button */}
              <button
                onClick={handleCreateNew}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition mb-4"
              >
                + New Template
              </button>

              {/* Template List */}
              <div className="space-y-2">
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No templates yet</p>
                    <p className="text-sm mt-1">Create one to get started</p>
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 rounded border cursor-pointer transition ${
                        editingTemplate?.id === template.id
                          ? 'bg-blue-600/20 border-blue-500'
                          : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                      }`}
                      onClick={() => handleEdit(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{template.name}</span>
                            {template.is_default === 1 && (
                              <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {template.content.substring(0, 60)}
                            {template.content.length > 60 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Edit/Create Form */}
            <div>
              {(isCreating || editingTemplate) ? (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {editingTemplate ? 'Edit Template' : 'New Template'}
                  </h3>

                  <div className="space-y-4">
                    {/* Template Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g., Standard Lighting Conditions"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Content
                      </label>
                      <textarea
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="Enter template content..."
                        className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>

                    {/* Set as Default */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsDefault}
                          onChange={(e) => setFormIsDefault(e.target.checked)}
                          className="w-4 h-4 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">
                          Set as default template
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Default template will be used when loading templates in projects
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition"
                      >
                        {editingTemplate ? 'Update' : 'Create'}
                      </button>
                      {editingTemplate && (
                        <button
                          onClick={() => handleDelete(editingTemplate.id)}
                          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded text-red-400 font-medium transition"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700/50 rounded-lg p-8 text-center">
                  <p className="text-gray-400">
                    Select a template to edit or create a new one
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
