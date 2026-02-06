import {
  getAllFixtures,
  createFixture,
  updateFixture,
  deleteFixture,
  deleteMultipleFixtures,
  Fixture
} from '../database/queries/fixtures';
import { BaseService } from './BaseService';

/**
 * FixtureService
 *
 * Handles business logic for lighting fixtures
 *
 * Responsibilities:
 * - CRUD operations for fixtures
 * - DMX calculations (future)
 * - Power totals (future)
 * - Validation of fixture data
 */
export class FixtureService extends BaseService {
  /**
   * Get all fixtures for a project
   *
   * @param projectId Optional project ID to filter by
   * @returns Array of fixtures
   */
  async getAll(projectId?: string): Promise<Fixture[]> {
    const result = await this.executeWithRetry(
      async () => getAllFixtures(projectId),
      'fixtures:getAll'
    );
    return result;
  }

  /**
   * Create a new fixture
   *
   * @param data Fixture data
   * @param projectId Optional project ID
   * @returns Created fixture
   */
  async create(data: Partial<Fixture>, projectId?: string): Promise<Fixture> {
    return await this.executeWithRetry(
      async () => createFixture(data, projectId),
      'fixtures:create'
    );
  }

  /**
   * Update an existing fixture
   *
   * @param id Fixture ID
   * @param updates Partial fixture data to update
   * @returns Updated fixture
   */
  async update(id: string, updates: Partial<Fixture>): Promise<Fixture> {
    this.validateId(id, 'Fixture');

    return await this.executeWithRetry(
      async () => updateFixture(id, updates),
      'fixtures:update'
    );
  }

  /**
   * Delete a fixture
   *
   * @param id Fixture ID
   */
  async delete(id: string): Promise<void> {
    this.validateId(id, 'Fixture');

    return await this.executeWithRetry(
      async () => deleteFixture(id),
      'fixtures:delete'
    );
  }

  /**
   * Delete multiple fixtures
   *
   * @param ids Array of fixture IDs
   */
  async deleteMultiple(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new Error('No fixture IDs provided');
    }

    return await this.executeWithRetry(
      async () => deleteMultipleFixtures(ids),
      'fixtures:deleteMultiple'
    );
  }

  /**
   * Calculate total DMX footprint for a set of fixtures
   * TODO: Implement in future phase
   *
   * @param fixtures Array of fixtures
   * @returns Total DMX channels used
   */
  calculateDMXFootprint(fixtures: Fixture[]): number {
    // Future implementation
    // Will calculate total DMX channels based on fixture types and modes
    return 0;
  }

  /**
   * Calculate total power consumption for a set of fixtures
   * TODO: Implement in future phase
   *
   * @param fixtures Array of fixtures
   * @returns Total wattage
   */
  calculatePowerTotal(fixtures: Fixture[]): number {
    // Future implementation
    // Will sum wattage/amperage for all fixtures
    return fixtures.reduce((total, fixture) => {
      return total + (fixture.wattage || 0);
    }, 0);
  }
}

// Singleton instance
export const fixtureService = new FixtureService();
