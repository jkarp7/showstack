/**
 * Report Table Renderer
 * Renders organized report data as formatted tables
 */

import React from 'react';
import { PaperworkColumnConfig, ColumnFormatType } from '../../types/paperworkTemplate';
import { OrganizedReportData, ReportDataItem } from '../../utils/paperwork/reportOrganizer';

interface ReportTableRendererProps {
  columns: PaperworkColumnConfig[];
  data: OrganizedReportData;
  reportType: string;
}

export function ReportTableRenderer({
  columns,
  data,
  reportType
}: ReportTableRendererProps) {
  const visibleColumns = columns.filter(c => c.visible);

  if (!data || data.groups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-black report-content p-8">
      {data.groups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-8">
          {data.hasGroups && (
            <h3 className="text-lg font-bold mb-4 text-blue-600">
              {group.groupValue} ({group.items.length} items)
            </h3>
          )}

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {visibleColumns.map(col => (
                  <th
                    key={col.id}
                    style={{ width: `${col.width}%` }}
                    className="border border-gray-300 px-2 py-1 text-left text-sm font-semibold"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.items.map((item, itemIndex) => (
                <tr key={itemIndex} className="hover:bg-gray-50">
                  {visibleColumns.map(col => (
                    <td
                      key={col.id}
                      className="border border-gray-300 px-2 py-1 text-sm"
                    >
                      {formatValue(item[col.field], col.format)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function formatValue(value: any, format?: ColumnFormatType): string {
  if (value == null) return '—';

  switch (format) {
    case 'number':
      return Number(value).toLocaleString();

    case 'power':
      return `${Number(value).toLocaleString()}W`;

    case 'boolean':
      return value ? 'Yes' : 'No';

    case 'date':
      return new Date(value).toLocaleDateString();

    case 'color':
      return String(value);

    case 'text':
    default:
      return String(value);
  }
}
