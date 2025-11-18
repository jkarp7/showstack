import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VirtualDataGrid } from '../../components/fixture/VirtualDataGrid';
import { Toolbar } from '../../components/fixture/Toolbar';
import { FilterBar } from '../../components/fixture/FilterBar';
import { SortBar } from '../../components/fixture/SortBar';
import { AddFixtureDialog } from '../../components/fixture/AddFixtureDialog';
import { useFixtureStore } from '../../store/fixtureStore';
import { Fixture } from '../../types';
import { DEFAULT_COLUMN_VISIBILITY, ColumnVisibility, DEFAULT_COLUMN_ORDER, ColumnKey } from '../../types/columns';

export function Production() {
  const navigate = useNavigate();
  const { fixtures, loadFixtures, addMultipleFixtures, deleteMultiple, updateFixture } = useFixtureStore();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isAddFixtureDialogOpen, setIsAddFixtureDialogOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(DEFAULT_COLUMN_VISIBILITY);

  // Column order state
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(DEFAULT_COLUMN_ORDER);

  // Load fixtures from database on mount
  useEffect(() => {
    loadFixtures();
  }, [loadFixtures]);

  // Sort handler - toggle direction if same field, otherwise set new field
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setLocationFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  // Compute unique values for filter dropdowns
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

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        // Special handling for address field - sort by universe, then dmx_address
        if (sortField === 'address') {
          const aUniverse = a.universe || 0;
          const bUniverse = b.universe || 0;
          const aDmx = a.dmx_address || 0;
          const bDmx = b.dmx_address || 0;

          // Sort by universe first
          if (aUniverse !== bUniverse) {
            return sortDirection === 'asc' ? aUniverse - bUniverse : bUniverse - aUniverse;
          }
          // Then by DMX address within universe
          return sortDirection === 'asc' ? aDmx - bDmx : bDmx - aDmx;
        }

        const aValue = a[sortField as keyof Fixture];
        const bValue = b[sortField as keyof Fixture];

        // Handle undefined/null values
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        // Numeric comparison for numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // String comparison for everything else
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [fixtures, searchQuery, locationFilter, typeFilter, statusFilter, sortField, sortDirection]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/modules')}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
            >
              ← Home
            </button>
            <div>
              <h1 className="text-2xl font-bold">ShowStack:Production</h1>
              <p className="text-sm text-gray-400">Fixture Schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {processedFixtures.length} / {fixtures.length} fixtures
            </span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-400">{selectedRows.size} selected</span>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar
        selectedCount={selectedRows.size}
        onAddFixture={() => setIsAddFixtureDialogOpen(true)}
        onDeleteSelected={async () => {
          await deleteMultiple(Array.from(selectedRows));
          setSelectedRows(new Set());
        }}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      {/* Sort Bar */}
      <SortBar
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
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
        />
      </main>

      {/* Status Bar */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
        <div>Ready</div>
        <div>ShowStack:Production v0.1.0-alpha</div>
      </footer>

      {/* Add Fixture Dialog */}
      <AddFixtureDialog
        isOpen={isAddFixtureDialogOpen}
        onClose={() => setIsAddFixtureDialogOpen(false)}
        onAdd={addMultipleFixtures}
        existingFixturesCount={fixtures.length}
      />
    </div>
  );
}
