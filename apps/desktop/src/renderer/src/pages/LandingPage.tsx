import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import { NewProjectDialog } from '../components/common/NewProjectDialog';
import { DeleteProjectDialog } from '../components/common/DeleteProjectDialog';
import { ImportConflictDialog } from '../components/common/ImportConflictDialog';
import { AccountDialog } from '../components/License/Account/AccountDialog';
import { SyncStatusIndicator } from '../components/sync';
import { groupProjectsIntoFamilies } from '../utils/projectFamilies';
import { useProjectStore, Project } from '../store/projectStore';
import { useFileStore } from '../store/fileStore';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getProjectInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) {
    const w = words[0];
    return (w[0] + w[w.length - 1]).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getProjectHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  return ((h % 360) + 360) % 360;
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type SortOrder = 'modified' | 'name' | 'created';

export function LandingPage() {
  const navigate = useNavigate();
  const { projects, loadProjects, createProject, deleteProject, setCurrentProject } =
    useProjectStore();
  const { conflictInfo, conflictFilePath, resolveConflict, importMessage, clearImportMessage } =
    useFileStore();

  // Dialog state
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

  // Layout state
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Selection state
  // selectedId = the root/standalone project shown in the right panel
  // selectedVersionId = the specific version targeted by the Open button (defaults to selectedId)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // List state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('modified');

  // Logo cache
  const [logoDataUrls, setLogoDataUrls] = useState<Map<string, string>>(new Map());

  // Double-click timer
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadProjects();
    window.api?.menu?.setState({ context: 'landing' });
  }, []);

  useEffect(() => {
    if (!importMessage) return;
    loadProjects();
    const timer = setTimeout(() => clearImportMessage(), 4000);
    return () => {
      clearTimeout(timer);
      clearImportMessage();
    };
  }, [importMessage]);

  // Load logos
  useEffect(() => {
    const load = async () => {
      const map = new Map<string, string>();
      for (const p of projects) {
        if (!p.logo_path) continue;
        if (p.logo_path.startsWith('data:') || p.logo_path.startsWith('http')) {
          map.set(p.id, p.logo_path);
          continue;
        }
        try {
          const url = await window.api?.files?.readImageAsDataUrl(p.logo_path);
          if (url) map.set(p.id, url);
        } catch {
          // ignore
        }
      }
      setLogoDataUrls(map);
    };
    load();
  }, [projects]);

  // ⌘\ toggles right panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '\\' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsRightPanelOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Enter opens selected project
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedId && !isNewProjectDialogOpen && !projectToDelete) {
        handleOpenProject(selectedId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, isNewProjectDialogOpen, projectToDelete]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleOpenProject = useCallback(
    async (projectId: string) => {
      try {
        setCurrentProject(projectId);
        await window.api.windows.openProject(projectId);
      } catch (error) {
        logger.error('Failed to open project window:', { error: String(error) });
      }
    },
    [setCurrentProject],
  );

  const handleRowClick = useCallback(
    (projectId: string) => {
      if (clickTimerRef.current) {
        // Second click — double-click detected
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        handleOpenProject(projectId);
      } else {
        // First click — select root for right panel, track version for Open button
        const rootId = childToRoot.get(projectId) ?? projectId;
        setSelectedId(rootId);
        setSelectedVersionId(projectId);
        if (!isRightPanelOpen) setIsRightPanelOpen(true);
        clickTimerRef.current = setTimeout(() => {
          clickTimerRef.current = null;
        }, 300);
      }
    },
    [handleOpenProject, isRightPanelOpen, childToRoot],
  );

  const handleCreateProject = async (
    name: string,
    description: string,
    logoPath: string,
    enabledModules: string[],
  ) => {
    try {
      const created = await createProject(name, description, logoPath, enabledModules);
      if (created?.id) {
        setSelectedId(created.id);
        setSelectedVersionId(created.id);
      }
    } catch (error) {
      logger.error('Failed to create project:', { error: String(error) });
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete.id);
      if (selectedId === projectToDelete.id || selectedVersionId === projectToDelete.id) {
        setSelectedId(null);
        setSelectedVersionId(null);
      }
    } catch (error) {
      logger.error('Failed to delete project:', { error: String(error) });
    }
    setProjectToDelete(null);
  };

  const handleExportProject = async (e: React.MouseEvent, projectId: string, name: string) => {
    e.stopPropagation();
    try {
      await window.api.files.exportProject(projectId, name);
    } catch (error) {
      logger.error('Failed to export project:', { error: String(error) });
    }
  };

  const handleImport = async () => {
    const { openFile } = useFileStore.getState();
    await openFile(async () => {
      await loadProjects();
    });
  };

  const handleResolveConflict = async (action: 'replace' | 'keep-both' | 'cancel') => {
    await resolveConflict(action, async () => {
      await loadProjects();
    });
  };

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const { families, standalones } = useMemo(() => groupProjectsIntoFamilies(projects), [projects]);

  // All projects flat list (family roots + standalones), sorted
  const allProjects = useMemo(() => {
    const roots = families.map((f) => f.root);
    const all = [...roots, ...standalones];
    if (sortOrder === 'name') return all.sort((a, b) => a.name.localeCompare(b.name));
    if (sortOrder === 'created') return all.sort((a, b) => a.created_at - b.created_at);
    return all.sort((a, b) => b.updated_at - a.updated_at); // modified (default)
  }, [families, standalones, sortOrder]);

  // Recent: top 5 unique shows (one per family) by most-recent version's updated_at
  const recentProjects = useMemo(() => {
    const childIds = new Set(families.flatMap((f) => f.children.map((c) => c.id)));
    // For each family, use the most recently modified member's timestamp for sorting
    const familyTimestamp = new Map(
      families.map((f) => [
        f.root.id,
        Math.max(f.root.updated_at, ...f.children.map((c) => c.updated_at)),
      ]),
    );
    return [...projects]
      .filter((p) => !childIds.has(p.id))
      .sort(
        (a, b) =>
          (familyTimestamp.get(b.id) ?? b.updated_at) - (familyTimestamp.get(a.id) ?? a.updated_at),
      )
      .slice(0, 5);
  }, [projects, families]);

  // Filtered all-projects (search applied)
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return allProjects;
    const q = searchQuery.toLowerCase();
    return allProjects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q),
    );
  }, [allProjects, searchQuery]);

  // Build family lookup: root id → children
  const familyMap = useMemo(() => {
    const m = new Map<string, Project[]>();
    for (const f of families) m.set(f.root.id, f.children);
    return m;
  }, [families]);

  // Reverse lookup: child id → root id (so clicking a child row selects the right root)
  const childToRoot = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of families) {
      for (const child of f.children) m.set(child.id, f.root.id);
    }
    return m;
  }, [families]);

  // Selected project object
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId],
  );

  // Children of selected (if it's a family root)
  const selectedFamilyChildren = selectedId ? (familyMap.get(selectedId) ?? []) : [];

  // ---------------------------------------------------------------------------
  // Sub-components (inline for locality)
  // ---------------------------------------------------------------------------

  function ProjectPlaceholder({ name, size = 64 }: { name: string; size?: number }) {
    const hue = getProjectHue(name);
    const initials = getProjectInitials(name);
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: `hsl(${hue}, 55%, 40%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: size * 0.3,
          flexShrink: 0,
          letterSpacing: '-0.02em',
        }}
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  }

  function ProjectLogo({ project, size = 40 }: { project: Project; size?: number }) {
    const url = logoDataUrls.get(project.id);
    if (url) {
      return (
        <img
          src={url}
          alt={project.name}
          style={{ width: size, height: size, borderRadius: 6, objectFit: 'contain' }}
          className="bg-gray-100 dark:bg-gray-700 p-0.5"
        />
      );
    }
    return <ProjectPlaceholder name={project.name} size={size} />;
  }

  function ProjectRow({
    project,
    depth = 0,
    showTime = false,
  }: {
    project: Project;
    depth?: number;
    showTime?: boolean;
  }) {
    const isSelected = selectedId === project.id;
    const children = familyMap.get(project.id) ?? [];

    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleRowClick(project.id)}
          onKeyDown={(e) => e.key === 'Enter' && handleOpenProject(project.id)}
          className={`flex items-center gap-3 px-4 py-2 cursor-pointer select-none transition-colors group ${
            isSelected
              ? 'bg-blue-50 dark:bg-blue-900/25'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
          }`}
          style={{ paddingLeft: depth > 0 ? 32 : 16 }}
          aria-selected={isSelected}
        >
          {depth > 0 ? (
            <span className="text-gray-400 dark:text-gray-500 text-xs flex-shrink-0">↳</span>
          ) : (
            <ProjectLogo project={project} size={28} />
          )}

          <span
            className={`flex-1 text-sm truncate ${isSelected ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}
          >
            {project.name}
            {depth > 0 && (
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                {new Date(project.updated_at).toLocaleDateString()}
              </span>
            )}
          </span>

          {showTime && depth === 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
              {formatRelativeTime(project.updated_at)}
            </span>
          )}

          {/* Hover actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={(e) => handleExportProject(e, project.id, project.name)}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title="Export"
              aria-label="Export project"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1v7M3 5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProjectToDelete(project);
              }}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete"
              aria-label="Delete project"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Inline version sub-rows */}
        {depth === 0 &&
          children.map((child) => <ProjectRow key={child.id} project={child} depth={1} />)}
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      {/* Import toast */}
      {importMessage && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-green-50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm z-10">
          <span>✓</span>
          <span className="flex-1">{importMessage}</span>
          <button onClick={clearImportMessage} className="text-green-500 hover:text-green-700">
            ×
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* ── Left panel ── */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold tracking-tight">ShowStack</span>
              <SyncStatusIndicator />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImport}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Open File…
              </button>
              <button
                onClick={() => setIsNewProjectDialogOpen(true)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                + New Project
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Tag chips (stub — "All" only for now) */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button className="px-2.5 py-0.5 text-xs rounded-full bg-blue-600 text-white font-medium">
              All
            </button>
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet</p>
                <button
                  onClick={() => setIsNewProjectDialogOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  + New Project
                </button>
              </div>
            ) : (
              <>
                {/* Recent section */}
                {!searchQuery && recentProjects.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Recent
                      </span>
                    </div>
                    {recentProjects.map((p) => (
                      <ProjectRow key={p.id} project={p} showTime />
                    ))}
                  </div>
                )}

                {/* All Projects section */}
                <div>
                  <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {searchQuery ? 'Results' : 'All Projects'}
                    </span>
                    {!searchQuery && (
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                        className="text-xs text-gray-500 dark:text-gray-400 bg-transparent border-none cursor-pointer focus:outline-none"
                      >
                        <option value="modified">Last Modified</option>
                        <option value="name">Name A→Z</option>
                        <option value="created">Date Created</option>
                      </select>
                    )}
                  </div>
                  {filteredProjects.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                      No projects match "{searchQuery}"
                    </p>
                  ) : (
                    filteredProjects.map((p) => <ProjectRow key={p.id} project={p} />)
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        {isRightPanelOpen && (
          <div
            className="flex flex-col bg-gray-50 dark:bg-gray-800/50 flex-shrink-0"
            style={{ width: '35%', minWidth: 280 }}
          >
            {selectedProject ? (
              <>
                {/* Logo / placeholder */}
                <div className="flex flex-col items-center justify-center py-8 px-6 border-b border-gray-200 dark:border-gray-700">
                  {logoDataUrls.get(selectedProject.id) ? (
                    <img
                      src={logoDataUrls.get(selectedProject.id)}
                      alt={selectedProject.name}
                      className="w-24 h-24 rounded-xl object-contain bg-white dark:bg-gray-700 p-2 mb-4 shadow-sm"
                    />
                  ) : (
                    <div className="mb-4">
                      <ProjectPlaceholder name={selectedProject.name} size={96} />
                    </div>
                  )}
                  <h2 className="text-base font-semibold text-center text-gray-900 dark:text-gray-100 leading-snug">
                    {selectedProject.name}
                  </h2>
                  {selectedProject.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1 line-clamp-2">
                      {selectedProject.description}
                    </p>
                  )}
                </div>

                {/* Metadata */}
                <div className="px-5 py-3 space-y-2 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Last modified</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {new Date(selectedProject.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {new Date(selectedProject.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Version list (if family) */}
                {selectedFamilyChildren.length > 0 && (
                  <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                      {selectedFamilyChildren.length + 1} Versions
                    </p>
                    <div className="space-y-1">
                      {[selectedProject, ...selectedFamilyChildren]
                        .sort((a, b) => b.updated_at - a.updated_at)
                        .map((v) => {
                          const isActive = (selectedVersionId ?? selectedId) === v.id;
                          return (
                            <div
                              key={v.id}
                              className="flex items-center gap-2 text-xs cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={() => setSelectedVersionId(v.id)}
                            >
                              <span className={isActive ? 'text-blue-500' : 'text-gray-400'}>
                                {isActive ? '●' : '○'}
                              </span>
                              <span
                                className={`flex-1 ${isActive ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                              >
                                {new Date(v.updated_at).toLocaleDateString()}
                              </span>
                              <span className="text-gray-400">
                                {formatRelativeTime(v.updated_at)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="px-5 py-4 grid grid-cols-2 gap-2 mt-auto">
                  <button
                    onClick={() => handleOpenProject(selectedVersionId ?? selectedProject.id)}
                    className="col-span-2 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={handleImport}
                    className="py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Import…
                  </button>
                  <button
                    onClick={(e) =>
                      handleExportProject(e, selectedProject.id, selectedProject.name)
                    }
                    className="py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectToDelete(selectedProject);
                    }}
                    className="col-span-2 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete…
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Select a project to see details
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Right panel toggle tab ── */}
        <button
          onClick={() => setIsRightPanelOpen((o) => !o)}
          className="flex-shrink-0 flex items-center justify-center w-5 bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={isRightPanelOpen ? 'Hide panel (⌘\\)' : 'Show panel (⌘\\)'}
          aria-label={isRightPanelOpen ? 'Hide detail panel' : 'Show detail panel'}
        >
          <svg
            width="8"
            height="12"
            viewBox="0 0 8 12"
            fill="none"
            style={{ transform: isRightPanelOpen ? 'none' : 'rotate(180deg)' }}
          >
            <path
              d="M6 1L2 6l4 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Dialogs */}
      <NewProjectDialog
        isOpen={isNewProjectDialogOpen}
        onClose={() => setIsNewProjectDialogOpen(false)}
        onCreate={handleCreateProject}
      />
      <DeleteProjectDialog
        isOpen={projectToDelete !== null}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
      />
      <AccountDialog isOpen={isAccountDialogOpen} onClose={() => setIsAccountDialogOpen(false)} />
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
