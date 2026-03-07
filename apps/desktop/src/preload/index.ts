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
    getAll: (projectId?: string) => ipcRenderer.invoke('fixtures:getAll', projectId),
    create: (fixture: Partial<Fixture>, projectId?: string) =>
      ipcRenderer.invoke('fixtures:create', fixture, projectId),
    update: (id: string, updates: Partial<Fixture>) =>
      ipcRenderer.invoke('fixtures:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('fixtures:delete', id),
    deleteMultiple: (ids: string[]) => ipcRenderer.invoke('fixtures:deleteMultiple', ids),
  },

  // Project operations
  projects: {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    getCurrent: () => ipcRenderer.invoke('projects:getCurrent'),
    getById: (id: string) => ipcRenderer.invoke('projects:getById', id),
    create: (name: string, description?: string, logoPath?: string, enabledModules?: string[]) =>
      ipcRenderer.invoke('projects:create', name, description, logoPath, enabledModules),
    update: (id: string, updates: any) => ipcRenderer.invoke('projects:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id),
    createCopy: (originalProjectId: string, copyName?: string) =>
      ipcRenderer.invoke('projects:createCopy', originalProjectId, copyName),
  },

  // Dialog operations
  dialog: {
    openImage: () => ipcRenderer.invoke('dialog:openImage'),
    openProject: () => ipcRenderer.invoke('dialog:openProject'),
  },

  // User preferences
  preferences: {
    get: (projectId: string, key: string) => ipcRenderer.invoke('preferences:get', projectId, key),
    set: (projectId: string, key: string, value: any) =>
      ipcRenderer.invoke('preferences:set', projectId, key, value),
    getAll: (projectId: string) => ipcRenderer.invoke('preferences:getAll', projectId),
  },

  // File operations
  files: {
    open: () => ipcRenderer.invoke('file:open'),
    openByPath: (filePath: string) => ipcRenderer.invoke('file:openByPath', filePath),
    resolveConflict: (filePath: string, resolution: any) =>
      ipcRenderer.invoke('file:resolveConflict', filePath, resolution),
    save: (filePath?: string) => ipcRenderer.invoke('file:save', filePath),
    saveAs: (defaultName?: string, module?: string) =>
      ipcRenderer.invoke('file:saveAs', defaultName, module),
    new: () => ipcRenderer.invoke('file:new'),
    exportProject: (projectId: string, projectName: string) =>
      ipcRenderer.invoke('file:exportProject', projectId, projectName),
    validate: (filePath: string) => ipcRenderer.invoke('file:validate', filePath),
    getFileName: (filePath: string) => ipcRenderer.invoke('file:getFileName', filePath),
    readImageAsDataUrl: (imagePath: string) =>
      ipcRenderer.invoke('file:readImageAsDataUrl', imagePath),
  },

  // ShowStack:Prep operations
  prep: {
    // Projects
    projects: {
      getAll: () => ipcRenderer.invoke('shop-order:projects:getAll'),
      getById: (id: string) => ipcRenderer.invoke('shop-order:projects:getById', id),
      create: (data: any) => ipcRenderer.invoke('shop-order:projects:create', data),
      update: (id: string, updates: any) =>
        ipcRenderer.invoke('shop-order:projects:update', id, updates),
      delete: (id: string) => ipcRenderer.invoke('shop-order:projects:delete', id),
    },
    // Sections
    sections: {
      getByProjectId: (projectId: string) =>
        ipcRenderer.invoke('shop-order:sections:getByProjectId', projectId),
      create: (data: any) => ipcRenderer.invoke('shop-order:sections:create', data),
      update: (id: string, updates: any) =>
        ipcRenderer.invoke('shop-order:sections:update', id, updates),
      delete: (id: string) => ipcRenderer.invoke('shop-order:sections:delete', id),
    },
    // Equipment Items
    items: {
      getBySectionId: (sectionId: string) =>
        ipcRenderer.invoke('shop-order:items:getBySectionId', sectionId),
      getByProjectId: (projectId: string) =>
        ipcRenderer.invoke('shop-order:items:getByProjectId', projectId),
      create: (data: any) => ipcRenderer.invoke('shop-order:items:create', data),
      update: (id: string, updates: any) =>
        ipcRenderer.invoke('shop-order:items:update', id, updates),
      delete: (id: string) => ipcRenderer.invoke('shop-order:items:delete', id),
    },
    // Revisions
    revisions: {
      getByProjectId: (projectId: string) =>
        ipcRenderer.invoke('shop-order:revisions:getByProjectId', projectId),
      create: (data: any) => ipcRenderer.invoke('shop-order:revisions:create', data),
      delete: (id: string) => ipcRenderer.invoke('shop-order:revisions:delete', id),
    },
    // Notes
    notes: {
      getByProjectId: (projectId: string, type?: string) =>
        ipcRenderer.invoke('shop-order:notes:getByProjectId', projectId, type),
      create: (data: any) => ipcRenderer.invoke('shop-order:notes:create', data),
      update: (id: string, updates: { content?: string; format?: string }) =>
        ipcRenderer.invoke('shop-order:notes:update', id, updates),
      delete: (id: string) => ipcRenderer.invoke('shop-order:notes:delete', id),
    },
    // Note Templates
    noteTemplates: {
      getAll: (type?: string) => ipcRenderer.invoke('shop-order:noteTemplates:getAll', type),
      getById: (id: string) => ipcRenderer.invoke('shop-order:noteTemplates:getById', id),
      getDefault: (type: string) => ipcRenderer.invoke('shop-order:noteTemplates:getDefault', type),
      create: (data: any) => ipcRenderer.invoke('shop-order:noteTemplates:create', data),
      update: (id: string, updates: any) =>
        ipcRenderer.invoke('shop-order:noteTemplates:update', id, updates),
      delete: (id: string) => ipcRenderer.invoke('shop-order:noteTemplates:delete', id),
    },
    // Layout Templates
    layoutTemplates: {
      getByProjectId: (projectId: string, pageType?: string) =>
        ipcRenderer.invoke('shop-order:layoutTemplates:getByProjectId', projectId, pageType),
      getById: (id: string) => ipcRenderer.invoke('shop-order:layoutTemplates:getById', id),
      getElements: (templateId: string) =>
        ipcRenderer.invoke('shop-order:layoutTemplates:getElements', templateId),
      getDefault: (projectId: string, pageType: string) =>
        ipcRenderer.invoke('shop-order:layoutTemplates:getDefault', projectId, pageType),
      create: (data: any, elements: any[]) =>
        ipcRenderer.invoke('shop-order:layoutTemplates:create', data, elements),
      update: (id: string, updates: any, elements?: any[]) =>
        ipcRenderer.invoke('shop-order:layoutTemplates:update', id, updates, elements),
      delete: (id: string) => ipcRenderer.invoke('shop-order:layoutTemplates:delete', id),
      seedDefaults: () => ipcRenderer.invoke('shop-order:layoutTemplates:seedDefaults'),
    },
    // File Operations
    file: {
      showOpenDialog: () => ipcRenderer.invoke('shop-order:file:showOpenDialog'),
      showSaveDialog: (defaultName?: string) =>
        ipcRenderer.invoke('shop-order:file:showSaveDialog', defaultName),
      export: (projectId: string, filePath: string) =>
        ipcRenderer.invoke('shop-order:file:export', projectId, filePath),
      import: (filePath: string) => ipcRenderer.invoke('shop-order:file:import', filePath),
      getFileName: (filePath: string) =>
        ipcRenderer.invoke('shop-order:file:getFileName', filePath),
    },
    // PDF Export
    exportPDF: (projectId: string, templateData: any) =>
      ipcRenderer.invoke('shop-order:exportPDF', projectId, templateData),
    // Print
    print: (projectId: string, templateData: any) =>
      ipcRenderer.invoke('shop-order:print', projectId, templateData),
  },

  // License operations
  license: {
    getStatus: () => ipcRenderer.invoke('license:getStatus'),
    getCurrent: () => ipcRenderer.invoke('license:getCurrent'),
    hasModule: (module: string) => ipcRenderer.invoke('license:hasModule', module),
    getModuleFeatures: (module: string) => ipcRenderer.invoke('license:getModuleFeatures', module),
    getAvailableModules: () => ipcRenderer.invoke('license:getAvailableModules'),
    canUseFeature: (module: string, feature: string) =>
      ipcRenderer.invoke('license:canUseFeature', module, feature),
    refresh: () => ipcRenderer.invoke('license:refresh'),
    verifyOnline: () => ipcRenderer.invoke('license:verifyOnline'),
    createDemo: () => ipcRenderer.invoke('license:createDemo'),
  },

  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings: any) => ipcRenderer.invoke('settings:save', settings),
    update: (updates: any) => ipcRenderer.invoke('settings:update', updates),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },

  // Admin operations
  admin: {
    verifyPassword: (password: string) => ipcRenderer.invoke('admin:verifyPassword', password),
    setPassword: (password: string) => ipcRenderer.invoke('admin:setPassword', password),
    hasPassword: () => ipcRenderer.invoke('admin:hasPassword'),
    exportLayout: (templateId: string) => ipcRenderer.invoke('admin:exportLayout', templateId),
    exportAllDefaultLayouts: () => ipcRenderer.invoke('admin:exportAllDefaultLayouts'),
    importLayouts: (filePaths?: string[]) => ipcRenderer.invoke('admin:importLayouts', filePaths),
    resetLayoutsToFactory: () => ipcRenderer.invoke('admin:resetLayoutsToFactory'),
    getDefaultLayoutFiles: () => ipcRenderer.invoke('admin:getDefaultLayoutFiles'),
  },

  // Window operations
  windows: {
    openProject: (projectId: string) => ipcRenderer.invoke('window:openProject', projectId),
    getCurrentProjectId: () => ipcRenderer.invoke('window:getCurrentProjectId'),
  },

  // Paperwork operations
  paperwork: {
    exportPDF: (htmlContent: string, filename: string, pageSettings: any) =>
      ipcRenderer.invoke('paperwork:exportPDF', htmlContent, filename, pageSettings),
  },

  // Paperwork Template operations
  paperworkTemplates: {
    getAll: (reportType?: string) => ipcRenderer.invoke('paperwork-templates:getAll', reportType),
    getById: (id: string) => ipcRenderer.invoke('paperwork-templates:getById', id),
    create: (data: any) => ipcRenderer.invoke('paperwork-templates:create', data),
    update: (id: string, updates: any) =>
      ipcRenderer.invoke('paperwork-templates:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('paperwork-templates:delete', id),
    duplicate: (id: string, newName?: string) =>
      ipcRenderer.invoke('paperwork-templates:duplicate', id, newName),
  },

  // Menu operations
  menu: {
    setState: (state: any) => ipcRenderer.invoke('menu:setState', state),
    getState: () => ipcRenderer.invoke('menu:getState'),
    reset: () => ipcRenderer.invoke('menu:reset'),
    on: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    },
    off: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, callback);
    },
  },

  // Shell operations
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },

  // Dimmer Rack operations
  dimmerRacks: {
    getAll: (projectId?: string) => ipcRenderer.invoke('dimmerRacks:getAll', projectId),
    getById: (id: string) => ipcRenderer.invoke('dimmerRacks:getById', id),
    create: (rack: any, projectId?: string) =>
      ipcRenderer.invoke('dimmerRacks:create', rack, projectId),
    update: (id: string, updates: any) => ipcRenderer.invoke('dimmerRacks:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('dimmerRacks:delete', id),
    getWithUsage: (projectId?: string) => ipcRenderer.invoke('dimmerRacks:getWithUsage', projectId),
  },

  // Dimmer Rack Module operations
  dimmerRackModules: {
    getByRackId: (rackId: string) => ipcRenderer.invoke('dimmerRackModules:getByRackId', rackId),
    create: (module: any) => ipcRenderer.invoke('dimmerRackModules:create', module),
    update: (id: string, updates: any) =>
      ipcRenderer.invoke('dimmerRackModules:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('dimmerRackModules:delete', id),
    getTypeForCircuit: (rackId: string, circuit: number) =>
      ipcRenderer.invoke('dimmerRackModules:getTypeForCircuit', rackId, circuit),
  },

  // PD Rack operations
  pdRacks: {
    getAll: (projectId?: string) => ipcRenderer.invoke('pdRacks:getAll', projectId),
    getById: (id: string) => ipcRenderer.invoke('pdRacks:getById', id),
    create: (rack: any, projectId?: string) =>
      ipcRenderer.invoke('pdRacks:create', rack, projectId),
    update: (id: string, updates: any) => ipcRenderer.invoke('pdRacks:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('pdRacks:delete', id),
    getWithUsage: (projectId?: string) => ipcRenderer.invoke('pdRacks:getWithUsage', projectId),
  },

  // Infrastructure Equipment operations
  infrastructure: {
    getAll: (projectId: string) => ipcRenderer.invoke('infrastructure:getAll', projectId),
    create: (equipment: any, projectId: string) =>
      ipcRenderer.invoke('infrastructure:create', equipment, projectId),
    update: (id: string, updates: any) => ipcRenderer.invoke('infrastructure:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('infrastructure:delete', id),
    deleteMultiple: (ids: string[]) => ipcRenderer.invoke('infrastructure:deleteMultiple', ids),
    getPortLinkages: (equipmentId: string, projectId: string) =>
      ipcRenderer.invoke('infrastructure:getPortLinkages', equipmentId, projectId),
    getFixtureConnections: (fixtureId: string, projectId: string) =>
      ipcRenderer.invoke('infrastructure:getFixtureConnections', fixtureId, projectId),
    getEquipmentConnections: (equipmentId: string, projectId: string) =>
      ipcRenderer.invoke('infrastructure:getEquipmentConnections', equipmentId, projectId),
    validatePortAssignment: (equipmentId: string, portAssignment: any, projectId: string) =>
      ipcRenderer.invoke(
        'infrastructure:validatePortAssignment',
        equipmentId,
        portAssignment,
        projectId,
      ),
    getPortUsageStats: (equipmentId: string) =>
      ipcRenderer.invoke('infrastructure:getPortUsageStats', equipmentId),
    getAllPortUsageStats: (projectId: string) =>
      ipcRenderer.invoke('infrastructure:getAllPortUsageStats', projectId),
    exportCSV: (projectId: string) => ipcRenderer.invoke('infrastructure:exportCSV', projectId),
    importCSV: (projectId: string, csvFilePath: string, fieldMapping: any[]) =>
      ipcRenderer.invoke('infrastructure:importCSV', projectId, csvFilePath, fieldMapping),
    readCSVHeaders: (filePath: string) =>
      ipcRenderer.invoke('infrastructure:readCSVHeaders', filePath),
    showImportDialog: () => ipcRenderer.invoke('infrastructure:showImportDialog'),
  },

  // Phase Template operations
  phaseTemplates: {
    getAll: (projectId: string) => ipcRenderer.invoke('phaseTemplates:getAll', projectId),
    getById: (id: string) => ipcRenderer.invoke('phaseTemplates:getById', id),
    create: (template: any, projectId: string) =>
      ipcRenderer.invoke('phaseTemplates:create', template, projectId),
    update: (id: string, updates: any) => ipcRenderer.invoke('phaseTemplates:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('phaseTemplates:delete', id),
    seed: (projectId: string) => ipcRenderer.invoke('phaseTemplates:seed', projectId),
  },

  // Sync operations (PowerSync + Supabase)
  sync: {
    initialize: () => ipcRenderer.invoke('sync:initialize'),
    isConfigured: () => ipcRenderer.invoke('sync:isConfigured'),
    isReady: () => ipcRenderer.invoke('sync:isReady'),
    connect: () => ipcRenderer.invoke('sync:connect'),
    disconnect: () => ipcRenderer.invoke('sync:disconnect'),
    sync: () => ipcRenderer.invoke('sync:sync'),
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    hasPendingChanges: () => ipcRenderer.invoke('sync:hasPendingChanges'),
    subscribeStatus: () => ipcRenderer.invoke('sync:subscribeStatus'),
    unsubscribeStatus: () => ipcRenderer.invoke('sync:unsubscribeStatus'),
    onStatusChanged: (callback: (status: any) => void) => {
      ipcRenderer.on('sync:statusChanged', (_, status) => callback(status));
    },
    offStatusChanged: (callback: (status: any) => void) => {
      ipcRenderer.removeListener('sync:statusChanged', callback);
    },
  },

  // Health check operations
  health: {
    check: () => ipcRenderer.invoke('health:check'),
  },

  // Backup operations
  backup: {
    create: (reason?: string) => ipcRenderer.invoke('backup:create', reason),
    list: () => ipcRenderer.invoke('backup:list'),
    restore: (backupDirName: string) => ipcRenderer.invoke('backup:restore', backupDirName),
    delete: (backupDirName: string) => ipcRenderer.invoke('backup:delete', backupDirName),
  },

  // Authentication operations
  auth: {
    signIn: (email: string, password: string) => ipcRenderer.invoke('auth:signIn', email, password),
    signUp: (email: string, password: string) => ipcRenderer.invoke('auth:signUp', email, password),
    signOut: () => ipcRenderer.invoke('auth:signOut'),
    resetPassword: (email: string) => ipcRenderer.invoke('auth:resetPassword', email),
    getState: () => ipcRenderer.invoke('auth:getState'),
  },

  // Collaboration operations (project & shop order sharing, presence)
  collaboration: {
    // Project members
    inviteToProject: (projectId: string, projectName: string, email: string, role: string) =>
      ipcRenderer.invoke('collaboration:invite-to-project', projectId, projectName, email, role),
    removeProjectMember: (projectId: string, userId: string) =>
      ipcRenderer.invoke('collaboration:remove-project-member', projectId, userId),
    getProjectMembers: (projectId: string) =>
      ipcRenderer.invoke('collaboration:get-project-members', projectId),
    acceptProjectInvitation: (projectId: string) =>
      ipcRenderer.invoke('collaboration:accept-project-invitation', projectId),
    checkPendingProjectInvitations: () =>
      ipcRenderer.invoke('collaboration:check-pending-project-invitations'),
    declineProjectInvitation: (projectId: string) =>
      ipcRenderer.invoke('collaboration:decline-project-invitation', projectId),

    // Shop order members
    inviteToShopOrder: (shopOrderId: string, email: string, role: string) =>
      ipcRenderer.invoke('collaboration:invite-to-shop-order', shopOrderId, email, role),
    removeShopOrderMember: (shopOrderId: string, userId: string) =>
      ipcRenderer.invoke('collaboration:remove-shop-order-member', shopOrderId, userId),
    getShopOrderMembers: (shopOrderId: string) =>
      ipcRenderer.invoke('collaboration:get-shop-order-members', shopOrderId),
    acceptShopOrderInvitation: (shopOrderId: string) =>
      ipcRenderer.invoke('collaboration:accept-shop-order-invitation', shopOrderId),
    checkPendingShopOrderInvitations: () =>
      ipcRenderer.invoke('collaboration:check-pending-shop-order-invitations'),
    declineShopOrderInvitation: (shopOrderId: string) =>
      ipcRenderer.invoke('collaboration:decline-shop-order-invitation', shopOrderId),

    // Presence
    joinPresence: (projectId: string, activeView?: string) =>
      ipcRenderer.invoke('collaboration:join-presence', projectId, activeView),
    leavePresence: (projectId: string) =>
      ipcRenderer.invoke('collaboration:leave-presence', projectId),
    getPresence: (projectId: string) => ipcRenderer.invoke('collaboration:get-presence', projectId),
    subscribePresence: (projectId: string) =>
      ipcRenderer.invoke('collaboration:subscribe-presence', projectId),
    unsubscribePresence: (projectId: string) =>
      ipcRenderer.invoke('collaboration:unsubscribe-presence', projectId),
    onPresenceChanged: (callback: (projectId: string, members: any[]) => void) => {
      ipcRenderer.on('collaboration:presenceChanged', (_, projectId, members) =>
        callback(projectId, members),
      );
    },
    offPresenceChanged: (callback: (projectId: string, members: any[]) => void) => {
      ipcRenderer.removeListener('collaboration:presenceChanged', callback as any);
    },
  },
});

// TypeScript declaration
export interface ElectronAPI {
  fixtures: {
    getAll: (projectId?: string) => Promise<Fixture[]>;
    create: (fixture: Partial<Fixture>, projectId?: string) => Promise<Fixture>;
    update: (id: string, updates: Partial<Fixture>) => Promise<Fixture>;
    delete: (id: string) => Promise<void>;
    deleteMultiple: (ids: string[]) => Promise<void>;
  };
  projects: {
    getAll: () => Promise<any[]>;
    getCurrent: () => Promise<any>;
    getById: (id: string) => Promise<any>;
    create: (
      name: string,
      description?: string,
      logoPath?: string,
      enabledModules?: string[],
    ) => Promise<any>;
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
    exportProject: (projectId: string, projectName: string) => Promise<string | null>;
    validate: (filePath: string) => Promise<any>;
    getFileName: (filePath: string) => Promise<string>;
    readImageAsDataUrl: (imagePath: string) => Promise<string | null>;
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
    layoutTemplates: {
      getByProjectId: (projectId: string, pageType?: string) => Promise<any[]>;
      getById: (id: string) => Promise<any | null>;
      getElements: (templateId: string) => Promise<any[]>;
      getDefault: (projectId: string, pageType: string) => Promise<any | null>;
      create: (data: any, elements: any[]) => Promise<any>;
      update: (id: string, updates: any, elements?: any[]) => Promise<any>;
      delete: (id: string) => Promise<void>;
      seedDefaults: () => Promise<{ success: boolean; message: string }>;
    };
    file: {
      showOpenDialog: () => Promise<string | null>;
      showSaveDialog: (defaultName?: string) => Promise<string | null>;
      export: (projectId: string, filePath: string) => Promise<{ success: boolean }>;
      import: (filePath: string) => Promise<any>;
      getFileName: (filePath: string) => Promise<string>;
    };
    exportPDF: (
      projectId: string,
      templateData: any,
    ) => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
    print: (projectId: string, templateData: any) => Promise<{ success: boolean }>;
  };
  license: {
    getStatus: () => Promise<any>;
    getCurrent: () => Promise<any>;
    hasModule: (module: string) => Promise<boolean>;
    getModuleFeatures: (module: string) => Promise<any>;
    getAvailableModules: () => Promise<string[]>;
    canUseFeature: (module: string, feature: string) => Promise<boolean>;
    refresh: () => Promise<{ success: boolean; license?: any }>;
    verifyOnline: () => Promise<boolean>;
    createDemo: () => Promise<{ success: boolean; license?: Record<string, unknown> }>;
  };
  settings: {
    get: () => Promise<any>;
    save: (settings: any) => Promise<{ success: boolean }>;
    update: (updates: any) => Promise<{ success: boolean }>;
    reset: () => Promise<{ success: boolean }>;
  };
  admin: {
    verifyPassword: (password: string) => Promise<{ success: boolean; firstTime?: boolean }>;
    setPassword: (password: string) => Promise<{ success: boolean }>;
    hasPassword: () => Promise<{ hasPassword: boolean }>;
    exportLayout: (
      templateId: string,
    ) => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
    exportAllDefaultLayouts: () => Promise<{
      success: boolean;
      count?: number;
      directory?: string;
      canceled?: boolean;
    }>;
    importLayouts: (
      filePaths?: string[],
    ) => Promise<{ success: boolean; count?: number; errors?: string[]; canceled?: boolean }>;
    resetLayoutsToFactory: () => Promise<{ success: boolean }>;
    getDefaultLayoutFiles: () => Promise<{ success: boolean; files: string[]; directory?: string }>;
  };
  windows: {
    openProject: (projectId: string) => Promise<void>;
    getCurrentProjectId: () => Promise<string | null>;
  };
  paperwork: {
    exportPDF: (
      htmlContent: string,
      filename: string,
      pageSettings: any,
    ) => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
  };
  paperworkTemplates: {
    getAll: (reportType?: string) => Promise<any[]>;
    getById: (id: string) => Promise<any | null>;
    create: (data: any) => Promise<any>;
    update: (id: string, updates: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
    duplicate: (id: string, newName?: string) => Promise<any>;
  };
  menu: {
    setState: (state: any) => Promise<{ success: boolean }>;
    getState: () => Promise<any>;
    reset: () => Promise<{ success: boolean }>;
    on: (channel: string, callback: (...args: any[]) => void) => void;
    off: (channel: string, callback: (...args: any[]) => void) => void;
  };
  shell: {
    openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  };
  dimmerRacks: {
    getAll: (projectId?: string) => Promise<any[]>;
    getById: (id: string) => Promise<any>;
    create: (rack: any, projectId?: string) => Promise<any>;
    update: (id: string, updates: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
    getWithUsage: (projectId?: string) => Promise<any[]>;
  };
  dimmerRackModules: {
    getByRackId: (rackId: string) => Promise<any[]>;
    create: (module: any) => Promise<any>;
    update: (id: string, updates: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
    getTypeForCircuit: (rackId: string, circuit: number) => Promise<any>;
  };
  pdRacks: {
    getAll: (projectId?: string) => Promise<any[]>;
    getById: (id: string) => Promise<any>;
    create: (rack: any, projectId?: string) => Promise<any>;
    update: (id: string, updates: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
    getWithUsage: (projectId?: string) => Promise<any[]>;
  };
  infrastructure: {
    getAll: (projectId: string) => Promise<any[]>;
    create: (equipment: any, projectId: string) => Promise<any>;
    update: (id: string, updates: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
    deleteMultiple: (ids: string[]) => Promise<void>;
    getPortLinkages: (equipmentId: string, projectId: string) => Promise<any[]>;
    getFixtureConnections: (fixtureId: string, projectId: string) => Promise<any[]>;
    getEquipmentConnections: (equipmentId: string, projectId: string) => Promise<any[]>;
    validatePortAssignment: (
      equipmentId: string,
      portAssignment: any,
      projectId: string,
    ) => Promise<{ valid: boolean; error?: string }>;
    getPortUsageStats: (equipmentId: string) => Promise<any>;
    getAllPortUsageStats: (projectId: string) => Promise<Record<string, any>>;
    exportCSV: (
      projectId: string,
    ) => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
    importCSV: (
      projectId: string,
      csvFilePath: string,
      fieldMapping: any[],
    ) => Promise<{ success: boolean; imported: number; errors: string[] }>;
    readCSVHeaders: (filePath: string) => Promise<{ success: boolean; headers: string[] }>;
    showImportDialog: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
  };
  phaseTemplates: {
    getAll: (projectId: string) => Promise<any[]>;
    getById: (id: string) => Promise<any>;
    create: (template: any, projectId: string) => Promise<any>;
    update: (id: string, updates: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
    seed: (projectId: string) => Promise<void>;
  };
  sync: {
    initialize: () => Promise<{ success: boolean; error?: string }>;
    isConfigured: () => Promise<boolean>;
    isReady: () => Promise<boolean>;
    connect: () => Promise<{ success: boolean; error?: string }>;
    disconnect: () => Promise<{ success: boolean; error?: string }>;
    sync: () => Promise<{ success: boolean; error?: string }>;
    getStatus: () => Promise<{
      state: 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';
      connected: boolean;
      hasPendingChanges: boolean;
      pendingUploadCount: number;
      lastSyncedAt: Date | null;
      error: string | null;
      isAuthenticated: boolean;
    }>;
    hasPendingChanges: () => Promise<boolean>;
    subscribeStatus: () => Promise<{ success: boolean; error?: string }>;
    unsubscribeStatus: () => Promise<{ success: boolean }>;
    onStatusChanged: (callback: (status: any) => void) => void;
    offStatusChanged: (callback: (status: any) => void) => void;
  };
  health: {
    check: () => Promise<{
      status: 'healthy' | 'degraded' | 'unhealthy';
      timestamp: string;
      checks: {
        database: { status: string; message: string; details?: Record<string, unknown> };
        filesystem: { status: string; message: string; details?: Record<string, unknown> };
        memory: { status: string; message: string; details?: Record<string, unknown> };
        sync: { status: string; message: string; details?: Record<string, unknown> };
      };
    }>;
  };
  auth: {
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<{ success: boolean; error?: string }>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    getState: () => Promise<{
      isAuthenticated: boolean;
      userId: string | null;
      email: string | null;
    }>;
  };
  backup: {
    create: (reason?: string) => Promise<{
      success: boolean;
      backupDir?: string;
      metadata?: {
        timestamp: number;
        reason?: string;
        appDbSize: number;
        projectDbSize: number;
        version: string;
      };
      error?: string;
    }>;
    list: () => Promise<
      Array<{
        timestamp: number;
        reason?: string;
        appDbSize: number;
        projectDbSize: number;
        version: string;
      }>
    >;
    restore: (backupDirName: string) => Promise<{
      success: boolean;
      restoredFrom?: string;
      error?: string;
    }>;
    delete: (backupDirName: string) => Promise<{ success: boolean; error?: string }>;
  };
  collaboration: {
    inviteToProject: (
      projectId: string,
      projectName: string,
      email: string,
      role: string,
    ) => Promise<{ success: boolean; error?: string; memberId?: string }>;
    removeProjectMember: (
      projectId: string,
      userId: string,
    ) => Promise<{ success: boolean; error?: string }>;
    getProjectMembers: (projectId: string) => Promise<any[]>;
    acceptProjectInvitation: (projectId: string) => Promise<{ success: boolean; error?: string }>;
    checkPendingProjectInvitations: () => Promise<any[]>;
    declineProjectInvitation: (projectId: string) => Promise<{ success: boolean; error?: string }>;
    inviteToShopOrder: (
      shopOrderId: string,
      email: string,
      role: string,
    ) => Promise<{ success: boolean; error?: string; memberId?: string }>;
    removeShopOrderMember: (
      shopOrderId: string,
      userId: string,
    ) => Promise<{ success: boolean; error?: string }>;
    getShopOrderMembers: (shopOrderId: string) => Promise<any[]>;
    acceptShopOrderInvitation: (
      shopOrderId: string,
    ) => Promise<{ success: boolean; error?: string }>;
    checkPendingShopOrderInvitations: () => Promise<any[]>;
    declineShopOrderInvitation: (
      shopOrderId: string,
    ) => Promise<{ success: boolean; error?: string }>;
    joinPresence: (
      projectId: string,
      activeView?: string,
    ) => Promise<{ success: boolean; error?: string }>;
    leavePresence: (projectId: string) => Promise<{ success: boolean; error?: string }>;
    getPresence: (projectId: string) => Promise<any[]>;
    subscribePresence: (projectId: string) => Promise<{ success: boolean; error?: string }>;
    unsubscribePresence: (projectId: string) => Promise<{ success: boolean }>;
    onPresenceChanged: (callback: (projectId: string, members: any[]) => void) => void;
    offPresenceChanged: (callback: (projectId: string, members: any[]) => void) => void;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
