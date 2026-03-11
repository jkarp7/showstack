import { Fixture } from '../types';
import { InfrastructureEquipment } from '../types/infrastructure';
import { ValidationIssue } from '../types/validation';

// ── Fixtures ────────────────────────────────────────────────────────────────

function detectDuplicateDmx(fixtures: Fixture[]): ValidationIssue[] {
  const map = new Map<string, string[]>(); // key → fixture ids

  for (const f of fixtures) {
    if (f.universe == null || f.dmx_address == null) continue;
    const key = `${f.universe}:${f.dmx_address}`;
    const ids = map.get(key) ?? [];
    ids.push(f.id);
    map.set(key, ids);
  }

  const issues: ValidationIssue[] = [];
  for (const [key, ids] of map) {
    if (ids.length < 2) continue;
    const [universe, address] = key.split(':');
    issues.push({
      id: `dup-dmx-${key}`,
      severity: 'error',
      sidebarItem: 'fixtures',
      type: 'Duplicate DMX Address',
      message: `Universe ${universe}, address ${address} is assigned to ${ids.length} fixtures.`,
      entityIds: ids,
    });
  }
  return issues;
}

function detectDuplicateChannel(fixtures: Fixture[]): ValidationIssue[] {
  const map = new Map<string, string[]>(); // channel → fixture ids

  for (const f of fixtures) {
    const ch = f.channel?.trim();
    if (!ch) continue;
    const ids = map.get(ch) ?? [];
    ids.push(f.id);
    map.set(ch, ids);
  }

  const issues: ValidationIssue[] = [];
  for (const [ch, ids] of map) {
    if (ids.length < 2) continue;
    issues.push({
      id: `dup-ch-${ch}`,
      severity: 'error',
      sidebarItem: 'fixtures',
      type: 'Duplicate Channel',
      message: `Channel ${ch} is assigned to ${ids.length} fixtures.`,
      entityIds: ids,
    });
  }
  return issues;
}

function detectMissingCircuit(fixtures: Fixture[]): ValidationIssue[] {
  const ids = fixtures
    .filter((f) => f.dmx_address != null && !f.circuit?.trim() && !f.circuit_number?.trim())
    .map((f) => f.id);

  if (!ids.length) return [];
  return [
    {
      id: 'missing-circuit',
      severity: 'warning',
      sidebarItem: 'fixtures',
      type: 'Missing Circuit',
      message: `${ids.length} fixture${ids.length === 1 ? '' : 's'} ${ids.length === 1 ? 'has' : 'have'} a DMX address but no circuit assigned.`,
      entityIds: ids,
    },
  ];
}

// ── Infrastructure ───────────────────────────────────────────────────────────

function detectPortOverCapacity(equipment: InfrastructureEquipment[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const eq of equipment) {
    const capacity = eq.port_count;
    if (capacity == null) continue;
    const assigned = eq.port_assignments?.length ?? 0;
    if (assigned > capacity) {
      issues.push({
        id: `port-over-cap-${eq.id}`,
        severity: 'error',
        sidebarItem: 'infrastructure',
        type: 'Port Over Capacity',
        message: `"${eq.name}" has ${assigned} port assignments but only ${capacity} ports.`,
        entityIds: [eq.id],
      });
    }
  }
  return issues;
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function runValidation(
  fixtures: Fixture[],
  equipment: InfrastructureEquipment[],
): ValidationIssue[] {
  return [
    ...detectDuplicateDmx(fixtures),
    ...detectDuplicateChannel(fixtures),
    ...detectMissingCircuit(fixtures),
    ...detectPortOverCapacity(equipment),
  ];
}
