import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EquipmentManager } from './EquipmentManager';
import { Paperwork } from './Paperwork';
import { LabelDesigner } from './LabelDesigner';

type ProductionTab = 'equipment' | 'paperwork' | 'labels';

export function Production() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const [activeTab, setActiveTab] = useState<ProductionTab>('equipment');

  const tabs = [
    { id: 'equipment' as ProductionTab, name: 'Equipment Manager', icon: '📊' },
    { id: 'paperwork' as ProductionTab, name: 'Paperwork', icon: '📋' },
    { id: 'labels' as ProductionTab, name: 'Labels', icon: '🏷️' }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/modules')}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 border-r border-gray-700 transition"
            title="Back to Modules"
          >
            ← Home
          </button>
          <div className="flex flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 border-r border-gray-700 transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
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
