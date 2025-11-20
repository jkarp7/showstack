import { useState } from 'react';
import type { PrepSection } from '../../types/prep';
import { usePrepStore } from '../../store/prepStore';

interface SectionListProps {
  projectId: string;
  sections: PrepSection[];
  onAddSection: () => void;
  onEditSection: (section: PrepSection) => void;
}

export function SectionList({ projectId, sections, onAddSection, onEditSection }: SectionListProps) {
  const deleteSection = usePrepStore((state) => state.deleteSection);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (sectionId: string) => {
    if (window.confirm('Delete this section? All equipment items in this section will also be deleted.')) {
      setDeletingId(sectionId);
      await deleteSection(sectionId);
      setDeletingId(null);
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);

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
          {sortedSections.map((section) => (
            <div
              key={section.id}
              className="p-4 hover:bg-gray-750 transition group flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="text-gray-500 cursor-move">
                  ⋮⋮
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-white">{section.name}</h4>
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded capitalize">
                      {section.discipline}
                    </span>
                    {section.page_break && (
                      <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded">
                        Page Break
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Sort order: {section.sort_order}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
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
                  {deletingId === section.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
