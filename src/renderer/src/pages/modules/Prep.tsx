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

  const handleFieldBlur = async () => {
    if (!editingField || !currentProject) return;

    const currentValue = (currentProject as any)[editingField];
    if (currentValue !== editValue) {
      await updateProject(currentProject.id, {
        [editingField]: editValue.trim() || undefined,
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
          default: return '';
        }
      }
      return (currentProject[field] as string) || '';
    };

    // Helper to render an editable field
    const renderField = (label: string, field: keyof PrepProject, placeholder = '+ Add') => {
      const value = getFieldValue(field);
      const isEditing = editingField === field;

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
              onClick={() => handleFieldClick(field, value, isLinked)}
              className={`${
                isLinked
                  ? 'text-gray-400 cursor-default'
                  : 'text-gray-300 cursor-pointer hover:text-gray-200 hover:bg-gray-700 rounded px-1 py-0.5 transition'
              } ${!value && !isLinked ? 'italic text-gray-500' : ''}`}
            >
              {value || placeholder}
            </span>
          )}
          {isLinked && value && (
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
              <h2 className="text-xl font-bold mb-4">Project Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Production Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Production</h3>
                    <div className="space-y-2 pl-2 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>{' '}
                        <span className="text-gray-300">{currentProject.production_name}</span>
                      </div>
                      {currentProject.venue && (
                        <div>
                          <span className="text-gray-500">Venue:</span>{' '}
                          <span className="text-gray-300">
                            {currentProject.venue}
                            {currentProject.venue_city && `, ${currentProject.venue_city}`}
                            {currentProject.venue_state && `, ${currentProject.venue_state}`}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Disciplines:</span>{' '}
                        <span className="text-gray-300">
                          {disciplines.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Management */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Management</h3>
                    <div className="space-y-2 pl-2 text-sm">
                      {renderField('General Manager', 'gm_name')}
                      {getFieldValue('gm_name') && (
                        <>
                          {renderField('  Email', 'gm_email')}
                          {renderField('  Phone', 'gm_phone')}
                        </>
                      )}
                      {renderField('Production Manager', 'pm_name')}
                      {getFieldValue('pm_name') && (
                        <>
                          {renderField('  Email', 'pm_email')}
                          {renderField('  Phone', 'pm_phone')}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Design Team */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Design Team</h3>
                    <div className="space-y-2 pl-2 text-sm">
                      {disciplines.includes('lighting') && (
                        <>
                          {renderField('Lighting Designer', 'ld_name')}
                          {getFieldValue('ld_name') && (
                            <>
                              {renderField('  Email', 'ld_email')}
                              {renderField('  Phone', 'ld_phone')}
                            </>
                          )}
                          {renderField('Associate LD', 'ald_name')}
                          {getFieldValue('ald_name') && (
                            <>
                              {renderField('  Email', 'ald_email')}
                              {renderField('  Phone', 'ald_phone')}
                            </>
                          )}
                          {renderField('Production Electrician', 'pe_name')}
                          {getFieldValue('pe_name') && (
                            <>
                              {renderField('  Email', 'pe_email')}
                              {renderField('  Phone', 'pe_phone')}
                            </>
                          )}
                        </>
                      )}
                      {disciplines.includes('audio') && isLinked && parentProject && (
                        <>
                          <div className="text-gray-500 text-xs mt-2">Audio Team</div>
                          <div>
                            <span className="text-gray-500 text-sm">Audio Designer:</span>{' '}
                            <span className="text-gray-400">{parentProject.audio_designer || 'Not specified'}</span>
                            <span className="ml-2 text-xs text-blue-400">(from parent)</span>
                          </div>
                        </>
                      )}
                      {disciplines.includes('video') && isLinked && parentProject && (
                        <>
                          <div className="text-gray-500 text-xs mt-2">Video Team</div>
                          <div>
                            <span className="text-gray-500 text-sm">Video Designer:</span>{' '}
                            <span className="text-gray-400">{parentProject.video_designer || 'Not specified'}</span>
                            <span className="ml-2 text-xs text-blue-400">(from parent)</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Dates */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Dates</h3>
                    <div className="space-y-2 pl-2 text-sm">
                      <div>
                        <span className="text-gray-500">Order Created:</span>{' '}
                        <span className="text-gray-300">
                          {new Date(currentProject.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {latestRevision && (
                        <div>
                          <span className="text-gray-500">Latest Revision:</span>{' '}
                          <span className="text-gray-300">
                            {new Date(latestRevision.revision_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Show Dates</h3>
                    <div className="space-y-2 pl-2 text-sm">
                      {renderField('Prep Start', 'prep_start_date')}
                      {renderField('Prep End', 'prep_end_date')}
                      {renderField('Load In', 'load_in_date')}
                      {renderField('First Preview', 'first_preview_date')}
                      {renderField('Opening Night', 'opening_night_date')}
                      {renderField('Closing', 'closing_date')}
                      {renderField('Load Out', 'load_out_date')}
                    </div>
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
