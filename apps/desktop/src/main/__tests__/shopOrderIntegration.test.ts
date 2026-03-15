/**
 * Integration Tests for Shop Order Workflows
 *
 * Tests real database operations end-to-end using better-sqlite3 in-memory databases.
 * Covers critical shop order workflows: project lifecycle, section management,
 * item CRUD with quantity calculations, revision tracking, notes, and cascade deletes.
 */

import Database from 'better-sqlite3';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let db: Database.Database;

vi.mock('../database/index', () => ({
  getDatabase: () => db,
  saveDatabase: vi.fn(),
  getAppDatabase: () => db,
}));

vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import {
  createShopOrderProject,
  getAllShopOrderProjects,
  getShopOrderProjectById,
  updateShopOrderProject,
  deleteShopOrderProject,
} from '../database/queries/shop-order';

import {
  createShopOrderSection,
  getSectionsByProjectId,
  updateShopOrderSection,
  deleteShopOrderSection,
} from '../database/queries/shop-order';

import {
  createShopOrderItem,
  getItemsBySectionId,
  getItemsByProjectId,
  updateShopOrderItem,
  deleteShopOrderItem,
} from '../database/queries/shop-order';

import {
  createShopOrderRevision,
  getRevisionsByProjectId,
  deleteShopOrderRevision,
} from '../database/queries/shop-order';

import {
  createShopOrderNote,
  getNotesByProjectId,
  updateShopOrderNote,
  deleteShopOrderNote,
} from '../database/queries/shop-order';

/**
 * Inline schema definition — consistent with the pattern in integration.test.ts.
 * The MigrationRunner pulls in seeding functions and filesystem dependencies that
 * make it impractical to use for in-memory test databases. Schema drift is the
 * known tradeoff; if shop_order_* columns change, update both the migration and
 * this definition.
 */
