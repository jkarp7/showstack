import {
  getSectionsByProjectId,
  createShopOrderSection,
  updateShopOrderSection,
  deleteShopOrderSection,
  ShopOrderSection
} from '../database/queries/shop-order';
import { errorHandler, ValidationError } from '../errors';

/**
 * ShopOrderSectionService
 * Handles business logic for shop order sections
 */
export class ShopOrderSectionService {
  /**
   * Get all sections for a project
   */
  async getByProjectId(projectId: string): Promise<ShopOrderSection[]> {
    if (!projectId || projectId.trim().length === 0) {
      throw new ValidationError('Project ID is required', 'projectId', projectId);
    }

    return await errorHandler.executeWithRetry(
      async () => getSectionsByProjectId(projectId),
      'shop-order:sections:getByProjectId'
    );
  }

  /**
   * Create new section
   */
  async create(data: Partial<ShopOrderSection>): Promise<ShopOrderSection> {
    // Validate required fields
    if (!data.prep_project_id || data.prep_project_id.trim().length === 0) {
      throw new ValidationError(
        'Project ID is required',
        'prep_project_id',
        data.prep_project_id
      );
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Section name is required', 'name', data.name);
    }

    return await errorHandler.executeWithRetry(
      async () => createShopOrderSection(data),
      'shop-order:sections:create'
    );
  }

  /**
   * Update existing section
   */
  async update(id: string, updates: Partial<ShopOrderSection>): Promise<ShopOrderSection> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Section ID is required', 'id', id);
    }

    // Validate name if being updated
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new ValidationError('Section name cannot be empty', 'name', updates.name);
    }

    return await errorHandler.executeWithRetry(
      async () => updateShopOrderSection(id, updates),
      'shop-order:sections:update'
    );
  }

  /**
   * Delete section
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Section ID is required', 'id', id);
    }

    return await errorHandler.executeWithRetry(
      async () => deleteShopOrderSection(id),
      'shop-order:sections:delete'
    );
  }
}

// Singleton instance
export const shopOrderSectionService = new ShopOrderSectionService();
