import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePrepStore } from '../../store/prepStore';
import { useProjectStore } from '../../store/projectStore';
import { NewPrepProjectDialog } from '../../components/prep/NewPrepProjectDialog';
import { PrepProjectCard } from '../../components/prep/PrepProjectCard';
import { SectionList } from '../../components/prep/SectionList';
import { AddSectionDialog } from '../../components/prep/AddSectionDialog';
import { EditSectionDialog } from '../../components/prep/EditSectionDialog';
import type { PrepSection, Discipline, PrepProject } from '../../types/prep';

export function Prep() {
  const navigate = useNavigate();
  const { projectId: parentProjectId } = useParams<{ projectId?: string }>();
  const { allProjects, currentProject, sections, revisions, loadAllProjects, loadProject, clearCurrentProject, updateProject } =
    usePrepStore();
  const { projects, loadProjects } = useProjectStore();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showEditSectionDialog, setShowEditSectionDialog] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<PrepSection | null>(null);

  // State for inline editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleBackClick = () => {
    if (parentProjectId) {
      navigate(`/project/${parentProjectId}`);
    } else {
      navigate('/');
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  useEffect(() => {
    // Load all prep projects and parent projects on mount
    loadAllProjects();
    loadProjects();
  }, []);

  const handleProjectClick = async (projectId: string) => {
    await loadProject(projectId);
  };

  const handleBackToList = () => {
    clearCurrentProject();
  };

  const handleNewProject = () => {
    setShowNewProjectDialog(true);
  };

  const handleProjectCreated = async (projectId: string) => {
    await loadProject(projectId);
  };

  const handleEditSection = (section: PrepSection) => {
    setSectionToEdit(section);
    setShowEditSectionDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditSectionDialog(false);
    setSectionToEdit(null);
  };

  // Inline editing helpers
  const handleFieldClick = (field: string, value: string | undefined, isLinked: boolean) => {
    if (isLinked) return; // Read-only if linked to parent
    setEditingField(field);
    setEditValue(value || '');
  };

  // Format phone number (US format)
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return value;
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    if (!email) return true; // Empty is OK
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleFieldBlur = async () => {
    if (!editingField || !currentProject) return;

    let finalValue = editValue.trim();

    // Format phone numbers
    if (editingField.includes('_phone') && finalValue) {
      finalValue = formatPhoneNumber(finalValue);
    }

    // Validate email
    if (editingField.includes('_email') && finalValue && !isValidEmail(finalValue)) {
      alert('Please enter a valid email address');
      setEditingField(null);
      return;
    }

    const currentValue = (currentProject as any)[editingField];
    if (currentValue !== finalValue) {
      await updateProject(currentProject.id, {
        [editingField]: finalValue || undefined,
      });
    }

    setEditingField(null);
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFieldBlur();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  // If a project is loaded, show the project view
  if (currentProject) {
    // Find parent project if linked
    const parentProject = currentProject.parent_project_id
      ? projects.find((p) => p.id === currentProject.parent_project_id)
      : null;
    const isLinked = !!parentProject;
    const disciplines = JSON.parse(currentProject.disciplines as any || '[]') as Discipline[];

    // Helper to get field value (from parent if linked, otherwise from prep project)
    const getFieldValue = (field: keyof PrepProject): string => {
      if (isLinked && parentProject) {
        // Map prep project fields to parent project fields
        // Company fields are NOT included - they always come from currentProject
        switch (field) {
          case 'gm_name': return parentProject.general_manager || '';
          case 'gm_email': return parentProject.general_manager_email || '';
          case 'gm_phone': return parentProject.general_manager_phone || '';
          case 'pm_name': return parentProject.production_manager || '';
          case 'pm_email': return parentProject.production_manager_email || '';
          case 'pm_phone': return parentProject.production_manager_phone || '';
          case 'ld_name': return parentProject.lighting_designer || '';
          case 'ld_email': return parentProject.lighting_designer_email || '';
          case 'ld_phone': return parentProject.lighting_designer_phone || '';
          case 'pe_name': return parentProject.electrician || '';
          case 'pe_email': return parentProject.electrician_email || '';
          case 'pe_phone': return parentProject.electrician_phone || '';
          case 'venue': return parentProject.venue || '';
          // For fields not in parent project, fall through to get from currentProject
          default: break;
        }
      }
      // Always get from currentProject if not linked or field not in parent
      return (currentProject[field] as string) || '';
    };

    // Helper to check if a specific field is read-only (pulling from parent)
    const isFieldReadOnly = (field: keyof PrepProject): boolean => {
      if (!isLinked || !parentProject) return false;

      // Only these fields are read-only when linked (fields that pull from parent)
      // Company fields are NOT included - they should be editable even when linked
      const parentFields: (keyof PrepProject)[] = [
        'gm_name', 'gm_email', 'gm_phone',
        'pm_name', 'pm_email', 'pm_phone',
        'ld_name', 'ld_email', 'ld_phone',
        'pe_name', 'pe_email', 'pe_phone',
        'venue', 'venue_city', 'venue_state'
      ];

      return parentFields.includes(field);
    };

    // Helper to render an editable field inline (no label wrapper)
    const renderInlineField = (field: keyof PrepProject, placeholder = '+ Add', className = '') => {
      const value = getFieldValue(field);
      const isEditing = editingField === field;
      const fieldIsReadOnly = isFieldReadOnly(field);

      if (isEditing) {
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFieldBlur}
            onKeyDown={handleFieldKeyDown}
            className={`px-2 py-1 bg-gray-600 border border-blue-500 rounded text-sm text-white focus:outline-none ${className}`}
            autoFocus
          />
        );
      }

      return (
        <span
          onClick={() => handleFieldClick(field, value, fieldIsReadOnly)}
          className={`${
            fieldIsReadOnly
              ? 'text-gray-400 cursor-default'
              : 'cursor-pointer hover:text-gray-200 hover:bg-gray-700 rounded px-2 py-1 transition'
          } ${!value && !fieldIsReadOnly ? 'italic text-gray-500' : 'text-gray-300'} ${className}`}
        >
          {value || placeholder}
          {fieldIsReadOnly && value && <span className="ml-2 text-xs text-blue-400">(from parent)</span>}
        </span>
      );
    };

    // Helper to render an editable field with label (for backwards compatibility)
    const renderField = (label: string, field: keyof PrepProject, placeholder = '+ Add') => {
      const value = getFieldValue(field);
      const isEditing = editingField === field;
      const fieldIsReadOnly = isFieldReadOnly(field);

      return (
        <div>
          {label && <span className="text-gray-500 text-sm">{label}:</span>}{' '}
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
              onClick={() => handleFieldClick(field, value, fieldIsReadOnly)}
              className={`${
                fieldIsReadOnly
                  ? 'text-gray-400 cursor-default'
                  : 'text-gray-300 cursor-pointer hover:text-gray-200 hover:bg-gray-700 rounded px-1 py-0.5 transition'
              } ${!value && !fieldIsReadOnly ? 'italic text-gray-500' : ''}`}
            >
              {value || placeholder}
            </span>
          )}
          {fieldIsReadOnly && value && (
            <span className="ml-2 text-xs text-blue-400">(from parent)</span>
          )}
        </div>
      );
    };

    // Get latest revision date
    const latestRevision = revisions.length > 0
      ? revisions.reduce((latest, rev) => rev.revision_date > latest.revision_date ? rev : latest)
      : null;

    return (
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToList}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              >
                ← Back to Projects
              </button>
              <h1 className="text-2xl font-bold">{currentProject.production_name}</h1>
              {currentProject.current_revision > 0 && (
                <span className="px-2 py-1 bg-blue-600 text-white text-sm rounded">
                  Revision {currentProject.current_revision}
                </span>
              )}
              {isLinked && (
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                  Linked to Parent Project
                </span>
              )}
            </div>
            <button
              onClick={handleHomeClick}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              title="Home (Projects)"
            >
              🏠
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Project Details */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              {/* Header with dates on right */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Project Details</h2>
                <div className="text-xs text-gray-400">
                  Created: {new Date(currentProject.created_at).toLocaleDateString()}
                  {latestRevision && (
                    <> | Last Revised: {new Date(latestRevision.revision_date).toLocaleDateString()}</>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Production Info - 1 Row */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                  <div className="flex items-center gap-8">
                    <div>
                      <span className="text-gray-500 text-sm">Show:</span>{' '}
                      <span className="text-gray-300 font-medium text-base">{currentProject.production_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">Venue:</span>{' '}
                      <span className="text-base">
                        {renderInlineField('venue', '+ Venue Name', 'inline-block min-w-[120px]')}
                      </span>
                      {getFieldValue('venue') && (
                        <>
                          <span className="text-base">
                            {renderInlineField('venue_city', '+ City', 'inline-block min-w-[80px]')}
                          </span>
                          <span className="text-base">
                            {renderInlineField('venue_state', '+ ST', 'inline-block min-w-[40px]')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-500">Disciplines:</span>{' '}
                    {disciplines.map((d) => d.charAt(0).toUpperCase()).join('/')}
                  </div>
                </div>

                {/* Management - Each Person in a Row */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Management</h3>
                  <div className="space-y-2">
                    {/* GM Row */}
                    <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                      <span className="text-gray-500">General Manager</span>
                      <div>
                        {renderInlineField('gm_name', '+ Name')}
                      </div>
                      <div className="flex gap-4">
                        {renderInlineField('gm_company', '+ Company')}
                        {getFieldValue('gm_name') && (
                          <>
                            {renderInlineField('gm_email', '+ Email')}
                            {renderInlineField('gm_phone', '+ Phone')}
                          </>
                        )}
                      </div>
                    </div>
                    {/* PM Row */}
                    <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                      <span className="text-gray-500">Production Manager</span>
                      <div>
                        {renderInlineField('pm_name', '+ Name')}
                      </div>
                      <div className="flex gap-4">
                        {renderInlineField('pm_company', '+ Company')}
                        {getFieldValue('pm_name') && (
                          <>
                            {renderInlineField('pm_email', '+ Email')}
                            {renderInlineField('pm_phone', '+ Phone')}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Design Team - Each Person in a Row */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Design Team</h3>
                  <div className="space-y-2">
                    {disciplines.includes('lighting') && (
                      <>
                        {/* LD Row */}
                        <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                          <span className="text-gray-500">Lighting Designer</span>
                          <div>
                            {renderInlineField('ld_name', '+ Name')}
                          </div>
                          <div className="flex gap-4">
                            {getFieldValue('ld_name') && (
                              <>
                                {renderInlineField('ld_email', '+ Email')}
                                {renderInlineField('ld_phone', '+ Phone')}
                              </>
                            )}
                          </div>
                        </div>
                        {/* ALD Row */}
                        <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                          <span className="text-gray-500">Associate LD</span>
                          <div>
                            {renderInlineField('ald_name', '+ Name')}
                          </div>
                          <div className="flex gap-4">
                            {getFieldValue('ald_name') && (
                              <>
                                {renderInlineField('ald_email', '+ Email')}
                                {renderInlineField('ald_phone', '+ Phone')}
                              </>
                            )}
                          </div>
                        </div>
                        {/* PE Row */}
                        <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                          <span className="text-gray-500">Production Elec.</span>
                          <div>
                            {renderInlineField('pe_name', '+ Name')}
                          </div>
                          <div className="flex gap-4">
                            {getFieldValue('pe_name') && (
                              <>
                                {renderInlineField('pe_email', '+ Email')}
                                {renderInlineField('pe_phone', '+ Phone')}
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {disciplines.includes('audio') && isLinked && parentProject?.audio_designer && (
                      <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                        <span className="text-gray-500">Audio Designer</span>
                        <span className="text-gray-400">{parentProject.audio_designer}</span>
                        <div className="text-gray-400">
                          {parentProject.audio_designer_email && <span>{parentProject.audio_designer_email}</span>}
                          {parentProject.audio_designer_phone && <span className="ml-4">{parentProject.audio_designer_phone}</span>}
                          <span className="ml-2 text-xs text-blue-400">(from parent)</span>
                        </div>
                      </div>
                    )}
                    {disciplines.includes('video') && isLinked && parentProject?.video_designer && (
                      <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                        <span className="text-gray-500">Video Designer</span>
                        <span className="text-gray-400">{parentProject.video_designer}</span>
                        <div className="text-gray-400">
                          {parentProject.video_designer_email && <span>{parentProject.video_designer_email}</span>}
                          {parentProject.video_designer_phone && <span className="ml-4">{parentProject.video_designer_phone}</span>}
                          <span className="ml-2 text-xs text-blue-400">(from parent)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Show Dates - 2 Rows: Header and Values */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Show Dates</h3>
                  <div className="grid grid-cols-7 gap-2 text-xs">
                    {/* Header Row */}
                    <div className="text-gray-500 font-medium">Prep Start</div>
                    <div className="text-gray-500 font-medium">Prep End</div>
                    <div className="text-gray-500 font-medium">Load In</div>
                    <div className="text-gray-500 font-medium">First Preview</div>
                    <div className="text-gray-500 font-medium">Opening</div>
                    <div className="text-gray-500 font-medium">Closing</div>
                    <div className="text-gray-500 font-medium">Load Out</div>

                    {/* Values Row */}
                    {renderInlineField('prep_start_date', '—')}
                    {renderInlineField('prep_end_date', '—')}
                    {renderInlineField('load_in_date', '—')}
                    {renderInlineField('first_preview_date', '—')}
                    {renderInlineField('opening_night_date', '—')}
                    {renderInlineField('closing_date', '—')}
                    {renderInlineField('load_out_date', '—')}
                  </div>
                </div>
              </div>
            </div>

            {/* Sections List */}
            <SectionList
              projectId={currentProject.id}
              sections={sections}
              onAddSection={() => setShowAddSectionDialog(true)}
              onEditSection={handleEditSection}
            />
          </div>

          {/* Add Section Dialog */}
          <AddSectionDialog
            isOpen={showAddSectionDialog}
            onClose={() => setShowAddSectionDialog(false)}
            projectId={currentProject.id}
            projectDisciplines={JSON.parse(currentProject.disciplines || '[]') as Discipline[]}
          />

          {/* Edit Section Dialog */}
          <EditSectionDialog
            isOpen={showEditSectionDialog}
            onClose={handleCloseEditDialog}
            section={sectionToEdit}
            projectDisciplines={JSON.parse(currentProject.disciplines || '[]') as Discipline[]}
          />
        </main>
      </div>
    );
  }

  // Show project list
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              title={parentProjectId ? "Back to Project" : "Back to Projects"}
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">ShowStack:Prep</h1>
            <span className="text-sm text-gray-400">Equipment Orders & Specifications</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNewProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition"
            >
              + New Shop Order
            </button>
            <button
              onClick={handleHomeClick}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              title="Home (Projects)"
            >
              🏠
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {allProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold mb-2">No Shop Orders Yet</h2>
              <p className="text-gray-400 mb-6">
                Create your first equipment order to get started
              </p>
              <button
                onClick={handleNewProject}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition"
              >
                Create First Shop Order
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                All Projects ({allProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProjects.map((project) => (
                  <PrepProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <NewPrepProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onProjectCreated={handleProjectCreated}
        parentProjectId={parentProjectId}
      />
    </div>
  );
}
