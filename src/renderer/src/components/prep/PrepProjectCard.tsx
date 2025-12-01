import type { PrepProject } from '../../types/prep';

interface PrepProjectCardProps {
  project: PrepProject;
  onClick: () => void;
}

export function PrepProjectCard({ project, onClick }: PrepProjectCardProps) {
  const disciplines = JSON.parse(project.disciplines || '["lighting"]');
  const formattedDate = new Date(project.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition group"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-400 transition">
          {project.production_name}
        </h3>
        {project.current_revision > 0 && (
          <span className="px-2 py-1 bg-blue-600 text-gray-900 dark:text-white text-xs rounded">
            Rev {project.current_revision}
          </span>
        )}
      </div>

      {project.venue && (
        <p className="text-sm text-gray-400 mb-2">
          {project.venue}
          {project.venue_city && `, ${project.venue_city}`}
          {project.venue_state && `, ${project.venue_state}`}
        </p>
      )}

      <div className="flex items-center gap-2 mb-3">
        {disciplines.map((discipline: string) => (
          <span
            key={discipline}
            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
          >
            {discipline.charAt(0).toUpperCase() + discipline.slice(1)}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Last updated: {formattedDate}</span>
      </div>
    </div>
  );
}
