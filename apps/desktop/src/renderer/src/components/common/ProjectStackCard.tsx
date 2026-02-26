import { Project } from '../../store/projectStore';
import { ProjectFamily } from '../../utils/projectFamilies';

export type { ProjectFamily };

interface ProjectStackCardProps {
  family: ProjectFamily;
  onClick: () => void;
  onDeleteMember: (project: Project) => void;
  logoDataUrls: Map<string, string>;
}

/**
 * Renders a stacked-paper card representing a family of project versions.
 * Shows the most recently updated member as the cover, with a version count badge.
 */
export function ProjectStackCard({
  family,
  onClick,
  onDeleteMember,
  logoDataUrls,
}: ProjectStackCardProps) {
  const allMembers = [family.root, ...family.children];
  // Cover: most recently updated member
  const cover = allMembers.reduce((latest, p) => (p.updated_at > latest.updated_at ? p : latest));
  const versionCount = allMembers.length;
  const coverLogo = logoDataUrls.get(cover.id);

  return (
    <div className="relative cursor-pointer group" onClick={onClick}>
      {/* Stacked paper layers (back to front) */}
      {versionCount >= 3 && (
        <div
          className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          style={{ transform: 'translate(6px, 6px)' }}
        />
      )}
      {versionCount >= 2 && (
        <div
          className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          style={{ transform: 'translate(3px, 3px)' }}
        />
      )}

      {/* Front card */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-500 transition group-hover:shadow-md">
        <div className="flex items-start justify-between mb-3">
          {coverLogo ? (
            <img
              src={coverLogo}
              alt={cover.name}
              className="w-16 h-16 rounded-lg object-contain bg-gray-200 dark:bg-gray-700 p-1"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl">
              📁
            </div>
          )}

          {/* Version count badge */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            {versionCount} versions
          </span>
        </div>

        <h3 className="text-lg font-semibold mb-1 truncate">{family.root.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Latest: {cover.name !== family.root.name ? cover.name : 'Root version'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Updated: {new Date(cover.updated_at).toLocaleDateString()}
        </p>

        {/* Click hint */}
        <p className="text-xs text-blue-500 dark:text-blue-400 mt-3 opacity-0 group-hover:opacity-100 transition">
          Click to view all versions
        </p>
      </div>
    </div>
  );
}
