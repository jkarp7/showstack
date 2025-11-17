import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VirtualDataGrid } from '../../components/fixture/VirtualDataGrid';
import { Toolbar } from '../../components/fixture/Toolbar';
import { FilterBar } from '../../components/fixture/FilterBar';
import { useFixtureStore } from '../../store/fixtureStore';

export function Production() {
  const navigate = useNavigate();
  const { fixtures, loadFixtures, addFixture, deleteMultiple, updateFixture } = useFixtureStore();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Load fixtures from database on mount
  useEffect(() => {
    loadFixtures();
  }, [loadFixtures]);

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
              ← Back to Modules
            </button>
            <div>
              <h1 className="text-2xl font-bold">ShowStack:Production</h1>
              <p className="text-sm text-gray-400">Fixture Schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{fixtures.length} fixtures</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-400">{selectedRows.size} selected</span>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar
        selectedCount={selectedRows.size}
        onAddFixture={() => {
          addFixture({
            position: '', // User enters hanging position (e.g., "1st Electric", "FOH")
            type: 'Source Four 26°',
            channel: String(101 + fixtures.length),
          });
        }}
        onDeleteSelected={async () => {
          await deleteMultiple(Array.from(selectedRows));
          setSelectedRows(new Set());
        }}
      />

      {/* Filter Bar */}
      <FilterBar />

      {/* Main Content - Virtual Data Grid */}
      <main className="flex-1 overflow-hidden">
        <VirtualDataGrid
          fixtures={fixtures}
          selectedRows={selectedRows}
          onSelectRows={setSelectedRows}
          onUpdateFixture={updateFixture}
        />
      </main>

      {/* Status Bar */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
        <div>Ready</div>
        <div>ShowStack:Production v0.1.0-alpha</div>
      </footer>
    </div>
  );
}
