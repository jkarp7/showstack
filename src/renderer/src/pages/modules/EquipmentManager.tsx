import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VirtualDataGrid } from '../../components/fixture/VirtualDataGrid';
import { Toolbar } from '../../components/fixture/Toolbar';
import { FilterBar } from '../../components/fixture/FilterBar';
import { SortBar } from '../../components/fixture/SortBar';
import { AddFixtureDialog } from '../../components/fixture/AddFixtureDialog';
import { BulkEditDialog } from '../../components/fixture/BulkEditDialog';
import { UserColumnSettingsDialog } from '../../components/fixture/UserColumnSettingsDialog';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { UnsavedChangesDialog, useUnsavedChangesDialog } from '../../components/common/UnsavedChangesDialog';
import { PowerSummaryPanel } from '../../components/power/PowerSummaryPanel';
import { RackManager } from '../../components/power/RackManager';
import { useFixtureStore } from '../../store/fixtureStore';
import { useFileStore } from '../../store/fileStore';
import { Fixture } from '../../types';
import { DimmerRack, PDRack } from '../../types/power';
import { DEFAULT_COLUMN_VISIBILITY, ColumnVisibility, DEFAULT_COLUMN_ORDER, ColumnKey } from '../../types/columns';
import { useEquipmentMenuHandlers } from '../../hooks/useEquipmentMenuHandlers';
import { autoLinkCircuit } from '../../utils/circuitParser';

interface EquipmentManagerProps {
  embedded?: boolean;
}

