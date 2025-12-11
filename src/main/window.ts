import { BrowserWindow, dialog } from 'electron';
import { join } from 'path';

export function createWindow(routePath: string = '/'): BrowserWindow {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
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
    // In development, load from Vite dev server with route
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    const fullUrl = `${devServerUrl}${routePath}`;
    console.log('Loading from dev server:', fullUrl);
    window.loadURL(fullUrl);
    window.webContents.openDevTools();
  } else {
    // In production, load from built files
    const indexPath = join(__dirname, '../renderer/index.html');
    const fullPath = routePath !== '/' ? `${indexPath}#${routePath}` : indexPath;
    console.log('Loading from file:', fullPath);
    window.loadFile(indexPath, { hash: routePath });
  }

  // Handle window close event - check for unsaved changes
  window.on('close', async (event) => {
    // Get isDirty state from renderer via executeJavaScript
    try {
      const isDirty = await window.webContents.executeJavaScript(
        'window.api && window.__fileStore ? window.__fileStore.isDirty : false'
      );

      if (isDirty) {
        event.preventDefault();

        const response = await dialog.showMessageBox(window, {
          type: 'question',
          buttons: ['Save', "Don't Save", 'Cancel'],
          defaultId: 0,
          cancelId: 2,
          title: 'Unsaved Changes',
          message: 'Do you want to save changes before closing?',
          detail: 'Your changes will be lost if you don\'t save them.'
        });

        if (response.response === 0) {
          // Save
          const saved = await window.webContents.executeJavaScript(
            'window.api && window.__fileStore ? window.__fileStore.saveFile() : false'
          );
          if (saved) {
            window.destroy();
          }
        } else if (response.response === 1) {
          // Don't Save
          window.destroy();
        }
        // Cancel - do nothing, window stays open
      }
    } catch (error) {
      console.error('Error checking for unsaved changes:', error);
      // If there's an error, allow closing
    }
  });

  return window;
}
