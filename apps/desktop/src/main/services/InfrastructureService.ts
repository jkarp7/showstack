import {
  getAllInfrastructure,
  createInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
  InfrastructureEquipment,
} from '../database/queries/infrastructure';
import { BaseService } from './BaseService';

/**
 * InfrastructureService
 *
 * Handles business logic for infrastructure equipment (network, data, audio, video)
 *
 * Responsibilities:
 * - CRUD operations for infrastructure equipment
 * - Port assignment management
 * - Network configuration validation
 * - Power consumption tracking
 */
export class InfrastructureService extends BaseService {
  /**
   * Get all infrastructure equipment for a project
   *
   * @param projectId Project ID
   * @returns Array of infrastructure equipment
   */
  async getAll(projectId: string): Promise<InfrastructureEquipment[]> {
    this.validateId(projectId, 'Project');

    const result = await this.executeWithRetry(
      async () => getAllInfrastructure(projectId),
      'infrastructure:getAll',
    );
    return result;
  }

  /**
   * Create new infrastructure equipment
   *
   * @param data Equipment data
   * @param projectId Project ID
   * @returns Created equipment
   */
  async create(
    data: Partial<InfrastructureEquipment>,
    projectId: string,
  ): Promise<InfrastructureEquipment> {
    this.validateId(projectId, 'Project');
    this.validateRequired(data.name, 'name', 'Equipment name');

    return await this.executeWithRetry(
      async () => createInfrastructure(data, projectId),
      'infrastructure:create',
    );
  }

  /**
   * Update existing infrastructure equipment
   *
   * @param id Equipment ID
   * @param updates Partial equipment data to update
   * @returns Updated equipment
   */
  async update(
    id: string,
    updates: Partial<InfrastructureEquipment>,
  ): Promise<InfrastructureEquipment> {
    this.validateId(id, 'Infrastructure Equipment');

    // Validate name if being updated
    if (updates.name !== undefined) {
      this.validateRequired(updates.name, 'name', 'Equipment name');
    }

    // Validate VLAN ID range if provided
    if (updates.vlan_id !== undefined && updates.vlan_id !== null) {
      this.validateRange(updates.vlan_id, 1, 4094, 'VLAN ID');
    }

    return await this.executeWithRetry(
      async () => updateInfrastructure(id, updates),
      'infrastructure:update',
    );
  }

  /**
   * Delete infrastructure equipment
   *
   * @param id Equipment ID
   */
  async delete(id: string): Promise<void> {
    this.validateId(id, 'Infrastructure Equipment');

    return await this.executeWithRetry(
      async () => deleteInfrastructure(id),
      'infrastructure:delete',
    );
  }

  /**
   * Get port assignments for equipment
   * TODO: Implement in future phase
   *
   * @param equipment Infrastructure equipment
   * @returns Array of port assignments
   */
  getPortAssignments(equipment: InfrastructureEquipment): any[] {
    if (!equipment.port_assignments) {
      return [];
    }

    try {
      return JSON.parse(equipment.port_assignments as any);
    } catch (error) {
      console.error('Failed to parse port assignments:', error);
      return [];
    }
  }

  /**
   * Calculate total power consumption for infrastructure
   * TODO: Implement in future phase
   *
   * @param equipment Array of equipment
   * @returns Total wattage
   */
  calculatePowerTotal(equipment: InfrastructureEquipment[]): number {
    return equipment.reduce((total, item) => {
      return total + (item.wattage || 0);
    }, 0);
  }
}

// Singleton instance
export const infrastructureService = new InfrastructureService();
