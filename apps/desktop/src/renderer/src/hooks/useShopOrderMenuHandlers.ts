import { useEffect } from 'react';

interface PrepMenuHandlersProps {
  onNewProject: () => void;
  onAddSection?: () => void;
  onPrint?: () => void;
  hasProject: boolean;
}

/**
 * Prep menu event handlers
 * Registers handlers when component mounts, unregisters on unmount
 */
export function useShopOrderMenuHandlers(props: PrepMenuHandlersProps) {
  const {
    onNewProject,
    onAddSection,
    onPrint,
    hasProject,
  } = props;

  useEffect(() => {
    if (!window.api?.menu) return;

    // File handlers
    const handleNew = () => {
      onNewProject();
    };

    const handlePrint = () => {
      if (onPrint) {
        onPrint();
      } else {
        console.log('Print prep document');
        window.print();
      }
    };

    // Edit handlers
    const handleAddSection = () => {
      if (hasProject) {
        if (onAddSection) {
          onAddSection();
        } else {
          console.log('Add section');
        }
      } else {
        console.log('No project selected to add section to');
      }
    };

    // Register all handlers
    window.api.menu.on('menu:new', handleNew);
    window.api.menu.on('menu:print', handlePrint);
    window.api.menu.on('menu:addSection', handleAddSection);

    // Cleanup on unmount
    return () => {
      window.api.menu.off('menu:new', handleNew);
      window.api.menu.off('menu:print', handlePrint);
      window.api.menu.off('menu:addSection', handleAddSection);
    };
  }, [onNewProject, onAddSection, onPrint, hasProject]);
}
