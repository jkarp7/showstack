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

  return (
    <div className="w-80 bg-gray-800 border border-gray-700 rounded-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 uppercase mb-3">Element Library</h3>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search elements..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />

        {/* Category Tabs */}
        <div className="flex gap-1 mt-3">
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
          <div className="text-center py-8 text-gray-500 text-sm">
            No elements found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredElements.map((element, index) => (
              <div
                key={`${element.type}-${element.subType || index}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.setData('application/json', JSON.stringify(element));
                  onDragStart(element);
                }}
                onDragEnd={() => onDragEnd?.()}
                className="p-3 bg-gray-700 border border-gray-600 rounded cursor-move hover:bg-gray-650 hover:border-blue-500 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {element.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-200 truncate">
                      {element.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {element.description}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        element.category === 'data'
                          ? 'bg-blue-900/50 text-blue-300'
                          : element.category === 'content'
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-purple-900/50 text-purple-300'
                      }`}>
                        {element.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Hint */}
      <div className="p-3 border-t border-gray-700 bg-gray-750">
        <p className="text-xs text-gray-400 text-center">
          💡 Drag elements onto the canvas to build your layout
        </p>
      </div>
    </div>
  );
}
