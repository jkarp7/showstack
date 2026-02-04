/**
 * Paperwork Header Designer
 *
 * Wrapper around the Prep module's LayoutDesigner component configured
 * specifically for designing paperwork report headers. Provides access to
 * paperwork-specific data fields including fixture and infrastructure summaries.
 */

import { useState, useEffect } from 'react';
import { LayoutDesigner } from '../shop-order/layout/LayoutDesigner';
import { useFixtureStore } from '../../store/fixtureStore';
import { useInfrastructureStore } from '../../store/infrastructureStore';
import type { PageLayoutTemplate } from '../../types/shopOrder';
import type { ReportType } from '../../types/paperwork';
import { mapPaperworkToTemplateData, type PaperworkProjectData } from '../../utils/paperwork/dataFieldMapper';

interface PaperworkHeaderDesignerProps {
  projectId: string;
  reportType: ReportType;
  headerTemplateId?: string; // Existing header template ID if any
  onSave: (headerTemplateId: string) => void;
  onCancel: () => void;
}

/**
 * PaperworkHeaderDesigner Component
 *
 * Opens the LayoutDesigner configured for paperwork headers:
 * - 12-column grid with 8 rows (headers are shorter than full pages)
 * - 816x264px canvas size
 * - Access to all paperwork data fields including summaries
 * - Templates stored in app database (not project-specific)
 */
export function PaperworkHeaderDesigner({
  projectId,
  reportType,
  headerTemplateId,
  onSave,
  onCancel
}: PaperworkHeaderDesignerProps) {
  const { fixtures } = useFixtureStore();
  const { equipment: infrastructure } = useInfrastructureStore();

  const [projectData, setProjectData] = useState<any>(null);
  const [initialTemplate, setInitialTemplate] = useState<PageLayoutTemplate | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Load project data and existing header template
  useEffect(() => {
    async function loadData() {
      try {
        // Load project information
        if (window.api?.projects) {
          const project = await window.api.projects.getById(projectId);
          if (project) {
            setProjectData(project);
          }
        }

        // Load existing header template if provided
        if (headerTemplateId && window.api?.prep?.layoutTemplates) {
          const template = await window.api.prep.layoutTemplates.getById(headerTemplateId);
          if (template) {
            // Load template elements
            const elements = await window.api.prep.layoutTemplates.getElements(headerTemplateId);
            const parsedElements = elements.map((el: any) => ({
              ...el,
              config: typeof el.config === 'string' ? JSON.parse(el.config) : el.config,
              style: typeof el.style === 'string' ? JSON.parse(el.style) : el.style
            }));

            setInitialTemplate({
              ...template,
              elements: parsedElements
            });
          }
        }
      } catch (error) {
        console.error('Failed to load header designer data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [projectId, headerTemplateId]);

  const handleSave = async (template: PageLayoutTemplate) => {
    console.log('Header template saved:', template.id);
    // Template is already saved to database by LayoutDesigner
    // Pass the ID back to parent to update the paperwork template
    onSave(template.id);
  };

  // Convert paperwork project data to Prep project format for preview
  const paperworkProjectData: PaperworkProjectData = {
    name: projectData?.name || 'Untitled Project',
    venue: projectData?.venue,
    venue_city: projectData?.venue_city,
    venue_state: projectData?.venue_state,
    lighting_designer: projectData?.lighting_designer,
    lighting_designer_email: projectData?.lighting_designer_email,
    lighting_designer_phone: projectData?.lighting_designer_phone,
    production_electrician: projectData?.production_electrician,
    production_manager: projectData?.production_manager,
    general_manager: projectData?.general_manager,
    load_in_date: projectData?.load_in_date,
    tech_date: projectData?.tech_date,
    opening_date: projectData?.opening_date,
    closing_date: projectData?.closing_date,
    revision_number: projectData?.revision_number,
    revision_date: projectData?.revision_date,
    logo_path: projectData?.logo_path
  };

  const templateData = mapPaperworkToTemplateData(
    paperworkProjectData,
    fixtures,
    infrastructure,
    reportType
  );

  // Convert to PrepProject format for LayoutDesigner
  const mockPrepProject = {
    id: projectId,
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
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading header designer...</div>
      </div>
    );
  }

  return (
    <LayoutDesigner
      projectId={projectId}
      currentProject={mockPrepProject}
      pageType="paperwork-header"
      onSave={handleSave}
      onClose={onCancel}
      initialTemplate={initialTemplate}
    />
  );
}
