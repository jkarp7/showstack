import { useState } from 'react';
import type { LayoutElementType, DataFieldType, ShapeType } from '../../../types/prep';

interface PaletteElement {
  type: LayoutElementType;
  subType?: DataFieldType | ShapeType;
  label: string;
  description: string;
  icon: string;
  category: 'data' | 'content' | 'visual';
}

const paletteElements: PaletteElement[] = [
  // Data Fields
  {
    type: 'dataField',
    subType: 'production_name',
    label: 'Production Name',
    description: 'Show name',
    icon: '🎭',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'venue',
    label: 'Venue',
    description: 'Theater or venue name',
    icon: '🏛️',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'venue_city',
    label: 'Venue City',
    description: 'City location',
    icon: '🌆',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'venue_state',
    label: 'Venue State',
    description: 'State/Province',
    icon: '📍',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'order_date',
    label: 'Order Date',
    description: 'Shop order date',
    icon: '📅',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'load_in_date',
    label: 'Load In Date',
    description: 'Load in schedule',
    icon: '📦',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'opening_night_date',
    label: 'Opening Night',
    description: 'Opening date',
    icon: '🎉',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'closing_date',
    label: 'Closing Date',
    description: 'Closing date',
    icon: '🎬',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'prep_start_date',
    label: 'Prep Start Date',
    description: 'Shop prep start',
    icon: '🔧',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'prep_end_date',
    label: 'Prep End Date',
    description: 'Shop prep end',
    icon: '🔧',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'first_preview_date',
    label: 'First Preview',
    description: 'First preview date',
    icon: '🎭',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'gm_name',
    label: 'General Manager',
    description: 'GM name',
    icon: '👤',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'gm_company',
    label: 'GM Company',
    description: 'GM company name',
    icon: '🏢',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'gm_email',
    label: 'GM Email',
    description: 'GM email address',
    icon: '📧',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'gm_phone',
    label: 'GM Phone',
    description: 'GM phone number',
    icon: '📞',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pm_name',
    label: 'Production Manager',
    description: 'PM name',
    icon: '👤',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pm_company',
    label: 'PM Company',
    description: 'PM company name',
    icon: '🏢',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pm_email',
    label: 'PM Email',
    description: 'PM email address',
    icon: '📧',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pm_phone',
    label: 'PM Phone',
    description: 'PM phone number',
    icon: '📞',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ld_name',
    label: 'Lighting Designer',
    description: 'LD name',
    icon: '💡',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ld_email',
    label: 'LD Email',
    description: 'LD email address',
    icon: '📧',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ld_phone',
    label: 'LD Phone',
    description: 'LD phone number',
    icon: '📞',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ald_name',
    label: 'Associate LD',
    description: 'ALD name',
    icon: '👤',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ald_email',
    label: 'ALD Email',
    description: 'ALD email address',
    icon: '📧',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ald_phone',
    label: 'ALD Phone',
    description: 'ALD phone number',
    icon: '📞',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pe_name',
    label: 'Production Electrician',
    description: 'PE name',
    icon: '👤',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pe_email',
    label: 'PE Email',
    description: 'PE email address',
    icon: '📧',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pe_phone',
    label: 'PE Phone',
    description: 'PE phone number',
    icon: '📞',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'current_revision',
    label: 'Current Revision',
    description: 'Revision number',
    icon: '🔄',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'logo',
    label: 'Production Logo',
    description: 'Show logo image',
    icon: '🖼️',
    category: 'data'
  },

  // Paperwork-specific fields
  {
    type: 'dataField',
    subType: 'report_title',
    label: 'Report Title',
    description: 'Dynamic report title',
    icon: '📋',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'revision_date',
    label: 'Revision Date',
    description: 'Last revision date',
    icon: '📅',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'generated_date',
    label: 'Generated Date',
    description: 'Report generation date',
    icon: '🕒',
    category: 'data'
  },

  // Fixture summary fields
  {
    type: 'dataField',
    subType: 'total_fixtures',
    label: 'Total Fixtures',
    description: 'Count of all fixtures',
    icon: '💡',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'total_wattage',
    label: 'Total Wattage',
    description: 'Sum of fixture wattage',
    icon: '⚡',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'total_amperage',
    label: 'Total Amperage',
    description: 'Sum of fixture amperage',
    icon: '🔌',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'universe_count',
    label: 'Universe Count',
    description: 'DMX universes in use',
    icon: '🌐',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'fixture_type_count',
    label: 'Fixture Types',
    description: 'Unique fixture types',
    icon: '🏷️',
    category: 'data'
  },

  // Infrastructure summary fields
  {
    type: 'dataField',
    subType: 'total_infrastructure',
    label: 'Total Infrastructure',
    description: 'All infrastructure equipment',
    icon: '🔧',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'network_equipment_count',
    label: 'Network Equipment',
    description: 'Network devices count',
    icon: '🌐',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'audio_equipment_count',
    label: 'Audio Equipment',
    description: 'Audio devices count',
    icon: '🔊',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'video_equipment_count',
    label: 'Video Equipment',
    description: 'Video devices count',
    icon: '📹',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'data_distribution_count',
    label: 'Data Distribution',
    description: 'Data distribution count',
    icon: '📡',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'total_ports',
    label: 'Total Ports',
    description: 'All configured ports',
    icon: '🔌',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'active_infrastructure',
    label: 'Active Equipment',
    description: 'Active infrastructure',
    icon: '✅',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'inactive_infrastructure',
    label: 'Inactive Equipment',
    description: 'Inactive infrastructure',
    icon: '❌',
    category: 'data'
  },

  // Content Elements
  {
    type: 'text',
    label: 'Text Box',
    description: 'Custom text content',
    icon: '📝',
    category: 'content'
  },
  {
    type: 'equipment_list',
    label: 'Equipment List',
    description: 'Dynamic equipment by section',
    icon: '📦',
    category: 'content'
  },
  {
    type: 'notes_content',
    label: 'Notes Content',
    description: 'Dynamic notes and conditions',
    icon: '📋',
    category: 'content'
  },
  {
    type: 'revision_log',
    label: 'Revision Log',
    description: 'Dynamic revision changes',
    icon: '📜',
    category: 'content'
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Custom image or graphic',
    icon: '🖼️',
    category: 'content'
  },
  {
    type: 'table',
    label: 'Contact Table',
    description: 'Formatted contact info grid',
    icon: '📋',
    category: 'content'
  },

  // Visual Elements
  {
    type: 'shape',
    subType: 'rectangle',
    label: 'Rectangle',
    description: 'Box or background',
    icon: '⬜',
    category: 'visual'
  },
  {
    type: 'shape',
    subType: 'line',
    label: 'Line',
    description: 'Horizontal or vertical line',
    icon: '➖',
    category: 'visual'
  },
  {
    type: 'shape',
    subType: 'divider',
    label: 'Divider',
    description: 'Section divider',
    icon: '━━━',
    category: 'visual'
  }
];

