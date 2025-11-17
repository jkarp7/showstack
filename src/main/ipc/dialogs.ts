import { ipcMain, dialog, BrowserWindow } from 'electron';

export function registerDialogHandlers(): void {
  // Show open dialog for selecting image files (logo upload)
  ipcMain.handle('dialog:openImage', async () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      throw new Error('No window available');
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Show Logo',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Show open dialog for selecting project files
  ipcMain.handle('dialog:openProject', async () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      throw new Error('No window available');
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Project File',
      properties: ['openFile'],
      filters: [
        { name: 'ShowStack Projects', extensions: ['showstack', 'ssp'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  console.log('✅ Dialog IPC handlers registered');
}
