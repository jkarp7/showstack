import { useEffect } from 'react';

interface EquipmentMenuHandlersProps {
  selectedRows: Set<string>;
  fixtures: any[];
  onAddFixture: () => void;
  onBulkEdit: () => void;
  onDuplicate?: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onPrint?: () => void;
  onExportCSV?: () => void;
  onExportEos?: () => void;
  onExportGrandMA2?: () => void;
  onExportGrandMA3?: () => void;
}

/**
 * Equipment Manager menu event handlers
 * Registers handlers when component mounts, unregisters on unmount
 */
export function useEquipmentMenuHandlers(props: EquipmentMenuHandlersProps) {
  const {
    selectedRows,
    fixtures,
    onAddFixture,
    onBulkEdit,
    onDuplicate,
    onSelectAll,
    onDeselectAll,
    onPrint,
    onExportCSV,
    onExportEos,
    onExportGrandMA2,
    onExportGrandMA3,
  } = props;

  useEffect(() => {
    if (!window.api?.menu) return;

    // File handlers
    const handlePrint = () => {
      if (onPrint) {
        onPrint();
      } else {
        console.log('Print equipment list');
        // TODO: Implement print functionality
      }
    };

    const handleExportCSV = () => {
      if (onExportCSV) {
        onExportCSV();
      } else {
        console.log('Export to CSV');
        // TODO: Implement CSV export
      }
    };

    const handleExportEos = () => {
      if (onExportEos) {
        onExportEos();
      } else {
        console.log('Export for ETC Eos');
        // TODO: Implement Eos export
      }
    };

    const handleExportGrandMA2 = () => {
      if (onExportGrandMA2) {
        onExportGrandMA2();
      } else {
        console.log('Export for GrandMA2');
        // TODO: Implement GrandMA2 export
      }
    };

    const handleExportGrandMA3 = () => {
      if (onExportGrandMA3) {
        onExportGrandMA3();
      } else {
        console.log('Export for GrandMA3');
        // TODO: Implement GrandMA3 export
      }
    };

    // Edit handlers
    const handleAddFixture = () => {
      onAddFixture();
    };

    const handleBulkEdit = () => {
      if (selectedRows.size > 0) {
        onBulkEdit();
      } else {
        console.log('No fixtures selected for bulk edit');
      }
    };

    const handleDuplicate = () => {
      if (selectedRows.size > 0) {
        if (onDuplicate) {
          onDuplicate();
        } else {
          console.log('Duplicate selected fixtures');
          // TODO: Implement duplicate functionality
        }
      } else {
        console.log('No fixtures selected to duplicate');
      }
    };

    const handleSelectAll = () => {
      onSelectAll();
    };

    const handleDeselectAll = () => {
      onDeselectAll();
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
    };
  }, [
    selectedRows,
    fixtures,
    onAddFixture,
    onBulkEdit,
    onDuplicate,
    onSelectAll,
    onDeselectAll,
    onPrint,
    onExportCSV,
    onExportEos,
    onExportGrandMA2,
    onExportGrandMA3,
  ]);
}
