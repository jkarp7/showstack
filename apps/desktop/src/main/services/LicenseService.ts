import {
  getCurrentLicense,
  getLicenseByKey,
  createLicense,
  updateLicense
} from '../database/queries/license';
import type {
  UserLicense,
  LicenseValidation,
  ShowStackModule,
  ModuleAccess,
  ModuleFeatures,
  LicenseTier
} from '../../shared/types/license.types';

/**
 * License Service
 *
 * Handles license validation, verification, and feature access control.
 * Uses offline-first approach with 14-day grace period.
 */
export class LicenseService {
  // Grace period constants
  private readonly OFFLINE_GRACE_DAYS = 14;
  private readonly EXPIRATION_WARNING_DAYS = 7;
  private readonly VERIFICATION_INTERVAL_HOURS = 24;

  /**
   * Get current license validation status
   */
  getLicenseStatus(): LicenseValidation {
    const license = getCurrentLicense();

    if (!license) {
      return {
        status: 'expired',
        message: 'No license found. Please activate.',
        canView: false,
        canEdit: false
      };
    }

    const now = Date.now();
    const daysSinceVerification = this.daysBetween(license.lastVerified, now);
    const daysUntilExpiration = this.daysBetween(now, license.expirationDate);

    // Check if subscription is expired
    if (now > license.expirationDate) {
      if (daysSinceVerification <= this.OFFLINE_GRACE_DAYS) {
        return {
          status: 'expired',
          message: 'Subscription expired. Please renew to continue editing.',
          canView: true,
          canEdit: false
        };
      }

      return {
        status: 'grace',
        message: `Unable to verify license. Please connect to internet. (${daysSinceVerification} days offline)`,
        canView: true,
        canEdit: true,
        warningLevel: 'high',
        daysSinceVerification
      };
    }

    // Check if verification is stale
    if (daysSinceVerification > this.OFFLINE_GRACE_DAYS) {
      return {
        status: 'grace',
        message: `License verification needed. Please connect to internet. (${daysSinceVerification} days offline)`,
        canView: true,
        canEdit: true,
        warningLevel: 'medium',
        daysSinceVerification
      };
    }

    // Check if approaching expiration
    if (daysUntilExpiration <= this.EXPIRATION_WARNING_DAYS) {
      return {
        status: 'active',
        message: `License expires in ${daysUntilExpiration} days. Please renew soon.`,
        canView: true,
        canEdit: true,
        warningLevel: 'low',
        daysUntilExpiration
      };
    }

    return {
      status: 'active',
      message: 'License active',
      canView: true,
      canEdit: true
    };
  }

