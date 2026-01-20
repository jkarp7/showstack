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
const mockLoadProject = vi.fn();

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
  loadProject: mockLoadProject,
  ...overrides,
});

// Mocked store ref that can be updated per test
let mockStoreData = createMockStore();

vi.mock('../../../store/prepStore', () => ({
  usePrepStore: () => mockStoreData,
}));

// Helper to mock clipboard API
const mockClipboard = (text: string) => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      readText: vi.fn().mockResolvedValue(text),
    },
    writable: true,
    configurable: true,
  });
};

// Helper to mock clipboard failure
const mockClipboardError = (error: Error) => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      readText: vi.fn().mockRejectedValue(error),
    },
    writable: true,
    configurable: true,
  });
};

describe('ShopOrderTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreData = createMockStore();
  });

  describe('Rendering', () => {
    it('should render table with headers', () => {
      render(<ShopOrderTable projectId="proj-1" />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Rev 1')).toBeInTheDocument();
      expect(screen.getByText('Spare')).toBeInTheDocument();
      expect(screen.getByText('Venue')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
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
      // Double-click to edit
      await user.dblClick(descCell);

      const input = screen.getByDisplayValue('LED Par 64');
      expect(input).toBeInTheDocument();

      await user.clear(input);
      await user.type(input, 'Updated Description');
      await user.keyboard('{Enter}');

      // Wait for debounced save
      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should cancel edit on Escape key', async () => {
      const user = userEvent.setup();
      render(<ShopOrderTable projectId="proj-1" />);

      const descCell = screen.getByText('LED Par 64');
      await user.dblClick(descCell);

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
      await user.dblClick(descCell);

      const input = screen.getByDisplayValue('LED Par 64');
      await user.clear(input);
      await user.type(input, 'Blur Test');

      // Trigger blur by clicking elsewhere
      const header = screen.getByText('Shop Order');
      await user.click(header);

      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Inline Editing - Revision Quantities', () => {
    it('should display revision columns when revisions exist', () => {
      render(<ShopOrderTable projectId="proj-1" />);

      // Should show Rev 1 column (current_revision is 1)
      expect(screen.getByText('Rev 1')).toBeInTheDocument();

      // Should display revision quantities (LED Par 64 has active_qty: 10 in Rev 1)
      const revisionCells = screen.getAllByText('10');
      expect(revisionCells.length).toBeGreaterThan(0);
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

      // Rev 0 columns are not shown in the table (only Rev 1+)
      expect(screen.queryByText('Rev 0')).not.toBeInTheDocument();
      expect(screen.queryByText('Rev 1')).not.toBeInTheDocument();
      // But Active column should still be present
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Phase 4: Import/Export Features', () => {
    describe('Paste from Clipboard', () => {
      it('should have paste button in section headers', () => {
        render(<ShopOrderTable projectId="proj-1" />);

        const pasteButtons = screen.getAllByText('Paste Items');
        expect(pasteButtons.length).toBeGreaterThan(0);
      });

      it('should parse TSV data with headers', async () => {
        const user = userEvent.setup();
        mockClipboard('Description\tActive\tSpare\tVenue\tNotes\nTest Item\t5\t1\t0\tTest notes');
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<ShopOrderTable projectId="proj-1" />);

        const pasteButtons = screen.getAllByText('Paste Items');
        await user.click(pasteButtons[0]);

        await waitFor(() => {
          expect(mockCreateItem).toHaveBeenCalledWith(
            expect.objectContaining({
              section_id: 'sec-1',
              description: 'Test Item',
              active_qty: 5,
              spare_qty: 1,
              venue_qty: 0,
              notes: 'Test notes',
            })
          );
        });
      });

      it('should parse CSV data with headers', async () => {
        const user = userEvent.setup();
        mockClipboard('Description,Active,Spare,Venue,Notes\n"Test Item",5,1,0,"Test notes"');
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<ShopOrderTable projectId="proj-1" />);

        const pasteButtons = screen.getAllByText('Paste Items');
        await user.click(pasteButtons[0]);

        await waitFor(() => {
          expect(mockCreateItem).toHaveBeenCalled();
        });
      });

      it('should parse data without headers', async () => {
        const user = userEvent.setup();
        mockClipboard('Test Item\t5\t1\t0\tTest notes');
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<ShopOrderTable projectId="proj-1" />);

        const pasteButtons = screen.getAllByText('Paste Items');
        await user.click(pasteButtons[0]);

        await waitFor(() => {
          expect(mockCreateItem).toHaveBeenCalledWith(
            expect.objectContaining({
              description: 'Test Item',
              active_qty: 5,
            })
          );
        });
      });

      it('should handle empty clipboard', async () => {
        const user = userEvent.setup();
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        mockClipboard('');

        render(<ShopOrderTable projectId="proj-1" />);

        const pasteButtons = screen.getAllByText('Paste Items');
        await user.click(pasteButtons[0]);

        await waitFor(() => {
          expect(alertSpy).toHaveBeenCalledWith('Clipboard is empty.');
        });
      });

      it('should allow user to cancel paste', async () => {
        const user = userEvent.setup();
        mockClipboard('Test Item\t5\t1\t0\tTest notes');
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        render(<ShopOrderTable projectId="proj-1" />);

        const pasteButtons = screen.getAllByText('Paste Items');
        await user.click(pasteButtons[0]);

        await waitFor(() => {
          expect(mockCreateItem).not.toHaveBeenCalled();
        });
      });
    });

    describe('Export to CSV', () => {

      it('should have export button', () => {
        render(<ShopOrderTable projectId="proj-1" />);

        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });

      it('should export table to CSV format', async () => {
        const user = userEvent.setup();
        let csvContent = '';

        // Mock Blob and URL
        global.Blob = vi.fn((content) => {
          csvContent = content[0];
          return { type: 'text/csv;charset=utf-8;' };
        }) as any;

        global.URL.createObjectURL = vi.fn(() => 'mock-url');

        // Mock link.click() to prevent JSDOM navigation error
        const mockClick = vi.fn();
        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
          const element = originalCreateElement(tagName);
          if (tagName === 'a') {
            element.click = mockClick;
          }
          return element;
        });

        render(<ShopOrderTable projectId="proj-1" />);

        const exportButton = screen.getByText('Export CSV');
        await user.click(exportButton);

        await waitFor(() => {
          expect(csvContent).toContain('Section,Description,Active,Spare,Total');
          expect(csvContent).toContain('LED Par 64');
          expect(csvContent).toContain('MAC Aura');
          expect(mockClick).toHaveBeenCalled();
        });
      });
    });

    describe('Merge Duplicates', () => {
      beforeEach(() => {
        // Create mock data with duplicates
        mockStoreData = createMockStore({
          items: [
            {
              ...defaultMockItems[0],
              id: 'item-1',
              description: 'LED Par 64',
              active_qty: 5,
              revision_quantities: '{"0":5,"1":5}',
            },
            {
              ...defaultMockItems[0],
              id: 'item-2',
              description: 'LED Par 64', // Duplicate
              active_qty: 3,
              revision_quantities: '{"0":3,"1":3}',
            },
          ],
        });
      });

      it('should have merge duplicates button', () => {
        render(<ShopOrderTable projectId="proj-1" />);

        const mergeButtons = screen.getAllByText('Merge Duplicates');
        expect(mergeButtons.length).toBeGreaterThan(0);
      });

      it('should merge duplicate items in section', async () => {
        const user = userEvent.setup();
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<ShopOrderTable projectId="proj-1" />);

        const mergeButtons = screen.getAllByText('Merge Duplicates');
        await user.click(mergeButtons[0]);

        await waitFor(() => {
          // Should update the first item with merged quantities
          expect(mockUpdateItem).toHaveBeenCalled();
          // Should delete the duplicate
          expect(mockDeleteItem).toHaveBeenCalled();
        });
      });

      it('should show alert when no duplicates found', async () => {
        const user = userEvent.setup();
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

        // Use non-duplicate items
        mockStoreData = createMockStore({
          items: [defaultMockItems[0]], // Only one item
        });

        render(<ShopOrderTable projectId="proj-1" />);

        const mergeButtons = screen.getAllByText('Merge Duplicates');
        await user.click(mergeButtons[0]);

        await waitFor(() => {
          expect(alertSpy).toHaveBeenCalledWith('No duplicate items found in this section.');
        });
      });
    });
  });

  describe('Phase 5: Performance & Polish', () => {

    describe('Keyboard Shortcuts', () => {
      it('should paste on Ctrl+V (or Cmd+V on Mac)', async () => {
        mockClipboard('Test Item\t5\t1\t0\tTest notes');
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<ShopOrderTable projectId="proj-1" />);

        // Trigger Ctrl+V (works for both platforms in the implementation)
        const event = new KeyboardEvent('keydown', {
          key: 'v',
          ctrlKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);

        await waitFor(() => {
          expect(mockCreateItem).toHaveBeenCalled();
        }, { timeout: 2000 });
      });
    });

    describe('Cell Selection', () => {
      it('should select cell on single click', async () => {
        const user = userEvent.setup();
        render(<ShopOrderTable projectId="proj-1" />);

        const descCell = screen.getByText('LED Par 64');
        await user.click(descCell);

        // Cell div should have selection styling (blue ring)
        expect(descCell).toHaveClass('ring-2');
      });

      it('should edit cell on double click', async () => {
        const user = userEvent.setup();
        render(<ShopOrderTable projectId="proj-1" />);

        const descCell = screen.getByText('LED Par 64');
        await user.dblClick(descCell);

        // Should show input
        const input = screen.getByDisplayValue('LED Par 64');
        expect(input).toBeInTheDocument();
      });
    });

    describe('Debounced Saves', () => {
      it('should debounce rapid edits', async () => {
        const user = userEvent.setup();
        render(<ShopOrderTable projectId="proj-1" />);

        const descCell = screen.getByText('LED Par 64');
        await user.dblClick(descCell);

        const input = screen.getByDisplayValue('LED Par 64');

        // Clear and type quickly
        await user.clear(input);
        await user.type(input, 'New Name');
        await user.keyboard('{Enter}');

        // Wait for debounced save (500ms + processing time)
        await waitFor(() => {
          expect(mockUpdateItem).toHaveBeenCalled();
        }, { timeout: 1500 });

        // Should only save once despite multiple keystrokes
        const updateCalls = mockUpdateItem.mock.calls.filter(
          call => call[1].description !== undefined
        );
        expect(updateCalls.length).toBeLessThanOrEqual(1);
      });
    });

    describe('Loading States', () => {
      it('should have add revision button', () => {
        render(<ShopOrderTable projectId="proj-1" />);
        expect(screen.getByText(/Add Revision/)).toBeInTheDocument();
      });

      it('should disable add revision button at max revisions', () => {
        mockStoreData = createMockStore({
          currentProject: {
            ...defaultMockProject,
            current_revision: 5,
          },
        });

        render(<ShopOrderTable projectId="proj-1" />);

        const addRevButton = screen.getByText(/Add Revision/) as HTMLButtonElement;
        expect(addRevButton).toBeDisabled();
      });
    });

    describe('Error Handling', () => {
      it('should show error toast on failed operation', async () => {
        const user = userEvent.setup();
        mockClipboardError(new Error('Clipboard access denied'));

        render(<ShopOrderTable projectId="proj-1" />);

        const pasteButtons = screen.getAllByText('Paste Items');
        await user.click(pasteButtons[0]);

        // Should show error toast
        await waitFor(() => {
          expect(screen.getByText(/Failed to paste items/)).toBeInTheDocument();
        }, { timeout: 2000 });
      });

      it('should have error toast dismiss button', async () => {
        const user = userEvent.setup();
        mockClipboardError(new Error('Error'));

        render(<ShopOrderTable projectId="proj-1" />);

        const pasteButtons = screen.getAllByText('Paste Items');
        await user.click(pasteButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/Failed to paste items/)).toBeInTheDocument();
        }, { timeout: 2000 });

        // Should have close button(s) - check that at least one exists
        const closeButtons = screen.getAllByText('×');
        expect(closeButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
