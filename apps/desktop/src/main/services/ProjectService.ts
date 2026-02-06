import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  Project
} from '../database/queries/projects';
import { BaseService } from './BaseService';

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
   * Get all projects
   *
   * @returns Array of projects
   */
  async getAll(): Promise<Project[]> {
    const result = await this.executeWithRetry(
      async () => getAllProjects(),
      'projects:getAll'
    );
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

    return await this.executeWithRetry(
      async () => getProjectById(id),
      'projects:getById'
    );
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
    enabledModules?: string[]
  ): Promise<Project> {
    this.validateRequired(name, 'name', 'Project name');

    return await this.executeWithRetry(
      async () => createProject(name, description, logoPath, enabledModules),
      'projects:create'
    );
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

    return await this.executeWithRetry(
      async () => updateProject(id, updates),
      'projects:update'
    );
  }

  /**
   * Delete a project
   *
   * @param id Project ID
   */
  async delete(id: string): Promise<void> {
    this.validateId(id, 'Project');

    return await this.executeWithRetry(
      async () => deleteProject(id),
      'projects:delete'
    );
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
      console.error('Failed to parse enabled modules:', error);
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
