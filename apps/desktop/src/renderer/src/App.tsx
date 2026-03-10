import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { ProjectWorkspace } from './pages/ProjectWorkspace';
import { ModuleLanding } from './pages/ModuleLanding';
import { ShopOrderBuilder } from './pages/modules/ShopOrderBuilder';
import { Manager } from './pages/modules/Manager';
import { LabelVisualDesigner } from './pages/LabelVisualDesigner';
import { AdminPanel } from './pages/admin/AdminPanel';
import { Account } from './pages/Account';
import { Settings } from './pages/Settings';
import { EquipmentManager } from './pages/modules/EquipmentManager';
import { PowerManagement } from './pages/modules/PowerManagement';
import { Paperwork } from './pages/modules/Paperwork';
import { LabelDesigner } from './pages/modules/LabelDesigner';
import { ProjectInfo } from './pages/modules/ProjectInfo';
import { LicenseBanner } from './components/License/LicenseBanner';
import { SplashScreen } from './components/SplashScreen';
import { ThemeProvider } from './components/ThemeProvider';
import { ConsentDialog } from './components/common/ConsentDialog';
import { SettingsDialog } from './components/common/SettingsDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthModal } from './components/auth';
import { OfflineBanner } from './components/sync';
import { PendingInvitationsBanner } from './components/collaboration/PendingInvitationsBanner';
import { useFeatureFlag } from './config/featureFlags';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { telemetry } from './services/telemetry';
import { initializeGlobalErrorHandlers } from './services/globalErrorHandler';
import { logger } from './utils/logger';
import { useMenuHandlers } from './hooks/useMenuHandlers';
import { useProjectMenuHandlers } from './hooks/useProjectMenuHandlers';

/** Safe localStorage wrapper — no-ops if storage is unavailable */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — non-fatal
  }
}

function AppContent() {
  const licenseStatus = useAuthStore((state) => state.licenseStatus);
  const collaborationEnabled = useFeatureFlag('collaboration');
  const navigate = useNavigate();
  const isSettingsDialogOpen = useUIStore((state) => state.isSettingsDialogOpen);
  const closeSettingsDialog = useUIStore((state) => state.closeSettingsDialog);

  // Set up menu event handlers
  useMenuHandlers();
  useProjectMenuHandlers();

  // Keyboard shortcut for admin panel (Cmd/Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for both 'A' and 'a' to handle Shift key properly
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigate('/admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <>
      {/* License Status Banner - shows warnings for expiration/offline */}
      {licenseStatus && <LicenseBanner status={licenseStatus} />}

      {/* Offline Banner - shows when cloud sync is disconnected */}
      <OfflineBanner />

      {/* Pending Invitations Banner - shows when user has unaccepted collaboration invites.
          Any authenticated non-demo user can receive invitations; demo users are excluded
          because they don't have cloud sync enabled. */}
      {collaborationEnabled && (
        <PendingInvitationsBanner
          canReceiveInvitations={
            licenseStatus !== undefined && licenseStatus !== null && licenseStatus.tier !== 'demo'
          }
        />
      )}

      <Routes>
        {/* Default route - show landing page (projects) */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Project workspace — sidebar layout wraps all project routes */}
        <Route path="/project/:projectId" element={<ProjectWorkspace />}>
          <Route index element={<Navigate to="fixtures" replace />} />
          <Route
            path="fixtures"
            element={<EquipmentManager key="fixtures" initialTab="fixtures" />}
          />
          <Route
            path="infrastructure"
            element={<EquipmentManager key="infrastructure" initialTab="infrastructure" />}
          />
          <Route path="racks" element={<EquipmentManager key="racks" initialTab="power" />} />
          <Route path="power" element={<PowerManagement />} />
          <Route path="power/services" element={<PowerManagement />} />
          <Route path="power/summary" element={<PowerManagement />} />
          <Route path="shop-orders" element={<ShopOrderBuilder />} />
          <Route path="labels" element={<LabelDesigner />} />
          <Route path="paperwork" element={<Paperwork />} />
          <Route path="project-info" element={<ProjectInfo />} />
          {/* Backwards-compat redirects inside workspace */}
          <Route
            path="module/production/system-docs"
            element={<Navigate to="../fixtures" replace />}
          />
          <Route
            path="module/production/shop-order"
            element={<Navigate to="../shop-orders" replace />}
          />
          <Route
            path="module/production/equipment"
            element={<Navigate to="../fixtures" replace />}
          />
          <Route
            path="module/production/paperwork"
            element={<Navigate to="../paperwork" replace />}
          />
          <Route path="module/production/labels" element={<Navigate to="../labels" replace />} />
          <Route path="module/production" element={<Navigate to="../fixtures" replace />} />
          <Route path="module/:moduleType" element={<Navigate to="../fixtures" replace />} />
        </Route>
        {/* Label visual designer — full-screen canvas, outside workspace layout */}
        <Route
          path="/project/:projectId/prep/label-designer/:averyCode"
          element={<LabelVisualDesigner />}
        />

        {/* Backwards compatibility — old module-only routes (no project context) */}
        <Route path="/module/:moduleType" element={<ModuleLanding />} />
        <Route path="/module/manager" element={<Manager />} />
        <Route path="/module/production" element={<Navigate to="/" replace />} />
        <Route path="/module/production/system-docs" element={<Navigate to="/" replace />} />
        <Route path="/module/production/shop-order" element={<Navigate to="/" replace />} />
        <Route path="/modules" element={<LandingPage />} />
        <Route path="/modules/prep" element={<Navigate to="/" replace />} />
        <Route path="/modules/production" element={<Navigate to="/" replace />} />
        <Route path="/modules/manager" element={<Navigate to="/module/manager" replace />} />

        {/* Admin panel */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* User account and settings */}
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<Settings />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Settings Dialog */}
      <SettingsDialog isOpen={isSettingsDialogOpen} onClose={closeSettingsDialog} />
    </>
  );
}

