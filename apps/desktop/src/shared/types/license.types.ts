/**
 * ShowStack Module-Based Licensing System - Type Definitions
 *
 * Defines types for modules, tiers, licenses, and features used throughout
 * the ShowStack licensing system.
 */

export type ShowStackModule =
  | 'lighting' // ShowStack:Lighting (fixture management & paperwork)
  | 'sound' // ShowStack:Sound (audio system design)
  | 'video' // ShowStack:Video (video/projection planning)
  | 'production_management' // ShowStack:Production Management (scheduling & logistics)
  | 'touring' // ShowStack:Touring (tour management & per diems)
  | 'producer'; // ShowStack:Producer (budgeting & financial tracking)

export type LicenseTier =
  | 'professional' // Full access, all features
  | 'student' // Limited features, educational pricing
  | 'institutional' // Multi-seat, institutional pricing
  | 'demo'; // Demo mode — restricted local-only access

/** Tiers that can be granted by the licensing server (demo is local-only). */
export type ServerLicenseTier = Exclude<LicenseTier, 'demo'>;

export interface UserLicense {
  id: string;
  email: string;
  name: string;
  licenseKey: string;
  tier: LicenseTier;
  status: 'active' | 'expired' | 'suspended';
  userId?: string;
  cloudSync: boolean; // Whether cloud sync is enabled for this license (Supabase flag)

  // Module access control
  modules: ModuleAccess[];

  expirationDate: number; // Unix timestamp (legacy, maps to maintenanceEndDate)
  maintenanceEndDate: number; // Unix timestamp — perpetual fallback pivot date
  lastVerified: number; // Unix timestamp
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

export interface ModuleAccess {
  module: ShowStackModule;
  enabled: boolean;
  features: ModuleFeatures;
  expirationDate?: number; // Unix timestamp - can be different per module (e.g., trial)
}

export interface ModuleFeatures {
  // Universal features (apply to all modules)
  maxRevisions: number;
  maxFixtures: number; // -1 = unlimited
  multiDiscipline: boolean;
  advancedExport: boolean;
  cloudSync: boolean;
  prioritySupport: boolean;
}

export interface LicenseValidation {
  status: 'active' | 'grace' | 'expired' | 'suspended' | 'maintenance_expired';
  tier: LicenseTier | null; // Current license tier, null if no license
  message: string;
  canView: boolean;
  canEdit: boolean;
  canSync: boolean;
  warningLevel?: 'low' | 'medium' | 'high';
  daysUntilExpiration?: number;
  daysSinceVerification?: number;
}
