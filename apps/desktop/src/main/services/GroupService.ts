import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getPinsForGroup,
  getPinnedFixtureIds,
  addPin,
  removePin,
  getGroupsForFixture,
  FixtureGroup,
  FixtureGroupPin,
} from '../database/queries/groups';
import { BaseService } from './BaseService';
import { logger } from '../utils/logger';

/**
 * GroupService
 *
 * Business logic for Smart Groups — named saved filters that drive
 * shop order automation, labels, and paperwork.
 *
 * Group membership is always computed on-demand from the stored filter_def
 * plus any manual pins. There is no assignment join table and no re-evaluate step.
 */
export class GroupService extends BaseService {
  async getAll(projectId: string): Promise<FixtureGroup[]> {
    this.validateId(projectId, 'Project');
    return this.executeWithRetry(async () => getAllGroups(projectId), 'groups:getAll');
  }

  async getById(id: string): Promise<FixtureGroup | undefined> {
    this.validateId(id, 'Group');
    return this.executeWithRetry(async () => getGroupById(id), 'groups:getById');
  }

  async create(data: Partial<FixtureGroup>, projectId: string): Promise<FixtureGroup> {
    this.validateId(projectId, 'Project');
    this.validateRequired(data.name, 'name', 'Group name');
    return this.executeWithRetry(async () => createGroup(data, projectId), 'groups:create');
  }

  async update(id: string, updates: Partial<FixtureGroup>): Promise<FixtureGroup> {
    this.validateId(id, 'Group');
    const result = await this.executeWithRetry(
      async () => updateGroup(id, updates),
      'groups:update',
    );
    if (!result) {
      logger.warn(`Group not found during update`, { groupId: id });
      throw new Error(`Group ${id} not found`);
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    this.validateId(id, 'Group');
    return this.executeWithRetry(async () => deleteGroup(id), 'groups:delete');
  }

  // ─── Pins ───────────────────────────────────────────────────────────────────

  async getPins(groupId: string): Promise<FixtureGroupPin[]> {
    this.validateId(groupId, 'Group');
    return this.executeWithRetry(async () => getPinsForGroup(groupId), 'groups:getPins');
  }

  async getPinnedFixtureIds(groupId: string): Promise<string[]> {
    this.validateId(groupId, 'Group');
    return this.executeWithRetry(
      async () => getPinnedFixtureIds(groupId),
      'groups:getPinnedFixtureIds',
    );
  }

  async addPin(groupId: string, fixtureId: string): Promise<void> {
    this.validateId(groupId, 'Group');
    this.validateId(fixtureId, 'Fixture');
    return this.executeWithRetry(async () => addPin(groupId, fixtureId), 'groups:addPin');
  }

  async removePin(groupId: string, fixtureId: string): Promise<void> {
    this.validateId(groupId, 'Group');
    this.validateId(fixtureId, 'Fixture');
    return this.executeWithRetry(async () => removePin(groupId, fixtureId), 'groups:removePin');
  }

  async getGroupsForFixture(fixtureId: string): Promise<string[]> {
    this.validateId(fixtureId, 'Fixture');
    return this.executeWithRetry(
      async () => getGroupsForFixture(fixtureId),
      'groups:getGroupsForFixture',
    );
  }
}

export const groupService = new GroupService();
