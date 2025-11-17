import { BrowserWindow } from 'electron';
import { join } from 'path';

export function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Maximize on start
  window.maximize();
  window.show();

  // Load renderer
  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools();
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}
