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
      // Get current project ID from menu state or params
      const currentPath = window.location.pathname;
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

    const handleSaveAsCopy = async () => {
      const currentPath = window.location.pathname;
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

    // Cleanup on unmount
    return () => {
      window.api.menu.off('menu:editProject', handleEditProject);
      window.api.menu.off('menu:projectSettings', handleProjectSettings);
      window.api.menu.off('menu:saveAsCopy', handleSaveAsCopy);
    };
  }, [navigate, params, openSettingsDialog]);
}
