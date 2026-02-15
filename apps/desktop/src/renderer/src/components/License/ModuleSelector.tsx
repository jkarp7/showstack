import React, { useEffect, useState } from 'react';
import { logger } from '../../utils/logger';
import { Lightbulb, Speaker, Monitor, ClipboardList, Bus, DollarSign, Lock } from 'lucide-react';
import type { ShowStackModule } from '../../../../shared/types/license.types';

interface ModuleSelectorProps {
  currentModule: ShowStackModule;
  onModuleChange: (module: ShowStackModule) => void;
}

/**
 * Module selector component for switching between ShowStack modules
 *
 * Displays all available modules (Lighting, Sound, Video, etc.) and shows
 * locked state for modules the user doesn't have access to.
 *
 * Features:
 * - Shows module icon and description
 * - Lock icon for inaccessible modules
 * - Active state highlighting
 * - Disabled state for locked modules
 *
 * @example
 * ```tsx
 * const [currentModule, setCurrentModule] = useState<ShowStackModule>('lighting');
 *
 * return (
 *   <ModuleSelector
 *     currentModule={currentModule}
 *     onModuleChange={setCurrentModule}
 *   />
 * );
 * ```
 */
export function ModuleSelector({ currentModule, onModuleChange }: ModuleSelectorProps) {
  const [availableModules, setAvailableModules] = useState<ShowStackModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableModules();
  }, []);

  async function loadAvailableModules() {
    try {
      const modules = await window.api.license.getAvailableModules();
      setAvailableModules(modules);
    } catch (error) {
      logger.error('Failed to load modules:', error);
    } finally {
      setLoading(false);
    }
  }

  const moduleConfig = {
    lighting: {
      icon: Lightbulb,
      label: 'Lighting',
      description: 'Fixture management & paperwork',
    },
    sound: {
      icon: Speaker,
      label: 'Sound',
      description: 'Audio system design',
    },
    video: {
      icon: Monitor,
      label: 'Video',
      description: 'Video & projection planning',
    },
    production_management: {
      icon: ClipboardList,
      label: 'Production Mgmt',
      description: 'Scheduling & logistics',
    },
    touring: {
      icon: Bus,
      label: 'Touring',
      description: 'Tour management & per diems',
    },
    producer: {
      icon: DollarSign,
      label: 'Producer',
      description: 'Budgeting & financial tracking',
    },
  };

  if (loading) {
    return (
      <div className="flex gap-2 p-4 border-b border-gray-200">
        <div className="text-gray-500">Loading modules...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto">
      {Object.entries(moduleConfig).map(([key, config]) => {
        const module = key as ShowStackModule;
        const Icon = config.icon;
        const hasAccess = availableModules.includes(module);
        const isActive = currentModule === module;

        return (
          <button
            key={module}
            onClick={() => hasAccess && onModuleChange(module)}
            disabled={!hasAccess}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap
              ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}
              ${
                !hasAccess
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium flex items-center gap-2">
                {config.label}
                {!hasAccess && <Lock className="w-3 h-3" />}
              </div>
              <div className="text-xs opacity-75">{config.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
