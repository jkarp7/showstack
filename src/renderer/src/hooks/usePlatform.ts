import { useMemo } from 'react';

export interface PlatformInfo {
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  modifierKey: 'Cmd' | 'Ctrl';
  modifierSymbol: '⌘' | 'Ctrl';
}

/**
 * Hook to detect the current platform and provide platform-specific information.
 * Useful for displaying correct keyboard shortcuts across different operating systems.
 *
 * @returns PlatformInfo object with platform detection flags and modifier key information
 *
 * @example
 * const { isMac, modifierKey } = usePlatform();
 * return <kbd>{modifierKey}+S</kbd>; // Shows "Cmd+S" on Mac, "Ctrl+S" on Windows/Linux
 */
export function usePlatform(): PlatformInfo {
  return useMemo(() => {
    const platform = navigator.platform.toUpperCase();
    const userAgent = navigator.userAgent.toUpperCase();

    const isMac = platform.includes('MAC') || userAgent.includes('MAC');
    const isWindows = platform.includes('WIN') || userAgent.includes('WIN');
    const isLinux = platform.includes('LINUX') || userAgent.includes('LINUX');

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
  const platform = navigator.platform.toUpperCase();
  const isMac = platform.includes('MAC');
  const modifier = useSymbol && isMac ? '⌘' : (isMac ? 'Cmd' : 'Ctrl');

  return shortcut.replace(/Mod/g, modifier);
}
