import { useState, useEffect } from 'react';
import { useShopOrderStore } from '../../store/shopOrderStore';
import { useProjectStore } from '../../store/projectStore';
import type { Discipline } from '../../types/shopOrder';

interface NewShopOrderProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (projectId: string) => void;
  parentProjectId?: string; // Optional parent project to link to
}

export function NewShopOrderProjectDialog({
  isOpen,
  onClose,
  onProjectCreated,
  parentProjectId,
}: NewShopOrderProjectDialogProps) {
  const createProject = useShopOrderStore((state) => state.createProject);
  const { projects } = useProjectStore();
  const [productionName, setProductionName] = useState('');
  const [venue, setVenue] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>(['lighting']);
  const [isLinked, setIsLinked] = useState(!!parentProjectId);

  const disciplines: Discipline[] = ['lighting', 'audio', 'video', 'rigging', 'scenic', 'props'];

  // Auto-populate from parent project when available
  useEffect(() => {
    if (isLinked && parentProjectId) {
      const parentProject = projects.find((p) => p.id === parentProjectId);
      if (parentProject) {
        setProductionName(parentProject.name);
        setVenue(parentProject.venue || '');
        // Note: We keep the selected disciplines as they may not match exactly
      }
    } else {
      // Clear when unlinking
      if (!isLinked) {
        setProductionName('');
        setVenue('');
      }
    }
  }, [isLinked, parentProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productionName.trim()) {
      return;
    }

    const project = await createProject({
      production_name: productionName.trim(),
      venue: venue.trim() || undefined,
      disciplines: selectedDisciplines,
      parent_project_id: isLinked && parentProjectId ? parentProjectId : undefined,
    });

    if (project) {
      onProjectCreated?.(project.id);
      setProductionName('');
      setVenue('');
      setSelectedDisciplines(['lighting']);
      setIsLinked(!!parentProjectId);
      onClose();
    }
  };

  const toggleDiscipline = (discipline: Discipline) => {
    setSelectedDisciplines((prev) => {
      if (prev.includes(discipline)) {
        // Keep at least one discipline selected
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== discipline);
      } else {
        return [...prev, discipline];
      }
    });
  };

  if (!isOpen) return null;

  const parentProject = projects.find((p) => p.id === parentProjectId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">New Shop Order</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link to Project Toggle - only show if parentProjectId provided */}
          {parentProjectId && parentProject && (
            <div className="bg-gray-700/50 rounded p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLinked}
                  onChange={(e) => setIsLinked(e.target.checked)}
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">
                  Link to project: <span className="font-medium text-gray-900 dark:text-white">{parentProject.name}</span>
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Auto-populate production details from parent project
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Production Name
            </label>
            <input
              type="text"
              value={productionName}
              onChange={(e) => setProductionName(e.target.value)}
              placeholder="Enter production name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Venue (Optional)
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Enter venue name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Disciplines</label>
            <div className="grid grid-cols-2 gap-2">
              {disciplines.map((discipline) => (
                <button
                  key={discipline}
                  type="button"
                  onClick={() => toggleDiscipline(discipline)}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    selectedDisciplines.includes(discipline)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {discipline.charAt(0).toUpperCase() + discipline.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-900 dark:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!productionName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-gray-900 dark:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
