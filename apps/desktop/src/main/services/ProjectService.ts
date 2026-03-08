import {
  getAllProjects,
  getProjectById,
  createProject,
  createProjectCopy,
  updateProject,
  deleteProject,
  Project,
} from '../database/queries/projects';
import { BaseService } from './BaseService';
import { logger } from '../utils/logger';
import { getSupabaseConnector } from './sync/SupabaseConnector';
import { syncProjectToPowerSync, deleteProjectFromPowerSync } from './sync/projectSync';

/**
 * ProjectService
 *
 * Handles business logic for ShowStack projects
 *
 * Responsibilities:
 * - CRUD operations for projects
 * - Project metadata management
 * - Enabled modules management
 * - Design team and production staff coordination
 */
export class ProjectService extends BaseService {
  /**
   * Sync a project to PowerSync if the user is authenticated.
   * Fire-and-forget with catch: a failure is logged but does not fail the caller.
   */
  private async maybeSyncToPowerSync(project: Project): Promise<void> {
    const conn = getSupabaseConnector();
    const userId = conn.getUserId();
    if (!userId) return;
    await syncProjectToPowerSync(project, userId).catch((err) =>
      logger.warn('[ProjectService] PowerSync write failed; will retry on reconnect', {
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }

  /**
   * Get all projects
   *
   * @returns Array of projects
   */
  async getAll(): Promise<Project[]> {
    const result = await this.executeWithRetry(async () => getAllProjects(), 'projects:getAll');
    return result;
  }

  /**
   * Get project by ID
   *
   * @param id Project ID
   * @returns Project or undefined if not found
   */
  async getById(id: string): Promise<Project | undefined> {
    this.validateId(id, 'Project');

    return await this.executeWithRetry(async () => getProjectById(id), 'projects:getById');
  }

  /**
   * Create a new project
   *
   * @param name Project name (required)
   * @param description Optional description
   * @param logoPath Optional logo path
   * @param enabledModules Optional array of enabled module names
   * @returns Created project
   */
  async create(
    name: string,
    description?: string,
    logoPath?: string,
    enabledModules?: string[],
  ): Promise<Project> {
    this.validateRequired(name, 'name', 'Project name');

    const project = await this.executeWithRetry(
      async () => createProject(name, description, logoPath, enabledModules),
      'projects:create',
    );
    await this.maybeSyncToPowerSync(project);
    return project;
  }

  /**
   * Update an existing project
   *
   * @param id Project ID
   * @param updates Partial project data to update
   * @returns Updated project
   */
  async update(id: string, updates: Partial<Project>): Promise<Project> {
    this.validateId(id, 'Project');

    // Validate name if being updated
    if (updates.name !== undefined) {
      this.validateRequired(updates.name, 'name', 'Project name');
    }

    const project = await this.executeWithRetry(
      async () => updateProject(id, updates),
      'projects:update',
    );
    await this.maybeSyncToPowerSync(project);
    return project;
  }

  /**
   * Delete a project
   *
   * @param id Project ID
   */
  async delete(id: string): Promise<void> {
    this.validateId(id, 'Project');

    // Backup before destructive operation
    const { backupService } = await import('./BackupService');
    await backupService.performBackup(`before-delete-project-${id}`);

    await this.executeWithRetry(async () => deleteProject(id), 'projects:delete');
    deleteProjectFromPowerSync(id).catch((err) =>
      logger.warn('[ProjectService] PowerSync delete failed; row may linger until reconnect', {
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }

  /**
   * Create a copy of an existing project in the same family stack.
   * The copy is named "Original Name — YYYY-MM-DD HH:mm" unless overridden.
   *
   * @param originalProjectId  ID of the project to copy
   * @param copyName           Optional name override
   */
  async createCopy(originalProjectId: string, copyName?: string): Promise<Project> {
    this.validateId(originalProjectId, 'Project');

    const project = await this.executeWithRetry(
      async () => createProjectCopy(originalProjectId, copyName),
      'projects:createCopy',
    );
    await this.maybeSyncToPowerSync(project);
    return project;
  }

  /**
   * Get enabled modules for a project
   *
   * @param project Project
   * @returns Array of enabled module names
   */
  getEnabledModules(project: Project): string[] {
    if (!project.enabled_modules) {
      return [];
    }

    // enabled_modules is stored as JSON string
    try {
      return JSON.parse(project.enabled_modules);
    } catch (error) {
      logger.error('Failed to parse enabled modules:', error);
      return [];
    }
  }

  /**
   * Check if a module is enabled for a project
   *
   * @param project Project
   * @param moduleName Module name to check
   * @returns True if module is enabled
   */
  isModuleEnabled(project: Project, moduleName: string): boolean {
    const enabledModules = this.getEnabledModules(project);
    return enabledModules.includes(moduleName);
  }
}

// Singleton instance
export const projectService = new ProjectService();
