import { useState } from 'react';
import { usePrepStore } from '../../store/prepStore';
import type { Discipline } from '../../types/prep';

interface AddSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectDisciplines: Discipline[];
}

export function AddSectionDialog({
  isOpen,
  onClose,
  projectId,
  projectDisciplines,
}: AddSectionDialogProps) {
  const { createSection, sections } = usePrepStore();
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState<Discipline>(projectDisciplines[0] || 'lighting');
  const [pageBreak, setPageBreak] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Calculate next sort order
    const maxSortOrder = sections.reduce((max, s) => Math.max(max, s.sort_order), -1);
    const nextSortOrder = maxSortOrder + 1;

    await createSection({
      prep_project_id: projectId,
      name: name.trim(),
      discipline,
      sort_order: nextSortOrder,
      page_break: pageBreak,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);
    setName('');
    setDiscipline(projectDisciplines[0] || 'lighting');
    setPageBreak(false);
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">Add Section</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Section Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Moving Lights, LED Fixtures, Audio Consoles"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Discipline</label>
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value as Discipline)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            >
              {projectDisciplines.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Section Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes that will display below the section header..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pageBreak"
              checked={pageBreak}
              onChange={(e) => setPageBreak(e.target.checked)}
              className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="pageBreak" className="text-sm text-gray-300">
              Start this section on a new page (for PDF export)
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
