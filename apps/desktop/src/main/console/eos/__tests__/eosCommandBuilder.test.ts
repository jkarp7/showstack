import { describe, it, expect } from 'vitest';
import { EosCommandBuilder, mapToEosProfile } from '../eosCommandBuilder';

describe('EosCommandBuilder', () => {
  const builder = new EosCommandBuilder();

  // ─── buildPatchCommand ────────────────────────────────────────────────────

  describe('buildPatchCommand', () => {
    it('builds a full patch command', () => {
      const result = builder.buildPatchCommand({
        channel: '5',
        universe: 1,
        dmx_address: 42,
        type: 'ETC Source Four 26°',
        position: '1st Electric',
        unit_number: 5,
      });
      expect(result).toBe('Chan 5 Patch 1/42 Type "Source Four 26deg" Label "1st Electric 5"');
    });

    it('omits patch address when universe/address are missing', () => {
      const result = builder.buildPatchCommand({
        channel: '3',
        type: 'ETC Source Four 19°',
      });
      expect(result).toBe('Chan 3 Type "Source Four 19deg"');
    });

    it('omits type when not provided', () => {
      const result = builder.buildPatchCommand({
        channel: '7',
        universe: 2,
        dmx_address: 100,
      });
      expect(result).toBe('Chan 7 Patch 2/100');
    });

    it('omits label when both position and unit_number are missing', () => {
      const result = builder.buildPatchCommand({
        channel: '1',
        universe: 1,
        dmx_address: 1,
        type: 'Dimmer',
      });
      expect(result).toBe('Chan 1 Patch 1/1 Type "Dimmer"');
    });

    it('returns null when channel is missing', () => {
      expect(builder.buildPatchCommand({ universe: 1, dmx_address: 1 })).toBeNull();
    });

    it('returns null when channel is null', () => {
      expect(builder.buildPatchCommand({ channel: null })).toBeNull();
    });

    it('preserves unknown fixture types as-is', () => {
      const result = builder.buildPatchCommand({
        channel: '1',
        type: 'My Custom Fixture',
      });
      expect(result).toBe('Chan 1 Type "My Custom Fixture"');
    });

    it('accepts numeric channel values', () => {
      const result = builder.buildPatchCommand({ channel: 10 });
      expect(result).toBe('Chan 10');
    });
  });

  // ─── buildBatchPatchCommands ──────────────────────────────────────────────

  describe('buildBatchPatchCommands', () => {
    it('returns commands for all valid fixtures', () => {
      const fixtures = [
        { channel: '1', universe: 1, dmx_address: 1 },
        { channel: '2', universe: 1, dmx_address: 2 },
      ];
      expect(builder.buildBatchPatchCommands(fixtures)).toHaveLength(2);
    });

    it('skips fixtures without a channel', () => {
      const fixtures = [{ universe: 1, dmx_address: 1 }, { channel: '2' }];
      const result = builder.buildBatchPatchCommands(fixtures);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('Chan 2');
    });

    it('returns empty array for empty input', () => {
      expect(builder.buildBatchPatchCommands([])).toEqual([]);
    });
  });

  // ─── buildLabelCommand ────────────────────────────────────────────────────

  describe('buildLabelCommand', () => {
    it('builds a label update command', () => {
      expect(builder.buildLabelCommand(5, 'FOH L 12')).toBe('Chan 5 Label "FOH L 12"');
    });

    it('accepts string channel', () => {
      expect(builder.buildLabelCommand('10', 'SR 10')).toBe('Chan 10 Label "SR 10"');
    });
  });

  // ─── buildNotesCommand ────────────────────────────────────────────────────

  describe('buildNotesCommand', () => {
    it('builds a notes update command', () => {
      expect(builder.buildNotesCommand(3, 'check gobo')).toBe('Chan 3 Note "check gobo"');
    });
  });

  // ─── mapToEosProfile ──────────────────────────────────────────────────────

  describe('mapToEosProfile', () => {
    it('maps known ShowStack types to Eos profiles', () => {
      expect(mapToEosProfile('ETC Source Four 19°')).toBe('Source Four 19deg');
      expect(mapToEosProfile('Martin MAC Aura')).toBe('MAC Aura');
      expect(mapToEosProfile('LED PAR')).toBe('LED Par');
    });

    it('returns the input unchanged for unknown types', () => {
      expect(mapToEosProfile('Unknown Fixture')).toBe('Unknown Fixture');
    });
  });
});
