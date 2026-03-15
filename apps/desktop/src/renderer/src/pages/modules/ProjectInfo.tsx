import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProjectStore, Project } from '../../store/projectStore';
import { EditProjectDialog } from '../../components/common/EditProjectDialog';
import { SyncStatusIndicator } from '../../components/sync';
import { useSaveAsCopy } from '../../hooks/useSaveAsCopy';
import { ProjectSharingDialog } from '../../components/collaboration/ProjectSharingDialog';
import { useFeatureFlag } from '../../config/featureFlags';
import { useAuthStore } from '../../store/authStore';
import { logger } from '../../utils/logger';

export function ProjectInfo() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, loadProjects, updateProject } = useProjectStore();
  const { userId, licenseStatus } = useAuthStore();
  const collaborationEnabled = useFeatureFlag('collaboration');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const { isCopying, copyMessage, handleSaveAsCopy, showCopyMessage } = useSaveAsCopy(projectId);

  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (!projects.length) loadProjects();
  }, [projects.length, loadProjects]);

  useEffect(() => {
    window.api?.menu?.setState({ context: 'project' });
    return () => {
      window.api?.menu?.setState({ context: 'landing' });
    };
  }, []);

  // Open edit dialog if navigated here with openEditDialog state (e.g. from menu)
  useEffect(() => {
    const state = location.state as { openEditDialog?: boolean } | null;
    if (state?.openEditDialog) {
      setIsEditDialogOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  // Load logo
  useEffect(() => {
    const loadLogo = async () => {
      if (!project?.logo_path) {
        setLogoDataUrl(null);
        return;
      }
      if (project.logo_path.startsWith('data:') || project.logo_path.startsWith('http')) {
        setLogoDataUrl(project.logo_path);
        return;
      }
      try {
        if (window.api?.files) {
          const dataUrl = await window.api.files.readImageAsDataUrl(project.logo_path);
          setLogoDataUrl(dataUrl);
        }
      } catch (error) {
        logger.error('[ProjectInfo] Error loading logo:', error);
        setLogoDataUrl(null);
      }
    };
    loadLogo();
  }, [project?.logo_path]);

  useEffect(() => {
    const handleCopyCreated = (e: Event) => {
      const { copyName } = (e as CustomEvent).detail;
      showCopyMessage(`Copy created: "${copyName}"`);
    };
    const handleExported = (e: Event) => {
      const { filePath } = (e as CustomEvent).detail;
      const fileName = filePath.replace(/\\/g, '/').split('/').pop() || 'file';
      showCopyMessage(`Exported: "${fileName}"`);
    };
    window.addEventListener('project:copyCreated', handleCopyCreated);
    window.addEventListener('project:exported', handleExported);
    return () => {
      window.removeEventListener('project:copyCreated', handleCopyCreated);
      window.removeEventListener('project:exported', handleExported);
    };
  }, [showCopyMessage]);

  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    try {
      await updateProject(id, updates);
      setIsEditDialogOpen(false);
    } catch (error) {
      logger.error('Failed to update project:', error);
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white overflow-auto">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Project Info</h1>
          <div className="flex items-center gap-3">
            <SyncStatusIndicator />
            {copyMessage && (
              <span className="text-sm text-green-600 dark:text-green-400">✓ {copyMessage}</span>
            )}
            <button
              onClick={handleSaveAsCopy}
              disabled={isCopying}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium text-sm transition disabled:opacity-50"
            >
              {isCopying ? 'Copying…' : 'Save as Copy'}
            </button>
            {collaborationEnabled && licenseStatus?.canCollaborate && (
              <button
                onClick={() => setIsSharingOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-sm transition"
              >
                Share
              </button>
            )}
            <button
              onClick={() => setIsEditDialogOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition"
            >
              Edit
            </button>
          </div>
        </div>

        <div className="flex items-start gap-6">
          {logoDataUrl ? (
            <img
              src={logoDataUrl}
              alt={project.name}
              className="w-20 h-20 rounded-lg object-contain bg-gray-100 dark:bg-gray-700 p-2"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl">
              📁
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{project.name}</h2>
            {project.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{project.description}</p>
            )}
            {project.venue && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {project.venue}
                {(project.venue_city || project.venue_state) && (
                  <span>
                    {' — '}
                    {project.venue_city}
                    {project.venue_city && project.venue_state ? ', ' : ''}
                    {project.venue_state}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 max-w-4xl">
        {/* Design Team */}
        {(project.lighting_designer || project.audio_designer || project.video_designer) && (
          <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-base font-semibold mb-3 text-blue-600 dark:text-blue-400">
              Design Team
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {project.lighting_designer && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Lighting Designer
                  </div>
                  <div className="font-medium">{project.lighting_designer}</div>
                  {project.lighting_designer_email && (
                    <div className="text-gray-500">{project.lighting_designer_email}</div>
                  )}
                </div>
              )}
              {project.audio_designer && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Audio Designer
                  </div>
                  <div className="font-medium">{project.audio_designer}</div>
                  {project.audio_designer_email && (
                    <div className="text-gray-500">{project.audio_designer_email}</div>
                  )}
                </div>
              )}
              {project.video_designer && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Video Designer
                  </div>
                  <div className="font-medium">{project.video_designer}</div>
                  {project.video_designer_email && (
                    <div className="text-gray-500">{project.video_designer_email}</div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Production Staff */}
        {(project.electrician || project.production_manager || project.general_manager) && (
          <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-base font-semibold mb-3 text-blue-600 dark:text-blue-400">
              Production Staff
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {project.electrician && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Electrician
                  </div>
                  <div className="font-medium">{project.electrician}</div>
                  {project.electrician_email && (
                    <div className="text-gray-500">{project.electrician_email}</div>
                  )}
                </div>
              )}
              {project.production_manager && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    Production Manager
                  </div>
                  <div className="font-medium">{project.production_manager}</div>
                  {project.production_manager_email && (
                    <div className="text-gray-500">{project.production_manager_email}</div>
                  )}
                </div>
              )}
              {project.general_manager && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                    General Manager
                  </div>
                  <div className="font-medium">{project.general_manager}</div>
                  {project.general_manager_email && (
                    <div className="text-gray-500">{project.general_manager_email}</div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Show Dates */}
        {project.show_dates && Object.keys(project.show_dates).length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-base font-semibold mb-3 text-blue-600 dark:text-blue-400">
              Show Dates
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {(
                [
                  'prep_start',
                  'prep_end',
                  'load_in',
                  'tech',
                  'previews',
                  'opening',
                  'closing',
                  'load_out',
                ] as const
              ).map((key) => {
                const val = (project.show_dates as Record<string, string>)?.[key];
                if (!val) return null;
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={key}>
                    <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                    <div>{new Date(val).toLocaleDateString()}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <EditProjectDialog
        isOpen={isEditDialogOpen}
        project={project}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleUpdateProject}
      />

      {collaborationEnabled && isSharingOpen && projectId && userId && (
        <ProjectSharingDialog
          projectId={projectId}
          projectName={project.name}
          projectOwnerId={userId}
          currentUserId={userId}
          open={isSharingOpen}
          onClose={() => setIsSharingOpen(false)}
        />
      )}
    </div>
  );
}
