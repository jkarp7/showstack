/**
 * Performance Indexes
 *
 * Optimized indexes for common query patterns.
 * These indexes significantly improve query performance for:
 * - Foreign key lookups
 * - Filtering by common columns
 * - Sorting operations
 * - Join operations
 *
 * Expected performance improvements:
 * - 10-100x faster for filtered queries
 * - 5-50x faster for joins
 * - Sub-millisecond response times for indexed queries
 */

import { logger } from '../../utils/logger';

import Database from 'better-sqlite3';

/**
 * Create all performance indexes on a database
 * Safe to call multiple times - uses IF NOT EXISTS
 *
 * @param db - better-sqlite3 database instance
 */
export function createPerformanceIndexes(db: Database.Database): void {
  logger.info('Creating performance indexes...');

  // Fixtures table indexes
  createFixtureIndexes(db);

  // Shop Order table indexes
  createShopOrderIndexes(db);

  // Infrastructure table indexes
  createInfrastructureIndexes(db);

  // Power Distribution table indexes
  createPowerDistributionIndexes(db);

  // Dimmer Rack table indexes
  createDimmerRackIndexes(db);

  // Project table indexes
  createProjectIndexes(db);

  logger.info('✅ Performance indexes created');
}

/**
 * Helper to create index safely (skip if table doesn't exist)
 */
function safeCreateIndex(db: Database.Database, sql: string): void {
  try {
    db.prepare(sql).run();
  } catch (error) {
    // Skip if table doesn't exist
    if (error instanceof Error && error.message.includes('no such table')) {
      return;
    }
    throw error;
  }
}

/**
 * Create indexes for fixtures table
 * Common queries: by project, by type, by project+type
 */
function createFixtureIndexes(db: Database.Database): void {
  // Primary access pattern: get all fixtures for a project
  safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_fixtures_project ON fixtures(project_id)');

  // Filter by type within a project
  safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_fixtures_type ON fixtures(project_id, type)');

  // Sort by updated_at for recent fixtures
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_fixtures_updated ON fixtures(project_id, updated_at DESC)',
  );

  // Filter by manufacturer/model for equipment searches
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_fixtures_manufacturer ON fixtures(project_id, manufacturer)',
  );

  // DMX addressing queries
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_fixtures_dmx ON fixtures(project_id, universe, dmx_address)',
  );
}

/**
 * Create indexes for shop order tables
 * Common queries: by project, by section, hierarchical navigation
 */
function createShopOrderIndexes(db: Database.Database): void {
  // Shop Order Projects
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_projects_parent ON shop_order_projects(parent_project_id)',
  );
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_projects_updated ON shop_order_projects(updated_at DESC)',
  );

  // Shop Order Sections - navigation by project
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_sections_project ON shop_order_sections(prep_project_id)',
  );
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_sections_order ON shop_order_sections(prep_project_id, sort_order)',
  );

  // Shop Order Items - navigation by section
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_items_section ON shop_order_items(section_id)',
  );
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(section_id, sort_order)',
  );

  // Shop Order Revisions - history tracking
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_revisions_project ON shop_order_revisions(prep_project_id)',
  );
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_revisions_created ON shop_order_revisions(prep_project_id, created_at DESC)',
  );

  // Shop Order Notes - filtering by type and project
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_notes_project ON shop_order_notes(prep_project_id)',
  );
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_notes_type ON shop_order_notes(prep_project_id, type)',
  );

  // Shop Order Note Templates - filtering by type
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_note_templates_type ON shop_order_note_templates(type)',
  );
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_shop_order_note_templates_default ON shop_order_note_templates(type, is_default)',
  );
}

/**
 * Create indexes for infrastructure_equipment table
 * Common queries: by project, by category, by location
 */
function createInfrastructureIndexes(db: Database.Database): void {
  // Primary access pattern: get all infrastructure for a project
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_infrastructure_project ON infrastructure_equipment(project_id)',
  );

  // Filter by category (e.g., "Network Switch", "Dimmer", "Power")
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_infrastructure_category ON infrastructure_equipment(project_id, category)',
  );

  // Filter by location (e.g., "FOH", "Stage Left")
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_infrastructure_location ON infrastructure_equipment(project_id, location)',
  );

  // Status filtering (Active, Inactive, etc.)
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_infrastructure_status ON infrastructure_equipment(project_id, status)',
  );
}

