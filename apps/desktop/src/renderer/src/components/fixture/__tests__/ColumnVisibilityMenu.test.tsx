import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnVisibilityMenu } from '../ColumnVisibilityMenu';
import { DEFAULT_COLUMN_VISIBILITY } from '../../../types/columns';

/**
 * ColumnVisibilityMenu Component Tests
 *
 * Target: 70%+ coverage
 * Tests: controlled mode (isOpen/onOpenChange props), uncontrolled mode,
 * and that internal state does not diverge in controlled mode.
 */

const defaultProps = {
  visibility: DEFAULT_COLUMN_VISIBILITY,
  onVisibilityChange: vi.fn(),
};

describe('ColumnVisibilityMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Uncontrolled mode', () => {
    it('should render the toggle button', () => {
      render(<ColumnVisibilityMenu {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Columns/i })).toBeInTheDocument();
    });

    it('should open menu when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<ColumnVisibilityMenu {...defaultProps} />);

      expect(screen.queryByText('Show/Hide Columns')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Columns/i }));

      expect(screen.getByText('Show/Hide Columns')).toBeInTheDocument();
    });

    it('should close menu when toggle button is clicked again', async () => {
      const user = userEvent.setup();
      render(<ColumnVisibilityMenu {...defaultProps} />);

      const toggleBtn = screen.getAllByRole('button', { name: /Columns/i })[0];
      await user.click(toggleBtn);
      expect(screen.getByText('Show/Hide Columns')).toBeInTheDocument();

      await user.click(toggleBtn);
      expect(screen.queryByText('Show/Hide Columns')).not.toBeInTheDocument();
    });
  });

  describe('Controlled mode', () => {
    it('should render menu open when isOpen=true', () => {
      render(<ColumnVisibilityMenu {...defaultProps} isOpen={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText('Show/Hide Columns')).toBeInTheDocument();
    });

    it('should not render menu when isOpen=false', () => {
      render(<ColumnVisibilityMenu {...defaultProps} isOpen={false} onOpenChange={vi.fn()} />);

      expect(screen.queryByText('Show/Hide Columns')).not.toBeInTheDocument();
    });

    it('should call onOpenChange(false) when toggle button is clicked while open', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<ColumnVisibilityMenu {...defaultProps} isOpen={true} onOpenChange={onOpenChange} />);

      // First button matching /Columns/i is the toggle button
      await user.click(screen.getAllByRole('button', { name: /Columns/i })[0]);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange(true) when toggle button is clicked while closed', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<ColumnVisibilityMenu {...defaultProps} isOpen={false} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole('button', { name: /Columns/i }));

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('should not update internal state in controlled mode (no divergence)', async () => {
      // In controlled mode the parent owns isOpen; internal state should stay false
      // so if the parent doesn't update isOpen, the menu stays closed after a click
      const user = userEvent.setup();
      const onOpenChange = vi.fn(); // parent does NOT update isOpen
      render(<ColumnVisibilityMenu {...defaultProps} isOpen={false} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole('button', { name: /Columns/i }));

      // onOpenChange was called, but since parent didn't update prop the menu stays closed
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByText('Show/Hide Columns')).not.toBeInTheDocument();
    });
  });

  describe('Column visibility count', () => {
    it('should display the count of visible columns', () => {
      const allVisible = Object.fromEntries(
        Object.keys(DEFAULT_COLUMN_VISIBILITY).map((k) => [k, true]),
      ) as typeof DEFAULT_COLUMN_VISIBILITY;

      render(<ColumnVisibilityMenu {...defaultProps} visibility={allVisible} />);

      const visibleCount = Object.values(allVisible).filter(Boolean).length;
      expect(screen.getByText(new RegExp(`Columns \\(${visibleCount}\\)`))).toBeInTheDocument();
    });
  });
});
