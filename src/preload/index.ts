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
    create: (name: string, description?: string) => ipcRenderer.invoke('projects:create', name, description),
    update: (id: string, updates: any) => ipcRenderer.invoke('projects:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id)
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
    create: (name: string, description?: string) => Promise<any>;
    update: (id: string, updates: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
