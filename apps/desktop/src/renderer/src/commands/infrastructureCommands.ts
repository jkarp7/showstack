import { v4 as uuidv4 } from 'uuid';
import { Command, CommandType } from '../types/commands';
import { InfrastructureEquipment } from '../types/infrastructure';
import { useFileStore } from '../store/fileStore';

/**
 * Command to add new infrastructure equipment
 */
export class AddInfrastructureCommand implements Command {
  id: string;
  timestamp: number;
  type: string = CommandType.INFRASTRUCTURE_ADD;
  description: string;

  private equipmentData: Omit<InfrastructureEquipment, 'id' | 'created_at' | 'updated_at'>;
  private addedEquipment: InfrastructureEquipment | null = null;
  private hasExecuted: boolean = false;

  constructor(equipmentData: Omit<InfrastructureEquipment, 'id' | 'created_at' | 'updated_at'>) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.equipmentData = equipmentData;
    this.description = `Add infrastructure: ${equipmentData.name || 'New Equipment'}`;
  }

  async execute(): Promise<void> {
    // Only create new equipment on first execution
    // On redo, restore the previously created equipment
    if (!this.hasExecuted) {
      // First execution - create new equipment
      const { project_id, ...equipmentWithoutProjectId } = this.equipmentData;
      const addedEquipment = await window.api.infrastructure.create(
        equipmentWithoutProjectId,
        project_id,
      );
      this.addedEquipment = addedEquipment;
      this.hasExecuted = true;

      const { useInfrastructureStore } = await import('../store/infrastructureStore');
      useInfrastructureStore.setState((state) => ({
        equipment: [...state.equipment, addedEquipment],
      }));
    } else {
      // Redo - restore the previously deleted equipment
      if (!this.addedEquipment) {
        throw new Error('Cannot redo: equipment data not found');
      }

      // Remove id/timestamps and recreate
      const { id, created_at, updated_at, project_id, ...equipmentData } = this.addedEquipment;
      const restoredEquipment = await window.api.infrastructure.create(equipmentData, project_id);
      this.addedEquipment = restoredEquipment; // Update with new ID

      const { useInfrastructureStore } = await import('../store/infrastructureStore');
      useInfrastructureStore.setState((state) => ({
        equipment: [...state.equipment, restoredEquipment],
      }));
    }

    useFileStore.getState().setDirty(true);
  }

  async undo(): Promise<void> {
    if (!this.addedEquipment) {
      throw new Error('Cannot undo: equipment not found');
    }

    // Delete the equipment from database
    await window.api.infrastructure.delete(this.addedEquipment.id);

    // Remove from store
    const { useInfrastructureStore } = await import('../store/infrastructureStore');
    const equipmentId = this.addedEquipment.id;
    useInfrastructureStore.setState((state) => ({
      equipment: state.equipment.filter((e) => e.id !== equipmentId),
    }));

    useFileStore.getState().setDirty(true);
  }
}

/**
 * Command to update infrastructure equipment
 */
export class UpdateInfrastructureCommand implements Command {
  id: string;
  timestamp: number;
  type: string = CommandType.INFRASTRUCTURE_UPDATE;
  description: string;

  private equipmentId: string;
  private oldData: InfrastructureEquipment;
  private newData: Partial<InfrastructureEquipment>;

  constructor(
    equipmentId: string,
    oldData: InfrastructureEquipment,
    newData: Partial<InfrastructureEquipment>,
  ) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.equipmentId = equipmentId;
    this.oldData = oldData;
    this.newData = newData;
    this.description = `Update infrastructure: ${oldData.name || equipmentId}`;
  }

  async execute(): Promise<void> {
    // Call the IPC to update the equipment
    const updatedEquipment = await window.api.infrastructure.update(this.equipmentId, this.newData);

    // Update store directly
    const { useInfrastructureStore } = await import('../store/infrastructureStore');
    useInfrastructureStore.setState((state) => ({
      equipment: state.equipment.map((e) => (e.id === this.equipmentId ? updatedEquipment : e)),
    }));

    // Mark file as dirty
    useFileStore.getState().setDirty(true);
  }

  async undo(): Promise<void> {
    // Restore the old data
    const updatedEquipment = await window.api.infrastructure.update(this.equipmentId, this.oldData);

    // Update store directly
    const { useInfrastructureStore } = await import('../store/infrastructureStore');
    useInfrastructureStore.setState((state) => ({
      equipment: state.equipment.map((e) => (e.id === this.equipmentId ? updatedEquipment : e)),
    }));

    // Mark file as dirty
    useFileStore.getState().setDirty(true);
  }
}

