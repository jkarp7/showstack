import { useState, useEffect } from 'react';
import { VirtualDataGrid } from './components/VirtualDataGrid';
import { Toolbar } from './components/Toolbar';
import { FilterBar } from './components/FilterBar';
import { useFixtureStore } from './store/fixtureStore';

export default function App() {
  const { fixtures, loadFixtures, addFixture, deleteFixture, deleteMultiple, updateFixture } = useFixtureStore();
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
          <div>
            <h1 className="text-2xl font-bold">ShowStack:Production</h1>
            <p className="text-sm text-gray-400">Proof of Concept - Virtual Data Grid</p>
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
            position: String(fixtures.length + 1),
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
