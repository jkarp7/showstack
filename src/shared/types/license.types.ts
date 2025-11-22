/**
 * ShowStack Module-Based Licensing System - Type Definitions
 *
 * Defines types for modules, tiers, licenses, and features used throughout
 * the ShowStack licensing system.
 */

export type ShowStackModule =
  | 'prep'        // ShowStack:Prep (Shop Order Builder - current product)
  | 'production'  // ShowStack:Production (LightWright competitor)
  | 'manager'     // ShowStack:Manager (Production/Tour management)
  | 'student';    // ShowStack:Student (Educational version)

export type LicenseTier =
  | 'professional'  // Full access, all features
  | 'student'       // Limited features, educational pricing
  | 'institutional'; // Multi-seat, institutional pricing

export interface UserLicense {
  id: string;
  email: string;
  name: string;
  licenseKey: string;
  tier: LicenseTier;
  status: 'active' | 'expired' | 'suspended';

  // Module access control
  modules: ModuleAccess[];

  expirationDate: number; // Unix timestamp
  lastVerified: number;   // Unix timestamp
  createdAt: number;      // Unix timestamp
  updatedAt: number;      // Unix timestamp
}

export interface ModuleAccess {
  module: ShowStackModule;
  enabled: boolean;
  features: ModuleFeatures;
  expirationDate?: number;  // Unix timestamp - can be different per module (e.g., trial)
}

export interface ModuleFeatures {
  // Universal features (apply to all modules)
  maxRevisions: number;
  multiDiscipline: boolean;
  advancedExport: boolean;
  cloudSync: boolean;
  prioritySupport: boolean;

  // Module-specific features
  prepFeatures?: PrepModuleFeatures;
  productionFeatures?: ProductionModuleFeatures;
  managerFeatures?: ManagerModuleFeatures;
}

export interface PrepModuleFeatures {
  maxProjects: number;           // -1 for unlimited, 3 for student
  logoIntegration: boolean;
  vendorTemplates: boolean;
  equipmentDatabase: boolean;
  bulkOperations: boolean;
}

export interface ProductionModuleFeatures {
  vectorworksIntegration: boolean;
  etcEosIntegration: boolean;
  paperworkGeneration: boolean;
  labelSystem: boolean;
  powerManagement: boolean;
}

export interface ManagerModuleFeatures {
  plaidIntegration: boolean;      // Financial tracking
  multiShowManagement: boolean;
  budgetTracking: boolean;
  perDiemCalculation: boolean;
  tourLogistics: boolean;
}

export interface LicenseValidation {
  status: 'active' | 'grace' | 'expired' | 'suspended';
  message: string;
  canView: boolean;
  canEdit: boolean;
  warningLevel?: 'low' | 'medium' | 'high';
  daysUntilExpiration?: number;
  daysSinceVerification?: number;
}
