import { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { ProjectSidebar } from '../components/project/ProjectSidebar';

/**
 * ProjectWorkspace — the persistent layout for all project-level routes.
 *
 * Owns: sidebar nav, project context initialization, menu state.
 * Content: rendered by child routes via <Outlet />.
 */
export function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, loadProjects, setCurrentProject } = useProjectStore();

  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (!projects.length) {
      loadProjects();
    }
  }, [projects.length, loadProjects]);

  // Set projectId in menu when we navigate to a project.
  // Intentionally does NOT set context — child routes own their own context.
  // (React runs child effects before parent effects, so setting context here
  // would overwrite whatever the child route just set.)
  useEffect(() => {
    if (projectId) {
      setCurrentProject(projectId);
      window.api?.menu?.setState({ projectId });
    }

    return () => {
      window.api?.menu?.setState({ context: 'landing', projectId: undefined });
    };
  }, [projectId, setCurrentProject]);

  // Update project name in menu separately so it doesn't clobber child-route context
  useEffect(() => {
    if (project?.name) {
      window.api?.menu?.setState({ projectName: project.name });
    }
  }, [project?.name]);

  if (!project && projects.length > 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <ProjectSidebar
        projectId={projectId!}
        projectName={project?.name ?? '…'}
        onHome={() => navigate('/')}
      />
      <div className="flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
