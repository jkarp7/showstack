import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePrepStore } from '../../store/prepStore';
import { NewPrepProjectDialog } from '../../components/prep/NewPrepProjectDialog';
import { PrepProjectCard } from '../../components/prep/PrepProjectCard';

export function Prep() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const { allProjects, currentProject, loadAllProjects, loadProject, clearCurrentProject } =
    usePrepStore();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  const handleBackClick = () => {
    if (routeProjectId) {
      navigate(`/project/${routeProjectId}`);
    } else {
      navigate('/');
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  useEffect(() => {
    // Load all projects on mount
    loadAllProjects();
  }, []);

  const handleProjectClick = async (projectId: string) => {
    await loadProject(projectId);
  };

  const handleBackToList = () => {
    clearCurrentProject();
  };

  const handleNewProject = () => {
    setShowNewProjectDialog(true);
  };

  const handleProjectCreated = async (projectId: string) => {
    await loadProject(projectId);
  };

  // If a project is loaded, show the project view
  if (currentProject) {
    return (
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToList}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              >
                ← Back to Projects
              </button>
              <h1 className="text-2xl font-bold">{currentProject.production_name}</h1>
              {currentProject.current_revision > 0 && (
                <span className="px-2 py-1 bg-blue-600 text-white text-sm rounded">
                  Revision {currentProject.current_revision}
                </span>
              )}
            </div>
            <button
              onClick={handleHomeClick}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              title="Home (Projects)"
            >
              🏠
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Project Details</h2>
              <div className="space-y-3 text-gray-300">
                <div>
                  <span className="text-gray-500">Production:</span>{' '}
                  {currentProject.production_name}
                </div>
                {currentProject.venue && (
                  <div>
                    <span className="text-gray-500">Venue:</span> {currentProject.venue}
                    {currentProject.venue_city && `, ${currentProject.venue_city}`}
                    {currentProject.venue_state && `, ${currentProject.venue_state}`}
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Disciplines:</span>{' '}
                  {JSON.parse(currentProject.disciplines || '[]')
                    .map(
                      (d: string) => d.charAt(0).toUpperCase() + d.slice(1)
                    )
                    .join(', ')}
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-700/50 rounded border border-gray-600">
                <p className="text-gray-400 text-sm">
                  Equipment sections, items, and revision tracking coming soon...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show project list
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              title={routeProjectId ? "Back to Project" : "Back to Projects"}
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">ShowStack:Prep</h1>
            <span className="text-sm text-gray-400">Equipment Orders & Specifications</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNewProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition"
            >
              + New Shop Order
            </button>
            <button
              onClick={handleHomeClick}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              title="Home (Projects)"
            >
              🏠
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {allProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold mb-2">No Shop Orders Yet</h2>
              <p className="text-gray-400 mb-6">
                Create your first equipment order to get started
              </p>
              <button
                onClick={handleNewProject}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition"
              >
                Create First Shop Order
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                All Projects ({allProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProjects.map((project) => (
                  <PrepProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <NewPrepProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
