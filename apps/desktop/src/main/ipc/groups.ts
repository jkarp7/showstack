import { ipcMain } from 'electron';
import { groupService } from '../services/GroupService';
import { DatabaseError, ValidationError } from '../errors';
import { logger } from '../utils/logger';

export function registerGroupHandlers(): void {
  // Get all groups for a project
  ipcMain.handle('groups:getAll', async (_event, projectId: string) => {
    try {
      return await groupService.getAll(projectId);
    } catch (error) {
      logger.error('Failed to get groups', {
        operation: 'groups:getAll',
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof DatabaseError)
        throw new Error(`Unable to load groups: ${error.message}`);
      throw error;
    }
  });

  // Get a single group by ID
  ipcMain.handle('groups:getById', async (_event, id: string) => {
    try {
      return await groupService.getById(id);
    } catch (error) {
      logger.error('Failed to get group', {
        operation: 'groups:getById',
        groupId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof DatabaseError) throw new Error(`Unable to load group: ${error.message}`);
      throw error;
    }
  });

  // Create a group
  ipcMain.handle('groups:create', async (_event, data: any, projectId: string) => {
    try {
      if (!data || typeof data.name !== 'string' || data.name.trim() === '') {
        throw new ValidationError('Group name is required', 'name', data?.name);
      }
      return await groupService.create(data, projectId);
    } catch (error) {
      logger.error('Failed to create group', {
        operation: 'groups:create',
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ValidationError) throw new Error(error.toUserMessage());
      if (error instanceof DatabaseError)
        throw new Error(`Unable to create group: ${error.message}`);
      throw error;
    }
  });

  // Update a group
  ipcMain.handle('groups:update', async (_event, id: string, updates: any) => {
    try {
      return await groupService.update(id, updates);
    } catch (error) {
      logger.error('Failed to update group', {
        operation: 'groups:update',
        groupId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ValidationError) throw new Error(error.toUserMessage());
      if (error instanceof DatabaseError)
        throw new Error(`Unable to update group: ${error.message}`);
      throw error;
    }
  });

  // Delete a group
  ipcMain.handle('groups:delete', async (_event, id: string) => {
    try {
      await groupService.delete(id);
    } catch (error) {
      logger.error('Failed to delete group', {
        operation: 'groups:delete',
        groupId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof DatabaseError)
        throw new Error(`Unable to delete group: ${error.message}`);
      throw error;
    }
  });

  // Get pins for a group
  ipcMain.handle('groups:getPins', async (_event, groupId: string) => {
    try {
      return await groupService.getPins(groupId);
    } catch (error) {
      logger.error('Failed to get group pins', {
        operation: 'groups:getPins',
        groupId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof DatabaseError) throw new Error(`Unable to load pins: ${error.message}`);
      throw error;
    }
  });

  // Add a pin (fixture → group)
  ipcMain.handle('groups:addPin', async (_event, groupId: string, fixtureId: string) => {
    try {
      await groupService.addPin(groupId, fixtureId);
    } catch (error) {
      logger.error('Failed to add pin', {
        operation: 'groups:addPin',
        groupId,
        fixtureId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof DatabaseError)
        throw new Error(`Unable to pin fixture: ${error.message}`);
      throw error;
    }
  });

  // Remove a pin
  ipcMain.handle('groups:removePin', async (_event, groupId: string, fixtureId: string) => {
    try {
      await groupService.removePin(groupId, fixtureId);
    } catch (error) {
      logger.error('Failed to remove pin', {
        operation: 'groups:removePin',
        groupId,
        fixtureId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof DatabaseError)
        throw new Error(`Unable to unpin fixture: ${error.message}`);
      throw error;
    }
  });

  // Get all group IDs a fixture is pinned to
  ipcMain.handle('groups:getGroupsForFixture', async (_event, fixtureId: string) => {
    try {
      return await groupService.getGroupsForFixture(fixtureId);
    } catch (error) {
      logger.error('Failed to get groups for fixture', {
        operation: 'groups:getGroupsForFixture',
        fixtureId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof DatabaseError)
        throw new Error(`Unable to load fixture groups: ${error.message}`);
      throw error;
    }
  });
}
