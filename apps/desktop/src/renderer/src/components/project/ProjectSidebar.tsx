import { NavLink, useNavigate } from 'react-router-dom';
import { useValidation } from '../../hooks/useValidation';
import { ValidationSidebarItem } from '../../types/validation';

interface NavItem {
  label: string;
  path: string;
  placeholder?: boolean;
  validationKey?: ValidationSidebarItem;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface ProjectSidebarProps {
  projectId: string;
  projectName: string;
  onHome: () => void;
}

function buildSections(projectId: string): NavSection[] {
  const base = `/project/${projectId}`;
  return [
    {
      title: 'Project',
      items: [
        { label: 'Project Info', path: `${base}/project-info` },
        { label: 'Team', path: `${base}/team`, placeholder: true },
        { label: 'Show Health', path: `${base}/show-health` },
      ],
    },
    {
      title: 'Equipment Manager',
      items: [
        { label: 'Fixtures', path: `${base}/fixtures`, validationKey: 'fixtures' },
        {
          label: 'Infrastructure',
          path: `${base}/infrastructure`,
          validationKey: 'infrastructure',
        },
        { label: 'Multi-Cable Tracking', path: `${base}/multi-cable`, placeholder: true },
      ],
    },
    {
      title: 'Power',
      items: [
        { label: 'Racks & Distribution', path: `${base}/racks`, validationKey: 'racks' },
        { label: 'Services & Templates', path: `${base}/power/services` },
        { label: 'Power Summary', path: `${base}/power/summary` },
        { label: 'Power/Cable Diagrams', path: `${base}/power/diagrams`, placeholder: true },
      ],
    },
    {
      title: 'Visualization',
      items: [
        { label: 'DMX Map', path: `${base}/dmx-map`, placeholder: true },
        { label: 'Network Topology', path: `${base}/blueprint`, placeholder: true },
      ],
    },
    {
      title: 'Production',
      items: [
        { label: 'Shop Orders', path: `${base}/shop-orders` },
        { label: 'Labels', path: `${base}/labels` },
        { label: 'Paperwork', path: `${base}/paperwork` },
      ],
    },
  ];
}

interface BadgeProps {
  errors: number;
  warnings: number;
}

function ValidationBadge({ errors, warnings }: BadgeProps) {
  if (!errors && !warnings) return null;
  if (errors) {
    return (
      <span
        className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none"
        style={{ backgroundColor: 'var(--color-destructive)' }}
      >
        {errors}
      </span>
    );
  }
  return (
    <span
      className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none"
      style={{ backgroundColor: 'var(--color-warning)' }}
    >
      {warnings}
    </span>
  );
}

export function ProjectSidebar({ projectId, projectName, onHome }: ProjectSidebarProps) {
  const sections = buildSections(projectId);
  const { badgeCounts } = useValidation();

  return (
    <aside
      className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-y-auto"
      style={{ width: 'var(--spacing-sidebar-width)', minWidth: 180 }}
    >
      {/* Project name / home button */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onHome} className="text-left w-full group" title="Back to projects">
          <div className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mb-0.5">
            ← Projects
          </div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {projectName}
          </div>
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 py-2">
        {sections.map((section) => (
          <div key={section.title} className="mb-1">
            <div className="px-4 pt-3 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.title}
              </span>
            </div>
            {section.items.map((item) =>
              item.placeholder ? (
                <div
                  key={item.path}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm text-gray-300 dark:text-gray-600 cursor-default select-none"
                  title="Coming soon"
                >
                  {item.label}
                  <span className="text-[10px] text-gray-300 dark:text-gray-600 ml-auto">soon</span>
                </div>
              ) : (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                    }`
                  }
                >
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.validationKey && <ValidationBadge {...badgeCounts[item.validationKey]} />}
                </NavLink>
              ),
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
