import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VirtualDataGrid } from '../../components/fixture/VirtualDataGrid';
import { Toolbar } from '../../components/fixture/Toolbar';
import { FilterBar } from '../../components/fixture/FilterBar';
import { SortBar } from '../../components/fixture/SortBar';
import { AddFixtureDialog } from '../../components/fixture/AddFixtureDialog';
import { BulkEditDialog } from '../../components/fixture/BulkEditDialog';
import { UserColumnSettingsDialog } from '../../components/fixture/UserColumnSettingsDialog';
import { FileMenu } from '../../components/common/FileMenu';
import { UnsavedChangesDialog, useUnsavedChangesDialog } from '../../components/common/UnsavedChangesDialog';
import { useFixtureStore } from '../../store/fixtureStore';
import { useFileStore } from '../../store/fileStore';
import { Fixture } from '../../types';
import { DEFAULT_COLUMN_VISIBILITY, ColumnVisibility, DEFAULT_COLUMN_ORDER, ColumnKey } from '../../types/columns';

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

  // Function to reload all data (for file operations)
  const handleDataReload = async () => {
    await loadFixtures(currentProjectId);

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
  }, [loadFixtures, currentProjectId]);

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

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            {!embedded && (
              <button
                onClick={() => navigate('/modules')}
                className="px-3 py-1.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded text-sm transition"
              >
                ← Home
              </button>
            )}
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {processedFixtures.length} / {fixtures.length} fixtures
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{selectedRows.size} selected</span>
          </div>
        </div>

        {/* File Menu */}
        <FileMenu onDataReload={handleDataReload} projectName={projectName} />
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
        onUserColumnSettings={() => setIsUserColumnSettingsOpen(true)}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        userColumnDefinitions={userColumnDefinitions}
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

      {/* Main Content - Virtual Data Grid */}
      <main className="flex-1 overflow-hidden">
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
        />
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
        onClose={() => setIsBulkEditDialogOpen(false)}
        onSubmit={handleBulkEdit}
      />

      {/* User Column Settings Dialog */}
      <UserColumnSettingsDialog
        isOpen={isUserColumnSettingsOpen}
        onClose={() => setIsUserColumnSettingsOpen(false)}
        onSave={handleSaveUserColumnDefinitions}
        initialDefinitions={userColumnDefinitions}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog {...unsavedChangesDialog} />
    </div>
  );
}
