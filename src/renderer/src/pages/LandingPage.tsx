import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleCard } from '../components/ModuleCard';
import { ProjectCard } from '../components/ProjectCard';
import { NewProjectDialog } from '../components/NewProjectDialog';
import { DeleteProjectDialog } from '../components/DeleteProjectDialog';
import { useProjectStore, Project } from '../store/projectStore';

export function LandingPage() {
  const navigate = useNavigate();
  const { projects, loadProjects, createProject, deleteProject, setCurrentProject } = useProjectStore();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (name: string, description: string, logoPath: string, enabledModules: string[]) => {
    try {
      await createProject(name, description, logoPath, enabledModules);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleOpenProject = (projectId: string) => {
    setCurrentProject(projectId);
    // Navigate to the last used module or default to production
    navigate('/modules/production');
  };

  const handleDeleteProject = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete.id);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ShowStack</h1>
            <p className="text-gray-400 text-sm mt-1">Production Management Suite</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-gray-300 hover:text-white transition">
              Account
            </button>
            <button className="px-4 py-2 text-gray-300 hover:text-white transition">
              Settings
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Projects Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Projects</h2>
                <p className="text-gray-400">Create or select a project to get started</p>
              </div>
              <button
                onClick={() => setIsNewProjectDialogOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                New Project
              </button>
            </div>

            {/* Recent Projects Grid */}
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => handleOpenProject(project.id)}
                    onDelete={() => setProjectToDelete(project)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                <div className="text-6xl mb-4">📂</div>
                <p className="text-gray-400 text-lg mb-4">No projects yet</p>
                <p className="text-gray-500 text-sm mb-6">
                  Create your first project to start working with ShowStack
                </p>
                <button
                  onClick={() => setIsNewProjectDialogOpen(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition inline-flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  Create Your First Project
                </button>
              </div>
            )}
          </div>

          {/* Modules Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Modules</h2>
              <p className="text-gray-400">Available tools in your subscription</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ModuleCard
                name="ShowStack:Prep"
                description="Lighting design, visualization, and plot creation"
                icon="✏️"
                route="/modules/prep"
                isLocked={true}
              />

              <ModuleCard
                name="ShowStack:Production"
                description="Production management, fixtures, and technical planning"
                icon="🎬"
                route="/modules/production"
                isLocked={false}
              />

              <ModuleCard
                name="ShowStack:Manager"
                description="Tour management, scheduling, and logistics"
                icon="🚐"
                route="/modules/manager"
                isLocked={true}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 text-center text-sm text-gray-400">
        ShowStack v0.1.0-alpha | © 2025 Lytrix
      </footer>

      {/* New Project Dialog */}
      <NewProjectDialog
        isOpen={isNewProjectDialogOpen}
        onClose={() => setIsNewProjectDialogOpen(false)}
        onCreate={handleCreateProject}
      />

      {/* Delete Project Dialog */}
      <DeleteProjectDialog
        isOpen={projectToDelete !== null}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}
