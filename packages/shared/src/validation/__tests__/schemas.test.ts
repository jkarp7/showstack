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
  ShopOrderSectionSchema,
  CreateShopOrderSectionSchema,
  UpdateShopOrderSectionSchema,
  ShopOrderItemSchema,
  CreateShopOrderItemSchema,
  UpdateShopOrderItemSchema,
  ShopOrderRevisionSchema,
  CreateShopOrderRevisionSchema,
  UpdateShopOrderRevisionSchema,
  ShopOrderNoteSchema,
  CreateShopOrderNoteSchema,
  UpdateShopOrderNoteSchema,
  ShopOrderNoteTemplateSchema,
  CreateShopOrderNoteTemplateSchema,
  UpdateShopOrderNoteTemplateSchema,
  DisciplineSchema,
  NoteTypeSchema,
  ChangeTypeSchema,
  ContactSchema,
  AdditionalContactSchema,
  ItemChangeSchema,
  InfrastructureEquipmentSchema,
  CreateInfrastructureEquipmentSchema,
  UpdateInfrastructureEquipmentSchema,
  PortTypeSchema,
  PortStatusSchema,
  PortAssignmentSchema,
  InfrastructureCategorySchema,
  DimmerRackSchema,
  CreateDimmerRackSchema,
  UpdateDimmerRackSchema,
  PDRackSchema,
  CreatePDRackSchema,
  UpdatePDRackSchema,
  DimmerRackModuleSchema,
  CreateDimmerRackModuleSchema,
  UpdateDimmerRackModuleSchema,
  ModuleTypeSchema,
  PhaseConfigSchema,
  CircuitCountSchema,
  VoltageSchema,
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

// ============================================================
// Shop Order Sub-Schemas
// ============================================================

