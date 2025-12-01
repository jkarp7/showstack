import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewProjectDialog } from '../components/common/NewProjectDialog';
import { DeleteProjectDialog } from '../components/common/DeleteProjectDialog';
import { ImportConflictDialog } from '../components/common/ImportConflictDialog';
import { AccountDialog } from '../components/License/Account/AccountDialog';
import { useProjectStore, Project } from '../store/projectStore';
import { useFileStore } from '../store/fileStore';
import { migrateLegacyRecentFiles } from '../utils/recentFiles';

export function LandingPage() {
  const navigate = useNavigate();
  const { projects, loadProjects, createProject, deleteProject, setCurrentProject } = useProjectStore();
  const { conflictInfo, conflictFilePath, resolveConflict } = useFileStore();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

  useEffect(() => {
    // Migrate legacy recent files on first load
    migrateLegacyRecentFiles();
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (name: string, description: string, logoPath: string, enabledModules: string[]) => {
    try {
      await createProject(name, description, logoPath, enabledModules);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleOpenProject = async (projectId: string) => {
    try {
      setCurrentProject(projectId);
      // Open project in a new window
      await window.api.windows.openProject(projectId);
    } catch (error) {
      console.error('Failed to open project window:', error);
    }
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

  const handleResolveConflict = async (action: 'replace' | 'keep-both' | 'cancel') => {
    await resolveConflict(action, async () => {
      await loadProjects();
    });
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
                <p className="text-gray-400">Your ShowStack projects</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const { openFile } = useFileStore.getState();
                    await openFile(async () => {
                      await loadProjects();
                      // Stay on landing page after opening file
                    });
                  }}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition flex items-center gap-2"
                >
                  Open File...
                </button>
                <button
                  onClick={() => setIsNewProjectDialogOpen(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  New Project
                </button>
              </div>
            </div>

            {/* Projects Display */}
            {projects.length > 0 ? (
              projects.length <= 3 ? (
                /* Tile view for 3 or fewer projects */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-blue-500 transition cursor-pointer group"
                      onClick={() => handleOpenProject(project.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        {project.logo_path ? (
                          <img
                            src={project.logo_path}
                            alt={project.name}
                            className="w-16 h-16 rounded-lg object-cover bg-gray-700"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center text-3xl">
                            📁
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(project);
                          }}
                          className="text-gray-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                          title="Delete project"
                        >
                          ×
                        </button>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 truncate">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{project.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table view for more than 3 projects */
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-750 border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Date Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {projects.map((project) => (
                        <tr
                          key={project.id}
                          className="hover:bg-gray-750 cursor-pointer transition"
                          onClick={() => handleOpenProject(project.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {project.logo_path ? (
                                <img
                                  src={project.logo_path}
                                  alt={project.name}
                                  className="w-10 h-10 rounded-lg object-cover bg-gray-700 mr-3"
                                />
                              ) : (
                                <span className="text-2xl mr-3">📁</span>
                              )}
                              <span className="font-medium">{project.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                            {project.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                            {new Date(project.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectToDelete(project);
                              }}
                              className="text-gray-500 hover:text-red-500 transition text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                <div className="text-6xl mb-4">📂</div>
                <p className="text-gray-400 text-lg mb-4">No projects yet</p>
                <p className="text-gray-500 text-sm mb-6">
                  Create a new project to get started with ShowStack
                </p>
                <button
                  onClick={() => setIsNewProjectDialogOpen(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition inline-flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  Create New Project
                </button>
              </div>
            )}
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

      {/* Account Dialog */}
      <AccountDialog
        isOpen={isAccountDialogOpen}
        onClose={() => setIsAccountDialogOpen(false)}
      />

      {/* Import Conflict Dialog */}
      {conflictInfo && conflictFilePath && (
        <ImportConflictDialog
          isOpen={true}
          conflict={conflictInfo}
          filePath={conflictFilePath}
          onResolve={handleResolveConflict}
        />
      )}
    </div>
  );
}
