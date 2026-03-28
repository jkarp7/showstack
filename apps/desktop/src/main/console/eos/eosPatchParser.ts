/**
 * EosPatchParser
 *
 * Parses raw Eos OSC patch messages into EosPatchChannel objects, then maps
 * them to ShowStack Partial<Fixture> records ready for import.
 *
 * Eos OSC patch message format (per /eos/out/patch/[index]):
 *   args[0]  channel number  (number)
 *   args[1]  address string  "universe/address", e.g. "1/42" — empty if un-patched
 *   args[2]  fixture type    (string) — Eos profile name
 *   args[3]  label           (string) — channel label shown in live display
 *   args[4]  notes           (string) — free-text notes field
 *
 * Fields beyond index 4 are ignored (forward-compatible with future Eos versions).
 */

import type { EosPatchChannel } from '../../../renderer/src/types/console';

/** ShowStack fixture fields that a patch import can populate. */
export interface ImportedFixture {
  channel: string | null;
  universe: number | null;
  dmx_address: number | null;
  type: string;
  position: string | null;
  unit_number: number | null;
  notes: string;
  /** Eos-specific metadata kept for round-trip fidelity */
  eos_channel: number;
  eos_profile: string;
}

/** Raw OSC message tuple */
type OscMessage = [string, ...(string | number | boolean)[]];

export class EosPatchParser {
  /**
   * Parse a single `/eos/out/patch/[index]` OSC message into an EosPatchChannel.
   * Returns null if the message cannot be parsed (wrong address, missing args, etc.).
   */
  parseChannelMessage(msg: OscMessage): EosPatchChannel | null {
    const [address, ...args] = msg;
    if (!/^\/eos\/out\/patch\/\d+$/.test(address)) return null;
    if (args.length < 1) return null;

    const channelNumber = Number(args[0]);
    if (!Number.isFinite(channelNumber) || channelNumber <= 0) return null;

    const { universe, address: dmxAddress } = parseEosAddress(String(args[1] ?? ''));
    const fixtureType = String(args[2] ?? '').trim();
    const label = String(args[3] ?? '').trim();
    const notes = String(args[4] ?? '').trim();

    return { channelNumber, universe, address: dmxAddress, fixtureType, label, notes };
  }

  /**
   * Parse a full set of patch messages (output of EosOSCClient.getPatch())
   * into an array of EosPatchChannel objects.
   * Messages that cannot be parsed are silently skipped.
   */
  parsePatch(messages: OscMessage[]): EosPatchChannel[] {
    const channels: EosPatchChannel[] = [];
    for (const msg of messages) {
      const ch = this.parseChannelMessage(msg);
      if (ch) channels.push(ch);
    }
    return channels.sort((a, b) => a.channelNumber - b.channelNumber);
  }

  /**
   * Convert an EosPatchChannel to a ShowStack ImportedFixture.
   * The label is parsed into position + unit_number using the heuristic that
   * the trailing integer (if present) is the unit number and the rest is position.
   */
  toImportedFixture(channel: EosPatchChannel): ImportedFixture {
    const { position, unitNumber } = parseEosLabel(channel.label);
    return {
      channel: String(channel.channelNumber),
      universe: channel.universe,
      dmx_address: channel.address,
      type: mapFromEosProfile(channel.fixtureType),
      position,
      unit_number: unitNumber,
      notes: channel.notes,
      eos_channel: channel.channelNumber,
      eos_profile: channel.fixtureType,
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse an Eos address string like "1/42" → { universe: 1, address: 42 }.
 * Returns nulls for un-patched channels (empty string or invalid format).
 */
function parseEosAddress(raw: string): { universe: number | null; address: number | null } {
  const match = raw.match(/^(\d+)\/(\d+)$/);
  if (!match) return { universe: null, address: null };
  return { universe: parseInt(match[1], 10), address: parseInt(match[2], 10) };
}

/**
 * Parse an Eos label into position and unit number.
 * Common formats:
 *   "1st Electric 1"  → position: "1st Electric",   unit: 1
 *   "FOH L 12"        → position: "FOH L",           unit: 12
 *   "Downstage"       → position: "Downstage",       unit: null
 */
function parseEosLabel(label: string): { position: string | null; unitNumber: number | null } {
  if (!label) return { position: null, unitNumber: null };
  const match = label.match(/^(.+?)\s+(\d+)$/);
  if (match) {
    return { position: match[1].trim(), unitNumber: parseInt(match[2], 10) };
  }
  return { position: label, unitNumber: null };
}

/**
 * Map an Eos profile name to a ShowStack fixture type string.
 * Falls back to the raw Eos profile name for unmapped types.
 */
function mapFromEosProfile(eosProfile: string): string {
  const mappings: Record<string, string> = {
    'Source Four 19deg': 'ETC Source Four 19°',
    'Source Four 26deg': 'ETC Source Four 26°',
    'Source Four 36deg': 'ETC Source Four 36°',
    'Source Four 50deg': 'ETC Source Four 50°',
    'Source Four Jr 25-50': 'ETC Source Four Jr Zoom 25-50°',
    'Source Four PAR': 'ETC Source Four PAR',
    'Source Four Revolution': 'ETC Source Four Revolution',
    Leko: 'Leko',
    Fresnel: 'Fresnel',
    'MAC Aura': 'Martin MAC Aura',
    'MAC Viper Profile': 'Martin MAC Viper Profile',
    'MAC Viper Wash': 'Martin MAC Viper Wash DX',
    'Robe BMFL Spot': 'Robe BMFL Spot',
    'Robe BMFL Wash': 'Robe BMFL WashBeam',
    Spot: 'Spot',
    Wash: 'Wash',
    'LED Par': 'LED PAR',
    'LED Strip': 'LED Strip',
    Dimmer: 'Dimmer',
  };
  return mappings[eosProfile] ?? eosProfile;
}
