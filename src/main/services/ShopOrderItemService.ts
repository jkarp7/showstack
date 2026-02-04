import {
  getItemsBySectionId,
  getItemsByProjectId,
  createShopOrderItem,
  updateShopOrderItem,
  deleteShopOrderItem,
  ShopOrderItem
} from '../database/queries/shop-order';
import { errorHandler, ValidationError } from '../errors';

/**
 * ShopOrderItemService
 * Handles business logic for shop order equipment items
 */
export class ShopOrderItemService {
  /**
   * Get all items for a section
   */
  async getBySectionId(sectionId: string): Promise<ShopOrderItem[]> {
    if (!sectionId || sectionId.trim().length === 0) {
      throw new ValidationError('Section ID is required', 'sectionId', sectionId);
    }

    return await errorHandler.executeWithRetry(
      async () => getItemsBySectionId(sectionId),
      'shop-order:items:getBySectionId'
    );
  }

  /**
   * Get all items for a project
   */
  async getByProjectId(projectId: string): Promise<ShopOrderItem[]> {
    if (!projectId || projectId.trim().length === 0) {
      throw new ValidationError('Project ID is required', 'projectId', projectId);
    }

    return await errorHandler.executeWithRetry(
      async () => getItemsByProjectId(projectId),
      'shop-order:items:getByProjectId'
    );
  }

  /**
   * Create new item
   */
  async create(data: Partial<ShopOrderItem>): Promise<ShopOrderItem> {
    // Validate required fields
    if (!data.section_id || data.section_id.trim().length === 0) {
      throw new ValidationError('Section ID is required', 'section_id', data.section_id);
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new ValidationError('Item description is required', 'description', data.description);
    }

    return await errorHandler.executeWithRetry(
      async () => createShopOrderItem(data),
      'shop-order:items:create'
    );
  }

  /**
   * Update existing item
   */
  async update(id: string, updates: Partial<ShopOrderItem>): Promise<ShopOrderItem> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Item ID is required', 'id', id);
    }

    // Validate description if being updated
    if (updates.description !== undefined && updates.description.trim().length === 0) {
      throw new ValidationError(
        'Item description cannot be empty',
        'description',
        updates.description
      );
    }

    return await errorHandler.executeWithRetry(
      async () => updateShopOrderItem(id, updates),
      'shop-order:items:update'
    );
  }

  /**
   * Delete item
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Item ID is required', 'id', id);
    }

    return await errorHandler.executeWithRetry(
      async () => deleteShopOrderItem(id),
      'shop-order:items:delete'
    );
  }
}

// Singleton instance
export const shopOrderItemService = new ShopOrderItemService();
