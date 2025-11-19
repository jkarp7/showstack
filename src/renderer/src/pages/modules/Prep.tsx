import { useNavigate, useParams } from 'react-router-dom';

export function Prep() {
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

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✏️</div>
          <h2 className="text-3xl font-bold mb-2">Prep Module</h2>
          <p className="text-gray-400 mb-6">Coming Soon</p>
          <div className="max-w-md text-gray-500 text-sm">
            <p>The Prep module will include:</p>
            <ul className="mt-4 space-y-2 text-left">
              <li>• Lighting plot creation and visualization</li>
              <li>• 2D/3D rendering</li>
              <li>• Design templates and libraries</li>
              <li>• Collaboration tools</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
