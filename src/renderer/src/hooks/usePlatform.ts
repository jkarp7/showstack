import { useMemo } from 'react';

export interface PlatformInfo {
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  modifierKey: 'Cmd' | 'Ctrl';
  modifierSymbol: '⌘' | 'Ctrl';
}

type PlatformFlags = Pick<PlatformInfo, 'isMac' | 'isWindows' | 'isLinux'>;

// Module-level cache for platform detection
// Platform won't change during runtime, so we can safely cache this
let cachedPlatform: PlatformFlags | null = null;

/**
 * Internal helper to detect the current platform.
 * Uses modern userAgentData API when available, with fallback to deprecated APIs.
 *
 * Note: Platform detection is cached at module level as the platform won't change during runtime.
 * This improves performance when formatShortcut() is called frequently.
 */
function detectPlatform(): PlatformFlags {
  if (cachedPlatform) return cachedPlatform;

  // @ts-expect-error - userAgentData is experimental and not yet in TS DOM types
  const userAgentData = navigator.userAgentData;
  const platformString = userAgentData?.platform || navigator.platform || '';
  const platform = platformString.toUpperCase();
  const userAgent = (navigator.userAgent || '').toUpperCase();

  const isMac = platform.includes('MAC') || userAgent.includes('MAC');
  const isWindows = platform.includes('WIN') || userAgent.includes('WIN');
  const isLinux = platform.includes('LINUX') || userAgent.includes('LINUX');

  cachedPlatform = { isMac, isWindows, isLinux };
  return cachedPlatform;
}

/**
 * Hook to detect the current platform and provide platform-specific information.
 * Useful for displaying correct keyboard shortcuts across different operating systems.
 *
 * @returns PlatformInfo object with platform detection flags and modifier key information
 * @note For unrecognized platforms (FreeBSD, ChromeOS, etc.), defaults to 'Ctrl' as the modifier key
 *
 * @example
 * const { isMac, modifierKey } = usePlatform();
 * return <kbd>{modifierKey}+S</kbd>; // Shows "Cmd+S" on Mac, "Ctrl+S" on Windows/Linux
 */
export function usePlatform(): PlatformInfo {
  return useMemo(() => {
    // Platform won't change during session, so empty dependency array is safe
    const { isMac, isWindows, isLinux } = detectPlatform();

    return {
      isMac,
      isWindows,
      isLinux,
      modifierKey: isMac ? 'Cmd' : 'Ctrl',
      modifierSymbol: isMac ? '⌘' : 'Ctrl'
    };
  }, []);
}

/**
 * Utility function to format a keyboard shortcut for the current platform.
 *
 * @param shortcut - Shortcut string with generic "Mod" prefix (e.g., "Mod+S", "Mod+Shift+Z")
 * @param useSymbol - Whether to use symbol (⌘) or text (Cmd) for Mac modifier
 * @returns Formatted shortcut string (e.g., "Cmd+S" on Mac, "Ctrl+S" on Windows)
 *
 * @example
 * formatShortcut("Mod+S") // Returns "Cmd+S" on Mac, "Ctrl+S" on Windows
 * formatShortcut("Mod+S", true) // Returns "⌘+S" on Mac, "Ctrl+S" on Windows
 */
export function formatShortcut(shortcut: string, useSymbol = false): string {
  const { isMac } = detectPlatform();
  const modifier = useSymbol && isMac ? '⌘' : (isMac ? 'Cmd' : 'Ctrl');

  return shortcut.replace(/Mod/g, modifier);
}
