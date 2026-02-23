import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import { NewProjectDialog } from '../components/common/NewProjectDialog';
import { DeleteProjectDialog } from '../components/common/DeleteProjectDialog';
import { ImportConflictDialog } from '../components/common/ImportConflictDialog';
import { AccountDialog } from '../components/License/Account/AccountDialog';
import { SyncStatusIndicator } from '../components/sync';
import { ProjectStackCard, ProjectFamily } from '../components/common/ProjectStackCard';
import { useProjectStore, Project } from '../store/projectStore';
import { useFileStore } from '../store/fileStore';

// ---------------------------------------------------------------------------
// Grouping helpers
// ---------------------------------------------------------------------------

function groupProjectsIntoFamilies(projects: Project[]): {
  families: ProjectFamily[];
  standalones: Project[];
} {
  const rootMap = new Map<string, Project>();
  const childrenMap = new Map<string, Project[]>();

  // First pass: collect roots
  for (const p of projects) {
    if (!p.root_project_id) {
      rootMap.set(p.id, p);
    }
  }

  // Second pass: group children
  for (const p of projects) {
    if (p.root_project_id) {
      const siblings = childrenMap.get(p.root_project_id) || [];
      siblings.push(p);
      childrenMap.set(p.root_project_id, siblings);
    }
  }

  const families: ProjectFamily[] = [];
  const standalones: Project[] = [];

  for (const [rootId, root] of rootMap) {
    const children = (childrenMap.get(rootId) || []).sort((a, b) => b.updated_at - a.updated_at);
    if (children.length > 0) {
      families.push({ root, children });
    } else {
      standalones.push(root);
    }
  }

  // Handle orphan children (root was deleted — treat as standalones)
  for (const p of projects) {
    if (p.root_project_id && !rootMap.has(p.root_project_id)) {
      standalones.push(p);
    }
  }

  // Sort families by most recently updated member
  families.sort((a, b) => {
    const aLatest = Math.max(a.root.updated_at, ...a.children.map((c) => c.updated_at));
    const bLatest = Math.max(b.root.updated_at, ...b.children.map((c) => c.updated_at));
    return bLatest - aLatest;
  });

  standalones.sort((a, b) => b.updated_at - a.updated_at);

  return { families, standalones };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LandingPage() {
  const navigate = useNavigate();
  const { projects, loadProjects, createProject, deleteProject, setCurrentProject } =
    useProjectStore();
  const { conflictInfo, conflictFilePath, resolveConflict, importMessage, clearImportMessage } =
    useFileStore();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [logoDataUrls, setLogoDataUrls] = useState<Map<string, string>>(new Map());
  const [expandedFamilyRootId, setExpandedFamilyRootId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();

    // Update menu context
    window.api?.menu?.setState({
      context: 'landing',
    });
  }, []);

  // When an auto-stack import message appears, reload projects to show the new stack member,
  // then auto-dismiss after 4 seconds.
  useEffect(() => {
    if (!importMessage) return;
    loadProjects(); // ensure grid is up-to-date immediately
    const timer = setTimeout(() => clearImportMessage(), 4000);
    return () => clearTimeout(timer);
  }, [importMessage]);

  // Load logos as data URLs for all projects
  useEffect(() => {
    const loadLogos = async () => {
      const newLogoMap = new Map<string, string>();

      for (const project of projects) {
        if (!project.logo_path) continue;

        if (
          project.logo_path.startsWith('data:') ||
          project.logo_path.startsWith('http://') ||
          project.logo_path.startsWith('https://')
        ) {
          newLogoMap.set(project.id, project.logo_path);
          continue;
        }

        try {
          if (typeof window !== 'undefined' && window.api?.files) {
            const dataUrl = await window.api.files.readImageAsDataUrl(project.logo_path);
            if (dataUrl) {
              newLogoMap.set(project.id, dataUrl);
            }
          }
        } catch (error) {
          logger.error(`[LandingPage] Error loading logo for project ${project.id}:`, error);
        }
      }

      setLogoDataUrls(newLogoMap);
    };

    loadLogos();
  }, [projects]);

  const handleCreateProject = async (
    name: string,
    description: string,
    logoPath: string,
    enabledModules: string[],
  ) => {
    try {
      await createProject(name, description, logoPath, enabledModules);
    } catch (error) {
      logger.error('Failed to create project:', error);
    }
  };

  const handleOpenProject = async (projectId: string) => {
    try {
      setCurrentProject(projectId);
      await window.api.windows.openProject(projectId);
    } catch (error) {
      logger.error('Failed to open project window:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete.id);
        // If we deleted the root of the expanded family, collapse the view
        if (expandedFamilyRootId === projectToDelete.id) {
          setExpandedFamilyRootId(null);
        }
      } catch (error) {
        logger.error('Failed to delete project:', error);
      }
    }
  };

  const handleResolveConflict = async (action: 'replace' | 'keep-both' | 'cancel') => {
    await resolveConflict(action, async () => {
      await loadProjects();
    });
  };

  // Compute groupings
  const { families, standalones } = groupProjectsIntoFamilies(projects);

  // Find the expanded family (if any)
  const expandedFamily = expandedFamilyRootId
    ? families.find((f) => f.root.id === expandedFamilyRootId) || null
    : null;

  // All members of expanded family for display
  const expandedMembers = expandedFamily ? [expandedFamily.root, ...expandedFamily.children] : [];

  const totalItems = families.length + standalones.length;

  // ---------------------------------------------------------------------------
  // Shared project card renderer (for standalones and expanded family members)
  // ---------------------------------------------------------------------------
  const handleExportProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    try {
      await window.api.files.exportProject(project.id, project.name);
    } catch (error) {
      logger.error('Failed to export project:', error);
    }
  };

  const renderProjectCard = (project: Project) => (
    <div
      key={project.id}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-500 transition cursor-pointer group"
      onClick={() => handleOpenProject(project.id)}
    >
      <div className="flex items-start justify-between mb-3">
        {logoDataUrls.get(project.id) ? (
          <img
            src={logoDataUrls.get(project.id)}
            alt={project.name}
            className="w-16 h-16 rounded-lg object-contain bg-gray-200 dark:bg-gray-700 p-1"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl">
            📁
          </div>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={(e) => handleExportProject(e, project)}
            className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition text-sm px-1"
            title="Export project as .ss file"
          >
            ↑
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProjectToDelete(project);
            }}
            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-500 transition"
            title="Delete project"
          >
            ×
          </button>
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2 truncate">{project.name}</h3>
      {project.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {project.description}
        </p>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-500">
        Updated: {new Date(project.updated_at).toLocaleDateString()}
      </p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ShowStack</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Production Management Suite
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SyncStatusIndicator />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Projects Section */}
          <div className="mb-12">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                {expandedFamily ? (
                  /* Breadcrumb */
                  <nav className="flex items-center gap-2 text-sm mb-1">
                    <button
                      onClick={() => setExpandedFamilyRootId(null)}
                      className="text-blue-500 hover:underline font-medium"
                    >
                      Library
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {expandedFamily.root.name}
                    </span>
                  </nav>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-2">Projects</h2>
                    <p className="text-gray-600 dark:text-gray-400">Your ShowStack projects</p>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const { openFile } = useFileStore.getState();
                    await openFile(async () => {
                      await loadProjects();
                    });
                  }}
                  className="px-6 py-3 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  Open File...
                </button>
                <button
                  onClick={() => setIsNewProjectDialogOpen(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  New Project
                </button>
              </div>
            </div>

            {/* Auto-stack import toast */}
            {importMessage && (
              <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 text-sm">
                <span>✓</span>
                <span>{importMessage}</span>
                <button
                  onClick={clearImportMessage}
                  className="ml-auto text-green-500 hover:text-green-700 dark:hover:text-green-200"
                >
                  ×
                </button>
              </div>
            )}

            {/* Projects Display */}
            {projects.length > 0 ? (
              expandedFamily ? (
                /* Expanded family / stack view */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {expandedMembers.map(renderProjectCard)}
                </div>
              ) : totalItems <= 3 ? (
                /* Tile view */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {families.map((family) => (
                    <ProjectStackCard
                      key={family.root.id}
                      family={family}
                      onClick={() => setExpandedFamilyRootId(family.root.id)}
                      onDeleteMember={setProjectToDelete}
                      logoDataUrls={logoDataUrls}
                    />
                  ))}
                  {standalones.map(renderProjectCard)}
                </div>
              ) : (
                /* Table view for > 3 items */
                <div className="space-y-4">
                  {/* Stack cards always shown as tiles above the table */}
                  {families.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      {families.map((family) => (
                        <ProjectStackCard
                          key={family.root.id}
                          family={family}
                          onClick={() => setExpandedFamilyRootId(family.root.id)}
                          onDeleteMember={setProjectToDelete}
                          logoDataUrls={logoDataUrls}
                        />
                      ))}
                    </div>
                  )}
                  {/* Standalones in table */}
                  {standalones.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Project Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Date Updated
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {standalones.map((project) => (
                            <tr
                              key={project.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                              onClick={() => handleOpenProject(project.id)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {logoDataUrls.get(project.id) ? (
                                    <img
                                      src={logoDataUrls.get(project.id)}
                                      alt={project.name}
                                      className="w-10 h-10 rounded-lg object-contain bg-gray-200 dark:bg-gray-700 mr-3 p-1"
                                    />
                                  ) : (
                                    <span className="text-2xl mr-3">📁</span>
                                  )}
                                  <span className="font-medium">{project.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                {project.description || '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {new Date(project.updated_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectToDelete(project);
                                  }}
                                  className="text-gray-600 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-500 transition text-sm"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="text-6xl mb-4">📂</div>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">No projects yet</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
                  Create a new project to get started with ShowStack
                </p>
                <button
                  onClick={() => setIsNewProjectDialogOpen(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
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
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
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
      <AccountDialog isOpen={isAccountDialogOpen} onClose={() => setIsAccountDialogOpen(false)} />

      {/* Import Conflict Dialog (kept for explicit "keep-both" resolutions) */}
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