export function EquipmentManager({ embedded = false }: EquipmentManagerProps = {}) {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string; moduleType?: string }>();
  const { fixtures, loadFixtures, addMultipleFixtures, deleteMultiple, updateFixture, setCurrentProjectId } = useFixtureStore();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isAddFixtureDialogOpen, setIsAddFixtureDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [isUserColumnSettingsOpen, setIsUserColumnSettingsOpen] = useState(false);

  // Power features state
  const [showPowerSummary, setShowPowerSummary] = useState(false);
  const [isRackManagerOpen, setIsRackManagerOpen] = useState(false);
  const [dimmerRacks, setDimmerRacks] = useState<DimmerRack[]>([]);
  const [pdRacks, setPDRacks] = useState<PDRack[]>([]);

  // Track if we've done initial auto-linking
  const hasAutoLinkedRef = useRef(false);

  // Get current project ID - use route param or fall back to default-project
  const currentProjectId = routeProjectId || 'default-project';

  // Unsaved changes dialog
  const unsavedChangesDialog = useUnsavedChangesDialog();

  // User column definitions
  const [userColumnDefinitions, setUserColumnDefinitions] = useState<Record<string, string>>({});

  // Project name state
  const [projectName, setProjectName] = useState<string>('Untitled Project');

  // Sort state - now supports multi-column sort
  interface SortConfig {
    field: string;
    direction: 'asc' | 'desc';
  }
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(DEFAULT_COLUMN_VISIBILITY);

  // Column order state
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(DEFAULT_COLUMN_ORDER);

  // Column widths state (in pixels, null means use default from config)
  const [columnWidths, setColumnWidths] = useState<Partial<Record<ColumnKey, number>>>({});

  // Function to load power racks
  const loadRacks = async () => {
    if (!window.api?.dimmerRacks || !window.api?.pdRacks) return;

    try {
      const [dimmer, pd] = await Promise.all([
        window.api.dimmerRacks.getAll(currentProjectId),
        window.api.pdRacks.getAll(currentProjectId)
      ]);
      setDimmerRacks(dimmer);
      setPDRacks(pd);
    } catch (error) {
      console.error('Failed to load power racks:', error);
    }
  };

  // Function to reload all data (for file operations)
  const handleDataReload = async () => {
    await loadFixtures(currentProjectId);
    await loadRacks();

    if (!window.api) return;

    try {
      // Load project name
      if (window.api.projects) {
        const project = await window.api.projects.getById(currentProjectId);
        if (project?.name) {
          setProjectName(project.name);
        }
      }
    } catch (error) {
      console.error('Failed to reload project data:', error);
    }
  };

  // Load fixtures and preferences from database on mount
  useEffect(() => {
    // Set current project ID and load fixtures for this project
    setCurrentProjectId(currentProjectId);
    loadFixtures(currentProjectId);

    // Update menu context
    window.api?.menu?.setState({
      context: 'equipment',
      projectId: currentProjectId,
    });

    // Load project info and column preferences
    const loadProjectAndPreferences = async () => {
      if (!window.api) return;

      try {
        // Load project name
        if (window.api.projects) {
          const project = await window.api.projects.getById(currentProjectId);
          if (project?.name) {
            setProjectName(project.name);
          }
        }

        // Load column preferences
        if (window.api.preferences) {
          const savedVisibility = await window.api.preferences.get(currentProjectId, 'columnVisibility');
          if (savedVisibility) {
            setColumnVisibility(savedVisibility);
          }

          const savedOrder = await window.api.preferences.get(currentProjectId, 'columnOrder');
          if (savedOrder) {
            setColumnOrder(savedOrder);
          }

          const savedWidths = await window.api.preferences.get(currentProjectId, 'columnWidths');
          if (savedWidths) {
            setColumnWidths(savedWidths);
          }

          const savedUserColumns = await window.api.preferences.get(currentProjectId, 'userColumnDefinitions');
          if (savedUserColumns) {
            setUserColumnDefinitions(savedUserColumns);
          }
        }
      } catch (error) {
        console.error('Failed to load project and preferences:', error);
      }
    };

    loadProjectAndPreferences();
    loadRacks();
  }, [loadFixtures, currentProjectId]);

  // Auto-link fixtures with circuit info but no rack assignments (run once on initial load)
  useEffect(() => {
    // Skip if data isn't loaded yet
    if (fixtures.length === 0 || (dimmerRacks.length === 0 && pdRacks.length === 0)) {
      return;
    }

    // Skip if already ran (check ref)
    if (hasAutoLinkedRef.current) {
      return;
    }

    // Mark as running IMMEDIATELY to prevent re-entry
    hasAutoLinkedRef.current = true;

    const autoLinkExistingFixtures = async () => {
      const fixturesToUpdate: Array<{ id: string; updates: Partial<Fixture> }> = [];

      fixtures.forEach(fixture => {
        // Skip if already linked or missing circuit info
        if (fixture.dimmer_rack_id || fixture.pd_rack_id || !fixture.circuit || !fixture.circuit_number) {
          return;
        }

        // Try to auto-link
        const linkResult = autoLinkCircuit(
          fixture.circuit,
          typeof fixture.circuit_number === 'string'
            ? parseInt(fixture.circuit_number, 10)
            : fixture.circuit_number,
          dimmerRacks,
          pdRacks
        );

        // If we got a link result, queue it for update
        if (linkResult.dimmer_rack_id) {
          fixturesToUpdate.push({
            id: fixture.id,
            updates: {
              dimmer_rack_id: linkResult.dimmer_rack_id,
              dimmer_channel_number: linkResult.dimmer_channel_number,
              pd_rack_id: null,
              pd_circuit_number: null
            }
          });
        } else if (linkResult.pd_rack_id) {
          fixturesToUpdate.push({
            id: fixture.id,
            updates: {
              pd_rack_id: linkResult.pd_rack_id,
              pd_circuit_number: linkResult.pd_circuit_number,
              dimmer_rack_id: null,
              dimmer_channel_number: null
            }
          });
        }
      });

      // Apply all updates
      if (fixturesToUpdate.length > 0) {
        console.log(`[Auto-link] Linking ${fixturesToUpdate.length} fixtures to racks`);
        for (const { id, updates } of fixturesToUpdate) {
          try {
            await updateFixture(id, updates);
          } catch (error) {
            console.error(`[Auto-link] Failed to update ${id}:`, error);
          }
        }

        // Reload fixtures to verify updates
        setTimeout(async () => {
          await loadFixtures(currentProjectId);
        }, 500);
      }
    };

    autoLinkExistingFixtures();
  }, [fixtures, dimmerRacks, pdRacks, updateFixture]);

  // Update menu state when selection changes
  useEffect(() => {
    window.api?.menu?.setState({
      hasSelection: selectedRows.size > 0,
    });
  }, [selectedRows]);

  // Save column visibility when it changes
  useEffect(() => {
    const savePreference = async () => {
      if (!window.api?.preferences) return;
      try {
        await window.api.preferences.set(currentProjectId, 'columnVisibility', columnVisibility);
      } catch (error) {
        console.error('Failed to save column visibility:', error);
      }
    };
    savePreference();
  }, [columnVisibility, currentProjectId]);

  // Save column order when it changes
  useEffect(() => {
    const savePreference = async () => {
      if (!window.api?.preferences) return;
      try {
        await window.api.preferences.set(currentProjectId, 'columnOrder', columnOrder);
      } catch (error) {
        console.error('Failed to save column order:', error);
      }
    };
    savePreference();
  }, [columnOrder, currentProjectId]);

  // Save column widths when they change
  useEffect(() => {
    const savePreference = async () => {
      if (!window.api?.preferences) return;
      try {
        await window.api.preferences.set(currentProjectId, 'columnWidths', columnWidths);
      } catch (error) {
        console.error('Failed to save column widths:', error);
      }
    };
    savePreference();
  }, [columnWidths, currentProjectId]);

  // Sort handler - supports multi-column sort with Shift key
  const handleSort = (field: string, addToExisting: boolean = false) => {
    if (addToExisting) {
      // Multi-column sort (Shift+Click)
      const existingIndex = sortConfigs.findIndex(s => s.field === field);

      if (existingIndex >= 0) {
        // Field already in sort chain - toggle direction or remove
        const config = sortConfigs[existingIndex];
        if (config.direction === 'asc') {
          // Change to desc
          const newConfigs = [...sortConfigs];
          newConfigs[existingIndex] = { field, direction: 'desc' };
          setSortConfigs(newConfigs);
        } else {
          // Remove from chain
          setSortConfigs(sortConfigs.filter(s => s.field !== field));
        }
      } else {
        // Add to end of sort chain
        setSortConfigs([...sortConfigs, { field, direction: 'asc' }]);
      }
    } else {
      // Single column sort (normal click)
      const existing = sortConfigs.find(s => s.field === field);
      if (existing && sortConfigs.length === 1) {
        // Toggle direction
        setSortConfigs([{ field, direction: existing.direction === 'asc' ? 'desc' : 'asc' }]);
      } else {
        // Replace with new single sort
        setSortConfigs([{ field, direction: 'asc' }]);
      }
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setLocationFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  // Handle bulk edit submission
  const handleBulkEdit = async (updates: Partial<Fixture>) => {
    // Update all selected fixtures
    const updatePromises = Array.from(selectedRows).map(fixtureId =>
      updateFixture(fixtureId, updates)
    );

    await Promise.all(updatePromises);

    // Clear selection after bulk edit
    setSelectedRows(new Set());
  };

  // Handle auto-numbering
  const handleAutoNumber = async (field: keyof Fixture, start: number, increment: number) => {
    const selectedFixtures = processedFixtures.filter(f => selectedRows.has(f.id));

    const updatePromises = selectedFixtures.map((fixture, index) => {
      const value = start + (index * increment);
      return updateFixture(fixture.id, { [field]: value } as Partial<Fixture>);
    });

    await Promise.all(updatePromises);

    // Clear selection after auto-number
    setSelectedRows(new Set());
  };

  // Handle user column definitions save
  const handleSaveUserColumnDefinitions = async (definitions: Record<string, string>) => {
    setUserColumnDefinitions(definitions);

    // Save to preferences
    if (!window.api?.preferences) return;
    try {
      await window.api.preferences.set(currentProjectId, 'userColumnDefinitions', definitions);
    } catch (error) {
      console.error('Failed to save user column definitions:', error);
    }
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    // Get visible columns
    const visibleColumns = columnOrder
      .filter(key => columnVisibility[key])
      .map(key => {
        const config = DEFAULT_COLUMN_ORDER.find(c => c === key);
        return { key, label: userColumnDefinitions[key] || key };
      });

    // Build CSV header
    const headers = visibleColumns.map(col => col.label).join(',');

    // Build CSV rows
    const rows = processedFixtures.map(fixture => {
      return visibleColumns.map(col => {
        let value = fixture[col.key as keyof Fixture];

        // Handle special cases
        if (value === undefined || value === null) return '';
        if (Array.isArray(value)) return `"${value.join(', ')}"`;
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;

        return value;
      }).join(',');
    });

    // Combine into CSV string
    const csv = [headers, ...rows].join('\n');

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName}_fixtures_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Compute unique values for filter dropdowns and auto-fill suggestions
  const availableLocations = useMemo(() => {
    const locations = new Set<string>();
    fixtures.forEach((fixture) => {
      if (fixture.location) {
        locations.add(fixture.location);
      }
    });
    return Array.from(locations).sort();
  }, [fixtures]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    fixtures.forEach((fixture) => {
      if (fixture.type) {
        types.add(fixture.type);
      }
    });
    return Array.from(types).sort();
  }, [fixtures]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    fixtures.forEach((fixture) => {
      if (fixture.status) {
        statuses.add(fixture.status);
      }
    });
    return Array.from(statuses).sort();
  }, [fixtures]);

  // Auto-fill suggestions - extract unique values for common fields
  const autoFillSuggestions = useMemo(() => {
    const positions = new Set<string>();
    const purposes = new Set<string>();
    const colors = new Set<string>();
    const manufacturers = new Set<string>();
    const models = new Set<string>();
    const systems = new Set<string>();
    const gobos = new Set<string>();

    fixtures.forEach((fixture) => {
      if (fixture.position) positions.add(fixture.position);
      if (fixture.purpose) purposes.add(fixture.purpose);
      if (fixture.color) colors.add(fixture.color);
      if (fixture.manufacturer) manufacturers.add(fixture.manufacturer);
      if (fixture.model) models.add(fixture.model);
      if (fixture.system) systems.add(fixture.system);
      if (fixture.gobo) gobos.add(fixture.gobo);
    });

    return {
      positions: Array.from(positions).sort(),
      purposes: Array.from(purposes).sort(),
      colors: Array.from(colors).sort(),
      manufacturers: Array.from(manufacturers).sort(),
      models: Array.from(models).sort(),
      systems: Array.from(systems).sort(),
      gobos: Array.from(gobos).sort(),
      types: availableTypes,
      locations: availableLocations,
    };
  }, [fixtures, availableTypes, availableLocations]);

  // Filtered and sorted fixtures
  const processedFixtures = useMemo(() => {
    let result = [...fixtures];

    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((fixture) =>
        Object.values(fixture).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }

    if (locationFilter !== 'all') {
      result = result.filter((fixture) => fixture.location === locationFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((fixture) => fixture.type?.includes(typeFilter));
    }

    if (statusFilter !== 'all') {
      result = result.filter((fixture) => fixture.status === statusFilter);
    }

    // Apply multi-column sorting
    if (sortConfigs.length > 0) {
      result.sort((a, b) => {
        // Try each sort config in order until we find a difference
        for (const { field, direction } of sortConfigs) {
          let comparison = 0;

          // Special handling for address field - sort by universe, then dmx_address
          if (field === 'address') {
            const aUniverse = a.universe || 0;
            const bUniverse = b.universe || 0;
            const aDmx = a.dmx_address || 0;
            const bDmx = b.dmx_address || 0;

            // Sort by universe first
            if (aUniverse !== bUniverse) {
              comparison = aUniverse - bUniverse;
            } else {
              // Then by DMX address within universe
              comparison = aDmx - bDmx;
            }
          } else {
            const aValue = a[field as keyof Fixture];
            const bValue = b[field as keyof Fixture];

            // Handle undefined/null values
            if (aValue === undefined || aValue === null) {
              comparison = 1;
            } else if (bValue === undefined || bValue === null) {
              comparison = -1;
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
              // Numeric comparison
              comparison = aValue - bValue;
            } else {
              // String comparison
              const aStr = String(aValue).toLowerCase();
              const bStr = String(bValue).toLowerCase();
              comparison = aStr.localeCompare(bStr);
            }
          }

          // Apply direction and return if we found a difference
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        }

        return 0; // All sort fields are equal
      });
    }

    return result;
  }, [fixtures, searchQuery, locationFilter, typeFilter, statusFilter, sortConfigs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + N - New Fixture
      if (modKey && e.key === 'n') {
        e.preventDefault();
        setIsAddFixtureDialogOpen(true);
      }

      // Cmd/Ctrl + S - Save (handled by FileMenu component now)
      // Removed to avoid conflicts with FileMenu keyboard shortcuts

      // Delete/Backspace - Delete selected fixtures
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRows.size > 0) {
        // Only delete if not typing in an input field
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (confirm(`Delete ${selectedRows.size} selected fixture(s)?`)) {
            deleteMultiple(Array.from(selectedRows));
            setSelectedRows(new Set());
          }
        }
      }

      // Escape - Clear selection or close dialogs
      if (e.key === 'Escape') {
        if (isAddFixtureDialogOpen) {
          setIsAddFixtureDialogOpen(false);
        } else if (isBulkEditDialogOpen) {
          setIsBulkEditDialogOpen(false);
        } else if (isUserColumnSettingsOpen) {
          setIsUserColumnSettingsOpen(false);
        } else if (selectedRows.size > 0) {
          setSelectedRows(new Set());
        }
      }

      // Cmd/Ctrl + A - Select all visible fixtures
      if (modKey && e.key === 'a') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const allIds = new Set(processedFixtures.map(f => f.id));
          setSelectedRows(allIds);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAddFixtureDialogOpen,
    isBulkEditDialogOpen,
    isUserColumnSettingsOpen,
    selectedRows,
    processedFixtures,
    deleteMultiple
  ]);

  // Handle select all
  const handleSelectAll = () => {
    const allIds = new Set(processedFixtures.map(f => f.id));
    setSelectedRows(allIds);
  };

  // Handle deselect all
  const handleDeselectAll = () => {
    setSelectedRows(new Set());
  };

  // Register menu handlers
  useEquipmentMenuHandlers({
    selectedRows,
    fixtures: processedFixtures,
    onAddFixture: () => setIsAddFixtureDialogOpen(true),
    onBulkEdit: () => setIsBulkEditDialogOpen(true),
    onSelectAll: handleSelectAll,
    onDeselectAll: handleDeselectAll,
    onPrint: handlePrint,
    onExportCSV: handleExportCSV,
    // TODO: Implement console export handlers
    // onExportEos: handleExportEos,
    // onExportGrandMA2: handleExportGrandMA2,
    // onExportGrandMA3: handleExportGrandMA3,
  });

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Breadcrumbs */}
      {!embedded && <Breadcrumbs />}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{projectName}</h1>
                {!embedded && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-lg text-gray-600 dark:text-gray-400">ShowStack:Production</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fixture Schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {processedFixtures.length} / {fixtures.length} fixtures
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{selectedRows.size} selected</span>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar
        selectedCount={selectedRows.size}
        onAddFixture={() => setIsAddFixtureDialogOpen(true)}
        onBulkEdit={() => setIsBulkEditDialogOpen(true)}
        onDeleteSelected={async () => {
          await deleteMultiple(Array.from(selectedRows));
          setSelectedRows(new Set());
        }}
        onDeselectAll={() => setSelectedRows(new Set())}
        onUserColumnSettings={() => setIsUserColumnSettingsOpen(true)}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        userColumnDefinitions={userColumnDefinitions}
        showPowerSummary={showPowerSummary}
        onTogglePowerSummary={() => setShowPowerSummary(!showPowerSummary)}
        onManagePowerRacks={() => setIsRackManagerOpen(true)}
      />

      {/* Sort Bar */}
      <SortBar
        sortConfigs={sortConfigs}
        onSort={handleSort}
        onClearSort={() => setSortConfigs([])}
      />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        locationFilter={locationFilter}
        onLocationChange={setLocationFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onClearFilters={handleClearFilters}
        availableLocations={availableLocations}
        availableTypes={availableTypes}
        availableStatuses={availableStatuses}
      />

      {/* Main Content - Virtual Data Grid with optional Power Summary Sidebar */}
      <main className="flex-1 overflow-hidden flex">
        {/* Equipment Table */}
        <div className="flex-1 overflow-hidden">
          <VirtualDataGrid
            fixtures={processedFixtures}
            selectedRows={selectedRows}
            onSelectRows={setSelectedRows}
            onUpdateFixture={updateFixture}
            columnVisibility={columnVisibility}
            columnOrder={columnOrder}
            onColumnOrderChange={setColumnOrder}
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
            userColumnDefinitions={userColumnDefinitions}
            dimmerRacks={dimmerRacks}
            pdRacks={pdRacks}
          />
        </div>

        {/* Power Summary Sidebar */}
        {showPowerSummary && (
          <div className="w-96 border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <div className="p-4">
              <PowerSummaryPanel
                dimmerRacks={dimmerRacks}
                pdRacks={pdRacks}
                fixtures={fixtures}
              />
            </div>
          </div>
        )}
      </main>

      {/* Status Bar */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>Ready</div>
        <div>ShowStack:Production v0.1.0-alpha</div>
      </footer>

      {/* Add Fixture Dialog */}
      <AddFixtureDialog
        isOpen={isAddFixtureDialogOpen}
        onClose={() => setIsAddFixtureDialogOpen(false)}
        onAdd={addMultipleFixtures}
        existingFixturesCount={fixtures.length}
        autoFillSuggestions={autoFillSuggestions}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        isOpen={isBulkEditDialogOpen}
        selectedCount={selectedRows.size}
        selectedIds={Array.from(selectedRows)}
        onClose={() => setIsBulkEditDialogOpen(false)}
        onSubmit={handleBulkEdit}
        onAutoNumber={handleAutoNumber}
      />

      {/* User Column Settings Dialog */}
      <UserColumnSettingsDialog
        isOpen={isUserColumnSettingsOpen}
        onClose={() => setIsUserColumnSettingsOpen(false)}
        onSave={handleSaveUserColumnDefinitions}
        initialDefinitions={userColumnDefinitions}
      />

      {/* Rack Manager Dialog */}
      {isRackManagerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Power Rack Management</h2>
              <button
                onClick={() => setIsRackManagerOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <RackManager
                projectId={currentProjectId}
                onRacksChange={loadRacks}
              />
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setIsRackManagerOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog {...unsavedChangesDialog} />
    </div>
  );
}
