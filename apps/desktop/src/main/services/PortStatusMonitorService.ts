/**
 * PortStatusMonitorService
 *
 * Checks TCP reachability of infrastructure equipment by IP address.
 * Uses net.createConnection() — no ping binary required, no special
 * OS entitlements needed on macOS or Windows.
 *
 * Reachability logic:
 *   - ECONNREFUSED → 'reachable' (host responded; that port just isn't open)
 *   - Timeout (2s)  → 'timeout'
 *   - Other error   → 'unreachable'
 *
 * Results are cached per project for PORT_STATUS_TTL_MS to avoid
 * hammering the network on every render.
 */

import * as net from 'net';
import { logger } from '../utils/logger';
import { PortStatusResult } from '@showstack/shared';

export type { PortStatusResult };

// Port to probe — HTTP is a reasonable choice: refused quickly by most
// network devices even when not running a web server, so we get a fast
// ECONNREFUSED rather than a firewall-induced timeout.
const PROBE_PORT = 80;
const CONNECT_TIMEOUT_MS = 2_000;
const PORT_STATUS_TTL_MS = 8_000;

interface CacheEntry {
  results: PortStatusResult[];
  expiresAt: number;
}

class PortStatusMonitorServiceClass {
  private cache = new Map<string, CacheEntry>();
  private inFlightChecks = new Map<string, Promise<PortStatusResult[]>>();

  /**
   * Check reachability of all equipment IPs for the given project.
   * Results are cached for PORT_STATUS_TTL_MS; a cache hit returns immediately.
   * Concurrent callers for the same project share a single in-flight check.
   */
  async checkAll(
    projectId: string,
    equipment: Array<{ id: string; ip_address?: string | null }>,
  ): Promise<PortStatusResult[]> {
    const addressable = equipment.filter((e) => e.ip_address);
    const signature = addressable
      .map((e) => e.ip_address!)
      .sort()
      .join(',');
    const cacheKey = `${projectId}:${signature}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.results;
    }

    const inFlight = this.inFlightChecks.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const checkPromise = (async (): Promise<PortStatusResult[]> => {
      try {
        if (addressable.length === 0) {
          const results: PortStatusResult[] = [];
          this.cache.set(cacheKey, { results, expiresAt: Date.now() + PORT_STATUS_TTL_MS });
          return results;
        }

        // Process in batches to avoid exhausting OS file descriptors on large rigs.
        const BATCH_SIZE = 20;
        const results: PortStatusResult[] = [];
        for (let i = 0; i < addressable.length; i += BATCH_SIZE) {
          const batch = addressable.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(
            batch.map((e) => this.checkOne(e.id, e.ip_address!)),
          );
          results.push(...batchResults);
        }

        this.cache.set(cacheKey, { results, expiresAt: Date.now() + PORT_STATUS_TTL_MS });
        logger.debug('Port status check complete', { projectId, count: results.length });
        return results;
      } finally {
        this.inFlightChecks.delete(cacheKey);
      }
    })();

    this.inFlightChecks.set(cacheKey, checkPromise);
    return checkPromise;
  }

  /**
   * Check a single IP address via TCP connect.
   */
  checkOne(equipmentId: string, ip: string): Promise<PortStatusResult> {
    const start = Date.now();

    return new Promise((resolve) => {
      const socket = net.createConnection({ host: ip, port: PROBE_PORT });
      let settled = false;

      const timer = setTimeout(() => finish('timeout'), CONNECT_TIMEOUT_MS);

      const finish = (status: PortStatusResult['status']) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        socket.removeAllListeners();
        resolve({
          equipment_id: equipmentId,
          ip,
          status,
          latency_ms: status === 'reachable' ? Date.now() - start : undefined,
          last_checked: Date.now(),
        });
      };

      socket.on('connect', () => finish('reachable'));

      socket.on('error', (err: NodeJS.ErrnoException) => {
        // ECONNREFUSED means the host is up — it just rejected the connection.
        finish(err.code === 'ECONNREFUSED' ? 'reachable' : 'unreachable');
      });
    });
  }

  /** Evict all cache entries for a project (or everything). Exposed for testing. */
  clearCache(projectId?: string): void {
    if (projectId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${projectId}:`)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }
}

export const portStatusMonitor = new PortStatusMonitorServiceClass();
export { PortStatusMonitorServiceClass };
