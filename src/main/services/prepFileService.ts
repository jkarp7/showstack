import { dialog } from 'electron';
import { readFileSync, writeFileSync } from 'fs';
import {
  getPrepProjectById,
  getSectionsByProjectId,
  getItemsByProjectId,
  getRevisionsByProjectId,
  getNotesByProjectId,
  createPrepProject,
  createPrepSection,
  createPrepEquipmentItem,
  createPrepRevision,
  createPrepNote,
} from '../database/queries/prep';

export interface PrepFileData {
  version: string;
  project: any;
  sections: any[];
  items: any[];
  revisions: any[];
  notes: any[];
}

export interface PrepFileResult {
  success: boolean;
  projectId?: string;
  projectName?: string;
  error?: string;
}

class PrepFileService {
  private readonly VERSION = '1.0.0';

  /**
   * Show open file dialog for .ssd files
   */
  async showOpenDialog(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Open Shop Order',
      filters: [
        { name: 'ShowStack Design Files', extensions: ['ssd'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  }

  /**
   * Show save file dialog for .ssd files
   */
  async showSaveDialog(defaultName?: string): Promise<string | null> {
    const result = await dialog.showSaveDialog({
      title: 'Save Shop Order',
      defaultPath: defaultName || 'Shop Order',
      filters: [
        { name: 'ShowStack Design Files', extensions: ['ssd'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    // Ensure .ssd extension
    let filePath = result.filePath;
    if (!filePath.endsWith('.ssd')) {
      filePath += '.ssd';
    }

    return filePath;
  }

  /**
   * Export prep project to .ssd file
   */
  async exportProject(projectId: string, filePath: string): Promise<void> {
    try {
      // Load all project data
      const project = getPrepProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const sections = getSectionsByProjectId(projectId);
      const items = getItemsByProjectId(projectId);
      const revisions = getRevisionsByProjectId(projectId);
      const notes = getNotesByProjectId(projectId);

      // Create export data structure
      const exportData: PrepFileData = {
        version: this.VERSION,
        project,
        sections,
        items,
        revisions,
        notes,
      };

      // Write to file as JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      writeFileSync(filePath, jsonData, 'utf-8');
    } catch (error) {
      console.error('Error exporting prep project:', error);
      throw new Error(`Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import prep project from .ssd file
   */
  async importProject(filePath: string): Promise<PrepFileResult> {
    try {
      // Read and parse file
      const fileContent = readFileSync(filePath, 'utf-8');
      const data: PrepFileData = JSON.parse(fileContent);

      // Validate structure
      if (!data.project || !data.version) {
        return {
          success: false,
          error: 'Invalid file format'
        };
      }

      // Create new project (with new ID)
      const { id: _oldId, created_at: _created, updated_at: _updated, ...projectData } = data.project;
      const newProject = createPrepProject({
        ...projectData,
        production_name: projectData.production_name + ' (Imported)',
        order_date: Date.now(),
      });

      // Create sections (with ID mapping for items)
      const sectionIdMap = new Map<string, string>();
      for (const section of data.sections) {
        const { id: oldId, created_at, updated_at, ...sectionData } = section;
        const newSection = createPrepSection({
          ...sectionData,
          prep_project_id: newProject.id,
        });
        sectionIdMap.set(oldId, newSection.id);
      }

      // Create items
      const itemIdMap = new Map<string, string>();
      for (const item of data.items) {
        const { id: oldId, created_at, updated_at, ...itemData } = item;
        const newSectionId = sectionIdMap.get(item.section_id);
        if (!newSectionId) continue;

        const newItem = createPrepEquipmentItem({
          ...itemData,
          section_id: newSectionId,
        });
        itemIdMap.set(oldId, newItem.id);
      }

      // Create revisions
      if (data.revisions) {
        for (const revision of data.revisions) {
          const { id: _id, created_at, updated_at, ...revisionData } = revision;

          // Update item IDs in change_log
          let changeLog = revisionData.change_log;
          if (typeof changeLog === 'string') {
            changeLog = JSON.parse(changeLog);
          }

          if (Array.isArray(changeLog)) {
            changeLog = changeLog.map((change: any) => ({
              ...change,
              item_id: itemIdMap.get(change.item_id) || change.item_id,
            }));
          }

          createPrepRevision({
            ...revisionData,
            prep_project_id: newProject.id,
            change_log: JSON.stringify(changeLog),
          });
        }
      }

      // Create notes
      if (data.notes) {
        for (const note of data.notes) {
          const { id: _id, created_at, updated_at, ...noteData } = note;
          createPrepNote({
            ...noteData,
            prep_project_id: newProject.id,
          });
        }
      }

      return {
        success: true,
        projectId: newProject.id,
        projectName: newProject.production_name,
      };
    } catch (error) {
      console.error('Error importing prep project:', error);
      return {
        success: false,
        error: `Failed to import project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get filename without extension
   */
  getFileName(filePath: string): string {
    const parts = filePath.split(/[\\/]/);
    const filename = parts[parts.length - 1];
    return filename.replace(/\.ssd$/, '');
  }
}

export const prepFileService = new PrepFileService();
