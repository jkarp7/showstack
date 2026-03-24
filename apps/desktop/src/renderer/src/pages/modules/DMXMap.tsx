import React, { useMemo, useEffect } from 'react';
import { useFixtureStore } from '../../store/fixtureStore';
import { Fixture } from '../../types';
import { isIntentionalAddressSharing } from '../../utils/fixtureUtils';

// 512 addresses per universe, displayed as 32 columns × 16 rows
const COLS = 32;
const ADDRESSES_PER_UNIVERSE = 512;

type AddressState = 'used' | 'shared' | 'conflict';

interface AddressInfo {
  fixtures: Fixture[];
  state: AddressState;
}

function buildUniverseMap(fixtures: Fixture[]): Map<number, Map<number, AddressInfo>> {
  const universeMap = new Map<number, Map<number, AddressInfo>>();

  for (const f of fixtures) {
    if (f.universe == null || f.dmx_address == null) continue;
    const universe = f.universe;
    const startAddr = f.dmx_address;
    const footprint = f.dmx_footprint ?? 1;
    if (startAddr < 1 || startAddr > ADDRESSES_PER_UNIVERSE) continue;

    if (!universeMap.has(universe)) universeMap.set(universe, new Map());
    const addrMap = universeMap.get(universe)!;

    const endAddr = Math.min(startAddr + footprint - 1, ADDRESSES_PER_UNIVERSE);
    for (let addr = startAddr; addr <= endAddr; addr++) {
      const existing = addrMap.get(addr);
      if (existing) {
        existing.fixtures.push(f);
      } else {
        addrMap.set(addr, { fixtures: [f], state: 'used' });
      }
    }
  }

  // Second pass: resolve state for addresses with multiple fixtures
  for (const addrMap of universeMap.values()) {
    for (const info of addrMap.values()) {
      if (info.fixtures.length < 2) continue;
      info.state = isIntentionalAddressSharing(info.fixtures) ? 'shared' : 'conflict';
    }
  }

  return universeMap;
}

interface UniverseGridProps {
  universe: number;
  addrMap: Map<number, AddressInfo>;
}

/**
 * Returns per-side border classes that draw a boxed container around a fixture block.
 * Outer edges get a thick dark-blue border; inner cell boundaries get a thin muted line.
 */
function fixtureBorderClasses(addr: number, blockStart: number, blockEnd: number): string {
  const row = Math.floor((addr - 1) / COLS);
  const topEdge = row === Math.floor((blockStart - 1) / COLS);
  const bottomEdge = row === Math.floor((blockEnd - 1) / COLS);
  const leftEdge = addr === blockStart || (addr - 1) % COLS === 0;
  const rightEdge = addr === blockEnd || addr % COLS === 0;

  return [
    topEdge
      ? 'border-t-2 border-t-blue-700 dark:border-t-blue-400'
      : 'border-t border-t-blue-300 dark:border-t-blue-600',
    bottomEdge
      ? 'border-b-2 border-b-blue-700 dark:border-b-blue-400'
      : 'border-b border-b-blue-300 dark:border-b-blue-600',
    leftEdge
      ? 'border-l-2 border-l-blue-700 dark:border-l-blue-400'
      : 'border-l border-l-blue-300 dark:border-l-blue-600',
    rightEdge
      ? 'border-r-2 border-r-blue-700 dark:border-r-blue-400'
      : 'border-r border-r-blue-300 dark:border-r-blue-600',
  ].join(' ');
}

