import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EquipmentManager } from './EquipmentManager';
import { Paperwork } from './Paperwork';
import { LabelDesigner } from './LabelDesigner';

type SystemDocsTab = 'equipment' | 'paperwork' | 'labels';

export function SystemDocs() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const [activeTab, setActiveTab] = useState<SystemDocsTab>('equipment');

  const tabs = [
    { id: 'equipment' as SystemDocsTab, name: 'Equipment Manager', icon: '📊' },
    { id: 'paperwork' as SystemDocsTab, name: 'Paperwork', icon: '📋' },
    { id: 'labels' as SystemDocsTab, name: 'Labels', icon: '🏷️' }
  ];

  const handleBackClick = () => {
    if (routeProjectId) {
      // Go back to project (list of modules)
      navigate(`/project/${routeProjectId}`);
    } else {
      // Go to shell (list of projects)
      navigate('/');
    }
  };

  const handleHomeClick = () => {
    // Always go to shell
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-700">
        <div className="flex items-center">
          <button
            onClick={handleBackClick}
            className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 border-r border-gray-200 dark:border-gray-700 transition"
            title={routeProjectId ? "Back to Project" : "Back to Projects"}
          >
            ← Back
          </button>
          <div className="flex flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 border-r border-gray-700 transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-gray-900 dark:text-white border-b-2 border-blue-500'
                    : 'bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleHomeClick}
            className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:bg-gray-600 border-l border-gray-200 dark:border-gray-700 transition text-xl"
            title="Home (Projects)"
          >
            🏠
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'equipment' && <EquipmentManager embedded />}
        {activeTab === 'paperwork' && <Paperwork embedded />}
        {activeTab === 'labels' && <LabelDesigner embedded />}
      </div>
    </div>
  );
}
