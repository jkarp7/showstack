import {
  getCurrentLicense,
  createLicense,
  updateLicense,
  deleteLicense,
} from '../database/queries/license';
import { getAppDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';
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
 * In production, BUILD_DATE must be set at build time. In development,
 * we fall back to the current date so the app can run without a build step.
 *
 * To test expired maintenance scenarios in development, set:
 *   BUILD_DATE=2020-01-01 npm run dev
 */
function getAppBuildDate(): Date {
  if (process.env.BUILD_DATE) {
    const date = new Date(process.env.BUILD_DATE);
    if (isNaN(date.getTime())) {
      throw new Error(
        `BUILD_DATE environment variable is not a valid date: "${process.env.BUILD_DATE}"`,
      );
    }
    return date;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'BUILD_DATE environment variable must be set in production builds. ' +
        'This is required for perpetual fallback licensing.',
    );
  }
  // Development fallback — current date means maintenance checks behave as "just built"
  return new Date();
}

const APP_BUILD_DATE = getAppBuildDate();

/**
 * License Service
 *
 * Handles license validation, verification, and feature access control.
 * Uses perpetual fallback model: app runs if built before maintenance_end_date.
 * Cloud sync requires active maintenance.
 */
/** Time constants */
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
// Demo licenses never expire on their own — they're replaced when a real license is found.
// 100 years is a sentinel value that ensures demo licenses never hit expiration logic.
const DEMO_EXPIRY_MS = 100 * ONE_YEAR_MS;

