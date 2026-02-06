import { useState } from 'react';
import {
  Settings as SettingsIcon,
  X,
  Monitor,
  Edit3,
  FolderOpen,
  Users,
  Sliders,
  FileType,
  Printer,
  Shield,
} from 'lucide-react';
import { WorkspacePreferences } from '../settings/WorkspacePreferences';
import { EditorSettings } from '../settings/EditorSettings';
import { ProjectManagement } from '../settings/ProjectManagement';
import { Collaboration } from '../settings/Collaboration';
import { AdvancedSettings } from '../settings/AdvancedSettings';
import { ProjectDefaults } from '../settings/ProjectDefaults';
import { PrintSettings } from '../settings/PrintSettings';
import { PrivacySettings } from '../settings/PrivacySettings';

type Tab =
  | 'workspace'
  | 'editor'
  | 'projects'
  | 'collaboration'
  | 'advanced'
  | 'defaults'
  | 'print'
  | 'privacy';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('workspace');

  if (!isOpen) return null;

  const tabClass = (isActive: boolean) =>
    `flex items-center gap-2 py-3 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
      isActive
        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
    }`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-6xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg flex-shrink-0">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-x-auto">
          <nav className="flex px-6">
            <button
              onClick={() => setActiveTab('workspace')}
              className={tabClass(activeTab === 'workspace')}
            >
              <Monitor className="w-4 h-4" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={tabClass(activeTab === 'editor')}
            >
              <Edit3 className="w-4 h-4" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('defaults')}
              className={tabClass(activeTab === 'defaults')}
            >
              <FileType className="w-4 h-4" />
              <span>Project Defaults</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={tabClass(activeTab === 'projects')}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Project Management</span>
            </button>
            <button
              onClick={() => setActiveTab('print')}
              className={tabClass(activeTab === 'print')}
            >
              <Printer className="w-4 h-4" />
              <span>Print Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('collaboration')}
              className={tabClass(activeTab === 'collaboration')}
            >
              <Users className="w-4 h-4" />
              <span>Collaboration</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={tabClass(activeTab === 'privacy')}
            >
              <Shield className="w-4 h-4" />
              <span>Privacy</span>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={tabClass(activeTab === 'advanced')}
            >
              <Sliders className="w-4 h-4" />
              <span>Advanced</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {activeTab === 'workspace' && <WorkspacePreferences />}
          {activeTab === 'editor' && <EditorSettings />}
          {activeTab === 'defaults' && <ProjectDefaults />}
          {activeTab === 'projects' && <ProjectManagement />}
          {activeTab === 'print' && <PrintSettings />}
          {activeTab === 'collaboration' && <Collaboration />}
          {activeTab === 'privacy' && <PrivacySettings />}
          {activeTab === 'advanced' && <AdvancedSettings />}
        </div>
      </div>
    </div>
  );
}
