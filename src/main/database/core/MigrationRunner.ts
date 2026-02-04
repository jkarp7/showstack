/**
 * MigrationRunner - Handles database schema migrations
 *
 * Responsibilities:
 * - Run migrations in order
 * - Track migration history
 * - Seed default data
 * - Handle migration errors gracefully
 */

import { Database } from 'sql.js';
import { errorHandler } from '../../errors';
import { DatabaseError } from '../../errors';
import { seedDefaultPageLayoutsFromJSON } from '../seedDefaultLayoutsFromJSON';
import { seedPaperworkTemplates, updateSystemTemplates, reseedMissingTemplates } from '../seedPaperworkTemplates';
import { seedPaperworkHeaderTemplate } from '../seedPaperworkHeader';
import { updatePaperworkTemplateHeaders } from '../updatePaperworkTemplateHeaders';
import * as fs from 'fs';
import * as path from 'path';
import { createLayoutTemplate } from '../queries/layoutTemplates';

export class MigrationRunner {
  constructor(
    private db: Database,
    private dbType: 'app' | 'project',
    private dbPath: string
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
      console.error(`❌ Error running ${this.dbType} migrations:`, error);
      // Continue anyway - don't block app startup
      // But log the error for debugging
    }
  }

  /**
   * Run app-level database migrations
   */
  private async runAppMigrations(): Promise<void> {
    console.log('Running app database migrations...');

    try {
      // Seed default page layouts if none exist
      const layoutResult = this.db.exec('SELECT COUNT(*) as count FROM page_layout_templates');
      const layoutCount = layoutResult[0]?.values[0]?.[0] || 0;

      if (layoutCount === 0) {
        console.log('No default page layouts found - seeding defaults...');
        seedDefaultPageLayoutsFromJSON();
        console.log('✅ Default page layouts seeded');
      } else {
        // Migration: Add v2 layouts with dynamic content if they don't exist
        const dynamicLayoutsResult = this.db.exec(`
          SELECT COUNT(*) as count FROM page_layout_elements
          WHERE element_type IN ('equipment_list', 'notes_content', 'revision_log')
        `);
        const hasDynamicLayouts = (dynamicLayoutsResult[0]?.values[0]?.[0] || 0) > 0;

        if (!hasDynamicLayouts) {
          console.log('Adding v2 layouts with dynamic content support...');

          // Unset all current defaults (they'll become v1 backups)
          this.db.run('UPDATE page_layout_templates SET is_default = 0');

          // Rename existing default layouts to indicate they're v1
          this.db.run(`
            UPDATE page_layout_templates
            SET name = name || ' (v1)'
            WHERE is_default = 0
            AND name NOT LIKE '%(v1)%'
          `);

          // Create new v2 layouts with dynamic content
          seedDefaultPageLayoutsFromJSON();

          console.log('✅ V2 layouts with dynamic content added (old layouts preserved as v1)');
        }

        // Migration: Add paperwork-header layout if it doesn't exist
        const paperworkHeaderResult = this.db.exec(`
          SELECT COUNT(*) as count FROM page_layout_templates
          WHERE page_type = 'paperwork-header' AND is_default = 1
        `);
        const hasPaperworkHeader = (paperworkHeaderResult[0]?.values[0]?.[0] || 0) > 0;

        if (!hasPaperworkHeader) {
          console.log('Adding paperwork-header default layout...');

          // Load just the paperwork-header layout from JSON
          const layoutPath = path.join(__dirname, '..', 'defaultLayouts', 'paperwork-header_default_layout.json');

          if (fs.existsSync(layoutPath)) {
            try {
              const fileContent = fs.readFileSync(layoutPath, 'utf-8');
              const data = JSON.parse(fileContent);

              // Create template and elements
              createLayoutTemplate(
                {
                  ...data.template,
                  is_default: 1
                },
                data.elements
              );

              console.log('✅ Paperwork-header layout added');
            } catch (err) {
              console.error('Error loading paperwork-header layout:', err);
            }
          }
        }
      }

      // Seed paperwork templates
      seedPaperworkTemplates();

      // Update system templates
      updateSystemTemplates();

      // Reseed missing templates
      reseedMissingTemplates();

      // Seed default paperwork header template
      seedPaperworkHeaderTemplate();

      // Update existing paperwork templates to reference the default header
      updatePaperworkTemplateHeaders();

      console.log('✅ App database migrations complete');
    } catch (error) {
      console.error('❌ Error running app migrations:', error);
      // Continue anyway - don't block app startup
    }
  }

  /**
   * Run project-level database migrations
   */
  private runProjectMigrations(): void {
    console.log('Running project database migrations...');

    try {
      // Projects table migrations
      this.migrateProjectsTable();

      // Infrastructure table migrations
      this.migrateInfrastructureTable();

      console.log('✅ Project database migrations complete');
    } catch (error) {
      console.error('❌ Error running project migrations:', error);
      // Continue anyway - don't block app startup
    }
  }

  /**
   * Migrate projects table schema
   */
  private migrateProjectsTable(): void {
    const projectsTableInfo = this.db.exec("PRAGMA table_info(projects)");
    const projectsColumns = projectsTableInfo[0]?.values.map(row => row[1]) || [];

    // Add logo_path
    if (!projectsColumns.includes('logo_path')) {
      console.log('Running migration: Adding logo_path to projects');
      this.db.run('ALTER TABLE projects ADD COLUMN logo_path TEXT');
    }

    // Add enabled_modules
    if (!projectsColumns.includes('enabled_modules')) {
      console.log('Running migration: Adding enabled_modules to projects');
      this.db.run('ALTER TABLE projects ADD COLUMN enabled_modules TEXT');
    }

    // Design team fields - name columns
    if (!projectsColumns.includes('lighting_designer')) {
      console.log('Running migration: Adding design team name fields to projects');
      this.db.run('ALTER TABLE projects ADD COLUMN lighting_designer TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN lighting_associates TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN audio_designer TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN audio_associates TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN video_designer TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN video_associates TEXT');
    }

    // Design team fields - contact info
    if (!projectsColumns.includes('lighting_designer_email')) {
      console.log('Running migration: Adding design team contact fields to projects');
      this.db.run('ALTER TABLE projects ADD COLUMN lighting_designer_email TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN lighting_designer_phone TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN audio_designer_email TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN audio_designer_phone TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN video_designer_email TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN video_designer_phone TEXT');
    }

    // Production staff fields - name columns
    if (!projectsColumns.includes('electrician')) {
      console.log('Running migration: Adding production staff name fields to projects');
      this.db.run('ALTER TABLE projects ADD COLUMN electrician TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN audio_tech TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN video_tech TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN production_manager TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN production_manager_company TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN general_manager TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN general_manager_company TEXT');
    }

    // Production staff fields - contact info
    if (!projectsColumns.includes('electrician_email')) {
      console.log('Running migration: Adding production staff contact fields to projects');
      this.db.run('ALTER TABLE projects ADD COLUMN electrician_email TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN electrician_phone TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN audio_tech_email TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN audio_tech_phone TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN video_tech_email TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN video_tech_phone TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN production_manager_email TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN production_manager_phone TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN general_manager_email TEXT');
      this.db.run('ALTER TABLE projects ADD COLUMN general_manager_phone TEXT');
    }

    // Venue and dates fields
    if (!projectsColumns.includes('venue')) {
      console.log('Running migration: Adding venue to projects');
      this.db.run('ALTER TABLE projects ADD COLUMN venue TEXT');
    }

    if (!projectsColumns.includes('venue_city')) {
      console.log('Running migration: Adding venue_city to projects');
      this.db.run('ALTER TABLE projects ADD COLUMN venue_city TEXT');
    }

    if (!projectsColumns.includes('venue_state')) {
      console.log('Running migration: Adding venue_state to projects');
      this.db.run('ALTER TABLE projects ADD COLUMN venue_state TEXT');
    }

    if (!projectsColumns.includes('show_dates')) {
      console.log('Running migration: Adding show_dates to projects');
      this.db.run('ALTER TABLE projects ADD COLUMN show_dates TEXT');
    }
  }

  /**
   * Migrate infrastructure_equipment table schema
   */
  private migrateInfrastructureTable(): void {
    // Check if infrastructure_equipment table exists
    const tableExists = this.db.exec(`
      SELECT COUNT(*) as count FROM sqlite_master
      WHERE type='table' AND name='infrastructure_equipment'
    `);
    const exists = (tableExists[0]?.values[0]?.[0] || 0) > 0;

    if (!exists) {
      // Create infrastructure_equipment table
      console.log('Running migration: Creating infrastructure_equipment table');
      this.db.run(`
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
      `);
      this.db.run('CREATE INDEX IF NOT EXISTS idx_infrastructure_project ON infrastructure_equipment(project_id)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_infrastructure_category ON infrastructure_equipment(project_id, category)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_infrastructure_location ON infrastructure_equipment(project_id, location)');
    } else {
      // Table exists, check for missing columns
      const infrastructureColumns = this.db.exec("PRAGMA table_info(infrastructure_equipment)");
      const columnNames = infrastructureColumns[0]?.values.map(row => row[1]) || [];

      if (!columnNames.includes('port_count')) {
        console.log('Running migration: Adding port_count to infrastructure_equipment');
        this.db.run('ALTER TABLE infrastructure_equipment ADD COLUMN port_count INTEGER DEFAULT 0');
      }
    }
  }
}
