import { v4 as uuidv4 } from 'uuid';
import { Command, CommandType } from '../types/commands';
import { Fixture } from '../types';
import { useFileStore } from '../store/fileStore';
import { trackFixtureOperation } from '../services/telemetryTracking';

/**
 * Command to add a new fixture
 */
export class AddFixtureCommand implements Command {
  id: string;
  timestamp: number;
  type: string = CommandType.FIXTURE_ADD;
  description: string;

  private fixtureData: Omit<Fixture, 'id' | 'created_at' | 'updated_at'>;
  private addedFixture: Fixture | null = null;
  private hasExecuted: boolean = false;

  constructor(fixtureData: Omit<Fixture, 'id' | 'created_at' | 'updated_at'>) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.fixtureData = fixtureData;
    this.description = `Add fixture: ${fixtureData.position || 'New Fixture'}`;
  }

  async execute(): Promise<void> {
    // Only create a new fixture on first execution
    // On redo, restore the previously created fixture
    if (!this.hasExecuted) {
      // First execution - create new fixture
      const addedFixture = await window.api.fixtures.create(this.fixtureData);
      this.addedFixture = addedFixture;
      this.hasExecuted = true;

      const { useFixtureStore } = await import('../store/fixtureStore');
      useFixtureStore.setState((state) => ({
        fixtures: [...state.fixtures, addedFixture],
      }));

      // Track fixture addition
      trackFixtureOperation.add(1, {
        position: addedFixture.position,
        type: addedFixture.type,
      });
    } else {
      // Redo - restore the previously deleted fixture
      if (!this.addedFixture) {
        throw new Error('Cannot redo: fixture data not found');
      }

      // Remove id/timestamps and recreate
      const { id, created_at, updated_at, ...fixtureData } = this.addedFixture;
      const restoredFixture = await window.api.fixtures.create(fixtureData);
      this.addedFixture = restoredFixture; // Update with new ID

      const { useFixtureStore } = await import('../store/fixtureStore');
      useFixtureStore.setState((state) => ({
        fixtures: [...state.fixtures, restoredFixture],
      }));
    }

    useFileStore.getState().setDirty(true);
  }

  async undo(): Promise<void> {
    if (!this.addedFixture) {
      throw new Error('Cannot undo: fixture not found');
    }

    // Delete the fixture from database
    await window.api.fixtures.delete(this.addedFixture.id);

    // Remove from store
    const { useFixtureStore } = await import('../store/fixtureStore');
    const fixtureId = this.addedFixture.id;
    useFixtureStore.setState((state) => ({
      fixtures: state.fixtures.filter((f) => f.id !== fixtureId),
    }));

    useFileStore.getState().setDirty(true);
  }
}

/**
 * Command to update a fixture
 */
export class UpdateFixtureCommand implements Command {
  id: string;
  timestamp: number;
  type: string = CommandType.FIXTURE_UPDATE;
  description: string;

  private fixtureId: string;
  private oldData: Fixture;
  private newData: Partial<Fixture>;

  constructor(fixtureId: string, oldData: Fixture, newData: Partial<Fixture>) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.fixtureId = fixtureId;
    this.oldData = oldData;
    this.newData = newData;
    this.description = `Update fixture: ${oldData.position || fixtureId}`;
  }

  async execute(): Promise<void> {
    // Call the IPC to update the fixture
    const updatedFixture = await window.api.fixtures.update(this.fixtureId, this.newData);

    // Update store directly
    const { useFixtureStore } = await import('../store/fixtureStore');
    useFixtureStore.setState((state) => ({
      fixtures: state.fixtures.map((f) => (f.id === this.fixtureId ? updatedFixture : f)),
    }));

    // Track fixture edit
    const changedFields = Object.keys(this.newData);
    trackFixtureOperation.edit(this.fixtureId, changedFields, {
      position: updatedFixture.position,
    });

    // Mark file as dirty
    useFileStore.getState().setDirty(true);
  }

  async undo(): Promise<void> {
    // Restore the old data
    const updatedFixture = await window.api.fixtures.update(this.fixtureId, this.oldData);

    // Update store directly
    const { useFixtureStore } = await import('../store/fixtureStore');
    useFixtureStore.setState((state) => ({
      fixtures: state.fixtures.map((f) => (f.id === this.fixtureId ? updatedFixture : f)),
    }));

    // Mark file as dirty
    useFileStore.getState().setDirty(true);
  }
}

/**
 * Command to delete a fixture
 */
export class DeleteFixtureCommand implements Command {
  id: string;
  timestamp: number;
  type: string = CommandType.FIXTURE_DELETE;
  description: string;

  private deletedFixture: Fixture;
  private isDeleted: boolean = false;

