import { describe, it, expect, vi, beforeEach } from 'vitest';
import { telemetry } from '../telemetry';
import {
  trackFixtureOperation,
  trackInfrastructureOperation,
  trackPowerRackOperation,
  trackShopOrderOperation,
  trackPaperworkOperation,
  trackLabelOperation,
  trackSettingsChange,
  trackFileOperation,
  trackNavigation,
  trackFeatureUsage,
} from '../telemetryTracking';

/**
 * Telemetry Tracking Helpers Tests
 *
 * Target: 70%+ coverage
 * Tests pre-defined tracking functions for common user actions
 */

// Mock telemetry
vi.mock('../telemetry', () => ({
  telemetry: {
    track: vi.fn(),
  },
}));

describe('Telemetry Tracking Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackFixtureOperation', () => {
    it('should track fixture addition', () => {
      trackFixtureOperation.add(1, { position: '1st Electric' });

      expect(telemetry.track).toHaveBeenCalledWith('fixture_added', {
        count: 1,
        position: '1st Electric',
      });
    });

    it('should track fixture edit', () => {
      trackFixtureOperation.edit('fixture-1', ['position', 'type'], { position: 'FOH' });

      expect(telemetry.track).toHaveBeenCalledWith('fixture_edited', {
        fixtureId: 'fixture-1',
        changedFields: ['position', 'type'],
        fieldCount: 2,
        position: 'FOH',
      });
    });

    it('should track bulk edit', () => {
      trackFixtureOperation.bulkEdit(10, ['wattage']);

      expect(telemetry.track).toHaveBeenCalledWith('fixture_bulk_edit', {
        count: 10,
        changedFields: ['wattage'],
        fieldCount: 1,
      });
    });

    it('should track fixture deletion', () => {
      trackFixtureOperation.delete(1);

      expect(telemetry.track).toHaveBeenCalledWith('fixture_deleted', {
        count: 1,
      });
    });

    it('should track fixture import', () => {
      trackFixtureOperation.import(50, 'csv');

      expect(telemetry.track).toHaveBeenCalledWith('fixtures_imported', {
        count: 50,
        format: 'csv',
      });
    });

    it('should track fixture export', () => {
      trackFixtureOperation.export(25, 'pdf');

      expect(telemetry.track).toHaveBeenCalledWith('fixtures_exported', {
        count: 25,
        format: 'pdf',
      });
    });
  });

  describe('trackInfrastructureOperation', () => {
    it('should track infrastructure addition', () => {
      trackInfrastructureOperation.add(1, 'dimmer_rack');

      expect(telemetry.track).toHaveBeenCalledWith('infrastructure_added', {
        count: 1,
        equipmentType: 'dimmer_rack',
      });
    });

    it('should track infrastructure edit', () => {
      trackInfrastructureOperation.edit('equip-1', ['name']);

      expect(telemetry.track).toHaveBeenCalledWith('infrastructure_edited', {
        equipmentId: 'equip-1',
        changedFields: ['name'],
        fieldCount: 1,
      });
    });

    it('should track port linking', () => {
      trackInfrastructureOperation.portLink('port-1', 'fixture');

      expect(telemetry.track).toHaveBeenCalledWith('infrastructure_port_linked', {
        portId: 'port-1',
        linkType: 'fixture',
      });
    });
  });

  describe('trackPowerRackOperation', () => {
    it('should track power rack addition', () => {
      trackPowerRackOperation.add('dimmer');

      expect(telemetry.track).toHaveBeenCalledWith('power_rack_added', {
        rackType: 'dimmer',
      });
    });

    it('should track auto-link execution', () => {
      trackPowerRackOperation.autoLink(15);

      expect(telemetry.track).toHaveBeenCalledWith('power_auto_link_executed', {
        linkedCount: 15,
      });
    });
  });

  describe('trackShopOrderOperation', () => {
    it('should track shop order creation', () => {
      trackShopOrderOperation.create('project-1');

      expect(telemetry.track).toHaveBeenCalledWith('shop_order_created', {
        projectId: 'project-1',
      });
    });

    it('should track item addition', () => {
      trackShopOrderOperation.addItem('section-1');

      expect(telemetry.track).toHaveBeenCalledWith('shop_order_item_added', {
        sectionId: 'section-1',
      });
    });

    it('should track export', () => {
      trackShopOrderOperation.export('pdf', 50);

      expect(telemetry.track).toHaveBeenCalledWith('shop_order_exported', {
        format: 'pdf',
        itemCount: 50,
      });
    });
  });

  describe('trackPaperworkOperation', () => {
    it('should track paperwork generation', () => {
      trackPaperworkOperation.generate('hookup');

      expect(telemetry.track).toHaveBeenCalledWith('paperwork_generated', {
        reportType: 'hookup',
      });
    });

    it('should track batch export', () => {
      trackPaperworkOperation.batchExport(5, 'pdf');

      expect(telemetry.track).toHaveBeenCalledWith('paperwork_batch_exported', {
        reportCount: 5,
        format: 'pdf',
      });
    });
  });

  describe('trackLabelOperation', () => {
    it('should track label design opened', () => {
      trackLabelOperation.designOpened('5160');

      expect(telemetry.track).toHaveBeenCalledWith('label_design_opened', {
        averyCode: '5160',
      });
    });

    it('should track element addition', () => {
      trackLabelOperation.elementAdded('text');

      expect(telemetry.track).toHaveBeenCalledWith('label_element_added', {
        elementType: 'text',
      });
    });

    it('should track label printing', () => {
      trackLabelOperation.print('5160', 30);

      expect(telemetry.track).toHaveBeenCalledWith('labels_printed', {
        averyCode: '5160',
        labelCount: 30,
      });
    });
  });

  describe('trackSettingsChange', () => {
    it('should track settings changes', () => {
      trackSettingsChange('privacy', 'telemetryEnabled', true);

      expect(telemetry.track).toHaveBeenCalledWith('settings_changed', {
        category: 'privacy',
        setting: 'telemetryEnabled',
        value: true,
      });
    });

    it('should stringify object values', () => {
      trackSettingsChange('editor', 'theme', { mode: 'dark' });

      expect(telemetry.track).toHaveBeenCalledWith('settings_changed', {
        category: 'editor',
        setting: 'theme',
        value: '{"mode":"dark"}',
      });
    });
  });

  describe('trackFileOperation', () => {
    it('should track file operations', () => {
      trackFileOperation.open('project');

      expect(telemetry.track).toHaveBeenCalledWith('file_opened', {
        fileType: 'project',
      });
    });

    it('should track file export with format', () => {
      trackFileOperation.export('fixtures', 'csv');

      expect(telemetry.track).toHaveBeenCalledWith('file_exported', {
        fileType: 'fixtures',
        format: 'csv',
      });
    });
  });

  describe('trackNavigation', () => {
    it('should track navigation events', () => {
      trackNavigation('/equipment', '/home');

      expect(telemetry.track).toHaveBeenCalledWith('navigation', {
        destination: '/equipment',
        source: '/home',
      });
    });
  });

  describe('trackFeatureUsage', () => {
    it('should track feature usage', () => {
      trackFeatureUsage('auto_address', 'calculate');

      expect(telemetry.track).toHaveBeenCalledWith('feature_used', {
        feature: 'auto_address',
        action: 'calculate',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty properties objects', () => {
      trackFixtureOperation.add(1, {});

      expect(telemetry.track).toHaveBeenCalledWith('fixture_added', {
        count: 1,
      });
    });

    it('should handle zero counts', () => {
      trackFixtureOperation.delete(0);

      expect(telemetry.track).toHaveBeenCalledWith('fixture_deleted', {
        count: 0,
      });
    });

    it('should handle empty arrays', () => {
      trackFixtureOperation.edit('id', []);

      expect(telemetry.track).toHaveBeenCalledWith('fixture_edited', {
        fixtureId: 'id',
        changedFields: [],
        fieldCount: 0,
      });
    });

    it('should handle special characters in strings', () => {
      trackSettingsChange('test', 'setting', 'value with "quotes" and \\slashes\\');

      expect(telemetry.track).toHaveBeenCalled();
    });

    it('should handle undefined values', () => {
      trackSettingsChange('test', 'setting', undefined);

      expect(telemetry.track).toHaveBeenCalledWith('settings_changed', {
        category: 'test',
        setting: 'setting',
        value: undefined,
      });
    });

    it('should handle null values', () => {
      trackSettingsChange('test', 'setting', null);

      expect(telemetry.track).toHaveBeenCalledWith('settings_changed', {
        category: 'test',
        setting: 'setting',
        value: null,
      });
    });
  });
});
