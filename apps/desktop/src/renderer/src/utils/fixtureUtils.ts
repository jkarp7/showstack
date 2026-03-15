import { Fixture } from '../types';

/**
 * Returns true if multiple fixtures sharing a DMX address are doing so intentionally.
 *
 * Three cases are recognized:
 *  1. All have the `two_fer` or `dimmer_doubles` color flag (explicit designation)
 *  2. All share the same non-empty circuit name AND circuit number (same physical circuit)
 *  3. All share the same non-empty dimmer assignment
 *
 * Any of the three conditions being true for the whole group suppresses the conflict.
 * Mixed groups (some flagged, some not; or different circuits) remain flagged.
 */
export function isIntentionalAddressSharing(fixtures: Fixture[]): boolean {
  if (fixtures.length < 2) return false;

  // 1. All have an intentional-sharing flag
  const SHARING_FLAGS = new Set(['two_fer', 'dimmer_doubles']);
  if (fixtures.every((f) => f.color_flag != null && SHARING_FLAGS.has(f.color_flag))) return true;

  // 2. All share the same non-empty circuit (name + number)
  const firstCircuit = fixtures[0].circuit?.trim();
  const firstCircuitNumber = fixtures[0].circuit_number?.trim();
  if (
    firstCircuit &&
    firstCircuitNumber &&
    fixtures.every(
      (f) => f.circuit?.trim() === firstCircuit && f.circuit_number?.trim() === firstCircuitNumber,
    )
  )
    return true;

  // 3. All share the same non-empty dimmer
  const firstDimmer = fixtures[0].dimmer?.trim();
  if (firstDimmer && fixtures.every((f) => f.dimmer?.trim() === firstDimmer)) return true;

  return false;
}

/**
 * Strips `id` and uniqueness-sensitive patch fields from a fixture before duplication.
 *
 * `id` is removed so `addMultipleFixtures` assigns a fresh UUID to each copy.
 * The patch fields below are cleared because duplicated fixtures should not inherit
 * conflicting address assignments from the original:
 *   - circuit / circuit_number — electrical circuit identity
 *   - dimmer                  — dimmer rack assignment
 *   - universe / dmx_address  — DMX address
 *   - address                 — computed composite address string
 *
 * Non-patch fields (name, position, color, purpose, notes, etc.) are preserved verbatim.
 *
 * ⚠️  DENYLIST APPROACH: this function strips known unique fields and spreads the rest.
 * If a new uniqueness-sensitive field is added to the Fixture type (e.g. a second
 * address field or a rack assignment), it will silently pass through to the copy.
 * When adding fields to Fixture, check whether they should be listed here too.
 */
export function stripFixtureForDuplicate(
  fixture: Fixture,
): Omit<
  Fixture,
  'id' | 'circuit' | 'circuit_number' | 'dimmer' | 'universe' | 'dmx_address' | 'address'
> {
  const {
    id: _id,
    circuit: _circuit,
    circuit_number: _circuit_number,
    dimmer: _dimmer,
    universe: _universe,
    dmx_address: _dmx_address,
    address: _address,
    ...rest
  } = fixture;
  return rest;
}
