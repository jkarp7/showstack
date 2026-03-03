import { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

interface EquipmentMenuHandlersProps {
  selectedRows: Set<string>;
  fixtures: any[];
  onAddFixture: () => void;
  onBulkEdit: () => void;
  onDuplicate?: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPrint?: () => void;
  onExportCSV?: () => void;
  onExportEos?: () => void;
  onExportGrandMA2?: () => void;
  onExportGrandMA3?: () => void;
  // View menu handlers
  onColumnVisibility?: () => void;
  onUserColumns?: () => void;
  onClearSort?: () => void;
  onClearFilters?: () => void;
}

/**
 * Equipment Manager menu event handlers
 * Registers handlers when component mounts, unregisters on unmount
 * Uses refs to avoid re-registering listeners when props change
 */
export function useEquipmentMenuHandlers(props: EquipmentMenuHandlersProps) {
  // Store all props in refs so handlers can access current values
  // without needing to re-register on every change
  const propsRef = useRef(props);

  // Update ref on every render to keep current values
  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    if (!window.api?.menu) return;

    // All handlers read from propsRef.current to get latest values
    // This allows handlers to remain stable and not re-register

    // File handlers
    const handlePrint = () => {
      const { onPrint } = propsRef.current;
      if (onPrint) {
        onPrint();
      } else {
        logger.info('Print equipment list');
        // TODO: Implement print functionality
      }
    };

    const handleExportCSV = () => {
      const { onExportCSV } = propsRef.current;
      if (onExportCSV) {
        onExportCSV();
      } else {
        logger.info('Export to CSV');
        // TODO: Implement CSV export
      }
    };

    const handleExportEos = () => {
      const { onExportEos } = propsRef.current;
      if (onExportEos) {
        onExportEos();
      } else {
        logger.info('Export for ETC Eos');
        // TODO: Implement Eos export
      }
    };

    const handleExportGrandMA2 = () => {
      const { onExportGrandMA2 } = propsRef.current;
      if (onExportGrandMA2) {
        onExportGrandMA2();
      } else {
        logger.info('Export for GrandMA2');
        // TODO: Implement GrandMA2 export
      }
    };

    const handleExportGrandMA3 = () => {
      const { onExportGrandMA3 } = propsRef.current;
      if (onExportGrandMA3) {
        onExportGrandMA3();
      } else {
        logger.info('Export for GrandMA3');
        // TODO: Implement GrandMA3 export
      }
    };

    // Edit handlers
    const handleAddFixture = () => {
      const { onAddFixture } = propsRef.current;
      onAddFixture();
    };

    const handleBulkEdit = () => {
      const { selectedRows, onBulkEdit } = propsRef.current;
      if (selectedRows.size > 0) {
        onBulkEdit();
      } else {
        logger.info('No fixtures selected for bulk edit');
      }
    };

    const handleDuplicate = () => {
      const { selectedRows, onDuplicate } = propsRef.current;
      if (selectedRows.size > 0) {
        if (onDuplicate) {
          onDuplicate();
        } else {
          logger.info('Duplicate selected fixtures');
          // TODO: Implement duplicate functionality
        }
      } else {
        logger.info('No fixtures selected to duplicate');
      }
    };

    const handleSelectAll = () => {
      const { onSelectAll } = propsRef.current;
      onSelectAll();
    };

    const handleDeselectAll = () => {
      const { onDeselectAll } = propsRef.current;
      onDeselectAll();
    };

    const handleUndo = () => {
      const { onUndo } = propsRef.current;
      if (onUndo) {
        onUndo();
      } else {
        logger.info('Undo not implemented');
      }
    };

    const handleRedo = () => {
      const { onRedo } = propsRef.current;
      if (onRedo) {
        onRedo();
      } else {
        logger.info('Redo not implemented');
      }
    };

    // View handlers
    const handleColumnVisibility = () => {
      const { onColumnVisibility } = propsRef.current;
      if (onColumnVisibility) {
        onColumnVisibility();
      }
    };

    const handleUserColumns = () => {
      const { onUserColumns } = propsRef.current;
      if (onUserColumns) {
        onUserColumns();
      }
    };

    const handleSort = () => {
      // Sort Options — SortBar is always visible inline; no dialog to open
      logger.info('Sort options: use the Sort By bar in the Equipment Manager');
    };

    const handleClearSort = () => {
      const { onClearSort } = propsRef.current;
      if (onClearSort) {
        onClearSort();
      }
    };

    const handleFilters = () => {
      // Filter Options — FilterBar is always visible inline; no dialog to open
      logger.info('Filter options: use the Filter bar in the Equipment Manager');
    };

    const handleClearFilters = () => {
      const { onClearFilters } = propsRef.current;
      if (onClearFilters) {
        onClearFilters();
      }
    };

    // Register all handlers
    window.api.menu.on('menu:print', handlePrint);
    window.api.menu.on('menu:export:csv', handleExportCSV);
    window.api.menu.on('menu:export:eos', handleExportEos);
    window.api.menu.on('menu:export:grandma2', handleExportGrandMA2);
    window.api.menu.on('menu:export:grandma3', handleExportGrandMA3);
    window.api.menu.on('menu:addFixture', handleAddFixture);
    window.api.menu.on('menu:bulkEdit', handleBulkEdit);
    window.api.menu.on('menu:duplicate', handleDuplicate);
    window.api.menu.on('menu:selectAll', handleSelectAll);
    window.api.menu.on('menu:deselectAll', handleDeselectAll);
    window.api.menu.on('menu:undo', handleUndo);
    window.api.menu.on('menu:redo', handleRedo);
    window.api.menu.on('menu:columns', handleColumnVisibility);
    window.api.menu.on('menu:userColumns', handleUserColumns);
    window.api.menu.on('menu:sort', handleSort);
    window.api.menu.on('menu:clearSort', handleClearSort);
    window.api.menu.on('menu:filters', handleFilters);
    window.api.menu.on('menu:clearFilters', handleClearFilters);

    // Cleanup on unmount
    return () => {
      window.api.menu.off('menu:print', handlePrint);
      window.api.menu.off('menu:export:csv', handleExportCSV);
      window.api.menu.off('menu:export:eos', handleExportEos);
      window.api.menu.off('menu:export:grandma2', handleExportGrandMA2);
      window.api.menu.off('menu:export:grandma3', handleExportGrandMA3);
      window.api.menu.off('menu:addFixture', handleAddFixture);
      window.api.menu.off('menu:bulkEdit', handleBulkEdit);
      window.api.menu.off('menu:duplicate', handleDuplicate);
      window.api.menu.off('menu:selectAll', handleSelectAll);
      window.api.menu.off('menu:deselectAll', handleDeselectAll);
      window.api.menu.off('menu:undo', handleUndo);
      window.api.menu.off('menu:redo', handleRedo);
      window.api.menu.off('menu:columns', handleColumnVisibility);
      window.api.menu.off('menu:userColumns', handleUserColumns);
      window.api.menu.off('menu:sort', handleSort);
      window.api.menu.off('menu:clearSort', handleClearSort);
      window.api.menu.off('menu:filters', handleFilters);
      window.api.menu.off('menu:clearFilters', handleClearFilters);
    };
    // Empty dependency array - only register listeners once on mount
    // Handlers read from propsRef.current to get latest values
  }, []);
}
