import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Version info
  getVersion: () => process.versions.electron,

  // Platform info
  getPlatform: () => process.platform,

  // Future IPC methods will be added here
  // Example:
  // invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});

// Type definitions for the exposed API
export interface ElectronAPI {
  getVersion: () => string;
  getPlatform: () => string;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
