/**
 * Paperwork Header Template Utilities
 *
 * Convenience functions for managing paperwork header layout templates.
 * Wraps the generic layout template functions with paperwork-specific logic.
 */

import type { PageLayoutTemplate, LayoutElement } from '../../types/shopOrder';

const PAPERWORK_HEADER_PAGE_TYPE = 'paperwork-header';

/**
 * Get all paperwork header templates
 */
export async function getPaperworkHeaderTemplates(): Promise<PageLayoutTemplate[]> {
  if (!window.api?.prep?.layoutTemplates) {
    throw new Error('Prep API not available');
  }

  // projectId is ignored by the IPC handler, but required by API signature
  return await window.api.prep.layoutTemplates.getByProjectId('', PAPERWORK_HEADER_PAGE_TYPE);
}

/**
 * Get the default paperwork header template
 */
export async function getDefaultPaperworkHeaderTemplate(): Promise<PageLayoutTemplate | null> {
  if (!window.api?.prep?.layoutTemplates) {
    throw new Error('Prep API not available');
  }

  // projectId is ignored by the IPC handler, but required by API signature
  return await window.api.prep.layoutTemplates.getDefault('', PAPERWORK_HEADER_PAGE_TYPE);
}

/**
 * Get a paperwork header template by ID with its elements
 */
export async function getPaperworkHeaderTemplate(
  id: string,
): Promise<{ template: PageLayoutTemplate; elements: LayoutElement[] } | null> {
  if (!window.api?.prep?.layoutTemplates) {
    throw new Error('Prep API not available');
  }

  const template = await window.api.prep.layoutTemplates.getById(id);
  if (!template) {
    return null;
  }

  const elements = await window.api.prep.layoutTemplates.getElements(id);

  return { template, elements };
}

/**
 * Create a new paperwork header template
 */
export async function createPaperworkHeaderTemplate(
  name: string,
  description: string,
  templateData: Partial<PageLayoutTemplate>,
  elements: Partial<LayoutElement>[],
): Promise<PageLayoutTemplate> {
  if (!window.api?.prep?.layoutTemplates) {
    throw new Error('Prep API not available');
  }

  const data: Partial<PageLayoutTemplate> = {
    ...templateData,
    name,
    description,
    page_type: PAPERWORK_HEADER_PAGE_TYPE,
    // Default values for header templates
    grid_columns: templateData.grid_columns || 12,
    grid_rows: templateData.grid_rows || 8,
    grid_gap: templateData.grid_gap || 4,
    page_width: templateData.page_width || 816,
    page_height: templateData.page_height || 264,
  };

  return await window.api.prep.layoutTemplates.create(data, elements);
}

/**
 * Update an existing paperwork header template
 */
export async function updatePaperworkHeaderTemplate(
  id: string,
  updates: Partial<PageLayoutTemplate>,
  elements?: Partial<LayoutElement>[],
): Promise<PageLayoutTemplate> {
  if (!window.api?.prep?.layoutTemplates) {
    throw new Error('Prep API not available');
  }

  return await window.api.prep.layoutTemplates.update(id, updates, elements);
}

/**
 * Delete a paperwork header template
 */
export async function deletePaperworkHeaderTemplate(id: string): Promise<void> {
  if (!window.api?.prep?.layoutTemplates) {
    throw new Error('Prep API not available');
  }

  await window.api.prep.layoutTemplates.delete(id);
}

/**
 * Duplicate an existing template with a new name
 */
export async function duplicatePaperworkHeaderTemplate(
  sourceId: string,
  newName: string,
): Promise<PageLayoutTemplate> {
  const source = await getPaperworkHeaderTemplate(sourceId);
  if (!source) {
    throw new Error('Source template not found');
  }

  const { template, elements } = source;

  // Remove IDs from elements so they get new IDs
  const newElements = elements.map((el) => {
    const { id, template_id, created_at, updated_at, ...rest } = el;
    return rest;
  });

  return await createPaperworkHeaderTemplate(
    newName,
    template.description || '',
    {
      grid_columns: template.grid_columns,
      grid_rows: template.grid_rows,
      grid_gap: template.grid_gap,
      page_width: template.page_width,
      page_height: template.page_height,
      is_default: 0, // Duplicates are never default
    },
    newElements,
  );
}

/**
 * Reset to factory default by loading from JSON
 */
export async function resetPaperworkHeaderToDefault(): Promise<PageLayoutTemplate> {
  if (!window.api?.prep?.layoutTemplates) {
    throw new Error('Prep API not available');
  }

  // This triggers reloading the default template from JSON
  // The seedDefaultLayoutsFromJSON.ts will handle this
  await window.api.prep.layoutTemplates.seedDefaults();

  // Get the newly seeded default
  const defaultTemplate = await getDefaultPaperworkHeaderTemplate();
  if (!defaultTemplate) {
    throw new Error('Failed to load default template');
  }

  return defaultTemplate;
}
