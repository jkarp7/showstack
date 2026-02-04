import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevisionChangeLogPage } from '../RevisionChangeLogPage';
import type { usePrepStore } from '../../../store/prepStore';
import type { PrepProject, PrepSection, PrepEquipmentItem, PrepRevision } from '../../../types/prep';

/**
 * RevisionChangeLogPage Component Tests
 *
 * Tests the revision change log page
 */

const defaultMockProject: PrepProject = {
  id: 'proj-1',
  production_name: 'Test Show',
  current_revision: 2,
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
];

const defaultMockItems: PrepEquipmentItem[] = [
  {
    id: 'item-1',
    section_id: 'sec-1',
    description: 'LED Par 64 (Added in Rev 1)',
    active_qty: 10,
    spare_qty: 2,
    venue_qty: 0,
    total_qty: 12,
    venue_active: 0,
    venue_spare: 0,
    sort_order: 0,
    revision_quantities: '{"0":0,"1":10,"2":10}', // Added in Rev 1
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'item-2',
    section_id: 'sec-1',
    description: 'MAC Aura (Modified in Rev 1)',
    active_qty: 12,
    spare_qty: 1,
    venue_qty: 0,
    total_qty: 13,
    venue_active: 0,
    venue_spare: 0,
    sort_order: 1,
    revision_quantities: '{"0":8,"1":12,"2":12}', // Modified in Rev 1
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'item-3',
    section_id: 'sec-1',
    description: 'Source Four (Deleted in Rev 2)',
    active_qty: 0,
    spare_qty: 0,
    venue_qty: 0,
    total_qty: 0,
    venue_active: 0,
    venue_spare: 0,
    sort_order: 2,
    revision_quantities: '{"0":10,"1":10,"2":0}', // Deleted in Rev 2
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

const defaultMockRevisions: PrepRevision[] = [
  {
    id: 'rev-0',
    prep_project_id: 'proj-1',
    revision_number: 0,
    notes: 'Initial revision',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'rev-1',
    prep_project_id: 'proj-1',
    revision_number: 1,
    notes: 'First revision',
    spare_snapshot: '{"item-1":2,"item-2":1,"item-3":0}',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'rev-2',
    prep_project_id: 'proj-1',
    revision_number: 2,
    notes: 'Second revision',
    spare_snapshot: '{"item-1":2,"item-2":1,"item-3":0}',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

// Mocked store ref
let mockStoreData = {
  currentProject: defaultMockProject,
  sections: defaultMockSections,
  items: defaultMockItems,
  revisions: defaultMockRevisions,
};

vi.mock('../../../store/prepStore', () => ({
  usePrepStore: () => mockStoreData,
}));

describe('RevisionChangeLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreData = {
      currentProject: defaultMockProject,
      sections: defaultMockSections,
      items: defaultMockItems,
      revisions: defaultMockRevisions,
    };
  });

  describe('Rendering', () => {
    it('should render change log page with header', () => {
      render(<RevisionChangeLogPage projectId="proj-1" />);

      expect(screen.getByText('Revision Change Log')).toBeInTheDocument();
      expect(screen.getByText('Test Show')).toBeInTheDocument();
    });

    it('should show revision selector', () => {
      render(<RevisionChangeLogPage projectId="proj-1" />);

      const select = screen.getByDisplayValue('Rev 2');
      expect(select).toBeInTheDocument();
    });

    it('should show filter selector', () => {
      render(<RevisionChangeLogPage projectId="proj-1" />);

      const filter = screen.getByDisplayValue('All Changes');
      expect(filter).toBeInTheDocument();
    });

    it('should display summary stats', () => {
      render(<RevisionChangeLogPage projectId="proj-1" />);

      expect(screen.getByText(/Total Changes:/)).toBeInTheDocument();
      expect(screen.getByText(/Additions:/)).toBeInTheDocument();
      expect(screen.getByText(/Modifications:/)).toBeInTheDocument();
      expect(screen.getByText(/Deletions:/)).toBeInTheDocument();
    });

    it('should detect additions', async () => {
      const user = userEvent.setup();
      render(<RevisionChangeLogPage projectId="proj-1" />);

      // Switch to Rev 1 (where item-1 was added)
      const select = screen.getByDisplayValue('Rev 2');
      await user.selectOptions(select, '1');

      await waitFor(() => {
        // Should show the added item
        expect(screen.getByText(/LED Par 64/)).toBeInTheDocument();
      });
    });

    it('should detect modifications', async () => {
      const user = userEvent.setup();
      render(<RevisionChangeLogPage projectId="proj-1" />);

      // Switch to Rev 1 (where item-2 was modified)
      const select = screen.getByDisplayValue('Rev 2');
      await user.selectOptions(select, '1');

      await waitFor(() => {
        // Should show the modified item
        expect(screen.getByText(/MAC Aura/)).toBeInTheDocument();
      });
    });

    it('should detect deletions', () => {
      render(<RevisionChangeLogPage projectId="proj-1" />);

      // Rev 2 shows deletion of item-3
      expect(screen.getByText(/Source Four/)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter by addition', async () => {
      const user = userEvent.setup();
      render(<RevisionChangeLogPage projectId="proj-1" />);

      // Switch to Rev 1
      const revSelect = screen.getByDisplayValue('Rev 2');
      await user.selectOptions(revSelect, '1');

      // Filter by additions
      const filterSelect = screen.getByDisplayValue('All Changes');
      await user.selectOptions(filterSelect, 'addition');

      // Should only show additions
      expect(screen.getByText(/LED Par 64/)).toBeInTheDocument();
    });

    it('should filter by modification', async () => {
      const user = userEvent.setup();
      render(<RevisionChangeLogPage projectId="proj-1" />);

      // Switch to Rev 1
      const revSelect = screen.getByDisplayValue('Rev 2');
      await user.selectOptions(revSelect, '1');

      // Filter by modifications
      const filterSelect = screen.getByDisplayValue('All Changes');
      await user.selectOptions(filterSelect, 'modification');

      // Should only show modifications
      expect(screen.getByText(/MAC Aura/)).toBeInTheDocument();
    });

    it('should filter by deletion', async () => {
      const user = userEvent.setup();
      render(<RevisionChangeLogPage projectId="proj-1" />);

      // Rev 2 has deletion
      // Filter by deletions
      const filterSelect = screen.getByDisplayValue('All Changes');
      await user.selectOptions(filterSelect, 'deletion');

      // Should only show deletions
      expect(screen.getByText(/Source Four/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle Rev 0 with no changes', () => {
      // Set project to Rev 0
      mockStoreData = {
        ...mockStoreData,
        currentProject: {
          ...defaultMockProject,
          current_revision: 0,
        },
      };

      render(<RevisionChangeLogPage projectId="proj-1" />);

      expect(screen.getByText(/has no changes/)).toBeInTheDocument();
    });

    it('should handle revision with no changes', () => {
      // Mock items with no changes between revisions
      mockStoreData = {
        ...mockStoreData,
        items: [
          {
            ...defaultMockItems[0],
            revision_quantities: '{"0":10,"1":10,"2":10}', // No changes
          },
        ],
      };

      render(<RevisionChangeLogPage projectId="proj-1" />);

      expect(screen.getByText(/No changes found/)).toBeInTheDocument();
    });

    it('should handle missing project', () => {
      mockStoreData = {
        ...mockStoreData,
        currentProject: null as any,
      };

      render(<RevisionChangeLogPage projectId="proj-1" />);

      expect(screen.getByText(/No project loaded/)).toBeInTheDocument();
    });
  });

  describe('Print Functionality', () => {
    it('should have print button', () => {
      render(<RevisionChangeLogPage projectId="proj-1" />);

      const printButton = screen.getByText('Print Report');
      expect(printButton).toBeInTheDocument();
    });

    it('should call print API when print button clicked', async () => {
      const user = userEvent.setup();
      const mockPrint = vi.fn();
      window.api = {
        prep: {
          print: {
            revisionChangeLog: mockPrint,
          },
        },
      } as any;

      render(<RevisionChangeLogPage projectId="proj-1" />);

      const printButton = screen.getByText('Print Report');
      await user.click(printButton);

      expect(mockPrint).toHaveBeenCalledWith('proj-1', 2);
    });
  });

  describe('Change Type Display', () => {
    it('should display change type badges correctly', () => {
      render(<RevisionChangeLogPage projectId="proj-1" />);

      // Should have badges for different change types
      const badges = screen.getAllByText(/Add|Mod|Del/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should show old and new quantities', () => {
      render(<RevisionChangeLogPage projectId="proj-1" />);

      // Look for the arrow separator
      const arrows = screen.getAllByText('→');
      expect(arrows.length).toBeGreaterThan(0);
    });
  });
});
