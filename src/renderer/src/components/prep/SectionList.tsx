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
  const { deleteSection, updateSection, items } = usePrepStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [itemToEdit, setItemToEdit] = useState<PrepEquipmentItem | null>(null);
  const [draggedSection, setDraggedSection] = useState<PrepSection | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingSectionNotes, setEditingSectionNotes] = useState<{
    sectionId: string;
    value: string;
  } | null>(null);

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

  // Drag and drop handlers for sections
  const handleSectionDragStart = (e: React.DragEvent, section: PrepSection) => {
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleSectionDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleSectionDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedSection) return;

    const sourceIndex = sortedSections.findIndex((s) => s.id === draggedSection.id);
    if (sourceIndex === targetIndex) return;

    // Reorder sections
    const reordered = [...sortedSections];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update sort_order for all affected sections
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].sort_order !== i) {
        await updateSection(reordered[i].id, { sort_order: i });
      }
    }

    setDraggedSection(null);
  };

  const handleSectionDragEnd = () => {
    setDraggedSection(null);
    setDragOverIndex(null);
  };

  const handleSectionNotesClick = (sectionId: string, currentNotes: string) => {
    setEditingSectionNotes({ sectionId, value: currentNotes || '' });
  };

  const handleSectionNotesChange = (value: string) => {
    if (editingSectionNotes) {
      setEditingSectionNotes({ ...editingSectionNotes, value });
    }
  };

  const handleSectionNotesBlur = async () => {
    if (!editingSectionNotes) return;

    const section = sections.find((s) => s.id === editingSectionNotes.sectionId);
    if (section && section.notes !== editingSectionNotes.value) {
      await updateSection(editingSectionNotes.sectionId, {
        notes: editingSectionNotes.value.trim() || undefined,
      });
    }

    setEditingSectionNotes(null);
  };

  const handleSectionNotesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // SHIFT+ENTER: Allow line break (default textarea behavior)
        return;
      } else {
        // Regular ENTER: Save
        e.preventDefault();
        handleSectionNotesBlur();
      }
    } else if (e.key === 'Escape') {
      setEditingSectionNotes(null);
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);
  const selectedSection = selectedSectionId
    ? sections.find((s) => s.id === selectedSectionId)
    : null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Equipment Sections</h3>
        <button
          onClick={onAddSection}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-gray-900 dark:text-white text-sm font-medium transition"
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-gray-900 dark:text-white text-sm font-medium transition"
          >
            Create First Section
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-700">
          {sortedSections.map((section, index) => {
            const sectionItems = getItemsForSection(section.id);
            const isExpanded = expandedSections.has(section.id);

            return (
              <div
                key={section.id}
                draggable
                onDragStart={(e) => handleSectionDragStart(e, section)}
                onDragOver={(e) => handleSectionDragOver(e, index)}
                onDragLeave={handleSectionDragLeave}
                onDrop={(e) => handleSectionDrop(e, index)}
                onDragEnd={handleSectionDragEnd}
                className={`group ${dragOverIndex === index ? 'border-t-2 border-blue-500' : ''} ${
                  draggedSection?.id === section.id ? 'opacity-50' : ''
                }`}
              >
                {/* Section Header */}
                <div className="p-4 hover:bg-gray-750 transition flex items-center justify-between cursor-move">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="text-gray-400 hover:text-gray-900 dark:text-white transition"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4
                          className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-400 transition"
                          onClick={() => toggleSection(section.id)}
                        >
                          {section.name}
                        </h4>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded capitalize">
                          {section.discipline}
                        </span>
                        {Boolean(section.page_break) && (
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
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-gray-900 dark:text-white transition"
                    >
                      + Item
                    </button>
                    <button
                      onClick={() => onEditSection(section)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-900 dark:text-white transition"
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

                {/* Section Notes - Inline Editable */}
                {isExpanded && (
                  <div className="px-4 py-2 bg-gray-800/50">
                    {editingSectionNotes?.sectionId === section.id ? (
                      <textarea
                        value={editingSectionNotes.value}
                        onChange={(e) => handleSectionNotesChange(e.target.value)}
                        onBlur={handleSectionNotesBlur}
                        onKeyDown={handleSectionNotesKeyDown}
                        placeholder="Add section notes... (SHIFT+ENTER for new line, ENTER to save)"
                        rows={3}
                        className="w-full px-2 py-1 bg-gray-600 border border-blue-500 rounded text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none resize-none"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => handleSectionNotesClick(section.id, section.notes || '')}
                        className="text-sm text-gray-300 italic cursor-pointer hover:text-gray-800 dark:text-gray-200 hover:bg-gray-700 rounded px-1 py-0.5 transition min-h-[24px] whitespace-pre-wrap"
                      >
                        {section.notes || '+ Add section notes...'}
                      </div>
                    )}
                  </div>
                )}

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
