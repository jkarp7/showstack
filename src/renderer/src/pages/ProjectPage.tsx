import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleCard } from '../components/common/ModuleCard';
import { useProjectStore } from '../store/projectStore';

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, loadProjects, setCurrentProject } = useProjectStore();
  const [project, setProject] = useState(projects.find(p => p.id === projectId) || null);

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
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Projects
          </button>
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
                <p className="text-gray-300">
                  <span className="text-gray-500">Venue:</span> {project.venue}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Project Metadata Section - Placeholder for Phase 2 */}
          {project.lighting_designer && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Project Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {project.lighting_designer && (
                  <div>
                    <span className="text-gray-500">Lighting Designer:</span>{' '}
                    <span className="text-gray-300">{project.lighting_designer}</span>
                  </div>
                )}
                {project.production_manager && (
                  <div>
                    <span className="text-gray-500">Production Manager:</span>{' '}
                    <span className="text-gray-300">
                      {project.production_manager}
                      {project.production_manager_company && ` (${project.production_manager_company})`}
                    </span>
                  </div>
                )}
              </div>
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
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 text-center text-sm text-gray-400">
        ShowStack v0.1.0-alpha | © 2025 Lytrix
      </footer>
    </div>
  );
}
