export interface RecentFile {
  filePath: string;
  projectName: string;
  lastOpened: number;
  created: number; // When first added to recent files
  moduleType?: string; // production, manager, design
}

type ModuleType = 'production' | 'manager' | 'design';

const RECENT_FILES_KEY_PREFIX = 'showstack_recentFiles';
const MAX_RECENT_FILES = 10;

/**
 * Get the storage key for a specific module type
 */
function getStorageKey(moduleType?: ModuleType): string {
  if (!moduleType) {
    return RECENT_FILES_KEY_PREFIX; // Legacy key
  }
  return `${RECENT_FILES_KEY_PREFIX}_${moduleType}`;
}

/**
 * Add a file to the recent files list for a specific module
 */
export async function addRecentFile(filePath: string, projectName: string, moduleType?: ModuleType): Promise<void> {
  try {
    // Get current recent files for this module
    const recentFiles = await getRecentFiles(moduleType);

    // Check if this file already exists
    const existingFile = recentFiles.find(f => f.filePath === filePath);
    const created = existingFile?.created || Date.now();

    // Remove this file if it already exists
    const filtered = recentFiles.filter(f => f.filePath !== filePath);

    // Add to the beginning
    const updated: RecentFile[] = [
      {
        filePath,
        projectName,
        lastOpened: Date.now(),
        created, // Keep original creation date if it existed
        moduleType
      },
      ...filtered
    ];

    // Keep only the most recent MAX_RECENT_FILES
    const trimmed = updated.slice(0, MAX_RECENT_FILES);

    // Save to localStorage with module-specific key
    const storageKey = getStorageKey(moduleType);
    localStorage.setItem(storageKey, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to add recent file:', error);
  }
}

/**
 * Get the list of recent files for a specific module
 */
export async function getRecentFiles(moduleType?: ModuleType): Promise<RecentFile[]> {
  try {
    const storageKey = getStorageKey(moduleType);
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    return JSON.parse(stored) as RecentFile[];
  } catch (error) {
    console.error('Failed to get recent files:', error);
    return [];
  }
}

/**
 * Remove a file from the recent files list for a specific module
 */
export async function removeRecentFile(filePath: string, moduleType?: ModuleType): Promise<void> {
  try {
    const recentFiles = await getRecentFiles(moduleType);
    const filtered = recentFiles.filter(f => f.filePath !== filePath);
    const storageKey = getStorageKey(moduleType);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove recent file:', error);
  }
}

/**
 * Clear all recent files for a specific module (or all if no module specified)
 */
export async function clearRecentFiles(moduleType?: ModuleType): Promise<void> {
  try {
    if (moduleType) {
      const storageKey = getStorageKey(moduleType);
      localStorage.removeItem(storageKey);
    } else {
      // Clear all module-specific keys
      localStorage.removeItem(getStorageKey('production'));
      localStorage.removeItem(getStorageKey('manager'));
      localStorage.removeItem(getStorageKey('design'));
      localStorage.removeItem(RECENT_FILES_KEY_PREFIX); // Legacy key
    }
  } catch (error) {
    console.error('Failed to clear recent files:', error);
  }
}

/**
 * Determine module type from file extension
 */
export function getModuleTypeFromPath(filePath: string): ModuleType | undefined {
  if (filePath.endsWith('.ssp')) return 'production';
  if (filePath.endsWith('.ssm')) return 'manager';
  if (filePath.endsWith('.ssd')) return 'design';
  return undefined;
}
