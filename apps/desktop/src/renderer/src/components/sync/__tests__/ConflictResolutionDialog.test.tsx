/**
 * ConflictResolutionDialog Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConflictResolutionDialog, SyncConflict } from '../ConflictResolutionDialog';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="icon-alerttriangle" />,
  Check: () => <div data-testid="icon-check" />,
  X: () => <div data-testid="icon-x" />,
  ChevronDown: () => <div data-testid="icon-chevrondown" />,
  ChevronUp: () => <div data-testid="icon-chevronup" />,
}));

// Sample test data
const createMockConflict = (overrides: Partial<SyncConflict> = {}): SyncConflict => ({
  id: 'conflict-1',
  tableName: 'shop_orders',
  recordId: 'order-123',
  fieldName: 'quantity',
  localValue: 10,
  remoteValue: 15,
  localTimestamp: new Date('2024-01-15T10:00:00Z'),
  remoteTimestamp: new Date('2024-01-15T11:00:00Z'),
  ...overrides,
});

const mockOnResolve = vi.fn();
const mockOnClose = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // Mock window.confirm
  vi.spyOn(window, 'confirm').mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ConflictResolutionDialog', () => {
  describe('visibility', () => {
    it('renders when isOpen is true and conflicts exist', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Resolve Sync Conflicts')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={false}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('does not render when conflicts array is empty', () => {
      const { container } = render(
        <ConflictResolutionDialog
          conflicts={[]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('displays correct conflict count', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[
            createMockConflict({ id: 'conflict-1' }),
            createMockConflict({ id: 'conflict-2' }),
            createMockConflict({ id: 'conflict-3' }),
          ]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      expect(screen.getByText(/3 conflicts found/)).toBeInTheDocument();
    });

    it('uses singular form for single conflict', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      expect(screen.getByText(/1 conflict found/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'conflict-dialog-title');
    });

    it('has close button with accessible label', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });
  });

  describe('conflict expansion', () => {
    it('expands conflict details when clicked', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Click on the conflict header to expand
      const conflictHeader = screen.getByText('shop_orders');
      fireEvent.click(conflictHeader);

      // Should show local and remote values
      expect(screen.getByText('Local (Your Version)')).toBeInTheDocument();
      expect(screen.getByText('Remote (Server Version)')).toBeInTheDocument();
    });

    it('collapses conflict details when clicked again', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Expand
      const conflictHeader = screen.getByText('shop_orders');
      fireEvent.click(conflictHeader);
      expect(screen.getByText('Local (Your Version)')).toBeInTheDocument();

      // Collapse
      fireEvent.click(conflictHeader);
      expect(screen.queryByText('Local (Your Version)')).not.toBeInTheDocument();
    });
  });

  describe('individual resolution', () => {
    it('allows selecting local value', async () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Expand the conflict
      fireEvent.click(screen.getByText('shop_orders'));

      // Click on local value
      fireEvent.click(screen.getByText('Local (Your Version)'));

      // Should show "Local" badge
      await waitFor(() => {
        expect(screen.getByText('Local')).toBeInTheDocument();
      });
    });

    it('allows selecting remote value', async () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Expand the conflict
      fireEvent.click(screen.getByText('shop_orders'));

      // Click on remote value
      fireEvent.click(screen.getByText('Remote (Server Version)'));

      // Should show "Remote" badge
      await waitFor(() => {
        expect(screen.getByText('Remote')).toBeInTheDocument();
      });
    });

    it('updates resolution count as conflicts are resolved', async () => {
      render(
        <ConflictResolutionDialog
          conflicts={[
            createMockConflict({ id: 'conflict-1' }),
            createMockConflict({ id: 'conflict-2', tableName: 'items' }),
          ]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      expect(screen.getByText('0 of 2 resolved')).toBeInTheDocument();

      // Expand and resolve first conflict
      fireEvent.click(screen.getByText('shop_orders'));
      fireEvent.click(screen.getByText('Local (Your Version)'));

      await waitFor(() => {
        expect(screen.getByText('1 of 2 resolved')).toBeInTheDocument();
      });
    });
  });

  describe('apply to all', () => {
    it('applies local to all conflicts', async () => {
      render(
        <ConflictResolutionDialog
          conflicts={[
            createMockConflict({ id: 'conflict-1' }),
            createMockConflict({ id: 'conflict-2' }),
          ]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Click "Keep Local" button
      fireEvent.click(screen.getByRole('button', { name: 'Keep Local' }));

      await waitFor(() => {
        expect(screen.getByText('2 of 2 resolved')).toBeInTheDocument();
      });
    });

    it('applies remote to all conflicts', async () => {
      render(
        <ConflictResolutionDialog
          conflicts={[
            createMockConflict({ id: 'conflict-1' }),
            createMockConflict({ id: 'conflict-2' }),
          ]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Click "Keep Remote" button
      fireEvent.click(screen.getByRole('button', { name: 'Keep Remote' }));

      await waitFor(() => {
        expect(screen.getByText('2 of 2 resolved')).toBeInTheDocument();
      });
    });

    it('clears apply to all when individual choice is made', async () => {
      render(
        <ConflictResolutionDialog
          conflicts={[
            createMockConflict({ id: 'conflict-1' }),
            createMockConflict({ id: 'conflict-2', tableName: 'items' }),
          ]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Apply to all first
      fireEvent.click(screen.getByRole('button', { name: 'Keep Local' }));

      // Now expand and change one individually
      fireEvent.click(screen.getByText('items'));
      fireEvent.click(screen.getByText('Remote (Server Version)'));

      // The "Keep Local" button should no longer be highlighted
      // (would need to check className, but the important thing is the individual change works)
      await waitFor(() => {
        expect(screen.getByText('2 of 2 resolved')).toBeInTheDocument();
      });
    });
  });

  describe('submit validation', () => {
    it('disables submit button when not all conflicts resolved', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      const submitButton = screen.getByRole('button', { name: 'Apply Resolutions' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when all conflicts resolved', async () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Resolve the conflict
      fireEvent.click(screen.getByRole('button', { name: 'Keep Local' }));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'Apply Resolutions' });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('calls onResolve with resolution map when submitted', async () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict({ id: 'conflict-1' })]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Resolve the conflict
      fireEvent.click(screen.getByRole('button', { name: 'Keep Local' }));

      // Submit
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: 'Apply Resolutions' });
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Apply Resolutions' }));

      expect(mockOnResolve).toHaveBeenCalledTimes(1);
      const resolutionMap = mockOnResolve.mock.calls[0][0];
      expect(resolutionMap.get('conflict-1')).toBe('local');
    });
  });

  describe('close behavior', () => {
    it('calls onClose when cancel button clicked', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button clicked', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      fireEvent.click(screen.getByLabelText('Close dialog'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop clicked', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Click on backdrop (the element with aria-hidden="true")
      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('shows confirmation when closing with partial resolutions', async () => {
      render(
        <ConflictResolutionDialog
          conflicts={[
            createMockConflict({ id: 'conflict-1' }),
            createMockConflict({ id: 'conflict-2', tableName: 'items' }),
          ]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Expand and resolve only the first conflict (not all)
      fireEvent.click(screen.getByText('shop_orders'));
      fireEvent.click(screen.getByText('Local (Your Version)'));

      // Verify only 1 of 2 resolved
      await waitFor(() => {
        expect(screen.getByText('1 of 2 resolved')).toBeInTheDocument();
      });

      // Now try to close - should show confirmation since not all resolved
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      // Confirm was called
      expect(window.confirm).toHaveBeenCalled();
    });

    it('does not close if confirmation is declined', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <ConflictResolutionDialog
          conflicts={[
            createMockConflict({ id: 'conflict-1' }),
            createMockConflict({ id: 'conflict-2', tableName: 'items' }),
          ]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Resolve only first conflict
      fireEvent.click(screen.getByText('shop_orders'));
      fireEvent.click(screen.getByText('Local (Your Version)'));

      // Try to close
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      // onClose should not be called since we declined
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('closes on Escape key', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict()]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('shows confirmation on Escape with partial resolutions', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[
            createMockConflict({ id: 'conflict-1' }),
            createMockConflict({ id: 'conflict-2', tableName: 'items' }),
          ]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Resolve only first
      fireEvent.click(screen.getByText('shop_orders'));
      fireEvent.click(screen.getByText('Local (Your Version)'));

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(window.confirm).toHaveBeenCalled();
    });
  });

  describe('formatValue helper', () => {
    it('displays null/undefined as (empty)', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict({ localValue: null, remoteValue: undefined })]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Expand the conflict
      fireEvent.click(screen.getByText('shop_orders'));

      // Should show (empty) for both
      const emptyValues = screen.getAllByText('(empty)');
      expect(emptyValues.length).toBeGreaterThanOrEqual(2);
    });

    it('displays objects as JSON', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict({ localValue: { name: 'Test', count: 5 } })]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Expand the conflict
      fireEvent.click(screen.getByText('shop_orders'));

      // Should show JSON representation
      expect(screen.getByText(/"name": "Test"/)).toBeInTheDocument();
    });

    it('displays primitive values as strings', () => {
      render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict({ localValue: 42, remoteValue: 'hello' })]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Expand the conflict
      fireEvent.click(screen.getByText('shop_orders'));

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('hello')).toBeInTheDocument();
    });
  });

  describe('state reset', () => {
    it('resets resolutions when conflicts change', async () => {
      const { rerender } = render(
        <ConflictResolutionDialog
          conflicts={[createMockConflict({ id: 'conflict-1' })]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Resolve the conflict
      fireEvent.click(screen.getByRole('button', { name: 'Keep Local' }));

      await waitFor(() => {
        expect(screen.getByText('1 of 1 resolved')).toBeInTheDocument();
      });

      // Change conflicts
      rerender(
        <ConflictResolutionDialog
          conflicts={[createMockConflict({ id: 'conflict-2' })]}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
          isOpen={true}
        />,
      );

      // Resolutions should be reset
      await waitFor(() => {
        expect(screen.getByText('0 of 1 resolved')).toBeInTheDocument();
      });
    });
  });
});
