import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Project menu event handlers
 * Registers handlers globally - navigates to project page to perform actions
 */
export function useProjectMenuHandlers() {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    if (!window.api?.menu) return;

    const handleEditProject = () => {
      // Get current project ID from menu state or params
      const currentPath = window.location.pathname;
      const projectIdMatch = currentPath.match(/\/project\/([^\/]+)/);

      if (projectIdMatch) {
        const projectId = projectIdMatch[1];
        // Navigate to project page with edit dialog flag
        navigate(`/project/${projectId}`, { state: { openEditDialog: true } });
      } else {
        console.log('No project context for Edit Project Info');
      }
    };

    const handleProjectSettings = () => {
      // Navigate to project settings page (to be implemented)
      console.log('Open project settings');
    };

    // Register all handlers
    window.api.menu.on('menu:editProject', handleEditProject);
    window.api.menu.on('menu:projectSettings', handleProjectSettings);

    // Cleanup on unmount
    return () => {
      window.api.menu.off('menu:editProject', handleEditProject);
      window.api.menu.off('menu:projectSettings', handleProjectSettings);
    };
  }, [navigate, params]);
}
