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
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // In development, load from Vite dev server
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log('Loading from dev server:', devServerUrl);
    window.loadURL(devServerUrl);
    window.webContents.openDevTools();
  } else {
    // In production, load from built files
    console.log('Loading from file:', join(__dirname, '../renderer/index.html'));
    window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}
