import { useState, useMemo } from 'react';
import type { PaperworkTemplate } from '../../types/paperworkTemplate';
import type { ReportType } from '../../types/paperwork';

/**
 * Paperwork Template Library
 *
 * Sidebar component for managing paperwork templates:
 * - Browse system and custom templates
 * - Search and filter by report type
 * - Load, duplicate, and delete templates
 * - Create new templates
 */

interface PaperworkTemplateLibraryProps {
  templates: PaperworkTemplate[];
  currentTemplate?: PaperworkTemplate;
  onLoadTemplate: (template: PaperworkTemplate) => void;
  onDuplicateTemplate: (template: PaperworkTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onCreateNew: () => void;
  className?: string;
}

export function PaperworkTemplateLibrary({
  templates,
  currentTemplate,
  onLoadTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onCreateNew,
  className = ''
}: PaperworkTemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReportType, setFilterReportType] = useState<ReportType | 'all'>('all');
  const [showSystemTemplates, setShowSystemTemplates] = useState(true);
  const [showCustomTemplates, setShowCustomTemplates] = useState(true);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Filter by search query
      if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter by report type
      if (filterReportType !== 'all' && template.reportType !== filterReportType) {
        return false;
      }

      // Filter by system/custom
      if (template.isSystem && !showSystemTemplates) {
        return false;
      }
      if (!template.isSystem && !showCustomTemplates) {
        return false;
      }

      return true;
    });
  }, [templates, searchQuery, filterReportType, showSystemTemplates, showCustomTemplates]);

  // Separate system and custom templates
  const systemTemplates = filteredTemplates.filter((t) => t.isSystem);
  const customTemplates = filteredTemplates.filter((t) => !t.isSystem);

  // Get unique report types for filter dropdown
  const reportTypes = useMemo(() => {
    const types = new Set(templates.map((t) => t.reportType));
    return Array.from(types).sort();
  }, [templates]);

  return (
    <div className={`flex flex-col h-full bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-200">Templates</h3>
          <button
            onClick={onCreateNew}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
          >
            + New
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Filters */}
        <div className="mt-2 space-y-2">
          {/* Report Type Filter */}
          <select
            value={filterReportType}
            onChange={(e) => setFilterReportType(e.target.value as ReportType | 'all')}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Report Types</option>
            {reportTypes.map((type) => (
              <option key={type} value={type}>
                {formatReportTypeName(type)}
              </option>
            ))}
          </select>

          {/* Template Type Toggles */}
          <div className="flex gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showSystemTemplates}
                onChange={(e) => setShowSystemTemplates(e.target.checked)}
                className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-blue-500"
              />
              <span className="text-xs text-gray-400">System</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showCustomTemplates}
                onChange={(e) => setShowCustomTemplates(e.target.checked)}
                className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-blue-500"
              />
              <span className="text-xs text-gray-400">Custom</span>
            </label>
          </div>
        </div>
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* System Templates */}
        {showSystemTemplates && systemTemplates.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              System Templates
            </h4>
            <div className="space-y-2">
              {systemTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isActive={currentTemplate?.id === template.id}
                  onLoad={() => onLoadTemplate(template)}
                  onDuplicate={() => onDuplicateTemplate(template)}
                  onDelete={undefined} // System templates cannot be deleted
                />
              ))}
            </div>
          </div>
        )}

        {/* Custom Templates */}
        {showCustomTemplates && customTemplates.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Custom Templates
            </h4>
            <div className="space-y-2">
              {customTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isActive={currentTemplate?.id === template.id}
                  onLoad={() => onLoadTemplate(template)}
                  onDuplicate={() => onDuplicateTemplate(template)}
                  onDelete={() => onDeleteTemplate(template.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No templates found</p>
            <p className="text-xs mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-400">
        {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
      </div>
    </div>
  );
}

/**
 * Template Card
 * Individual template card with actions
 */
interface TemplateCardProps {
  template: PaperworkTemplate;
  isActive: boolean;
  onLoad: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
}

function TemplateCard({
  template,
  isActive,
  onLoad,
  onDuplicate,
  onDelete
}: TemplateCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`relative group bg-gray-750 rounded border transition-all ${
        isActive
          ? 'border-blue-500 ring-2 ring-blue-400'
          : 'border-gray-600 hover:border-gray-500'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Card Content */}
      <button
        onClick={onLoad}
        className="w-full text-left px-3 py-2"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-medium text-gray-200 truncate">
              {template.name}
            </h5>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatReportTypeName(template.reportType)}
            </p>
            {template.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
          {template.isSystem && (
            <span className="ml-2 px-1.5 py-0.5 bg-gray-700 text-gray-400 text-xs rounded flex-shrink-0">
              System
            </span>
          )}
        </div>

        {/* Template Info */}
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span>{template.columns.filter(c => c.visible).length} columns</span>
          {template.organization.groupBy && (
            <>
              <span>•</span>
              <span>Grouped by {template.organization.groupBy}</span>
            </>
          )}
        </div>
      </button>

      {/* Actions (shown on hover) */}
      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1">
          {/* Duplicate */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title="Duplicate template"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>

          {/* Delete (only for custom templates) */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete template "${template.name}"?`)) {
                  onDelete();
                }
              }}
              className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
              title="Delete template"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Format report type name for display
 */
function formatReportTypeName(reportType: ReportType): string {
  const nameMap: Record<ReportType, string> = {
    'channel-hookup': 'Channel Hookup',
    'dimmer-schedule': 'Dimmer Schedule',
    'circuit-list': 'Circuit List',
    'dmx-addresses': 'DMX Addresses',
    'power-summary': 'Power Summary',
    'color-schedule': 'Color Schedule',
    'gobo-schedule': 'Gobo Schedule',
    'infrastructure-list': 'Infrastructure List',
    'network-summary': 'Network Summary',
    'port-assignments': 'Port Assignments',
    'infrastructure-power': 'Infrastructure Power',
    'infrastructure-location': 'Infrastructure Location'
  };

  return nameMap[reportType] || reportType;
}
