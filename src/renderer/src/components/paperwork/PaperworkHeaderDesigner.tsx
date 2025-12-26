/**
 * Paperwork Header Designer
 *
 * Wrapper around the Prep module's LayoutDesigner component configured
 * specifically for designing paperwork report headers. Provides access to
 * paperwork-specific data fields including fixture and infrastructure summaries.
 */

import { LayoutDesigner } from '../prep/layout/LayoutDesigner';
import type { PageLayoutTemplate } from '../../types/prep';
import type { PaperworkProjectData, PrepTemplateData } from '../../utils/paperwork/dataFieldMapper';

interface PaperworkHeaderDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplateId?: string;
  onSave: (templateId: string) => void;
  // Optional: provide project data for live preview
  projectData?: PaperworkProjectData;
  templateData?: PrepTemplateData;
}

/**
 * PaperworkHeaderDesigner Component
 *
 * Opens a modal with the LayoutDesigner configured for paperwork headers:
 * - 12-column grid with 8 rows (headers are shorter than full pages)
 * - 816x264px canvas size
 * - Access to all paperwork data fields including summaries
 * - Templates stored in app database (not project-specific)
 */
export function PaperworkHeaderDesigner({
  isOpen,
  onClose,
  currentTemplateId,
  onSave,
  projectData,
  templateData
}: PaperworkHeaderDesignerProps) {
  if (!isOpen) {
    return null;
  }

  const handleSave = async (template: PageLayoutTemplate) => {
    // Template is already saved to database by LayoutDesigner
    // Just pass the ID back to parent
    onSave(template.id);
  };

  // Convert paperwork project data to Prep project format for preview
  const mockPrepProject = templateData ? {
    id: 'preview',
    production_name: templateData.production_name || 'Sample Production',
    venue: templateData.venue || 'Sample Venue',
    venue_city: templateData.venue_city || 'New York',
    venue_state: templateData.venue_state || 'NY',
    ld_name: templateData.ld_name || 'Jane Designer',
    ld_email: templateData.ld_email,
    ld_phone: templateData.ld_phone,
    pe_name: templateData.pe_name,
    pm_name: templateData.pm_name,
    gm_name: templateData.gm_name,
    load_in_date: templateData.load_in_date,
    opening_night_date: templateData.opening_night_date,
    closing_date: templateData.closing_date,
    current_revision: templateData.current_revision,
    revision_date: templateData.revision_date,
    logo_path: templateData.logo,
    // Paperwork-specific fields
    report_title: templateData.report_title,
    generated_date: templateData.generated_date,
    // Fixture summaries
    total_fixtures: templateData.total_fixtures,
    total_wattage: templateData.total_wattage,
    total_amperage: templateData.total_amperage,
    universe_count: templateData.universe_count,
    fixture_type_count: templateData.fixture_type_count,
    // Infrastructure summaries
    total_infrastructure: templateData.total_infrastructure,
    network_equipment_count: templateData.network_equipment_count,
    audio_equipment_count: templateData.audio_equipment_count,
    video_equipment_count: templateData.video_equipment_count,
    data_distribution_count: templateData.data_distribution_count,
    total_ports: templateData.total_ports,
    active_infrastructure: templateData.active_infrastructure,
    inactive_infrastructure: templateData.inactive_infrastructure
  } : undefined;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-75" onClick={onClose} />

        <div className="relative w-full max-w-7xl">
          <LayoutDesigner
            projectId="" // Empty string since templates are app-level
            currentProject={mockPrepProject}
            pageType="paperwork-header"
            onSave={handleSave}
            onClose={onClose}
            initialTemplate={currentTemplateId ? undefined : undefined} // TODO: Load template by ID if provided
          />
        </div>
      </div>
    </div>
  );
}
