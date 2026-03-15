import { ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';
import { gdtfService, GdtfMode } from '../services/GdtfService';
import { logger } from '../utils/logger';

export function registerGdtfHandlers(): void {
  ipcMain.removeHandler('gdtf:search');
  ipcMain.removeHandler('gdtf:getModes');
  ipcMain.removeHandler('gdtf:checkForUpdates');
  ipcMain.removeHandler('gdtf:downloadFixture');
  ipcMain.removeHandler('gdtf:getLibraryStatus');

  /**
   * Search the GDTF fixture library.
   * Returns up to 50 matches sorted by manufacturer, then model.
   */
  ipcMain.handle('gdtf:search', (_event, query: string) => {
    if (typeof query !== 'string') return [];
    return gdtfService.search(query.trim());
  });

  /**
   * Return the DMX modes for a specific cached fixture (by id).
   */
  ipcMain.handle('gdtf:getModes', (_event, id: string) => {
    if (typeof id !== 'string') return [];
    return gdtfService.getModes(id);
  });

  /**
   * Check CDN for library updates.
   * Sends gdtf:updateAvailable push event to all windows if an update is available.
   */
  ipcMain.handle('gdtf:checkForUpdates', async () => {
    const cdnUrl = process.env.GDTF_CDN_URL ?? '';
    if (!cdnUrl) return null;
    const result = await gdtfService.checkForUpdates(cdnUrl);
    if (result?.hasUpdate) {
      const windows = BrowserWindow.getAllWindows();
      for (const win of windows) {
        win.webContents.send('gdtf:updateAvailable', {
          versionHash: result.versionHash,
          fixtureCount: result.fixtureCount,
        });
      }
    }
    return result;
  });

  /**
   * Download a fixture from CDN.
   */
  ipcMain.handle(
    'gdtf:downloadFixture',
    async (
      _event,
      manufacturer: string,
      model: string,
    ): Promise<{ success: boolean; modes?: GdtfMode[]; error?: string }> => {
      const cdnUrl = process.env.GDTF_CDN_URL ?? '';
      if (!cdnUrl) {
        return { success: false, error: 'CDN URL not configured' };
      }
      try {
        const modes = await gdtfService.downloadFixture(cdnUrl, manufacturer, model);
        return { success: true, modes };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        logger.warn('GDTF CDN fixture download failed', { manufacturer, model, error });
        return { success: false, error };
      }
    },
  );

  /**
   * Return current library status from app_settings_kv.
   */
  ipcMain.handle('gdtf:getLibraryStatus', () => {
    return gdtfService.getLibraryStatus();
  });

  logger.info('GDTF IPC handlers registered');
}

/**
 * Scan bundled GDTF files and populate gdtf_cache.
 * Called after app DB is initialized, non-blocking.
 */
export function initGdtfLibrary(): void {
  const bundledDir = path.join(__dirname, 'gdtf-bundled');
  try {
    gdtfService.scanBundled(bundledDir);
  } catch (err) {
    logger.warn('GDTF bundled scan failed (non-fatal)', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Schedule a non-blocking GDTF update check 5 seconds after startup.
 * If an update is available, sends gdtf:updateAvailable to the given window.
 */
export function initGdtfUpdateCheck(win: BrowserWindow): void {
  const cdnUrl = process.env.GDTF_CDN_URL ?? '';
  if (!cdnUrl) return;

  setTimeout(() => {
    gdtfService
      .checkForUpdates(cdnUrl)
      .then((result) => {
        if (result?.hasUpdate) {
          if (!win.isDestroyed()) {
            win.webContents.send('gdtf:updateAvailable', {
              versionHash: result.versionHash,
              fixtureCount: result.fixtureCount,
            });
          }
        }
      })
      .catch((err) => {
        logger.warn('GDTF startup update check failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
  }, 5000);
}
