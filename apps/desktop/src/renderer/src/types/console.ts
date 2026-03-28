/**
 * Console integration type definitions.
 * Shared between renderer, preload, and (via import) main process.
 */

// ─── Console connection ───────────────────────────────────────────────────────

export type ConsoleType = 'eos' | 'grandma2' | 'grandma3';

export interface ConsoleConnection {
  type: ConsoleType;
  ip: string;
  port: number;
  connected: boolean;
  lastSync: number | null;
}

// ─── Eos patch data ───────────────────────────────────────────────────────────

/**
 * One channel as reported by Eos OSC `/eos/out/patch/[index]`.
 * All fields except channelNumber are optional because Eos may omit them
 * for un-patched channels or older software versions.
 */
export interface EosPatchChannel {
  /** Eos channel number (1-based) */
  channelNumber: number;
  /** DMX universe (1-based), null if un-patched */
  universe: number | null;
  /** DMX address within the universe (1-based), null if un-patched */
  address: number | null;
  /** Eos fixture profile name, e.g. "Source Four 19deg" */
  fixtureType: string;
  /** Channel label as shown in Eos live display */
  label: string;
  /** Free-text notes field */
  notes: string;
}

// ─── IPC result envelopes ─────────────────────────────────────────────────────

export interface ConsoleConnectResult {
  success: boolean;
  error?: string;
  /** Effective connection parameters used by the main process — present on success */
  connection?: { type: ConsoleType; ip: string; port: number };
}

export interface ConsoleDisconnectResult {
  success: boolean;
  error?: string;
}

export interface ConsolePatchImportResult {
  success: boolean;
  channels?: EosPatchChannel[];
  error?: string;
}

export interface ConsolePatchExportResult {
  success: boolean;
  sent?: number;
  error?: string;
}