describe('ShopOrderSectionSchema', () => {
  const validSection = {
    id: 'section-1',
    created_at: Date.now(),
    updated_at: Date.now(),
    prep_project_id: 'prep-1',
    name: 'Moving Lights',
    discipline: 'lighting',
    sort_order: 0,
    page_break: false
  };

  it('should validate a complete section', () => {
    const result = parseWithZod(ShopOrderSectionSchema, validSection);
    expect(result.success).toBe(true);
  });

  it('should require prep_project_id, name, discipline, sort_order, and page_break', () => {
    const result = parseWithZod(CreateShopOrderSectionSchema, {
      notes: 'some notes'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'prep_project_id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
      expect(result.errors.some((e) => e.field === 'discipline')).toBe(true);
      expect(result.errors.some((e) => e.field === 'sort_order')).toBe(true);
      expect(result.errors.some((e) => e.field === 'page_break')).toBe(true);
    }
  });

  it('should not require id/timestamps for CreateShopOrderSectionSchema', () => {
    const result = parseWithZod(CreateShopOrderSectionSchema, {
      prep_project_id: 'prep-1',
      name: 'LED Fixtures',
      discipline: 'lighting',
      sort_order: 1,
      page_break: false
    });
    expect(result.success).toBe(true);
  });

  it('should require only id for UpdateShopOrderSectionSchema', () => {
    const result = parseWithZod(UpdateShopOrderSectionSchema, {
      id: 'section-1',
      name: 'Updated Section'
    });
    expect(result.success).toBe(true);
  });

  it('should reject UpdateShopOrderSectionSchema without id', () => {
    const result = parseWithZod(UpdateShopOrderSectionSchema, {
      name: 'Updated Section'
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid discipline values', () => {
    const result = parseWithZod(CreateShopOrderSectionSchema, {
      prep_project_id: 'prep-1',
      name: 'Test',
      discipline: 'pyrotechnics',
      sort_order: 0,
      page_break: false
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative sort_order', () => {
    const result = parseWithZod(CreateShopOrderSectionSchema, {
      prep_project_id: 'prep-1',
      name: 'Test',
      discipline: 'lighting',
      sort_order: -1,
      page_break: false
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional notes field', () => {
    const result = parseWithZod(CreateShopOrderSectionSchema, {
      prep_project_id: 'prep-1',
      name: 'Test',
      discipline: 'audio',
      sort_order: 2,
      page_break: true,
      notes: 'Some section notes'
    });
    expect(result.success).toBe(true);
  });
});

describe('ShopOrderItemSchema', () => {
  const validItem = {
    id: 'item-1',
    created_at: Date.now(),
    updated_at: Date.now(),
    section_id: 'section-1',
    description: 'Source Four 19deg',
    active_qty: 10,
    spare_qty: 2,
    venue_qty: 0,
    total_qty: 12,
    venue_active: 0,
    venue_spare: 0,
    sort_order: 0
  };

  it('should validate a complete item', () => {
    const result = parseWithZod(ShopOrderItemSchema, validItem);
    expect(result.success).toBe(true);
  });

  it('should require section_id, description, sort_order, and quantity fields', () => {
    const result = parseWithZod(CreateShopOrderItemSchema, {
      notes: 'optional note'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'section_id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'description')).toBe(true);
      expect(result.errors.some((e) => e.field === 'sort_order')).toBe(true);
      expect(result.errors.some((e) => e.field === 'active_qty')).toBe(true);
      expect(result.errors.some((e) => e.field === 'spare_qty')).toBe(true);
      expect(result.errors.some((e) => e.field === 'venue_qty')).toBe(true);
      expect(result.errors.some((e) => e.field === 'total_qty')).toBe(true);
    }
  });

  it('should not require id/timestamps for CreateShopOrderItemSchema', () => {
    const result = parseWithZod(CreateShopOrderItemSchema, {
      section_id: 'section-1',
      description: 'LED Bar',
      active_qty: 5,
      spare_qty: 1,
      venue_qty: 0,
      total_qty: 6,
      venue_active: 0,
      venue_spare: 0,
      sort_order: 0
    });
    expect(result.success).toBe(true);
  });

  it('should require only id for UpdateShopOrderItemSchema', () => {
    const result = parseWithZod(UpdateShopOrderItemSchema, {
      id: 'item-1',
      active_qty: 20
    });
    expect(result.success).toBe(true);
  });

  it('should reject UpdateShopOrderItemSchema without id', () => {
    const result = parseWithZod(UpdateShopOrderItemSchema, {
      active_qty: 20
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative quantity values', () => {
    const result = parseWithZod(CreateShopOrderItemSchema, {
      section_id: 'section-1',
      description: 'Test',
      active_qty: -1,
      spare_qty: 0,
      venue_qty: 0,
      total_qty: 0,
      venue_active: 0,
      venue_spare: 0,
      sort_order: 0
    });
    expect(result.success).toBe(false);
  });

  it('should accept zero for all quantity fields', () => {
    const result = parseWithZod(CreateShopOrderItemSchema, {
      section_id: 'section-1',
      description: 'Test',
      active_qty: 0,
      spare_qty: 0,
      venue_qty: 0,
      total_qty: 0,
      venue_active: 0,
      venue_spare: 0,
      sort_order: 0
    });
    expect(result.success).toBe(true);
  });

  it('should validate revision tracking fields boundary (0-5)', () => {
    const valid = parseWithZod(CreateShopOrderItemSchema, {
      section_id: 'section-1',
      description: 'Test',
      active_qty: 1,
      spare_qty: 0,
      venue_qty: 0,
      total_qty: 1,
      venue_active: 0,
      venue_spare: 0,
      sort_order: 0,
      added_in_revision: 0,
      removed_in_revision: 5,
      modified_in_revision: 3
    });
    expect(valid.success).toBe(true);

    const invalid = parseWithZod(CreateShopOrderItemSchema, {
      section_id: 'section-1',
      description: 'Test',
      active_qty: 1,
      spare_qty: 0,
      venue_qty: 0,
      total_qty: 1,
      venue_active: 0,
      venue_spare: 0,
      sort_order: 0,
      added_in_revision: 6
    });
    expect(invalid.success).toBe(false);
  });

  it('should accept optional weight and power fields', () => {
    const result = parseWithZod(CreateShopOrderItemSchema, {
      section_id: 'section-1',
      description: 'Heavy Fixture',
      active_qty: 2,
      spare_qty: 0,
      venue_qty: 0,
      total_qty: 2,
      venue_active: 0,
      venue_spare: 0,
      sort_order: 0,
      weight: 15.5,
      power: 575
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative weight', () => {
    const result = parseWithZod(CreateShopOrderItemSchema, {
      section_id: 'section-1',
      description: 'Test',
      active_qty: 1,
      spare_qty: 0,
      venue_qty: 0,
      total_qty: 1,
      venue_active: 0,
      venue_spare: 0,
      sort_order: 0,
      weight: -5
    });
    expect(result.success).toBe(false);
  });
});

describe('ShopOrderRevisionSchema', () => {
  const validRevision = {
    id: 'rev-1',
    created_at: Date.now(),
    updated_at: Date.now(),
    prep_project_id: 'prep-1',
    revision_number: 1,
    revision_date: Date.now(),
    change_log: []
  };

  it('should validate a complete revision', () => {
    const result = parseWithZod(ShopOrderRevisionSchema, validRevision);
    expect(result.success).toBe(true);
  });

  it('should require prep_project_id and revision_number', () => {
    const result = parseWithZod(CreateShopOrderRevisionSchema, {
      notes: 'some notes'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'prep_project_id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'revision_number')).toBe(true);
    }
  });

  it('should not require id/timestamps for CreateShopOrderRevisionSchema', () => {
    const result = parseWithZod(CreateShopOrderRevisionSchema, {
      prep_project_id: 'prep-1',
      revision_number: 2,
      revision_date: Date.now(),
      change_log: []
    });
    expect(result.success).toBe(true);
  });

  it('should require only id for UpdateShopOrderRevisionSchema', () => {
    const result = parseWithZod(UpdateShopOrderRevisionSchema, {
      id: 'rev-1',
      notes: 'Updated notes'
    });
    expect(result.success).toBe(true);
  });

  it('should reject UpdateShopOrderRevisionSchema without id', () => {
    const result = parseWithZod(UpdateShopOrderRevisionSchema, {
      notes: 'Updated notes'
    });
    expect(result.success).toBe(false);
  });

  it('should validate revision_number range (1-5)', () => {
    const validMin = parseWithZod(CreateShopOrderRevisionSchema, {
      prep_project_id: 'prep-1',
      revision_number: 1,
      revision_date: Date.now(),
      change_log: []
    });
    expect(validMin.success).toBe(true);

    const validMax = parseWithZod(CreateShopOrderRevisionSchema, {
      prep_project_id: 'prep-1',
      revision_number: 5,
      revision_date: Date.now(),
      change_log: []
    });
    expect(validMax.success).toBe(true);

    const invalidZero = parseWithZod(CreateShopOrderRevisionSchema, {
      prep_project_id: 'prep-1',
      revision_number: 0,
      revision_date: Date.now(),
      change_log: []
    });
    expect(invalidZero.success).toBe(false);

    const invalidSix = parseWithZod(CreateShopOrderRevisionSchema, {
      prep_project_id: 'prep-1',
      revision_number: 6,
      revision_date: Date.now(),
      change_log: []
    });
    expect(invalidSix.success).toBe(false);
  });

  it('should require positive revision_date', () => {
    const result = parseWithZod(CreateShopOrderRevisionSchema, {
      prep_project_id: 'prep-1',
      revision_number: 1,
      revision_date: -100,
      change_log: []
    });
    expect(result.success).toBe(false);
  });

  it('should accept a change_log with valid items', () => {
    const result = parseWithZod(CreateShopOrderRevisionSchema, {
      prep_project_id: 'prep-1',
      revision_number: 1,
      revision_date: Date.now(),
      change_log: [
        {
          item_id: 'item-1',
          change_type: 'addition',
          description: 'Added new fixture'
        },
        {
          item_id: 'item-2',
          change_type: 'deletion',
          description: 'Removed old fixture',
          section_name: 'Moving Lights'
        }
      ]
    });
    expect(result.success).toBe(true);
  });
});

describe('ShopOrderNoteSchema', () => {
  const validNote = {
    id: 'note-1',
    created_at: Date.now(),
    updated_at: Date.now(),
    prep_project_id: 'prep-1',
    type: 'general_notes',
    content: 'All fixtures must be safety cabled.',
    format: 'plain'
  };

  it('should validate a complete note', () => {
    const result = parseWithZod(ShopOrderNoteSchema, validNote);
    expect(result.success).toBe(true);
  });

  it('should require prep_project_id, type, and content', () => {
    const result = parseWithZod(CreateShopOrderNoteSchema, {
      format: 'plain'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'prep_project_id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'type')).toBe(true);
      expect(result.errors.some((e) => e.field === 'content')).toBe(true);
    }
  });

  it('should not require id/timestamps for CreateShopOrderNoteSchema', () => {
    const result = parseWithZod(CreateShopOrderNoteSchema, {
      prep_project_id: 'prep-1',
      type: 'fixture_notes',
      content: 'Handle with care.',
      format: 'bullets'
    });
    expect(result.success).toBe(true);
  });

  it('should require only id for UpdateShopOrderNoteSchema', () => {
    const result = parseWithZod(UpdateShopOrderNoteSchema, {
      id: 'note-1',
      content: 'Updated note content'
    });
    expect(result.success).toBe(true);
  });

  it('should reject UpdateShopOrderNoteSchema without id', () => {
    const result = parseWithZod(UpdateShopOrderNoteSchema, {
      content: 'Updated note content'
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid note type', () => {
    const result = parseWithZod(CreateShopOrderNoteSchema, {
      prep_project_id: 'prep-1',
      type: 'invalid_type',
      content: 'Test',
      format: 'plain'
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid format', () => {
    const result = parseWithZod(CreateShopOrderNoteSchema, {
      prep_project_id: 'prep-1',
      type: 'general_notes',
      content: 'Test',
      format: 'html'
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid format values', () => {
    for (const format of ['plain', 'bullets', 'numbered']) {
      const result = parseWithZod(CreateShopOrderNoteSchema, {
        prep_project_id: 'prep-1',
        type: 'general_conditions',
        content: 'Test',
        format
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('ShopOrderNoteTemplateSchema', () => {
  const validTemplate = {
    id: 'tmpl-1',
    created_at: Date.now(),
    updated_at: Date.now(),
    type: 'general_conditions',
    name: 'Standard Safety Language',
    content: 'All equipment must be safety cabled per ANSI standards.',
    is_default: 0
  };

  it('should validate a complete note template', () => {
    const result = parseWithZod(ShopOrderNoteTemplateSchema, validTemplate);
    expect(result.success).toBe(true);
  });

  it('should require type, name, and content', () => {
    const result = parseWithZod(CreateShopOrderNoteTemplateSchema, {
      is_default: 0
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'type')).toBe(true);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
      expect(result.errors.some((e) => e.field === 'content')).toBe(true);
    }
  });

  it('should not require id/timestamps for CreateShopOrderNoteTemplateSchema', () => {
    const result = parseWithZod(CreateShopOrderNoteTemplateSchema, {
      type: 'general_notes',
      name: 'Template',
      content: 'Template content',
      is_default: 1
    });
    expect(result.success).toBe(true);
  });

  it('should require only id for UpdateShopOrderNoteTemplateSchema', () => {
    const result = parseWithZod(UpdateShopOrderNoteTemplateSchema, {
      id: 'tmpl-1',
      name: 'Updated Template'
    });
    expect(result.success).toBe(true);
  });

  it('should reject UpdateShopOrderNoteTemplateSchema without id', () => {
    const result = parseWithZod(UpdateShopOrderNoteTemplateSchema, {
      name: 'Updated Template'
    });
    expect(result.success).toBe(false);
  });

  it('should validate is_default as 0 or 1', () => {
    const valid0 = parseWithZod(CreateShopOrderNoteTemplateSchema, {
      type: 'general_notes',
      name: 'Template',
      content: 'Content',
      is_default: 0
    });
    expect(valid0.success).toBe(true);

    const valid1 = parseWithZod(CreateShopOrderNoteTemplateSchema, {
      type: 'general_notes',
      name: 'Template',
      content: 'Content',
      is_default: 1
    });
    expect(valid1.success).toBe(true);

    const invalid = parseWithZod(CreateShopOrderNoteTemplateSchema, {
      type: 'general_notes',
      name: 'Template',
      content: 'Content',
      is_default: 2
    });
    expect(invalid.success).toBe(false);
  });

  it('should reject invalid template type', () => {
    const result = parseWithZod(CreateShopOrderNoteTemplateSchema, {
      type: 'revision',
      name: 'Template',
      content: 'Content',
      is_default: 0
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid template types (general_conditions, general_notes, fixture_notes)', () => {
    for (const type of ['general_conditions', 'general_notes', 'fixture_notes']) {
      const result = parseWithZod(CreateShopOrderNoteTemplateSchema, {
        type,
        name: 'Template',
        content: 'Content',
        is_default: 0
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('DisciplineSchema', () => {
  it('should accept all valid discipline values', () => {
    const validValues = ['lighting', 'audio', 'video', 'rigging', 'scenic', 'props'];
    for (const value of validValues) {
      const result = DisciplineSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid discipline values', () => {
    const invalidValues = ['pyrotechnics', 'electrical', '', 'LIGHTING', 123];
    for (const value of invalidValues) {
      const result = DisciplineSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });
});

describe('NoteTypeSchema', () => {
  it('should accept all valid note type values', () => {
    const validValues = ['general_conditions', 'general_notes', 'fixture_notes', 'revision'];
    for (const value of validValues) {
      const result = NoteTypeSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid note type values', () => {
    const invalidValues = ['warning', 'comment', '', 'GENERAL_NOTES', 0];
    for (const value of invalidValues) {
      const result = NoteTypeSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });
});

describe('ChangeTypeSchema', () => {
  it('should accept all valid change type values', () => {
    const validValues = ['addition', 'deletion', 'modification'];
    for (const value of validValues) {
      const result = ChangeTypeSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid change type values', () => {
    const invalidValues = ['update', 'remove', '', 'ADDITION', null];
    for (const value of invalidValues) {
      const result = ChangeTypeSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });
});

describe('ContactSchema', () => {
  it('should validate a complete contact', () => {
    const result = ContactSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234'
    });
    expect(result.success).toBe(true);
  });

  it('should allow all fields to be optional', () => {
    const result = ContactSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should allow empty string for email', () => {
    const result = ContactSchema.safeParse({
      name: 'John',
      email: ''
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = ContactSchema.safeParse({
      email: 'not-an-email'
    });
    expect(result.success).toBe(false);
  });
});

describe('AdditionalContactSchema', () => {
  it('should validate a complete additional contact', () => {
    const result = AdditionalContactSchema.safeParse({
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-5678',
      role: 'Associate Designer',
      discipline: 'lighting'
    });
    expect(result.success).toBe(true);
  });

  it('should require role', () => {
    const result = AdditionalContactSchema.safeParse({
      name: 'Jane Smith'
    });
    expect(result.success).toBe(false);
  });

  it('should allow discipline to be optional', () => {
    const result = AdditionalContactSchema.safeParse({
      role: 'Programmer'
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid discipline in additional contact', () => {
    const result = AdditionalContactSchema.safeParse({
      role: 'Programmer',
      discipline: 'invalid'
    });
    expect(result.success).toBe(false);
  });
});

describe('ItemChangeSchema', () => {
  it('should validate a minimal item change', () => {
    const result = ItemChangeSchema.safeParse({
      item_id: 'item-1',
      change_type: 'addition',
      description: 'Added new fixture'
    });
    expect(result.success).toBe(true);
  });

  it('should validate with optional section_name', () => {
    const result = ItemChangeSchema.safeParse({
      item_id: 'item-1',
      change_type: 'deletion',
      description: 'Removed fixture',
      section_name: 'Moving Lights'
    });
    expect(result.success).toBe(true);
  });

  it('should require item_id, change_type, and description', () => {
    const result = ItemChangeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject empty item_id', () => {
    const result = ItemChangeSchema.safeParse({
      item_id: '',
      change_type: 'addition',
      description: 'Test'
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid change_type', () => {
    const result = ItemChangeSchema.safeParse({
      item_id: 'item-1',
      change_type: 'update',
      description: 'Test'
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid change_type values in item changes', () => {
    for (const change_type of ['addition', 'deletion', 'modification']) {
      const result = ItemChangeSchema.safeParse({
        item_id: 'item-1',
        change_type,
        description: 'Test change'
      });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================
// Infrastructure Sub-Schemas
// ============================================================

describe('CreateInfrastructureEquipmentSchema', () => {
  it('should validate without id and timestamps', () => {
    const result = parseWithZod(CreateInfrastructureEquipmentSchema, {
      project_id: 'project-1',
      name: 'Luminex GigaCore 26i',
      quantity: 1,
      status: 'active'
    });
    expect(result.success).toBe(true);
  });

  it('should require project_id and name', () => {
    const result = parseWithZod(CreateInfrastructureEquipmentSchema, {
      quantity: 1,
      status: 'active'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'project_id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
    }
  });

  it('should reject id field in create schema', () => {
    const result = parseWithZod(CreateInfrastructureEquipmentSchema, {
      id: 'infra-1',
      project_id: 'project-1',
      name: 'Switch',
      quantity: 1,
      status: 'active'
    });
    // The id field should be stripped (omitted) but not cause failure
    if (result.success) {
      expect(result.data.id).toBeUndefined();
    }
  });

  it('should accept optional network fields', () => {
    const result = parseWithZod(CreateInfrastructureEquipmentSchema, {
      project_id: 'project-1',
      name: 'Switch',
      quantity: 2,
      status: 'active',
      ip_address: '10.0.0.1',
      subnet_mask: '255.255.255.0',
      gateway: '10.0.0.254',
      vlan_id: 100,
      hostname: 'switch-01'
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdateInfrastructureEquipmentSchema', () => {
  it('should require id', () => {
    const result = parseWithZod(UpdateInfrastructureEquipmentSchema, {
      name: 'Updated Switch'
    });
    expect(result.success).toBe(false);
  });

  it('should allow partial updates with only id', () => {
    const result = parseWithZod(UpdateInfrastructureEquipmentSchema, {
      id: 'infra-1'
    });
    expect(result.success).toBe(true);
  });

  it('should allow updating individual fields', () => {
    const result = parseWithZod(UpdateInfrastructureEquipmentSchema, {
      id: 'infra-1',
      ip_address: '192.168.2.100',
      location: 'FOH Rack'
    });
    expect(result.success).toBe(true);
  });
});

describe('PortTypeSchema', () => {
  it('should accept all valid port type values', () => {
    const validValues = ['ethernet', 'dmx', 'fiber', 'power', 'other'];
    for (const value of validValues) {
      const result = PortTypeSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid port type values', () => {
    const invalidValues = ['usb', 'hdmi', '', 'ETHERNET', 42];
    for (const value of invalidValues) {
      const result = PortTypeSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });
});

describe('PortStatusSchema', () => {
  it('should accept all valid port status values', () => {
    const validValues = ['active', 'inactive', 'error'];
    for (const value of validValues) {
      const result = PortStatusSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid port status values', () => {
    const invalidValues = ['enabled', 'disabled', '', 'ACTIVE', true];
    for (const value of invalidValues) {
      const result = PortStatusSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });
});

describe('PortAssignmentSchema', () => {
  it('should validate a complete port assignment', () => {
    const result = PortAssignmentSchema.safeParse({
      port: 1,
      connected_to: 'Switch A Port 24',
      type: 'ethernet',
      vlan: 100,
      status: 'active',
      notes: 'Uplink'
    });
    expect(result.success).toBe(true);
  });

  it('should require port number', () => {
    const result = PortAssignmentSchema.safeParse({
      connected_to: 'Something'
    });
    expect(result.success).toBe(false);
  });

  it('should require positive port number', () => {
    const result = PortAssignmentSchema.safeParse({
      port: 0
    });
    expect(result.success).toBe(false);

    const resultNeg = PortAssignmentSchema.safeParse({
      port: -1
    });
    expect(resultNeg.success).toBe(false);
  });

  it('should validate VLAN range (1-4094)', () => {
    const valid = PortAssignmentSchema.safeParse({ port: 1, vlan: 1 });
    expect(valid.success).toBe(true);

    const validMax = PortAssignmentSchema.safeParse({ port: 1, vlan: 4094 });
    expect(validMax.success).toBe(true);

    const invalidLow = PortAssignmentSchema.safeParse({ port: 1, vlan: 0 });
    expect(invalidLow.success).toBe(false);

    const invalidHigh = PortAssignmentSchema.safeParse({ port: 1, vlan: 4095 });
    expect(invalidHigh.success).toBe(false);
  });

  it('should accept port linking fields', () => {
    const result = PortAssignmentSchema.safeParse({
      port: 5,
      linked_fixture_id: 'fixture-1',
      linked_equipment_id: 'equip-2',
      linked_port: 12
    });
    expect(result.success).toBe(true);
  });
});

describe('InfrastructureCategorySchema', () => {
  it('should accept all valid category values', () => {
    const validValues = ['network', 'data_distribution', 'audio', 'video'];
    for (const value of validValues) {
      const result = InfrastructureCategorySchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid category values', () => {
    const invalidValues = ['lighting', 'power', '', 'NETWORK', 0];
    for (const value of invalidValues) {
      const result = InfrastructureCategorySchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });
});

// ============================================================
// Power Sub-Schemas
// ============================================================

describe('CreateDimmerRackSchema', () => {
  it('should validate without id and timestamps', () => {
    const result = parseWithZod(CreateDimmerRackSchema, {
      project_id: 'project-1',
      name: 'Dimmer Rack A',
      circuit_count: 96
    });
    expect(result.success).toBe(true);
  });

  it('should require project_id, name, and circuit_count', () => {
    const result = parseWithZod(CreateDimmerRackSchema, {
      location: 'Basement'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'project_id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
      expect(result.errors.some((e) => e.field === 'circuit_count')).toBe(true);
    }
  });

  it('should accept optional fields', () => {
    const result = parseWithZod(CreateDimmerRackSchema, {
      project_id: 'project-1',
      name: 'Dimmer Rack B',
      circuit_count: 48,
      rack_identifier: 'B',
      manufacturer: 'ETC',
      model: 'Sensor3',
      module_type: 'dimmer',
      channels_per_module: 6,
      watts_per_module: 7200,
      location: 'Stage Left',
      building_service: 'Service A',
      notes: 'Main rack'
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdateDimmerRackSchema', () => {
  it('should require id', () => {
    const result = parseWithZod(UpdateDimmerRackSchema, {
      name: 'Updated Rack'
    });
    expect(result.success).toBe(false);
  });

  it('should allow partial updates with only id', () => {
    const result = parseWithZod(UpdateDimmerRackSchema, {
      id: 'dimmer-1'
    });
    expect(result.success).toBe(true);
  });

  it('should allow updating individual fields', () => {
    const result = parseWithZod(UpdateDimmerRackSchema, {
      id: 'dimmer-1',
      name: 'Renamed Rack',
      location: 'New Location'
    });
    expect(result.success).toBe(true);
  });
});

describe('CreatePDRackSchema', () => {
  it('should validate without id and timestamps', () => {
    const result = parseWithZod(CreatePDRackSchema, {
      project_id: 'project-1',
      name: 'PD Rack Z',
      voltage: 208,
      circuit_count: 24
    });
    expect(result.success).toBe(true);
  });

  it('should require project_id, name, voltage, and circuit_count', () => {
    const result = parseWithZod(CreatePDRackSchema, {
      location: 'FOH'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'project_id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
      expect(result.errors.some((e) => e.field === 'voltage')).toBe(true);
      expect(result.errors.some((e) => e.field === 'circuit_count')).toBe(true);
    }
  });

  it('should accept optional fields', () => {
    const result = parseWithZod(CreatePDRackSchema, {
      project_id: 'project-1',
      name: 'PD Rack FOH',
      voltage: 120,
      circuit_count: 12,
      rack_identifier: 'FOH',
      is_dual_voltage: true,
      secondary_voltage: 208,
      phase_config: 'three',
      amps_per_breaker: 20,
      location: 'Front of House',
      building_service: 'Service B',
      notes: 'FOH power'
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdatePDRackSchema', () => {
  it('should require id', () => {
    const result = parseWithZod(UpdatePDRackSchema, {
      name: 'Updated PD Rack'
    });
    expect(result.success).toBe(false);
  });

  it('should allow partial updates with only id', () => {
    const result = parseWithZod(UpdatePDRackSchema, {
      id: 'pd-1'
    });
    expect(result.success).toBe(true);
  });

  it('should allow updating individual fields', () => {
    const result = parseWithZod(UpdatePDRackSchema, {
      id: 'pd-1',
      voltage: 240,
      amps_per_breaker: 30
    });
    expect(result.success).toBe(true);
  });
});

describe('ModuleTypeSchema', () => {
  it('should accept all valid module type values', () => {
    const validValues = ['dimmer', 'relay', 'constant_current', 'thrupower'];
    for (const value of validValues) {
      const result = ModuleTypeSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid module type values', () => {
    const invalidValues = ['led', 'switch', '', 'DIMMER', 0];
    for (const value of invalidValues) {
      const result = ModuleTypeSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });
});

describe('PhaseConfigSchema', () => {
  it('should accept all valid phase config values', () => {
    const validValues = ['single', 'split', 'three'];
    for (const value of validValues) {
      const result = PhaseConfigSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid phase config values', () => {
    const invalidValues = ['dual', 'quad', '', 'SINGLE', 3];
    for (const value of invalidValues) {
      const result = PhaseConfigSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });
});

describe('CircuitCountSchema', () => {
  it('should accept all valid circuit count values', () => {
    const validValues = [12, 24, 48, 96];
    for (const value of validValues) {
      const result = CircuitCountSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid circuit count values', () => {
    const invalidValues = [6, 36, 50, 100, 0, -12, 'twelve'];
    for (const value of invalidValues) {
      const result = CircuitCountSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });
});

describe('VoltageSchema', () => {
  it('should accept all valid voltage values', () => {
    const validValues = [120, 208, 230, 240];
    for (const value of validValues) {
      const result = VoltageSchema.safeParse(value);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid voltage values', () => {
    const invalidValues = [110, 220, 277, 480, 0, -120, 'one-twenty'];
    for (const value of invalidValues) {
      const result = VoltageSchema.safeParse(value);
      expect(result.success).toBe(false);
    }
  });
});

describe('DimmerRackModuleSchema', () => {
  const validModule = {
    id: 'module-1',
    created_at: Date.now(),
    updated_at: Date.now(),
    rack_id: 'dimmer-1',
    start_circuit: 1,
    end_circuit: 12,
    module_type: 'dimmer'
  };

  it('should validate a complete dimmer rack module', () => {
    const result = parseWithZod(DimmerRackModuleSchema, validModule);
    expect(result.success).toBe(true);
  });

  it('should require rack_id, start_circuit, end_circuit, and module_type', () => {
    const result = parseWithZod(CreateDimmerRackModuleSchema, {
      notes: 'test'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.field === 'rack_id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'start_circuit')).toBe(true);
      expect(result.errors.some((e) => e.field === 'end_circuit')).toBe(true);
      expect(result.errors.some((e) => e.field === 'module_type')).toBe(true);
    }
  });

  it('should not require id/timestamps for CreateDimmerRackModuleSchema', () => {
    const result = parseWithZod(CreateDimmerRackModuleSchema, {
      rack_id: 'dimmer-1',
      start_circuit: 1,
      end_circuit: 12,
      module_type: 'relay'
    });
    expect(result.success).toBe(true);
  });

  it('should require only id for UpdateDimmerRackModuleSchema', () => {
    const result = parseWithZod(UpdateDimmerRackModuleSchema, {
      id: 'module-1',
      module_type: 'thrupower'
    });
    expect(result.success).toBe(true);
  });

  it('should reject UpdateDimmerRackModuleSchema without id', () => {
    const result = parseWithZod(UpdateDimmerRackModuleSchema, {
      module_type: 'dimmer'
    });
    expect(result.success).toBe(false);
  });

  it('should require positive start_circuit and end_circuit', () => {
    const resultZero = parseWithZod(CreateDimmerRackModuleSchema, {
      rack_id: 'dimmer-1',
      start_circuit: 0,
      end_circuit: 12,
      module_type: 'dimmer'
    });
    expect(resultZero.success).toBe(false);

    const resultNeg = parseWithZod(CreateDimmerRackModuleSchema, {
      rack_id: 'dimmer-1',
      start_circuit: 1,
      end_circuit: -1,
      module_type: 'dimmer'
    });
    expect(resultNeg.success).toBe(false);
  });

  it('should accept optional watts_per_circuit and notes', () => {
    const result = parseWithZod(CreateDimmerRackModuleSchema, {
      rack_id: 'dimmer-1',
      start_circuit: 13,
      end_circuit: 24,
      module_type: 'constant_current',
      watts_per_circuit: 1200,
      notes: 'LED modules'
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative watts_per_circuit', () => {
    const result = parseWithZod(CreateDimmerRackModuleSchema, {
      rack_id: 'dimmer-1',
      start_circuit: 1,
      end_circuit: 12,
      module_type: 'dimmer',
      watts_per_circuit: -100
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid module_type', () => {
    const result = parseWithZod(CreateDimmerRackModuleSchema, {
      rack_id: 'dimmer-1',
      start_circuit: 1,
      end_circuit: 12,
      module_type: 'led'
    });
    expect(result.success).toBe(false);
  });
});
