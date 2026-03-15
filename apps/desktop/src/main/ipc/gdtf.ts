import { ipcMain } from 'electron';
import * as path from 'path';
import { gdtfService } from '../services/GdtfService';
import { logger } from '../utils/logger';

export function registerGdtfHandlers(): void {
  ipcMain.removeHandler('gdtf:search');
  ipcMain.removeHandler('gdtf:getModes');

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
