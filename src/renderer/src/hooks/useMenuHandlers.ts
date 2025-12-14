import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global menu event handlers
 * Listens for menu events from the native Electron menu and handles them
 */
export function useMenuHandlers() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.api?.menu) return;

    // Navigation handlers
    const handleHome = () => navigate('/');
    const handleAccount = () => navigate('/account');
    const handleSettings = () => navigate('/settings');
    const handleAdmin = () => navigate('/admin');

    // Theme handler
    const handleToggleDarkMode = () => {
      document.documentElement.classList.toggle('dark');
      // Save preference
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    // Help handlers
    const handleHelpDocs = () => {
      // TODO: Update URL when docs site is live
      window.api?.shell.openExternal('https://github.com/jkarp7/showstack');
    };

    const handleHelpConsoleExport = () => {
      // TODO: Update URL when docs site is live
      window.api?.shell.openExternal('https://github.com/jkarp7/showstack#console-export');
    };

    const handleHelpShortcuts = () => {
      // TODO: Show keyboard shortcuts modal
      console.log('Show keyboard shortcuts modal');
    };

    const handleHelpUpdates = () => {
      // TODO: Show check for updates dialog
      console.log('Check for updates');
    };

    const handleHelpAbout = () => {
      // TODO: Show about dialog
      console.log('Show about dialog');
    };

    // Register all handlers
    window.api.menu.on('menu:home', handleHome);
    window.api.menu.on('menu:account', handleAccount);
    window.api.menu.on('menu:settings', handleSettings);
    window.api.menu.on('menu:admin', handleAdmin);
    window.api.menu.on('menu:toggleDarkMode', handleToggleDarkMode);
    window.api.menu.on('menu:help:docs', handleHelpDocs);
    window.api.menu.on('menu:help:consoleExport', handleHelpConsoleExport);
    window.api.menu.on('menu:help:shortcuts', handleHelpShortcuts);
    window.api.menu.on('menu:help:updates', handleHelpUpdates);
    window.api.menu.on('menu:help:about', handleHelpAbout);

    // Cleanup
    return () => {
      window.api.menu.off('menu:home', handleHome);
      window.api.menu.off('menu:account', handleAccount);
      window.api.menu.off('menu:settings', handleSettings);
      window.api.menu.off('menu:admin', handleAdmin);
      window.api.menu.off('menu:toggleDarkMode', handleToggleDarkMode);
      window.api.menu.off('menu:help:docs', handleHelpDocs);
      window.api.menu.off('menu:help:consoleExport', handleHelpConsoleExport);
      window.api.menu.off('menu:help:shortcuts', handleHelpShortcuts);
      window.api.menu.off('menu:help:updates', handleHelpUpdates);
      window.api.menu.off('menu:help:about', handleHelpAbout);
    };
  }, [navigate]);
}
