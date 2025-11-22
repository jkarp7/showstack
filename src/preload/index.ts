import { contextBridge, ipcRenderer } from 'electron';

// Define the Fixture type (will match renderer types)
interface Fixture {
  id: string;
  position?: string;
  unit?: number;
  type?: string;
  purpose?: string;
  channel?: string;
  dimmer?: string;
  circuit?: string;
  color?: string;
  location?: string;
  wattage?: number;
  status?: string;
  notes?: string;
  [key: string]: any;
}

// Expose APIs to renderer
contextBridge.exposeInMainWorld('api', {
  // Fixture operations
  fixtures: {
    getAll: () => ipcRenderer.invoke('fixtures:getAll'),
    create: (fixture: Partial<Fixture>) => ipcRenderer.invoke('fixtures:create', fixture),
    update: (id: string, updates: Partial<Fixture>) =>
      ipcRenderer.invoke('fixtures:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('fixtures:delete', id),
    deleteMultiple: (ids: string[]) => ipcRenderer.invoke('fixtures:deleteMultiple', ids)
  },

  // Project operations
  projects: {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    getCurrent: () => ipcRenderer.invoke('projects:getCurrent'),
    getById: (id: string) => ipcRenderer.invoke('projects:getById', id),
    create: (name: string, description?: string, logoPath?: string, enabledModules?: string[]) =>
      ipcRenderer.invoke('projects:create', name, description, logoPath, enabledModules),
    update: (id: string, updates: any) => ipcRenderer.invoke('projects:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id)
  },

  // Dialog operations
  dialog: {
    openImage: () => ipcRenderer.invoke('dialog:openImage'),
    openProject: () => ipcRenderer.invoke('dialog:openProject')
  },

  // User preferences
  preferences: {
    get: (projectId: string, key: string) => ipcRenderer.invoke('preferences:get', projectId, key),
    set: (projectId: string, key: string, value: any) => ipcRenderer.invoke('preferences:set', projectId, key, value),
    getAll: (projectId: string) => ipcRenderer.invoke('preferences:getAll', projectId)
  },

  // File operations
  files: {
    open: () => ipcRenderer.invoke('file:open'),
    openByPath: (filePath: string) => ipcRenderer.invoke('file:openByPath', filePath),
    resolveConflict: (filePath: string, resolution: any) => ipcRenderer.invoke('file:resolveConflict', filePath, resolution),
    save: (filePath?: string) => ipcRenderer.invoke('file:save', filePath),
    saveAs: (defaultName?: string, module?: string) => ipcRenderer.invoke('file:saveAs', defaultName, module),
    new: () => ipcRenderer.invoke('file:new'),
    validate: (filePath: string) => ipcRenderer.invoke('file:validate', filePath),
    getFileName: (filePath: string) => ipcRenderer.invoke('file:getFileName', filePath)
  },

  // ShowStack:Prep operations
  prep: {
    // Projects
    projects: {
      getAll: () => ipcRenderer.invoke('prep:projects:getAll'),
      getById: (id: string) => ipcRenderer.invoke('prep:projects:getById', id),
      create: (data: any) => ipcRenderer.invoke('prep:projects:create', data),
      update: (id: string, updates: any) => ipcRenderer.invoke('prep:projects:update', id, updates),
      delete: (id: string) => ipcRenderer.invoke('prep:projects:delete', id)
    },
    // Sections
    sections: {
      getByProjectId: (projectId: string) => ipcRenderer.invoke('prep:sections:getByProjectId', projectId),
      create: (data: any) => ipcRenderer.invoke('prep:sections:create', data),
      update: (id: string, updates: any) => ipcRenderer.invoke('prep:sections:update', id, updates),
      delete: (id: string) => ipcRenderer.invoke('prep:sections:delete', id)
    },
    // Equipment Items
    items: {
      getBySectionId: (sectionId: string) => ipcRenderer.invoke('prep:items:getBySectionId', sectionId),
      getByProjectId: (projectId: string) => ipcRenderer.invoke('prep:items:getByProjectId', projectId),
      create: (data: any) => ipcRenderer.invoke('prep:items:create', data),
      update: (id: string, updates: any) => ipcRenderer.invoke('prep:items:update', id, updates),
      delete: (id: string) => ipcRenderer.invoke('prep:items:delete', id)
    },
    // Revisions
    revisions: {
      getByProjectId: (projectId: string) => ipcRenderer.invoke('prep:revisions:getByProjectId', projectId),
      create: (data: any) => ipcRenderer.invoke('prep:revisions:create', data),
      delete: (id: string) => ipcRenderer.invoke('prep:revisions:delete', id)
    },
    // Notes
    notes: {
      getByProjectId: (projectId: string, type?: string) => ipcRenderer.invoke('prep:notes:getByProjectId', projectId, type),
      create: (data: any) => ipcRenderer.invoke('prep:notes:create', data),
      update: (id: string, content: string) => ipcRenderer.invoke('prep:notes:update', id, content),
      delete: (id: string) => ipcRenderer.invoke('prep:notes:delete', id)
    },
    // Note Templates
    noteTemplates: {
      getAll: (type?: string) => ipcRenderer.invoke('prep:noteTemplates:getAll', type),
      getById: (id: string) => ipcRenderer.invoke('prep:noteTemplates:getById', id),
      getDefault: (type: string) => ipcRenderer.invoke('prep:noteTemplates:getDefault', type),
      create: (data: any) => ipcRenderer.invoke('prep:noteTemplates:create', data),
      update: (id: string, updates: any) => ipcRenderer.invoke('prep:noteTemplates:update', id, updates),
      delete: (id: string) => ipcRenderer.invoke('prep:noteTemplates:delete', id)
    },
    // File Operations
    file: {
      showOpenDialog: () => ipcRenderer.invoke('prep:file:showOpenDialog'),
      showSaveDialog: (defaultName?: string) => ipcRenderer.invoke('prep:file:showSaveDialog', defaultName),
      export: (projectId: string, filePath: string) => ipcRenderer.invoke('prep:file:export', projectId, filePath),
      import: (filePath: string) => ipcRenderer.invoke('prep:file:import', filePath),
      getFileName: (filePath: string) => ipcRenderer.invoke('prep:file:getFileName', filePath)
    }
  },

  // License operations
  license: {
    getStatus: () => ipcRenderer.invoke('license:getStatus'),
    getCurrent: () => ipcRenderer.invoke('license:getCurrent'),
    hasModule: (module: string) => ipcRenderer.invoke('license:hasModule', module),
    getModuleFeatures: (module: string) => ipcRenderer.invoke('license:getModuleFeatures', module),
    getAvailableModules: () => ipcRenderer.invoke('license:getAvailableModules'),
    canUseFeature: (module: string, feature: string) => ipcRenderer.invoke('license:canUseFeature', module, feature),
    activate: (licenseKey: string, email: string, modules: string[]) =>
      ipcRenderer.invoke('license:activate', licenseKey, email, modules),
    verifyOnline: () => ipcRenderer.invoke('license:verifyOnline')
  },

  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings: any) => ipcRenderer.invoke('settings:save', settings),
    update: (updates: any) => ipcRenderer.invoke('settings:update', updates),
    reset: () => ipcRenderer.invoke('settings:reset')
  }
});

