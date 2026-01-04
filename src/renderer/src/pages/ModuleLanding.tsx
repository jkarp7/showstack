import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

type ModuleType = 'production' | 'manager' | 'design';

interface ToolCard {
  name: string;
  description: string;
  route: string;
  isLocked: boolean;
}

const MODULE_TOOLS: Record<ModuleType, ToolCard[]> = {
  production: [
    {
      name: 'Shop Order',
      description: 'Equipment orders and specifications for rental houses',
      route: 'shop-order',
      isLocked: false
    },
    {
      name: 'System Docs',
      description: 'Equipment Manager, Paperwork Generator, and Label Designer - Lightwright parity tool',
      route: 'system-docs',
      isLocked: false
    },
    {
      name: 'Blueprint',
      description: 'System drawings and rack elevations - Omnigraffle parity tool (Coming Soon)',
      route: 'blueprint',
      isLocked: true
    }
  ],
  manager: [
    {
      name: 'Tour Manager',
      description: 'Manage tour schedules, logistics, and travel',
      route: 'tour',
      isLocked: true
    }
  ],
  design: [
    {
      name: 'Design Studio',
      description: 'Create lighting designs and visualizations',
      route: 'studio',
      isLocked: true
    }
  ]
};

const MODULE_NAMES: Record<ModuleType, string> = {
  production: 'ShowStack:Production',
  manager: 'ShowStack:Manager',
  design: 'ShowStack:Design'
};

export function ModuleLanding() {
  const { projectId, moduleType } = useParams<{ projectId?: string; moduleType: string }>();
  const navigate = useNavigate();

  const module = moduleType as ModuleType;
  const tools = MODULE_TOOLS[module] || [];
  const moduleName = MODULE_NAMES[module] || 'ShowStack';

  useEffect(() => {
    // Update menu context
    window.api?.menu?.setState({
      context: 'module',
      projectId: projectId,
    });
  }, [moduleType, projectId]);

  const handleToolClick = (tool: ToolCard) => {
    if (tool.isLocked) return;

    const basePath = projectId
      ? `/project/${projectId}/module/${module}`
      : `/module/${module}`;
    navigate(`${basePath}/${tool.route}`);
  };

  const handleBackClick = () => {
    if (projectId) {
      navigate(`/project/${projectId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Breadcrumbs */}
      <div className="flex-shrink-0">
        <Breadcrumbs />
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{moduleName}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Choose a tool to get started</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-7xl mx-auto p-8">
          {/* Tools Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <div
                  key={tool.route}
                  onClick={() => handleToolClick(tool)}
                  className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition ${
                    tool.isLocked
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer'
                  }`}
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{tool.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{tool.description}</p>
                  {tool.isLocked && (
                    <div className="mt-4 text-yellow-600 dark:text-yellow-500 text-sm">
                      Coming Soon
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 text-center text-sm text-gray-400 flex-shrink-0">
        ShowStack v0.1.0-alpha | © 2025 Lytrix
      </footer>
    </div>
  );
}