  constructor(fixture: Fixture) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.deletedFixture = fixture;
    this.description = `Delete fixture: ${fixture.position || fixture.id}`;
  }

  async execute(): Promise<void> {
    // Only delete if not already deleted (to handle redo correctly)
    if (!this.isDeleted) {
      await window.api.fixtures.delete(this.deletedFixture.id);

      const { useFixtureStore } = await import('../store/fixtureStore');
      const fixtureId = this.deletedFixture.id;
      useFixtureStore.setState((state) => ({
        fixtures: state.fixtures.filter((f) => f.id !== fixtureId),
      }));

      // Track fixture deletion
      trackFixtureOperation.delete(1, {
        position: this.deletedFixture.position,
        type: this.deletedFixture.type,
      });

      this.isDeleted = true;
      useFileStore.getState().setDirty(true);
    }
  }

  async undo(): Promise<void> {
    if (!this.isDeleted) {
      throw new Error('Cannot undo: fixture was not deleted');
    }

    // Re-create the fixture
    const { id, created_at, updated_at, ...fixtureData } = this.deletedFixture;
    const restoredFixture = await window.api.fixtures.create(fixtureData);

    const { useFixtureStore } = await import('../store/fixtureStore');
    useFixtureStore.setState((state) => ({
      fixtures: [...state.fixtures, restoredFixture],
    }));

    // Update our stored reference with the new ID
    this.deletedFixture = restoredFixture;
    this.isDeleted = false;

    useFileStore.getState().setDirty(true);
  }
}

/**
 * Command to bulk update multiple fixtures
 */
export class BulkUpdateFixturesCommand implements Command {
  id: string;
  timestamp: number;
  type: string = CommandType.FIXTURE_BULK_UPDATE;
  description: string;

  private fixtureUpdates: Array<{ id: string; oldData: Fixture; newData: Partial<Fixture> }>;

  constructor(fixtureUpdates: Array<{ id: string; oldData: Fixture; newData: Partial<Fixture> }>) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.fixtureUpdates = fixtureUpdates;
    this.description = `Bulk update ${fixtureUpdates.length} fixture${fixtureUpdates.length === 1 ? '' : 's'}`;
  }

  async execute(): Promise<void> {
    const { useFixtureStore } = await import('../store/fixtureStore');

    // Update all fixtures
    const updatedFixtures = await Promise.all(
      this.fixtureUpdates.map(({ id, newData }) => window.api.fixtures.update(id, newData)),
    );

    // Update store directly
    useFixtureStore.setState((state) => {
      const updatedMap = new Map(updatedFixtures.map((f) => [f.id, f]));
      return {
        fixtures: state.fixtures.map((f) => updatedMap.get(f.id) || f),
      };
    });

    // Track bulk update
    const allChangedFields = [
      ...new Set(this.fixtureUpdates.flatMap((u) => Object.keys(u.newData))),
    ];
    trackFixtureOperation.bulkEdit(this.fixtureUpdates.length, allChangedFields);

    // Mark file as dirty
    useFileStore.getState().setDirty(true);
  }

  async undo(): Promise<void> {
    const { useFixtureStore } = await import('../store/fixtureStore');

    // Restore old data for all fixtures
    const restoredFixtures = await Promise.all(
      this.fixtureUpdates.map(({ id, oldData }) => window.api.fixtures.update(id, oldData)),
    );

    // Update store directly
    useFixtureStore.setState((state) => {
      const restoredMap = new Map(restoredFixtures.map((f) => [f.id, f]));
      return {
        fixtures: state.fixtures.map((f) => restoredMap.get(f.id) || f),
      };
    });

    // Mark file as dirty
    useFileStore.getState().setDirty(true);
  }
}

/**
 * Command to bulk delete multiple fixtures
 */
export class BulkDeleteFixturesCommand implements Command {
  id: string;
  timestamp: number;
  type: string = CommandType.FIXTURE_BULK_DELETE;
  description: string;

  private deletedFixtures: Fixture[];
  private isDeleted: boolean = false;

  constructor(fixtures: Fixture[]) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.deletedFixtures = fixtures;
    this.description = `Delete ${fixtures.length} fixture${fixtures.length === 1 ? '' : 's'}`;
  }

  async execute(): Promise<void> {
    // Only delete if not already deleted (to handle redo correctly)
    if (!this.isDeleted) {
      const ids = this.deletedFixtures.map((f) => f.id);
      await window.api.fixtures.deleteMultiple(ids);

      const { useFixtureStore } = await import('../store/fixtureStore');
      const deletedIds = new Set(ids);
      useFixtureStore.setState((state) => ({
        fixtures: state.fixtures.filter((f) => !deletedIds.has(f.id)),
      }));

      // Track bulk deletion
      trackFixtureOperation.delete(this.deletedFixtures.length);

      this.isDeleted = true;
      useFileStore.getState().setDirty(true);
    }
  }

  async undo(): Promise<void> {
    if (!this.isDeleted) {
      throw new Error('Cannot undo: fixtures were not deleted');
    }

    const { useFixtureStore } = await import('../store/fixtureStore');

    // Re-create all deleted fixtures
    const restoredFixtures = await Promise.all(
      this.deletedFixtures.map((fixture) => {
        const { id, created_at, updated_at, ...fixtureData } = fixture;
        return window.api.fixtures.create(fixtureData);
      }),
    );

    useFixtureStore.setState((state) => ({
      fixtures: [...state.fixtures, ...restoredFixtures],
    }));

    // Update our stored references with the new IDs
    this.deletedFixtures = restoredFixtures;
    this.isDeleted = false;

    useFileStore.getState().setDirty(true);
  }
}
