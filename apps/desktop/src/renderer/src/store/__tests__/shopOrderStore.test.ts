import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShopOrderStore } from '../shopOrderStore';

/**
 * shopOrderStore — createProject regression tests
 *
 * Covers two bugs fixed in PR #83:
 *   1. disciplines was JSON.stringify'd before being passed to the IPC handler,
 *      causing a Zod validation failure ("disciplines: Invalid input").
 *   2. logo_url was set to the parent project's logo_path (a local file path),
 *      causing a Zod validation failure ("url: Invalid input"). It is now always
 *      set to '' so the schema passes; the storage path is kept in logo_storage_path.
 */

const mockProject = {
  id: 'proj-new',
  production_name: 'Test Show',
  disciplines: ['lighting'],
  order_date: Date.now(),
  current_revision: 0,
};

describe('shopOrderStore.createProject', () => {
  let prepProjectsCreate: ReturnType<typeof vi.fn>;
  let projectsGetById: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up the nested prep.projects namespace used by the store
    prepProjectsCreate = vi.fn().mockResolvedValue(mockProject);
    (window.api as any).prep.projects = {
      create: prepProjectsCreate,
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue(mockProject),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    // window.api.projects.getById is used to fetch parent project data
    projectsGetById = vi.fn().mockResolvedValue(null);
    (window.api as any).projects.getById = projectsGetById;

    // Reset store state between tests
    useShopOrderStore.setState({ allProjects: [], currentProject: null });
  });

  describe('disciplines field (regression: was JSON.stringify-ed)', () => {
    it('passes disciplines as an array, not a JSON string', async () => {
      await useShopOrderStore.getState().createProject({
        production_name: 'Test Show',
        disciplines: ['lighting', 'video'],
      });

      const payload = prepProjectsCreate.mock.calls[0][0];
      expect(Array.isArray(payload.disciplines)).toBe(true);
      expect(payload.disciplines).toEqual(['lighting', 'video']);
      // Regression guard: was previously JSON.stringify(['lighting', 'video'])
      expect(payload.disciplines).not.toBe('["lighting","video"]');
    });

    it('defaults to [lighting] array when disciplines is omitted', async () => {
      await useShopOrderStore.getState().createProject({
        production_name: 'Test Show',
      });

      const payload = prepProjectsCreate.mock.calls[0][0];
      expect(payload.disciplines).toEqual(['lighting']);
      expect(Array.isArray(payload.disciplines)).toBe(true);
    });
  });

  describe('logo_url field (regression: was set to a local file path)', () => {
    it('sets logo_url to empty string when parent project has a logo_path', async () => {
      const parentProject = {
        id: 'parent-abc',
        name: 'Parent Show',
        logo_path: '/Users/designer/Documents/logo.png', // local file path
        venue: 'Shubert Theatre',
      };
      projectsGetById.mockResolvedValue(parentProject);

      await useShopOrderStore.getState().createProject({
        production_name: 'Test Show',
        parent_project_id: 'parent-abc',
      });

      const payload = prepProjectsCreate.mock.calls[0][0];
      // logo_url must be a valid URL or '' per schema — local paths must not be passed
      expect(payload.logo_url).toBe('');
      // The path is preserved separately for future storage resolution
      expect(payload.logo_storage_path).toBe('/Users/designer/Documents/logo.png');
    });

    it('does not set logo_url when there is no parent project', async () => {
      await useShopOrderStore.getState().createProject({
        production_name: 'Test Show',
      });

      const payload = prepProjectsCreate.mock.calls[0][0];
      // No parent → no logo fields in parentData spread
      expect(payload.logo_url).toBeUndefined();
    });
  });

  describe('createProject return value', () => {
    it('returns the created project and adds it to allProjects', async () => {
      const result = await useShopOrderStore.getState().createProject({
        production_name: 'Test Show',
      });

      expect(result).toEqual(mockProject);
      expect(useShopOrderStore.getState().allProjects).toContain(mockProject);
    });
  });
});
