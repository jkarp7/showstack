import { useNavigate } from 'react-router-dom';

export function Design() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/modules')}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              ← Home
            </button>
            <h1 className="text-2xl font-bold">ShowStack:Design</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✏️</div>
          <h2 className="text-3xl font-bold mb-2">Design Module</h2>
          <p className="text-gray-400 mb-6">Coming Soon</p>
          <div className="max-w-md text-gray-500 text-sm">
            <p>The Design module will include:</p>
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
