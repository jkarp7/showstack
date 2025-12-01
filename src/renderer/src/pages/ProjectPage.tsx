import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleCard } from '../components/common/ModuleCard';
import { EditProjectDialog } from '../components/common/EditProjectDialog';
import { useProjectStore, Project } from '../store/projectStore';

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, loadProjects, updateProject, setCurrentProject } = useProjectStore();
  const [project, setProject] = useState(projects.find(p => p.id === projectId) || null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!projects.length) {
      loadProjects();
    }
  }, [projects.length, loadProjects]);

  useEffect(() => {
    const foundProject = projects.find(p => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
      setCurrentProject(projectId!);
    }
  }, [projects, projectId, setCurrentProject]);

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      await updateProject(projectId, updates);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const enabledModules = project.enabled_modules || ['production'];

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white flex items-center gap-2"
            >
              ← Back to Projects
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/account')}
                className="px-4 py-2 text-gray-300 hover:text-white transition"
              >
                Account
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-2 text-gray-300 hover:text-white transition"
              >
                Settings
              </button>
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
              >
                Edit Project
              </button>
            </div>
          </div>
          <div className="flex items-start gap-6">
            {/* Project Logo */}
            {project.logo_path ? (
              <img
                src={project.logo_path}
                alt={project.name}
                className="w-24 h-24 rounded-lg object-cover bg-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-700 flex items-center justify-center text-4xl">
                📁
              </div>
            )}

            {/* Project Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-gray-400 mb-3">{project.description}</p>
              )}
              {project.venue && (
                <div className="flex gap-2">
                  <span className="text-gray-500">Venue:</span>
                  <div className="flex-1">
                    <p className="text-gray-300">{project.venue}</p>
                    {(project.venue_city || project.venue_state) && (
                      <p className="text-gray-400 text-sm">
                        {project.venue_city}{project.venue_city && project.venue_state ? ', ' : ''}{project.venue_state}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Project Metadata Section */}
          {(project.lighting_designer || project.audio_designer || project.video_designer ||
            project.electrician || project.audio_tech || project.video_tech ||
            project.production_manager || project.general_manager ||
            project.show_dates) && (
            <div className="mb-8 space-y-6">
              {/* Design Team */}
              {(project.lighting_designer || project.audio_designer || project.video_designer) && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h2 className="text-xl font-bold mb-4 text-blue-400">Design Team</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {project.lighting_designer && (
                      <div className="space-y-1">
                        <div className="text-gray-500 text-xs font-medium uppercase">Lighting Designer</div>
                        <div className="text-gray-200 font-medium">{project.lighting_designer}</div>
                        {project.lighting_designer_email && (
                          <div className="text-gray-400 text-sm">{project.lighting_designer_email}</div>
                        )}
                        {project.lighting_designer_phone && (
                          <div className="text-gray-400 text-sm">{project.lighting_designer_phone}</div>
                        )}
                        {/* Associate Lighting Designers */}
                        {project.lighting_associates && (() => {
                          try {
                            const associates = typeof project.lighting_associates === 'string'
                              ? JSON.parse(project.lighting_associates)
                              : project.lighting_associates;
                            if (Array.isArray(associates) && associates.length > 0) {
                              return (
                                <div className="mt-3 pt-2 border-t border-gray-700">
                                  <div className="text-gray-500 text-xs font-medium uppercase mb-2">Associates</div>
                                  {associates.map((assoc: any, idx: number) => (
                                    <div key={idx} className="mb-2">
                                      <div className="text-gray-300 text-sm">{assoc.name}</div>
                                      {assoc.email && <div className="text-gray-400 text-xs">{assoc.email}</div>}
                                      {assoc.phone && <div className="text-gray-400 text-xs">{assoc.phone}</div>}
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                          } catch (e) {
                            return null;
                          }
                          return null;
                        })()}
                      </div>
                    )}
                    {project.audio_designer && (
                      <div className="space-y-1">
                        <div className="text-gray-500 text-xs font-medium uppercase">Audio Designer</div>
                        <div className="text-gray-200 font-medium">{project.audio_designer}</div>
                        {project.audio_designer_email && (
                          <div className="text-gray-400 text-sm">{project.audio_designer_email}</div>
                        )}
                        {project.audio_designer_phone && (
                          <div className="text-gray-400 text-sm">{project.audio_designer_phone}</div>
                        )}
                        {/* Associate Audio Designers */}
                        {project.audio_associates && (() => {
                          try {
                            const associates = typeof project.audio_associates === 'string'
                              ? JSON.parse(project.audio_associates)
                              : project.audio_associates;
                            if (Array.isArray(associates) && associates.length > 0) {
                              return (
                                <div className="mt-3 pt-2 border-t border-gray-700">
                                  <div className="text-gray-500 text-xs font-medium uppercase mb-2">Associates</div>
                                  {associates.map((assoc: any, idx: number) => (
                                    <div key={idx} className="mb-2">
                                      <div className="text-gray-300 text-sm">{assoc.name}</div>
                                      {assoc.email && <div className="text-gray-400 text-xs">{assoc.email}</div>}
                                      {assoc.phone && <div className="text-gray-400 text-xs">{assoc.phone}</div>}
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                          } catch (e) {
                            return null;
                          }
                          return null;
                        })()}
                      </div>
                    )}
                    {project.video_designer && (
                      <div className="space-y-1">
                        <div className="text-gray-500 text-xs font-medium uppercase">Video Designer</div>
                        <div className="text-gray-200 font-medium">{project.video_designer}</div>
                        {project.video_designer_email && (
                          <div className="text-gray-400 text-sm">{project.video_designer_email}</div>
                        )}
                        {project.video_designer_phone && (
                          <div className="text-gray-400 text-sm">{project.video_designer_phone}</div>
                        )}
                        {/* Associate Video Designers */}
                        {project.video_associates && (() => {
                          try {
                            const associates = typeof project.video_associates === 'string'
                              ? JSON.parse(project.video_associates)
                              : project.video_associates;
                            if (Array.isArray(associates) && associates.length > 0) {
                              return (
                                <div className="mt-3 pt-2 border-t border-gray-700">
                                  <div className="text-gray-500 text-xs font-medium uppercase mb-2">Associates</div>
                                  {associates.map((assoc: any, idx: number) => (
                                    <div key={idx} className="mb-2">
                                      <div className="text-gray-300 text-sm">{assoc.name}</div>
                                      {assoc.email && <div className="text-gray-400 text-xs">{assoc.email}</div>}
                                      {assoc.phone && <div className="text-gray-400 text-xs">{assoc.phone}</div>}
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                          } catch (e) {
                            return null;
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Production Staff */}
              {(project.electrician || project.audio_tech || project.video_tech ||
                project.production_manager || project.general_manager) && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h2 className="text-xl font-bold mb-4 text-blue-400">Production Staff</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {project.electrician && (
                      <div className="space-y-1">
                        <div className="text-gray-500 text-xs font-medium uppercase">Electrician</div>
                        <div className="text-gray-200 font-medium">{project.electrician}</div>
                        {project.electrician_email && (
                          <div className="text-gray-400 text-sm">{project.electrician_email}</div>
                        )}
                        {project.electrician_phone && (
                          <div className="text-gray-400 text-sm">{project.electrician_phone}</div>
                        )}
                      </div>
                    )}
                    {project.audio_tech && (
                      <div className="space-y-1">
                        <div className="text-gray-500 text-xs font-medium uppercase">Audio Tech</div>
                        <div className="text-gray-200 font-medium">{project.audio_tech}</div>
                        {project.audio_tech_email && (
                          <div className="text-gray-400 text-sm">{project.audio_tech_email}</div>
                        )}
                        {project.audio_tech_phone && (
                          <div className="text-gray-400 text-sm">{project.audio_tech_phone}</div>
                        )}
                      </div>
                    )}
                    {project.video_tech && (
                      <div className="space-y-1">
                        <div className="text-gray-500 text-xs font-medium uppercase">Video Tech</div>
                        <div className="text-gray-200 font-medium">{project.video_tech}</div>
                        {project.video_tech_email && (
                          <div className="text-gray-400 text-sm">{project.video_tech_email}</div>
                        )}
                        {project.video_tech_phone && (
                          <div className="text-gray-400 text-sm">{project.video_tech_phone}</div>
                        )}
                      </div>
                    )}
                    {project.production_manager && (
                      <div className="space-y-1">
                        <div className="text-gray-500 text-xs font-medium uppercase">Production Manager</div>
                        <div className="text-gray-200 font-medium">
                          {project.production_manager}
                          {project.production_manager_company && (
                            <span className="text-gray-400 text-sm block mt-0.5">
                              {project.production_manager_company}
                            </span>
                          )}
                        </div>
                        {project.production_manager_email && (
                          <div className="text-gray-400 text-sm">{project.production_manager_email}</div>
                        )}
                        {project.production_manager_phone && (
                          <div className="text-gray-400 text-sm">{project.production_manager_phone}</div>
                        )}
                      </div>
                    )}
                    {project.general_manager && (
                      <div className="space-y-1">
                        <div className="text-gray-500 text-xs font-medium uppercase">General Manager</div>
                        <div className="text-gray-200 font-medium">
                          {project.general_manager}
                          {project.general_manager_company && (
                            <span className="text-gray-400 text-sm block mt-0.5">
                              {project.general_manager_company}
                            </span>
                          )}
                        </div>
                        {project.general_manager_email && (
                          <div className="text-gray-400 text-sm">{project.general_manager_email}</div>
                        )}
                        {project.general_manager_phone && (
                          <div className="text-gray-400 text-sm">{project.general_manager_phone}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Show Dates */}
              {project.show_dates && Object.keys(project.show_dates).length > 0 && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h2 className="text-xl font-bold mb-4 text-blue-400">Show Dates</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm">
                    {project.show_dates.prep_start && (
                      <div>
                        <span className="text-gray-500 block">Prep Start</span>
                        <span className="text-gray-300">
                          {new Date(project.show_dates.prep_start).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.show_dates.prep_end && (
                      <div>
                        <span className="text-gray-500 block">Prep End</span>
                        <span className="text-gray-300">
                          {new Date(project.show_dates.prep_end).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.show_dates.load_in && (
                      <div>
                        <span className="text-gray-500 block">Load In</span>
                        <span className="text-gray-300">
                          {new Date(project.show_dates.load_in).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.show_dates.tech && (
                      <div>
                        <span className="text-gray-500 block">Tech</span>
                        <span className="text-gray-300">
                          {new Date(project.show_dates.tech).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.show_dates.previews && (
                      <div>
                        <span className="text-gray-500 block">Previews</span>
                        <span className="text-gray-300">
                          {new Date(project.show_dates.previews).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.show_dates.opening && (
                      <div>
                        <span className="text-gray-500 block">Opening</span>
                        <span className="text-gray-300">
                          {new Date(project.show_dates.opening).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.show_dates.closing && (
                      <div>
                        <span className="text-gray-500 block">Closing</span>
                        <span className="text-gray-300">
                          {new Date(project.show_dates.closing).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.show_dates.load_out && (
                      <div>
                        <span className="text-gray-500 block">Load Out</span>
                        <span className="text-gray-300">
                          {new Date(project.show_dates.load_out).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modules Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enabledModules.includes('production') && (
                <ModuleCard
                  name="ShowStack:Production"
                  description="Equipment management, channel hookup, and technical planning"
                  icon="🎬"
                  route={`/project/${projectId}/module/production`}
                  isLocked={false}
                />
              )}

              {enabledModules.includes('manager') && (
                <ModuleCard
                  name="ShowStack:Manager"
                  description="Tour management, scheduling, and logistics"
                  icon="🚐"
                  route={`/project/${projectId}/module/manager`}
                  isLocked={true}
                />
              )}

              {enabledModules.includes('design') && (
                <ModuleCard
                  name="ShowStack:Design"
                  description="Lighting design, visualization, and plot creation"
                  icon="✏️"
                  route={`/project/${projectId}/module/design`}
                  isLocked={true}
                />
              )}

              {enabledModules.includes('prep') && (
                <ModuleCard
                  name="ShowStack:Prep"
                  description="Equipment orders and specifications for rental houses"
                  icon="📋"
                  route={`/project/${projectId}/module/prep`}
                  isLocked={false}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 text-center text-sm text-gray-400">
        ShowStack v0.1.0-alpha | © 2025 Lytrix
      </footer>

      {/* Edit Project Dialog */}
      <EditProjectDialog
        isOpen={isEditDialogOpen}
        project={project}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleUpdateProject}
      />
    </div>
  );
}