/**
 * Command to delete infrastructure equipment
 */
export class DeleteInfrastructureCommand implements Command {
  id: string;
  timestamp: number;
  type: string = CommandType.INFRASTRUCTURE_DELETE;
  description: string;

  private deletedEquipment: InfrastructureEquipment;
  private isDeleted: boolean = false;

  constructor(equipment: InfrastructureEquipment) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.deletedEquipment = equipment;
    this.description = `Delete infrastructure: ${equipment.name || equipment.id}`;
  }

  async execute(): Promise<void> {
    // Only delete if not already deleted (to handle redo correctly)
    if (!this.isDeleted) {
      await window.api.infrastructure.delete(this.deletedEquipment.id);

      const { useInfrastructureStore } = await import('../store/infrastructureStore');
      const equipmentId = this.deletedEquipment.id;
      useInfrastructureStore.setState((state) => ({
        equipment: state.equipment.filter((e) => e.id !== equipmentId),
      }));

      this.isDeleted = true;
      useFileStore.getState().setDirty(true);
    }
  }

  async undo(): Promise<void> {
    if (!this.isDeleted) {
      throw new Error('Cannot undo: equipment was not deleted');
    }

    // Re-create the equipment
    const { id, created_at, updated_at, project_id, ...equipmentData } = this.deletedEquipment;
    const restoredEquipment = await window.api.infrastructure.create(equipmentData, project_id);

    const { useInfrastructureStore } = await import('../store/infrastructureStore');
    useInfrastructureStore.setState((state) => ({
      equipment: [...state.equipment, restoredEquipment],
    }));

    // Update our stored reference with the new ID
    this.deletedEquipment = restoredEquipment;
    this.isDeleted = false;

    useFileStore.getState().setDirty(true);
  }
}

/**
 * Command to bulk delete multiple infrastructure equipment
 */
export class BulkDeleteInfrastructureCommand implements Command {
  id: string;
  timestamp: number;
  type: string = CommandType.INFRASTRUCTURE_BULK_DELETE;
  description: string;

  private deletedEquipment: InfrastructureEquipment[];
  private isDeleted: boolean = false;

  constructor(equipment: InfrastructureEquipment[]) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.deletedEquipment = equipment;
    this.description = `Delete ${equipment.length} infrastructure item${equipment.length === 1 ? '' : 's'}`;
  }

  async execute(): Promise<void> {
    // Only delete if not already deleted (to handle redo correctly)
    if (!this.isDeleted) {
      const ids = this.deletedEquipment.map((e) => e.id);
      await window.api.infrastructure.deleteMultiple(ids);

      const { useInfrastructureStore } = await import('../store/infrastructureStore');
      const deletedIds = new Set(ids);
      useInfrastructureStore.setState((state) => ({
        equipment: state.equipment.filter((e) => !deletedIds.has(e.id)),
      }));

      this.isDeleted = true;
      useFileStore.getState().setDirty(true);
    }
  }

  async undo(): Promise<void> {
    if (!this.isDeleted) {
      throw new Error('Cannot undo: equipment was not deleted');
    }

    const { useInfrastructureStore } = await import('../store/infrastructureStore');

    // Re-create all deleted equipment
    const restoredEquipment = await Promise.all(
      this.deletedEquipment.map((equipment) => {
        const { id, created_at, updated_at, project_id, ...equipmentData } = equipment;
        return window.api.infrastructure.create(equipmentData, project_id);
      }),
    );

    useInfrastructureStore.setState((state) => ({
      equipment: [...state.equipment, ...restoredEquipment],
    }));

    // Update our stored references with the new IDs
    this.deletedEquipment = restoredEquipment;
    this.isDeleted = false;

    useFileStore.getState().setDirty(true);
  }
}
