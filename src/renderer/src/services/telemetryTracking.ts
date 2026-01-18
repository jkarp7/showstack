/**
 * Telemetry Tracking Helpers
 *
 * Pre-defined tracking functions for common user actions across the app.
 * These helpers provide a consistent interface for tracking events.
 */

import { telemetry } from './telemetry';

/**
 * Fixture Operations Tracking
 */
export const trackFixtureOperation = {
  add: (count: number = 1, properties: Record<string, any> = {}) => {
    telemetry.track('fixture_added', {
      count,
      ...properties,
    });
  },

  edit: (fixtureId: string, changedFields: string[], properties: Record<string, any> = {}) => {
    telemetry.track('fixture_edited', {
      fixtureId,
      changedFields,
      fieldCount: changedFields.length,
      ...properties,
    });
  },

  bulkEdit: (count: number, changedFields: string[], properties: Record<string, any> = {}) => {
    telemetry.track('fixture_bulk_edit', {
      count,
      changedFields,
      fieldCount: changedFields.length,
      ...properties,
    });
  },

  delete: (count: number = 1, properties: Record<string, any> = {}) => {
    telemetry.track('fixture_deleted', {
      count,
      ...properties,
    });
  },

  import: (count: number, format: string, properties: Record<string, any> = {}) => {
    telemetry.track('fixtures_imported', {
      count,
      format,
      ...properties,
    });
  },

  export: (count: number, format: string, properties: Record<string, any> = {}) => {
    telemetry.track('fixtures_exported', {
      count,
      format,
      ...properties,
    });
  },
};

/**
 * Infrastructure Operations Tracking
 */
export const trackInfrastructureOperation = {
  add: (count: number = 1, equipmentType: string, properties: Record<string, any> = {}) => {
    telemetry.track('infrastructure_added', {
      count,
      equipmentType,
      ...properties,
    });
  },

  edit: (equipmentId: string, changedFields: string[], properties: Record<string, any> = {}) => {
    telemetry.track('infrastructure_edited', {
      equipmentId,
      changedFields,
      fieldCount: changedFields.length,
      ...properties,
    });
  },

  delete: (count: number = 1, properties: Record<string, any> = {}) => {
    telemetry.track('infrastructure_deleted', {
      count,
      ...properties,
    });
  },

  portLink: (portId: string, linkType: string, properties: Record<string, any> = {}) => {
    telemetry.track('infrastructure_port_linked', {
      portId,
      linkType,
      ...properties,
    });
  },
};

/**
 * Power Rack Operations Tracking
 */
export const trackPowerRackOperation = {
  add: (rackType: 'dimmer' | 'pd', properties: Record<string, any> = {}) => {
    telemetry.track('power_rack_added', {
      rackType,
      ...properties,
    });
  },

  edit: (rackId: string, rackType: string, properties: Record<string, any> = {}) => {
    telemetry.track('power_rack_edited', {
      rackId,
      rackType,
      ...properties,
    });
  },

  delete: (rackId: string, rackType: string, properties: Record<string, any> = {}) => {
    telemetry.track('power_rack_deleted', {
      rackId,
      rackType,
      ...properties,
    });
  },

  autoLink: (linkedCount: number, properties: Record<string, any> = {}) => {
    telemetry.track('power_auto_link_executed', {
      linkedCount,
      ...properties,
    });
  },
};

/**
 * Shop Order Operations Tracking
 */
export const trackShopOrderOperation = {
  create: (projectId: string, properties: Record<string, any> = {}) => {
    telemetry.track('shop_order_created', {
      projectId,
      ...properties,
    });
  },

  addItem: (sectionId: string, properties: Record<string, any> = {}) => {
    telemetry.track('shop_order_item_added', {
      sectionId,
      ...properties,
    });
  },

  export: (format: 'pdf' | 'csv', itemCount: number, properties: Record<string, any> = {}) => {
    telemetry.track('shop_order_exported', {
      format,
      itemCount,
      ...properties,
    });
  },

  print: (itemCount: number, properties: Record<string, any> = {}) => {
    telemetry.track('shop_order_printed', {
      itemCount,
      ...properties,
    });
  },
};

/**
 * Paperwork Operations Tracking
 */
export const trackPaperworkOperation = {
  generate: (reportType: string, properties: Record<string, any> = {}) => {
    telemetry.track('paperwork_generated', {
      reportType,
      ...properties,
    });
  },

  export: (reportType: string, format: 'pdf' | 'csv', properties: Record<string, any> = {}) => {
    telemetry.track('paperwork_exported', {
      reportType,
      format,
      ...properties,
    });
  },

  print: (reportType: string, properties: Record<string, any> = {}) => {
    telemetry.track('paperwork_printed', {
      reportType,
      ...properties,
    });
  },

  batchExport: (reportCount: number, format: string, properties: Record<string, any> = {}) => {
    telemetry.track('paperwork_batch_exported', {
      reportCount,
      format,
      ...properties,
    });
  },
};

/**
 * Label Designer Operations Tracking
 */
export const trackLabelOperation = {
  designOpened: (averyCode: string, properties: Record<string, any> = {}) => {
    telemetry.track('label_design_opened', {
      averyCode,
      ...properties,
    });
  },

  elementAdded: (elementType: string, properties: Record<string, any> = {}) => {
    telemetry.track('label_element_added', {
      elementType,
      ...properties,
    });
  },

  print: (averyCode: string, labelCount: number, properties: Record<string, any> = {}) => {
    telemetry.track('labels_printed', {
      averyCode,
      labelCount,
      ...properties,
    });
  },

  preview: (averyCode: string, properties: Record<string, any> = {}) => {
    telemetry.track('labels_previewed', {
      averyCode,
      ...properties,
    });
  },
};

/**
 * Settings Operations Tracking
 */
export const trackSettingsChange = (
  category: string,
  setting: string,
  value: any,
  properties: Record<string, any> = {}
) => {
  telemetry.track('settings_changed', {
    category,
    setting,
    value: (value !== null && value !== undefined && typeof value === 'object') ? JSON.stringify(value) : value,
    ...properties,
  });
};

/**
 * File Operations Tracking
 */
export const trackFileOperation = {
  open: (fileType: string, properties: Record<string, any> = {}) => {
    telemetry.track('file_opened', {
      fileType,
      ...properties,
    });
  },

  save: (fileType: string, properties: Record<string, any> = {}) => {
    telemetry.track('file_saved', {
      fileType,
      ...properties,
    });
  },

  import: (fileType: string, properties: Record<string, any> = {}) => {
    telemetry.track('file_imported', {
      fileType,
      ...properties,
    });
  },

  export: (fileType: string, format: string, properties: Record<string, any> = {}) => {
    telemetry.track('file_exported', {
      fileType,
      format,
      ...properties,
    });
  },
};

/**
 * Navigation Tracking
 */
export const trackNavigation = (
  destination: string,
  source: string,
  properties: Record<string, any> = {}
) => {
  telemetry.track('navigation', {
    destination,
    source,
    ...properties,
  });
};

/**
 * Feature Usage Tracking
 */
export const trackFeatureUsage = (
  feature: string,
  action: string,
  properties: Record<string, any> = {}
) => {
  telemetry.track('feature_used', {
    feature,
    action,
    ...properties,
  });
};
