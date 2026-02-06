import { useState, useEffect } from 'react';
import { useShopOrderStore } from '../../store/shopOrderStore';
import type { ShopOrderSection, Discipline } from '../../types/shopOrder';

interface EditSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: ShopOrderSection | null;
  projectDisciplines: Discipline[];
}

export function EditSectionDialog({
  isOpen,
  onClose,
  section,
  projectDisciplines,
}: EditSectionDialogProps) {
  const updateSection = useShopOrderStore((state) => state.updateSection);
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState<Discipline>('lighting');
  const [pageBreak, setPageBreak] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (section) {
      setName(section.name);
      setDiscipline(section.discipline as Discipline);
      setPageBreak(!!section.page_break);
      setSortOrder(section.sort_order);
    }
  }, [section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!section || !name.trim()) {
      return;
    }

    setIsSubmitting(true);

    await updateSection(section.id, {
      name: name.trim(),
      discipline,
      page_break: pageBreak ? 1 : 0,
      sort_order: sortOrder,
    });

    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen || !section) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Section</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Section Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Moving Lights, LED Fixtures, Audio Consoles"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Discipline</label>
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value as Discipline)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {projectDisciplines.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the list</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pageBreakEdit"
              checked={pageBreak}
              onChange={(e) => setPageBreak(e.target.checked)}
              className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="pageBreakEdit" className="text-sm text-gray-300">
              Start this section on a new page (for PDF export)
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-900 dark:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-gray-900 dark:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
