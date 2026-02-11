import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { logger } from '../../utils/logger';
import { useProjectStore } from '../../store/projectStore';
import { useFixtureStore } from '../../store/fixtureStore';
import { RackManager } from '../../components/power/RackManager';
import { PowerSummaryPanel } from '../../components/power/PowerSummaryPanel';
import { PhaseTemplateManager } from '../../components/power/PhaseTemplateManager';
import { ServiceConfigurationPanel } from '../../components/power/ServiceConfigurationPanel';
import { DimmerRack, PDRack } from '../../types/power';
import { Zap, Server, Activity, Settings } from 'lucide-react';

interface PowerManagementProps {
  embedded?: boolean;
}

type PowerTab = 'racks' | 'configuration' | 'summary';

export function PowerManagement({ embedded = false }: PowerManagementProps) {
  const { projectId } = useParams<{ projectId?: string }>();
  const currentProject = useProjectStore((state) => state.currentProject);
  const fixtures = useFixtureStore((state) => state.fixtures);
  const [activeTab, setActiveTab] = useState<PowerTab>('racks');
  const [dimmerRacks, setDimmerRacks] = useState<DimmerRack[]>([]);
  const [pdRacks, setPdRacks] = useState<PDRack[]>([]);

  const tabs = [
    { id: 'racks' as PowerTab, name: 'Racks & Distribution', icon: Server },
    { id: 'configuration' as PowerTab, name: 'Services & Templates', icon: Settings },
    { id: 'summary' as PowerTab, name: 'Power Summary', icon: Zap },
  ];

  const effectiveProjectId = projectId || currentProject?.id;

  // Load racks when project changes
  useEffect(() => {
    const loadRacks = async () => {
      if (!effectiveProjectId) return;

      try {
        const [dimmers, pds] = await Promise.all([
          window.api.dimmerRacks.getAll(effectiveProjectId),
          window.api.pdRacks.getAll(effectiveProjectId),
        ]);
        setDimmerRacks(dimmers || []);
        setPdRacks(pds || []);
      } catch (error) {
        logger.error('Error loading racks:', error);
      }
    };

    loadRacks();
  }, [effectiveProjectId]);

  if (!effectiveProjectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Please select or create a project to manage power distribution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 border-r border-gray-200 dark:border-gray-700 transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-b-2 border-blue-500'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'racks' && (
          <div className="h-full overflow-y-auto p-6">
            <RackManager projectId={effectiveProjectId} />
          </div>
        )}
        {activeTab === 'configuration' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <ServiceConfigurationPanel projectId={effectiveProjectId} />
            <PhaseTemplateManager projectId={effectiveProjectId} />
          </div>
        )}
        {activeTab === 'summary' && (
          <div className="h-full overflow-y-auto p-6">
            <PowerSummaryPanel dimmerRacks={dimmerRacks} pdRacks={pdRacks} fixtures={fixtures} />
          </div>
        )}
      </div>
    </div>
  );
}
