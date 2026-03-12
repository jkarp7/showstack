/**
 * Tests for Smart Groups IPC handlers.
 *
 * Verifies input validation and delegation to GroupService.
 * Uses vi.hoisted pattern to capture ipcMain.handle calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  mockHandle,
  mockGetAll,
  mockGetById,
  mockCreate,
  mockUpdate,
  mockDelete,
  mockGetPins,
  mockAddPin,
  mockRemovePin,
  mockGetGroupsForFixture,
  mockGetAllPins,
} = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockGetAll: vi.fn(),
  mockGetById: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockGetPins: vi.fn(),
  mockAddPin: vi.fn(),
  mockRemovePin: vi.fn(),
  mockGetGroupsForFixture: vi.fn(),
  mockGetAllPins: vi.fn(),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: mockHandle,
  },
}));

vi.mock('../../services/GroupService', () => ({
  groupService: {
    getAll: mockGetAll,
    getById: mockGetById,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    getPins: mockGetPins,
    addPin: mockAddPin,
    removePin: mockRemovePin,
    getGroupsForFixture: mockGetGroupsForFixture,
    getAllPinsForProject: mockGetAllPins,
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../errors', () => ({
  DatabaseError: class DatabaseError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'DatabaseError';
    }
  },
  ValidationError: class ValidationError extends Error {
    field: string;
    constructor(message: string, field: string) {
      super(message);
      this.name = 'ValidationError';
      this.field = field;
    }
    toUserMessage() {
      return this.message;
    }
  },
}));

// ─── Import under test (after mocks) ─────────────────────────────────────────

import { registerGroupHandlers } from '../groups';

// ─── Helper: extract the handler registered for a given channel ───────────────

function getHandler(channel: string): (...args: any[]) => Promise<any> {
  const call = mockHandle.mock.calls.find(([ch]) => ch === channel);
  if (!call) throw new Error(`No handler registered for channel: ${channel}`);
  return call[1];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('registerGroupHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue([]);
    mockGetById.mockResolvedValue(undefined);
    mockCreate.mockResolvedValue({ id: 'g-1', name: 'Test' });
    mockUpdate.mockResolvedValue({ id: 'g-1', name: 'Updated' });
    mockDelete.mockResolvedValue(undefined);
    mockGetPins.mockResolvedValue([]);
    mockAddPin.mockResolvedValue(undefined);
    mockRemovePin.mockResolvedValue(undefined);
    mockGetGroupsForFixture.mockResolvedValue([]);
    registerGroupHandlers();
  });

  it('registers all expected channels', () => {
    const channels = mockHandle.mock.calls.map(([ch]) => ch);
    expect(channels).toContain('groups:getAll');
    expect(channels).toContain('groups:getById');
    expect(channels).toContain('groups:create');
    expect(channels).toContain('groups:update');
    expect(channels).toContain('groups:delete');
    expect(channels).toContain('groups:getPins');
    expect(channels).toContain('groups:addPin');
    expect(channels).toContain('groups:removePin');
    expect(channels).toContain('groups:getGroupsForFixture');
    expect(channels).toContain('groups:getAllPins');
  });

  describe('groups:getAll', () => {
    it('delegates to groupService.getAll', async () => {
      const groups = [{ id: 'g-1', name: 'FOH' }];
      mockGetAll.mockResolvedValue(groups);
      const handler = getHandler('groups:getAll');
      const result = await handler({}, 'proj-1');
      expect(mockGetAll).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(groups);
    });

    it('re-throws service errors', async () => {
      mockGetAll.mockRejectedValue(new Error('DB error'));
      const handler = getHandler('groups:getAll');
      await expect(handler({}, 'proj-1')).rejects.toThrow('DB error');
    });
  });

  describe('groups:getById', () => {
    it('delegates to groupService.getById', async () => {
      const group = { id: 'g-1', name: 'FOH' };
      mockGetById.mockResolvedValue(group);
      const handler = getHandler('groups:getById');
      const result = await handler({}, 'g-1');
      expect(mockGetById).toHaveBeenCalledWith('g-1');
      expect(result).toEqual(group);
    });
  });

  describe('groups:create', () => {
    it('delegates valid data to groupService.create', async () => {
      const data = { name: 'Moving Lights', color: '#FF0000' };
      const handler = getHandler('groups:create');
      await handler({}, data, 'proj-1');
      expect(mockCreate).toHaveBeenCalledWith(data, 'proj-1');
    });

    it('throws when name is missing', async () => {
      const handler = getHandler('groups:create');
      await expect(handler({}, { color: '#FF0000' }, 'proj-1')).rejects.toThrow(
        'Group name is required',
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('throws when name is empty string', async () => {
      const handler = getHandler('groups:create');
      await expect(handler({}, { name: '   ' }, 'proj-1')).rejects.toThrow(
        'Group name is required',
      );
    });
  });

  describe('groups:update', () => {
    it('delegates to groupService.update', async () => {
      const updates = { name: 'Updated Name' };
      const handler = getHandler('groups:update');
      await handler({}, 'g-1', updates);
      expect(mockUpdate).toHaveBeenCalledWith('g-1', updates);
    });
  });

  describe('groups:delete', () => {
    it('delegates to groupService.delete', async () => {
      const handler = getHandler('groups:delete');
      await handler({}, 'g-1');
      expect(mockDelete).toHaveBeenCalledWith('g-1');
    });
  });

  describe('groups:getPins', () => {
    it('delegates to groupService.getPins', async () => {
      const pins = [{ fixture_id: 'f-1', group_id: 'g-1', created_at: 1000 }];
      mockGetPins.mockResolvedValue(pins);
      const handler = getHandler('groups:getPins');
      const result = await handler({}, 'g-1');
      expect(mockGetPins).toHaveBeenCalledWith('g-1');
      expect(result).toEqual(pins);
    });
  });

  describe('groups:addPin', () => {
    it('delegates to groupService.addPin', async () => {
      const handler = getHandler('groups:addPin');
      await handler({}, 'g-1', 'f-1');
      expect(mockAddPin).toHaveBeenCalledWith('g-1', 'f-1');
    });
  });

  describe('groups:removePin', () => {
    it('delegates to groupService.removePin', async () => {
      const handler = getHandler('groups:removePin');
      await handler({}, 'g-1', 'f-1');
      expect(mockRemovePin).toHaveBeenCalledWith('g-1', 'f-1');
    });
  });

  describe('groups:getGroupsForFixture', () => {
    it('delegates to groupService.getGroupsForFixture', async () => {
      mockGetGroupsForFixture.mockResolvedValue(['g-1', 'g-2']);
      const handler = getHandler('groups:getGroupsForFixture');
      const result = await handler({}, 'f-1');
      expect(mockGetGroupsForFixture).toHaveBeenCalledWith('f-1');
      expect(result).toEqual(['g-1', 'g-2']);
    });
  });

  describe('groups:getAllPins', () => {
    it('delegates to groupService.getAllPinsForProject', async () => {
      const pins = [
        { fixture_id: 'f-1', group_id: 'g-1', created_at: 1000 },
        { fixture_id: 'f-2', group_id: 'g-1', created_at: 1001 },
      ];
      mockGetAllPins.mockResolvedValue(pins);
      const handler = getHandler('groups:getAllPins');
      const result = await handler({}, 'proj-1');
      expect(mockGetAllPins).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(pins);
    });

    it('re-throws service errors', async () => {
      mockGetAllPins.mockRejectedValue(new Error('DB error'));
      const handler = getHandler('groups:getAllPins');
      await expect(handler({}, 'proj-1')).rejects.toThrow('DB error');
    });
  });
});
