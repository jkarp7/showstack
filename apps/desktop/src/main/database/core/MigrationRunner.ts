/**
 * MigrationRunner - Handles database schema migrations
 *
 * Responsibilities:
 * - Run migrations in order
 * - Track migration history
 * - Seed default data
 * - Handle migration errors gracefully
 */

import Database from 'better-sqlite3';
import { seedDefaultPageLayoutsFromJSON } from '../seedDefaultLayoutsFromJSON';
import {
  seedPaperworkTemplates,
  updateSystemTemplates,
  reseedMissingTemplates,
} from '../seedPaperworkTemplates';
import { seedPaperworkHeaderTemplate } from '../seedPaperworkHeader';
import { updatePaperworkTemplateHeaders } from '../updatePaperworkTemplateHeaders';
import * as fs from 'fs';
import * as path from 'path';
import { createLayoutTemplate } from '../queries/layoutTemplates';
import { logger } from '../../utils/logger';

export class MigrationRunner {
  constructor(
    private db: Database.Database,
    private dbType: 'app' | 'project',
    _dbPath: string,
  ) {}

  /**
   * Run all pending migrations
   */
  async run(): Promise<void> {
    try {
      if (this.dbType === 'app') {
        await this.runAppMigrations();
      } else {
        await this.runProjectMigrations();
      }
    } catch (error) {
      logger.error(
        `Error running ${this.dbType} migrations`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Continue anyway - don't block app startup
      // But log the error for debugging
    }
  }

  /**
   * Run app-level database migrations
   */
  private async runAppMigrations(): Promise<void> {
    logger.info('Running app database migrations');

    try {
      // Migration: Add cloud_sync column to licenses table
      this.migrateLicensesTable();

      // Seed default page layouts if none exist
      const layoutResult = this.db
        .prepare('SELECT COUNT(*) as count FROM page_layout_templates')
        .get() as { count: number };
      const layoutCount = layoutResult?.count || 0;

      if (layoutCount === 0) {
        logger.info('No default page layouts found - seeding defaults');
        seedDefaultPageLayoutsFromJSON();
        logger.info('Default page layouts seeded');
      } else {
        // Migration: Add v2 layouts with dynamic content if they don't exist
        const dynamicLayoutsResult = this.db
          .prepare(
            `
          SELECT COUNT(*) as count FROM page_layout_elements
          WHERE element_type IN ('equipment_list', 'notes_content', 'revision_log')
        `,
          )
          .get() as { count: number };
        const hasDynamicLayouts = (dynamicLayoutsResult?.count || 0) > 0;

        if (!hasDynamicLayouts) {
          logger.info('Adding v2 layouts with dynamic content support');

          // Unset all current defaults (they'll become v1 backups)
          this.db.prepare('UPDATE page_layout_templates SET is_default = 0').run();

          // Rename existing default layouts to indicate they're v1
          this.db
            .prepare(
              `
            UPDATE page_layout_templates
            SET name = name || ' (v1)'
            WHERE is_default = 0
            AND name NOT LIKE '%(v1)%'
          `,
            )
            .run();

          // Create new v2 layouts with dynamic content
          seedDefaultPageLayoutsFromJSON();

          logger.info('V2 layouts with dynamic content added (old layouts preserved as v1)');
        }

        // Migration: Add paperwork-header layout if it doesn't exist
        const paperworkHeaderResult = this.db
          .prepare(
            `
          SELECT COUNT(*) as count FROM page_layout_templates
          WHERE page_type = 'paperwork-header' AND is_default = 1
        `,
          )
          .get() as { count: number };
        const hasPaperworkHeader = (paperworkHeaderResult?.count || 0) > 0;

        if (!hasPaperworkHeader) {
          logger.info('Adding paperwork-header default layout');

          // Load just the paperwork-header layout from JSON
          const layoutPath = path.join(
            __dirname,
            '..',
            'defaultLayouts',
            'paperwork-header_default_layout.json',
          );

          if (fs.existsSync(layoutPath)) {
            try {
              const fileContent = fs.readFileSync(layoutPath, 'utf-8');
              const data = JSON.parse(fileContent);

              // Create template and elements
              createLayoutTemplate(
                {
                  ...data.template,
                  is_default: 1,
                },
                data.elements,
              );

              logger.info('Paperwork-header layout added');
            } catch (err) {
              logger.error(
                'Error loading paperwork-header layout',
                err instanceof Error ? err : new Error(String(err)),
              );
            }
          }
        }
      }

      // Seed default paperwork header template (must be before paperwork templates — FK dependency)
      try {
        seedPaperworkHeaderTemplate();
      } catch (err) {
        logger.error(
          'seedPaperworkHeaderTemplate failed',
          err instanceof Error ? err : new Error(String(err)),
        );
      }

      // Seed paperwork templates
      try {
        seedPaperworkTemplates();
        updateSystemTemplates();
        reseedMissingTemplates();
      } catch (err) {
        logger.error(
          'seedPaperworkTemplates failed',
          err instanceof Error ? err : new Error(String(err)),
        );
      }

      // Update existing paperwork templates to reference the default header
      try {
        updatePaperworkTemplateHeaders();
      } catch (err) {
        logger.error(
          'updatePaperworkTemplateHeaders failed',
          err instanceof Error ? err : new Error(String(err)),
        );
      }

      logger.info('App database migrations complete');
    } catch (error) {
      logger.error(
        'Error running app migrations',
        error instanceof Error ? error : new Error(String(error)),
      );
      // Continue anyway - don't block app startup
    }
  }

  /**
   * Migrate licenses table schema
   */
  private migrateLicensesTable(): void {
    const tableInfo = this.db.prepare('PRAGMA table_info(licenses)').all() as Array<{
      name: string;
    }>;
    const columns = tableInfo.map((row) => row.name);

    if (!columns.includes('cloud_sync')) {
      logger.info('Running migration: Adding cloud_sync to licenses');
      this.db
        .prepare('ALTER TABLE licenses ADD COLUMN cloud_sync INTEGER NOT NULL DEFAULT 1')
        .run();
    }
  }

  /**
   * Run project-level database migrations
   */
  private runProjectMigrations(): void {
    logger.info('Running project database migrations');

    try {
      // Projects table migrations
      this.migrateProjectsTable();

      // Infrastructure table migrations
      this.migrateInfrastructureTable();

      // Prep to Shop Order table migrations (Phase 0.3)
      this.migratePrepToShopOrder();

      // Shop order projects column migrations
      this.migrateShopOrderProjectsTable();

      logger.info('Project database migrations complete');
    } catch (error) {
      logger.error(
        'Error running project migrations',
        error instanceof Error ? error : new Error(String(error)),
      );
      // Continue anyway - don't block app startup
    }
  }

  /**
   * Migrate projects table schema
   */
  private migrateProjectsTable(): void {
    const projectsTableInfo = this.db.prepare('PRAGMA table_info(projects)').all() as Array<{
      name: string;
    }>;
    const projectsColumns = projectsTableInfo.map((row) => row.name);

    // Add logo_path
    if (!projectsColumns.includes('logo_path')) {
      logger.info('Running migration: Adding logo_path to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN logo_path TEXT').run();
    }

    // Add enabled_modules
    if (!projectsColumns.includes('enabled_modules')) {
      logger.info('Running migration: Adding enabled_modules to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN enabled_modules TEXT').run();
    }

    // Design team fields - name columns
    if (!projectsColumns.includes('lighting_designer')) {
      logger.info('Running migration: Adding design team name fields to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN lighting_designer TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN lighting_associates TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN audio_designer TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN audio_associates TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN video_designer TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN video_associates TEXT').run();
    }

    // Design team fields - contact info
    if (!projectsColumns.includes('lighting_designer_email')) {
      logger.info('Running migration: Adding design team contact fields to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN lighting_designer_email TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN lighting_designer_phone TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN audio_designer_email TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN audio_designer_phone TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN video_designer_email TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN video_designer_phone TEXT').run();
    }

    // Production staff fields - name columns
    if (!projectsColumns.includes('electrician')) {
      logger.info('Running migration: Adding production staff name fields to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN electrician TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN audio_tech TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN video_tech TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN production_manager TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN production_manager_company TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN general_manager TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN general_manager_company TEXT').run();
    }

    // Production staff fields - contact info
    if (!projectsColumns.includes('electrician_email')) {
      logger.info('Running migration: Adding production staff contact fields to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN electrician_email TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN electrician_phone TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN audio_tech_email TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN audio_tech_phone TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN video_tech_email TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN video_tech_phone TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN production_manager_email TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN production_manager_phone TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN general_manager_email TEXT').run();
      this.db.prepare('ALTER TABLE projects ADD COLUMN general_manager_phone TEXT').run();
    }

    // Venue and dates fields
    if (!projectsColumns.includes('venue')) {
      logger.info('Running migration: Adding venue to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN venue TEXT').run();
    }

    if (!projectsColumns.includes('venue_city')) {
      logger.info('Running migration: Adding venue_city to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN venue_city TEXT').run();
    }

    if (!projectsColumns.includes('venue_state')) {
      logger.info('Running migration: Adding venue_state to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN venue_state TEXT').run();
    }

    if (!projectsColumns.includes('show_dates')) {
      logger.info('Running migration: Adding show_dates to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN show_dates TEXT').run();
    }

    // Family / version stacking (Eos-style project families)
    if (!projectsColumns.includes('root_project_id')) {
      logger.info('Running migration: Adding root_project_id to projects');
      this.db.prepare('ALTER TABLE projects ADD COLUMN root_project_id TEXT').run();
      this.db
        .prepare('CREATE INDEX IF NOT EXISTS idx_projects_root ON projects(root_project_id)')
        .run();
    }
  }

  /**
   * Migrate infrastructure_equipment table schema
   */
  private migrateInfrastructureTable(): void {
    // Check if infrastructure_equipment table exists
    const tableExists = this.db
      .prepare(
        `
      SELECT COUNT(*) as count FROM sqlite_master
      WHERE type='table' AND name='infrastructure_equipment'
    `,
      )
      .get() as { count: number };
    const exists = (tableExists?.count || 0) > 0;

    if (!exists) {
      // Create infrastructure_equipment table
      logger.info('Running migration: Creating infrastructure_equipment table');
      this.db
        .prepare(
          `
        CREATE TABLE IF NOT EXISTS infrastructure_equipment (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          category TEXT,
          manufacturer TEXT,
          model TEXT,
          quantity INTEGER DEFAULT 1,
          port_count INTEGER DEFAULT 0,
          power_consumption REAL,
          weight REAL,
          dimensions TEXT,
          location TEXT,
          position_x REAL,
          position_y REAL,
          position_z REAL,
          notes TEXT,
          status TEXT DEFAULT 'Active',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
      `,
        )
        .run();
      this.db
        .prepare(
          'CREATE INDEX IF NOT EXISTS idx_infrastructure_project ON infrastructure_equipment(project_id)',
        )
        .run();
      this.db
        .prepare(
          'CREATE INDEX IF NOT EXISTS idx_infrastructure_category ON infrastructure_equipment(project_id, category)',
        )
        .run();
      this.db
        .prepare(
          'CREATE INDEX IF NOT EXISTS idx_infrastructure_location ON infrastructure_equipment(project_id, location)',
        )
        .run();
    } else {
      // Table exists, check for missing columns
      const infrastructureColumns = this.db
        .prepare('PRAGMA table_info(infrastructure_equipment)')
        .all() as Array<{ name: string }>;
      const columnNames = infrastructureColumns.map((row) => row.name);

      if (!columnNames.includes('port_count')) {
        logger.info('Running migration: Adding port_count to infrastructure_equipment');
        this.db
          .prepare('ALTER TABLE infrastructure_equipment ADD COLUMN port_count INTEGER DEFAULT 0')
          .run();
      }
    }
  }

  /**
   * Migrate prep tables to shop_order tables (Phase 0.3)
   * Renames all prep_* tables to shop_order_* for clarity
   */
  private migratePrepToShopOrder(): void {
    // Check if old prep tables exist
    const prepProjectsExists = this.db
      .prepare(
        `
      SELECT COUNT(*) as count FROM sqlite_master
      WHERE type='table' AND name='prep_projects'
    `,
      )
      .get() as { count: number };
    const hasOldTables = (prepProjectsExists?.count || 0) > 0;

    // Check if new shop_order tables already exist
    const shopOrderProjectsExists = this.db
      .prepare(
        `
      SELECT COUNT(*) as count FROM sqlite_master
      WHERE type='table' AND name='shop_order_projects'
    `,
      )
      .get() as { count: number };
    const hasNewTables = (shopOrderProjectsExists?.count || 0) > 0;

    // If new tables already exist, migration already done
    if (hasNewTables) {
      return;
    }

    // If old tables don't exist, nothing to migrate
    if (!hasOldTables) {
      return;
    }

    logger.info('Running migration: Renaming prep tables to shop_order');

    try {
      // Rename tables (preserves all data and structure)
      this.db.prepare('ALTER TABLE prep_projects RENAME TO shop_order_projects').run();
      this.db.prepare('ALTER TABLE prep_sections RENAME TO shop_order_sections').run();
      this.db.prepare('ALTER TABLE prep_equipment_items RENAME TO shop_order_items').run();
      this.db.prepare('ALTER TABLE prep_revisions RENAME TO shop_order_revisions').run();
      this.db.prepare('ALTER TABLE prep_notes RENAME TO shop_order_notes').run();
      this.db.prepare('ALTER TABLE prep_note_templates RENAME TO shop_order_note_templates').run();

      // Drop old indexes
      this.db.prepare('DROP INDEX IF EXISTS idx_prep_sections_project').run();
      this.db.prepare('DROP INDEX IF EXISTS idx_prep_items_section').run();
      this.db.prepare('DROP INDEX IF EXISTS idx_prep_revisions_project').run();
      this.db.prepare('DROP INDEX IF EXISTS idx_prep_notes_project').run();
      this.db.prepare('DROP INDEX IF EXISTS idx_prep_notes_type').run();
      this.db.prepare('DROP INDEX IF EXISTS idx_prep_note_templates_type').run();
      this.db.prepare('DROP INDEX IF EXISTS idx_prep_note_templates_default').run();

      // Create new indexes with shop_order naming
      this.db
        .prepare(
          'CREATE INDEX IF NOT EXISTS idx_shop_order_sections_project ON shop_order_sections(prep_project_id)',
        )
        .run();
      this.db
        .prepare(
          'CREATE INDEX IF NOT EXISTS idx_shop_order_items_section ON shop_order_items(section_id)',
        )
        .run();
      this.db
        .prepare(
          'CREATE INDEX IF NOT EXISTS idx_shop_order_revisions_project ON shop_order_revisions(prep_project_id)',
        )
        .run();
      this.db
        .prepare(
          'CREATE INDEX IF NOT EXISTS idx_shop_order_notes_project ON shop_order_notes(prep_project_id)',
        )
        .run();
      this.db
        .prepare(
          'CREATE INDEX IF NOT EXISTS idx_shop_order_notes_type ON shop_order_notes(prep_project_id, type)',
        )
        .run();
      this.db
        .prepare(
          'CREATE INDEX IF NOT EXISTS idx_shop_order_note_templates_type ON shop_order_note_templates(type)',
        )
        .run();
      this.db
        .prepare(
          'CREATE INDEX IF NOT EXISTS idx_shop_order_note_templates_default ON shop_order_note_templates(type, is_default)',
        )
        .run();

      logger.info('Successfully renamed prep tables to shop_order');
    } catch (error) {
      logger.error(
        'Error during prep to shop_order migration',
        error instanceof Error ? error : new Error(String(error)),
      );
      // Don't throw - allow app to continue
    }
  }

  /**
   * Migrate shop_order_projects table — add columns added after initial schema
   */
  private migrateShopOrderProjectsTable(): void {
    const tableExists = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='shop_order_projects'`,
      )
      .get() as { count: number };
    if ((tableExists?.count || 0) === 0) return;

    const columns = (
      this.db.prepare('PRAGMA table_info(shop_order_projects)').all() as Array<{ name: string }>
    ).map((r) => r.name);

    if (!columns.includes('logo_path')) {
      logger.info('Running migration: Adding logo_path to shop_order_projects');
      this.db.prepare('ALTER TABLE shop_order_projects ADD COLUMN logo_path TEXT').run();
    }
    if (!columns.includes('logo_url')) {
      logger.info('Running migration: Adding logo_url to shop_order_projects');
      this.db.prepare('ALTER TABLE shop_order_projects ADD COLUMN logo_url TEXT').run();
    }
    if (!columns.includes('logo_storage_path')) {
      logger.info('Running migration: Adding logo_storage_path to shop_order_projects');
      this.db.prepare('ALTER TABLE shop_order_projects ADD COLUMN logo_storage_path TEXT').run();
    }
    if (!columns.includes('parent_project_id')) {
      logger.info('Running migration: Adding parent_project_id to shop_order_projects');
      this.db.prepare('ALTER TABLE shop_order_projects ADD COLUMN parent_project_id TEXT').run();
    }
  }
}
