/**
 * EosCommandBuilder
 *
 * Builds Eos OSC command strings from ShowStack fixture data.
 *
 * Eos accepts patch commands via the `/eos/newcmd` OSC address.
 * Command syntax (Eos command line language):
 *   Chan [channel] Patch [universe]/[address] [Type [profile]] [Label "[label]"]
 *
 * Reference: ETC Eos Family OSC Manual, "Command Line Commands via OSC"
 */

/** Minimum fixture fields required to build an Eos patch command */
export interface FixturePatchInput {
  channel?: string | number | null;
  universe?: number | null;
  dmx_address?: number | null;
  type?: string | null;
  position?: string | null;
  unit_number?: string | number | null;
}

export class EosCommandBuilder {
  /**
   * Build the Eos newcmd string to patch a single fixture.
   * Returns null if the minimum required fields (channel + address) are missing.
   *
   * Example output: `Chan 5 Patch 1/42 Type "Source Four 19deg" Label "1st Electric 1"`
   */
  buildPatchCommand(fixture: FixturePatchInput): string | null {
    const channel = fixture.channel != null ? String(fixture.channel).trim() : '';
    if (!channel) return null;

    const parts: string[] = [`Chan ${channel}`];

    if (fixture.universe != null && fixture.dmx_address != null) {
      parts.push(`Patch ${fixture.universe}/${fixture.dmx_address}`);
    }

    if (fixture.type) {
      const eosProfile = mapToEosProfile(fixture.type.trim());
      parts.push(`Type "${eosProfile}"`);
    }

    const label = buildLabel(fixture);
    if (label) {
      parts.push(`Label "${label}"`);
    }

    return parts.join(' ');
  }

  /**
   * Build patch commands for multiple fixtures.
   * Fixtures that produce null commands (missing channel) are silently skipped.
   */
  buildBatchPatchCommands(fixtures: FixturePatchInput[]): string[] {
    const commands: string[] = [];
    for (const f of fixtures) {
      const cmd = this.buildPatchCommand(f);
      if (cmd) commands.push(cmd);
    }
    return commands;
  }

  /**
   * Build an Eos command to update a channel's label only.
   * Useful for label-only sync without touching DMX patch.
   */
  buildLabelCommand(channel: string | number, label: string): string {
    return `Chan ${channel} Label "${label}"`;
  }

  /**
   * Build an Eos command to update a channel's notes field.
   */
  buildNotesCommand(channel: string | number, notes: string): string {
    return `Chan ${channel} Note "${notes}"`;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map a ShowStack fixture type to an Eos profile name.
 * Falls back to the raw ShowStack type for unmapped values.
 */
export function mapToEosProfile(showstackType: string): string {
  const mappings: Record<string, string> = {
    'ETC Source Four 19°': 'Source Four 19deg',
    'ETC Source Four 26°': 'Source Four 26deg',
    'ETC Source Four 36°': 'Source Four 36deg',
    'ETC Source Four 50°': 'Source Four 50deg',
    'ETC Source Four Jr Zoom 25-50°': 'Source Four Jr 25-50',
    'ETC Source Four PAR': 'Source Four PAR',
    'ETC Source Four Revolution': 'Source Four Revolution',
    'Martin MAC Aura': 'MAC Aura',
    'Martin MAC Viper Profile': 'MAC Viper Profile',
    'Martin MAC Viper Wash DX': 'MAC Viper Wash',
    'Robe BMFL Spot': 'Robe BMFL Spot',
    'Robe BMFL WashBeam': 'Robe BMFL Wash',
    'LED PAR': 'LED Par',
    'LED Strip': 'LED Strip',
    Dimmer: 'Dimmer',
    Fresnel: 'Fresnel',
    Leko: 'Leko',
    Spot: 'Spot',
    Wash: 'Wash',
  };
  return mappings[showstackType] ?? showstackType;
}

/** Combine position + unit_number into an Eos label string */
function buildLabel(fixture: FixturePatchInput): string {
  const parts: string[] = [];
  if (fixture.position) parts.push(String(fixture.position).trim());
  if (fixture.unit_number != null) parts.push(String(fixture.unit_number).trim());
  return parts.join(' ');
}
