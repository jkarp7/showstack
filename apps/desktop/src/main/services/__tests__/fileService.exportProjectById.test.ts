/**
 * Tests for FileService.exportProjectById
 *
 * Uses a real file-based better-sqlite3 database in a temp directory so the
 * physical file-copy logic (copyFileSync → strip rows → VACUUM → rename) is
 * exercised with actual SQLite rather than mocked away.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtempSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ── Mocks (hoisted before imports) ────────────────────────────────────────────

vi.mock('../../utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('electron', () => ({
  dialog: { showOpenDialog: vi.fn(), showSaveDialog: vi.fn() },
  app: { getPath: vi.fn(() => '/mock/path'), getName: vi.fn(), getVersion: vi.fn() },
  BrowserWindow: { getAllWindows: vi.fn(() => []) },
  shell: { openExternal: vi.fn() },
}));

// Module-level vars updated per-test so the vi.mock factory closure picks up
// the current values when getDatabase() / databaseManager.getPaths() are called
// during test execution (not at import time).
let _liveDb: Database.Database;
let _projectDbPath = '';

vi.mock('../../database', () => ({
  getDatabase: () => _liveDb,
  saveDatabase: vi.fn(),
  replaceProjectDatabase: vi.fn(),
  reloadProjectDatabase: vi.fn(),
  databaseManager: {
    getPaths: () => ({ projectDbPath: _projectDbPath, appDbPath: '' }),
  },
}));

vi.mock('../../database/queries/projects', () => ({
  formatCopyTimestamp: vi.fn(() => '2024-01-15 09:05'),
  createProjectCopy: vi.fn(),
  getAllProjects: vi.fn(),
  getProjectById: vi.fn(),
  deleteProject: vi.fn(),
}));

// sql.js is imported at the top of fileService but only used in mergeImportedProject,
// which is not under test here. Mock it to avoid native-module load issues.
vi.mock('sql.js', () => ({ default: vi.fn() }));

// Import the service AFTER mocks are registered
import { fileService } from '../fileService';

// ── Minimal schema matching the shape exportProjectById expects ───────────────

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS projects (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    root_project_id TEXT,
    created_at INTEGER DEFAULT 0,
    updated_at INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS fixtures (
    id         TEXT PRIMARY KEY,
    project_id TEXT,
    name       TEXT
  );
  CREATE TABLE IF NOT EXISTS prep_projects (
    id   TEXT PRIMARY KEY,
    name TEXT
  );
  CREATE TABLE IF NOT EXISTS shop_order_projects (
    id   TEXT PRIMARY KEY,
    name TEXT
  );
`;

// ── Test suite ────────────────────────────────────────────────────────────────

describe('exportProjectById', () => {
  let tmpDir: string;

  beforeEach(() => {
    // Fresh temp directory + file-based DB for each test
    tmpDir = mkdtempSync(join(tmpdir(), 'export-test-'));
    _projectDbPath = join(tmpDir, 'project.db');
    _liveDb = new Database(_projectDbPath);
    _liveDb.exec(SCHEMA);
    vi.clearAllMocks();
  });

  afterEach(() => {
    try {
      _liveDb.close();
    } catch (_) {
      // already closed by the test
    }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── Dialog cancel ───────────────────────────────────────────────────────────

  it('returns null when the user cancels the save dialog', async () => {
    vi.spyOn(fileService as any, 'showSaveDialog').mockResolvedValue(null);

    const result = await fileService.exportProjectById('any-id', 'Any Name');

    expect(result).toBeNull();
  });

  // ── Project-not-found guard ─────────────────────────────────────────────────

  it('throws when the project does not exist in the database', async () => {
    const outputPath = join(tmpDir, 'output.ss');
    vi.spyOn(fileService as any, 'showSaveDialog').mockResolvedValue(outputPath);
    // Projects table is empty — no rows inserted

    await expect(fileService.exportProjectById('missing-id', 'Ghost')).rejects.toThrow(
      /not found/i,
    );

    // No tmp file should have been created (error fires before copyFileSync)
    expect(existsSync(`${outputPath}.tmp`)).toBe(false);
  });

  // ── Happy path: only target project rows remain ─────────────────────────────

  it('exports only the target project and strips other-project rows', async () => {
    _liveDb.exec(`
      INSERT INTO projects (id, name) VALUES ('p1', 'Keep Me'), ('p2', 'Strip Me');
      INSERT INTO fixtures (id, project_id, name) VALUES
        ('f1', 'p1', 'Fixture A'),
        ('f2', 'p1', 'Fixture B'),
        ('f3', 'p2', 'Other Fixture');
    `);

    const outputPath = join(tmpDir, 'output.ss');
    vi.spyOn(fileService as any, 'showSaveDialog').mockResolvedValue(outputPath);

    const result = await fileService.exportProjectById('p1', 'Keep Me');

    expect(result).toBe(outputPath);
    expect(existsSync(outputPath)).toBe(true);
    // Temp file must be gone after successful rename
    expect(existsSync(`${outputPath}.tmp`)).toBe(false);

    // Open exported file and verify contents
    const exported = new Database(outputPath, { readonly: true });
    const projects = exported.prepare('SELECT id FROM projects').all() as { id: string }[];
    const fixtures = exported.prepare('SELECT id FROM fixtures').all() as { id: string }[];
    exported.close();

    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe('p1');
    expect(fixtures.map((r) => r.id)).toEqual(expect.arrayContaining(['f1', 'f2']));
    expect(fixtures.map((r) => r.id)).not.toContain('f3');
  });

  // ── Prep / shop-order tables purged ────────────────────────────────────────

  it('purges all prep_ and shop_order_ tables from the exported file', async () => {
    _liveDb.exec(`
      INSERT INTO projects        (id, name) VALUES ('p1', 'Project');
      INSERT INTO prep_projects   (id, name) VALUES ('prep1', 'A Prep');
      INSERT INTO shop_order_projects (id, name) VALUES ('so1', 'A Shop Order');
    `);

    const outputPath = join(tmpDir, 'output.ss');
    vi.spyOn(fileService as any, 'showSaveDialog').mockResolvedValue(outputPath);

    await fileService.exportProjectById('p1', 'Project');

    const exported = new Database(outputPath, { readonly: true });
    const prepRows = exported.prepare('SELECT id FROM prep_projects').all();
    const shopRows = exported.prepare('SELECT id FROM shop_order_projects').all();
    exported.close();

    expect(prepRows).toHaveLength(0);
    expect(shopRows).toHaveLength(0);
  });

  // ── Tmp-file cleanup on error ───────────────────────────────────────────────

  it('removes the tmp file when an error occurs after the file copy', async () => {
    _liveDb.exec(`INSERT INTO projects (id, name) VALUES ('p1', 'Project');`);

    const outputPath = join(tmpDir, 'output.ss');
    vi.spyOn(fileService as any, 'showSaveDialog').mockResolvedValue(outputPath);

    // Inject a failure at the VACUUM step — this fires after copyFileSync has
    // already written the tmp file, so the catch block's cleanup path is exercised.
    // vi.spyOn on the class prototype works reliably; spying on ESM-named exports
    // from 'fs' does not (Cannot redefine property in ESM namespace).
    const execSpy = vi.spyOn(Database.prototype, 'exec').mockImplementationOnce(() => {
      throw new Error('VACUUM failed intentionally');
    });

    await expect(fileService.exportProjectById('p1', 'Project')).rejects.toThrow(
      'Failed to export project',
    );

    // Catch block must have closed backupDb and unlinked the tmp file
    expect(existsSync(`${outputPath}.tmp`)).toBe(false);
    expect(existsSync(outputPath)).toBe(false);

    execSpy.mockRestore();
  });
});
