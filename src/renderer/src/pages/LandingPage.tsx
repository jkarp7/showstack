import { ModuleCard } from '../components/ModuleCard';

export function LandingPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ShowStack</h1>
            <p className="text-gray-400 text-sm mt-1">Production Management Suite</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-gray-300 hover:text-white transition">
              Account
            </button>
            <button className="px-4 py-2 text-gray-300 hover:text-white transition">
              Settings
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Select a Module</h2>
            <p className="text-gray-400">Choose which tool you'd like to work with</p>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModuleCard
              name="ShowStack:Design"
              description="Lighting design, visualization, and plot creation"
              icon="✏️"
              route="/modules/design"
              isLocked={true}
            />

            <ModuleCard
              name="ShowStack:Production"
              description="Production management, fixtures, and technical planning"
              icon="🎬"
              route="/modules/production"
              isLocked={false}
            />

            <ModuleCard
              name="ShowStack:Tour"
              description="Tour management, scheduling, and logistics"
              icon="🚐"
              route="/modules/tour"
              isLocked={true}
            />
          </div>

          {/* Quick Actions */}
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-4">Recent Projects</h3>
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <p className="text-gray-400 text-center py-8">
                No recent projects. Create a new project to get started.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 text-center text-sm text-gray-400">
        ShowStack v0.1.0-alpha | © 2025 Lytrix
      </footer>
    </div>
  );
}
