import { useState } from 'react';
import type { LayoutElementType, DataFieldType, ShapeType } from '../../../types/shopOrder';

interface PaletteElement {
  type: LayoutElementType;
  subType?: DataFieldType | ShapeType;
  label: string;
  description: string;
  category: 'data' | 'content' | 'visual';
}

const paletteElements: PaletteElement[] = [
  // Data Fields
  {
    type: 'dataField',
    subType: 'production_name',
    label: 'Production Name',
    description: 'Show name',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'venue',
    label: 'Venue',
    description: 'Theater or venue name',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'venue_city',
    label: 'Venue City',
    description: 'City location',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'venue_state',
    label: 'Venue State',
    description: 'State/Province',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'order_date',
    label: 'Order Date',
    description: 'Shop order date',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'load_in_date',
    label: 'Load In Date',
    description: 'Load in schedule',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'opening_night_date',
    label: 'Opening Night',
    description: 'Opening date',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'closing_date',
    label: 'Closing Date',
    description: 'Closing date',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'prep_start_date',
    label: 'Prep Start Date',
    description: 'Shop prep start',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'prep_end_date',
    label: 'Prep End Date',
    description: 'Shop prep end',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'first_preview_date',
    label: 'First Preview',
    description: 'First preview date',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'gm_name',
    label: 'General Manager',
    description: 'GM name',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'gm_company',
    label: 'GM Company',
    description: 'GM company name',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'gm_email',
    label: 'GM Email',
    description: 'GM email address',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'gm_phone',
    label: 'GM Phone',
    description: 'GM phone number',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pm_name',
    label: 'Production Manager',
    description: 'PM name',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pm_company',
    label: 'PM Company',
    description: 'PM company name',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pm_email',
    label: 'PM Email',
    description: 'PM email address',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pm_phone',
    label: 'PM Phone',
    description: 'PM phone number',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ld_name',
    label: 'Lighting Designer',
    description: 'LD name',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ld_email',
    label: 'LD Email',
    description: 'LD email address',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ld_phone',
    label: 'LD Phone',
    description: 'LD phone number',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ald_name',
    label: 'Associate LD',
    description: 'ALD name',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ald_email',
    label: 'ALD Email',
    description: 'ALD email address',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'ald_phone',
    label: 'ALD Phone',
    description: 'ALD phone number',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pe_name',
    label: 'Production Electrician',
    description: 'PE name',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pe_email',
    label: 'PE Email',
    description: 'PE email address',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'pe_phone',
    label: 'PE Phone',
    description: 'PE phone number',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'current_revision',
    label: 'Current Revision',
    description: 'Revision number',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'logo',
    label: 'Production Logo',
    description: 'Show logo image',
    category: 'data'
  },

  // Paperwork-specific fields
  {
    type: 'dataField',
    subType: 'report_title',
    label: 'Report Title',
    description: 'Dynamic report title',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'revision_date',
    label: 'Revision Date',
    description: 'Last revision date',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'generated_date',
    label: 'Generated Date',
    description: 'Report generation date',
    category: 'data'
  },

  // Fixture summary fields
  {
    type: 'dataField',
    subType: 'total_fixtures',
    label: 'Total Fixtures',
    description: 'Count of all fixtures',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'total_wattage',
    label: 'Total Wattage',
    description: 'Sum of fixture wattage',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'total_amperage',
    label: 'Total Amperage',
    description: 'Sum of fixture amperage',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'universe_count',
    label: 'Universe Count',
    description: 'DMX universes in use',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'fixture_type_count',
    label: 'Fixture Types',
    description: 'Unique fixture types',
    category: 'data'
  },

  // Infrastructure summary fields
  {
    type: 'dataField',
    subType: 'total_infrastructure',
    label: 'Total Infrastructure',
    description: 'All infrastructure equipment',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'network_equipment_count',
    label: 'Network Equipment',
    description: 'Network devices count',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'audio_equipment_count',
    label: 'Audio Equipment',
    description: 'Audio devices count',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'video_equipment_count',
    label: 'Video Equipment',
    description: 'Video devices count',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'data_distribution_count',
    label: 'Data Distribution',
    description: 'Data distribution count',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'total_ports',
    label: 'Total Ports',
    description: 'All configured ports',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'active_infrastructure',
    label: 'Active Equipment',
    description: 'Active infrastructure',
    category: 'data'
  },
  {
    type: 'dataField',
    subType: 'inactive_infrastructure',
    label: 'Inactive Equipment',
    description: 'Inactive infrastructure',
    category: 'data'
  },

  // Content Elements
  {
    type: 'text',
    label: 'Text Box',
    description: 'Custom text content',
    category: 'content'
  },
  {
    type: 'equipment_list',
    label: 'Equipment List',
    description: 'Dynamic equipment by section',
    category: 'content'
  },
  {
    type: 'notes_content',
    label: 'Notes Content',
    description: 'Dynamic notes and conditions',
    category: 'content'
  },
  {
    type: 'revision_log',
    label: 'Revision Log',
    description: 'Dynamic revision changes',
    category: 'content'
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Custom image or graphic',
    category: 'content'
  },
  {
    type: 'table',
    label: 'Contact Table',
    description: 'Formatted contact info grid',
    category: 'content'
  },

  // Visual Elements
  {
    type: 'shape',
    subType: 'rectangle',
    label: 'Rectangle',
    description: 'Box or background',
    category: 'visual'
  },
  {
    type: 'shape',
    subType: 'line',
    label: 'Line',
    description: 'Horizontal or vertical line',
    category: 'visual'
  },
  {
    type: 'shape',
    subType: 'divider',
    label: 'Divider',
    description: 'Section divider',
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
    data: { title: 'Data Fields', color: 'blue' },
    content: { title: 'Content Elements', color: 'green' },
    visual: { title: 'Visual Elements', color: 'purple' }
  };

  return (
    <div className="w-80 bg-gray-800 border border-gray-700 rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        {/* Header with Search Icon */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase">Element Library</h3>
          {!searchExpanded && (
            <button
              onClick={() => setSearchExpanded(true)}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
              title="Search elements"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Bar (appears below when expanded) */}
        {searchExpanded && (
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
