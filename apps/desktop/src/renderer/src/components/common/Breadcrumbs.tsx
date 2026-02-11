/**
 * Breadcrumbs Navigation Component
 * Auto-generates navigation breadcrumbs from the current route
 * Replaces Back/Home buttons across the application
 */

import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { logger } from '../../utils/logger';
import { ChevronRight, Home } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast?: boolean;
}

export function Breadcrumbs() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    const items = generateBreadcrumbs(location.pathname, params);
    setBreadcrumbs(items);

    // Fetch project name if we're in a project context
    const projectId = params.projectId;
    if (projectId) {
      window.api?.projects
        ?.getById(projectId)
        .then((project) => {
          if (project) {
            setProjectName(project.name);
          }
        })
        .catch((err) => {
          logger.error('Failed to fetch project for breadcrumbs:', err);
        });
    } else {
      setProjectName('');
    }
  }, [location.pathname, params]);

  const handleClick = (path: string) => {
    navigate(path);
  };

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Home icon */}
      <button
        onClick={() => handleClick('/')}
        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Home"
      >
        <Home className="w-4 h-4" />
      </button>

      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />

          {item.isLast ? (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {item.label === '{project}' ? projectName || 'Project' : item.label}
            </span>
          ) : (
            <button
              onClick={() => handleClick(item.path)}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:underline"
            >
              {item.label === '{project}' ? projectName || 'Project' : item.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}

/**
 * Generate breadcrumb items from the current pathname
 */
function generateBreadcrumbs(
  pathname: string,
  params: Record<string, string | undefined>,
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  // Skip breadcrumbs for landing page
  if (pathname === '/' || pathname === '/login') {
    return [];
  }

  // Parse the pathname
  const segments = pathname.split('/').filter((s) => s.length > 0);

  // Special handling for different routes
  if (segments[0] === 'project' && params.projectId) {
    // Project context
    items.push({
      label: '{project}',
      path: `/project/${params.projectId}`,
    });

    if (segments.length > 2 && segments[2] === 'module') {
      const moduleType = segments[3];

      if (moduleType === 'production') {
        items.push({
          label: 'Production',
          path: `/project/${params.projectId}/module/production`,
        });

        // System Docs tool
        if (segments.length > 4 && segments[4] === 'system-docs') {
          items.push({
            label: 'System Docs',
            path: `/project/${params.projectId}/module/production/system-docs`,
            isLast: true,
          });
        }

        // Shop Order tool
        if (segments.length > 4 && segments[4] === 'shop-order') {
          items.push({
            label: 'Shop Order',
            path: `/project/${params.projectId}/module/production/shop-order`,
            isLast: true,
          });
        }
      } else if (moduleType === 'manager') {
        items.push({
          label: 'Manager',
          path: `/project/${params.projectId}/module/manager`,
          isLast: true,
        });
      }
    }
  } else if (segments[0] === 'module') {
    // Module context (no project)
    const moduleType = segments[1];

    if (moduleType === 'production') {
      items.push({
        label: 'Production',
        path: '/module/production',
      });

      // System Docs tool
      if (segments.length > 2 && segments[2] === 'system-docs') {
        items.push({
          label: 'System Docs',
          path: '/module/production/system-docs',
          isLast: true,
        });
      }

      // Shop Order tool
      if (segments.length > 2 && segments[2] === 'shop-order') {
        items.push({
          label: 'Shop Order',
          path: '/module/production/shop-order',
          isLast: true,
        });
      }
    } else if (moduleType === 'manager') {
      items.push({
        label: 'Manager',
        path: '/module/manager',
        isLast: true,
      });
    }
  } else if (segments[0] === 'account') {
    items.push({
      label: 'Account',
      path: '/account',
      isLast: true,
    });
  } else if (segments[0] === 'settings') {
    items.push({
      label: 'Settings',
      path: '/settings',
      isLast: true,
    });
  } else if (segments[0] === 'admin') {
    items.push({
      label: 'Admin Panel',
      path: '/admin',
      isLast: true,
    });
  }

  // Mark the last item
  if (items.length > 0) {
    items[items.length - 1].isLast = true;
  }

  return items;
}
