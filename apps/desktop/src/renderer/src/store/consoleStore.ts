import { create } from 'zustand';
import { logger } from '../utils/logger';
import type { ConsoleType, ConsoleConnection, EosPatchChannel } from '../types/console';

// Type guard for window.api
const hasAPI = (): boolean =>
  typeof window !== 'undefined' && 'api' in window && window.api !== undefined;

export type ConsoleStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface ConsoleState {
  connection: ConsoleConnection | null;
  status: ConsoleStatus;
  lastSync: number | null;
  lastImport: EosPatchChannel[] | null;

  // Actions
  connect: (type: ConsoleType, ip: string, port?: number) => Promise<boolean>;
  disconnect: (type: ConsoleType) => Promise<void>;
  setLastSync: (t: number) => void;
  setLastImport: (channels: EosPatchChannel[]) => void;
  clearConnection: () => void;
}

export const useConsoleStore = create<ConsoleState>((set, get) => ({
  connection: null,
  status: 'idle',
  lastSync: null,
  lastImport: null,

  connect: async (type, ip, port) => {
    if (!hasAPI()) {
      logger.warn('API not available');
      return false;
    }

    set({ status: 'connecting' });
    try {
      const result = await window.api.console.connect(type, ip, port);
      if (result.success) {
        set({
          status: 'connected',
          connection: { type, ip, port: port ?? 3032, connected: true, lastSync: null },
        });
        logger.info(`Console connected: ${type} @ ${ip}`);
        return true;
      } else {
        set({ status: 'error' });
        logger.error('Console connect failed:', { error: result.error });
        return false;
      }
    } catch (error) {
      set({ status: 'error' });
      logger.error('Console connect threw:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  },

  disconnect: async (type) => {
    if (!hasAPI()) return;

    try {
      await window.api.console.disconnect(type);
    } catch (error) {
      logger.error('Console disconnect threw:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      const { connection } = get();
      if (connection?.type === type) {
        set({ connection: null, status: 'idle' });
      }
    }
  },

  setLastSync: (t) => {
    set((state) => ({
      lastSync: t,
      connection: state.connection ? { ...state.connection, lastSync: t } : null,
    }));
  },

  setLastImport: (channels) => set({ lastImport: channels }),

  clearConnection: () =>
    set({ connection: null, status: 'idle', lastSync: null, lastImport: null }),
}));
