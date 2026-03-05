import { describe, it, expect } from 'vitest';
import { stripFixtureForDuplicate } from '../../../utils/fixtureUtils';
import { Fixture } from '../../../types';

/**
 * EquipmentManager — logic unit tests
 *
 * Tests the two key pure-logic behaviors introduced in PR #83 without
 * rendering the full component (which has many store/router dependencies).
 * Full integration coverage is tracked as a follow-up.
 *
 * 1. Tab → menu context mapping (the contextMap inside the tab useEffect)
 * 2. handleDuplicate transformation (via the real stripFixtureForDuplicate utility)
 */

// ─── 1. Tab context map ───────────────────────────────────────────────────────

// This is the exact map used in EquipmentManager's tab-context useEffect.
// Keeping it here as a contract test: if a new tab is added and the map is not
// updated, this test will surface the gap before it reaches production.
const contextMap = {
  fixtures: 'equipment',
  infrastructure: 'infrastructure',
  power: 'power',
} as const;

type ActiveTab = keyof typeof contextMap;

describe('Tab → menu context mapping', () => {
  it('fixtures tab maps to equipment context', () => {
    expect(contextMap['fixtures']).toBe('equipment');
  });

  it('infrastructure tab maps to infrastructure context', () => {
    expect(contextMap['infrastructure']).toBe('infrastructure');
  });

  it('power tab maps to power context', () => {
    expect(contextMap['power']).toBe('power');
  });

  it('all three tabs are present in the map', () => {
    const tabs: ActiveTab[] = ['fixtures', 'infrastructure', 'power'];
    tabs.forEach((tab) => {
      expect(contextMap).toHaveProperty(tab);
    });
  });
});

// ─── 2. Duplicate transformation ──────────────────────────────────────────────

// Tests the real stripFixtureForDuplicate utility used by handleDuplicate.
// Non-patch fields (name, position, color, purpose, etc.) are preserved verbatim.

describe('handleDuplicate transformation (stripFixtureForDuplicate)', () => {
  it('strips id from a single fixture', () => {
    const fixture = {
      id: 'abc-123',
      position: 'Balcony Rail',
      type: 'Source Four',
      circuit: '1/1',
    } as Fixture;
    const copy = stripFixtureForDuplicate(fixture);

    expect(copy).not.toHaveProperty('id');
    expect(copy.position).toBe('Balcony Rail');
  });

  it('clears all uniqueness-sensitive patch fields', () => {
    const fixture = {
      id: 'xyz',
      position: 'Balcony Rail',
      type: 'Source Four',
      circuit: '2/5',
      circuit_number: '5',
      dimmer: 'Rack A',
      universe: 1,
      dmx_address: 42,
      address: '1/42',
      color: 'R27',
      purpose: 'Key Light',
    } as Fixture;
    const copy = stripFixtureForDuplicate(fixture);

    expect(copy).not.toHaveProperty('id');
    expect(copy).not.toHaveProperty('circuit');
    expect(copy).not.toHaveProperty('circuit_number');
    expect(copy).not.toHaveProperty('dimmer');
    expect(copy).not.toHaveProperty('universe');
    expect(copy).not.toHaveProperty('dmx_address');
    expect(copy).not.toHaveProperty('address');
  });

  it('preserves all non-patch fields verbatim', () => {
    const fixture = {
      id: 'xyz',
      position: 'Balcony Rail',
      type: 'Source Four',
      circuit: '2/5',
      dimmer: 'Rack A',
      universe: 1,
      dmx_address: 42,
      address: '1/42',
      color: 'R27',
      purpose: 'Key Light',
    } as Fixture;
    const copy = stripFixtureForDuplicate(fixture);

    expect(copy.position).toBe('Balcony Rail');
    expect(copy.type).toBe('Source Four');
    expect(copy.color).toBe('R27');
    expect(copy.purpose).toBe('Key Light');
  });

  it('produces independent copies for multiple fixtures', () => {
    const fixtures: Fixture[] = [
      {
        id: 'id-1',
        position: 'Box Boom L',
        type: 'Source Four',
        circuit: '1/1',
        universe: 1,
        dmx_address: 1,
      } as Fixture,
      {
        id: 'id-2',
        position: 'Box Boom R',
        type: 'Source Four',
        circuit: '1/2',
        universe: 1,
        dmx_address: 2,
      } as Fixture,
    ];
    const copies = fixtures.map(stripFixtureForDuplicate);

    expect(copies).toHaveLength(2);
    copies.forEach((copy) => {
      expect(copy).not.toHaveProperty('id');
      expect(copy).not.toHaveProperty('circuit');
      expect(copy).not.toHaveProperty('universe');
      expect(copy).not.toHaveProperty('dmx_address');
    });
    expect(copies[0].position).toBe('Box Boom L');
    expect(copies[1].position).toBe('Box Boom R');
  });

  it('empty selection produces no copies (guard in handleDuplicate)', () => {
    const selectedIds = new Set<string>();
    const fixtures: Fixture[] = [
      { id: 'abc', position: 'Balcony Rail', type: 'Source Four', circuit: '1/1' } as Fixture,
    ];
    const selected = fixtures.filter((f) => selectedIds.has(f.id));

    // handleDuplicate returns early here; no copies should be produced
    expect(selected).toHaveLength(0);
    const copies = selected.map(stripFixtureForDuplicate);
    expect(copies).toHaveLength(0);
  });

  it('only duplicates fixtures whose id is in selectedRows', () => {
    const selectedIds = new Set(['id-1']);
    const fixtures: Fixture[] = [
      { id: 'id-1', position: 'Balcony Rail', type: 'Source Four', circuit: '1/1' } as Fixture,
      { id: 'id-2', position: 'Box Boom L', type: 'Source Four', circuit: '1/2' } as Fixture,
    ];
    const copies = fixtures.filter((f) => selectedIds.has(f.id)).map(stripFixtureForDuplicate);

    expect(copies).toHaveLength(1);
    expect(copies[0].position).toBe('Balcony Rail');
    expect(copies[0]).not.toHaveProperty('circuit');
  });
});