// TypeScript declaration
export interface ElectronAPI {
  fixtures: {
    getAll: () => Promise<Fixture[]>;
    create: (fixture: Partial<Fixture>) => Promise<Fixture>;
    update: (id: string, updates: Partial<Fixture>) => Promise<Fixture>;
    delete: (id: string) => Promise<void>;
    deleteMultiple: (ids: string[]) => Promise<void>;
  };
  projects: {
    getAll: () => Promise<any[]>;
    getCurrent: () => Promise<any>;
    getById: (id: string) => Promise<any>;
    create: (name: string, description?: string, logoPath?: string, enabledModules?: string[]) => Promise<any>;
    update: (id: string, updates: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
  };
  dialog: {
    openImage: () => Promise<string | null>;
    openProject: () => Promise<string | null>;
  };
  preferences: {
    get: (projectId: string, key: string) => Promise<any | null>;
    set: (projectId: string, key: string, value: any) => Promise<void>;
    getAll: (projectId: string) => Promise<Record<string, any>>;
  };
  files: {
    open: () => Promise<any>;
    openByPath: (filePath: string) => Promise<any>;
    resolveConflict: (filePath: string, resolution: any) => Promise<any>;
    save: (filePath?: string) => Promise<string | null>;
    saveAs: (defaultName?: string, module?: string) => Promise<string | null>;
    new: () => Promise<string>;
    validate: (filePath: string) => Promise<any>;
    getFileName: (filePath: string) => Promise<string>;
  };
  prep: {
    projects: {
      getAll: () => Promise<any[]>;
      getById: (id: string) => Promise<any | null>;
      create: (data: any) => Promise<any>;
      update: (id: string, updates: any) => Promise<any>;
      delete: (id: string) => Promise<void>;
    };
    sections: {
      getByProjectId: (projectId: string) => Promise<any[]>;
      create: (data: any) => Promise<any>;
      update: (id: string, updates: any) => Promise<any>;
      delete: (id: string) => Promise<void>;
    };
    items: {
      getBySectionId: (sectionId: string) => Promise<any[]>;
      getByProjectId: (projectId: string) => Promise<any[]>;
      create: (data: any) => Promise<any>;
      update: (id: string, updates: any) => Promise<any>;
      delete: (id: string) => Promise<void>;
    };
    revisions: {
      getByProjectId: (projectId: string) => Promise<any[]>;
      create: (data: any) => Promise<any>;
      delete: (id: string) => Promise<void>;
    };
    notes: {
      getByProjectId: (projectId: string, type?: string) => Promise<any[]>;
      create: (data: any) => Promise<any>;
      update: (id: string, content: string) => Promise<any>;
      delete: (id: string) => Promise<void>;
    };
    noteTemplates: {
      getAll: (type?: string) => Promise<any[]>;
      getById: (id: string) => Promise<any | null>;
      getDefault: (type: string) => Promise<any | null>;
      create: (data: any) => Promise<any>;
      update: (id: string, updates: any) => Promise<any>;
      delete: (id: string) => Promise<void>;
    };
    file: {
      showOpenDialog: () => Promise<string | null>;
      showSaveDialog: (defaultName?: string) => Promise<string | null>;
      export: (projectId: string, filePath: string) => Promise<{ success: boolean }>;
      import: (filePath: string) => Promise<any>;
      getFileName: (filePath: string) => Promise<string>;
    };
  };
  license: {
    getStatus: () => Promise<any>;
    getCurrent: () => Promise<any>;
    hasModule: (module: string) => Promise<boolean>;
    getModuleFeatures: (module: string) => Promise<any>;
    getAvailableModules: () => Promise<string[]>;
    canUseFeature: (module: string, feature: string) => Promise<boolean>;
    activate: (licenseKey: string, email: string, modules: string[]) => Promise<any>;
    verifyOnline: () => Promise<boolean>;
  };
  settings: {
    get: () => Promise<any>;
    save: (settings: any) => Promise<{ success: boolean }>;
    update: (updates: any) => Promise<{ success: boolean }>;
    reset: () => Promise<{ success: boolean }>;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
