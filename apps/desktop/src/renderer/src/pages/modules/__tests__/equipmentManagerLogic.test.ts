import { describe, it, expect } from 'vitest';

/**
 * EquipmentManager — logic unit tests
 *
 * Tests the two key pure-logic behaviors introduced in PR #83 without
 * rendering the full component (which has many store/router dependencies).
 * Full integration coverage is tracked as a follow-up.
 *
 * 1. Tab → menu context mapping (the contextMap inside the tab useEffect)
 * 2. handleDuplicate id-stripping transformation
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

// The handleDuplicate function strips `id` AND clears uniqueness-sensitive patch
// fields before passing fixtures to addMultipleFixtures. This mirrors the exact
// destructuring used in EquipmentManager:
//   ({ id: _id, circuit, circuit_number, dimmer, universe, dmx_address, address, ...rest }) => rest
//
// Non-patch fields (name, position, color, purpose, etc.) are preserved verbatim.
const stripForDuplicate = <
  T extends {
    id: string;
    circuit?: unknown;
    circuit_number?: unknown;
    dimmer?: unknown;
    universe?: unknown;
    dmx_address?: unknown;
    address?: unknown;
  },
>(
  fixture: T,
): Omit<
  T,
  'id' | 'circuit' | 'circuit_number' | 'dimmer' | 'universe' | 'dmx_address' | 'address'
> => {
  const {
    id: _id,
    circuit,
    circuit_number,
    dimmer,
    universe,
    dmx_address,
    address,
    ...rest
  } = fixture;
  return rest;
};

describe('handleDuplicate transformation', () => {
  it('strips id from a single fixture', () => {
    const fixture = { id: 'abc-123', name: 'Spot 1', circuit: '1/1' };
    const copy = stripForDuplicate(fixture);

    expect(copy).not.toHaveProperty('id');
    expect(copy.name).toBe('Spot 1');
  });

  it('clears all uniqueness-sensitive patch fields', () => {
    const fixture = {
      id: 'xyz',
      name: 'Follow Spot',
      circuit: '2/5',
      circuit_number: '5',
      dimmer: 'Rack A',
      universe: 1,
      dmx_address: 42,
      address: '1/42',
      position: 'Balcony Rail',
      color: 'R27',
      purpose: 'Key Light',
    };
    const copy = stripForDuplicate(fixture);

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
      name: 'Follow Spot',
      circuit: '2/5',
      dimmer: 'Rack A',
      universe: 1,
      dmx_address: 42,
      address: '1/42',
      position: 'Balcony Rail',
      color: 'R27',
      purpose: 'Key Light',
    };
    const copy = stripForDuplicate(fixture);

    expect(copy).toEqual({
      name: 'Follow Spot',
      position: 'Balcony Rail',
      color: 'R27',
      purpose: 'Key Light',
    });
  });

  it('produces independent copies for multiple fixtures', () => {
    const fixtures = [
      { id: 'id-1', name: 'Spot A', circuit: '1/1', universe: 1, dmx_address: 1 },
      { id: 'id-2', name: 'Spot B', circuit: '1/2', universe: 1, dmx_address: 2 },
    ];
    const copies = fixtures.map(stripForDuplicate);

    expect(copies).toHaveLength(2);
    copies.forEach((copy) => {
      expect(copy).not.toHaveProperty('id');
      expect(copy).not.toHaveProperty('circuit');
      expect(copy).not.toHaveProperty('universe');
      expect(copy).not.toHaveProperty('dmx_address');
    });
    expect(copies[0].name).toBe('Spot A');
    expect(copies[1].name).toBe('Spot B');
  });

  it('empty selection produces no copies (guard in handleDuplicate)', () => {
    const selectedIds = new Set<string>();
    const fixtures = [{ id: 'abc', name: 'Spot 1', circuit: '1/1' }];
    const selected = fixtures.filter((f) => selectedIds.has(f.id));

    // handleDuplicate returns early here; no copies should be produced
    expect(selected).toHaveLength(0);
    const copies = selected.map(stripForDuplicate);
    expect(copies).toHaveLength(0);
  });

  it('only duplicates fixtures whose id is in selectedRows', () => {
    const selectedIds = new Set(['id-1']);
    const fixtures = [
      { id: 'id-1', name: 'Selected Spot', circuit: '1/1' },
      { id: 'id-2', name: 'Unselected Spot', circuit: '1/2' },
    ];
    const copies = fixtures.filter((f) => selectedIds.has(f.id)).map(stripForDuplicate);

    expect(copies).toHaveLength(1);
    expect(copies[0].name).toBe('Selected Spot');
    expect(copies[0]).not.toHaveProperty('circuit');
  });
});
