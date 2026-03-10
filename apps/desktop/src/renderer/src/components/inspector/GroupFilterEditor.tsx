import { useState } from 'react';
import type { HighlightConditionOperator } from '../../types/highlighting';
import type { GroupFilterCondition, GroupFilterDef } from '../../types/group';
import type { Fixture } from '../../types';

interface GroupFilterEditorProps {
  filterDef: GroupFilterDef | null;
  onChange: (def: GroupFilterDef) => void;
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
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'model', label: 'Model' },
  { value: 'location', label: 'Location' },
  { value: 'notes', label: 'Notes' },
  { value: 'mark', label: 'Mark' },
];

const EMPTY_FILTER_DEF: GroupFilterDef = { mode: 'any', conditions: [] };

function needsValue(operator: HighlightConditionOperator): boolean {
  return operator !== 'is_empty' && operator !== 'is_not_empty';
}

function emptyCondition(): GroupFilterCondition {
  return { field: 'type', operator: 'contains', value: '' };
}

/**
 * GroupFilterEditor — inline condition editor inside GroupDetail.
 *
 * Produces a GroupFilterDef (mode + conditions array) that is stored as
 * JSON in fixture_groups.filter_def.
 */
export function GroupFilterEditor({ filterDef, onChange }: GroupFilterEditorProps) {
  const def = filterDef ?? EMPTY_FILTER_DEF;

  function update(patch: Partial<GroupFilterDef>) {
    onChange({ ...def, ...patch });
  }

  function updateCondition(index: number, patch: Partial<GroupFilterCondition>) {
    const updated = def.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c));
    update({ conditions: updated });
  }

  function addCondition() {
    update({ conditions: [...def.conditions, emptyCondition()] });
  }

  function removeCondition(index: number) {
    update({ conditions: def.conditions.filter((_, i) => i !== index) });
  }

  if (def.conditions.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No filter — only pinned fixtures will be included.
        </p>
        <button
          onClick={addCondition}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          + Add condition
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Match mode toggle */}
      {def.conditions.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>Match</span>
          <select
            value={def.mode}
            onChange={(e) => update({ mode: e.target.value as 'all' | 'any' })}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="any">any</option>
            <option value="all">all</option>
          </select>
          <span>of the following:</span>
        </div>
      )}

      {/* Conditions */}
      {def.conditions.map((cond, i) => (
        <div key={i} className="flex items-center gap-1.5 flex-wrap">
          {/* Field */}
          <select
            value={cond.field as string}
            onChange={(e) => updateCondition(i, { field: e.target.value as keyof Fixture })}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex-shrink-0"
          >
            {FIELDS.map((f) => (
              <option key={f.value as string} value={f.value as string}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Operator */}
          <select
            value={cond.operator}
            onChange={(e) =>
              updateCondition(i, { operator: e.target.value as HighlightConditionOperator })
            }
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex-shrink-0"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          {/* Value */}
          {needsValue(cond.operator) && (
            <input
              type="text"
              value={cond.value}
              onChange={(e) => updateCondition(i, { value: e.target.value })}
              placeholder="value"
              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 w-24 flex-shrink-0"
            />
          )}

          {/* Remove condition */}
          <button
            onClick={() => removeCondition(i)}
            aria-label="Remove condition"
            className="text-gray-400 hover:text-red-500 flex-shrink-0 p-0.5"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M1 1l8 8M9 1L1 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}

      <button
        onClick={addCondition}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        + Add condition
      </button>
    </div>
  );
}
