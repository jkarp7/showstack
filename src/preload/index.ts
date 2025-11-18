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
    save: (filePath?: string) => ipcRenderer.invoke('file:save', filePath),
    saveAs: (defaultName?: string) => ipcRenderer.invoke('file:saveAs', defaultName),
    new: () => ipcRenderer.invoke('file:new'),
    validate: (filePath: string) => ipcRenderer.invoke('file:validate', filePath),
    getFileName: (filePath: string) => ipcRenderer.invoke('file:getFileName', filePath)
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
    save: (filePath?: string) => Promise<string | null>;
    saveAs: (defaultName?: string) => Promise<string | null>;
    new: () => Promise<string>;
    validate: (filePath: string) => Promise<any>;
    getFileName: (filePath: string) => Promise<string>;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
