/**
 * Integration Tests for ShowStack
 *
 * Tests real database operations end-to-end using better-sqlite3 in-memory databases.
 * Each test gets a fresh database with the required schema, ensuring isolation.
 */

import Database from 'better-sqlite3';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let db: Database.Database;

// Mock the database module to use in-memory SQLite
vi.mock('../database/index', () => ({
  getDatabase: () => db,
  saveDatabase: vi.fn(),
  getAppDatabase: () => db,
}));

// Mock the logger to prevent console noise
vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import {
  createFixture,
  getAllFixtures,
  updateFixture,
  deleteFixture,
  deleteMultipleFixtures,
} from '../database/queries/fixtures';

import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../database/queries/projects';

import {
  createInfrastructure,
  getAllInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
} from '../database/queries/infrastructure';

/**
 * Creates all required tables in the in-memory database.
 * Schema matches the production database columns used by query functions.
 */
function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fixtures (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      position TEXT,
      unit_number INTEGER,
      type TEXT,
      manufacturer TEXT,
      model TEXT,
      purpose TEXT,
      mark TEXT,
      channel TEXT,
      universe INTEGER,
      dmx_address INTEGER,
      dmx_footprint INTEGER NOT NULL DEFAULT 1,
      mode TEXT,
      dimmer TEXT,
      circuit TEXT,
      circuit_number TEXT,
      phase TEXT,
      wattage REAL,
      amperage REAL,
      color TEXT,
      gobo TEXT,
      accessories TEXT,
      location TEXT,
      system TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      custom_fields TEXT,
      dimmer_rack_id TEXT,
      dimmer_channel_number INTEGER,
      pd_rack_id TEXT,
      pd_circuit_number INTEGER,
      hidden INTEGER,
      color_flag TEXT,
      on_light_plot INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      logo_path TEXT,
      enabled_modules TEXT,
      lighting_designer TEXT,
      lighting_designer_email TEXT,
      venue TEXT,
      venue_city TEXT,
      venue_state TEXT,
      show_dates TEXT,
      root_project_id TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS infrastructure_equipment (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      category TEXT,
      manufacturer TEXT,
      model TEXT,
      quantity INTEGER DEFAULT 1,
      port_count INTEGER DEFAULT 0,
      voltage REAL,
      amperage REAL,
      wattage REAL,
      phase TEXT,
      dimmer_rack_id TEXT,
      dimmer_channel_number INTEGER,
      pd_rack_id TEXT,
      pd_circuit_number INTEGER,
      pd_breaker_number INTEGER,
      circuit TEXT,
      circuit_number INTEGER,
      location TEXT,
      position_x REAL,
      position_y REAL,
      position_z REAL,
      ip_address TEXT,
      mac_address TEXT,
      subnet_mask TEXT,
      gateway TEXT,
      vlan_id INTEGER,
      hostname TEXT,
      port_assignments TEXT,
      notes TEXT,
      status TEXT DEFAULT 'Active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}

beforeEach(() => {
  db = new Database(':memory:');
  createTables();
});

afterEach(() => {
  db.close();
});

// ---------------------------------------------------------------------------
// 1. Fixture CRUD Lifecycle
// ---------------------------------------------------------------------------
describe('Fixture CRUD Lifecycle', () => {
  it('should create a fixture and verify it exists in the database', () => {
    const fixture = createFixture(
      {
        position: 'FOH 1',
        unit_number: 1,
        type: 'ETC Source Four',
        channel: '101',
        color: 'R02',
        purpose: 'Front Wash',
      },
      'project-1',
    );

    expect(fixture).toBeDefined();
    expect(fixture.id).toBeDefined();
    expect(typeof fixture.id).toBe('string');
    expect(fixture.id.length).toBeGreaterThan(0);
    expect(fixture.position).toBe('FOH 1');
    expect(fixture.unit_number).toBe(1);
    expect(fixture.type).toBe('ETC Source Four');
    expect(fixture.channel).toBe('101');
    expect(fixture.color).toBe('R02');
    expect(fixture.purpose).toBe('Front Wash');
  });

  it('should read all fixtures for a project', () => {
    createFixture({ position: '1', type: 'Source Four', channel: '1' }, 'project-1');
    createFixture({ position: '2', type: 'Source Four', channel: '2' }, 'project-1');
    createFixture({ position: '3', type: 'Par 64', channel: '3' }, 'project-1');

    const fixtures = getAllFixtures('project-1');

    expect(fixtures).toHaveLength(3);
    expect(fixtures.map((f) => f.channel)).toEqual(expect.arrayContaining(['1', '2', '3']));
  });

  it('should update a fixture and verify changes persisted', () => {
    const created = createFixture(
      { position: 'BOX BOOM L', type: 'PAR 64', color: 'R60' },
      'project-1',
    );

    const updated = updateFixture(created.id, {
      color: 'L201',
      type: 'Source Four 36deg',
      purpose: 'Sidelight',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.color).toBe('L201');
    expect(updated.type).toBe('Source Four 36deg');
    expect(updated.purpose).toBe('Sidelight');
    // Position should remain unchanged
    expect(updated.position).toBe('BOX BOOM L');
  });

  it('should delete a fixture and verify it is gone', () => {
    const created = createFixture(
      { position: 'TRUSS 1', type: 'VL3500', channel: '200' },
      'project-1',
    );

    deleteFixture(created.id);

    const remaining = getAllFixtures('project-1');
    expect(remaining).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Project CRUD Lifecycle
// ---------------------------------------------------------------------------
describe('Project CRUD Lifecycle', () => {
  it('should create a project and verify it exists in the database', () => {
    const project = createProject('Hamlet', 'A Shakespeare tragedy');

    expect(project).toBeDefined();
    expect(project.id).toBeDefined();
    expect(typeof project.id).toBe('string');
    expect(project.name).toBe('Hamlet');
    expect(project.description).toBe('A Shakespeare tragedy');
  });

  it('should read a project by ID', () => {
    const created = createProject('The Tempest', 'A late romance');

    const fetched = getProjectById(created.id);

    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(created.id);
    expect(fetched!.name).toBe('The Tempest');
    expect(fetched!.description).toBe('A late romance');
  });

  it('should update a project name and verify changes', () => {
    const created = createProject('Draft Show', 'Working title');

    const updated = updateProject(created.id, { name: 'Final Show Name' });

    expect(updated.name).toBe('Final Show Name');
    expect(updated.id).toBe(created.id);
    // Description should remain unchanged
    expect(updated.description).toBe('Working title');
  });

  it('should delete a project and verify removal', () => {
    const created = createProject('Temp Project');

    deleteProject(created.id);

    const fetched = getProjectById(created.id);
    expect(fetched).toBeNull();
  });

  it('should return null for a non-existent project ID', () => {
    const result = getProjectById('non-existent-id');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Infrastructure CRUD Lifecycle
// ---------------------------------------------------------------------------
describe('Infrastructure CRUD Lifecycle', () => {
  it('should create equipment and verify it exists in the database', () => {
    const equipment = createInfrastructure(
      {
        name: 'ETC Net3 Gateway',
        manufacturer: 'ETC',
        model: 'Net3 4-Port Gateway',
        category: 'network',
        ip_address: '10.101.1.10',
        port_count: 4,
      },
      'project-1',
    );

    expect(equipment).toBeDefined();
    expect(equipment.id).toBeDefined();
    expect(equipment.name).toBe('ETC Net3 Gateway');
    expect(equipment.manufacturer).toBe('ETC');
    expect(equipment.model).toBe('Net3 4-Port Gateway');
    expect(equipment.category).toBe('network');
    expect(equipment.ip_address).toBe('10.101.1.10');
    expect(equipment.port_count).toBe(4);
    expect(equipment.status).toBe('Active');
  });

  it('should update equipment and verify changes', () => {
    const created = createInfrastructure(
      { name: 'Luminex Switch', category: 'network', ip_address: '10.0.0.1' },
      'project-1',
    );

    const updated = updateInfrastructure(created.id, {
      ip_address: '10.101.1.50',
      location: 'Stage Left Rack',
      notes: 'Primary network switch',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.ip_address).toBe('10.101.1.50');
    expect(updated.location).toBe('Stage Left Rack');
    expect(updated.notes).toBe('Primary network switch');
    // Name should remain unchanged
    expect(updated.name).toBe('Luminex Switch');
  });

  it('should delete equipment and verify removal', () => {
    const created = createInfrastructure(
      { name: 'Old DMX Splitter', category: 'data_distribution' },
      'project-1',
    );

    deleteInfrastructure(created.id);

    const remaining = getAllInfrastructure('project-1');
    expect(remaining).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Cross-Entity Workflows
// ---------------------------------------------------------------------------
describe('Cross-Entity Workflows', () => {
  it('should create a project, add fixtures, and filter fixtures by project_id', () => {
    const project1 = createProject('Show A');
    const project2 = createProject('Show B');

    createFixture({ position: '1', type: 'Source Four', channel: '1' }, project1.id);
    createFixture({ position: '2', type: 'Source Four', channel: '2' }, project1.id);
    createFixture({ position: '1', type: 'VL3500', channel: '10' }, project2.id);

    const fixturesA = getAllFixtures(project1.id);
    const fixturesB = getAllFixtures(project2.id);

    expect(fixturesA).toHaveLength(2);
    expect(fixturesB).toHaveLength(1);
    expect(fixturesA.every((f) => f.project_id === project1.id)).toBe(true);
    expect(fixturesB[0].project_id).toBe(project2.id);
    expect(fixturesB[0].type).toBe('VL3500');
  });

  it('should create a project, add infrastructure, and filter by project_id', () => {
    const project1 = createProject('Tour A');
    const project2 = createProject('Tour B');

    createInfrastructure({ name: 'Switch A1', category: 'network' }, project1.id);
    createInfrastructure({ name: 'Switch A2', category: 'network' }, project1.id);
    createInfrastructure({ name: 'Switch B1', category: 'network' }, project2.id);

    const infraA = getAllInfrastructure(project1.id);
    const infraB = getAllInfrastructure(project2.id);

    expect(infraA).toHaveLength(2);
    expect(infraB).toHaveLength(1);
    expect(infraA.every((e) => e.project_id === project1.id)).toBe(true);
    expect(infraB[0].project_id).toBe(project2.id);
  });

  it('should delete multiple fixtures at once (bulk delete)', () => {
    const f1 = createFixture({ position: '1', type: 'Par', channel: '1' }, 'project-1');
    const f2 = createFixture({ position: '2', type: 'Par', channel: '2' }, 'project-1');
    const f3 = createFixture({ position: '3', type: 'Par', channel: '3' }, 'project-1');
    const f4 = createFixture({ position: '4', type: 'Par', channel: '4' }, 'project-1');

    // Delete first two, keep last two
    deleteMultipleFixtures([f1.id, f2.id]);

    const remaining = getAllFixtures('project-1');
    expect(remaining).toHaveLength(2);

    const remainingIds = remaining.map((f) => f.id);
    expect(remainingIds).toContain(f3.id);
    expect(remainingIds).toContain(f4.id);
    expect(remainingIds).not.toContain(f1.id);
    expect(remainingIds).not.toContain(f2.id);
  });

  it('should create a fixture, update multiple fields, and verify all changes persisted', () => {
    const created = createFixture(
      {
        position: 'PIPE 1',
        unit_number: 5,
        type: 'Source Four',
        channel: '50',
        color: 'N/C',
        purpose: 'TBD',
        wattage: 575,
      },
      'project-1',
    );

    const updated = updateFixture(created.id, {
      unit_number: 10,
      channel: '75',
      color: 'R119',
      purpose: 'Center Backlight',
      wattage: 750,
      dimmer: 'D42',
      circuit: 'C12',
      notes: 'Refocused for Act 2',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.unit_number).toBe(10);
    expect(updated.channel).toBe('75');
    expect(updated.color).toBe('R119');
    expect(updated.purpose).toBe('Center Backlight');
    expect(updated.wattage).toBe(750);
    expect(updated.dimmer).toBe('D42');
    expect(updated.circuit).toBe('C12');
    expect(updated.notes).toBe('Refocused for Act 2');
    // Unchanged fields should be preserved
    expect(updated.position).toBe('PIPE 1');
    expect(updated.type).toBe('Source Four');
  });

  it('should list all projects and verify they are returned', () => {
    createProject('First Show');
    createProject('Second Show');
    createProject('Third Show');

    const all = getAllProjects();
    expect(all).toHaveLength(3);

    const names = all.map((p) => p.name);
    expect(names).toContain('First Show');
    expect(names).toContain('Second Show');
    expect(names).toContain('Third Show');
  });

  it('should return the most recently updated project first after an update', () => {
    const p1 = createProject('First Show');
    const p2 = createProject('Second Show');

    // Force a time gap, then update p1 so it has a newer updated_at
    const waitUntil = Date.now() + 5;
    while (Date.now() < waitUntil) {
      // busy-wait
    }

    updateProject(p1.id, { name: 'First Show (Updated)' });

    const all = getAllProjects();
    // p1 was updated more recently, so it should come first
    expect(all[0].name).toBe('First Show (Updated)');
  });
});

// ---------------------------------------------------------------------------
// 5. Data Integrity
// ---------------------------------------------------------------------------
describe('Data Integrity', () => {
  it('should set created_at and updated_at timestamps on fixture creation', () => {
    const before = Date.now();
    const fixture = createFixture({ position: 'BOOM SR', type: 'PAR 64' }, 'project-1');
    const after = Date.now();

    expect(fixture.created_at).toBeDefined();
    expect(fixture.updated_at).toBeDefined();
    expect(typeof fixture.created_at).toBe('number');
    expect(typeof fixture.updated_at).toBe('number');
    // Timestamps should be within the test execution window
    expect(fixture.created_at).toBeGreaterThanOrEqual(before);
    expect(fixture.created_at).toBeLessThanOrEqual(after);
    expect(fixture.updated_at).toBe(fixture.created_at);
  });

  it('should update updated_at on fixture update but preserve created_at', () => {
    const fixture = createFixture({ position: 'CATWALK', type: 'Fresnel' }, 'project-1');
    const originalCreatedAt = fixture.created_at;
    const originalUpdatedAt = fixture.updated_at;

    // Ensure a time gap so timestamps differ
    const waitUntil = Date.now() + 5;
    while (Date.now() < waitUntil) {
      // busy-wait for a few milliseconds
    }

    const updated = updateFixture(fixture.id, { color: 'L202' });

    expect(updated.created_at).toBe(originalCreatedAt);
    expect(updated.updated_at).toBeGreaterThan(originalUpdatedAt!);
  });

  it('should set created_at and updated_at timestamps on project creation', () => {
    const before = Date.now();
    const project = createProject('Timestamp Test Show');
    const after = Date.now();

    expect(project.created_at).toBeDefined();
    expect(project.updated_at).toBeDefined();
    expect(project.created_at).toBeGreaterThanOrEqual(before);
    expect(project.created_at).toBeLessThanOrEqual(after);
    expect(project.updated_at).toBe(project.created_at);
  });

  it('should update updated_at on project update but preserve created_at', () => {
    const project = createProject('Timestamp Project');
    const originalCreatedAt = project.created_at;
    const originalUpdatedAt = project.updated_at;

    const waitUntil = Date.now() + 5;
    while (Date.now() < waitUntil) {
      // busy-wait
    }

    const updated = updateProject(project.id, { name: 'Renamed Project' });

    expect(updated.created_at).toBe(originalCreatedAt);
    expect(updated.updated_at).toBeGreaterThan(originalUpdatedAt);
  });

  it('should set created_at and updated_at timestamps on infrastructure creation', () => {
    const before = Date.now();
    const equipment = createInfrastructure(
      { name: 'Test Switch', category: 'network' },
      'project-1',
    );
    const after = Date.now();

    expect(equipment.created_at).toBeDefined();
    expect(equipment.updated_at).toBeDefined();
    expect(equipment.created_at).toBeGreaterThanOrEqual(before);
    expect(equipment.created_at).toBeLessThanOrEqual(after);
    expect(equipment.updated_at).toBe(equipment.created_at);
  });

  it('should handle fixtures with JSON custom_fields correctly', () => {
    const customFields = { gel_frame_size: '7.5"', rental_company: 'PRG' };

    const created = createFixture(
      {
        position: 'TRUSS 2',
        type: 'VL3500',
        custom_fields: customFields,
      },
      'project-1',
    );

    expect(created.custom_fields).toEqual(customFields);

    // Verify through getAllFixtures as well
    const fixtures = getAllFixtures('project-1');
    expect(fixtures[0].custom_fields).toEqual(customFields);
  });

  it('should handle fixtures with accessories array correctly', () => {
    const accessories = ['top hat', 'barn doors', 'safety cable'];

    const created = createFixture(
      {
        position: 'PIPE 3',
        type: 'Source Four',
        accessories,
      },
      'project-1',
    );

    expect(created.accessories).toEqual(accessories);

    // Verify through getAllFixtures
    const fixtures = getAllFixtures('project-1');
    expect(fixtures[0].accessories).toEqual(accessories);
  });

  it('should handle infrastructure with port_assignments JSON correctly', () => {
    const portAssignments = [
      {
        port: 1,
        connected_to: 'Stage Left Dimmer Rack',
        type: 'dmx' as const,
        status: 'active' as const,
      },
      { port: 2, connected_to: 'SR Universe 2', type: 'dmx' as const, status: 'active' as const },
    ];

    const created = createInfrastructure(
      {
        name: 'DMX Splitter',
        category: 'data_distribution',
        port_count: 8,
        port_assignments: portAssignments,
      },
      'project-1',
    );

    expect(created.port_assignments).toHaveLength(2);
    expect(created.port_assignments![0].port).toBe(1);
    expect(created.port_assignments![0].connected_to).toBe('Stage Left Dimmer Rack');
    expect(created.port_assignments![1].type).toBe('dmx');
  });

  it('should compute fixture address from universe and dmx_address', () => {
    const fixture = createFixture(
      {
        position: 'FOH',
        type: 'Moving Light',
        universe: 3,
        dmx_address: 101,
      },
      'project-1',
    );

    expect(fixture.address).toBe('3/101');
  });
});
