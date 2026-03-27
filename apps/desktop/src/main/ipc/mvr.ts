import { ipcMain, dialog } from 'electron';
import { mvrService } from '../services/MvrService';
import { createFixture } from '../database/queries/fixtures';
import { logger } from '../utils/logger';

export interface MvrImportResult {
  success: boolean;
  error?: string;
  canceled?: boolean;
  created: number;
  gdtfResolved: number;
  warnings: string[];
}

export function registerMvrHandlers(): void {
  ipcMain.removeHandler('mvr:import');

  /**
   * Open a native file dialog for an .mvr file, parse it, and bulk-create
   * fixtures in the specified project.
   *
   * Returns a summary: { created, gdtfResolved, warnings } on success.
   */
  ipcMain.handle('mvr:import', async (_event, projectId: string): Promise<MvrImportResult> => {
    if (typeof projectId !== 'string' || !projectId) {
      return {
        success: false,
        error: 'No project ID provided',
        created: 0,
        gdtfResolved: 0,
        warnings: [],
      };
    }

    const dialogResult = await dialog.showOpenDialog({
      title: 'Import MVR File',
      filters: [
        { name: 'My Virtual Rig', extensions: ['mvr'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (dialogResult.canceled || !dialogResult.filePaths[0]) {
      return { success: false, canceled: true, created: 0, gdtfResolved: 0, warnings: [] };
    }

    const filePath = dialogResult.filePaths[0];

    try {
      const { fixtures, warnings } = mvrService.parseMvr(filePath);

      let created = 0;
      let gdtfResolved = 0;

      for (const f of fixtures) {
        try {
          createFixture(
            {
              type: f.name || f.model || 'Unknown',
              position: f.layerName || undefined,
              manufacturer: f.manufacturer || undefined,
              model: f.model || undefined,
              mode: f.gdtfMode || undefined,
              channel: f.fixtureId || undefined,
              unit_number: f.unitNumber,
              universe: f.universe,
              dmx_address: f.dmxAddress,
              dmx_footprint: f.dmxFootprint ?? 1,
              vw_uid: f.uuid || undefined,
            },
            projectId,
          );
          created++;
          if (f.gdtfResolved) gdtfResolved++;
        } catch (err) {
          warnings.push(
            `Skipped fixture "${f.name}": ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      logger.info('MVR import complete', { created, gdtfResolved, warnings: warnings.length });
      return { success: true, created, gdtfResolved, warnings };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error('MVR import failed', { filePath, error });
      return { success: false, error, created: 0, gdtfResolved: 0, warnings: [] };
    }
  });

  logger.info('MVR IPC handlers registered');
}
