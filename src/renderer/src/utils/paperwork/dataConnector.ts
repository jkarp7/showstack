/**
 * Data Connector
 * Bridge between Zustand stores and report renderer
 */

import { useFixtureStore } from '../../store/fixtureStore';
import { useInfrastructureStore } from '../../store/infrastructureStore';
import { ReportDataItem } from './reportOrganizer';

export async function getReportData(reportType: string, projectId: string): Promise<ReportDataItem[]> {
  // Get fixture data for fixture reports
  if (isFixtureReport(reportType)) {
    const fixtureData = getFixtureData(reportType);

    // Aggregate data for Power Summary only
    // Color/Gobo schedules use regular grouping (not aggregation)
    if (reportType === 'power-summary') {
      return await aggregatePowerSummary(fixtureData, projectId);
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
    'gobo-schedule'
  ].includes(reportType);
}

function isInfrastructureReport(reportType: string): boolean {
  return [
    'infrastructure-list',
    'network-summary',
    'port-assignments',
    'infrastructure-power',
    'infrastructure-location'
  ].includes(reportType);
}

function getFixtureData(reportType: string): ReportDataItem[] {
  const { fixtures } = useFixtureStore.getState();

  return fixtures.map(fixture => ({
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
    _raw: fixture
  }));
}

function getInfrastructureData(reportType: string): ReportDataItem[] {
  const { equipment } = useInfrastructureStore.getState();

  return equipment.map(item => ({
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
    _raw: item
  }));
}

export function calculateReportStatistics(data: ReportDataItem[]) {
  return {
    totalItems: data.length,
    totalPower: data.reduce((sum, item) => sum + (Number(item.wattage) || 0), 0),
    totalAmperage: data.reduce((sum, item) => sum + (Number(item.amperage) || 0), 0)
  };
}

/**
 * Aggregate fixtures by type for Power Summary report
 * Calculates amperage using actual rack voltage (208V or 120V)
 */
async function aggregatePowerSummary(fixtures: ReportDataItem[], projectId: string): Promise<ReportDataItem[]> {
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
    console.error('Error loading racks:', error);
  }

  // Create rack lookup maps (rack_id -> voltage)
  const rackVoltageMap = new Map<string, number>();
  dimmerRacks.forEach(rack => {
    if (rack.id && rack.voltage) {
      rackVoltageMap.set(rack.id, rack.voltage);
    }
  });
  pdRacks.forEach(rack => {
    if (rack.id && rack.voltage) {
      rackVoltageMap.set(rack.id, rack.voltage);
    }
  });

  const grouped = new Map<string, ReportDataItem[]>();

  // Group by type
  fixtures.forEach(fixture => {
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
      notes: ''
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
  fixtures.forEach(fixture => {
    const color = fixture.color || 'Unknown';
    if (!grouped.has(color)) {
      grouped.set(color, []);
    }
    grouped.get(color)!.push(fixture);
  });

  // Convert to aggregated rows
  const aggregated: ReportDataItem[] = [];
  grouped.forEach((items, color) => {
    items.forEach(item => {
      aggregated.push({
        color,
        quantity: items.length,
        type: item.type,
        position: item.position,
        unit: item.unit,
        channel: item.channel,
        notes: item.notes
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
  fixtures.forEach(fixture => {
    const gobo = fixture.gobo || 'Unknown';
    if (!grouped.has(gobo)) {
      grouped.set(gobo, []);
    }
    grouped.get(gobo)!.push(fixture);
  });

  // Convert to aggregated rows
  const aggregated: ReportDataItem[] = [];
  grouped.forEach((items, gobo) => {
    items.forEach(item => {
      aggregated.push({
        gobo,
        quantity: items.length,
        type: item.type,
        position: item.position,
        channel: item.channel,
        notes: item.notes
      });
    });
  });

  return aggregated.sort((a, b) => (a.gobo || '').localeCompare(b.gobo || ''));
}
