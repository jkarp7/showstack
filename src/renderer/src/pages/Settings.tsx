import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, ArrowLeft, Monitor, Edit3, FolderOpen, Users, Sliders, FileType, Printer } from 'lucide-react';
import { WorkspacePreferences } from '../components/settings/WorkspacePreferences';
import { EditorSettings } from '../components/settings/EditorSettings';
import { ProjectManagement } from '../components/settings/ProjectManagement';
import { Collaboration } from '../components/settings/Collaboration';
import { AdvancedSettings } from '../components/settings/AdvancedSettings';
import { ProjectDefaults } from '../components/settings/ProjectDefaults';
import { PrintSettings } from '../components/settings/PrintSettings';

type Tab = 'workspace' | 'editor' | 'projects' | 'collaboration' | 'advanced' | 'defaults' | 'print';

export function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('workspace');

  const tabClass = (isActive: boolean) => `flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
    isActive
      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
  }`;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button onClick={() => setActiveTab('workspace')} className={tabClass(activeTab === 'workspace')}>
              <Monitor className="w-5 h-5" />
              <span>Workspace</span>
            </button>
            <button onClick={() => setActiveTab('editor')} className={tabClass(activeTab === 'editor')}>
              <Edit3 className="w-5 h-5" />
              <span>Editor</span>
            </button>
            <button onClick={() => setActiveTab('defaults')} className={tabClass(activeTab === 'defaults')}>
              <FileType className="w-5 h-5" />
              <span>Project Defaults</span>
            </button>
            <button onClick={() => setActiveTab('projects')} className={tabClass(activeTab === 'projects')}>
              <FolderOpen className="w-5 h-5" />
              <span>Project Management</span>
            </button>
            <button onClick={() => setActiveTab('print')} className={tabClass(activeTab === 'print')}>
              <Printer className="w-5 h-5" />
              <span>Print Settings</span>
            </button>
            <button onClick={() => setActiveTab('collaboration')} className={tabClass(activeTab === 'collaboration')}>
              <Users className="w-5 h-5" />
              <span>Collaboration</span>
            </button>
            <button onClick={() => setActiveTab('advanced')} className={tabClass(activeTab === 'advanced')}>
              <Sliders className="w-5 h-5" />
              <span>Advanced</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'workspace' && <WorkspacePreferences />}
          {activeTab === 'editor' && <EditorSettings />}
          {activeTab === 'defaults' && <ProjectDefaults />}
          {activeTab === 'projects' && <ProjectManagement />}
          {activeTab === 'print' && <PrintSettings />}
          {activeTab === 'collaboration' && <Collaboration />}
          {activeTab === 'advanced' && <AdvancedSettings />}
        </div>
      </div>
    </div>
  );
}
