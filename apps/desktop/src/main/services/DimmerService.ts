import {
  getAllDimmerRacks,
  getDimmerRackById,
  createDimmerRack,
  updateDimmerRack,
  deleteDimmerRack,
  getDimmerRacksWithUsage,
  DimmerRack
} from '../database/queries/dimmerRacks';
import { BaseService } from './BaseService';

/**
 * DimmerService
 *
 * Handles business logic for dimmer racks and power distribution
 *
 * Responsibilities:
 * - CRUD operations for dimmer racks
 * - Circuit patching management
 * - Module configuration
 * - Power calculations (wattage, amperage)
 */
export class DimmerService extends BaseService {
  /**
   * Get all dimmer racks for a project
   *
   * @param projectId Optional project ID to filter by
   * @returns Array of dimmer racks
   */
  async getAll(projectId?: string): Promise<DimmerRack[]> {
    const result = await this.executeWithRetry(
      async () => getAllDimmerRacks(projectId),
      'dimmerRacks:getAll'
    );
    return result;
  }

  /**
   * Get dimmer rack by ID
   *
   * @param id Dimmer rack ID
   * @returns Dimmer rack or undefined
   */
  async getById(id: string): Promise<DimmerRack | undefined> {
    this.validateId(id, 'Dimmer Rack');

    return await this.executeWithRetry(
      async () => getDimmerRackById(id),
      'dimmerRacks:getById'
    );
  }

  /**
   * Get dimmer racks with usage statistics
   *
   * @param projectId Optional project ID to filter by
   * @returns Array of dimmer racks with usage data
   */
  async getWithUsage(projectId?: string): Promise<any[]> {
    const result = await this.executeWithRetry(
      async () => getDimmerRacksWithUsage(projectId),
      'dimmerRacks:getWithUsage'
    );
    return result;
  }

  /**
   * Create a new dimmer rack
   *
   * @param data Dimmer rack data
   * @param projectId Optional project ID
   * @returns Created dimmer rack
   */
  async create(data: Omit<DimmerRack, 'id' | 'created_at' | 'updated_at'>, projectId?: string): Promise<DimmerRack> {
    this.validateRequired(data.name, 'name', 'Rack name');

    // Validate circuit count
    const validCircuitCounts = [12, 24, 48, 96];
    if (!validCircuitCounts.includes(data.circuit_count)) {
      throw new Error('Circuit count must be 12, 24, 48, or 96');
    }

    return await this.executeWithRetry(
      async () => createDimmerRack(data, projectId),
      'dimmerRacks:create'
    );
  }

  /**
   * Update an existing dimmer rack
   *
   * @param id Dimmer rack ID
   * @param updates Partial dimmer rack data to update
   * @returns Updated dimmer rack
   */
  async update(id: string, updates: Partial<DimmerRack>): Promise<DimmerRack> {
    this.validateId(id, 'Dimmer Rack');

    // Validate name if being updated
    if (updates.name !== undefined) {
      this.validateRequired(updates.name, 'name', 'Rack name');
    }

    // Validate circuit count if being updated
    if (updates.circuit_count !== undefined) {
      const validCircuitCounts = [12, 24, 48, 96];
      if (!validCircuitCounts.includes(updates.circuit_count)) {
        throw new Error('Circuit count must be 12, 24, 48, or 96');
      }
    }

    return await this.executeWithRetry(
      async () => updateDimmerRack(id, updates),
      'dimmerRacks:update'
    );
  }

  /**
   * Delete a dimmer rack
   *
   * @param id Dimmer rack ID
   */
  async delete(id: string): Promise<void> {
    this.validateId(id, 'Dimmer Rack');

    return await this.executeWithRetry(
      async () => deleteDimmerRack(id),
      'dimmerRacks:delete'
    );
  }

  /**
   * Calculate total power capacity for a dimmer rack
   * TODO: Implement in future phase
   *
   * @param rack Dimmer rack
   * @returns Total wattage capacity
   */
  calculatePowerCapacity(rack: DimmerRack): number {
    return rack.circuit_count * (rack.watts_per_module || 2400);
  }

  /**
   * Calculate available circuits
   * TODO: Implement with fixture linkage in future phase
   *
   * @param rack Dimmer rack
   * @returns Number of available circuits
   */
  calculateAvailableCircuits(rack: DimmerRack): number {
    // Future implementation will query fixtures linked to this rack
    return rack.circuit_count;
  }
}

// Singleton instance
export const dimmerService = new DimmerService();
