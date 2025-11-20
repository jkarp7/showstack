import { useState } from 'react';
import type { PrepSection, PrepEquipmentItem } from '../../types/prep';
import { usePrepStore } from '../../store/prepStore';
import { EquipmentItemTable } from './EquipmentItemTable';
import { AddItemDialog } from './AddItemDialog';
import { EditItemDialog } from './EditItemDialog';

interface SectionListProps {
  projectId: string;
  sections: PrepSection[];
  onAddSection: () => void;
  onEditSection: (section: PrepSection) => void;
}

export function SectionList({ projectId, sections, onAddSection, onEditSection }: SectionListProps) {
  const { deleteSection, items } = usePrepStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [itemToEdit, setItemToEdit] = useState<PrepEquipmentItem | null>(null);

  const handleDelete = async (sectionId: string) => {
    if (window.confirm('Delete this section? All equipment items in this section will also be deleted.')) {
      setDeletingId(sectionId);
      await deleteSection(sectionId);
      setDeletingId(null);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleAddItem = (sectionId: string) => {
    // Expand the section if not already expanded
    if (!expandedSections.has(sectionId)) {
      const newExpanded = new Set(expandedSections);
      newExpanded.add(sectionId);
      setExpandedSections(newExpanded);
    }
    // Set selected section to trigger inline add in table
    setSelectedSectionId(sectionId);
    // Clear after a brief moment to allow re-triggering
    setTimeout(() => setSelectedSectionId(null), 100);
  };

  const handleEditItem = (item: PrepEquipmentItem) => {
    setItemToEdit(item);
    setShowEditItemDialog(true);
  };

  const getItemsForSection = (sectionId: string) => {
    return items.filter((item) => item.section_id === sectionId);
  };

  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);
  const selectedSection = selectedSectionId
    ? sections.find((s) => s.id === selectedSectionId)
    : null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Equipment Sections</h3>
        <button
          onClick={onAddSection}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition"
        >
          + Add Section
        </button>
      </div>

      {sortedSections.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-gray-400 mb-4">No sections yet</p>
          <p className="text-gray-500 text-sm mb-4">
            Organize your equipment into sections like "Moving Lights", "LED Fixtures", etc.
          </p>
          <button
            onClick={onAddSection}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition"
          >
            Create First Section
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-700">
          {sortedSections.map((section) => {
            const sectionItems = getItemsForSection(section.id);
            const isExpanded = expandedSections.has(section.id);

            return (
              <div key={section.id} className="group">
                {/* Section Header */}
                <div className="p-4 hover:bg-gray-750 transition flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="text-gray-400 hover:text-white transition"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4
                          className="font-medium text-white cursor-pointer hover:text-blue-400 transition"
                          onClick={() => toggleSection(section.id)}
                        >
                          {section.name}
                        </h4>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded capitalize">
                          {section.discipline}
                        </span>
                        {section.page_break && (
                          <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded">
                            Page Break
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {sectionItems.length} item{sectionItems.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleAddItem(section.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition"
                    >
                      + Item
                    </button>
                    <button
                      onClick={() => onEditSection(section)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(section.id)}
                      disabled={deletingId === section.id}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 rounded text-sm text-red-400 transition disabled:opacity-50"
                    >
                      {deletingId === section.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>

                {/* Equipment Items Table (Expanded) */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <EquipmentItemTable
                      sectionId={section.id}
                      items={sectionItems}
                      onAddItem={() => handleAddItem(section.id)}
                      onEditItem={handleEditItem}
                      triggerAdd={selectedSectionId === section.id}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Dialog */}
      <AddItemDialog
        isOpen={showAddItemDialog}
        onClose={() => {
          setShowAddItemDialog(false);
          setSelectedSectionId(null);
        }}
        sectionId={selectedSectionId || ''}
        sectionName={selectedSection?.name || ''}
      />

      {/* Edit Item Dialog */}
      <EditItemDialog
        isOpen={showEditItemDialog}
        onClose={() => {
          setShowEditItemDialog(false);
          setItemToEdit(null);
        }}
        item={itemToEdit}
      />
    </div>
  );
}
