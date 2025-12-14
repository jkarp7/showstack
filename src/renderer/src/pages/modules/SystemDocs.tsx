import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EquipmentManager } from './EquipmentManager';
import { Paperwork } from './Paperwork';
import { LabelDesigner } from './LabelDesigner';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { DeveloperPanel } from '../../components/common/DeveloperPanel';
import { telemetry } from '../../services/telemetry';

type SystemDocsTab = 'equipment' | 'paperwork' | 'labels';

export function SystemDocs() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const [activeTab, setActiveTab] = useState<SystemDocsTab>('equipment');
  const [moduleStartTime] = useState(Date.now());
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Track module usage
  useEffect(() => {
    telemetry.track('module_opened', {
      module: 'production',
      tool: 'system-docs',
      projectId: routeProjectId || 'standalone',
    });

    return () => {
      const duration = Math.floor((Date.now() - moduleStartTime) / 1000);
      telemetry.track('module_closed', {
        module: 'production',
        tool: 'system-docs',
        projectId: routeProjectId || 'standalone',
        duration,
        tabSwitches: tabSwitchCount,
      });
    };
  }, [routeProjectId, moduleStartTime, tabSwitchCount]);

  const tabs = [
    { id: 'equipment' as SystemDocsTab, name: 'Equipment Manager', icon: '📊' },
    { id: 'paperwork' as SystemDocsTab, name: 'Paperwork', icon: '📋' },
    { id: 'labels' as SystemDocsTab, name: 'Labels', icon: '🏷️' }
  ];

  const handleBackClick = () => {
    if (routeProjectId) {
      // Go back to module tool selection
      navigate(`/project/${routeProjectId}/module/production`);
    } else {
      // Go back to module tool selection (no project context)
      navigate('/module/production');
    }
  };

  const handleHomeClick = () => {
    // Always go to shell
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setTabSwitchCount(prev => prev + 1);
              }}
              className={`px-6 py-3 border-r border-gray-200 dark:border-gray-700 transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-b-2 border-blue-500'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'equipment' && <EquipmentManager embedded />}
        {activeTab === 'paperwork' && <Paperwork embedded />}
        {activeTab === 'labels' && <LabelDesigner embedded />}
      </div>

      {/* Developer Panel */}
      <DeveloperPanel
        title="Production Module (System Docs)"
        data={{
          projectId: routeProjectId || 'standalone',
          activeTab,
          route: window.location.pathname,
          embedded: true,
        }}
        metrics={{
          'Time Open (s)': Math.floor((Date.now() - moduleStartTime) / 1000),
          'Tab Switches': tabSwitchCount,
        }}
      >
        <div className="space-y-2">
          <p className="text-xs">Active Tool: {tabs.find(t => t.id === activeTab)?.name}</p>
          <p className="text-xs text-purple-300">Equipment Manager, Paperwork, and Labels integrated</p>
        </div>
      </DeveloperPanel>
    </div>
  );
}
