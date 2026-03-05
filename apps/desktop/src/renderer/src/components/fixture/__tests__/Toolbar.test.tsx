import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from '../Toolbar';
import { DEFAULT_COLUMN_VISIBILITY } from '../../../types/columns';

/**
 * Toolbar Component Tests
 *
 * Target: 70%+ coverage
 * Tests: button rendering, click handlers (including the previously-broken
 * Duplicate and Export CSV stubs), and removal of Conditional Formatting button.
 */

const defaultProps = {
  selectedCount: 0,
  onAddFixture: vi.fn(),
  onBulkEdit: vi.fn(),
  onDeleteSelected: vi.fn(),
  onDeselectAll: vi.fn(),
  onUserColumnSettings: vi.fn(),
  columnVisibility: DEFAULT_COLUMN_VISIBILITY,
  onColumnVisibilityChange: vi.fn(),
};

describe('Toolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Always-visible buttons', () => {
    it('should render Add Fixture button', () => {
      render(<Toolbar {...defaultProps} />);
      expect(screen.getByText('+ Add Fixture')).toBeInTheDocument();
    });

    it('should call onAddFixture when Add Fixture is clicked', async () => {
      const user = userEvent.setup();
      const onAddFixture = vi.fn();
      render(<Toolbar {...defaultProps} onAddFixture={onAddFixture} />);

      await user.click(screen.getByText('+ Add Fixture'));

      expect(onAddFixture).toHaveBeenCalledTimes(1);
    });

    it('should render User Columns button', () => {
      render(<Toolbar {...defaultProps} />);
      expect(screen.getByText('User Columns...')).toBeInTheDocument();
    });

    it('should call onUserColumnSettings when User Columns is clicked', async () => {
      const user = userEvent.setup();
      const onUserColumnSettings = vi.fn();
      render(<Toolbar {...defaultProps} onUserColumnSettings={onUserColumnSettings} />);

      await user.click(screen.getByText('User Columns...'));

      expect(onUserColumnSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('Selection-conditional buttons', () => {
    it('should not render selection buttons when selectedCount is 0', () => {
      render(<Toolbar {...defaultProps} selectedCount={0} />);

      expect(screen.queryByText(/Bulk Edit/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Delete Selected/)).not.toBeInTheDocument();
      expect(screen.queryByText('Deselect All')).not.toBeInTheDocument();
    });

    it('should render selection buttons when selectedCount > 0', () => {
      render(<Toolbar {...defaultProps} selectedCount={3} />);

      expect(screen.getByText('Bulk Edit (3)')).toBeInTheDocument();
      expect(screen.getByText('Delete Selected (3)')).toBeInTheDocument();
      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    it('should call onBulkEdit when Bulk Edit is clicked', async () => {
      const user = userEvent.setup();
      const onBulkEdit = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={2} onBulkEdit={onBulkEdit} />);

      await user.click(screen.getByText('Bulk Edit (2)'));

      expect(onBulkEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDeleteSelected when Delete Selected is clicked', async () => {
      const user = userEvent.setup();
      const onDeleteSelected = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={1} onDeleteSelected={onDeleteSelected} />);

      await user.click(screen.getByText('Delete Selected (1)'));

      expect(onDeleteSelected).toHaveBeenCalledTimes(1);
    });

    it('should call onDeselectAll when Deselect All is clicked', async () => {
      const user = userEvent.setup();
      const onDeselectAll = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={1} onDeselectAll={onDeselectAll} />);

      await user.click(screen.getByText('Deselect All'));

      expect(onDeselectAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Duplicate button (bug fix: was missing onClick)', () => {
    it('should not render Duplicate button when onDuplicate is not provided', () => {
      render(<Toolbar {...defaultProps} selectedCount={2} />);

      expect(screen.queryByText('Duplicate')).not.toBeInTheDocument();
    });

    it('should render Duplicate button when onDuplicate is provided and rows are selected', () => {
      const onDuplicate = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={2} onDuplicate={onDuplicate} />);

      expect(screen.getByText('Duplicate')).toBeInTheDocument();
    });

    it('should not render Duplicate button when onDuplicate provided but selectedCount is 0', () => {
      const onDuplicate = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={0} onDuplicate={onDuplicate} />);

      expect(screen.queryByText('Duplicate')).not.toBeInTheDocument();
    });

    it('should call onDuplicate when Duplicate button is clicked', async () => {
      const user = userEvent.setup();
      const onDuplicate = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={2} onDuplicate={onDuplicate} />);

      await user.click(screen.getByText('Duplicate'));

      expect(onDuplicate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Export CSV button (bug fix: was missing onClick)', () => {
    it('should not render Export CSV button when onExportCSV is not provided', () => {
      render(<Toolbar {...defaultProps} selectedCount={2} />);

      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    });

    it('should render Export CSV button when onExportCSV is provided and rows are selected', () => {
      const onExportCSV = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={2} onExportCSV={onExportCSV} />);

      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('should not render Export CSV button when onExportCSV provided but selectedCount is 0', () => {
      const onExportCSV = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={0} onExportCSV={onExportCSV} />);

      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    });

    it('should call onExportCSV when Export CSV button is clicked', async () => {
      const user = userEvent.setup();
      const onExportCSV = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={1} onExportCSV={onExportCSV} />);

      await user.click(screen.getByText('Export CSV'));

      expect(onExportCSV).toHaveBeenCalledTimes(1);
    });
  });

  describe('Conditional Formatting removed from toolbar', () => {
    it('should not render Conditional Formatting button (moved to View menu)', () => {
      render(<Toolbar {...defaultProps} />);

      expect(screen.queryByText('Conditional Formatting...')).not.toBeInTheDocument();
    });

    it('should not render Conditional Formatting even with selectedCount > 0', () => {
      render(<Toolbar {...defaultProps} selectedCount={3} />);

      expect(screen.queryByText('Conditional Formatting...')).not.toBeInTheDocument();
    });
  });

  describe('Optional Hide/Unhide buttons', () => {
    it('should render Hide button when onHideSelected is provided', () => {
      const onHideSelected = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={2} onHideSelected={onHideSelected} />);

      expect(screen.getByText('Hide (2)')).toBeInTheDocument();
    });

    it('should not render Hide button when onHideSelected is not provided', () => {
      render(<Toolbar {...defaultProps} selectedCount={2} />);

      expect(screen.queryByText(/^Hide/)).not.toBeInTheDocument();
    });

    it('should render Unhide button when onUnhideSelected is provided', () => {
      const onUnhideSelected = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={2} onUnhideSelected={onUnhideSelected} />);

      expect(screen.getByText('Unhide (2)')).toBeInTheDocument();
    });

    it('should call onHideSelected when Hide is clicked', async () => {
      const user = userEvent.setup();
      const onHideSelected = vi.fn();
      render(<Toolbar {...defaultProps} selectedCount={1} onHideSelected={onHideSelected} />);

      await user.click(screen.getByText('Hide (1)'));

      expect(onHideSelected).toHaveBeenCalledTimes(1);
    });
  });
});
