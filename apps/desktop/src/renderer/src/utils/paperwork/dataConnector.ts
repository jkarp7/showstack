/**
 * Data Connector
 * Bridge between Zustand stores and report renderer
 */

import { logger } from '../logger';
import { useFixtureStore } from '../../store/fixtureStore';
import { useInfrastructureStore } from '../../store/infrastructureStore';
import { useGroupStore } from '../../store/groupStore';
import { computeFixtureGroupMap } from '../groupMembership';
import { ReportDataItem } from './reportOrganizer';
import {
  parseFrameSize,
  calculateCutsPerSheet,
  calculateSheetsNeeded,
  formatFrameSize,
} from './colorCutCalculator';
import { splitDualGelCode, getGelManufacturer } from '../gelColors';

export async function getReportData(
  reportType: string,
  projectId: string,
): Promise<ReportDataItem[]> {
  // Get fixture data for fixture reports
  if (isFixtureReport(reportType)) {
    const fixtureData = getFixtureData(reportType);

    // Aggregate data for Power Summary and Color Cut Report
    // Color/Gobo schedules use regular grouping (not aggregation)
    if (reportType === 'power-summary') {
      return await aggregatePowerSummary(fixtureData, projectId);
    }

    if (reportType === 'color-cut-report') {
      return aggregateColorCutReport(fixtureData);
    }

    return fixtureData;
  }

  // Get infrastructure data for infrastructure reports
  if (isInfrastructureReport(reportType)) {
    return getInfrastructureData(reportType);
  }

  return [];
}

function isFixtureReport(reportType: string): boolean {
  return [
    'channel-hookup',
    'dimmer-schedule',
    'circuit-list',
    'dmx-addresses',
    'power-summary',
    'color-schedule',
    'gobo-schedule',
    'color-cut-report',
  ].includes(reportType);
}

function isInfrastructureReport(reportType: string): boolean {
  return [
    'infrastructure-list',
    'network-summary',
    'port-assignments',
    'infrastructure-power',
    'infrastructure-location',
  ].includes(reportType);
}

function getFixtureData(reportType: string): ReportDataItem[] {
  const { fixtures } = useFixtureStore.getState();
  const { groups, pinsByGroup } = useGroupStore.getState();

  // Pre-compute fixture→groups map so `group` field is available for groupBy
  const fixtureGroupMap = computeFixtureGroupMap(groups, fixtures, pinsByGroup);

  return fixtures.map((fixture) => {
    const fixtureGroups = fixtureGroupMap.get(fixture.id) ?? [];
    return {
      id: fixture.id,
      channel: fixture.channel,
      dimmer: fixture.dimmer,
      circuit: fixture.circuit_number,
      position: fixture.position,
      unit: fixture.unit_number,
      type: fixture.type,
      manufacturer: fixture.manufacturer,
      model: fixture.model,
      wattage: fixture.wattage,
      amperage: fixture.wattage ? fixture.wattage / 120 : 0,
      purpose: fixture.purpose,
      color: fixture.color,
      gobo: fixture.gobo,
      accessories: fixture.accessories,
      universe: fixture.universe,
      dmx_address: fixture.dmx_address,
      notes: fixture.notes,
      group: fixtureGroups.map((g) => g.name).join(', '),
      _raw: fixture,
    };
  });
}

function getInfrastructureData(reportType: string): ReportDataItem[] {
  const { equipment } = useInfrastructureStore.getState();

  return equipment.map((item) => ({
    id: item.id,
    name: item.name,
    manufacturer: item.manufacturer,
    model: item.model,
    type: item.category,
    category: item.category,
    ip_address: item.ip_address,
    mac_address: item.mac_address,
    hostname: item.hostname,
    port_count: item.port_count,
    location: item.location,
    voltage: item.voltage,
    wattage: item.wattage,
    amperage: item.amperage,
    circuit: item.circuit,
    status: item.status,
    notes: item.notes,
    _raw: item,
  }));
}

export function calculateReportStatistics(data: ReportDataItem[]) {
  return {
    totalItems: data.length,
    totalPower: data.reduce((sum, item) => sum + (Number(item.wattage) || 0), 0),
    totalAmperage: data.reduce((sum, item) => sum + (Number(item.amperage) || 0), 0),
  };
}

/**
 * Aggregate fixtures by type for Power Summary report
 * Calculates amperage using actual rack voltage (208V or 120V)
 */
