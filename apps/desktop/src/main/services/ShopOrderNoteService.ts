import {
  getNotesByProjectId,
  createShopOrderNote,
  updateShopOrderNote,
  deleteShopOrderNote,
  ShopOrderNote,
  getAllNoteTemplates,
  getNoteTemplateById,
  getDefaultNoteTemplate,
  createNoteTemplate,
  updateNoteTemplate,
  deleteNoteTemplate,
  ShopOrderNoteTemplate,
} from '../database/queries/shop-order';
import { errorHandler, ValidationError } from '../errors';

/**
 * ShopOrderNoteService
 * Handles business logic for shop order notes and note templates
 */
export class ShopOrderNoteService {
  // ============================================
  // NOTES
  // ============================================

  /**
   * Get all notes for a project
   */
  async getByProjectId(projectId: string): Promise<ShopOrderNote[]> {
    if (!projectId || projectId.trim().length === 0) {
      throw new ValidationError('Project ID is required', 'projectId', projectId);
    }

    return await errorHandler.executeWithRetry(
      async () => getNotesByProjectId(projectId),
      'shop-order:notes:getByProjectId',
    );
  }

  /**
   * Create new note
   */
  async create(data: Partial<ShopOrderNote>): Promise<ShopOrderNote> {
    // Validate required fields
    if (!data.prep_project_id || data.prep_project_id.trim().length === 0) {
      throw new ValidationError('Project ID is required', 'prep_project_id', data.prep_project_id);
    }

    if (!data.type) {
      throw new ValidationError('Note type is required', 'type', data.type);
    }

    if (!data.content || data.content.trim().length === 0) {
      throw new ValidationError('Note content is required', 'content', data.content);
    }

    return await errorHandler.executeWithRetry(
      async () => createShopOrderNote(data),
      'shop-order:notes:create',
    );
  }

  /**
   * Update existing note
   */
  async update(id: string, updates: Partial<ShopOrderNote>): Promise<ShopOrderNote> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Note ID is required', 'id', id);
    }

    // Validate content if being updated
    if (updates.content !== undefined && updates.content.trim().length === 0) {
      throw new ValidationError('Note content cannot be empty', 'content', updates.content);
    }

    return await errorHandler.executeWithRetry(
      async () => updateShopOrderNote(id, updates),
      'shop-order:notes:update',
    );
  }

  /**
   * Delete note
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Note ID is required', 'id', id);
    }

    return await errorHandler.executeWithRetry(
      async () => deleteShopOrderNote(id),
      'shop-order:notes:delete',
    );
  }

  // ============================================
  // NOTE TEMPLATES
  // ============================================

  /**
   * Get all note templates
   */
  async getAllTemplates(): Promise<ShopOrderNoteTemplate[]> {
    return await errorHandler.executeWithRetry(
      async () => getAllNoteTemplates(),
      'shop-order:note-templates:getAll',
    );
  }

  /**
   * Get note template by ID
   */
  async getTemplateById(id: string): Promise<ShopOrderNoteTemplate | null> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Template ID is required', 'id', id);
    }

    return await errorHandler.executeWithRetry(
      async () => getNoteTemplateById(id),
      'shop-order:note-templates:getById',
    );
  }

  /**
   * Get default note template for a type
   */
  async getDefaultTemplate(type: string): Promise<ShopOrderNoteTemplate | null> {
    if (!type || type.trim().length === 0) {
      throw new ValidationError('Template type is required', 'type', type);
    }

    return await errorHandler.executeWithRetry(
      async () => getDefaultNoteTemplate(type),
      'shop-order:note-templates:getDefault',
    );
  }

  /**
   * Create new note template
   */
  async createTemplate(data: Partial<ShopOrderNoteTemplate>): Promise<ShopOrderNoteTemplate> {
    // Validate required fields
    if (!data.type) {
      throw new ValidationError('Template type is required', 'type', data.type);
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Template name is required', 'name', data.name);
    }

    if (!data.content || data.content.trim().length === 0) {
      throw new ValidationError('Template content is required', 'content', data.content);
    }

    return await errorHandler.executeWithRetry(
      async () => createNoteTemplate(data),
      'shop-order:note-templates:create',
    );
  }

  /**
   * Update existing note template
   */
  async updateTemplate(
    id: string,
    updates: Partial<ShopOrderNoteTemplate>,
  ): Promise<ShopOrderNoteTemplate> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Template ID is required', 'id', id);
    }

    // Validate name if being updated
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new ValidationError('Template name cannot be empty', 'name', updates.name);
    }

    // Validate content if being updated
    if (updates.content !== undefined && updates.content.trim().length === 0) {
      throw new ValidationError('Template content cannot be empty', 'content', updates.content);
    }

    return await errorHandler.executeWithRetry(
      async () => updateNoteTemplate(id, updates),
      'shop-order:note-templates:update',
    );
  }

  /**
   * Delete note template
   */
  async deleteTemplate(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Template ID is required', 'id', id);
    }

    return await errorHandler.executeWithRetry(
      async () => deleteNoteTemplate(id),
      'shop-order:note-templates:delete',
    );
  }
}

// Singleton instance
export const shopOrderNoteService = new ShopOrderNoteService();
