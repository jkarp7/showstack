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
 */
export function stripFixtureForDuplicate(
  fixture: Fixture,
): Omit<
  Fixture,
  'id' | 'circuit' | 'circuit_number' | 'dimmer' | 'universe' | 'dmx_address' | 'address'
> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
}
