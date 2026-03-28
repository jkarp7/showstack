/**
 * EosOSCClient
 *
 * Manages a UDP OSC connection to an ETC Eos family console.
 *
 * Protocol overview:
 *   - Send commands to the console on EOS_OSC_PORT (default 3032).
 *   - Eos sends responses back to the source IP on EOS_LISTEN_PORT (default 3033).
 *   - Patch query: send `/eos/get/patch` → receive `/eos/out/patch/count [n]`
 *     followed by n messages at `/eos/out/patch/[index]`.
 *
 * Reachability pre-check is handled by PortStatusMonitorService before
 * connect() is called, so this class focuses solely on the OSC protocol.
 */

import { Client, Server } from 'node-osc';
import { logger } from '../../utils/logger';
import type { EosPatchChannel } from '../../../renderer/src/types/console';

export { EosPatchChannel };

/** Default Eos OSC receive port (configurable in Eos: Setup → System Settings → Show Control → OSC) */
export const EOS_OSC_PORT = 3032;
/** Local port we open to receive Eos responses */
export const EOS_LISTEN_PORT = 3033;
/** How long to wait for all patch responses before giving up */
const PATCH_TIMEOUT_MS = 10_000;

/** Raw OSC message: [address, ...args] */
type OscMessage = [string, ...(string | number | boolean)[]];

export class EosOSCClient {
  private client: Client;
  private server: Server | null = null;
  private readonly consoleIp: string;
  private readonly consolePort: number;
  private readonly listenPort: number;

  constructor(consoleIp: string, consolePort = EOS_OSC_PORT, listenPort = EOS_LISTEN_PORT) {
    this.consoleIp = consoleIp;
    this.consolePort = consolePort;
    this.listenPort = listenPort;
    this.client = new Client(consoleIp, consolePort);
  }

  /**
   * Open the local UDP server that receives Eos responses.
   * Must be called before getPatch() or any query that expects a response.
   */
  async connect(): Promise<void> {
    if (this.server) return; // already connected

    this.server = new Server(this.listenPort, '0.0.0.0');
    await new Promise<void>((resolve, reject) => {
      this.server!.once('listening', resolve);
      this.server!.once('error', reject);
    });
    logger.info(`EosOSCClient connected — listening on :${this.listenPort}`, {
      consoleIp: this.consoleIp,
      consolePort: this.consolePort,
    });
  }

  /**
   * Close both the outbound client socket and the inbound response server.
   */
  async disconnect(): Promise<void> {
    await this.client.close();
    if (this.server) {
      await this.server.close();
      this.server = null;
    }
    logger.info('EosOSCClient disconnected', { consoleIp: this.consoleIp });
  }

  /**
   * Send a single OSC message to the console.
   */
  async send(address: string, ...args: (string | number | boolean)[]): Promise<void> {
    if (args.length > 0) {
      await this.client.send(address, ...args);
    } else {
      await this.client.send(address);
    }
  }

  /**
   * Query the full patch from Eos.
   *
   * Sends `/eos/get/patch` and collects:
   *   1. `/eos/out/patch/count [n]` — total channel count
   *   2. `/eos/out/patch/[0..n-1]` — one message per channel
   *
   * Resolves with an array of raw OSC messages for the caller to parse.
   * Rejects if the count message does not arrive within PATCH_TIMEOUT_MS,
   * or if all expected channel messages do not arrive in time.
   */
  async getPatch(timeoutMs = PATCH_TIMEOUT_MS): Promise<OscMessage[]> {
    if (!this.server) throw new Error('Not connected — call connect() first');

    return new Promise<OscMessage[]>((resolve, reject) => {
      const channelMessages: OscMessage[] = [];
      let expectedCount: number | null = null;
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error(`Eos patch query timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      const onMessage = (msg: OscMessage) => {
        const [address] = msg;

        if (address === '/eos/out/patch/count') {
          expectedCount = Number(msg[1]) || 0;
          if (expectedCount === 0) {
            settled = true;
            cleanup();
            resolve([]);
          }
          return;
        }

        if (/^\/eos\/out\/patch\/\d+$/.test(address)) {
          channelMessages.push(msg);
          if (expectedCount !== null && channelMessages.length >= expectedCount) {
            settled = true;
            cleanup();
            resolve(channelMessages);
          }
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.server?.off('message', onMessage);
      };

      this.server!.on('message', onMessage);

      // Fire the query after attaching the listener
      this.send('/eos/get/patch').catch((err: unknown) => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    });
  }
}
