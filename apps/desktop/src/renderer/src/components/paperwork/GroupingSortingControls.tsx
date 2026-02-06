/**
 * Grouping and Sorting Controls
 * UI for organizing report data
 */

import React from 'react';
import { ReportOrganization, PaperworkColumnConfig } from '../../types/paperworkTemplate';

interface GroupingSortingControlsProps {
  organization: ReportOrganization;
  columns: PaperworkColumnConfig[];
  onChange: (organization: ReportOrganization) => void;
}

export function GroupingSortingControls({
  organization,
  columns,
  onChange
}: GroupingSortingControlsProps) {
  const groupableFields = columns.filter(c => c.visible).map(c => ({
    value: c.field,
    label: c.label
  }));

  return (
    <div className="space-y-4">
      {/* Group By */}
      <div>
        <label className="block text-sm font-medium mb-2">Group By</label>
        <select
          value={organization.groupBy || 'none'}
          onChange={(e) =>
            onChange({
              ...organization,
              groupBy: e.target.value === 'none' ? undefined : e.target.value
            })
          }
          className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
        >
          <option value="none">No Grouping</option>
          {groupableFields.map(field => (
            <option key={field.value} value={field.value}>
              {field.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium mb-2">Sort By</label>
        <div className="flex gap-2">
          <select
            value={organization.sortBy || columns[0]?.field || ''}
            onChange={(e) =>
              onChange({ ...organization, sortBy: e.target.value })
            }
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
          >
            {columns.filter(c => c.visible).map(col => (
              <option key={col.field} value={col.field}>
                {col.label}
              </option>
            ))}
          </select>

          <select
            value={organization.sortDirection || 'asc'}
            onChange={(e) =>
              onChange({
                ...organization,
                sortDirection: e.target.value as 'asc' | 'desc'
              })
            }
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
          >
            <option value="asc">↑ Ascending</option>
            <option value="desc">↓ Descending</option>
          </select>
        </div>
      </div>

      {/* Group Options */}
      {organization.groupBy && (
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={organization.showGroupHeaders ?? true}
              onChange={(e) =>
                onChange({
                  ...organization,
                  showGroupHeaders: e.target.checked
                })
              }
              className="w-4 h-4"
            />
            <span className="text-sm">Show Group Headers</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={organization.groupPageBreaks ?? false}
              onChange={(e) =>
                onChange({
                  ...organization,
                  groupPageBreaks: e.target.checked
                })
              }
              className="w-4 h-4"
            />
            <span className="text-sm">Page Break Between Groups</span>
          </label>
        </div>
      )}
    </div>
  );
}
