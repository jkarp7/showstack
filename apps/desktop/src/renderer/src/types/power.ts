/**
 * Power distribution types for ShowStack
 * Supports dimmer racks and PD (Power Distribution) racks
 */

// ============================================
// Rack Types
// ============================================

export type ModuleType = 'dimmer' | 'relay' | 'constant_current' | 'thrupower';
export type PhaseConfig = 'single' | 'split' | 'three';
export type Phase = 'A' | 'B' | 'C';

/**
 * Dimmer Rack Module - defines module type for a circuit range
 */
export interface DimmerRackModule {
  id: string;
  rack_id: string;
  start_circuit: number;
  end_circuit: number;
  module_type: ModuleType;
  watts_per_circuit?: number;
  notes?: string;
  created_at: number;
  updated_at: number;
}

/**
 * Dimmer Rack - for dimmed loads (conventional fixtures, LED with dimming)
 */
export interface DimmerRack {
  id: string;
  project_id: string;
  name: string;
  rack_identifier?: string; // Identifier for circuit naming (e.g., "A", "FOH", "ML", "DECK")
  manufacturer?: string;
  model?: string;
  circuit_count: number; // 12, 24, 48, or 96
  module_type?: ModuleType;
  channels_per_module?: number;
  watts_per_module?: number;
  location?: string;
  notes?: string;
  building_service?: string; // Building electrical service (Service A, B, C, etc.)
  created_at: number;
  updated_at: number;
}

/**
 * PD (Power Distribution) Rack - for direct power (non-dimmed loads)
 */
export interface PDRack {
  id: string;
  project_id: string;
  name: string;
  rack_identifier?: string; // Identifier for circuit naming (e.g., "Z", "FOH", "DECK")
  voltage: number; // 120, 208, 230, or 240
  is_dual_voltage?: boolean; // Rack has both 120V and 208V outputs (separate circuits)
  secondary_voltage?: number; // Secondary voltage if dual voltage (e.g., 208 when primary is 120)
  circuit_count: number; // 12, 24, 48, or 96
  phase_config?: PhaseConfig;
  amps_per_breaker?: number;
  location?: string;
  notes?: string;
  building_service?: string; // Building electrical service (Service A, B, C, etc.)
  created_at: number;
  updated_at: number;
}

/**
 * Extended rack with usage statistics
 */
export interface DimmerRackWithUsage extends DimmerRack {
  circuits_used: number;
  capacity_percentage: number;
}

export interface PDRackWithUsage extends PDRack {
  circuits_used: number;
  capacity_percentage: number;
}

// ============================================
// Power Summary Types
// ============================================

/**
 * Power summary for a single rack
 */
export interface RackPowerSummary {
  rack_id: string;
  rack_name: string;
  rack_type: 'dimmer' | 'pd';
  total_capacity_kw: number;
  total_load_kw: number;
  utilization_percentage: number;
  circuits_total: number;
  circuits_used: number;
  circuits_available: number;
  warnings: string[];
}

/**
 * Phase balance information (for 3-phase systems)
 */
export interface PhaseBalance {
  phase_a_load: number; // in amps or kW
  phase_b_load: number;
  phase_c_load: number;
  total_load: number;
  average_load: number;
  max_imbalance_percentage: number; // 0-100, where >15% = warning, >25% = critical
  is_balanced: boolean;
  warnings: string[];
}

/**
 * Power summary grouped by building service
 */
export interface ServicePowerSummary {
  service_name: string; // e.g., "Service A", "Service B", "Unassigned"
  total_capacity_kw: number;
  total_load_kw: number;
  utilization_percentage: number;
  racks: RackPowerSummary[];
  warnings: string[];
}

/**
 * Overall power summary for the entire project
 */
export interface ProjectPowerSummary {
  total_load_kw: number;
  total_capacity_kw: number;
  overall_utilization: number;
  dimmer_racks: RackPowerSummary[];
  pd_racks: RackPowerSummary[];
  services?: ServicePowerSummary[]; // Grouped by building service
  phase_balance?: PhaseBalance;
  warnings: PowerWarning[];
  critical_warnings: PowerWarning[];
}

