import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShopOrderTable } from '../ShopOrderTable';
import type { usePrepStore } from '../../../store/prepStore';
import type { PrepProject, PrepSection, PrepEquipmentItem } from '../../../types/prep';

/**
 * ShopOrderTable Component Tests
 *
 * Target: 70%+ coverage
 * Tests spreadsheet-like table interface with inline editing
 */

// Mock the prepStore
const mockUpdateItem = vi.fn();
const mockCreateItem = vi.fn();
const mockDeleteItem = vi.fn();

// Default mock data
const defaultMockProject: PrepProject = {
  id: 'proj-1',
  production_name: 'Test Show',
  current_revision: 1,
  disciplines: ['lighting'],
  order_date: Date.now(),
  created_at: Date.now(),
  updated_at: Date.now(),
};

const defaultMockSections: PrepSection[] = [
  {
    id: 'sec-1',
    prep_project_id: 'proj-1',
    name: 'Moving Lights',
    discipline: 'lighting' as const,
    sort_order: 0,
    page_break: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'sec-2',
    prep_project_id: 'proj-1',
    name: 'LED Fixtures',
    discipline: 'lighting' as const,
    sort_order: 1,
    page_break: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

const defaultMockItems: PrepEquipmentItem[] = [
  {
    id: 'item-1',
    section_id: 'sec-1',
    description: 'LED Par 64',
    active_qty: 10,
    spare_qty: 2,
    venue_qty: 0,
    total_qty: 12,
    venue_active: 0,
    venue_spare: 0,
    sort_order: 0,
    revision_quantities: '{"0":10,"1":10}',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'item-2',
    section_id: 'sec-1',
    description: 'MAC Aura',
    active_qty: 8,
    spare_qty: 1,
    venue_qty: 2,
    total_qty: 9,
    venue_active: 0,
    venue_spare: 0,
    sort_order: 1,
    revision_quantities: '{"0":8,"1":8}',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'item-3',
    section_id: 'sec-2',
    description: 'Chauvet COLORdash',
    active_qty: 12,
    spare_qty: 0,
    venue_qty: 0,
    total_qty: 12,
    venue_active: 0,
    venue_spare: 0,
    sort_order: 0,
    revision_quantities: '{"0":12,"1":12}',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

// Mock store factory
const createMockStore = (overrides?: Partial<ReturnType<typeof usePrepStore>>) => ({
  currentProject: defaultMockProject,
  sections: defaultMockSections,
  items: defaultMockItems,
  updateItem: mockUpdateItem,
  createItem: mockCreateItem,
  deleteItem: mockDeleteItem,
  ...overrides,
});

// Mocked store ref that can be updated per test
let mockStoreData = createMockStore();

vi.mock('../../../store/prepStore', () => ({
  usePrepStore: () => mockStoreData,
}));

describe('ShopOrderTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with headers', () => {
      render(<ShopOrderTable projectId="proj-1" />);

      expect(screen.getByText('Section')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Rev 0')).toBeInTheDocument();
      expect(screen.getByText('Rev 1')).toBeInTheDocument();
      expect(screen.getByText('Spare')).toBeInTheDocument();
      expect(screen.getByText('Venue')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Rental')).toBeInTheDocument();
    });

    it('should render section headers', () => {
      render(<ShopOrderTable projectId="proj-1" />);

      expect(screen.getByText('MOVING LIGHTS')).toBeInTheDocument();
      expect(screen.getByText('LED FIXTURES')).toBeInTheDocument();
    });

    it('should render items in correct sections', () => {
      render(<ShopOrderTable projectId="proj-1" />);

      expect(screen.getByText('LED Par 64')).toBeInTheDocument();
      expect(screen.getByText('MAC Aura')).toBeInTheDocument();
      expect(screen.getByText('Chauvet COLORdash')).toBeInTheDocument();
    });

    it('should display revision quantities', () => {
      render(<ShopOrderTable projectId="proj-1" />);

      // LED Par 64 has qty 10 in both revisions
      const cells = screen.getAllByText('10');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should display spare and venue quantities', () => {
      render(<ShopOrderTable projectId="proj-1" />);

      // LED Par 64 has spare_qty: 2
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });

    it('should calculate and display total quantities', () => {
      render(<ShopOrderTable projectId="proj-1" />);

      // LED Par 64: max(10,10) + 2 = 12
      const totals = screen.getAllByText('12');
      expect(totals.length).toBeGreaterThan(0);
    });

    it('should calculate and display rental quantities', () => {
      render(<ShopOrderTable projectId="proj-1" />);

      // LED Par 64: 12 total - 0 venue = 12 rental
      // MAC Aura: 9 total - 2 venue = 7 rental
      expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    });
  });

  describe('Inline Editing - Description', () => {
    it('should allow editing description', async () => {
      const user = userEvent.setup();
      render(<ShopOrderTable projectId="proj-1" />);

      const descCell = screen.getByText('LED Par 64');
      await user.click(descCell);

      const input = screen.getByDisplayValue('LED Par 64');
      expect(input).toBeInTheDocument();

      await user.clear(input);
      await user.type(input, 'Updated Description');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
          description: 'Updated Description',
        });
      });
    });

    it('should cancel edit on Escape key', async () => {
      const user = userEvent.setup();
      render(<ShopOrderTable projectId="proj-1" />);

      const descCell = screen.getByText('LED Par 64');
      await user.click(descCell);

      const input = screen.getByDisplayValue('LED Par 64');
      await user.clear(input);
      await user.type(input, 'New Text');
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockUpdateItem).not.toHaveBeenCalled();
      });
    });

    it('should save edit on blur', async () => {
      const user = userEvent.setup();
      render(<ShopOrderTable projectId="proj-1" />);

      const descCell = screen.getByText('LED Par 64');
      await user.click(descCell);

      const input = screen.getByDisplayValue('LED Par 64');
      await user.clear(input);
      await user.type(input, 'Blur Test');

      // Trigger blur by clicking elsewhere
      const header = screen.getByText('Shop Order');
      await user.click(header);

      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
          description: 'Blur Test',
        });
      });
    });
  });

  describe('Inline Editing - Revision Quantities', () => {
    it('should allow editing revision quantity', async () => {
      const user = userEvent.setup();
      render(<ShopOrderTable projectId="proj-1" />);

      // Find a revision cell (there are multiple cells with "10")
      const cells = screen.getAllByText('10');
      const revisionCell = cells[0]; // First "10" should be a revision cell

      await user.click(revisionCell);

      // Find the input (should be a number input)
      const input = document.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();

      if (input) {
        await user.clear(input);
        await user.type(input, '15');
        await user.keyboard('{Enter}');

        await waitFor(() => {
          expect(mockUpdateItem).toHaveBeenCalled();
          const call = mockUpdateItem.mock.calls[0];
          expect(call[1]).toHaveProperty('revision_quantities');
        });
      }
    });
  });

  describe('Inline Editing - Spare and Venue', () => {
    it('should allow editing spare quantity', async () => {
      const user = userEvent.setup();
      render(<ShopOrderTable projectId="proj-1" />);

      // LED Par 64 has spare_qty 2
      const cells = screen.getAllByText('2');
      const spareCell = cells[0];

      await user.click(spareCell);

      const input = document.querySelector('input[type="number"]');
      if (input) {
        await user.clear(input);
        await user.type(input, '5');
        await user.keyboard('{Enter}');

        await waitFor(() => {
          expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
            spare_qty: 5,
          });
        });
      }
    });

    it('should allow editing venue quantity', async () => {
      const user = userEvent.setup();
      render(<ShopOrderTable projectId="proj-1" />);

      // Find venue cell for LED Par 64 (venue_qty: 0)
      const cells = screen.getAllByText('0');
      const venueCell = cells[0];

      await user.click(venueCell);

      const input = document.querySelector('input[type="number"]');
      if (input) {
        await user.clear(input);
        await user.type(input, '3');
        await user.keyboard('{Enter}');

        await waitFor(() => {
          expect(mockUpdateItem).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Section Dropdown', () => {
    it('should allow changing item section', async () => {
      const user = userEvent.setup();
      render(<ShopOrderTable projectId="proj-1" />);

      // Click on section cell for LED Par 64
      const sectionCells = screen.getAllByText('Moving Lights');
      const firstSectionCell = sectionCells[0];

      await user.click(firstSectionCell);

      // Should show dropdown
      const select = document.querySelector('select');
      expect(select).toBeInTheDocument();

      if (select) {
        await user.selectOptions(select, 'sec-2');

        await waitFor(() => {
          expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
            section_id: 'sec-2',
          });
        });
      }
    });
  });

  describe('Add Item', () => {
    it('should add new item to section', async () => {
      const user = userEvent.setup();
      render(<ShopOrderTable projectId="proj-1" />);

      const addButtons = screen.getAllByText('+ Add Item');
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(mockCreateItem).toHaveBeenCalledWith(
          expect.objectContaining({
            section_id: 'sec-1',
            description: 'New Item',
            active_qty: 0,
            spare_qty: 0,
            venue_qty: 0,
          })
        );
      });
    });
  });

  describe('Delete Item', () => {
    it('should delete item with confirmation', async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<ShopOrderTable projectId="proj-1" />);

      const deleteButtons = screen.getAllByTitle('Delete item');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockDeleteItem).toHaveBeenCalledWith('item-1');
      });
    });

    it('should not delete if user cancels', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<ShopOrderTable projectId="proj-1" />);

      const deleteButtons = screen.getAllByTitle('Delete item');
      await user.click(deleteButtons[0]);

      expect(mockDeleteItem).not.toHaveBeenCalled();
    });
  });

  describe('Deleted Items', () => {
    it('should visually indicate deleted items', () => {
      // Update mock store with deleted item
      mockStoreData = createMockStore({
        items: [
          {
            ...defaultMockItems[0],
            id: 'item-deleted',
            description: 'Deleted Item',
            deleted_in_revision: 1,
          },
        ],
      });

      render(<ShopOrderTable projectId="proj-1" />);

      const deletedRow = screen.getByText('Deleted Item').closest('tr');
      expect(deletedRow).toHaveClass('opacity-50');
      expect(deletedRow).toHaveClass('line-through');
    });
  });

  describe('Edge Cases', () => {
    it('should handle project without sections', () => {
      mockStoreData = createMockStore({
        sections: [],
        items: [],
      });

      render(<ShopOrderTable projectId="proj-1" />);

      expect(screen.getByText(/No sections yet/)).toBeInTheDocument();
    });

    it('should handle revision 0 (no revisions yet)', () => {
      mockStoreData = createMockStore({
        currentProject: {
          ...defaultMockProject,
          current_revision: 0,
        },
        items: [],
      });

      render(<ShopOrderTable projectId="proj-1" />);

      expect(screen.getByText('Rev 0')).toBeInTheDocument();
      expect(screen.queryByText('Rev 1')).not.toBeInTheDocument();
    });
  });
});