/** Demo tier feature limits */
export const DEMO_FIXTURE_LIMIT = 25;

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
        tier: null,
        message: 'No license found. Please activate.',
        canView: false,
        canEdit: false,
        canSync: false,
      };
    }

    // Demo tier — local-only with restrictions
    if (license.tier === 'demo') {
      return {
        status: 'active',
        tier: 'demo',
        message: 'Demo mode — sign in for full access',
        canView: true,
        canEdit: true,
        canSync: false,
      };
    }

    const now = Date.now();
    const maintenanceEnd = license.maintenanceEndDate;
    const buildTime = APP_BUILD_DATE.getTime();
    const daysSinceVerification = this.daysBetween(license.lastVerified, now);
    const daysUntilMaintenance = this.daysBetween(now, maintenanceEnd);

    // Cloud sync requires both active maintenance AND the cloud_sync flag from Supabase
    const cloudSyncEnabled = license.cloudSync;

    // Suspended license — no access
    if (license.status === 'suspended') {
      return {
        status: 'suspended',
        tier: license.tier,
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
        tier: license.tier,
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
          tier: license.tier,
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
        tier: license.tier,
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
        tier: license.tier,
        message: `Maintenance expires in ${daysUntilMaintenance} days. Renew to continue receiving updates and cloud sync.`,
        canView: true,
        canEdit: true,
        canSync: cloudSyncEnabled,
        warningLevel: 'low',
        daysUntilExpiration: daysUntilMaintenance,
      };
    }

    // Fully active
    return {
      status: 'active',
      tier: license.tier,
      message: 'License active',
      canView: true,
      canEdit: true,
      canSync: cloudSyncEnabled,
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
          // Don't proceed with an unclaimed license — would create a local record
          // with null user_id. The claim can be retried on next verification cycle.
          return false;
        }
      }

      if (!serverLicense) {
        logger.info('No license found on server for current user');
        return false;
      }

      // Validate server license data before writing to local database
      if (
        !serverLicense.email ||
        !serverLicense.license_key ||
        !serverLicense.tier ||
        !serverLicense.maintenance_end_date
      ) {
        logger.warn('Server license missing required fields, skipping update');
        return false;
      }

      // Update local SQLite with server data
      const localLicense = getCurrentLicense();
      const maintenanceEndDate = new Date(serverLicense.maintenance_end_date).getTime();

      if (localLicense && localLicense.tier === 'demo') {
        // Atomically replace demo license with real license using raw SQL.
        // Raw SQL avoids calling saveAppDatabase() inside the transaction body,
        // keeping the transaction purely database operations.
        const demoId = localLicense.id;
        try {
          const db = getAppDatabase();
          const replaceLicense = db.transaction(() => {
            const now = Date.now();
            const newId = uuidv4();
            db.prepare(
              `INSERT INTO licenses (
                id, email, name, license_key, tier, status, modules,
                expiration_date, maintenance_end_date, user_id, cloud_sync,
                last_verified, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ).run(
              newId,
              serverLicense.email,
              serverLicense.name || '',
              serverLicense.license_key,
              serverLicense.tier,
              'active',
              JSON.stringify(serverLicense.modules),
              maintenanceEndDate,
              maintenanceEndDate,
              serverLicense.user_id ?? null,
              serverLicense.cloud_sync ? 1 : 0,
              now,
              now,
              now,
            );
            db.prepare(`UPDATE licenses SET status = 'deleted', updated_at = ? WHERE id = ?`).run(
              now,
              demoId,
            );
          });
          replaceLicense();
        } catch (replaceError) {
          logger.error('Failed to replace demo license with real license', {
            error: replaceError instanceof Error ? replaceError.message : String(replaceError),
          });
          // Transaction rolled back — demo license remains, verification will retry
          return false;
        }
      } else if (localLicense) {
        updateLicense(localLicense.id, {
          status: serverLicense.status === 'revoked' ? 'suspended' : serverLicense.status,
          name: serverLicense.name || localLicense.name,
          maintenanceEndDate,
          expirationDate: maintenanceEndDate,
          modules: serverLicense.modules,
          tier: serverLicense.tier,
          cloudSync: serverLicense.cloud_sync,
          lastVerified: Date.now(),
        });
      } else {
        // Create local license from server data
        createLicense({
          email: serverLicense.email,
          name: serverLicense.name || '',
          licenseKey: serverLicense.license_key,
          tier: serverLicense.tier,
          modules: serverLicense.modules,
          expirationDate: maintenanceEndDate,
          maintenanceEndDate,
          userId: serverLicense.user_id ?? undefined,
          cloudSync: serverLicense.cloud_sync,
        });
      }

      return serverLicense.status === 'active';
    } catch (error) {
      // Only log error message — avoid leaking license keys or user IDs
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('License verification via Supabase failed', { error: message });
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
  canUseFeature(module: ShowStackModule, feature: keyof ModuleFeatures): boolean {
    const features = this.getModuleFeatures(module);
    if (!features) return false;

    return !!features[feature];
  }

  /**
   * Get current license
   */
  getCurrentLicense(): UserLicense | null {
    return getCurrentLicense();
  }

  /**
   * Create a demo license with restricted features.
   * All 6 modules enabled at demo tier.
   */
  createDemoLicense(): UserLicense {
    const existing = getCurrentLicense();
    // Never downgrade a real license to demo
    if (existing && existing.tier !== 'demo') {
      logger.warn('Cannot create demo license: user already has a real license');
      return existing;
    }
    // Remove any existing demo license first
    if (existing && existing.tier === 'demo') {
      deleteLicense(existing.id);
    }

    const allModules: ShowStackModule[] = [
      'lighting',
      'sound',
      'video',
      'production_management',
      'touring',
      'producer',
    ];

    const modules: ModuleAccess[] = allModules.map((module) => ({
      module,
      enabled: true,
      features: this.getDefaultFeaturesForTier('demo', module),
    }));

    // Demo licenses don't expire — they're replaced when a real license is found
    const farFuture = Date.now() + DEMO_EXPIRY_MS;

    return createLicense({
      email: 'demo@local',
      name: 'Demo User',
      licenseKey: `DEMO-${Date.now()}`,
      tier: 'demo',
      modules,
      expirationDate: farFuture,
      maintenanceEndDate: farFuture,
    });
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

    const maintenanceEndDate = Date.now() + ONE_YEAR_MS;

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
    const tierFeatures: Record<LicenseTier, ModuleFeatures> = {
      professional: {
        maxRevisions: 5,
        maxFixtures: -1,
        multiDiscipline: true,
        advancedExport: true,
        cloudSync: true,
        prioritySupport: true,
      },
      student: {
        maxRevisions: 2,
        maxFixtures: 100,
        multiDiscipline: false,
        advancedExport: false,
        cloudSync: false,
        prioritySupport: false,
      },
      institutional: {
        maxRevisions: 3,
        maxFixtures: -1,
        multiDiscipline: true,
        advancedExport: true,
        cloudSync: true,
        prioritySupport: true,
      },
      demo: {
        maxRevisions: 0,
        maxFixtures: DEMO_FIXTURE_LIMIT,
        multiDiscipline: false,
        advancedExport: false,
        cloudSync: false,
        prioritySupport: false,
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