interface ElementPaletteProps {
  onDragStart: (element: PaletteElement) => void;
  onDragEnd?: () => void;
}

export function ElementPalette({ onDragStart, onDragEnd }: ElementPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'data' | 'content' | 'visual'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['data', 'content', 'visual'])); // All collapsed by default
  const [draggedElement, setDraggedElement] = useState<PaletteElement | null>(null);

  const filteredElements = paletteElements.filter(element => {
    const matchesCategory = activeCategory === 'all' || element.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      element.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      element.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (category: 'data' | 'content' | 'visual') => {
    return paletteElements.filter(e => e.category === category).length;
  };

  const toggleSection = (category: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedSections(newCollapsed);
  };

  const groupedElements = {
    data: filteredElements.filter(e => e.category === 'data'),
    content: filteredElements.filter(e => e.category === 'content'),
    visual: filteredElements.filter(e => e.category === 'visual')
  };

  const categoryConfig = {
    data: { title: 'Data Fields', icon: '📊', color: 'blue' },
    content: { title: 'Content Elements', icon: '📝', color: 'green' },
    visual: { title: 'Visual Elements', icon: '🎨', color: 'purple' }
  };

  return (
    <div className="w-80 bg-gray-800 border border-gray-700 rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 uppercase mb-3">Element Library</h3>

        {/* Search Icon/Bar */}
        {!searchExpanded ? (
          <button
            onClick={() => setSearchExpanded(true)}
            className="w-full p-2 hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-2 mb-3"
            title="Search elements"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs text-gray-400">Search elements...</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                setSearchExpanded(false);
                setSearchQuery('');
              }}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Close search"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveCategory('data')}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition ${
              activeCategory === 'data'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Data ({getCategoryCount('data')})
          </button>
          <button
            onClick={() => setActiveCategory('content')}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition ${
              activeCategory === 'content'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Content ({getCategoryCount('content')})
          </button>
          <button
            onClick={() => setActiveCategory('visual')}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition ${
              activeCategory === 'visual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Visual ({getCategoryCount('visual')})
          </button>
        </div>
      </div>

      {/* Elements List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredElements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm font-medium">No elements found</div>
            <div className="text-xs text-gray-600 mt-1">Try adjusting your search or filters</div>
          </div>
        ) : activeCategory === 'all' ? (
          // Grouped view with collapsible sections
          <div className="space-y-4">
            {(Object.keys(groupedElements) as Array<keyof typeof groupedElements>).map(category => {
              const elements = groupedElements[category];
              if (elements.length === 0) return null;

              const config = categoryConfig[category];
              const isCollapsed = collapsedSections.has(category);

              return (
                <div key={category} className="space-y-2">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(category)}
                    className="w-full flex items-center justify-between p-2 bg-gray-700 hover:bg-gray-650 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-sm font-semibold text-gray-200">
                        {config.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({elements.length})
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Section Elements */}
                  {!isCollapsed && (
                    <div className="space-y-2 pl-2">
                      {elements.map((element, index) => (
                        <div
                          key={`${element.type}-${element.subType || index}`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'copy';
                            e.dataTransfer.setData('application/json', JSON.stringify(element));
                            setDraggedElement(element);
                            onDragStart(element);
                          }}
                          onDragEnd={() => {
                            setDraggedElement(null);
                            onDragEnd?.();
                          }}
                          className={`p-3 bg-gray-700/50 border-2 rounded-lg cursor-move transition-all group shadow-sm hover:shadow-md ${
                            draggedElement === element
                              ? 'border-blue-500 opacity-50'
                              : 'border-gray-600 hover:border-blue-400 hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                              {element.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-200 truncate">
                                {element.label}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                                {element.description}
                              </div>
                              <div className="flex items-center gap-1 mt-1.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  config.color === 'blue'
                                    ? 'bg-blue-900/60 text-blue-300'
                                    : config.color === 'green'
                                    ? 'bg-green-900/60 text-green-300'
                                    : 'bg-purple-900/60 text-purple-300'
                                }`}>
                                  {element.type}
                                </span>
                              </div>
                            </div>
                            {/* Drag handle indicator */}
                            <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Simple list view for single category
          <div className="space-y-2">
            {filteredElements.map((element, index) => (
              <div
                key={`${element.type}-${element.subType || index}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.setData('application/json', JSON.stringify(element));
                  setDraggedElement(element);
                  onDragStart(element);
                }}
                onDragEnd={() => {
                  setDraggedElement(null);
                  onDragEnd?.();
                }}
                className={`p-3 bg-gray-700/50 border-2 rounded-lg cursor-move transition-all group shadow-sm hover:shadow-md ${
                  draggedElement === element
                    ? 'border-blue-500 opacity-50'
                    : 'border-gray-600 hover:border-blue-400 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {element.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-200 truncate">
                      {element.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {element.description}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        element.category === 'data'
                          ? 'bg-blue-900/60 text-blue-300'
                          : element.category === 'content'
                          ? 'bg-green-900/60 text-green-300'
                          : 'bg-purple-900/60 text-purple-300'
                      }`}>
                        {element.type}
                      </span>
                    </div>
                  </div>
                  {/* Drag handle indicator */}
                  <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
