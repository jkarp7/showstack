import { Project } from '../store/projectStore';

export interface ProjectFamily {
  root: Project;
  children: Project[]; // sorted by updated_at DESC
}

/**
 * Group a flat list of projects into families (stacks) and standalones.
 *
 * A family is a root project (root_project_id = null) that has at least one
 * child project pointing at it. A project whose root has been deleted is
 * treated as a standalone (orphan promotion).
 *
 * Families are sorted by the most-recently-updated member; standalones are
 * sorted by their own updated_at.
 */
export function groupProjectsIntoFamilies(projects: Project[]): {
  families: ProjectFamily[];
  standalones: Project[];
} {
  const rootMap = new Map<string, Project>();
  const childrenMap = new Map<string, Project[]>();

  // First pass: collect roots
  for (const p of projects) {
    if (!p.root_project_id) {
      rootMap.set(p.id, p);
    }
  }

  // Second pass: group children
  for (const p of projects) {
    if (p.root_project_id) {
      const siblings = childrenMap.get(p.root_project_id) || [];
      siblings.push(p);
      childrenMap.set(p.root_project_id, siblings);
    }
  }

  const families: ProjectFamily[] = [];
  const standalones: Project[] = [];

  for (const [rootId, root] of rootMap) {
    const children = (childrenMap.get(rootId) || []).sort((a, b) => b.updated_at - a.updated_at);
    if (children.length > 0) {
      families.push({ root, children });
    } else {
      standalones.push(root);
    }
  }

  // Handle orphan children (root was deleted — treat as standalones)
  for (const p of projects) {
    if (p.root_project_id && !rootMap.has(p.root_project_id)) {
      standalones.push(p);
    }
  }

  // Sort families by most recently updated member
  families.sort((a, b) => {
    const aLatest = Math.max(a.root.updated_at, ...a.children.map((c) => c.updated_at));
    const bLatest = Math.max(b.root.updated_at, ...b.children.map((c) => c.updated_at));
    return bLatest - aLatest;
  });

  standalones.sort((a, b) => b.updated_at - a.updated_at);

  return { families, standalones };
}