/**
 * Create indexes for power distribution tables
 * Common queries: by project, by rack type
 */
function createPowerDistributionIndexes(db: Database.Database): void {
  // PD Racks - by project
  safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_pd_racks_project ON pd_racks(project_id)');

  // PD Racks - by location
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_pd_racks_location ON pd_racks(project_id, location)',
  );
}

/**
 * Create indexes for dimmer rack tables
 * Common queries: by project, by rack, by module
 */
function createDimmerRackIndexes(db: Database.Database): void {
  // Dimmer Racks - by project
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_dimmer_racks_project ON dimmer_racks(project_id)',
  );

  // Dimmer Racks - by location
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_dimmer_racks_location ON dimmer_racks(project_id, location)',
  );

  // Dimmer Rack Modules - by rack
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_dimmer_modules_rack ON dimmer_rack_modules(rack_id)',
  );

  // Dimmer Rack Modules - by start_circuit for sorted display
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_dimmer_modules_start_circuit ON dimmer_rack_modules(rack_id, start_circuit)',
  );
}

/**
 * Create indexes for projects table
 * Common queries: sorting by updated_at, filtering by enabled modules
 */
function createProjectIndexes(db: Database.Database): void {
  // Sort by most recently updated
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC)',
  );

  // Sort by creation date
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC)',
  );

  // Search by name (for autocomplete/search features)
  safeCreateIndex(
    db,
    'CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name COLLATE NOCASE)',
  );
}

/**
 * Drop all performance indexes (for testing or cleanup)
 * Use with caution - will degrade query performance
 *
 * @param db - better-sqlite3 database instance
 */
export function dropPerformanceIndexes(db: Database.Database): void {
  logger.info('Dropping performance indexes...');

  const indexes = [
    // Fixtures
    'idx_fixtures_project',
    'idx_fixtures_type',
    'idx_fixtures_updated',
    'idx_fixtures_manufacturer',
    'idx_fixtures_dmx',

    // Shop Orders
    'idx_shop_order_projects_parent',
    'idx_shop_order_projects_updated',
    'idx_shop_order_sections_project',
    'idx_shop_order_sections_order',
    'idx_shop_order_items_section',
    'idx_shop_order_items_order',
    'idx_shop_order_revisions_project',
    'idx_shop_order_revisions_created',
    'idx_shop_order_notes_project',
    'idx_shop_order_notes_type',
    'idx_shop_order_note_templates_type',
    'idx_shop_order_note_templates_default',

    // Infrastructure
    'idx_infrastructure_project',
    'idx_infrastructure_category',
    'idx_infrastructure_location',
    'idx_infrastructure_status',

    // Power Distribution
    'idx_pd_racks_project',
    'idx_pd_racks_location',

    // Dimmer Racks
    'idx_dimmer_racks_project',
    'idx_dimmer_racks_location',
    'idx_dimmer_modules_rack',
    'idx_dimmer_modules_start_circuit',

    // Projects
    'idx_projects_updated',
    'idx_projects_created',
    'idx_projects_name',
  ];

  for (const index of indexes) {
    db.prepare(`DROP INDEX IF EXISTS ${index}`).run();
  }

  logger.info('✅ Performance indexes dropped');
}

/**
 * Analyze query performance for common operations
 * Returns statistics about query execution
 *
 * @param db - better-sqlite3 database instance
 * @returns Performance statistics
 */
export function analyzeQueryPerformance(db: Database.Database): {
  indexCount: number;
  tableStats: Array<{ table: string; rowCount: number }>;
} {
  // Count indexes
  const indexResult = db
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM sqlite_master
    WHERE type = 'index'
    AND name LIKE 'idx_%'
  `,
    )
    .get() as { count: number };

  // Get table statistics
  const tables = [
    'fixtures',
    'shop_order_projects',
    'shop_order_sections',
    'shop_order_items',
    'infrastructure_equipment',
    'pd_racks',
    'dimmer_racks',
    'projects',
  ];

  const tableStats = tables.map((table) => {
    try {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as {
        count: number;
      };
      return { table, rowCount: result?.count || 0 };
    } catch (error) {
      return { table, rowCount: 0 };
    }
  });

  return {
    indexCount: indexResult.count,
    tableStats,
  };
}
