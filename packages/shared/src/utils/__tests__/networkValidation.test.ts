import { describe, it, expect } from 'vitest';
import { isValidIPv4, parseIPWithPort, isValidVLAN } from '../networkValidation';

describe('isValidIPv4', () => {
  it('accepts valid addresses', () => {
    expect(isValidIPv4('192.168.1.100')).toBe(true);
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('10.0.0.1')).toBe(true);
  });

  it('rejects octets > 255', () => {
    expect(isValidIPv4('256.0.0.1')).toBe(false);
    expect(isValidIPv4('999.999.999.999')).toBe(false);
    expect(isValidIPv4('192.168.1.256')).toBe(false);
  });

  it('rejects wrong number of octets', () => {
    expect(isValidIPv4('192.168.1')).toBe(false);
    expect(isValidIPv4('192.168.1.1.1')).toBe(false);
    expect(isValidIPv4('')).toBe(false);
  });

  it('rejects non-numeric parts', () => {
    expect(isValidIPv4('192.168.one.1')).toBe(false);
    expect(isValidIPv4('192.168.1.x')).toBe(false);
  });

  it('rejects missing octets', () => {
    expect(isValidIPv4('192.168..1')).toBe(false);
  });
});

describe('parseIPWithPort', () => {
  it('parses plain IP with no port', () => {
    expect(parseIPWithPort('192.168.1.100')).toEqual({ ip: '192.168.1.100' });
  });

  it('parses IP with port', () => {
    expect(parseIPWithPort('192.168.1.100:3032')).toEqual({ ip: '192.168.1.100', port: 3032 });
  });

  it('accepts port 0', () => {
    expect(parseIPWithPort('10.0.0.1:0')).toEqual({ ip: '10.0.0.1', port: 0 });
  });

  it('accepts port 65535', () => {
    expect(parseIPWithPort('10.0.0.1:65535')).toEqual({ ip: '10.0.0.1', port: 65535 });
  });

  it('rejects port 65536', () => {
    expect(parseIPWithPort('10.0.0.1:65536')).toBeNull();
  });

  it('returns null for invalid IP', () => {
    expect(parseIPWithPort('999.0.0.1')).toBeNull();
    expect(parseIPWithPort('not-an-ip')).toBeNull();
  });

  it('returns null for non-numeric port', () => {
    expect(parseIPWithPort('192.168.1.1:abc')).toBeNull();
  });

  it('handles trailing colon as no port', () => {
    expect(parseIPWithPort('192.168.1.1:')).toEqual({ ip: '192.168.1.1' });
  });
});

describe('isValidVLAN', () => {
  it('accepts valid VLAN IDs', () => {
    expect(isValidVLAN(1)).toBe(true);
    expect(isValidVLAN(4094)).toBe(true);
    expect(isValidVLAN(100)).toBe(true);
  });

  it('rejects 0', () => {
    expect(isValidVLAN(0)).toBe(false);
  });

  it('rejects 4095', () => {
    expect(isValidVLAN(4095)).toBe(false);
  });

  it('rejects negative values', () => {
    expect(isValidVLAN(-1)).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(isValidVLAN(10.5)).toBe(false);
  });
});
