import { getCurrentLicense, createLicense, updateLicense } from '../database/queries/license';
import { logger } from '../utils/logger';
import type {
  UserLicense,
  LicenseValidation,
  ShowStackModule,
  ModuleAccess,
  ModuleFeatures,
  LicenseTier,
} from '../../shared/types/license.types';

/**
 * Build date used for perpetual fallback licensing.
 * If the app was built before maintenance_end_date, it can still run.
 */
const APP_BUILD_DATE = new Date(process.env.BUILD_DATE || new Date().toISOString());

/**
 * License Service
 *
 * Handles license validation, verification, and feature access control.
 * Uses perpetual fallback model: app runs if built before maintenance_end_date.
 * Cloud sync requires active maintenance.
 */
export class LicenseService {
  private readonly OFFLINE_GRACE_DAYS = 14;
  private readonly EXPIRATION_WARNING_DAYS = 7;
  private readonly VERIFICATION_INTERVAL_HOURS = 24;

  /**
   * Get current license validation status with perpetual fallback model
   */
  getLicenseStatus(): LicenseValidation {
    const license = getCurrentLicense();

    if (!license) {
      return {
        status: 'expired',
        message: 'No license found. Please activate.',
        canView: false,
        canEdit: false,
        canSync: false,
      };
    }

    const now = Date.now();
    const maintenanceEnd = license.maintenanceEndDate;
    const buildTime = APP_BUILD_DATE.getTime();
    const daysSinceVerification = this.daysBetween(license.lastVerified, now);
    const daysUntilMaintenance = this.daysBetween(now, maintenanceEnd);

    // Suspended license — no access
    if (license.status === 'suspended') {
      return {
        status: 'suspended',
        message: 'License suspended. Please contact support.',
        canView: false,
        canEdit: false,
        canSync: false,
      };
    }

    // Check verification staleness (offline grace period)
    if (daysSinceVerification > this.OFFLINE_GRACE_DAYS) {
      return {
        status: 'grace',
        message: `License verification needed. Please connect to internet. (${daysSinceVerification} days offline)`,
        canView: true,
        canEdit: true,
        canSync: false,
        warningLevel: daysSinceVerification > this.OFFLINE_GRACE_DAYS * 2 ? 'high' : 'medium',
        daysSinceVerification,
      };
    }

    // Maintenance expired
    if (now > maintenanceEnd) {
      // Perpetual fallback: app built before maintenance end can still run
      const canRun = buildTime <= maintenanceEnd;

      if (canRun) {
        return {
          status: 'maintenance_expired',
          message:
            'Maintenance expired. App continues to work, but cloud sync is disabled. Renew to get updates and sync.',
          canView: true,
          canEdit: true,
          canSync: false,
        };
      }

      // Build is newer than maintenance end — cannot run
      return {
        status: 'expired',
        message:
          'This version of ShowStack requires an active maintenance plan. Please renew your license.',
        canView: true,
        canEdit: false,
        canSync: false,
      };
    }

    // Active maintenance — approaching expiration warning
    if (daysUntilMaintenance <= this.EXPIRATION_WARNING_DAYS) {
      return {
        status: 'active',
        message: `Maintenance expires in ${daysUntilMaintenance} days. Renew to continue receiving updates and cloud sync.`,
        canView: true,
        canEdit: true,
        canSync: true,
        warningLevel: 'low',
        daysUntilExpiration: daysUntilMaintenance,
      };
    }

    // Fully active
    return {
      status: 'active',
      message: 'License active',
      canView: true,
      canEdit: true,
      canSync: true,
    };
  }

