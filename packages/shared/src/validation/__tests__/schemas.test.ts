// @ts-nocheck
/**
 * Validation Schema Tests
 *
 * Tests for core validation schemas and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  FixtureSchema,
  CreateFixtureSchema,
  UpdateFixtureSchema,
  ProjectSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  ShopOrderProjectSchema,
  CreateShopOrderProjectSchema,
  UpdateShopOrderProjectSchema,
  InfrastructureEquipmentSchema,
  DimmerRackSchema,
  PDRackSchema,
  PaperworkTemplateSchema,
  PageLayoutTemplateSchema,
  parseWithZod,
  validateArray,
  formatValidationErrors,
  safeParse
} from '../index';

describe('Base Entity Schema', () => {
  it('should require id, created_at, and updated_at for full entity', () => {
    const result = parseWithZod(FixtureSchema, {
      position: 'FOH',
      type: 'Source Four 19°'
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'created_at')).toBe(true);
      expect(result.errors.some((e) => e.field === 'updated_at')).toBe(true);
    }
  });

  it('should not require id/timestamps for Create schemas', () => {
    const result = parseWithZod(CreateFixtureSchema, {
      position: 'FOH',
      type: 'Source Four 19°'
    });

    expect(result.success).toBe(true);
  });

  it('should require only id for Update schemas', () => {
    const result = parseWithZod(UpdateFixtureSchema, {
      id: 'fixture-123',
      position: 'FOH'
    });

    expect(result.success).toBe(true);
  });
});

describe('FixtureSchema', () => {
  it('should validate a complete fixture', () => {
    const fixture = {
      id: 'fixture-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      position: 'FOH',
      type: 'Source Four 19°',
      unit: 1,
      manufacturer: 'ETC',
      channel: '1',
      universe: 1,
      dmx_address: 1,
      dimmer: 'A-1',
      wattage: 575,
      color: 'R02'
    };

    const result = parseWithZod(FixtureSchema, fixture);
    expect(result.success).toBe(true);
  });

  it('should require position and type', () => {
    const result = parseWithZod(CreateFixtureSchema, {
      manufacturer: 'ETC'
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'position')).toBe(true);
      expect(result.errors.some((e) => e.field === 'type')).toBe(true);
    }
  });

  it('should validate DMX universe range (1-32768)', () => {
    const valid = parseWithZod(CreateFixtureSchema, {
      position: 'FOH',
      type: 'LED',
      universe: 32768
    });
    expect(valid.success).toBe(true);

    const invalid = parseWithZod(CreateFixtureSchema, {
      position: 'FOH',
      type: 'LED',
      universe: 32769
    });
    expect(invalid.success).toBe(false);
  });

  it('should validate DMX address range (1-512)', () => {
    const valid = parseWithZod(CreateFixtureSchema, {
      position: 'FOH',
      type: 'LED',
      dmx_address: 512
    });
    expect(valid.success).toBe(true);

    const invalid = parseWithZod(CreateFixtureSchema, {
      position: 'FOH',
      type: 'LED',
      dmx_address: 513
    });
    expect(invalid.success).toBe(false);
  });
});

describe('ProjectSchema', () => {
  it('should validate a complete project', () => {
    const project = {
      id: 'project-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      name: 'Wicked',
      description: 'Broadway tour',
      lighting_designer: 'Kenneth Posner',
      lighting_designer_email: 'ken@example.com',
      venue: 'Gershwin Theatre',
      venue_city: 'New York',
      venue_state: 'NY'
    };

    const result = parseWithZod(ProjectSchema, project);
    expect(result.success).toBe(true);
  });

  it('should require name', () => {
    const result = parseWithZod(CreateProjectSchema, {
      description: 'Test project'
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
    }
  });

  it('should validate email addresses', () => {
    const invalid = parseWithZod(CreateProjectSchema, {
      name: 'Test Project',
      lighting_designer_email: 'invalid-email'
    });
    expect(invalid.success).toBe(false);

    const valid = parseWithZod(CreateProjectSchema, {
      name: 'Test Project',
      lighting_designer_email: 'test@example.com'
    });
    expect(valid.success).toBe(true);

    // Empty string should be allowed
    const empty = parseWithZod(CreateProjectSchema, {
      name: 'Test Project',
      lighting_designer_email: ''
    });
    expect(empty.success).toBe(true);
  });
});

describe('ShopOrderProjectSchema', () => {
  it('should validate a complete shop order project', () => {
    const shopOrder = {
      id: 'prep-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      production_name: 'Hamilton',
      order_date: Date.now(),
      disciplines: ['lighting'],
      current_revision: 0
    };

    const result = parseWithZod(ShopOrderProjectSchema, shopOrder);
    expect(result.success).toBe(true);
  });

  it('should require production_name, order_date, disciplines, and current_revision', () => {
    const result = parseWithZod(CreateShopOrderProjectSchema, {
      venue: 'Test Venue'
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'production_name')).toBe(true);
      expect(result.errors.some((e) => e.field === 'order_date')).toBe(true);
      expect(result.errors.some((e) => e.field === 'disciplines')).toBe(true);
      expect(result.errors.some((e) => e.field === 'current_revision')).toBe(true);
    }
  });

  it('should require at least one discipline', () => {
    const result = parseWithZod(CreateShopOrderProjectSchema, {
      production_name: 'Test',
      order_date: Date.now(),
      disciplines: [],
      current_revision: 0
    });

    expect(result.success).toBe(false);
  });

  it('should validate revision number range (0-5)', () => {
    const valid = parseWithZod(CreateShopOrderProjectSchema, {
      production_name: 'Test',
      order_date: Date.now(),
      disciplines: ['lighting'],
      current_revision: 5
    });
    expect(valid.success).toBe(true);

    const invalid = parseWithZod(CreateShopOrderProjectSchema, {
      production_name: 'Test',
      order_date: Date.now(),
      disciplines: ['lighting'],
      current_revision: 6
    });
    expect(invalid.success).toBe(false);
  });
});

describe('InfrastructureEquipmentSchema', () => {
  it('should validate infrastructure equipment', () => {
    const equipment = {
      id: 'infra-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      project_id: 'project-1',
      name: 'Luminex GigaCore 26i',
      quantity: 2,
      status: 'active',
      category: 'network',
      ip_address: '192.168.1.100',
      port_count: 24
    };

    const result = parseWithZod(InfrastructureEquipmentSchema, equipment);
    expect(result.success).toBe(true);
  });

  it('should validate IP addresses', () => {
    // Valid IP should pass
    const valid = parseWithZod(InfrastructureEquipmentSchema, {
      id: 'infra-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      project_id: 'project-1',
      name: 'Switch',
      quantity: 1,
      status: 'active',
      ip_address: '192.168.1.1'
    });
    expect(valid.success).toBe(true);

    // Malformed IP should fail
    const invalid = parseWithZod(InfrastructureEquipmentSchema, {
      id: 'infra-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      project_id: 'project-1',
      name: 'Switch',
      quantity: 1,
      status: 'active',
      ip_address: 'not-an-ip'
    });
    expect(invalid.success).toBe(false);
  });

  it('should validate VLAN range (1-4094)', () => {
    const valid = parseWithZod(InfrastructureEquipmentSchema, {
      id: 'infra-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      project_id: 'project-1',
      name: 'Switch',
      quantity: 1,
      status: 'active',
      vlan_id: 100
    });
    expect(valid.success).toBe(true);

    const invalid = parseWithZod(InfrastructureEquipmentSchema, {
      id: 'infra-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      project_id: 'project-1',
      name: 'Switch',
      quantity: 1,
      status: 'active',
      vlan_id: 5000
    });
    expect(invalid.success).toBe(false);
  });
});

describe('Power Schemas', () => {
  it('should validate dimmer rack', () => {
    const rack = {
      id: 'dimmer-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      project_id: 'project-1',
      name: 'Dimmer Rack A',
      circuit_count: 96
    };

    const result = parseWithZod(DimmerRackSchema, rack);
    expect(result.success).toBe(true);
  });

  it('should validate circuit count options (12, 24, 48, 96)', () => {
    const valid = parseWithZod(DimmerRackSchema, {
      id: 'dimmer-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      project_id: 'project-1',
      name: 'Rack',
      circuit_count: 48
    });
    expect(valid.success).toBe(true);

    const invalid = parseWithZod(DimmerRackSchema, {
      id: 'dimmer-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      project_id: 'project-1',
      name: 'Rack',
      circuit_count: 50
    });
    expect(invalid.success).toBe(false);
  });

  it('should validate PD rack with voltage options', () => {
    const rack = {
      id: 'pd-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      project_id: 'project-1',
      name: 'PD Rack Z',
      voltage: 208,
      circuit_count: 24
    };

    const result = parseWithZod(PDRackSchema, rack);
    expect(result.success).toBe(true);
  });

  it('should validate voltage options (120, 208, 230, 240)', () => {
    const invalid = parseWithZod(PDRackSchema, {
      id: 'pd-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      project_id: 'project-1',
      name: 'Rack',
      voltage: 110,
      circuit_count: 24
    });
    expect(invalid.success).toBe(false);
  });
});

describe('PaperworkTemplateSchema', () => {
  it('should validate a paperwork template', () => {
    const template = {
      id: 'template-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      name: 'Channel Hookup',
      reportType: 'channel-hookup',
      columns: [
        {
          id: 'col-1',
          field: 'channel',
          label: 'Channel',
          width: 10,
          visible: true
        }
      ],
      organization: {},
      pageSetup: {
        size: 'letter',
        orientation: 'portrait',
        colorMode: 'bw',
        marginTop: 0.5,
        marginRight: 0.5,
        marginBottom: 0.5,
        marginLeft: 0.5
      },
      isSystem: false
    };

    const result = parseWithZod(PaperworkTemplateSchema, template);
    expect(result.success).toBe(true);
  });

  it('should require at least one column', () => {
    const result = parseWithZod(PaperworkTemplateSchema, {
      id: 'template-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      name: 'Test',
      reportType: 'channel-hookup',
      columns: [],
      organization: {},
      pageSetup: {
        size: 'letter',
        orientation: 'portrait',
        colorMode: 'bw',
        marginTop: 0.5,
        marginRight: 0.5,
        marginBottom: 0.5,
        marginLeft: 0.5
      },
      isSystem: false
    });

    expect(result.success).toBe(false);
  });
});

describe('PageLayoutTemplateSchema', () => {
  it('should validate a page layout template', () => {
    const template = {
      id: 'layout-1',
      created_at: Date.now(),
      updated_at: Date.now(),
      name: 'Cover Page',
      page_type: 'cover',
      is_default: false,
      grid_columns: 12,
      grid_rows: 20,
      grid_gap: 10,
      page_width: 816,
      page_height: 1056,
      elements: []
    };

    const result = parseWithZod(PageLayoutTemplateSchema, template);
    expect(result.success).toBe(true);
  });
});

describe('Validation Utilities', () => {
  it('parseWithZod should return success with valid data', () => {
    const result = parseWithZod(CreateProjectSchema, {
      name: 'Test Project'
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Project');
    }
  });

  it('parseWithZod should return errors with invalid data', () => {
    const result = parseWithZod(CreateProjectSchema, {
      description: 'Missing name'
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('name');
    }
  });

  it('validateArray should validate array of items', () => {
    const fixtures = [
      { position: 'FOH', type: 'LED' },
      { position: 'SR', type: 'Moving Light' }
    ];

    const result = validateArray(CreateFixtureSchema, fixtures);
    expect(result.success).toBe(true);
  });

  it('validateArray should catch invalid items in array', () => {
    const fixtures = [
      { position: 'FOH', type: 'LED' },
      { position: 'SR' } // Missing type
    ];

    const result = validateArray(CreateFixtureSchema, fixtures);
    expect(result.success).toBe(false);
  });

  it('formatValidationErrors should format single error', () => {
    const errors = [{ field: 'name', message: 'Required', code: 'required' }];
    const formatted = formatValidationErrors(errors);
    expect(formatted).toBe('name: Required');
  });

  it('formatValidationErrors should format multiple errors', () => {
    const errors = [
      { field: 'name', message: 'Required', code: 'required' },
      { field: 'email', message: 'Invalid email', code: 'invalid' }
    ];
    const formatted = formatValidationErrors(errors);
    expect(formatted).toContain('name: Required');
    expect(formatted).toContain('email: Invalid email');
  });

  it('safeParse should return data on success', () => {
    const data = safeParse(CreateProjectSchema, { name: 'Test' });
    expect(data).not.toBeNull();
    expect(data?.name).toBe('Test');
  });

  it('safeParse should return null on failure', () => {
    const data = safeParse(CreateProjectSchema, { description: 'No name' });
    expect(data).toBeNull();
  });
});
