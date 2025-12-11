import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { ProjectPage } from './pages/ProjectPage';
import { ModuleLanding } from './pages/ModuleLanding';
import { Prep } from './pages/modules/Prep';
import { SystemDocs } from './pages/modules/SystemDocs';
import { Manager } from './pages/modules/Manager';
import { AdminPanel } from './pages/admin/AdminPanel';
import { Account } from './pages/Account';
import { Settings } from './pages/Settings';
import { LicenseBanner } from './components/License/LicenseBanner';
import { SplashScreen } from './components/SplashScreen';
import { ThemeProvider } from './components/ThemeProvider';
import { ConsentDialog } from './components/common/ConsentDialog';
import { useUser } from './hooks/useUser';
import { useSettingsStore } from './store/settingsStore';
import { telemetry } from './services/telemetry';

function AppContent() {
  const { status } = useUser();
  const navigate = useNavigate();

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
      {status && <LicenseBanner status={status} />}

      <Routes>
        {/* Default route - show landing page (projects) */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Project-based routes */}
        <Route path="/project/:projectId" element={<ProjectPage />} />
        <Route path="/project/:projectId/module/:moduleType" element={<ModuleLanding />} />
        <Route path="/project/:projectId/module/production/system-docs" element={<SystemDocs />} />
        <Route path="/project/:projectId/module/production/shop-order" element={<Prep />} />
        <Route path="/project/:projectId/module/production" element={<Navigate to="system-docs" replace />} />
        <Route path="/project/:projectId/module/design" element={<Navigate to="prep" replace />} />
        <Route path="/project/:projectId/module/prep" element={<Navigate to="/project/:projectId/module/production/shop-order" replace />} />
        <Route path="/project/:projectId/module/manager" element={<Manager />} />

        {/* Direct module access (no project) */}
        <Route path="/module/:moduleType" element={<ModuleLanding />} />
        <Route path="/module/production/system-docs" element={<SystemDocs />} />
        <Route path="/module/production/shop-order" element={<Prep />} />
        <Route path="/module/prep" element={<Navigate to="/module/production/shop-order" replace />} />
        <Route path="/module/manager" element={<Manager />} />
        <Route path="/module/production" element={<Navigate to="/module/production/system-docs" replace />} />
        <Route path="/module/design" element={<Navigate to="/module/prep" replace />} />

        {/* Backwards compatibility - redirect old routes */}
        <Route path="/modules" element={<LandingPage />} />
        <Route path="/modules/prep" element={<Navigate to="/module/production/shop-order" replace />} />
        <Route path="/modules/production" element={<Navigate to="/module/production" replace />} />
        <Route path="/modules/manager" element={<Navigate to="/module/manager" replace />} />
        <Route path="/project/:projectId/module/production/equipment" element={<Navigate to="/project/:projectId/module/production/system-docs" replace />} />
        <Route path="/project/:projectId/module/production/paperwork" element={<Navigate to="/project/:projectId/module/production/system-docs" replace />} />
        <Route path="/project/:projectId/module/production/labels" element={<Navigate to="/project/:projectId/module/production/system-docs" replace />} />
        <Route path="/module/production/equipment" element={<Navigate to="/module/production/system-docs" replace />} />
        <Route path="/module/production/paperwork" element={<Navigate to="/module/production/system-docs" replace />} />
        <Route path="/module/production/labels" element={<Navigate to="/module/production/system-docs" replace />} />

        {/* Admin panel */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* User account and settings */}
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<Settings />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  // Only show splash on first app launch (main window), not in project windows
  const [showSplash, setShowSplash] = useState(() => {
    // Check if this is a project window by looking at the path
    const isProjectPath = window.location.pathname.includes('/project/') ||
                         window.location.hash.includes('/project/');

    // Don't show splash in project windows
    if (isProjectPath) return false;

    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem('splashShown');
    return !splashShown;
  });

  // Show consent dialog on first launch
  const [showConsent, setShowConsent] = useState(() => {
    // Check if consent was already given (check if user has made a choice)
    const consentShown = localStorage.getItem('showstack-consent-shown');
    return !consentShown;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Mark splash as shown for this session
    sessionStorage.setItem('splashShown', 'true');
  };

  const handleConsentClose = () => {
    setShowConsent(false);
    // Mark consent dialog as shown
    localStorage.setItem('showstack-consent-shown', 'true');
  };

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
    <ThemeProvider>
      <Router>
        {showSplash ? (
          <SplashScreen onComplete={handleSplashComplete} />
        ) : (
          <>
            <AppContent />
            {/* Show consent dialog on first launch after splash */}
            {showConsent && <ConsentDialog onClose={handleConsentClose} />}
          </>
        )}
      </Router>
    </ThemeProvider>
  );
}