function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_order_projects (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      parent_project_id TEXT,
      production_name TEXT NOT NULL,
      venue TEXT,
      venue_city TEXT,
      venue_state TEXT,
      order_date INTEGER,
      original_order_date INTEGER,
      prep_start_date TEXT,
      prep_end_date TEXT,
      load_in_date TEXT,
      first_preview_date TEXT,
      opening_night_date TEXT,
      closing_date TEXT,
      load_out_date TEXT,
      gm_name TEXT,
      gm_company TEXT,
      gm_email TEXT,
      gm_phone TEXT,
      pm_name TEXT,
      pm_company TEXT,
      pm_email TEXT,
      pm_phone TEXT,
      ld_name TEXT,
      ld_email TEXT,
      ld_phone TEXT,
      ald_name TEXT,
      ald_email TEXT,
      ald_phone TEXT,
      pe_name TEXT,
      pe_email TEXT,
      pe_phone TEXT,
      additional_contacts TEXT,
      logo_path TEXT,
      logo_url TEXT,
      logo_storage_path TEXT,
      disciplines TEXT NOT NULL DEFAULT '["lighting"]',
      current_revision INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shop_order_sections (
      id TEXT PRIMARY KEY,
      prep_project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      discipline TEXT NOT NULL DEFAULT 'lighting',
      sort_order INTEGER NOT NULL DEFAULT 0,
      page_break INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (prep_project_id) REFERENCES shop_order_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shop_order_items (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL,
      description TEXT NOT NULL,
      active_qty INTEGER NOT NULL DEFAULT 0,
      spare_qty INTEGER NOT NULL DEFAULT 0,
      venue_qty INTEGER NOT NULL DEFAULT 0,
      total_qty INTEGER NOT NULL DEFAULT 0,
      venue_active INTEGER NOT NULL DEFAULT 0,
      venue_spare INTEGER NOT NULL DEFAULT 0,
      weight REAL,
      power REAL,
      notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      added_in_revision INTEGER,
      removed_in_revision INTEGER,
      modified_in_revision INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (section_id) REFERENCES shop_order_sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shop_order_revisions (
      id TEXT PRIMARY KEY,
      prep_project_id TEXT NOT NULL,
      revision_number INTEGER NOT NULL,
      revision_date INTEGER NOT NULL,
      notes TEXT,
      change_log TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (prep_project_id) REFERENCES shop_order_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shop_order_notes (
      id TEXT PRIMARY KEY,
      prep_project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      format TEXT NOT NULL DEFAULT 'plain',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (prep_project_id) REFERENCES shop_order_projects(id) ON DELETE CASCADE
    );
  `);
}

beforeEach(() => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  createTables();
});

afterEach(() => {
  db.close();
});

// ---------------------------------------------------------------------------
// 1. Shop Order Project Lifecycle
// ---------------------------------------------------------------------------
describe('Shop Order Project Lifecycle', () => {
  it('should create a project with default values', () => {
    const project = createShopOrderProject({ production_name: 'Hamlet' });

    expect(project.id).toBeDefined();
    expect(project.production_name).toBe('Hamlet');
    expect(project.current_revision).toBe(0);
    expect(project.disciplines).toBe('["lighting"]');
    expect(project.created_at).toBeGreaterThan(0);
  });

  it('should retrieve a project by id', () => {
    const created = createShopOrderProject({ production_name: 'Macbeth', venue: 'Main Stage' });
    const fetched = getShopOrderProjectById(created.id);

    expect(fetched).not.toBeNull();
    expect(fetched!.production_name).toBe('Macbeth');
    expect(fetched!.venue).toBe('Main Stage');
  });

  it('should return null for a non-existent project id', () => {
    const result = getShopOrderProjectById('does-not-exist');
    expect(result).toBeNull();
  });

  it('should list all projects ordered by updated_at descending', () => {
    const p1 = createShopOrderProject({ production_name: 'Show A' });
    const p2 = createShopOrderProject({ production_name: 'Show B' });
    const p3 = createShopOrderProject({ production_name: 'Show C' });

    // In-memory tests run fast enough that all three may share the same ms
    // timestamp. Set distinct values directly to make ordering deterministic.
    db.prepare('UPDATE shop_order_projects SET updated_at = ? WHERE id = ?').run(1000, p1.id);
    db.prepare('UPDATE shop_order_projects SET updated_at = ? WHERE id = ?').run(2000, p2.id);
    db.prepare('UPDATE shop_order_projects SET updated_at = ? WHERE id = ?').run(3000, p3.id);

    const projects = getAllShopOrderProjects();
    expect(projects).toHaveLength(3);
    expect(projects.map((p) => p.id)).toEqual([p3.id, p2.id, p1.id]);
  });

  it('should update allowed project fields', () => {
    const project = createShopOrderProject({ production_name: 'Othello' });
    const updated = updateShopOrderProject(project.id, {
      production_name: 'Othello (Revival)',
      venue: 'Black Box',
      venue_city: 'New York',
    });

    expect(updated.production_name).toBe('Othello (Revival)');
    expect(updated.venue).toBe('Black Box');
    expect(updated.venue_city).toBe('New York');
  });

  it('should persist contact information', () => {
    const project = createShopOrderProject({
      production_name: 'King Lear',
      ld_name: 'Jane Smith',
      ld_email: 'jane@example.com',
    });

    const fetched = getShopOrderProjectById(project.id)!;
    expect(fetched.ld_name).toBe('Jane Smith');
    expect(fetched.ld_email).toBe('jane@example.com');
  });

  it('should delete a project', () => {
    const project = createShopOrderProject({ production_name: 'To Delete' });
    deleteShopOrderProject(project.id);

    expect(getShopOrderProjectById(project.id)).toBeNull();
    expect(getAllShopOrderProjects()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Section Management
// ---------------------------------------------------------------------------
describe('Section Management', () => {
  let projectId: string;

  beforeEach(() => {
    projectId = createShopOrderProject({ production_name: 'Test Show' }).id;
  });

  it('should create a section linked to a project', () => {
    const section = createShopOrderSection({
      prep_project_id: projectId,
      name: 'Moving Lights',
      discipline: 'lighting',
      sort_order: 0,
    });

    expect(section.id).toBeDefined();
    expect(section.prep_project_id).toBe(projectId);
    expect(section.name).toBe('Moving Lights');
    expect(section.page_break).toBe(0);
  });

  it('should retrieve sections ordered by sort_order', () => {
    createShopOrderSection({ prep_project_id: projectId, name: 'C', sort_order: 2 });
    createShopOrderSection({ prep_project_id: projectId, name: 'A', sort_order: 0 });
    createShopOrderSection({ prep_project_id: projectId, name: 'B', sort_order: 1 });

    const sections = getSectionsByProjectId(projectId);
    expect(sections.map((s) => s.name)).toEqual(['A', 'B', 'C']);
  });

  it('should return empty array for a project with no sections', () => {
    expect(getSectionsByProjectId(projectId)).toHaveLength(0);
  });

  it('should update section name and sort_order', () => {
    const section = createShopOrderSection({
      prep_project_id: projectId,
      name: 'Old Name',
      sort_order: 0,
    });
    const updated = updateShopOrderSection(section.id, { name: 'New Name', sort_order: 5 });

    expect(updated.name).toBe('New Name');
    expect(updated.sort_order).toBe(5);
  });

  it('should toggle page_break correctly', () => {
    const section = createShopOrderSection({
      prep_project_id: projectId,
      name: 'Section',
      page_break: 0,
    });
    expect(section.page_break).toBe(0);

    const updated = updateShopOrderSection(section.id, { page_break: 1 });
    expect(updated.page_break).toBe(1);
  });

  it('should delete a section', () => {
    const section = createShopOrderSection({ prep_project_id: projectId, name: 'To Remove' });
    deleteShopOrderSection(section.id);

    expect(getSectionsByProjectId(projectId)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Item CRUD and Quantity Calculation
// ---------------------------------------------------------------------------
describe('Item CRUD and Quantity Calculations', () => {
  let projectId: string;
  let sectionId: string;

  beforeEach(() => {
    projectId = createShopOrderProject({ production_name: 'Quantity Test' }).id;
    sectionId = createShopOrderSection({ prep_project_id: projectId, name: 'Fixtures' }).id;
  });

  it('should create an item with calculated total_qty', () => {
    const item = createShopOrderItem({
      section_id: sectionId,
      description: 'ETC Source Four 26°',
      active_qty: 10,
      spare_qty: 2,
    });

    expect(item.active_qty).toBe(10);
    expect(item.spare_qty).toBe(2);
    expect(item.total_qty).toBe(12);
  });

  it('should calculate venue_active and venue_spare when venue_qty < total needed', () => {
    const item = createShopOrderItem({
      section_id: sectionId,
      description: 'LED Par',
      active_qty: 8,
      spare_qty: 2,
      venue_qty: 5,
    });

    // venue_qty (5) < total (10): venue_active = min(5, 8) = 5, venue_spare = 0
    expect(item.venue_active).toBe(5);
    expect(item.venue_spare).toBe(0);
  });

  it('should calculate venue_active and venue_spare when venue_qty >= total needed', () => {
    const item = createShopOrderItem({
      section_id: sectionId,
      description: 'LED Par',
      active_qty: 4,
      spare_qty: 1,
      venue_qty: 10,
    });

    // venue_qty (10) >= total (5): venue covers all active and spare
    expect(item.venue_active).toBe(4);
    expect(item.venue_spare).toBe(1);
  });

  it('should update item quantities and recalculate totals', () => {
    const item = createShopOrderItem({
      section_id: sectionId,
      description: 'Fresnel',
      active_qty: 5,
      spare_qty: 1,
    });

    const updated = updateShopOrderItem(item.id, { active_qty: 8, spare_qty: 2 });
    expect(updated.active_qty).toBe(8);
    expect(updated.spare_qty).toBe(2);
    expect(updated.total_qty).toBe(10);
  });

  it('should retrieve items by section in sort_order', () => {
    createShopOrderItem({ section_id: sectionId, description: 'Z Item', sort_order: 2 });
    createShopOrderItem({ section_id: sectionId, description: 'A Item', sort_order: 0 });
    createShopOrderItem({ section_id: sectionId, description: 'M Item', sort_order: 1 });

    const items = getItemsBySectionId(sectionId);
    expect(items.map((i) => i.description)).toEqual(['A Item', 'M Item', 'Z Item']);
  });

  it('should retrieve all items across sections for a project', () => {
    const section2Id = createShopOrderSection({
      prep_project_id: projectId,
      name: 'Cable',
      sort_order: 1,
    }).id;

    createShopOrderItem({ section_id: sectionId, description: 'Fixture Item', sort_order: 0 });
    createShopOrderItem({ section_id: section2Id, description: 'Cable Item', sort_order: 0 });

    const allItems = getItemsByProjectId(projectId);
    expect(allItems).toHaveLength(2);
    expect(allItems.map((i) => i.description)).toContain('Fixture Item');
    expect(allItems.map((i) => i.description)).toContain('Cable Item');
  });

  it('should delete an item', () => {
    const item = createShopOrderItem({ section_id: sectionId, description: 'To Delete' });
    deleteShopOrderItem(item.id);

    expect(getItemsBySectionId(sectionId)).toHaveLength(0);
  });

  it('should track revision metadata on items', () => {
    const item = createShopOrderItem({
      section_id: sectionId,
      description: 'New in Rev 1',
      added_in_revision: 1,
    });

    expect(item.added_in_revision).toBe(1);

    const modified = updateShopOrderItem(item.id, {
      active_qty: 6,
      modified_in_revision: 2,
    });
    expect(modified.modified_in_revision).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 4. Revision Tracking
// ---------------------------------------------------------------------------
describe('Revision Tracking', () => {
  let projectId: string;

  beforeEach(() => {
    projectId = createShopOrderProject({ production_name: 'Revision Test' }).id;
  });

  it('should create a revision and link it to the project', () => {
    const revision = createShopOrderRevision({
      prep_project_id: projectId,
      revision_number: 1,
      change_log: JSON.stringify([{ item: 'ETC Source Four', delta: +4 }]),
    });

    expect(revision.id).toBeDefined();
    expect(revision.prep_project_id).toBe(projectId);
    expect(revision.revision_number).toBe(1);
    expect(JSON.parse(revision.change_log)).toHaveLength(1);
  });

  it('should retrieve revisions ordered by revision_number', () => {
    createShopOrderRevision({ prep_project_id: projectId, revision_number: 3 });
    createShopOrderRevision({ prep_project_id: projectId, revision_number: 1 });
    createShopOrderRevision({ prep_project_id: projectId, revision_number: 2 });

    const revisions = getRevisionsByProjectId(projectId);
    expect(revisions.map((r) => r.revision_number)).toEqual([1, 2, 3]);
  });

  it('should store and retrieve revision notes', () => {
    const revision = createShopOrderRevision({
      prep_project_id: projectId,
      revision_number: 1,
      notes: 'Added moving lights per LD request',
    });

    const revisions = getRevisionsByProjectId(projectId);
    expect(revisions[0].notes).toBe('Added moving lights per LD request');
    expect(revisions[0].id).toBe(revision.id);
  });

  it('should delete a revision', () => {
    const rev = createShopOrderRevision({ prep_project_id: projectId, revision_number: 1 });
    deleteShopOrderRevision(rev.id);

    expect(getRevisionsByProjectId(projectId)).toHaveLength(0);
  });

  it('should default change_log to empty JSON array', () => {
    const revision = createShopOrderRevision({
      prep_project_id: projectId,
      revision_number: 1,
    });

    expect(revision.change_log).toBe('[]');
    expect(JSON.parse(revision.change_log)).toEqual([]);
  });

  it('should support up to 5 revisions per project', () => {
    for (let i = 1; i <= 5; i++) {
      createShopOrderRevision({ prep_project_id: projectId, revision_number: i });
    }

    const revisions = getRevisionsByProjectId(projectId);
    expect(revisions).toHaveLength(5);
    expect(revisions[4].revision_number).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// 5. Notes System
// ---------------------------------------------------------------------------
describe('Notes System', () => {
  let projectId: string;

  beforeEach(() => {
    projectId = createShopOrderProject({ production_name: 'Notes Test' }).id;
  });

  it('should create a note of each type', () => {
    createShopOrderNote({
      prep_project_id: projectId,
      type: 'general_conditions',
      content: 'Net 30 payment terms',
    });
    createShopOrderNote({
      prep_project_id: projectId,
      type: 'general_notes',
      content: 'Advance two weeks prior',
    });
    createShopOrderNote({
      prep_project_id: projectId,
      type: 'fixture_notes',
      content: 'All LED fixtures require powerCON',
    });

    const all = getNotesByProjectId(projectId);
    expect(all).toHaveLength(3);
  });

  it('should filter notes by type', () => {
    createShopOrderNote({ prep_project_id: projectId, type: 'general_conditions', content: 'A' });
    createShopOrderNote({ prep_project_id: projectId, type: 'fixture_notes', content: 'B' });

    const conditions = getNotesByProjectId(projectId, 'general_conditions');
    expect(conditions).toHaveLength(1);
    expect(conditions[0].content).toBe('A');
  });

  it('should update note content and format', () => {
    const note = createShopOrderNote({
      prep_project_id: projectId,
      type: 'general_notes',
      content: 'Original content',
      format: 'plain',
    });

    const updated = updateShopOrderNote(note.id, {
      content: 'Updated content',
      format: 'markdown',
    });

    expect(updated.content).toBe('Updated content');
    expect(updated.format).toBe('markdown');
  });

  it('should delete a note', () => {
    const note = createShopOrderNote({
      prep_project_id: projectId,
      type: 'general_notes',
      content: 'To remove',
    });
    deleteShopOrderNote(note.id);

    expect(getNotesByProjectId(projectId)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Full Project Workflow (create → sections → items → revision)
// ---------------------------------------------------------------------------
describe('Full Shop Order Workflow', () => {
  it('should support a complete shop order lifecycle', () => {
    // Create project
    const project = createShopOrderProject({
      production_name: 'Spring Musical',
      venue: 'Main Stage',
      disciplines: JSON.stringify(['lighting', 'audio']),
    });
    expect(project.id).toBeDefined();

    // Add sections
    const lightingSection = createShopOrderSection({
      prep_project_id: project.id,
      name: 'Lighting Fixtures',
      discipline: 'lighting',
      sort_order: 0,
    });
    const cableSection = createShopOrderSection({
      prep_project_id: project.id,
      name: 'Cable & Accessories',
      discipline: 'lighting',
      sort_order: 1,
    });

    // Add items to sections
    const fixture1 = createShopOrderItem({
      section_id: lightingSection.id,
      description: 'ETC Source Four 26°',
      active_qty: 24,
      spare_qty: 4,
      sort_order: 0,
      added_in_revision: 0,
    });
    createShopOrderItem({
      section_id: lightingSection.id,
      description: 'Martin MAC Encore Performance WRM',
      active_qty: 12,
      spare_qty: 2,
      sort_order: 1,
      added_in_revision: 0,
    });
    createShopOrderItem({
      section_id: cableSection.id,
      description: "Edison 25' (Black)",
      active_qty: 50,
      spare_qty: 10,
      sort_order: 0,
      added_in_revision: 0,
    });

    // Verify items
    const lightingItems = getItemsBySectionId(lightingSection.id);
    expect(lightingItems).toHaveLength(2);
    expect(lightingItems[0].total_qty).toBe(28); // 24 + 4

    const allItems = getItemsByProjectId(project.id);
    expect(allItems).toHaveLength(3);

    // Create revision 0 (initial)
    createShopOrderRevision({
      prep_project_id: project.id,
      revision_number: 0,
      notes: 'Initial order',
      change_log: JSON.stringify([]),
    });

    // Simulate Rev 1: update quantity of fixture1
    updateShopOrderItem(fixture1.id, { active_qty: 28, modified_in_revision: 1 });
    updateShopOrderProject(project.id, { current_revision: 1 });

    createShopOrderRevision({
      prep_project_id: project.id,
      revision_number: 1,
      notes: 'Increased Source Four count per LD',
      change_log: JSON.stringify([{ description: 'ETC Source Four 26°', change: 'qty 24→28' }]),
    });

    // Verify revision history
    const revisions = getRevisionsByProjectId(project.id);
    expect(revisions).toHaveLength(2);
    expect(revisions[1].revision_number).toBe(1);
    expect(JSON.parse(revisions[1].change_log)).toHaveLength(1);

    // Verify updated item
    const updatedItem = getItemsBySectionId(lightingSection.id)[0];
    expect(updatedItem.active_qty).toBe(28);
    expect(updatedItem.total_qty).toBe(32); // 28 + 4
    expect(updatedItem.modified_in_revision).toBe(1);

    // Add general conditions note
    createShopOrderNote({
      prep_project_id: project.id,
      type: 'general_conditions',
      content: 'All equipment must be tested and tagged before delivery.',
    });

    const notes = getNotesByProjectId(project.id);
    expect(notes).toHaveLength(1);

    // Verify final project state
    const finalProject = getShopOrderProjectById(project.id)!;
    expect(finalProject.current_revision).toBe(1);
    expect(finalProject.production_name).toBe('Spring Musical');
  });
});

// ---------------------------------------------------------------------------
// 7. Cascade Delete Behavior
// ---------------------------------------------------------------------------
describe('Cascade Delete Behavior', () => {
  it('should remove sections and their items when project is deleted', () => {
    const project = createShopOrderProject({ production_name: 'Cascade Test' });
    const s1 = createShopOrderSection({ prep_project_id: project.id, name: 'Section 1' });
    const s2 = createShopOrderSection({ prep_project_id: project.id, name: 'Section 2' });
    createShopOrderItem({ section_id: s1.id, description: 'Item A' });
    createShopOrderItem({ section_id: s2.id, description: 'Item B' });

    deleteShopOrderProject(project.id);

    // Project row gone
    expect(getShopOrderProjectById(project.id)).toBeNull();
    // Sections cascade-deleted — query directly by prep_project_id
    const orphanedSections = db
      .prepare('SELECT id FROM shop_order_sections WHERE prep_project_id = ?')
      .all(project.id);
    expect(orphanedSections).toHaveLength(0);
    // Items cascade-deleted through sections — query directly by section_id
    const orphanedItems = db
      .prepare('SELECT id FROM shop_order_items WHERE section_id IN (?, ?)')
      .all(s1.id, s2.id);
    expect(orphanedItems).toHaveLength(0);
  });

  it('should remove items when their section is deleted', () => {
    const project = createShopOrderProject({ production_name: 'Item Cascade' });
    const section = createShopOrderSection({ prep_project_id: project.id, name: 'Fixtures' });

    createShopOrderItem({ section_id: section.id, description: 'Item A' });
    createShopOrderItem({ section_id: section.id, description: 'Item B' });
    expect(getItemsBySectionId(section.id)).toHaveLength(2);

    deleteShopOrderSection(section.id);

    // Query items directly by section_id — must be gone, not just invisible via JOIN
    const orphanedItems = db
      .prepare('SELECT id FROM shop_order_items WHERE section_id = ?')
      .all(section.id);
    expect(orphanedItems).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Multi-discipline Support
// ---------------------------------------------------------------------------
describe('Multi-discipline Support', () => {
  it('should create sections with different disciplines', () => {
    const project = createShopOrderProject({
      production_name: 'Multi-Disc Show',
      disciplines: JSON.stringify(['lighting', 'audio', 'video']),
    });

    createShopOrderSection({
      prep_project_id: project.id,
      name: 'Lighting',
      discipline: 'lighting',
      sort_order: 0,
    });
    createShopOrderSection({
      prep_project_id: project.id,
      name: 'Audio',
      discipline: 'audio',
      sort_order: 1,
    });
    createShopOrderSection({
      prep_project_id: project.id,
      name: 'Video',
      discipline: 'video',
      sort_order: 2,
    });

    const sections = getSectionsByProjectId(project.id);
    expect(sections).toHaveLength(3);
    expect(sections.map((s) => s.discipline)).toEqual(['lighting', 'audio', 'video']);
  });
});