  /**
   * Verify license against online server
   */
  async verifyLicenseOnline(licenseKey: string): Promise<boolean> {
    try {
      // TODO: Replace with your actual API endpoint
      const response = await fetch('https://api.showstack.app/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) return false;

      const data = await response.json();

      const license = getLicenseByKey(licenseKey);
      if (!license) return false;

      updateLicense(license.id, {
        status: data.status,
        expirationDate: new Date(data.expirationDate).getTime(),
        lastVerified: Date.now(),
        modules: data.modules
      });

      return data.status === 'active';
    } catch (error) {
      console.error('License verification failed (offline):', error);
      return false;
    }
  }

  /**
   * Check if license needs verification and verify if needed
   */
  async checkAndVerifyIfNeeded(): Promise<void> {
    const license = getCurrentLicense();
    if (!license) return;

    const hoursSinceCheck = this.hoursBetween(license.lastVerified, Date.now());

    if (hoursSinceCheck >= this.VERIFICATION_INTERVAL_HOURS) {
      await this.verifyLicenseOnline(license.licenseKey);
    }
  }

  /**
   * Check if user has access to a specific module
   */
  hasModuleAccess(module: ShowStackModule): boolean {
    const license = getCurrentLicense();
    if (!license) return false;

    const licenseStatus = this.getLicenseStatus();
    if (licenseStatus.status === 'expired' || licenseStatus.status === 'suspended') {
      return false;
    }

    const moduleAccess = license.modules.find(m => m.module === module);
    return moduleAccess?.enabled ?? false;
  }

  /**
   * Get features for a specific module
   */
  getModuleFeatures(module: ShowStackModule): ModuleFeatures | null {
    const license = getCurrentLicense();
    if (!license) return null;

    const moduleAccess = license.modules.find(m => m.module === module);
    return moduleAccess?.features ?? null;
  }

  /**
   * Get all available modules for current license
   */
  getAvailableModules(): ShowStackModule[] {
    const license = getCurrentLicense();
    if (!license) return [];

    return license.modules
      .filter(m => m.enabled)
      .map(m => m.module);
  }

  /**
   * Check if user can use a specific feature
   */
  canUseFeature(module: ShowStackModule, feature: string): boolean {
    const features = this.getModuleFeatures(module);
    if (!features) return false;

    // Check universal features
    if (feature in features) {
      return !!(features as any)[feature];
    }

    // Check module-specific features
    if (module === 'prep' && features.prepFeatures) {
      return !!(features.prepFeatures as any)[feature];
    }
    if (module === 'production' && features.productionFeatures) {
      return !!(features.productionFeatures as any)[feature];
    }
    if (module === 'manager' && features.managerFeatures) {
      return !!(features.managerFeatures as any)[feature];
    }

    return false;
  }

  /**
   * Get current license
   */
  getCurrentLicense(): UserLicense | null {
    return getCurrentLicense();
  }

  /**
   * Activate a new license
   */
  activateLicense(
    licenseKey: string,
    email: string,
    purchasedModules: ShowStackModule[]
  ): UserLicense {
    const tier = this.determineTierFromModules(purchasedModules);

    const modules: ModuleAccess[] = purchasedModules.map(module => ({
      module,
      enabled: true,
      features: this.getDefaultFeaturesForTier(tier, module)
    }));

    return createLicense({
      email,
      name: '',
      licenseKey,
      tier,
      modules,
      expirationDate: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
    });
  }

  /**
   * Get default features for a tier and module
   */
  private getDefaultFeaturesForTier(tier: LicenseTier, module: ShowStackModule): ModuleFeatures {
    const tierFeatures = {
      professional: {
        maxRevisions: 5,
        multiDiscipline: true,
        advancedExport: true,
        cloudSync: true,
        prioritySupport: true
      },
      student: {
        maxRevisions: 2,
        multiDiscipline: false,
        advancedExport: false,
        cloudSync: false,
        prioritySupport: false
      },
      institutional: {
        maxRevisions: 3,
        multiDiscipline: true,
        advancedExport: true,
        cloudSync: true,
        prioritySupport: true
      }
    };

    const baseFeatures = tierFeatures[tier] || tierFeatures.student;
    const moduleFeatures: ModuleFeatures = { ...baseFeatures };

    if (module === 'prep') {
      moduleFeatures.prepFeatures = {
        maxProjects: tier === 'professional' ? -1 : 3,
        logoIntegration: tier !== 'student',
        vendorTemplates: tier !== 'student',
        equipmentDatabase: true,
        bulkOperations: tier !== 'student'
      };
    }

    if (module === 'production') {
      moduleFeatures.productionFeatures = {
        vectorworksIntegration: tier !== 'student',
        etcEosIntegration: tier !== 'student',
        paperworkGeneration: true,
        labelSystem: true,
        powerManagement: tier !== 'student'
      };
    }

    if (module === 'manager') {
      moduleFeatures.managerFeatures = {
        plaidIntegration: tier === 'professional',
        multiShowManagement: true,
        budgetTracking: true,
        perDiemCalculation: tier !== 'student',
        tourLogistics: tier !== 'student'
      };
    }

    return moduleFeatures;
  }

  /**
   * Determine tier from purchased modules
   */
  private determineTierFromModules(modules: ShowStackModule[]): LicenseTier {
    if (modules.includes('student')) return 'student';
    return 'professional';
  }

  /**
   * Calculate days between two timestamps
   */
  private daysBetween(timestamp1: number, timestamp2: number): number {
    return Math.floor((timestamp2 - timestamp1) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate hours between two timestamps
   */
  private hoursBetween(timestamp1: number, timestamp2: number): number {
    return Math.floor((timestamp2 - timestamp1) / (1000 * 60 * 60));
  }
}

// Export singleton instance
export const licenseService = new LicenseService();
