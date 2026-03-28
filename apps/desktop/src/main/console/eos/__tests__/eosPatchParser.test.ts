import { describe, it, expect } from 'vitest';
import { EosPatchParser } from '../eosPatchParser';

describe('EosPatchParser', () => {
  const parser = new EosPatchParser();

  // ─── parseChannelMessage ───────────────────────────────────────────────────

  describe('parseChannelMessage', () => {
    it('parses a fully-populated channel message', () => {
      const msg: [string, ...unknown[]] = [
        '/eos/out/patch/0',
        5,
        '1/42',
        'Source Four 26deg',
        '1st Electric 5',
        'spare unit',
      ];
      const result = parser.parseChannelMessage(msg as [string, ...(string | number | boolean)[]]);
      expect(result).toEqual({
        channelNumber: 5,
        universe: 1,
        address: 42,
        fixtureType: 'Source Four 26deg',
        label: '1st Electric 5',
        notes: 'spare unit',
      });
    });

    it('returns null if address string does not match patch pattern', () => {
      const msg: [string, ...unknown[]] = ['/eos/out/patch/count', 10];
      expect(
        parser.parseChannelMessage(msg as [string, ...(string | number | boolean)[]]),
      ).toBeNull();
    });

    it('returns null if channel number is missing', () => {
      const msg: [string] = ['/eos/out/patch/0'];
      expect(
        parser.parseChannelMessage(msg as unknown as [string, ...(string | number | boolean)[]]),
      ).toBeNull();
    });

    it('returns null if channel number is non-positive', () => {
      const msg: [string, ...unknown[]] = ['/eos/out/patch/0', 0, '1/1', 'Dimmer', '', ''];
      expect(
        parser.parseChannelMessage(msg as [string, ...(string | number | boolean)[]]),
      ).toBeNull();
    });

    it('handles un-patched channel (empty address string)', () => {
      const msg: [string, ...unknown[]] = ['/eos/out/patch/0', 3, '', 'Dimmer', 'SR 3', ''];
      const result = parser.parseChannelMessage(msg as [string, ...(string | number | boolean)[]]);
      expect(result?.universe).toBeNull();
      expect(result?.address).toBeNull();
    });

    it('parses high universe/address values', () => {
      const msg: [string, ...unknown[]] = ['/eos/out/patch/0', 200, '4/512', 'LED Par', '', ''];
      const result = parser.parseChannelMessage(msg as [string, ...(string | number | boolean)[]]);
      expect(result?.universe).toBe(4);
      expect(result?.address).toBe(512);
    });
  });

  // ─── parsePatch ───────────────────────────────────────────────────────────

  describe('parsePatch', () => {
    it('parses multiple messages and sorts by channel number', () => {
      const messages: [string, ...(string | number | boolean)[]][] = [
        ['/eos/out/patch/1', 10, '1/10', 'Fresnel', 'Balcony 10', ''],
        ['/eos/out/patch/0', 1, '1/1', 'Leko', 'SR 1', ''],
        ['/eos/out/patch/2', 5, '1/5', 'Wash', 'OH 5', ''],
      ];
      const result = parser.parsePatch(messages);
      expect(result).toHaveLength(3);
      expect(result[0].channelNumber).toBe(1);
      expect(result[1].channelNumber).toBe(5);
      expect(result[2].channelNumber).toBe(10);
    });

    it('silently skips unparseable messages', () => {
      const messages: [string, ...(string | number | boolean)[]][] = [
        ['/eos/out/patch/count', 2],
        ['/eos/out/patch/0', 1, '1/1', 'Leko', 'SR 1', ''],
      ];
      const result = parser.parsePatch(messages);
      expect(result).toHaveLength(1);
    });

    it('returns empty array for empty input', () => {
      expect(parser.parsePatch([])).toEqual([]);
    });
  });

  // ─── toImportedFixture ────────────────────────────────────────────────────

  describe('toImportedFixture', () => {
    it('maps EosPatchChannel to ImportedFixture correctly', () => {
      const channel = {
        channelNumber: 5,
        universe: 1,
        address: 42,
        fixtureType: 'Source Four 26deg',
        label: '1st Electric 5',
        notes: 'check focus',
      };
      const result = parser.toImportedFixture(channel);
      expect(result.channel).toBe('5');
      expect(result.universe).toBe(1);
      expect(result.dmx_address).toBe(42);
      expect(result.type).toBe('ETC Source Four 26°');
      expect(result.position).toBe('1st Electric');
      expect(result.unit_number).toBe(5);
      expect(result.notes).toBe('check focus');
      expect(result.eos_channel).toBe(5);
      expect(result.eos_profile).toBe('Source Four 26deg');
    });

    it('handles label with no trailing number', () => {
      const channel = {
        channelNumber: 1,
        universe: null,
        address: null,
        fixtureType: 'Dimmer',
        label: 'Downstage',
        notes: '',
      };
      const result = parser.toImportedFixture(channel);
      expect(result.position).toBe('Downstage');
      expect(result.unit_number).toBeNull();
    });

    it('preserves unknown Eos profile names as-is', () => {
      const channel = {
        channelNumber: 1,
        universe: 1,
        address: 1,
        fixtureType: 'Custom Profile XYZ',
        label: '',
        notes: '',
      };
      const result = parser.toImportedFixture(channel);
      expect(result.type).toBe('Custom Profile XYZ');
    });
  });
});