function UniverseGrid({ universe, addrMap }: UniverseGridProps) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Universe {universe}
        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
          {addrMap.size} / {ADDRESSES_PER_UNIVERSE} used
        </span>
      </h3>
      <div
        className="grid border border-gray-200 dark:border-gray-700 rounded overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {Array.from({ length: ADDRESSES_PER_UNIVERSE }, (_, i) => {
          const addr = i + 1;
          const info = addrMap.get(addr);

          let bg = 'bg-gray-50 dark:bg-gray-900';
          let title = `Address ${addr} — empty`;
          let cellContent: React.ReactNode = null;
          // Empty cells use the standard thin grid border
          let borderClass = 'border-r border-b border-gray-200 dark:border-gray-800';

          if (info) {
            const f = info.fixtures[0];

            if (info.state === 'conflict') {
              bg = 'bg-red-500';
              title = `Address ${addr} — CONFLICT (${info.fixtures.length} fixtures): ${info.fixtures.map((fx) => fx.channel || fx.type || fx.id).join(', ')}`;
              cellContent = (
                <span className="truncate px-0.5 text-white font-bold">
                  {f.channel?.trim() || f.type?.trim() || String(addr)}
                </span>
              );
            } else if (info.state === 'shared') {
              bg = 'bg-teal-400 dark:bg-teal-600';
              title = `Address ${addr} — shared (${info.fixtures.length} fixtures): ${info.fixtures.map((fx) => fx.channel || fx.type || fx.id).join(', ')}`;
              cellContent = (
                <span className="truncate px-0.5 text-white font-bold">
                  {f.channel?.trim() || f.type?.trim() || String(addr)}
                </span>
              );
            } else {
              const footprint = f.dmx_footprint ?? 1;
              const blockStart = f.dmx_address!;
              const blockEnd = blockStart + footprint - 1;
              const isStart = addr === blockStart;
              const footprintSuffix =
                footprint > 1 ? ` · ${f.mode ?? 'mode unknown'} (${footprint}ch)` : '';
              title =
                `Address ${addr} — Ch ${f.channel ?? '—'} ${f.type ?? ''} ${f.position ?? ''}${footprintSuffix}`.trim();

              bg = isStart ? 'bg-blue-500 dark:bg-blue-500' : 'bg-blue-200 dark:bg-blue-800';
              borderClass = fixtureBorderClasses(addr, blockStart, blockEnd);

              if (isStart) {
                cellContent = (
                  <span className="truncate px-0.5 text-white font-bold">
                    {f.channel?.trim() || f.type?.trim() || String(addr)}
                  </span>
                );
              }
            }
          }

          return (
            <div
              key={addr}
              title={title}
              className={`${bg} ${borderClass} h-5 flex items-center justify-center overflow-hidden cursor-default text-[7px] leading-none`}
            >
              {cellContent}
            </div>
          );
        })}
      </div>
      {/* Address axis labels */}
      <div className="grid mt-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: COLS }, (_, col) => (
          <div key={col} className="text-center text-[7px] text-gray-400 dark:text-gray-600">
            {col + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DMXMap() {
  const fixtures = useFixtureStore((state) => state.fixtures);
  const loadFixtures = useFixtureStore((state) => state.loadFixtures);
  const currentProjectId = useFixtureStore((state) => state.currentProjectId);

  useEffect(() => {
    window.api?.menu?.setState({ context: 'module' });
    return () => {
      window.api?.menu?.setState({ context: 'module' });
    };
  }, []);

  // Reload fixtures on mount so footprints and DMX data are always fresh,
  // regardless of whether EquipmentManager was visited first.
  useEffect(() => {
    if (currentProjectId) {
      loadFixtures(currentProjectId);
    }
  }, [currentProjectId, loadFixtures]);

  const universeMap = useMemo(() => buildUniverseMap(fixtures), [fixtures]);
  const sortedUniverses = useMemo(
    () => Array.from(universeMap.keys()).sort((a, b) => a - b),
    [universeMap],
  );

  const totalPatched = useMemo(
    () => fixtures.filter((f) => f.universe != null && f.dmx_address != null).length,
    [fixtures],
  );
  const { conflictCount, sharedCount } = useMemo(() => {
    let conflicts = 0;
    let shared = 0;
    for (const addrMap of universeMap.values()) {
      for (const info of addrMap.values()) {
        if (info.state === 'conflict') conflicts++;
        else if (info.state === 'shared') shared++;
      }
    }
    return { conflictCount: conflicts, sharedCount: shared };
  }, [universeMap]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">DMX Map</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {sortedUniverses.length} universe{sortedUniverses.length !== 1 ? 's' : ''} •{' '}
          {totalPatched} patched
        </span>
        {sharedCount > 0 && (
          <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
            {sharedCount} shared
          </span>
        )}
        {conflictCount > 0 && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
          </span>
        )}
        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600" />
            Empty
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-500 border-l-2 border-l-blue-800" />
            Start
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-800" />
            Block
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-teal-400 dark:bg-teal-600" />
            Shared
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
            Conflict
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {sortedUniverses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-600">
            <p className="text-sm">No patched fixtures</p>
            <p className="text-xs mt-1">
              Assign a universe and DMX address to fixtures to see them here.
            </p>
          </div>
        ) : (
          sortedUniverses.map((universe) => (
            <UniverseGrid key={universe} universe={universe} addrMap={universeMap.get(universe)!} />
          ))
        )}
      </div>
    </div>
  );
}
