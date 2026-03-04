import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEquipmentMenuHandlers } from '../useEquipmentMenuHandlers';

/**
 * useEquipmentMenuHandlers Hook Tests
 *
 * Target: 70%+ coverage
 * Tests: view menu handlers (menu:columns, menu:userColumns, menu:sort, menu:filters,
 * menu:clearSort, menu:clearFilters, menu:conditionalFormatting, menu:addInfrastructure)
 * plus registration/cleanup of the full handler set.
 */

const defaultProps = {
  selectedRows: new Set<string>(),
  fixtures: [],
  onAddFixture: vi.fn(),
  onBulkEdit: vi.fn(),
  onSelectAll: vi.fn(),
  onDeselectAll: vi.fn(),
};

describe('useEquipmentMenuHandlers', () => {
  let registeredHandlers: Record<string, (...args: any[]) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    registeredHandlers = {};

    (window.api.menu.on as ReturnType<typeof vi.fn>).mockImplementation(
      (event: string, handler: (...args: any[]) => void) => {
        registeredHandlers[event] = handler;
      },
    );
  });

  describe('Event registration', () => {
    it('should register view menu handlers on mount', () => {
      renderHook(() => useEquipmentMenuHandlers(defaultProps));

      const registeredEvents = (window.api.menu.on as ReturnType<typeof vi.fn>).mock.calls.map(
        (call: any[]) => call[0],
      );
      expect(registeredEvents).toContain('menu:columns');
      expect(registeredEvents).toContain('menu:userColumns');
      expect(registeredEvents).toContain('menu:sort');
      expect(registeredEvents).toContain('menu:filters');
      expect(registeredEvents).toContain('menu:clearSort');
      expect(registeredEvents).toContain('menu:clearFilters');
      expect(registeredEvents).toContain('menu:conditionalFormatting');
      expect(registeredEvents).toContain('menu:addInfrastructure');
    });

    it('should unregister view menu handlers on unmount', () => {
      const { unmount } = renderHook(() => useEquipmentMenuHandlers(defaultProps));
      unmount();

      const unregisteredEvents = (window.api.menu.off as ReturnType<typeof vi.fn>).mock.calls.map(
        (call: any[]) => call[0],
      );
      expect(unregisteredEvents).toContain('menu:columns');
      expect(unregisteredEvents).toContain('menu:userColumns');
      expect(unregisteredEvents).toContain('menu:sort');
      expect(unregisteredEvents).toContain('menu:filters');
      expect(unregisteredEvents).toContain('menu:clearSort');
      expect(unregisteredEvents).toContain('menu:clearFilters');
      expect(unregisteredEvents).toContain('menu:conditionalFormatting');
      expect(unregisteredEvents).toContain('menu:addInfrastructure');
    });
  });

  describe('menu:columns handler', () => {
    it('should call onColumnVisibility when menu:columns fires', () => {
      const onColumnVisibility = vi.fn();
      renderHook(() => useEquipmentMenuHandlers({ ...defaultProps, onColumnVisibility }));

      registeredHandlers['menu:columns']?.();

      expect(onColumnVisibility).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onColumnVisibility is not provided', () => {
      renderHook(() => useEquipmentMenuHandlers(defaultProps));

      expect(() => registeredHandlers['menu:columns']?.()).not.toThrow();
    });
  });

  describe('menu:userColumns handler', () => {
    it('should call onUserColumns when menu:userColumns fires', () => {
      const onUserColumns = vi.fn();
      renderHook(() => useEquipmentMenuHandlers({ ...defaultProps, onUserColumns }));

      registeredHandlers['menu:userColumns']?.();

      expect(onUserColumns).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onUserColumns is not provided', () => {
      renderHook(() => useEquipmentMenuHandlers(defaultProps));

      expect(() => registeredHandlers['menu:userColumns']?.()).not.toThrow();
    });
  });

  describe('menu:clearSort handler', () => {
    it('should call onClearSort when menu:clearSort fires', () => {
      const onClearSort = vi.fn();
      renderHook(() => useEquipmentMenuHandlers({ ...defaultProps, onClearSort }));

      registeredHandlers['menu:clearSort']?.();

      expect(onClearSort).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClearSort is not provided', () => {
      renderHook(() => useEquipmentMenuHandlers(defaultProps));

      expect(() => registeredHandlers['menu:clearSort']?.()).not.toThrow();
    });
  });

  describe('menu:clearFilters handler', () => {
    it('should call onClearFilters when menu:clearFilters fires', () => {
      const onClearFilters = vi.fn();
      renderHook(() => useEquipmentMenuHandlers({ ...defaultProps, onClearFilters }));

      registeredHandlers['menu:clearFilters']?.();

      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClearFilters is not provided', () => {
      renderHook(() => useEquipmentMenuHandlers(defaultProps));

      expect(() => registeredHandlers['menu:clearFilters']?.()).not.toThrow();
    });
  });

  describe('menu:conditionalFormatting handler', () => {
    it('should call onConditionalFormatting when menu:conditionalFormatting fires', () => {
      const onConditionalFormatting = vi.fn();
      renderHook(() => useEquipmentMenuHandlers({ ...defaultProps, onConditionalFormatting }));

      registeredHandlers['menu:conditionalFormatting']?.();

      expect(onConditionalFormatting).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onConditionalFormatting is not provided', () => {
      renderHook(() => useEquipmentMenuHandlers(defaultProps));

      expect(() => registeredHandlers['menu:conditionalFormatting']?.()).not.toThrow();
    });
  });

  describe('menu:addInfrastructure handler', () => {
    it('should call onAddInfrastructure when menu:addInfrastructure fires', () => {
      const onAddInfrastructure = vi.fn();
      renderHook(() => useEquipmentMenuHandlers({ ...defaultProps, onAddInfrastructure }));

      registeredHandlers['menu:addInfrastructure']?.();

      expect(onAddInfrastructure).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onAddInfrastructure is not provided', () => {
      renderHook(() => useEquipmentMenuHandlers(defaultProps));

      expect(() => registeredHandlers['menu:addInfrastructure']?.()).not.toThrow();
    });
  });

  describe('menu:sort handler', () => {
    it('should call onSort when menu:sort fires', () => {
      const onSort = vi.fn();
      renderHook(() => useEquipmentMenuHandlers({ ...defaultProps, onSort }));

      registeredHandlers['menu:sort']?.();

      expect(onSort).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onSort is not provided', () => {
      renderHook(() => useEquipmentMenuHandlers(defaultProps));

      expect(() => registeredHandlers['menu:sort']?.()).not.toThrow();
    });
  });

  describe('menu:filters handler', () => {
    it('should call onFilters when menu:filters fires', () => {
      const onFilters = vi.fn();
      renderHook(() => useEquipmentMenuHandlers({ ...defaultProps, onFilters }));

      registeredHandlers['menu:filters']?.();

      expect(onFilters).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onFilters is not provided', () => {
      renderHook(() => useEquipmentMenuHandlers(defaultProps));

      expect(() => registeredHandlers['menu:filters']?.()).not.toThrow();
    });
  });

  describe('handler prop updates without re-registration', () => {
    it('should use updated callback without re-registering listeners', () => {
      const onClearSort1 = vi.fn();
      const onClearSort2 = vi.fn();

      const { rerender } = renderHook(
        ({ onClearSort }) => useEquipmentMenuHandlers({ ...defaultProps, onClearSort }),
        { initialProps: { onClearSort: onClearSort1 } },
      );

      // Re-render with updated callback
      rerender({ onClearSort: onClearSort2 });

      // Should still only have registered once (mount only)
      const registrationCount = (window.api.menu.on as ReturnType<typeof vi.fn>).mock.calls.filter(
        ([event]: [string]) => event === 'menu:clearSort',
      ).length;
      expect(registrationCount).toBe(1);

      // But the new callback should be used
      registeredHandlers['menu:clearSort']?.();
      expect(onClearSort1).not.toHaveBeenCalled();
      expect(onClearSort2).toHaveBeenCalledTimes(1);
    });
  });
});
