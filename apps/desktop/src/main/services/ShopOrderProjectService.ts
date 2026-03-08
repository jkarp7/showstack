import {
  getAllShopOrderProjects,
  getShopOrderProjectById,
  createShopOrderProject,
  updateShopOrderProject,
  deleteShopOrderProject,
  ShopOrderProject,
} from '../database/queries/shop-order';
import { errorHandler, ValidationError } from '../errors';
import { performanceMonitor } from '../monitoring/PerformanceMonitor';
import { logger } from '../utils/logger';
import { getSupabaseConnector } from './sync/SupabaseConnector';
import { syncShopOrderToPowerSync, deleteShopOrderFromPowerSync } from './sync/projectSync';

/**
 * ShopOrderProjectService
 * Handles business logic for shop order projects
 */
export class ShopOrderProjectService {
  /**
   * Sync a shop order to PowerSync if the user is authenticated.
   * Fire-and-forget with catch: a failure is logged but does not fail the caller.
   */
  private async maybeSyncToPowerSync(shopOrder: ShopOrderProject): Promise<void> {
    const conn = getSupabaseConnector();
    if (!conn.isAuthenticated()) return;
    const userId = conn.getUserId();
    if (!userId) return;
    await syncShopOrderToPowerSync(shopOrder, userId).catch((err) =>
      logger.warn('[ShopOrderProjectService] PowerSync write failed; will retry on reconnect', {
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }

  /**
   * Get all shop order projects
   */
  async getAll(): Promise<ShopOrderProject[]> {
    const start = Date.now();
    try {
      const result = await errorHandler.executeWithRetry(
        async () => getAllShopOrderProjects(),
        'shop-order:projects:getAll',
      );
      performanceMonitor.trackDatabaseQuery(
        'shop-order:projects:getAll',
        Date.now() - start,
        result.length,
      );
      return result;
    } catch (error) {
      performanceMonitor.trackDatabaseQuery('shop-order:projects:getAll', Date.now() - start);
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
      'shop-order:projects:getById',
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
        data.production_name,
      );
    }

    // Inject the authenticated user's ID so the row is written to Supabase
    // under the correct owner, preventing the TOCTOU ownership race (issue #86).
    const conn = getSupabaseConnector();
    const userId = conn.isAuthenticated() ? conn.getUserId() : null;

    const shopOrder = await errorHandler.executeWithRetry(
      async () =>
        createShopOrderProject({
          ...data,
          user_id: userId ?? data.user_id,
        }),
      'shop-order:projects:create',
    );
    await this.maybeSyncToPowerSync(shopOrder);
    return shopOrder;
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
        updates.production_name,
      );
    }

    const shopOrder = await errorHandler.executeWithRetry(
      async () => updateShopOrderProject(id, updates),
      'shop-order:projects:update',
    );
    await this.maybeSyncToPowerSync(shopOrder);
    return shopOrder;
  }

  /**
   * Delete shop order project
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Project ID is required', 'id', id);
    }

    await errorHandler.executeWithRetry(
      async () => deleteShopOrderProject(id),
      'shop-order:projects:delete',
    );
    deleteShopOrderFromPowerSync(id).catch((err) =>
      logger.warn(
        '[ShopOrderProjectService] PowerSync delete failed; row may linger until reconnect',
        {
          error: err instanceof Error ? err.message : String(err),
        },
      ),
    );
  }
}

// Singleton instance
export const shopOrderProjectService = new ShopOrderProjectService();