async function aggregatePowerSummary(
  fixtures: ReportDataItem[],
  projectId: string,
): Promise<ReportDataItem[]> {
  // Load racks to get voltage information
  let dimmerRacks: any[] = [];
  let pdRacks: any[] = [];

  try {
    if (window.api?.dimmerRacks) {
      dimmerRacks = await window.api.dimmerRacks.getAll(projectId);
    }
    if (window.api?.pdRacks) {
      pdRacks = await window.api.pdRacks.getAll(projectId);
    }
  } catch (error) {
    logger.error('Error loading racks:', error);
  }

  // Create rack lookup maps (rack_id -> voltage)
  const rackVoltageMap = new Map<string, number>();
  dimmerRacks.forEach((rack) => {
    if (rack.id && rack.voltage) {
      rackVoltageMap.set(rack.id, rack.voltage);
    }
  });
  pdRacks.forEach((rack) => {
    if (rack.id && rack.voltage) {
      rackVoltageMap.set(rack.id, rack.voltage);
    }
  });

  const grouped = new Map<string, ReportDataItem[]>();

  // Group by type
  fixtures.forEach((fixture) => {
    const type = fixture.type || 'Unknown';
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    grouped.get(type)!.push(fixture);
  });

  // Convert to aggregated rows
  const aggregated: ReportDataItem[] = [];
  grouped.forEach((items, type) => {
    const quantity = items.length;
    const wattage = items[0]?.wattage || 0;

    // Get voltage from rack assignment, default to 120V if no rack
    const firstFixture = items[0]?._raw;
    let voltage = 120; // Default
    if (firstFixture?.dimmer_rack_id && rackVoltageMap.has(firstFixture.dimmer_rack_id)) {
      voltage = rackVoltageMap.get(firstFixture.dimmer_rack_id)!;
    } else if (firstFixture?.pd_rack_id && rackVoltageMap.has(firstFixture.pd_rack_id)) {
      voltage = rackVoltageMap.get(firstFixture.pd_rack_id)!;
    }

    // Calculate amperage using actual voltage
    const amperage = wattage ? wattage / voltage : 0;
    const total_watts = quantity * wattage;
    const total_amps = quantity * amperage;

    aggregated.push({
      type,
      quantity,
      wattage,
      amperage,
      total_watts,
      total_amps,
      notes: '',
    });
  });

  return aggregated.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
}

/**
 * Aggregate fixtures by color for Color Schedule report
 */
function aggregateColorSchedule(fixtures: ReportDataItem[]): ReportDataItem[] {
  const grouped = new Map<string, ReportDataItem[]>();

  // Group by color
  fixtures.forEach((fixture) => {
    const color = fixture.color || 'Unknown';
    if (!grouped.has(color)) {
      grouped.set(color, []);
    }
    grouped.get(color)!.push(fixture);
  });

  // Convert to aggregated rows
  const aggregated: ReportDataItem[] = [];
  grouped.forEach((items, color) => {
    items.forEach((item) => {
      aggregated.push({
        color,
        quantity: items.length,
        type: item.type,
        position: item.position,
        unit: item.unit,
        channel: item.channel,
        notes: item.notes,
      });
    });
  });

  return aggregated.sort((a, b) => (a.color || '').localeCompare(b.color || ''));
}

/**
 * Aggregate fixtures by gobo for Gobo Schedule report
 */
function aggregateGoboSchedule(fixtures: ReportDataItem[]): ReportDataItem[] {
  const grouped = new Map<string, ReportDataItem[]>();

  // Group by gobo
  fixtures.forEach((fixture) => {
    const gobo = fixture.gobo || 'Unknown';
    if (!grouped.has(gobo)) {
      grouped.set(gobo, []);
    }
    grouped.get(gobo)!.push(fixture);
  });

  // Convert to aggregated rows
  const aggregated: ReportDataItem[] = [];
  grouped.forEach((items, gobo) => {
    items.forEach((item) => {
      aggregated.push({
        gobo,
        quantity: items.length,
        type: item.type,
        position: item.position,
        channel: item.channel,
        notes: item.notes,
      });
    });
  });

  return aggregated.sort((a, b) => (a.gobo || '').localeCompare(b.gobo || ''));
}

/**
 * Aggregate color cut data
 * Groups by gel code + frame size and calculates sheets needed
 */
function aggregateColorCutReport(fixtures: ReportDataItem[]): ReportDataItem[] {
  interface ColorCutKey {
    gelCode: string;
    frameSize: string;
  }

  const grouped = new Map<string, { count: number; key: ColorCutKey; rawFrameSize: string }>();

  // Group fixtures by color + frame size
  fixtures.forEach((fixture) => {
    const color = fixture.color || fixture._raw?.color;
    const colorFrame = fixture._raw?.color_frame;

    if (!color) return; // Skip fixtures without color

    // Split dual colors (e.g., "L202+R119")
    const gelCodes = splitDualGelCode(color);

    gelCodes.forEach((gelCode) => {
      const trimmedGelCode = gelCode.trim().toUpperCase();
      const frameSize = colorFrame || 'Unknown';
      const key = `${trimmedGelCode}|${frameSize}`;

      if (grouped.has(key)) {
        grouped.get(key)!.count++;
      } else {
        grouped.set(key, {
          count: 1,
          key: { gelCode: trimmedGelCode, frameSize },
          rawFrameSize: colorFrame || '',
        });
      }
    });
  });

  // Convert to report rows
  const aggregated: ReportDataItem[] = [];
  grouped.forEach(({ count, key, rawFrameSize }) => {
    const parsedFrameSize = parseFrameSize(rawFrameSize);
    const cutsPerSheet = parsedFrameSize ? calculateCutsPerSheet(parsedFrameSize) : 0;
    const sheetsNeeded = cutsPerSheet > 0 ? calculateSheetsNeeded(count, cutsPerSheet) : count;
    const formattedFrameSize = parsedFrameSize ? formatFrameSize(parsedFrameSize) : key.frameSize;

    aggregated.push({
      gel_code: key.gelCode,
      manufacturer: getGelManufacturer(key.gelCode),
      frame_size: formattedFrameSize,
      cuts_needed: count,
      cuts_per_sheet: cutsPerSheet,
      sheets_needed: sheetsNeeded,
    });
  });

  // Sort by gel code
  return aggregated.sort((a, b) => (a.gel_code || '').localeCompare(b.gel_code || ''));
}
