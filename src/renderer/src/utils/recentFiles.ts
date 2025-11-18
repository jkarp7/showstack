export interface RecentFile {
  filePath: string;
  projectName: string;
  lastOpened: number;
}

const RECENT_FILES_KEY = 'showstack_recentFiles';
const MAX_RECENT_FILES = 10;

/**
 * Add a file to the recent files list
 */
export async function addRecentFile(filePath: string, projectName: string): Promise<void> {
  try {
    // Get current recent files
    const recentFiles = await getRecentFiles();

    // Remove this file if it already exists
    const filtered = recentFiles.filter(f => f.filePath !== filePath);

    // Add to the beginning
    const updated: RecentFile[] = [
      {
        filePath,
        projectName,
        lastOpened: Date.now()
      },
      ...filtered
    ];

    // Keep only the most recent MAX_RECENT_FILES
    const trimmed = updated.slice(0, MAX_RECENT_FILES);

    // Save to localStorage
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(trimmed));

    console.log('✅ Added to recent files:', filePath);
  } catch (error) {
    console.error('Failed to add recent file:', error);
  }
}

/**
 * Get the list of recent files
 */
export async function getRecentFiles(): Promise<RecentFile[]> {
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as RecentFile[];
  } catch (error) {
    console.error('Failed to get recent files:', error);
    return [];
  }
}

/**
 * Remove a file from the recent files list
 */
export async function removeRecentFile(filePath: string): Promise<void> {
  try {
    const recentFiles = await getRecentFiles();
    const filtered = recentFiles.filter(f => f.filePath !== filePath);
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(filtered));

    console.log('✅ Removed from recent files:', filePath);
  } catch (error) {
    console.error('Failed to remove recent file:', error);
  }
}

/**
 * Clear all recent files
 */
export async function clearRecentFiles(): Promise<void> {
  try {
    localStorage.removeItem(RECENT_FILES_KEY);
    console.log('✅ Cleared recent files');
  } catch (error) {
    console.error('Failed to clear recent files:', error);
  }
}
