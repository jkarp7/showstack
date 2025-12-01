import { useNavigate, useParams } from 'react-router-dom';

export function Manager() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();

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

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
              title={routeProjectId ? "Back to Project" : "Back to Projects"}
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">ShowStack:Manager</h1>
          </div>
          <button
            onClick={handleHomeClick}
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 rounded text-sm transition"
            title="Home (Projects)"
          >
            🏠
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚐</div>
          <h2 className="text-3xl font-bold mb-2">Manager Module</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Coming Soon</p>
          <div className="max-w-md text-gray-500 text-sm">
            <p>The Manager module will include:</p>
            <ul className="mt-4 space-y-2 text-left">
              <li>• Tour scheduling and calendar</li>
              <li>• Venue information management</li>
              <li>• Crew and personnel tracking</li>
              <li>• Travel logistics and routing</li>
              <li>• Equipment trucking and shipping</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
