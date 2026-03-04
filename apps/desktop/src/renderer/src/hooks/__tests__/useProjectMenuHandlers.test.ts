import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectMenuHandlers } from '../useProjectMenuHandlers';

/**
 * useProjectMenuHandlers Hook Tests
 *
 * Target: 70%+ coverage
 * Tests: menu event registration/cleanup and the new menu:generatePaperwork handler
 * that navigates to the system-docs (paperwork) module.
 */

// Mock react-router-dom — mockParams is mutated per-test to simulate different route contexts
const mockNavigate = vi.fn();
let mockParams: Record<string, string> = {};
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

// Mock stores
vi.mock('../../store/uiStore', () => ({
  useUIStore: (selector: (state: any) => any) => selector({ openSettingsDialog: vi.fn() }),
}));

vi.mock('../../store/projectStore', () => ({
  useProjectStore: (selector: (state: any) => any) =>
    selector({ currentProject: { name: 'Test Show' } }),
}));

describe('useProjectMenuHandlers', () => {
  let registeredHandlers: Record<string, (...args: any[]) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    registeredHandlers = {};

    // Capture registered handlers by event name
    (window.api.menu.on as ReturnType<typeof vi.fn>).mockImplementation(
      (event: string, handler: (...args: any[]) => void) => {
        registeredHandlers[event] = handler;
      },
    );
  });

  describe('Event registration', () => {
    it('should register menu:generatePaperwork handler on mount', () => {
      renderHook(() => useProjectMenuHandlers());

      expect(window.api.menu.on).toHaveBeenCalledWith(
        'menu:generatePaperwork',
        expect.any(Function),
      );
    });

    it('should register all required menu handlers', () => {
      renderHook(() => useProjectMenuHandlers());

      const registeredEvents = (window.api.menu.on as ReturnType<typeof vi.fn>).mock.calls.map(
        (call: any[]) => call[0],
      );
      expect(registeredEvents).toContain('menu:editProject');
      expect(registeredEvents).toContain('menu:projectSettings');
      expect(registeredEvents).toContain('menu:saveAsCopy');
      expect(registeredEvents).toContain('menu:exportProject');
      expect(registeredEvents).toContain('menu:generatePaperwork');
    });

    it('should unregister menu:generatePaperwork handler on unmount', () => {
      const { unmount } = renderHook(() => useProjectMenuHandlers());
      unmount();

      expect(window.api.menu.off).toHaveBeenCalledWith(
        'menu:generatePaperwork',
        expect.any(Function),
      );
    });
  });

  describe('menu:generatePaperwork handler', () => {
    it('should navigate to project system-docs when projectId is in route params', () => {
      mockParams = { projectId: 'proj-abc123' };

      renderHook(() => useProjectMenuHandlers());
      registeredHandlers['menu:generatePaperwork']?.();

      expect(mockNavigate).toHaveBeenCalledWith(
        '/project/proj-abc123/module/production/system-docs',
      );
    });

    it('should navigate to standalone system-docs when no projectId in params', () => {
      mockParams = {};

      renderHook(() => useProjectMenuHandlers());
      registeredHandlers['menu:generatePaperwork']?.();

      expect(mockNavigate).toHaveBeenCalledWith('/module/production/system-docs');
    });

    it('should use the projectId from params verbatim', () => {
      mockParams = { projectId: 'my-project-id' };

      renderHook(() => useProjectMenuHandlers());
      registeredHandlers['menu:generatePaperwork']?.();

      expect(mockNavigate).toHaveBeenCalledWith(
        '/project/my-project-id/module/production/system-docs',
      );
    });
  });
});