  /**
   * Verify license via Supabase.
   * First tries fetching by user_id (already claimed), then auto-claims by email.
   */
  async verifyLicenseViaSupabase(): Promise<boolean> {
    try {
      const { getSupabaseConnector } = await import('../services/sync/SupabaseConnector');
      const connector = getSupabaseConnector();

      if (!connector.isAuthenticated()) {
        logger.info('License verification skipped: not authenticated');
        return false;
      }

      let serverLicense = await connector.fetchUserLicense();

      // If fetchUserLicense found an unclaimed email match, try to claim it
      if (serverLicense && !serverLicense.user_id) {
        logger.info('Found unclaimed license matching email, attempting auto-claim');
        const claimResult = await connector.claimLicenseByEmail();
        if (claimResult.success) {
          // Re-fetch to get the updated record with user_id set
          serverLicense = await connector.fetchUserLicense();
        } else {
          logger.warn(`Auto-claim failed: ${claimResult.error}`);
        }
      }

      if (!serverLicense) {
        logger.info('No license found on server for current user');
        return false;
      }

      // Update local SQLite with server data
      const localLicense = getCurrentLicense();
      if (localLicense) {
        updateLicense(localLicense.id, {
          status: serverLicense.status as 'active' | 'expired' | 'suspended',
          maintenanceEndDate: new Date(serverLicense.maintenance_end_date).getTime(),
          expirationDate: new Date(serverLicense.maintenance_end_date).getTime(),
          modules: serverLicense.modules,
          tier: serverLicense.tier,
          lastVerified: Date.now(),
        });
      } else {
        // Create local license from server data
        createLicense({
          email: serverLicense.email,
          licenseKey: serverLicense.license_key,
          tier: serverLicense.tier as LicenseTier,
          modules: serverLicense.modules,
          expirationDate: new Date(serverLicense.maintenance_end_date).getTime(),
          maintenanceEndDate: new Date(serverLicense.maintenance_end_date).getTime(),
          userId: serverLicense.user_id,
        });
      }

      return serverLicense.status === 'active';
    } catch (error) {
      logger.error('License verification via Supabase failed', {
        error: error instanceof Error ? error.message : String(error),
      });
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
      await this.verifyLicenseViaSupabase();
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

    const moduleAccess = license.modules.find((m: ModuleAccess) => m.module === module);
    return moduleAccess?.enabled ?? false;
  }

  /**
   * Get features for a specific module
   */
  getModuleFeatures(module: ShowStackModule): ModuleFeatures | null {
    const license = getCurrentLicense();
    if (!license) return null;

    const moduleAccess = license.modules.find((m: ModuleAccess) => m.module === module);
    return moduleAccess?.features ?? null;
  }

  /**
   * Get all available modules for current license
   */
  getAvailableModules(): ShowStackModule[] {
    const license = getCurrentLicense();
    if (!license) return [];

    return license.modules
      .filter((m: ModuleAccess) => m.enabled)
      .map((m: ModuleAccess) => m.module);
  }

  /**
   * Check if user can use a specific feature
   */
  canUseFeature(module: ShowStackModule, feature: string): boolean {
    const features = this.getModuleFeatures(module);
    if (!features) return false;

    if (feature in features) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return !!(features as any)[feature];
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
   * Legacy: activate a license locally without Supabase
   * Kept for backwards compatibility and offline-first scenarios
   */
  activateLicenseLocally(
    licenseKey: string,
    email: string,
    purchasedModules: ShowStackModule[],
  ): UserLicense {
    const tier = this.determineTierFromModules(purchasedModules);

    const modules: ModuleAccess[] = purchasedModules.map((module) => ({
      module,
      enabled: true,
      features: this.getDefaultFeaturesForTier(tier, module),
    }));

    const maintenanceEndDate = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year

    return createLicense({
      email,
      name: '',
      licenseKey,
      tier,
      modules,
      expirationDate: maintenanceEndDate,
      maintenanceEndDate,
    });
  }

  private getDefaultFeaturesForTier(tier: LicenseTier, _module: ShowStackModule): ModuleFeatures {
    const tierFeatures = {
      professional: {
        maxRevisions: 5,
        multiDiscipline: true,
        advancedExport: true,
        cloudSync: true,
        prioritySupport: true,
      },
      student: {
        maxRevisions: 2,
        multiDiscipline: false,
        advancedExport: false,
        cloudSync: false,
        prioritySupport: false,
      },
      institutional: {
        maxRevisions: 3,
        multiDiscipline: true,
        advancedExport: true,
        cloudSync: true,
        prioritySupport: true,
      },
    };

    return tierFeatures[tier] || tierFeatures.student;
  }

  private determineTierFromModules(_modules: ShowStackModule[]): LicenseTier {
    return 'professional';
  }

  private daysBetween(timestamp1: number, timestamp2: number): number {
    return Math.floor((timestamp2 - timestamp1) / (1000 * 60 * 60 * 24));
  }

  private hoursBetween(timestamp1: number, timestamp2: number): number {
    return Math.floor((timestamp2 - timestamp1) / (1000 * 60 * 60));
  }
}

// Export singleton instance
export const licenseService = new LicenseService();
