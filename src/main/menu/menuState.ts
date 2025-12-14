/**
 * Menu State Management
 * Tracks the current context to dynamically update the application menu
 */

export type MenuContext =
  | 'landing'          // LandingPage (projects list)
  | 'project'          // ProjectPage (project details)
  | 'module'           // ModuleLanding (tool selection)
  | 'equipment'        // Equipment Manager
  | 'prep'             // Shop Order/Prep tool
  | 'systemdocs'       // System Docs container
  | 'paperwork'        // Paperwork generator
  | 'labels'           // Label designer
  | 'manager'          // Manager module
  | 'account'          // Account page
  | 'settings';        // Settings page

export interface MenuStateData {
  context: MenuContext;
  projectId?: string;
  projectName?: string;
  isDirty?: boolean;           // Has unsaved changes
  hasSelection?: boolean;       // Has selected rows (for bulk actions)
  canUndo?: boolean;
  canRedo?: boolean;
  filePath?: string;
}

class MenuStateManager {
  private currentState: MenuStateData = {
    context: 'landing'
  };

  private stateChangeCallbacks: Array<(state: MenuStateData) => void> = [];

  /**
   * Update the current menu state
   */
  setState(newState: Partial<MenuStateData>): void {
    this.currentState = {
      ...this.currentState,
      ...newState
    };

    // Notify all callbacks
    this.stateChangeCallbacks.forEach(callback => {
      callback(this.currentState);
    });
  }

  /**
   * Get the current menu state
   */
  getState(): MenuStateData {
    return { ...this.currentState };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: MenuStateData) => void): () => void {
    this.stateChangeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.setState({
      context: 'landing',
      projectId: undefined,
      projectName: undefined,
      isDirty: false,
      hasSelection: false,
      canUndo: false,
      canRedo: false,
      filePath: undefined
    });
  }
}

// Singleton instance
export const menuState = new MenuStateManager();