export default function App() {
  // Only show splash on first app launch (main window), not in project windows
  const [showSplash, setShowSplash] = useState(() => {
    // Check if this is a project window by looking at the path
    const isProjectPath =
      window.location.pathname.includes('/project/') || window.location.hash.includes('/project/');

    // Don't show splash in project windows
    if (isProjectPath) return false;

    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem('splashShown');
    return !splashShown;
  });

  // Show consent dialog on first launch
  const [showConsent, setShowConsent] = useState(() => {
    // Check if consent was already given (check if user has made a choice)
    const consentShown = safeGetItem('showstack-consent-shown');
    return !consentShown;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Mark splash as shown for this session
    sessionStorage.setItem('splashShown', 'true');

    // First-launch auth prompt: if not authenticated and never prompted
    const authPrompted = safeGetItem('showstack-auth-prompted');
    if (!authPrompted) {
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated) {
        authState.setFirstLaunchPrompt(true);
        authState.openAuthModal('login');
      }
    }
  };

  const handleConsentClose = () => {
    setShowConsent(false);
    // Mark consent dialog as shown
    safeSetItem('showstack-consent-shown', 'true');
  };

  // Initialize global error handlers
  useEffect(() => {
    initializeGlobalErrorHandlers();
  }, []);

  // Initialize cloud sync
  useEffect(() => {
    const initSync = async () => {
      try {
        await useAuthStore.getState().initializeSync();
      } catch (error) {
        logger.error('[App] Failed to initialize sync:', error);
      }
    };
    initSync();
  }, []);

  // Track app lifecycle with telemetry
  useEffect(() => {
    const appStartTime = Date.now();

    // Track app opened
    telemetry.track('app_opened', {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });

    // Track app startup performance
    telemetry.trackPerformance('app_startup', Date.now() - appStartTime, {
      metric_type: 'startup_time',
    });

    // Track app closed (cleanup on unmount or page unload)
    const handleBeforeUnload = () => {
      const sessionDuration = Math.floor((Date.now() - appStartTime) / 1000); // in seconds
      telemetry.track('app_closed', {
        sessionDuration,
        sessionDurationMinutes: Math.floor(sessionDuration / 60),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Also call on component unmount
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          {showSplash ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
            <>
              <AppContent />
              {/* Show consent dialog on first launch after splash */}
              {showConsent && <ConsentDialog onClose={handleConsentClose} />}
              {/* Auth Modal for cloud sync login/signup */}
              <ErrorBoundary>
                <AuthModal />
              </ErrorBoundary>
            </>
          )}
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
