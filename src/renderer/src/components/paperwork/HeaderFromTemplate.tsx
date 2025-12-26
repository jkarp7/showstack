/**
 * Header From Template Renderer
 *
 * Renders a paperwork report header from a visual layout template.
 * Uses the Prep module's PageRenderer component with paperwork-specific data mapping.
 */

import { useState, useEffect } from 'react';
import { PageRenderer } from '../prep/PageRenderer';
import type { PageLayoutTemplate, PrintSection, PrepProject } from '../../types/prep';
import type { PrepTemplateData } from '../../utils/paperwork/dataFieldMapper';

interface HeaderFromTemplateProps {
  templateId: string;
  templateData: PrepTemplateData;
  pageSize?: string;
  orientation?: string;
}

/**
 * HeaderFromTemplate Component
 *
 * Loads and renders a paperwork header template with the provided data.
 * Automatically handles template loading and data field mapping.
 */
export function HeaderFromTemplate({
  templateId,
  templateData,
  pageSize = 'letter',
  orientation = 'portrait'
}: HeaderFromTemplateProps) {
  const [template, setTemplate] = useState<PageLayoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        setError(null);

        // Load template
        const tmpl = await window.api.prep.layoutTemplates.getById(templateId);
        if (!tmpl) {
          throw new Error('Template not found');
        }

        // Load elements
        const elements = await window.api.prep.layoutTemplates.getElements(templateId);

        // Parse JSON fields
        const parsedElements = elements.map(el => ({
          ...el,
          config: JSON.parse(el.config),
          style: JSON.parse(el.style)
        }));

        setTemplate({
          ...tmpl,
          elements: parsedElements
        });
      } catch (err) {
        console.error('Error loading header template:', err);
        setError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [templateId]);

  if (loading) {
    return (
      <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading header template...</div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-600">
        <div className="text-red-700 dark:text-red-400">
          Error loading header: {error || 'Template not found'}
        </div>
      </div>
    );
  }

  // Convert template data to PrepProject format
  const mockProject: PrepProject = {
    id: 'preview',
    production_name: templateData.production_name || '',
    venue: templateData.venue || '',
    venue_city: templateData.venue_city || '',
    venue_state: templateData.venue_state || '',
    ld_name: templateData.ld_name || '',
    ld_email: templateData.ld_email || '',
    ld_phone: templateData.ld_phone || '',
    pe_name: templateData.pe_name || '',
    pm_name: templateData.pm_name || '',
    gm_name: templateData.gm_name || '',
    load_in_date: templateData.load_in_date || '',
    opening_night_date: templateData.opening_night_date || '',
    closing_date: templateData.closing_date || '',
    current_revision: templateData.current_revision || '',
    revision_date: templateData.revision_date || '',
    logo_path: templateData.logo || null,
    // Paperwork-specific fields
    report_title: templateData.report_title || '',
    generated_date: templateData.generated_date || '',
    // Fixture summaries
    total_fixtures: templateData.total_fixtures || 0,
    total_wattage: templateData.total_wattage || 0,
    total_amperage: templateData.total_amperage || 0,
    universe_count: templateData.universe_count || 0,
    fixture_type_count: templateData.fixture_type_count || 0,
    // Infrastructure summaries
    total_infrastructure: templateData.total_infrastructure || 0,
    network_equipment_count: templateData.network_equipment_count || 0,
    audio_equipment_count: templateData.audio_equipment_count || 0,
    video_equipment_count: templateData.video_equipment_count || 0,
    data_distribution_count: templateData.data_distribution_count || 0,
    total_ports: templateData.total_ports || 0,
    active_infrastructure: templateData.active_infrastructure || 0,
    inactive_infrastructure: templateData.inactive_infrastructure || 0
  };

  // Create a section object for PageRenderer
  const section: PrintSection = {
    id: 'header',
    type: 'paperwork-header',
    order: 0,
    enabled: true,
    layout_template_id: templateId
  };

  // Page settings for the header
  const pageSettings = {
    pageSize,
    orientation,
    margins: { top: 0, right: 0, bottom: 0, left: 0 }, // No margins for header
    showPageNumbers: false,
    fontSize: 11,
    fontFamily: 'Arial'
  };

  return (
    <div className="mb-8">
      <PageRenderer
        section={section}
        project={mockProject}
        pageSettings={pageSettings}
      />
    </div>
  );
}
