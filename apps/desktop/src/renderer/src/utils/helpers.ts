/**
 * ShowStack Utility Functions
 *
 * Shared helper functions used across all modules.
 * Keep these functions pure and well-documented for easy reuse.
 */

/**
 * Format a timestamp to a human-readable date string
 */
export function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a timestamp to a human-readable date and time string
 */
export function formatDateTime(timestamp: number | undefined): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate DMX universe and address from raw address number
 * @param rawAddress - The raw DMX address (1-based)
 * @param addressesPerUniverse - Number of addresses per universe (default: 512)
 * @returns Object with universe and dmx_address
 */
export function calculateDMXAddress(rawAddress: number, addressesPerUniverse: number = 512) {
  if (rawAddress <= 0) {
    return { universe: 0, dmx_address: 0 };
  }

  const universe = Math.ceil(rawAddress / addressesPerUniverse);
  const dmx_address = ((rawAddress - 1) % addressesPerUniverse) + 1;

  return { universe, dmx_address };
}

/**
 * Convert universe and DMX address to raw address number
 * @param universe - The DMX universe (1-based)
 * @param dmx_address - The DMX address within the universe (1-based)
 * @param addressesPerUniverse - Number of addresses per universe (default: 512)
 * @returns The raw DMX address
 */
export function rawDMXAddress(
  universe: number,
  dmx_address: number,
  addressesPerUniverse: number = 512,
): number {
  return (universe - 1) * addressesPerUniverse + dmx_address;
}

/**
 * Format DMX address as "universe/address" string
 */
export function formatDMXAddress(
  universe: number | undefined,
  dmx_address: number | undefined,
): string {
  if (!universe || !dmx_address) return '';
  return `${universe}/${dmx_address}`;
}

/**
 * Parse a DMX address string in various formats
 * Supports: "1/1", "1-1", "1.1", or raw number "512"
 * @returns Object with universe and dmx_address, or null if invalid
 */
export function parseDMXAddress(
  addressString: string,
  addressesPerUniverse: number = 512,
): {
  universe: number;
  dmx_address: number;
} | null {
  if (!addressString) return null;

  // Check for delimiter-based format (1/1, 1-1, 1.1)
  const delimiters = ['/', '-', '.'];
  for (const delimiter of delimiters) {
    if (addressString.includes(delimiter)) {
      const parts = addressString.split(delimiter);
      if (parts.length === 2) {
        const universe = parseInt(parts[0], 10);
        const dmx = parseInt(parts[1], 10);
        if (!isNaN(universe) && !isNaN(dmx)) {
          return { universe, dmx_address: dmx };
        }
      }
    }
  }

  // Try parsing as raw address number
  const rawAddress = parseInt(addressString, 10);
  if (!isNaN(rawAddress) && rawAddress > 0) {
    return calculateDMXAddress(rawAddress, addressesPerUniverse);
  }

  return null;
}

/**
 * Debounce function - delays execution until after wait time has elapsed since last call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a unique ID (for client-side use, not for database records)
 */
export function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a value is empty (null, undefined, empty string, or empty array)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

/**
 * Sort array of objects by a key
 */
export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    const comparison = aStr.localeCompare(bStr);
    return direction === 'asc' ? comparison : -comparison;
  });
}
