import { useEffect } from 'react';
import { logger } from '../utils/logger';
import { useNavigate, useParams } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';

/**
 * Project menu event handlers
 * Registers handlers globally - navigates to project page to perform actions
 */
export function useProjectMenuHandlers() {
  const navigate = useNavigate();
  const params = useParams();
  const openSettingsDialog = useUIStore((state) => state.openSettingsDialog);

  useEffect(() => {
    if (!window.api?.menu) return;

    const handleEditProject = () => {
      // HashRouter puts the path in window.location.hash (e.g. "#/project/some-uuid")
      const currentPath = window.location.hash;
      const projectIdMatch = currentPath.match(/\/project\/([^/]+)/);

      if (projectIdMatch) {
        const projectId = projectIdMatch[1];
        // Navigate to project page with edit dialog flag
        navigate(`/project/${projectId}`, { state: { openEditDialog: true } });
      } else {
        logger.info('No project context for Edit Project Info');
      }
    };

    const handleProjectSettings = () => {
      // Open settings dialog
      openSettingsDialog();
    };

    const handleExportProject = async () => {
      // HashRouter puts the path in window.location.hash (e.g. "#/project/some-uuid")
      const currentPath = window.location.hash;
      const projectIdMatch = currentPath.match(/\/project\/([^/]+)/);

      if (!projectIdMatch) {
        logger.info('No project context for Export Project');
        return;
      }

      const projectId = projectIdMatch[1];
      try {
        // Get project name from the store so we can suggest a filename
        const projectName =
          document.title || window.location.hash.split('/').pop() || 'ShowStack Project';
        const filePath = await window.api.files.exportProject(projectId, projectName);
        if (filePath) {
          logger.info('Project exported to:', filePath);
          window.dispatchEvent(new CustomEvent('project:exported', { detail: { filePath } }));
        }
      } catch (error) {
        logger.error('Failed to export project:', error);
      }
    };

    const handleSaveAsCopy = async () => {
      // HashRouter puts the path in window.location.hash (e.g. "#/project/some-uuid")
      const currentPath = window.location.hash;
      const projectIdMatch = currentPath.match(/\/project\/([^/]+)/);

      if (!projectIdMatch) {
        logger.info('No project context for Save as Copy');
        return;
      }

      const projectId = projectIdMatch[1];
      try {
        const copy = await window.api.projects.createCopy(projectId);
        logger.info('Project copy created:', copy.name);
        // Dispatch a custom event so any listening component can show a toast
        window.dispatchEvent(
          new CustomEvent('project:copyCreated', { detail: { copyName: copy.name } }),
        );
      } catch (error) {
        logger.error('Failed to create project copy:', error);
      }
    };

    // Register all handlers
    window.api.menu.on('menu:editProject', handleEditProject);
    window.api.menu.on('menu:projectSettings', handleProjectSettings);
    window.api.menu.on('menu:saveAsCopy', handleSaveAsCopy);
    window.api.menu.on('menu:exportProject', handleExportProject);

    // Cleanup on unmount
    return () => {
      window.api.menu.off('menu:editProject', handleEditProject);
      window.api.menu.off('menu:projectSettings', handleProjectSettings);
      window.api.menu.off('menu:saveAsCopy', handleSaveAsCopy);
      window.api.menu.off('menu:exportProject', handleExportProject);
    };
  }, [navigate, params, openSettingsDialog]);
}
