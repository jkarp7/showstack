export interface RecentFile {
  filePath: string;
  projectName: string;
  lastOpened: number;
}

const RECENT_FILES_KEY = 'recentFiles';
const GLOBAL_PROJECT_ID = '_global';
const MAX_RECENT_FILES = 10;

/**
 * Add a file to the recent files list
 */
export async function addRecentFile(filePath: string, projectName: string): Promise<void> {
  if (!window.api?.preferences) return;

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

    // Save to preferences
    await window.api.preferences.set(GLOBAL_PROJECT_ID, RECENT_FILES_KEY, trimmed);

    console.log('✅ Added to recent files:', filePath);
  } catch (error) {
    console.error('Failed to add recent file:', error);
  }
}

/**
 * Get the list of recent files
 */
export async function getRecentFiles(): Promise<RecentFile[]> {
  if (!window.api?.preferences) return [];

  try {
    const recentFiles = await window.api.preferences.get(GLOBAL_PROJECT_ID, RECENT_FILES_KEY);
    return recentFiles || [];
  } catch (error) {
    console.error('Failed to get recent files:', error);
    return [];
  }
}

/**
 * Remove a file from the recent files list
 */
export async function removeRecentFile(filePath: string): Promise<void> {
  if (!window.api?.preferences) return;

  try {
    const recentFiles = await getRecentFiles();
    const filtered = recentFiles.filter(f => f.filePath !== filePath);
    await window.api.preferences.set(GLOBAL_PROJECT_ID, RECENT_FILES_KEY, filtered);

    console.log('✅ Removed from recent files:', filePath);
  } catch (error) {
    console.error('Failed to remove recent file:', error);
  }
}

/**
 * Clear all recent files
 */
export async function clearRecentFiles(): Promise<void> {
  if (!window.api?.preferences) return;

  try {
    await window.api.preferences.set(GLOBAL_PROJECT_ID, RECENT_FILES_KEY, []);
    console.log('✅ Cleared recent files');
  } catch (error) {
    console.error('Failed to clear recent files:', error);
  }
}
