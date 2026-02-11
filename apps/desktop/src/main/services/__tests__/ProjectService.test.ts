/**
 * Tests for ProjectService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../errors';

// Mock dependencies
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../database/queries/projects', () => ({
  getAllProjects: vi.fn(),
  getProjectById: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock('../../errors', async () => {
  const actual = await vi.importActual('../../errors');
  return {
    ...actual,
    errorHandler: {
      executeWithRetry: vi.fn((fn) => fn()),
    },
  };
});

vi.mock('../../monitoring/PerformanceMonitor', () => ({
  performanceMonitor: {
    trackDatabaseQuery: vi.fn(),
  },
}));

vi.mock('../../database/monitoring/DatabaseMonitor', () => ({
  databaseMonitor: {
    recordQuery: vi.fn(),
  },
}));

vi.mock('../BackupService', () => ({
  backupService: {
    performBackup: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Import after mocking
import { ProjectService } from '../ProjectService';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../../database/queries/projects';
import type { Project } from '../../database/queries/projects';
import { logger } from '../../utils/logger';

describe('ProjectService', () => {
  let service: ProjectService;

  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Show',
    description: 'A test production',
    venue: 'Main Stage',
    designer: 'Jane Doe',
    logo_path: '/logos/test.png',
    enabled_modules: '["lighting","audio"]',
    created_at: 1704067200000,
    updated_at: 1704067200000,
  };

  const mockProject2: Project = {
    id: 'project-2',
    name: 'Second Show',
    description: 'Another production',
    created_at: 1704153600000,
    updated_at: 1704153600000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProjectService();
  });

  describe('getAll', () => {
    it('should call getAllProjects and return results', async () => {
      const projects = [mockProject, mockProject2];
      vi.mocked(getAllProjects).mockReturnValue(projects);

      const result = await service.getAll();

      expect(getAllProjects).toHaveBeenCalled();
      expect(result).toEqual(projects);
    });

    it('should return an empty array when no projects exist', async () => {
      vi.mocked(getAllProjects).mockReturnValue([]);

      const result = await service.getAll();

      expect(getAllProjects).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should call getProjectById with the correct ID', async () => {
      vi.mocked(getProjectById).mockReturnValue(mockProject);

      const result = await service.getById('project-1');

      expect(getProjectById).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(mockProject);
    });

    it('should return undefined when project is not found', async () => {
      vi.mocked(getProjectById).mockReturnValue(undefined as any);

      const result = await service.getById('nonexistent');

      expect(getProjectById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.getById('')).rejects.toThrow(ValidationError);
      expect(getProjectById).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.getById('   ')).rejects.toThrow(ValidationError);
      expect(getProjectById).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should call createProject with all parameters', async () => {
      vi.mocked(createProject).mockReturnValue(mockProject);

      const result = await service.create('Test Show', 'A test production', '/logos/test.png', [
        'lighting',
        'audio',
      ]);

      expect(createProject).toHaveBeenCalledWith(
        'Test Show',
        'A test production',
        '/logos/test.png',
        ['lighting', 'audio'],
      );
      expect(result).toEqual(mockProject);
    });

    it('should call createProject with only the name', async () => {
      vi.mocked(createProject).mockReturnValue(mockProject2);

      const result = await service.create('Second Show');

      expect(createProject).toHaveBeenCalledWith('Second Show', undefined, undefined, undefined);
      expect(result).toEqual(mockProject2);
    });

    it('should throw ValidationError for empty name', async () => {
      await expect(service.create('')).rejects.toThrow(ValidationError);
      expect(createProject).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only name', async () => {
      await expect(service.create('   ')).rejects.toThrow(ValidationError);
      expect(createProject).not.toHaveBeenCalled();
    });

    it('should throw ValidationError with correct field name for empty name', async () => {
      try {
        await service.create('');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('name');
      }
    });
  });

  describe('update', () => {
    it('should validate ID and call updateProject', async () => {
      const updates: Partial<Project> = { name: 'Updated Show' };
      vi.mocked(updateProject).mockReturnValue({ ...mockProject, ...updates });

      const result = await service.update('project-1', updates);

      expect(updateProject).toHaveBeenCalledWith('project-1', updates);
      expect(result.name).toBe('Updated Show');
    });

    it('should allow updating description without name validation', async () => {
      const updates: Partial<Project> = { description: 'New description' };
      vi.mocked(updateProject).mockReturnValue({ ...mockProject, ...updates });

      const result = await service.update('project-1', updates);

      expect(updateProject).toHaveBeenCalledWith('project-1', updates);
      expect(result.description).toBe('New description');
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.update('', { name: 'Test' })).rejects.toThrow(ValidationError);
      expect(updateProject).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.update('   ', { name: 'Test' })).rejects.toThrow(ValidationError);
      expect(updateProject).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when name is updated to empty string', async () => {
      await expect(service.update('project-1', { name: '' })).rejects.toThrow(ValidationError);
      expect(updateProject).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when name is updated to whitespace only', async () => {
      await expect(service.update('project-1', { name: '   ' })).rejects.toThrow(ValidationError);
      expect(updateProject).not.toHaveBeenCalled();
    });

    it('should not validate name when name is not in updates', async () => {
      const updates: Partial<Project> = { venue: 'New Venue' };
      vi.mocked(updateProject).mockReturnValue({ ...mockProject, ...updates });

      const result = await service.update('project-1', updates);

      expect(updateProject).toHaveBeenCalledWith('project-1', updates);
      expect(result.venue).toBe('New Venue');
    });
  });

  describe('delete', () => {
    it('should validate ID and call deleteProject', async () => {
      vi.mocked(deleteProject).mockReturnValue(undefined as any);

      await service.delete('project-1');

      expect(deleteProject).toHaveBeenCalledWith('project-1');
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(service.delete('')).rejects.toThrow(ValidationError);
      expect(deleteProject).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for whitespace-only ID', async () => {
      await expect(service.delete('   ')).rejects.toThrow(ValidationError);
      expect(deleteProject).not.toHaveBeenCalled();
    });
  });

  describe('getEnabledModules', () => {
    it('should parse a valid JSON array of modules', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: '["lighting","audio"]',
      };

      const result = service.getEnabledModules(project);

      expect(result).toEqual(['lighting', 'audio']);
    });

    it('should return an empty array when enabled_modules is null', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: undefined,
      };

      const result = service.getEnabledModules(project);

      expect(result).toEqual([]);
    });

    it('should return an empty array when enabled_modules is undefined', () => {
      const project: Project = {
        id: 'project-3',
        name: 'No Modules',
        created_at: 1704067200000,
        updated_at: 1704067200000,
      };

      const result = service.getEnabledModules(project);

      expect(result).toEqual([]);
    });

    it('should return an empty array when enabled_modules is an empty string', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: '',
      };

      const result = service.getEnabledModules(project);

      expect(result).toEqual([]);
    });

    it('should return an empty array for invalid JSON', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: 'not-valid-json',
      };

      const result = service.getEnabledModules(project);

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse enabled modules:',
        expect.any(Error),
      );
    });

    it('should return an empty array for malformed JSON', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: '["lighting",',
      };

      const result = service.getEnabledModules(project);

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse enabled modules:',
        expect.any(Error),
      );
    });

    it('should handle a single-element JSON array', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: '["video"]',
      };

      const result = service.getEnabledModules(project);

      expect(result).toEqual(['video']);
    });

    it('should handle an empty JSON array', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: '[]',
      };

      const result = service.getEnabledModules(project);

      expect(result).toEqual([]);
    });
  });

  describe('isModuleEnabled', () => {
    it('should return true when the module is in the enabled list', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: '["lighting","audio","video"]',
      };

      expect(service.isModuleEnabled(project, 'lighting')).toBe(true);
      expect(service.isModuleEnabled(project, 'audio')).toBe(true);
      expect(service.isModuleEnabled(project, 'video')).toBe(true);
    });

    it('should return false when the module is not in the enabled list', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: '["lighting","audio"]',
      };

      expect(service.isModuleEnabled(project, 'video')).toBe(false);
      expect(service.isModuleEnabled(project, 'rigging')).toBe(false);
    });

    it('should return false when enabled_modules is undefined', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: undefined,
      };

      expect(service.isModuleEnabled(project, 'lighting')).toBe(false);
    });

    it('should return false when enabled_modules is an empty array', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: '[]',
      };

      expect(service.isModuleEnabled(project, 'lighting')).toBe(false);
    });

    it('should return false for invalid JSON in enabled_modules', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: 'bad-json',
      };

      expect(service.isModuleEnabled(project, 'lighting')).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse enabled modules:',
        expect.any(Error),
      );
    });

    it('should be case-sensitive when checking module names', () => {
      const project: Project = {
        ...mockProject,
        enabled_modules: '["lighting"]',
      };

      expect(service.isModuleEnabled(project, 'lighting')).toBe(true);
      expect(service.isModuleEnabled(project, 'Lighting')).toBe(false);
      expect(service.isModuleEnabled(project, 'LIGHTING')).toBe(false);
    });
  });
});
