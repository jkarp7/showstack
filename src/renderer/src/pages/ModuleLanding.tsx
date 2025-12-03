import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFileStore } from '../store/fileStore';
import { getRecentFiles, removeRecentFile, RecentFile } from '../utils/recentFiles';

type ModuleType = 'production' | 'manager' | 'design';

interface ToolCard {
  name: string;
  description: string;
  icon: string;
  route: string;
  isLocked: boolean;
}

const MODULE_TOOLS: Record<ModuleType, ToolCard[]> = {
  production: [
    {
      name: 'System Docs',
      description: 'Equipment Manager, Paperwork Generator, and Label Designer - Lightwright parity tool',
      icon: '📊',
      route: 'system-docs',
      isLocked: false
    },
    {
      name: 'Shop Order',
      description: 'Equipment orders and specifications for rental houses',
      icon: '📋',
      route: 'shop-order',
      isLocked: false
    },
    {
      name: 'Blueprint',
      description: 'System drawings and rack elevations - Omnigraffle parity tool (Coming Soon)',
      icon: '📐',
      route: 'blueprint',
      isLocked: true
    }
  ],
  manager: [
    {
      name: 'Tour Manager',
      description: 'Manage tour schedules, logistics, and travel',
      icon: '🗺️',
      route: 'tour',
      isLocked: true
    }
  ],
  design: [
    {
      name: 'Design Studio',
      description: 'Create lighting designs and visualizations',
      icon: '🎨',
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
  const { openFile, openFileByPath } = useFileStore();
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  const module = moduleType as ModuleType;
  const tools = MODULE_TOOLS[module] || [];
  const moduleName = MODULE_NAMES[module] || 'ShowStack';

  useEffect(() => {
    loadRecentFiles();
  }, [moduleType]);

  const loadRecentFiles = async () => {
    // Load recent files for this specific module type
    const files = await getRecentFiles(module as any);
    setRecentFiles(files);
  };

  const handleOpenRecentFile = async (filePath: string) => {
    try {
      const success = await openFileByPath(filePath, async () => {
        await loadRecentFiles();
      });

      if (success) {
        // Navigate to the first available tool
        const firstTool = tools.find(t => !t.isLocked);
        if (firstTool) {
          const basePath = projectId
            ? `/project/${projectId}/module/${module}`
            : `/module/${module}`;
          navigate(`${basePath}/${firstTool.route}`);
        }
      } else {
        // File open failed, remove from recent files
        await removeRecentFile(filePath, module as any);
        await loadRecentFiles();
      }
    } catch (error) {
      console.error('Failed to open recent file:', error);
      await removeRecentFile(filePath, module as any);
      await loadRecentFiles();
    }
  };

  const handleRemoveRecentFile = async (filePath: string) => {
    await removeRecentFile(filePath, module as any);
    await loadRecentFiles();
  };

  const handleOpenFile = async () => {
    await openFile(async () => {
      await loadRecentFiles();
      // Navigate to the first available tool
      const firstTool = tools.find(t => !t.isLocked);
      if (firstTool) {
        const basePath = projectId
          ? `/project/${projectId}/module/${module}`
          : `/module/${module}`;
        navigate(`${basePath}/${firstTool.route}`);
      }
    });
  };

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
    <div className="h-screen flex flex-col bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBackClick}
              className="text-gray-400 hover:text-gray-900 dark:text-white flex items-center gap-2"
            >
              ← Back to {projectId ? 'Project' : 'Home'}
            </button>
            {projectId && (
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                title="Home (Projects)"
              >
                🏠
              </button>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{moduleName}</h1>
            <p className="text-gray-400 text-sm mt-1">Choose a tool or open a recent file</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Tools Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <div
                  key={tool.route}
                  onClick={() => handleToolClick(tool)}
                  className={`bg-gray-800 rounded-lg border border-gray-700 p-6 transition ${
                    tool.isLocked
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:border-blue-500 cursor-pointer'
                  }`}
                >
                  <div className="text-4xl mb-4">{tool.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{tool.name}</h3>
                  <p className="text-gray-400 text-sm">{tool.description}</p>
                  {tool.isLocked && (
                    <div className="mt-4 text-yellow-500 text-sm flex items-center gap-2">
                      🔒 Coming Soon
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Files Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Files</h2>
              <button
                onClick={handleOpenFile}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                Open File...
              </button>
            </div>

            {recentFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentFiles.map((file) => (
                  <div
                    key={file.filePath}
                    className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-blue-500 transition cursor-pointer group"
                    onClick={() => handleOpenRecentFile(file.filePath)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">📄</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRecentFile(file.filePath);
                        }}
                        className="text-gray-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                        title="Remove from recent"
                      >
                        ×
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 truncate">{file.projectName}</h3>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(file.created).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last opened: {new Date(file.lastOpened).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                <div className="text-6xl mb-4">📂</div>
                <p className="text-gray-400 text-lg mb-4">No recent files</p>
                <p className="text-gray-500 text-sm mb-6">
                  Open an existing file or create a new one to get started
                </p>
                <button
                  onClick={handleOpenFile}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                >
                  Open File...
                </button>
              </div>
            )}
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
