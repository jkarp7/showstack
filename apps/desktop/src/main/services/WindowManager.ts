import { BrowserWindow } from 'electron';
import { createWindow } from '../window';

interface WindowInfo {
  window: BrowserWindow;
  projectId?: string;
  type: 'landing' | 'project';
}

/**
 * Manages multiple application windows
 */
class WindowManager {
  private windows: Map<number, WindowInfo> = new Map();
  private landingWindow: BrowserWindow | null = null;

  /**
   * Create the main landing page window
   */
  createLandingWindow(): BrowserWindow {
    // If landing window already exists, focus it
    if (this.landingWindow && !this.landingWindow.isDestroyed()) {
      this.landingWindow.focus();
      return this.landingWindow;
    }

    const window = createWindow('/');
    this.landingWindow = window;

    const info: WindowInfo = {
      window,
      type: 'landing',
    };

    this.windows.set(window.id, info);

    // Clean up when window is closed
    window.on('closed', () => {
      this.windows.delete(window.id);
      if (this.landingWindow === window) {
        this.landingWindow = null;
      }
    });

    return window;
  }

  /**
   * Create or focus a project window
   * If a window for this project already exists, focus it
   * Otherwise, create a new window
   */
  createOrFocusProjectWindow(projectId: string): BrowserWindow {
    // Check if window for this project already exists
    const existingWindow = this.findProjectWindow(projectId);
    if (existingWindow && !existingWindow.isDestroyed()) {
      // Bring window to front more aggressively
      if (existingWindow.isMinimized()) {
        existingWindow.restore();
      }

      // On macOS, need to be more aggressive with window focusing
      if (process.platform === 'darwin') {
        // Temporarily set always on top to ensure it comes to front
        existingWindow.setAlwaysOnTop(true);
        existingWindow.show();
        existingWindow.focus();
        existingWindow.setAlwaysOnTop(false);
      } else {
        existingWindow.show();
        existingWindow.focus();
      }

      existingWindow.moveTop(); // Ensure it's on top of other windows
      return existingWindow;
    }

    // Create new project window
    const window = createWindow(`/project/${projectId}`);

    const info: WindowInfo = {
      window,
      projectId,
      type: 'project',
    };

    this.windows.set(window.id, info);

    // Clean up when window is closed
    window.on('closed', () => {
      this.windows.delete(window.id);
    });

    return window;
  }

  /**
   * Find an existing window for a project
   */
  private findProjectWindow(projectId: string): BrowserWindow | null {
    for (const info of this.windows.values()) {
      if (info.type === 'project' && info.projectId === projectId) {
        return info.window;
      }
    }
    return null;
  }

  /**
   * Get all open windows
   */
  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values()).map((info) => info.window);
  }

  /**
   * Get window info by window ID
   */
  getWindowInfo(windowId: number): WindowInfo | undefined {
    return this.windows.get(windowId);
  }

  /**
   * Close all project windows (but keep landing window)
   */
  closeAllProjectWindows(): void {
    for (const info of this.windows.values()) {
      if (info.type === 'project' && !info.window.isDestroyed()) {
        info.window.close();
      }
    }
  }

  /**
   * Close all windows
   */
  closeAllWindows(): void {
    for (const info of this.windows.values()) {
      if (!info.window.isDestroyed()) {
        info.window.close();
      }
    }
    this.windows.clear();
    this.landingWindow = null;
  }
}

export const windowManager = new WindowManager();
