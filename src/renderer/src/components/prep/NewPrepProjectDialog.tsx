import { useState } from 'react';
import { usePrepStore } from '../../store/prepStore';
import type { Discipline } from '../../types/prep';

interface NewPrepProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (projectId: string) => void;
}

export function NewPrepProjectDialog({
  isOpen,
  onClose,
  onProjectCreated,
}: NewPrepProjectDialogProps) {
  const createProject = usePrepStore((state) => state.createProject);
  const [productionName, setProductionName] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>(['lighting']);

  const disciplines: Discipline[] = ['lighting', 'audio', 'video', 'rigging', 'scenic', 'props'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productionName.trim()) {
      return;
    }

    const project = await createProject({
      production_name: productionName.trim(),
      disciplines: selectedDisciplines,
    });

    if (project) {
      onProjectCreated?.(project.id);
      setProductionName('');
      setSelectedDisciplines(['lighting']);
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">New Shop Order</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Production Name
            </label>
            <input
              type="text"
              value={productionName}
              onChange={(e) => setProductionName(e.target.value)}
              placeholder="Enter production name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
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
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!productionName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
