import { useState, useEffect, useRef } from 'react';

interface GdtfSearchResult {
  id: string;
  manufacturer: string;
  model: string;
  source: string;
}

interface GdtfMode {
  name: string;
  channel_count: number;
}

interface GdtfPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user confirms a mode selection */
  onSelect: (mode: string, channelCount: number) => void;
}

export function GdtfPickerDialog({ isOpen, onClose, onSelect }: GdtfPickerDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GdtfSearchResult[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<GdtfSearchResult | null>(null);
  const [modes, setModes] = useState<GdtfMode[]>([]);
  const [selectedModeIndex, setSelectedModeIndex] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedFixture(null);
      setModes([]);
      setSelectedModeIndex(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const hits = (await window.api?.gdtf?.search(query)) ?? [];
        setResults(hits);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Load modes when fixture is selected
  useEffect(() => {
    if (!selectedFixture) {
      setModes([]);
      setSelectedModeIndex(null);
      return;
    }
    window.api?.gdtf
      ?.getModes(selectedFixture.id)
      .then((m) => {
        setModes(m ?? []);
        setSelectedModeIndex(m && m.length > 0 ? 0 : null);
      })
      .catch(() => {
        setModes([]);
        setSelectedModeIndex(null);
      });
  }, [selectedFixture]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedModeIndex == null || !modes[selectedModeIndex]) return;
    const mode = modes[selectedModeIndex];
    onSelect(mode.name, mode.channel_count);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fixture Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedFixture(null);
            }}
            placeholder="Search manufacturer or model…"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex min-h-0 px-5 pt-3 pb-4 gap-3">
          {/* Results list */}
          <div className="flex-1 flex flex-col min-h-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {searching
                ? 'Searching…'
                : query.trim()
                  ? `${results.length} result${results.length !== 1 ? 's' : ''}`
                  : 'Type to search'}
            </p>
            <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedFixture(r)}
                  className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${
                    selectedFixture?.id === r.id
                      ? 'bg-blue-100 dark:bg-blue-900/50 font-medium text-blue-900 dark:text-blue-200'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="font-medium truncate">{r.model}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {r.manufacturer}
                  </div>
                </button>
              ))}
              {!searching && query.trim() && results.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">
                  No fixtures found
                </div>
              )}
            </div>
          </div>

          {/* Mode list */}
          <div className="w-52 flex flex-col min-h-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {selectedFixture ? 'Select mode' : 'Modes'}
            </p>
            <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded">
              {!selectedFixture && (
                <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">
                  Select a fixture
                </div>
              )}
              {selectedFixture && modes.length === 0 && (
                <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">
                  No modes available
                </div>
              )}
              {modes.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedModeIndex(i)}
                  className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${
                    selectedModeIndex === i
                      ? 'bg-blue-100 dark:bg-blue-900/50 font-medium text-blue-900 dark:text-blue-200'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="truncate">{m.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {m.channel_count}ch
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedModeIndex == null}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
