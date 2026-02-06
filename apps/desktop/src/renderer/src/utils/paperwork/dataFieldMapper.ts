/**
 * Data Field Mapper for Paperwork Templates
 *
 * Maps paperwork project data (including fixtures and infrastructure) to the
 * format expected by the Prep template rendering system. This allows paperwork
 * headers to use the same template engine as shop orders.
 */

import type { Fixture } from '../../types/database';
import type { InfrastructureEquipment } from '../../types/infrastructure';
import type { ReportType } from '../../types/paperwork';

/**
 * Paperwork project data structure
 */
export interface PaperworkProjectData {
  // Project info
  name?: string;
  venue?: string;
  venue_city?: string;
  venue_state?: string;

  // Designer info
  lighting_designer?: string;
  lighting_designer_email?: string;
  lighting_designer_phone?: string;

  // Production staff
  production_electrician?: string;
  production_manager?: string;
  general_manager?: string;

  // Dates
  load_in_date?: number;
  tech_date?: number;
  opening_date?: number;
  closing_date?: number;

  // Revision
  revision_number?: string;
  revision_date?: number;

  // Logo
  logo_path?: string | null;
}

/**
 * Prep template data structure
 * This is the format expected by the PageRenderer component
 */
export interface PrepTemplateData {
  // Project info
  production_name?: string;
  venue?: string;
  venue_city?: string;
  venue_state?: string;

  // Designer info
  ld_name?: string;
  ld_email?: string;
  ld_phone?: string;

  // Production staff
  pe_name?: string;
  pm_name?: string;
  gm_name?: string;

  // Dates
  load_in_date?: string;
  opening_night_date?: string;
  closing_date?: string;

  // Revision
  current_revision?: string;
  revision_date?: string;

  // Paperwork-specific
  report_title?: string;
  generated_date?: string;

  // Logo
  logo?: string;

  // Fixture summaries
  total_fixtures?: number;
  total_wattage?: number;
  total_amperage?: number;
  universe_count?: number;
  fixture_type_count?: number;

  // Infrastructure summaries
  total_infrastructure?: number;
  network_equipment_count?: number;
  audio_equipment_count?: number;
  video_equipment_count?: number;
  data_distribution_count?: number;
  total_ports?: number;
  active_infrastructure?: number;
  inactive_infrastructure?: number;
}

/**
 * Calculate fixture summary statistics
 */
function calculateFixtureSummaries(fixtures: Fixture[]) {
  const totalFixtures = fixtures.length;
  const totalWattage = fixtures.reduce((sum, f) => sum + (f.wattage || 0), 0);
  const totalAmperage = fixtures.reduce((sum, f) => sum + (f.amperage || 0), 0);

  // Count unique DMX universes
  const universes = new Set(fixtures.map(f => f.universe).filter(Boolean));
  const universeCount = universes.size;

  // Count unique fixture types
  const fixtureTypes = new Set(fixtures.map(f => f.type).filter(Boolean));
  const fixtureTypeCount = fixtureTypes.size;

  return {
    total_fixtures: totalFixtures,
    total_wattage: totalWattage,
    total_amperage: totalAmperage,
    universe_count: universeCount,
    fixture_type_count: fixtureTypeCount
  };
}

/**
 * Calculate infrastructure summary statistics
 */
function calculateInfrastructureSummaries(infrastructure: InfrastructureEquipment[]) {
  const totalInfrastructure = infrastructure.length;

  // Count by category
  const networkEquipmentCount = infrastructure.filter(eq => eq.category === 'network').length;
  const audioEquipmentCount = infrastructure.filter(eq => eq.category === 'audio').length;
  const videoEquipmentCount = infrastructure.filter(eq => eq.category === 'video').length;
  const dataDistributionCount = infrastructure.filter(eq => eq.category === 'data_distribution').length;

  // Count total ports
  const totalPorts = infrastructure.reduce((sum, eq) => {
    if (eq.port_assignments && Array.isArray(eq.port_assignments)) {
      return sum + eq.port_assignments.length;
    }
    return sum + (eq.port_count || 0);
  }, 0);

  // Count active vs inactive
  const activeInfrastructure = infrastructure.filter(eq => eq.status === 'active').length;
  const inactiveInfrastructure = infrastructure.filter(eq => eq.status === 'inactive' || eq.status === 'decommissioned').length;

  return {
    total_infrastructure: totalInfrastructure,
    network_equipment_count: networkEquipmentCount,
    audio_equipment_count: audioEquipmentCount,
    video_equipment_count: videoEquipmentCount,
    data_distribution_count: dataDistributionCount,
    total_ports: totalPorts,
    active_infrastructure: activeInfrastructure,
    inactive_infrastructure: inactiveInfrastructure
  };
}

/**
 * Format a timestamp to a readable date string
 */
function formatDate(timestamp?: number): string | undefined {
  if (!timestamp) return undefined;

  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get report title based on report type and project name
 */
function getReportTitle(reportType: ReportType, projectName?: string, customTitle?: string): string {
  if (customTitle) {
    return customTitle;
  }

  const reportNames: Record<ReportType, string> = {
    'channel-hookup': 'Channel Hookup',
    'dimmer-schedule': 'Dimmer Schedule',
    'circuit-list': 'Circuit List',
    'dmx-addresses': 'DMX Addresses',
    'power-summary': 'Power Summary',
    'color-schedule': 'Color Schedule',
    'gobo-schedule': 'Gobo Schedule',
    'infrastructure-list': 'Infrastructure Equipment List',
    'network-summary': 'Network Summary',
    'port-assignments': 'Port Assignments',
    'infrastructure-power': 'Infrastructure Power',
    'infrastructure-location': 'Infrastructure by Location'
  };

  const reportName = reportNames[reportType] || 'Report';

  if (projectName) {
    return `${reportName} - ${projectName}`;
  }

  return reportName;
}

/**
 * Map paperwork project data to Prep template data format
 */
export function mapPaperworkToTemplateData(
  projectData: PaperworkProjectData,
  fixtures: Fixture[],
  infrastructure: InfrastructureEquipment[],
  reportType: ReportType,
  customTitle?: string
): PrepTemplateData {
  const fixtureSummaries = calculateFixtureSummaries(fixtures);
  const infrastructureSummaries = calculateInfrastructureSummaries(infrastructure);

  return {
    // Project info
    production_name: projectData.name,
    venue: projectData.venue,
    venue_city: projectData.venue_city,
    venue_state: projectData.venue_state,

    // Designer info
    ld_name: projectData.lighting_designer,
    ld_email: projectData.lighting_designer_email,
    ld_phone: projectData.lighting_designer_phone,

    // Production staff
    pe_name: projectData.production_electrician,
    pm_name: projectData.production_manager,
    gm_name: projectData.general_manager,

    // Dates
    load_in_date: formatDate(projectData.load_in_date),
    opening_night_date: formatDate(projectData.opening_date),
    closing_date: formatDate(projectData.closing_date),

    // Revision
    current_revision: projectData.revision_number,
    revision_date: formatDate(projectData.revision_date),

    // Paperwork-specific
    report_title: getReportTitle(reportType, projectData.name, customTitle),
    generated_date: formatDate(Date.now()),

    // Logo
    logo: projectData.logo_path || undefined,

    // Fixture summaries
    ...fixtureSummaries,

    // Infrastructure summaries
    ...infrastructureSummaries
  };
}

/**
 * Get value for a specific data field
 * Used by the template renderer to look up field values
 */
export function getDataFieldValue(
  fieldType: string,
  templateData: PrepTemplateData
): string | number | undefined {
  return (templateData as any)[fieldType];
}
