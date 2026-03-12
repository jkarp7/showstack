import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { HighlightRule, HighlightConditionOperator } from '../../types/highlighting';
import type { Fixture } from '../../types';

interface ConditionalFormattingInspectorProps {
  rules: HighlightRule[];
  onChange: (rules: HighlightRule[]) => void;
}

const OPERATORS: { value: HighlightConditionOperator; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
];

const FIELDS: { value: keyof Fixture; label: string }[] = [
  { value: 'type', label: 'Type' },
  { value: 'purpose', label: 'Purpose' },
  { value: 'position', label: 'Position' },
  { value: 'channel', label: 'Channel' },
  { value: 'color', label: 'Color' },
  { value: 'gobo', label: 'Gobo' },
  { value: 'system', label: 'System' },
  { value: 'status', label: 'Status' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'model', label: 'Model' },
  { value: 'location', label: 'Location' },
  { value: 'notes', label: 'Notes' },
  { value: 'mark', label: 'Mark' },
];

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#94a3b8', // slate
];

function needsValue(operator: HighlightConditionOperator): boolean {
  return operator !== 'is_empty' && operator !== 'is_not_empty';
}

/**
 * ConditionalFormattingInspector — inspector-panel version of ConditionalFormattingDialog.
 *
 * Auto-saves on every change (no Save/Cancel buttons). Compact layout fits the
 * ~280px inspector width.
 */
export function ConditionalFormattingInspector({
  rules,
  onChange,
}: ConditionalFormattingInspectorProps) {
  const [editingRule, setEditingRule] = useState<HighlightRule | null>(null);

  function commit(updated: HighlightRule[]) {
    // Sync priorities to list order
    const withPriority = updated.map((r, i) => ({ ...r, priority: i }));
    onChange(withPriority);
  }

  function handleAddRule() {
    const newRule: HighlightRule = {
      id: uuidv4(),
      name: 'New Rule',
      enabled: true,
      field: 'type',
      operator: 'contains',
      value: '',
      color: '#3b82f6',
      priority: rules.length,
    };
    setEditingRule(newRule);
  }

  function handleSaveEdit() {
    if (!editingRule) return;
    const idx = rules.findIndex((r) => r.id === editingRule.id);
    const updated =
      idx >= 0
        ? rules.map((r) => (r.id === editingRule.id ? editingRule : r))
        : [...rules, editingRule];
    commit(updated);
    setEditingRule(null);
  }

  function handleCancelEdit() {
    setEditingRule(null);
  }

  function handleToggle(id: string) {
    commit(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  function handleDelete(id: string) {
    if (editingRule?.id === id) setEditingRule(null);
    commit(rules.filter((r) => r.id !== id));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const updated = [...rules];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    commit(updated);
  }

  function handleMoveDown(index: number) {
    if (index === rules.length - 1) return;
    const updated = [...rules];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    commit(updated);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Formatting Rules
        </span>
        {!editingRule && (
          <button
            onClick={handleAddRule}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            + New
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {editingRule ? (
          /* ── Rule editor ── */
          <div className="px-3 py-3 space-y-3 text-sm">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Name
              </label>
              <input
                type="text"
                value={editingRule.name}
                onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                autoFocus
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                placeholder="e.g., Spare Fixtures"
              />
            </div>

            {/* Field */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Field
              </label>
              <select
                value={editingRule.field as string}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, field: e.target.value as keyof Fixture })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
              >
                {FIELDS.map((f) => (
                  <option key={f.value as string} value={f.value as string}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Operator */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Condition
              </label>
              <select
                value={editingRule.operator}
                onChange={(e) =>
                  setEditingRule({
                    ...editingRule,
                    operator: e.target.value as HighlightConditionOperator,
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Value */}
            {needsValue(editingRule.operator) && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Value
                </label>
                <input
                  type="text"
                  value={editingRule.value}
                  onChange={(e) => setEditingRule({ ...editingRule, value: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                  placeholder="value to match"
                />
              </div>
            )}

            {/* Color */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Highlight Color
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditingRule({ ...editingRule, color: c })}
                    aria-label={`Select color ${c}`}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      editingRule.color === c
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={editingRule.color}
                  onChange={(e) => setEditingRule({ ...editingRule, color: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-gray-300 dark:border-gray-600 bg-transparent p-0"
                  title="Custom color"
                />
              </div>
            </div>

            {/* Preview swatch */}
            <div
              className="px-2 py-1.5 rounded text-sm text-gray-900 border border-gray-200 dark:border-gray-600"
              style={{ backgroundColor: editingRule.color + '40' }}
            >
              Preview: {editingRule.name || 'New Rule'}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Rule
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : rules.length === 0 ? (
          /* ── Empty state ── */
          <div className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">
            No rules yet.{' '}
            <button
              onClick={handleAddRule}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Add one
            </button>{' '}
            to highlight rows by fixture property.
          </div>
        ) : (
          /* ── Rule list ── */
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {rules.map((rule, index) => (
              <div key={rule.id} className="flex items-start gap-2 px-3 py-2 group">
                {/* Enable toggle */}
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggle(rule.id)}
                  className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
                  aria-label={`Enable ${rule.name}`}
                />

                {/* Color swatch */}
                <div
                  className="w-3.5 h-3.5 mt-0.5 rounded-sm flex-shrink-0 border border-gray-200 dark:border-gray-600"
                  style={{ backgroundColor: rule.color }}
                />

                {/* Rule summary */}
                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => setEditingRule(rule)}
                  title="Edit rule"
                >
                  <div
                    className={`text-xs font-medium truncate ${rule.enabled ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600 line-through'}`}
                  >
                    {rule.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {rule.field} {rule.operator.replace(/_/g, ' ')}
                    {needsValue(rule.operator) && ` "${rule.value}"`}
                  </div>
                </button>

                {/* Controls — visible on hover */}
                <div className="flex flex-col gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === rules.length - 1}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-gray-400 hover:text-red-500 leading-none"
                    aria-label="Delete rule"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
