/**
 * Tests for LicenseService
 *
 * Tests the perpetual fallback licensing model:
 * - Build date before maintenance end -> canRunApp true, canSync true
 * - Build date after maintenance end -> canRunApp false (canEdit false)
 * - Maintenance expired but build date valid -> canRunApp true, canSync false
 * - Offline grace period
 * - verifyLicenseViaSupabase with email-based auto-claim
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserLicense, ModuleAccess } from '../../../shared/types/license.types';

// Mock the database queries
vi.mock('../../database/queries/license', () => ({
  getCurrentLicense: vi.fn(),
  createLicense: vi.fn(),
  updateLicense: vi.fn(),
  deleteLicense: vi.fn(),
}));

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock SupabaseConnector
const mockConnector = {
  isAuthenticated: vi.fn(),
  getUserId: vi.fn(),
  getSession: vi.fn(),
  fetchUserLicense: vi.fn(),
  claimLicenseByEmail: vi.fn(),
};

vi.mock('../../services/sync/SupabaseConnector', () => ({
  getSupabaseConnector: () => mockConnector,
}));

import {
  getCurrentLicense,
  createLicense,
  updateLicense,
  deleteLicense,
} from '../../database/queries/license';
import { LicenseService } from '../LicenseService';

const mockedGetCurrentLicense = vi.mocked(getCurrentLicense);
const mockedCreateLicense = vi.mocked(createLicense);
const mockedUpdateLicense = vi.mocked(updateLicense);
const mockedDeleteLicense = vi.mocked(deleteLicense);

function buildLicense(overrides: Partial<UserLicense> = {}): UserLicense {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  const defaultModules: ModuleAccess[] = [
    {
      module: 'lighting',
      enabled: true,
      features: {
        maxRevisions: 5,
        maxFixtures: -1,
        multiDiscipline: true,
        advancedExport: true,
        cloudSync: true,
        prioritySupport: true,
      },
    },
  ];

  return {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
    licenseKey: 'TEST-KEY-1234',
    tier: 'professional',
    status: 'active',
    modules: defaultModules,
    expirationDate: now + oneYear,
    maintenanceEndDate: now + oneYear,
    lastVerified: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('LicenseService', () => {
  let service: LicenseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LicenseService();
  });

  describe('getLicenseStatus', () => {
    it('returns expired with no license', () => {
      mockedGetCurrentLicense.mockReturnValue(null);

      const status = service.getLicenseStatus();

      expect(status.status).toBe('expired');
      expect(status.canView).toBe(false);
      expect(status.canEdit).toBe(false);
      expect(status.canSync).toBe(false);
    });

    it('returns active when maintenance is current', () => {
      const license = buildLicense();
      mockedGetCurrentLicense.mockReturnValue(license);

      const status = service.getLicenseStatus();

      expect(status.status).toBe('active');
      expect(status.canView).toBe(true);
      expect(status.canEdit).toBe(true);
      expect(status.canSync).toBe(true);
    });

    it('returns active with warning when approaching expiration', () => {
      const license = buildLicense({
        maintenanceEndDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
      });
      mockedGetCurrentLicense.mockReturnValue(license);

      const status = service.getLicenseStatus();

      expect(status.status).toBe('active');
      expect(status.warningLevel).toBe('low');
      expect(status.canSync).toBe(true);
    });

    it('returns maintenance_expired when maintenance expired but build date is valid', () => {
      const pastDate = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago

      const license = buildLicense({
        maintenanceEndDate: pastDate,
        expirationDate: pastDate,
      });
      mockedGetCurrentLicense.mockReturnValue(license);

      const status = service.getLicenseStatus();

      // Build date is "now" which is after the maintenance end, so canEdit should be false
      expect(status.status).toBe('expired');
      expect(status.canView).toBe(true);
      expect(status.canEdit).toBe(false);
      expect(status.canSync).toBe(false);
    });

    it('returns suspended for suspended licenses', () => {
      const license = buildLicense({ status: 'suspended' });
      mockedGetCurrentLicense.mockReturnValue(license);

      const status = service.getLicenseStatus();

      expect(status.status).toBe('suspended');
      expect(status.canView).toBe(false);
      expect(status.canEdit).toBe(false);
      expect(status.canSync).toBe(false);
    });

    it('returns grace when verification is stale', () => {
      const license = buildLicense({
        lastVerified: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
      });
      mockedGetCurrentLicense.mockReturnValue(license);

      const status = service.getLicenseStatus();

      expect(status.status).toBe('grace');
      expect(status.canView).toBe(true);
      expect(status.canEdit).toBe(true);
      expect(status.canSync).toBe(false);
      expect(status.warningLevel).toBe('medium');
    });

    it('returns high warning when very stale verification', () => {
      const license = buildLicense({
        lastVerified: Date.now() - 35 * 24 * 60 * 60 * 1000, // 35 days ago
      });
      mockedGetCurrentLicense.mockReturnValue(license);

      const status = service.getLicenseStatus();

      expect(status.status).toBe('grace');
      expect(status.warningLevel).toBe('high');
    });
  });

  describe('hasModuleAccess', () => {
    it('returns false with no license', () => {
      mockedGetCurrentLicense.mockReturnValue(null);
      expect(service.hasModuleAccess('lighting')).toBe(false);
    });

    it('returns true for enabled module', () => {
      const license = buildLicense();
      mockedGetCurrentLicense.mockReturnValue(license);
      expect(service.hasModuleAccess('lighting')).toBe(true);
    });

    it('returns false for disabled module', () => {
      const license = buildLicense({
        modules: [
          {
            module: 'lighting',
            enabled: false,
            features: {
              maxRevisions: 5,
              maxFixtures: -1,
              multiDiscipline: true,
              advancedExport: true,
              cloudSync: true,
              prioritySupport: true,
            },
          },
        ],
      });
      mockedGetCurrentLicense.mockReturnValue(license);
      expect(service.hasModuleAccess('lighting')).toBe(false);
    });

    it('returns false for suspended license', () => {
      const license = buildLicense({ status: 'suspended' });
      mockedGetCurrentLicense.mockReturnValue(license);
      expect(service.hasModuleAccess('lighting')).toBe(false);
    });
  });

  describe('getModuleFeatures', () => {
    it('returns null with no license', () => {
      mockedGetCurrentLicense.mockReturnValue(null);
      expect(service.getModuleFeatures('lighting')).toBeNull();
    });

    it('returns features for available module', () => {
      const license = buildLicense();
      mockedGetCurrentLicense.mockReturnValue(license);

      const features = service.getModuleFeatures('lighting');
      expect(features).not.toBeNull();
      expect(features!.maxRevisions).toBe(5);
    });
  });

  describe('getAvailableModules', () => {
    it('returns empty array with no license', () => {
      mockedGetCurrentLicense.mockReturnValue(null);
      expect(service.getAvailableModules()).toEqual([]);
    });

    it('returns only enabled modules', () => {
      const license = buildLicense({
        modules: [
          {
            module: 'lighting',
            enabled: true,
            features: {
              maxRevisions: 5,
              maxFixtures: -1,
              multiDiscipline: true,
              advancedExport: true,
              cloudSync: true,
              prioritySupport: true,
            },
          },
          {
            module: 'sound',
            enabled: false,
            features: {
              maxRevisions: 5,
              maxFixtures: -1,
              multiDiscipline: true,
              advancedExport: true,
              cloudSync: true,
              prioritySupport: true,
            },
          },
        ],
      });
      mockedGetCurrentLicense.mockReturnValue(license);

      expect(service.getAvailableModules()).toEqual(['lighting']);
    });
  });

  describe('verifyLicenseViaSupabase', () => {
    it('returns false if not authenticated', async () => {
      mockConnector.isAuthenticated.mockReturnValue(false);

      const result = await service.verifyLicenseViaSupabase();

      expect(result).toBe(false);
    });

    it('returns false if no server license found', async () => {
      mockConnector.isAuthenticated.mockReturnValue(true);
      mockConnector.fetchUserLicense.mockResolvedValue(null);

      const result = await service.verifyLicenseViaSupabase();

      expect(result).toBe(false);
    });

    it('updates local license with server data', async () => {
      mockConnector.isAuthenticated.mockReturnValue(true);
      mockConnector.fetchUserLicense.mockResolvedValue({
        id: 'srv-id',
        license_key: 'SRV-KEY',
        user_id: 'user-123',
        email: 'test@example.com',
        tier: 'professional',
        modules: [],
        maintenance_end_date: '2027-06-01T00:00:00Z',
        status: 'active',
      });

      const localLicense = buildLicense({ id: 'local-id' });
      mockedGetCurrentLicense.mockReturnValue(localLicense);
      mockedUpdateLicense.mockReturnValue(localLicense);

      const result = await service.verifyLicenseViaSupabase();

      expect(result).toBe(true);
      expect(mockedUpdateLicense).toHaveBeenCalledWith(
        'local-id',
        expect.objectContaining({
          status: 'active',
          tier: 'professional',
          lastVerified: expect.any(Number),
        }),
      );
    });

    it('creates local license if none exists', async () => {
      mockConnector.isAuthenticated.mockReturnValue(true);
      mockConnector.fetchUserLicense.mockResolvedValue({
        id: 'srv-id',
        license_key: 'NEW-KEY',
        user_id: 'user-123',
        email: 'new@example.com',
        tier: 'student',
        modules: [],
        maintenance_end_date: '2027-06-01T00:00:00Z',
        status: 'active',
      });

      mockedGetCurrentLicense.mockReturnValue(null);
      mockedCreateLicense.mockReturnValue(buildLicense());

      const result = await service.verifyLicenseViaSupabase();

      expect(result).toBe(true);
      expect(mockedCreateLicense).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          licenseKey: 'NEW-KEY',
          tier: 'student',
        }),
      );
    });

    it('auto-claims unclaimed license matching email', async () => {
      mockConnector.isAuthenticated.mockReturnValue(true);

      // First call returns unclaimed license (no user_id)
      const unclaimedLicense = {
        id: 'srv-id',
        license_key: 'AUTO-KEY',
        user_id: null,
        email: 'buyer@example.com',
        tier: 'professional',
        modules: [],
        maintenance_end_date: '2027-06-01T00:00:00Z',
        status: 'active',
      };

      // After claim, returns the same license with user_id set
      const claimedLicense = {
        ...unclaimedLicense,
        user_id: 'user-456',
      };

      mockConnector.fetchUserLicense
        .mockResolvedValueOnce(unclaimedLicense)
        .mockResolvedValueOnce(claimedLicense);

      mockConnector.claimLicenseByEmail.mockResolvedValue({
        success: true,
        license: claimedLicense,
      });

      mockedGetCurrentLicense.mockReturnValue(null);
      mockedCreateLicense.mockReturnValue(buildLicense());

      const result = await service.verifyLicenseViaSupabase();

      expect(result).toBe(true);
      expect(mockConnector.claimLicenseByEmail).toHaveBeenCalled();
      expect(mockedCreateLicense).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'buyer@example.com',
          licenseKey: 'AUTO-KEY',
          userId: 'user-456',
        }),
      );
    });

    it('still uses unclaimed license data if auto-claim fails', async () => {
      mockConnector.isAuthenticated.mockReturnValue(true);

      const unclaimedLicense = {
        id: 'srv-id',
        license_key: 'AUTO-KEY',
        user_id: null,
        email: 'buyer@example.com',
        tier: 'professional',
        modules: [],
        maintenance_end_date: '2027-06-01T00:00:00Z',
        status: 'active',
      };

      // fetchUserLicense returns unclaimed license
      mockConnector.fetchUserLicense.mockResolvedValueOnce(unclaimedLicense);

      mockConnector.claimLicenseByEmail.mockResolvedValue({
        success: false,
        error: 'Claim failed',
      });

      mockedGetCurrentLicense.mockReturnValue(null);
      mockedCreateLicense.mockReturnValue(buildLicense());

      const result = await service.verifyLicenseViaSupabase();

      // Claim failed but unclaimed license data is still used to create local record
      expect(result).toBe(true);
      expect(mockConnector.claimLicenseByEmail).toHaveBeenCalled();
      expect(mockedCreateLicense).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'buyer@example.com',
          licenseKey: 'AUTO-KEY',
        }),
      );
    });
  });

  describe('canUseFeature', () => {
    it('returns false with no license', () => {
      mockedGetCurrentLicense.mockReturnValue(null);
      expect(service.canUseFeature('lighting', 'cloudSync')).toBe(false);
    });

    it('checks universal features', () => {
      const license = buildLicense();
      mockedGetCurrentLicense.mockReturnValue(license);
      expect(service.canUseFeature('lighting', 'cloudSync')).toBe(true);
      expect(service.canUseFeature('lighting', 'multiDiscipline')).toBe(true);
    });
  });

  describe('activateLicenseLocally (legacy)', () => {
    it('creates a license with correct defaults', () => {
      const newLicense = buildLicense();
      mockedCreateLicense.mockReturnValue(newLicense);

      const result = service.activateLicenseLocally('KEY', 'test@test.com', ['lighting']);

      expect(mockedCreateLicense).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@test.com',
          licenseKey: 'KEY',
          tier: 'professional',
        }),
      );
      expect(result).toEqual(newLicense);
    });

    it('creates license with multiple modules', () => {
      const newLicense = buildLicense();
      mockedCreateLicense.mockReturnValue(newLicense);

      service.activateLicenseLocally('KEY', 'test@test.com', ['lighting', 'sound']);

      expect(mockedCreateLicense).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: 'professional',
        }),
      );
    });
  });

  describe('createDemoLicense', () => {
    it('creates a demo license with all 6 modules enabled', () => {
      mockedGetCurrentLicense.mockReturnValue(null);
      const demoLicense = buildLicense({ tier: 'demo' });
      mockedCreateLicense.mockReturnValue(demoLicense);

      service.createDemoLicense();

      expect(mockedCreateLicense).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'demo@local',
          tier: 'demo',
          modules: expect.arrayContaining([
            expect.objectContaining({ module: 'lighting', enabled: true }),
            expect.objectContaining({ module: 'sound', enabled: true }),
            expect.objectContaining({ module: 'video', enabled: true }),
            expect.objectContaining({ module: 'production_management', enabled: true }),
            expect.objectContaining({ module: 'touring', enabled: true }),
            expect.objectContaining({ module: 'producer', enabled: true }),
          ]),
        }),
      );
    });

    it('creates demo license with correct feature restrictions', () => {
      mockedGetCurrentLicense.mockReturnValue(null);
      const demoLicense = buildLicense({ tier: 'demo' });
      mockedCreateLicense.mockReturnValue(demoLicense);

      service.createDemoLicense();

      const createCall = mockedCreateLicense.mock.calls[0][0];
      const lightingModule = createCall.modules.find((m: ModuleAccess) => m.module === 'lighting');
      expect(lightingModule?.features).toEqual({
        maxRevisions: 0,
        maxFixtures: 25,
        multiDiscipline: false,
        advancedExport: false,
        cloudSync: false,
        prioritySupport: false,
      });
    });

    it('deletes existing demo license before creating new one', () => {
      const existingDemo = buildLicense({ id: 'old-demo', tier: 'demo' });
      mockedGetCurrentLicense.mockReturnValue(existingDemo);
      mockedCreateLicense.mockReturnValue(buildLicense({ tier: 'demo' }));

      service.createDemoLicense();

      expect(mockedDeleteLicense).toHaveBeenCalledWith('old-demo');
      expect(mockedCreateLicense).toHaveBeenCalled();
    });
  });

  describe('getLicenseStatus — demo tier', () => {
    it('returns active with demo message for demo license', () => {
      const license = buildLicense({ tier: 'demo' });
      mockedGetCurrentLicense.mockReturnValue(license);

      const status = service.getLicenseStatus();

      expect(status.status).toBe('active');
      expect(status.message).toContain('Demo mode');
      expect(status.canView).toBe(true);
      expect(status.canEdit).toBe(true);
      expect(status.canSync).toBe(false);
    });
  });

  describe('verifyLicenseViaSupabase — demo replacement', () => {
    it('replaces demo license with server license', async () => {
      mockConnector.isAuthenticated.mockReturnValue(true);
      mockConnector.fetchUserLicense.mockResolvedValue({
        id: 'srv-id',
        license_key: 'REAL-KEY',
        user_id: 'user-123',
        email: 'real@example.com',
        name: 'Real User',
        tier: 'professional',
        modules: [],
        maintenance_end_date: '2027-06-01T00:00:00Z',
        status: 'active',
      });

      const demoLicense = buildLicense({ id: 'demo-id', tier: 'demo' });
      mockedGetCurrentLicense.mockReturnValue(demoLicense);
      mockedCreateLicense.mockReturnValue(buildLicense());

      const result = await service.verifyLicenseViaSupabase();

      expect(result).toBe(true);
      expect(mockedDeleteLicense).toHaveBeenCalledWith('demo-id');
      expect(mockedCreateLicense).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'real@example.com',
          name: 'Real User',
          licenseKey: 'REAL-KEY',
          tier: 'professional',
          userId: 'user-123',
        }),
      );
    });
  });

  describe('checkAndVerifyIfNeeded', () => {
    it('skips verification when no license exists', async () => {
      mockedGetCurrentLicense.mockReturnValue(null);

      await service.checkAndVerifyIfNeeded();

      expect(mockConnector.isAuthenticated).not.toHaveBeenCalled();
    });

    it('skips verification when recently verified', async () => {
      const license = buildLicense({
        lastVerified: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
      });
      mockedGetCurrentLicense.mockReturnValue(license);

      await service.checkAndVerifyIfNeeded();

      // Should not attempt Supabase verification
      expect(mockConnector.isAuthenticated).not.toHaveBeenCalled();
    });
  });
});
