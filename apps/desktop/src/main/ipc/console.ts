/**
 * Console IPC Handlers
 *
 * Bridges the renderer's window.api.console calls to the EosOSCClient /
 * EosPatchParser / EosCommandBuilder in the main process.
 *
 * IPC channels:
 *   console:connect      (consoleType, ip, port?)   → ConsoleConnectResult
 *   console:disconnect   (consoleType)               → ConsoleDisconnectResult
 *   console:importPatch  (consoleType)               → ConsolePatchImportResult
 *   console:exportPatch  (consoleType, fixtures[])   → ConsolePatchExportResult
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { logger } from '../utils/logger';
import { EosOSCClient, EOS_OSC_PORT } from '../console/eos/eosOSCClient';
import { EosPatchParser } from '../console/eos/eosPatchParser';
import { EosCommandBuilder, FixturePatchInput } from '../console/eos/eosCommandBuilder';
import type {
  ConsoleType,
  ConsoleConnectResult,
  ConsoleDisconnectResult,
  ConsolePatchImportResult,
  ConsolePatchExportResult,
} from '../../renderer/src/types/console';

// ─── In-process client registry ──────────────────────────────────────────────

// One client per console type; reset on disconnect.
const activeClients = new Map<ConsoleType, EosOSCClient>();

function getEosClient(): EosOSCClient {
  const client = activeClients.get('eos');
  if (!client) throw new Error('Not connected to Eos — call console:connect first');
  return client;
}

/** Exported for testing */
export function resetConsoleClients(): void {
  activeClients.clear();
}

// ─── IPC registration ─────────────────────────────────────────────────────────

export function registerConsoleHandlers(): void {
  // ── connect ──────────────────────────────────────────────────────────────
  ipcMain.handle(
    'console:connect',
    async (
      _event: IpcMainInvokeEvent,
      consoleType: ConsoleType,
      ip: string,
      port?: number,
    ): Promise<ConsoleConnectResult> => {
      try {
        if (consoleType !== 'eos') {
          return { success: false, error: `Console type "${consoleType}" is not yet supported` };
        }

        // Disconnect any existing client for this type
        const existing = activeClients.get('eos');
        if (existing) {
          await existing.disconnect().catch(() => undefined);
          activeClients.delete('eos');
        }

        const client = new EosOSCClient(ip, port ?? EOS_OSC_PORT);
        await client.connect();
        activeClients.set('eos', client);

        logger.info('Console connected', { consoleType, ip, port: port ?? EOS_OSC_PORT });
        return { success: true };
      } catch (error) {
        logger.error('console:connect failed', {
          consoleType,
          ip,
          error: error instanceof Error ? error.message : String(error),
        });
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  );

  // ── disconnect ────────────────────────────────────────────────────────────
  ipcMain.handle(
    'console:disconnect',
    async (
      _event: IpcMainInvokeEvent,
      consoleType: ConsoleType,
    ): Promise<ConsoleDisconnectResult> => {
      try {
        if (consoleType === 'eos') {
          const client = activeClients.get('eos');
          if (client) {
            await client.disconnect();
            activeClients.delete('eos');
          }
        }
        logger.info('Console disconnected', { consoleType });
        return { success: true };
      } catch (error) {
        logger.error('console:disconnect failed', {
          consoleType,
          error: error instanceof Error ? error.message : String(error),
        });
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  );

  // ── importPatch ───────────────────────────────────────────────────────────
  ipcMain.handle(
    'console:importPatch',
    async (
      _event: IpcMainInvokeEvent,
      consoleType: ConsoleType,
    ): Promise<ConsolePatchImportResult> => {
      try {
        if (consoleType !== 'eos') {
          return { success: false, error: `Patch import not supported for "${consoleType}"` };
        }

        const client = getEosClient();
        const rawMessages = await client.getPatch();
        const parser = new EosPatchParser();
        const channels = parser.parsePatch(rawMessages);

        logger.info('Eos patch import complete', { channelCount: channels.length });
        return { success: true, channels };
      } catch (error) {
        logger.error('console:importPatch failed', {
          consoleType,
          error: error instanceof Error ? error.message : String(error),
        });
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  );

  // ── exportPatch ───────────────────────────────────────────────────────────
  ipcMain.handle(
    'console:exportPatch',
    async (
      _event: IpcMainInvokeEvent,
      consoleType: ConsoleType,
      fixtures: FixturePatchInput[],
    ): Promise<ConsolePatchExportResult> => {
      try {
        if (consoleType !== 'eos') {
          return { success: false, error: `Patch export not supported for "${consoleType}"` };
        }

        const client = getEosClient();
        const builder = new EosCommandBuilder();
        const commands = builder.buildBatchPatchCommands(fixtures);

        for (const command of commands) {
          await client.send('/eos/newcmd', command);
        }

        logger.info('Eos patch export complete', { commandCount: commands.length });
        return { success: true, sent: commands.length };
      } catch (error) {
        logger.error('console:exportPatch failed', {
          consoleType,
          error: error instanceof Error ? error.message : String(error),
        });
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  );

  logger.info('✅ Console IPC handlers registered');
}
