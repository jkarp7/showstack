import { useState, useEffect } from 'react';
import { usePrepStore } from '../../store/prepStore';
import { useProjectStore } from '../../store/projectStore';
import type { PrepProject, Discipline } from '../../types/prep';

interface ProjectMetadataSectionProps {
  project: PrepProject;
}

export function ProjectMetadataSection({ project }: ProjectMetadataSectionProps) {
  const { updateProject } = usePrepStore();
  const { projects } = useProjectStore();

  // Find parent project if linked
  const parentProject = project.parent_project_id
    ? projects.find((p) => p.id === project.parent_project_id)
    : null;

  const isLinked = !!parentProject;
  const disciplines = JSON.parse(project.disciplines as any || '[]') as Discipline[];

  // State for editable fields (only used when not linked)
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Get field value - from parent if linked, otherwise from prep project
  const getFieldValue = (field: keyof PrepProject): string => {
    if (isLinked && parentProject) {
      // Map prep project fields to parent project fields
      switch (field) {
        case 'gm_name':
          return parentProject.general_manager || '';
        case 'gm_email':
          return parentProject.general_manager_email || '';
        case 'gm_phone':
          return parentProject.general_manager_phone || '';
        case 'pm_name':
          return parentProject.production_manager || '';
        case 'pm_email':
          return parentProject.production_manager_email || '';
        case 'pm_phone':
          return parentProject.production_manager_phone || '';
        case 'ld_name':
          return parentProject.lighting_designer || '';
        case 'ld_email':
          return parentProject.lighting_designer_email || '';
        case 'ld_phone':
          return parentProject.lighting_designer_phone || '';
        case 'pe_name':
          return parentProject.electrician || '';
        case 'pe_email':
          return parentProject.electrician_email || '';
        case 'pe_phone':
          return parentProject.electrician_phone || '';
        default:
          return '';
      }
    }
    return (project[field] as string) || '';
  };

  const handleFieldClick = (field: string) => {
    if (isLinked) return; // Read-only if linked
    setEditing(field);
    setEditValue(getFieldValue(field as keyof PrepProject));
  };

  const handleFieldBlur = async () => {
    if (!editing) return;

    const currentValue = getFieldValue(editing as keyof PrepProject);
    if (currentValue !== editValue) {
      await updateProject(project.id, {
        [editing]: editValue.trim() || undefined,
      });
    }

    setEditing(null);
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFieldBlur();
    } else if (e.key === 'Escape') {
      setEditing(null);
    }
  };

  const renderField = (
    label: string,
    field: keyof PrepProject,
    placeholder: string = 'Not specified'
  ) => {
    const value = getFieldValue(field);
    const isEditing = editing === field;

    return (
      <div>
        <span className="text-gray-500 text-sm">{label}:</span>{' '}
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFieldBlur}
            onKeyDown={handleFieldKeyDown}
            className="inline-block px-2 py-1 bg-gray-600 border border-blue-500 rounded text-sm text-white focus:outline-none"
            autoFocus
          />
        ) : (
          <span
            onClick={() => handleFieldClick(field)}
            className={`${
              isLinked
                ? 'text-gray-400 cursor-default'
                : 'text-gray-300 cursor-pointer hover:text-gray-200 hover:bg-gray-700 rounded px-1 py-0.5 transition'
            } ${!value && !isLinked ? 'italic' : ''}`}
          >
            {value || placeholder}
          </span>
        )}
        {isLinked && (
          <span className="ml-2 text-xs text-blue-400">(from parent project)</span>
        )}
      </div>
    );
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Not set';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Project Metadata</h2>
        {isLinked && (
          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
            Linked to Parent Project
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Management */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Management</h3>
          <div className="space-y-2 pl-2">
            {renderField('General Manager', 'gm_name', '+ Add GM')}
            {getFieldValue('gm_name') && (
              <>
                {renderField('  Email', 'gm_email', '+ Add email')}
                {renderField('  Phone', 'gm_phone', '+ Add phone')}
              </>
            )}
            {renderField('Production Manager', 'pm_name', '+ Add PM')}
            {getFieldValue('pm_name') && (
              <>
                {renderField('  Email', 'pm_email', '+ Add email')}
                {renderField('  Phone', 'pm_phone', '+ Add phone')}
              </>
            )}
          </div>
        </div>

        {/* Design Team */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Design Team</h3>
          <div className="space-y-2 pl-2">
            {/* Lighting - always show if lighting is a discipline */}
            {disciplines.includes('lighting') && (
              <>
                {renderField('Lighting Designer', 'ld_name', '+ Add LD')}
                {getFieldValue('ld_name') && (
                  <>
                    {renderField('  Email', 'ld_email', '+ Add email')}
                    {renderField('  Phone', 'ld_phone', '+ Add phone')}
                  </>
                )}
                {renderField('Associate LD', 'ald_name', '+ Add ALD')}
                {getFieldValue('ald_name') && (
                  <>
                    {renderField('  Email', 'ald_email', '+ Add email')}
                    {renderField('  Phone', 'ald_phone', '+ Add phone')}
                  </>
                )}
                {renderField('Production Electrician', 'pe_name', '+ Add PE')}
                {getFieldValue('pe_name') && (
                  <>
                    {renderField('  Email', 'pe_email', '+ Add email')}
                    {renderField('  Phone', 'pe_phone', '+ Add phone')}
                  </>
                )}
              </>
            )}

            {/* Audio - show if audio is a discipline */}
            {disciplines.includes('audio') && (
              <>
                <div className="mt-3 text-gray-500 text-xs">Audio Team</div>
                {isLinked && parentProject ? (
                  <>
                    <div>
                      <span className="text-gray-500 text-sm">Audio Designer:</span>{' '}
                      <span className="text-gray-400">
                        {parentProject.audio_designer || 'Not specified'}
                      </span>
                      <span className="ml-2 text-xs text-blue-400">(from parent project)</span>
                    </div>
                    {parentProject.audio_designer_email && (
                      <div>
                        <span className="text-gray-500 text-sm">  Email:</span>{' '}
                        <span className="text-gray-400">{parentProject.audio_designer_email}</span>
                      </div>
                    )}
                    {parentProject.audio_designer_phone && (
                      <div>
                        <span className="text-gray-500 text-sm">  Phone:</span>{' '}
                        <span className="text-gray-400">{parentProject.audio_designer_phone}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 text-sm">Audio Tech:</span>{' '}
                      <span className="text-gray-400">
                        {parentProject.audio_tech || 'Not specified'}
                      </span>
                      <span className="ml-2 text-xs text-blue-400">(from parent project)</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic pl-2">
                    Audio contacts will be available when linked to a parent project
                  </div>
                )}
              </>
            )}

            {/* Video - show if video is a discipline */}
            {disciplines.includes('video') && (
              <>
                <div className="mt-3 text-gray-500 text-xs">Video Team</div>
                {isLinked && parentProject ? (
                  <>
                    <div>
                      <span className="text-gray-500 text-sm">Video Designer:</span>{' '}
                      <span className="text-gray-400">
                        {parentProject.video_designer || 'Not specified'}
                      </span>
                      <span className="ml-2 text-xs text-blue-400">(from parent project)</span>
                    </div>
                    {parentProject.video_designer_email && (
                      <div>
                        <span className="text-gray-500 text-sm">  Email:</span>{' '}
                        <span className="text-gray-400">{parentProject.video_designer_email}</span>
                      </div>
                    )}
                    {parentProject.video_designer_phone && (
                      <div>
                        <span className="text-gray-500 text-sm">  Phone:</span>{' '}
                        <span className="text-gray-400">{parentProject.video_designer_phone}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 text-sm">Video Tech:</span>{' '}
                      <span className="text-gray-400">
                        {parentProject.video_tech || 'Not specified'}
                      </span>
                      <span className="ml-2 text-xs text-blue-400">(from parent project)</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic pl-2">
                    Video contacts will be available when linked to a parent project
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Dates */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Dates</h3>
          <div className="space-y-2 pl-2">
            <div>
              <span className="text-gray-500 text-sm">Order Date:</span>{' '}
              <span className="text-gray-300">{formatDate(project.order_date)}</span>
            </div>
            {project.original_order_date && (
              <div>
                <span className="text-gray-500 text-sm">Original Order Date:</span>{' '}
                <span className="text-gray-300">{formatDate(project.original_order_date)}</span>
              </div>
            )}
            {isLinked && parentProject?.show_dates && (
              <>
                <div className="mt-2 text-gray-500 text-xs">Show Dates (from parent project)</div>
                {parentProject.show_dates.load_in && (
                  <div>
                    <span className="text-gray-500 text-sm">  Load In:</span>{' '}
                    <span className="text-gray-400">{parentProject.show_dates.load_in}</span>
                  </div>
                )}
                {parentProject.show_dates.tech && (
                  <div>
                    <span className="text-gray-500 text-sm">  Tech:</span>{' '}
                    <span className="text-gray-400">{parentProject.show_dates.tech}</span>
                  </div>
                )}
                {parentProject.show_dates.opening && (
                  <div>
                    <span className="text-gray-500 text-sm">  Opening:</span>{' '}
                    <span className="text-gray-400">{parentProject.show_dates.opening}</span>
                  </div>
                )}
                {parentProject.show_dates.closing && (
                  <div>
                    <span className="text-gray-500 text-sm">  Closing:</span>{' '}
                    <span className="text-gray-400">{parentProject.show_dates.closing}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
