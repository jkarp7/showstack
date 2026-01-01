import type { PaperworkTemplateInput } from '../../renderer/src/types/paperworkTemplate';
import { COLUMN_DEFAULTS } from '../../renderer/src/utils/paperwork/columnDefaults';
import { DEFAULT_PAGE_SETUP } from '../../renderer/src/types/paperwork';

/**
 * Default Paperwork Templates
 *
 * System templates for all 12 report types.
 * These are seeded into the database on first launch.
 */

/**
 * Default page setup for all paperwork reports
 */
const PAPERWORK_PAGE_SETUP = {
  ...DEFAULT_PAGE_SETUP,
  orientation: 'portrait' as const,
  colorMode: 'bw' as const
};

/**
 * All 12 system templates
 */
export const DEFAULT_PAPERWORK_TEMPLATES: PaperworkTemplateInput[] = [
  // ============================================
  // FIXTURE REPORTS (7)
  // ============================================

  {
    name: 'Channel Hookup',
    description: 'Comprehensive channel-to-dimmer reference. Primary report for electricians during load-in and focus.',
    reportType: 'channel-hookup',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['channel-hookup'],
    organization: {
      sortBy: 'channel',
      sortDirection: 'asc',
      showGroupHeaders: false,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  {
    name: 'Dimmer Schedule',
    description: 'Organized by dimmer for rack patching and troubleshooting.',
    reportType: 'dimmer-schedule',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['dimmer-schedule'],
    organization: {
      groupBy: 'dimmer',
      sortBy: 'channel',
      sortDirection: 'asc',
      showGroupHeaders: true,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  {
    name: 'Circuit List',
    description: 'Venue circuit assignments for load-in planning.',
    reportType: 'circuit-list',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['circuit-list'],
    organization: {
      groupBy: 'circuit',
      sortBy: 'position',
      sortDirection: 'asc',
      showGroupHeaders: true,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  {
    name: 'DMX Addresses',
    description: 'DMX/RDM configuration reference for moving lights and accessories.',
    reportType: 'dmx-addresses',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['dmx-addresses'],
    organization: {
      groupBy: 'universe',
      sortBy: 'dmx_address',
      sortDirection: 'asc',
      showGroupHeaders: true,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  {
    name: 'Power Summary',
    description: 'Load calculations and power distribution planning.',
    reportType: 'power-summary',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['power-summary'],
    organization: {
      groupBy: 'type',
      sortBy: 'wattage',
      sortDirection: 'desc',
      showGroupHeaders: true,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  {
    name: 'Color Schedule',
    description: 'Color accessory tracking for gel cuts and inventory.',
    reportType: 'color-schedule',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['color-schedule'],
    organization: {
      groupBy: 'color',
      sortBy: 'channel',
      sortDirection: 'asc',
      showGroupHeaders: true,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  {
    name: 'Gobo Schedule',
    description: 'Gobo and template assignments for moving lights.',
    reportType: 'gobo-schedule',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['gobo-schedule'],
    organization: {
      groupBy: 'gobo',
      sortBy: 'channel',
      sortDirection: 'asc',
      showGroupHeaders: true,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  // ============================================
  // INFRASTRUCTURE REPORTS (5)
  // ============================================

  {
    name: 'Infrastructure List',
    description: 'Complete infrastructure equipment inventory.',
    reportType: 'infrastructure-list',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['infrastructure-list'],
    organization: {
      groupBy: 'type',
      sortBy: 'name',
      sortDirection: 'asc',
      showGroupHeaders: true,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  {
    name: 'Network Summary',
    description: 'Network equipment configuration and IP assignments.',
    reportType: 'network-summary',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['network-summary'],
    organization: {
      groupBy: 'vlan',
      sortBy: 'ip_address',
      sortDirection: 'asc',
      showGroupHeaders: true,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  {
    name: 'Port Assignments',
    description: 'Network port mapping for patch panels and switches.',
    reportType: 'port-assignments',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['port-assignments'],
    organization: {
      sortBy: 'port',
      sortDirection: 'asc',
      showGroupHeaders: false,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  {
    name: 'Infrastructure Power',
    description: 'Power requirements and distribution for infrastructure.',
    reportType: 'infrastructure-power',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['infrastructure-power'],
    organization: {
      groupBy: 'power_source',
      sortBy: 'name',
      sortDirection: 'asc',
      showGroupHeaders: true,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  },

  {
    name: 'Infrastructure Location',
    description: 'Physical placement reference for infrastructure equipment.',
    reportType: 'infrastructure-location',
    headerTemplateId: 'default-paperwork-header',
    columns: COLUMN_DEFAULTS['infrastructure-location'],
    organization: {
      groupBy: 'location',
      sortBy: 'name',
      sortDirection: 'asc',
      showGroupHeaders: true,
      groupPageBreaks: false
    },
    pageSetup: PAPERWORK_PAGE_SETUP,
    isSystem: true
  }
];

/**
 * Get default template for a specific report type
 */
export function getDefaultTemplateForReportType(reportType: string): PaperworkTemplateInput | undefined {
  return DEFAULT_PAPERWORK_TEMPLATES.find(t => t.reportType === reportType);
}
