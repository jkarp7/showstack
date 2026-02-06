import { useState } from 'react';
import { HighlightRule, HighlightConditionOperator } from '../../types/highlighting';
import { Fixture } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ConditionalFormattingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rules: HighlightRule[];
  onSave: (rules: HighlightRule[]) => void;
}

const OPERATORS: { value: HighlightConditionOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const COMMON_FIELDS: (keyof Fixture)[] = [
  'type',
  'purpose',
  'position',
  'channel',
  'color',
  'gobo',
  'system',
  'status',
  'manufacturer',
  'model',
  'location',
];

export function ConditionalFormattingDialog({
  isOpen,
  onClose,
  rules,
  onSave,
}: ConditionalFormattingDialogProps) {
  const [localRules, setLocalRules] = useState<HighlightRule[]>(rules);
  const [editingRule, setEditingRule] = useState<HighlightRule | null>(null);

  if (!isOpen) return null;

  const handleAddRule = () => {
    const newRule: HighlightRule = {
      id: uuidv4(),
      name: 'New Rule',
      enabled: true,
      field: 'type',
      operator: 'equals',
      value: '',
      color: '#FFEB3B',
      priority: localRules.length,
    };
    setEditingRule(newRule);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    const existingIndex = localRules.findIndex((r) => r.id === editingRule.id);
    if (existingIndex >= 0) {
      // Update existing rule
      const updated = [...localRules];
      updated[existingIndex] = editingRule;
      setLocalRules(updated);
    } else {
      // Add new rule
      setLocalRules([...localRules, editingRule]);
    }
    setEditingRule(null);
  };

  const handleDeleteRule = (id: string) => {
    setLocalRules(localRules.filter((r) => r.id !== id));
  };

  const handleToggleRule = (id: string) => {
    setLocalRules(localRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localRules];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Update priorities
    updated.forEach((rule, i) => {
      rule.priority = i;
    });
    setLocalRules(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === localRules.length - 1) return;
    const updated = [...localRules];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Update priorities
    updated.forEach((rule, i) => {
      rule.priority = i;
    });
    setLocalRules(updated);
  };

  const handleSave = () => {
    onSave(localRules);
    onClose();
  };

  const needsValue = editingRule && !['is_empty', 'is_not_empty'].includes(editingRule.operator);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Conditional Formatting
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Highlight rows based on fixture properties. Rules are evaluated in order (higher
            priority first).
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!editingRule ? (
            <>
              {localRules.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No formatting rules defined. Click "Add Rule" to create one.
                </div>
              ) : (
                <div className="space-y-2">
                  {localRules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="w-4 h-4"
                      />
                      <div
                        className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0"
                        style={{ backgroundColor: rule.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {rule.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {rule.field} {rule.operator.replace(/_/g, ' ')}{' '}
                          {!['is_empty', 'is_not_empty'].includes(rule.operator) &&
                            `"${rule.value}"`}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === localRules.length - 1}
                          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="px-3 py-1 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Highlight Spare Circuits"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Field
                  </label>
                  <select
                    value={editingRule.field as string}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, field: e.target.value as keyof Fixture })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    {COMMON_FIELDS.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Operator
                  </label>
                  <select
                    value={editingRule.operator}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        operator: e.target.value as HighlightConditionOperator,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {needsValue && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={editingRule.value}
                    onChange={(e) => setEditingRule({ ...editingRule, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="e.g., Spare Circuit"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Highlight Color
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={editingRule.color}
                    onChange={(e) => setEditingRule({ ...editingRule, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingRule.color}
                    onChange={(e) => setEditingRule({ ...editingRule, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="#FFEB3B"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveRule}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  Save Rule
                </button>
                <button
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={handleAddRule}
            disabled={!!editingRule}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Rule
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
