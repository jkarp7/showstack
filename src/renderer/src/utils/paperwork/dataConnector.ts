/**
 * Data Connector
 * Bridge between Zustand stores and report renderer
 */

import { useFixtureStore } from '../../store/fixtureStore';
import { useInfrastructureStore } from '../../store/infrastructureStore';
import { ReportDataItem } from './reportOrganizer';

export function getReportData(reportType: string, projectId: string): ReportDataItem[] {
  // Get fixture data for fixture reports
  if (isFixtureReport(reportType)) {
    return getFixtureData(reportType);
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