/**
 * Power warning/alert
 */
export interface PowerWarning {
  type: 'capacity' | 'phase_imbalance' | 'overload' | 'missing_data';
  severity: 'warning' | 'critical';
  message: string;
  rack_id?: string;
  rack_name?: string;
}

// ============================================
// Fixture Power Assignment
// ============================================

/**
 * Power assignment for a fixture (extends base fixture type)
 */
export interface FixturePowerAssignment {
  // Dimmer rack assignment
  dimmer_rack_id?: string;
  dimmer_module_number?: number;
  dimmer_channel_number?: number;

  // PD rack assignment
  pd_rack_id?: string;
  pd_circuit_number?: number;
  pd_breaker_number?: number;

  // Power characteristics
  wattage?: number;
  amperage?: number;
  phase?: Phase;
}

// ============================================
// Form/UI Types
// ============================================

/**
 * Form data for creating/editing a dimmer rack
 */
export interface DimmerRackFormData {
  name: string;
  rack_identifier?: string; // Identifier (e.g., "A", "FOH", "ML", "DECK")
  manufacturer?: string;
  model?: string;
  circuit_count: 12 | 24 | 48 | 96;
  module_type?: ModuleType;
  channels_per_module?: number;
  watts_per_module?: number;
  location?: string;
  notes?: string;
  building_service?: string; // Building electrical service (Service A, B, C, etc.)
}

/**
 * Form data for creating/editing a PD rack
 */
export interface PDRackFormData {
  name: string;
  rack_identifier?: string; // Identifier (e.g., "Z", "FOH", "DECK")
  voltage: 120 | 208 | 230 | 240;
  is_dual_voltage?: boolean;
  secondary_voltage?: number;
  circuit_count: 12 | 24 | 48 | 96;
  phase_config?: PhaseConfig;
  amps_per_breaker?: number;
  location?: string;
  notes?: string;
  building_service?: string; // Building electrical service (Service A, B, C, etc.)
}

// ============================================
// Calculation Input/Output Types
// ============================================

/**
 * Input for power calculations
 */
export interface PowerCalculationInput {
  fixtures: Array<{
    id: string;
    wattage?: number;
    amperage?: number;
    phase?: Phase;
    dimmer_rack_id?: string;
    pd_rack_id?: string;
  }>;
  dimmer_racks: DimmerRack[];
  pd_racks: PDRack[];
}

/**
 * Capacity check result
 */
export interface CapacityCheckResult {
  has_capacity: boolean;
  circuits_available: number;
  percentage_used: number;
  warnings: string[];
}

// ============================================
// Constants
// ============================================

export const CIRCUIT_COUNT_OPTIONS = [12, 24, 48, 96] as const;
export const VOLTAGE_OPTIONS = [120, 208, 230, 240] as const;
export const MODULE_TYPE_OPTIONS: ModuleType[] = [
  'dimmer',
  'relay',
  'constant_current',
  'thrupower',
];
export const PHASE_CONFIG_OPTIONS: PhaseConfig[] = ['single', 'split', 'three'];
export const PHASE_OPTIONS: Phase[] = ['A', 'B', 'C'];

// Building service options
export const BUILDING_SERVICE_OPTIONS = [
  'None',
  'Service A',
  'Service B',
  'Service C',
  'Service D',
  'Service E',
] as const;

// Warning thresholds
export const CAPACITY_WARNING_THRESHOLD = 80; // 80% capacity = warning
export const CAPACITY_CRITICAL_THRESHOLD = 100; // 100% capacity = critical
export const PHASE_IMBALANCE_WARNING_THRESHOLD = 15; // 15% imbalance = warning
export const PHASE_IMBALANCE_CRITICAL_THRESHOLD = 25; // 25% imbalance = critical
