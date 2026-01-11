import { useState, useEffect, useRef, useMemo } from 'react';

export interface Command {
  id: string;
  label: string;
  description?: string;
  category: string;
  shortcut?: string;
  action: () => void;
  icon?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fuzzy search implementation
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return commands;
    }

    const query = searchQuery.toLowerCase();

    return commands
      .map(command => {
        const labelLower = command.label.toLowerCase();
        const descLower = (command.description || '').toLowerCase();
        const categoryLower = command.category.toLowerCase();

        // Calculate match score
        let score = 0;

        // Exact match gets highest score
        if (labelLower === query) score += 1000;
        // Starts with query
        else if (labelLower.startsWith(query)) score += 500;
        // Contains query
        else if (labelLower.includes(query)) score += 250;

        // Check description
        if (descLower.includes(query)) score += 100;

        // Check category
        if (categoryLower.includes(query)) score += 50;

        // Fuzzy match - give points for matching characters in order
        let lastIndex = -1;
        let fuzzyScore = 0;
        for (const char of query) {
          const index = labelLower.indexOf(char, lastIndex + 1);
          if (index > lastIndex) {
            fuzzyScore += 10;
            lastIndex = index;
          }
        }
        score += fuzzyScore;

        return { command, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ command }) => command);
  }, [searchQuery, commands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, Command[]>();

    filteredCommands.forEach(command => {
      const existing = groups.get(command.category) || [];
      groups.set(command.category, [...existing, command]);
    });

    return Array.from(groups.entries()).map(([category, commands]) => ({
      category,
      commands
    }));
  }, [filteredCommands]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = filteredCommands[selectedIndex];
        if (command) {
          command.action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredCommands, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-gray-500"
            />
            <div className="text-xs text-gray-500">
              ESC to close
            </div>
          </div>
        </div>

        {/* Commands List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-sm font-medium">No commands found</div>
              <div className="text-xs text-gray-600 mt-1">Try a different search term</div>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedCommands.map(({ category, commands }) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {category}
                  </div>

                  {/* Commands in Category */}
                  <div className="space-y-1">
                    {commands.map((command) => {
                      const currentIndex = globalIndex++;
                      const isSelected = currentIndex === selectedIndex;

                      return (
                        <button
                          key={command.id}
                          data-index={currentIndex}
                          onClick={() => {
                            command.action();
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-700 text-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {command.icon && (
                              <span className="text-lg">{command.icon}</span>
                            )}
                            <div className="flex-1 text-left min-w-0">
                              <div className="font-medium text-sm truncate">
                                {command.label}
                              </div>
                              {command.description && (
                                <div className={`text-xs mt-0.5 truncate ${
                                  isSelected ? 'text-blue-200' : 'text-gray-400'
                                }`}>
                                  {command.description}
                                </div>
                              )}
                            </div>
                          </div>

                          {command.shortcut && (
                            <div className={`text-xs font-mono px-2 py-1 rounded ${
                              isSelected
                                ? 'bg-blue-700 text-blue-100'
                                : 'bg-gray-700 text-gray-400'
                            }`}>
                              {command.shortcut}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div>
            {filteredCommands.length} {filteredCommands.length === 1 ? 'command' : 'commands'}
          </div>
        </div>
      </div>
    </div>
  );
}
