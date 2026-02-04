import {
  getAllShopOrderProjects,
  getShopOrderProjectById,
  createShopOrderProject,
  updateShopOrderProject,
  deleteShopOrderProject,
  ShopOrderProject
} from '../database/queries/shop-order';
import { errorHandler, ValidationError } from '../errors';
import { performanceMonitor } from '../monitoring/PerformanceMonitor';

/**
 * ShopOrderProjectService
 * Handles business logic for shop order projects
 */
export class ShopOrderProjectService {
  /**
   * Get all shop order projects
   */
  async getAll(): Promise<ShopOrderProject[]> {
    const start = Date.now();
    try {
      const result = await errorHandler.executeWithRetry(
        async () => getAllShopOrderProjects(),
        'shop-order:projects:getAll'
      );
      performanceMonitor.trackDatabaseQuery(
        'shop-order:projects:getAll',
        Date.now() - start,
        result.length
      );
      return result;
    } catch (error) {
      performanceMonitor.trackDatabaseQuery(
        'shop-order:projects:getAll',
        Date.now() - start
      );
      throw error;
    }
  }

  /**
   * Get shop order project by ID
   */
  async getById(id: string): Promise<ShopOrderProject | null> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Project ID is required', 'id', id);
    }

    return await errorHandler.executeWithRetry(
      async () => getShopOrderProjectById(id),
      'shop-order:projects:getById'
    );
  }

  /**
   * Create new shop order project
   */
  async create(data: Partial<ShopOrderProject>): Promise<ShopOrderProject> {
    // Validate required fields
    if (!data.production_name || data.production_name.trim().length === 0) {
      throw new ValidationError(
        'Production name is required',
        'production_name',
        data.production_name
      );
    }

    return await errorHandler.executeWithRetry(
      async () => createShopOrderProject(data),
      'shop-order:projects:create'
    );
  }

  /**
   * Update existing shop order project
   */
  async update(id: string, updates: Partial<ShopOrderProject>): Promise<ShopOrderProject> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Project ID is required', 'id', id);
    }

    // Validate production_name if being updated
    if (updates.production_name !== undefined && updates.production_name.trim().length === 0) {
      throw new ValidationError(
        'Production name cannot be empty',
        'production_name',
        updates.production_name
      );
    }

    return await errorHandler.executeWithRetry(
      async () => updateShopOrderProject(id, updates),
      'shop-order:projects:update'
    );
  }

  /**
   * Delete shop order project
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Project ID is required', 'id', id);
    }

    return await errorHandler.executeWithRetry(
      async () => deleteShopOrderProject(id),
      'shop-order:projects:delete'
    );
  }
}

// Singleton instance
export const shopOrderProjectService = new ShopOrderProjectService();
