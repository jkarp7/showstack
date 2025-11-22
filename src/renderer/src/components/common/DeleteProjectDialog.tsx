import { Project } from '../store/projectStore';

interface DeleteProjectDialogProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteProjectDialog({ isOpen, project, onClose, onConfirm }: DeleteProjectDialogProps) {
  if (!isOpen || !project) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">Delete Project</h2>

        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            Are you sure you want to delete this project?
          </p>
          <div className="bg-gray-700 rounded p-3 mt-4">
            <p className="font-medium text-white">{project.name}</p>
            {project.description && (
              <p className="text-sm text-gray-400 mt-1">{project.description}</p>
            )}
          </div>
          <p className="text-red-400 text-sm mt-4">
            This action cannot be undone. All project data will be permanently deleted.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition"
          >
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}
