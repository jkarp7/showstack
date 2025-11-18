import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleCard } from '../components/common/ModuleCard';
import { ProjectCard } from '../components/common/ProjectCard';
import { NewProjectDialog } from '../components/common/NewProjectDialog';
import { DeleteProjectDialog } from '../components/common/DeleteProjectDialog';
import { useProjectStore, Project } from '../store/projectStore';
import { getRecentFiles, removeRecentFile, RecentFile } from '../utils/recentFiles';
import { useFileStore } from '../store/fileStore';

export function LandingPage() {
  const navigate = useNavigate();
  const { projects, loadProjects, createProject, deleteProject, setCurrentProject } = useProjectStore();
  const { openFileByPath } = useFileStore();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    loadProjects();
    loadRecentFiles();
  }, [loadProjects]);

  const loadRecentFiles = async () => {
    const files = await getRecentFiles();
    setRecentFiles(files);
  };

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

  const handleOpenRecentFile = async (filePath: string) => {
    try {
      // Open the file by path (this will import the database)
      const success = await openFileByPath(filePath, async () => {
        // After successful open, navigate to production module
        await loadProjects();
      });

      if (success) {
        navigate('/modules/production');
      } else {
        // File open failed, remove from recent files
        await removeRecentFile(filePath);
        await loadRecentFiles();
      }
    } catch (error) {
      console.error('Failed to open recent file:', error);
      // Remove invalid file from recent list
      await removeRecentFile(filePath);
      await loadRecentFiles();
    }
  };

  const handleRemoveRecentFile = async (filePath: string) => {
    await removeRecentFile(filePath);
    await loadRecentFiles();
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
          {/* Recent Files Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Recent Projects</h2>
                <p className="text-gray-400">Quick access to your recent ShowStack files</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const { openFile } = useFileStore.getState();
                    await openFile(async () => {
                      await loadProjects();
                      navigate('/modules/production');
                    });
                  }}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition flex items-center gap-2"
                >
                  Open File...
                </button>
                <button
                  onClick={() => navigate('/modules/production')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  New Project
                </button>
              </div>
            </div>

            {/* Recent Files Display */}
            {recentFiles.length > 0 ? (
              recentFiles.length <= 3 ? (
                /* Tile view for 3 or fewer files */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentFiles.map((file) => (
                    <div
                      key={file.filePath}
                      className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-blue-500 transition cursor-pointer group"
                      onClick={() => handleOpenRecentFile(file.filePath)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-4xl">📄</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRecentFile(file.filePath);
                          }}
                          className="text-gray-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                          title="Remove from recent"
                        >
                          ×
                        </button>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 truncate">{file.projectName}</h3>
                      <p className="text-sm text-gray-400 mb-1 truncate" title={file.filePath}>
                        {file.filePath}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last opened: {new Date(file.lastOpened).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table view for more than 3 files */
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-750 border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          File Path
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Last Opened
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {recentFiles.map((file) => (
                        <tr
                          key={file.filePath}
                          className="hover:bg-gray-750 cursor-pointer transition"
                          onClick={() => handleOpenRecentFile(file.filePath)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">📄</span>
                              <span className="font-medium">{file.projectName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 max-w-md truncate" title={file.filePath}>
                            {file.filePath}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                            {new Date(file.lastOpened).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveRecentFile(file.filePath);
                              }}
                              className="text-gray-500 hover:text-red-500 transition text-sm"
                            >
                              Remove
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
                <p className="text-gray-400 text-lg mb-4">No recent files</p>
                <p className="text-gray-500 text-sm mb-6">
                  Open an existing ShowStack file or create a new project to get started
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={async () => {
                      const { openFile } = useFileStore.getState();
                      await openFile(async () => {
                        await loadProjects();
                        await loadRecentFiles();
                        navigate('/modules/production');
                      });
                    }}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition inline-flex items-center gap-2"
                  >
                    Open File...
                  </button>
                  <button
                    onClick={() => navigate('/modules/production')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition inline-flex items-center gap-2"
                  >
                    <span className="text-xl">+</span>
                    Create New Project
                  </button>
                </div>
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
