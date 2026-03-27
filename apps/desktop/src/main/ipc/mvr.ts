import { ipcMain, dialog } from 'electron';
import { mvrService } from '../services/MvrService';
import { mvrExportService, MvrExportResult } from '../services/MvrExportService';
import { createFixture } from '../database/queries/fixtures';
import { getProjectById } from '../database/queries/projects';
import { logger } from '../utils/logger';

export interface MvrImportResult {
  success: boolean;
  error?: string;
  canceled?: boolean;
  created: number;
  gdtfResolved: number;
  warnings: string[];
}

export interface MvrExportIpcResult extends MvrExportResult {
  canceled?: boolean;
}

export function registerMvrHandlers(): void {
  ipcMain.removeHandler('mvr:import');
  ipcMain.removeHandler('mvr:export');

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

  /**
   * Export project fixtures to an MVR file.
   * Opens a native save dialog, writes the ZIP, returns a summary.
   */
  ipcMain.handle('mvr:export', async (_event, projectId: string): Promise<MvrExportIpcResult> => {
    const failure = (extra: Partial<MvrExportIpcResult> = {}): MvrExportIpcResult => ({
      success: false,
      fixtureCount: 0,
      layerCount: 0,
      gdtfBundled: 0,
      ...extra,
    });

    if (typeof projectId !== 'string' || !projectId) {
      return failure({ error: 'No project ID provided' });
    }

    const project = getProjectById(projectId);
    const projectName = project?.name ?? 'ShowStack Export';

    const dialogResult = await dialog.showSaveDialog({
      title: 'Export MVR File',
      defaultPath: `${projectName.replace(/[^a-z0-9_\-\s]/gi, '_')}.mvr`,
      filters: [
        { name: 'My Virtual Rig', extensions: ['mvr'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (dialogResult.canceled || !dialogResult.filePath) {
      return failure({ canceled: true });
    }

    try {
      const result = await mvrExportService.export(projectId, dialogResult.filePath, projectName);
      logger.info('MVR export IPC complete', {
        fixtureCount: result.fixtureCount,
        layerCount: result.layerCount,
        gdtfBundled: result.gdtfBundled,
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error('MVR export failed', { projectId, error });
      return failure({ error });
    }
  });

  logger.info('MVR IPC handlers registered');
}
