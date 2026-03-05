import { Fixture } from '../types';

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
