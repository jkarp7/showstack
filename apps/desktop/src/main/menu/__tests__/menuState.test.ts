import { describe, it, expect, vi, beforeEach } from 'vitest';
import { menuState, MenuStateData, MenuContext } from '../menuState';

/**
 * MenuState Tests
 *
 * Target: 80%+ coverage
 * Tests: MenuContext type coverage (including new 'infrastructure' and 'power' contexts),
 * MenuStateManager setState, getState, onStateChange, and reset.
 */

describe('MenuContext type', () => {
  it('should accept all valid contexts including new infrastructure and power', () => {
    const contexts: MenuContext[] = [
      'landing',
      'project',
      'module',
      'equipment',
      'infrastructure',
      'power',
      'shop-order',
      'systemdocs',
      'paperwork',
      'labels',
      'manager',
      'account',
      'settings',
    ];

    // TypeScript compilation confirms all values are valid MenuContext members.
    // Presence checks are used here rather than a length assertion so adding a
    // new context doesn't require updating this test.
    expect(contexts).toContain('infrastructure');
    expect(contexts).toContain('power');
    expect(contexts).toContain('equipment');
    expect(contexts).toContain('landing');
  });
});

describe('MenuStateManager', () => {
  beforeEach(() => {
    // Reset to known state before each test
    menuState.reset();
  });

  describe('getState', () => {
    it('should return default landing context after reset', () => {
      const state = menuState.getState();
      expect(state.context).toBe('landing');
    });

    it('should return a copy of state (not the internal reference)', () => {
      const state1 = menuState.getState();
      const state2 = menuState.getState();
      expect(state1).not.toBe(state2); // Different object references
      expect(state1).toEqual(state2); // Same values
    });
  });

  describe('setState', () => {
    it('should update context to equipment', () => {
      menuState.setState({ context: 'equipment' });
      expect(menuState.getState().context).toBe('equipment');
    });

    it('should update context to infrastructure', () => {
      menuState.setState({ context: 'infrastructure' });
      expect(menuState.getState().context).toBe('infrastructure');
    });

    it('should update context to power', () => {
      menuState.setState({ context: 'power' });
      expect(menuState.getState().context).toBe('power');
    });

    it('should merge partial state without overwriting other fields', () => {
      menuState.setState({ context: 'equipment', projectId: 'proj-1' });
      menuState.setState({ hasSelection: true });

      const state = menuState.getState();
      expect(state.context).toBe('equipment');
      expect(state.projectId).toBe('proj-1');
      expect(state.hasSelection).toBe(true);
    });

    it('should update isDirty flag', () => {
      menuState.setState({ isDirty: true });
      expect(menuState.getState().isDirty).toBe(true);
    });

    it('should update hasSelection flag', () => {
      menuState.setState({ hasSelection: true });
      expect(menuState.getState().hasSelection).toBe(true);
    });

    it('should update canUndo and canRedo', () => {
      menuState.setState({ canUndo: true, canRedo: false });

      const state = menuState.getState();
      expect(state.canUndo).toBe(true);
      expect(state.canRedo).toBe(false);
    });

    it('should update projectId and projectName together', () => {
      menuState.setState({ projectId: 'abc123', projectName: 'My Show' });

      const state = menuState.getState();
      expect(state.projectId).toBe('abc123');
      expect(state.projectName).toBe('My Show');
    });
  });

  describe('onStateChange', () => {
    it('should call callback when state changes', () => {
      const callback = vi.fn();
      menuState.onStateChange(callback);

      menuState.setState({ context: 'equipment' });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ context: 'equipment' }));
    });

    it('should call callback with new infrastructure context', () => {
      const callback = vi.fn();
      menuState.onStateChange(callback);

      menuState.setState({ context: 'infrastructure' });

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ context: 'infrastructure' }));
    });

    it('should call callback with new power context', () => {
      const callback = vi.fn();
      menuState.onStateChange(callback);

      menuState.setState({ context: 'power' });

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ context: 'power' }));
    });

    it('should support multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      menuState.onStateChange(callback1);
      menuState.onStateChange(callback2);

      menuState.setState({ context: 'project' });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe when returned function is called', () => {
      const callback = vi.fn();
      const unsubscribe = menuState.onStateChange(callback);

      unsubscribe();
      menuState.setState({ context: 'equipment' });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not affect other subscribers when one unsubscribes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const unsubscribe1 = menuState.onStateChange(callback1);
      menuState.onStateChange(callback2);

      unsubscribe1();
      menuState.setState({ context: 'equipment' });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset', () => {
    it('should reset context to landing', () => {
      menuState.setState({ context: 'equipment', projectId: 'proj-1' });
      menuState.reset();

      expect(menuState.getState().context).toBe('landing');
    });

    it('should clear projectId and projectName', () => {
      menuState.setState({ projectId: 'proj-1', projectName: 'My Show' });
      menuState.reset();

      const state = menuState.getState();
      expect(state.projectId).toBeUndefined();
      expect(state.projectName).toBeUndefined();
    });

    it('should clear isDirty, hasSelection, canUndo, canRedo', () => {
      menuState.setState({ isDirty: true, hasSelection: true, canUndo: true, canRedo: true });
      menuState.reset();

      const state = menuState.getState();
      expect(state.isDirty).toBe(false);
      expect(state.hasSelection).toBe(false);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should notify subscribers when reset is called', () => {
      const callback = vi.fn();
      menuState.setState({ context: 'equipment' });
      menuState.onStateChange(callback);

      menuState.reset();

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ context: 'landing' }));
    });
  });

  describe('Tab context switching (equipment manager tabs)', () => {
    it('should transition from equipment to infrastructure context', () => {
      menuState.setState({ context: 'equipment', projectId: 'proj-1' });
      menuState.setState({ context: 'infrastructure' });

      expect(menuState.getState().context).toBe('infrastructure');
      expect(menuState.getState().projectId).toBe('proj-1'); // projectId preserved
    });

    it('should transition from infrastructure to power context', () => {
      menuState.setState({ context: 'infrastructure' });
      menuState.setState({ context: 'power' });

      expect(menuState.getState().context).toBe('power');
    });

    it('should transition back from infrastructure to equipment', () => {
      menuState.setState({ context: 'infrastructure' });
      menuState.setState({ context: 'equipment' });

      expect(menuState.getState().context).toBe('equipment');
    });
  });
});
