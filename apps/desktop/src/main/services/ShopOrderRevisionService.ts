import {
  getRevisionsByProjectId,
  createShopOrderRevision,
  deleteShopOrderRevision,
  ShopOrderRevision,
} from '../database/queries/shop-order';
import { errorHandler, ValidationError } from '../errors';

/**
 * ShopOrderRevisionService
 * Handles business logic for shop order revisions
 */
export class ShopOrderRevisionService {
  /**
   * Get all revisions for a project
   */
  async getByProjectId(projectId: string): Promise<ShopOrderRevision[]> {
    if (!projectId || projectId.trim().length === 0) {
      throw new ValidationError('Project ID is required', 'projectId', projectId);
    }

    return await errorHandler.executeWithRetry(
      async () => getRevisionsByProjectId(projectId),
      'shop-order:revisions:getByProjectId',
    );
  }

  /**
   * Create new revision
   */
  async create(data: Partial<ShopOrderRevision>): Promise<ShopOrderRevision> {
    // Validate required fields
    if (!data.prep_project_id || data.prep_project_id.trim().length === 0) {
      throw new ValidationError('Project ID is required', 'prep_project_id', data.prep_project_id);
    }

    if (data.revision_number === undefined || data.revision_number === null) {
      throw new ValidationError(
        'Revision number is required',
        'revision_number',
        data.revision_number,
      );
    }

    return await errorHandler.executeWithRetry(
      async () => createShopOrderRevision(data),
      'shop-order:revisions:create',
    );
  }

  /**
   * Delete revision
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Revision ID is required', 'id', id);
    }

    return await errorHandler.executeWithRetry(
      async () => deleteShopOrderRevision(id),
      'shop-order:revisions:delete',
    );
  }
}

// Singleton instance
export const shopOrderRevisionService = new ShopOrderRevisionService();
