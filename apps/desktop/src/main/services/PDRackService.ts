import {
  getAllPDRacks,
  getPDRackById,
  createPDRack,
  updatePDRack,
  deletePDRack,
  getPDRacksWithUsage,
  PDRack
} from '../database/queries/pdRacks';
import { BaseService } from './BaseService';

/**
 * PDRackService (Power Distribution Rack Service)
 *
 * Handles business logic for non-dimmed power distribution racks
 *
 * Responsibilities:
 * - CRUD operations for PD racks
 * - Circuit assignments
 * - Breaker sizing calculations
 * - Power capacity management
 */
export class PDRackService extends BaseService {
  /**
   * Get all PD racks for a project
   *
   * @param projectId Optional project ID to filter by
   * @returns Array of PD racks
   */
  async getAll(projectId?: string): Promise<PDRack[]> {
    const result = await this.executeWithRetry(
      async () => getAllPDRacks(projectId),
      'pdRacks:getAll'
    );
    return result;
  }

  /**
   * Get PD rack by ID
   *
   * @param id PD rack ID
   * @returns PD rack or undefined
   */
  async getById(id: string): Promise<PDRack | undefined> {
    this.validateId(id, 'PD Rack');

    return await this.executeWithRetry(
      async () => getPDRackById(id),
      'pdRacks:getById'
    );
  }

  /**
   * Get PD racks with usage statistics
   *
   * @param projectId Optional project ID to filter by
   * @returns Array of PD racks with usage data
   */
  async getWithUsage(projectId?: string): Promise<any[]> {
    const result = await this.executeWithRetry(
      async () => getPDRacksWithUsage(projectId),
      'pdRacks:getWithUsage'
    );
    return result;
  }

  /**
   * Create a new PD rack
   *
   * @param data PD rack data
   * @param projectId Optional project ID
   * @returns Created PD rack
   */
  async create(data: Omit<PDRack, 'id' | 'created_at' | 'updated_at'>, projectId?: string): Promise<PDRack> {
    this.validateRequired(data.name, 'name', 'Rack name');

    // Validate voltage
    const validVoltages = [120, 208, 230, 240];
    if (!validVoltages.includes(data.voltage)) {
      throw new Error('Voltage must be 120, 208, 230, or 240');
    }

    // Validate circuit count
    const validCircuitCounts = [12, 24, 48, 96];
    if (!validCircuitCounts.includes(data.circuit_count)) {
      throw new Error('Circuit count must be 12, 24, 48, or 96');
    }

    return await this.executeWithRetry(
      async () => createPDRack(data, projectId),
      'pdRacks:create'
    );
  }

  /**
   * Update an existing PD rack
   *
   * @param id PD rack ID
   * @param updates Partial PD rack data to update
   * @returns Updated PD rack
   */
  async update(id: string, updates: Partial<PDRack>): Promise<PDRack> {
    this.validateId(id, 'PD Rack');

    // Validate name if being updated
    if (updates.name !== undefined) {
      this.validateRequired(updates.name, 'name', 'Rack name');
    }

    // Validate voltage if being updated
    if (updates.voltage !== undefined) {
      const validVoltages = [120, 208, 230, 240];
      if (!validVoltages.includes(updates.voltage)) {
        throw new Error('Voltage must be 120, 208, 230, or 240');
      }
    }

    // Validate circuit count if being updated
    if (updates.circuit_count !== undefined) {
      const validCircuitCounts = [12, 24, 48, 96];
      if (!validCircuitCounts.includes(updates.circuit_count)) {
        throw new Error('Circuit count must be 12, 24, 48, or 96');
      }
    }

    return await this.executeWithRetry(
      async () => updatePDRack(id, updates),
      'pdRacks:update'
    );
  }

  /**
   * Delete a PD rack
   *
   * @param id PD rack ID
   */
  async delete(id: string): Promise<void> {
    this.validateId(id, 'PD Rack');

    return await this.executeWithRetry(
      async () => deletePDRack(id),
      'pdRacks:delete'
    );
  }

  /**
   * Calculate total power capacity for a PD rack
   * TODO: Implement in future phase
   *
   * @param rack PD rack
   * @returns Total power capacity in watts
   */
  calculatePowerCapacity(rack: PDRack): number {
    const ampsPerBreaker = rack.amps_per_breaker || 20;
    const voltage = rack.voltage;
    const circuitCount = rack.circuit_count;

    return ampsPerBreaker * voltage * circuitCount;
  }

  /**
   * Calculate available circuits
   * TODO: Implement with equipment linkage in future phase
   *
   * @param rack PD rack
   * @returns Number of available circuits
   */
  calculateAvailableCircuits(rack: PDRack): number {
    // Future implementation will query equipment linked to this rack
    return rack.circuit_count;
  }
}

// Singleton instance
export const pdRackService = new PDRackService();
