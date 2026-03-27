/**
 * Network validation utilities
 *
 * Used by both main process (PortStatusMonitorService, console integration)
 * and renderer (infrastructure dialogs, ConsoleConnectionDialog).
 */

/**
 * Returns true if value is a valid IPv4 address (each octet 0–255).
 */
export function isValidIPv4(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const n = parseInt(part, 10);
    return n >= 0 && n <= 255;
  });
}

/**
 * Parses an IP address with an optional port suffix (e.g. "192.168.1.100:3032").
 * Returns null if the IP portion is invalid.
 */
export function parseIPWithPort(value: string): { ip: string; port?: number } | null {
  const lastColon = value.lastIndexOf(':');
  if (lastColon === -1) {
    return isValidIPv4(value) ? { ip: value } : null;
  }

  const ip = value.slice(0, lastColon);
  const portStr = value.slice(lastColon + 1);

  if (!isValidIPv4(ip)) return null;

  if (portStr === '') return { ip };

  if (!/^\d+$/.test(portStr)) return null;
  const port = parseInt(portStr, 10);
  if (port < 0 || port > 65535) return null;

  return { ip, port };
}

/**
 * Returns true if value is a valid IEEE 802.1Q VLAN ID (1–4094).
 */
export function isValidVLAN(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 4094;
}
