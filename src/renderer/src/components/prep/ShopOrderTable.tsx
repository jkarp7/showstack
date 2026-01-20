import React, { useState, useEffect, useRef } from 'react';
import { usePrepStore } from '../../store/prepStore';
import type { PrepSection, PrepEquipmentItem } from '../../types/prep';
import {
  parseRevisionQuantities,
  setRevisionQuantity,
} from '../../utils/revisionUtils';

// Constants
const MAX_REVISIONS = 5; // Maximum number of revisions (0-5 = 6 total)
const DEBOUNCE_DELAY_MS = 500; // Delay before saving edits
const ERROR_TOAST_DURATION_MS = 5000; // Auto-dismiss error toasts after 5 seconds
const MAX_PASTE_ROWS = 1000; // Maximum rows allowed in clipboard paste (prevent DoS)
const MAX_DESCRIPTION_LENGTH = 500; // Maximum characters for item descriptions
const MAX_QUANTITY_VALUE = 99999; // Maximum allowed quantity value

/**
 * Sanitizes a string for safe CSV export to prevent formula injection attacks.
 * Prefixes values starting with dangerous characters (=, +, -, @, tab, carriage return)
 * with a single quote to prevent Excel from interpreting them as formulas.
 *
 * @param value - The string value to sanitize
 * @returns Sanitized string safe for CSV export
 */
function sanitizeCSVValue(value: string): string {
  if (!value) return '';

  // Check if value starts with a dangerous character
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousChars.some(char => value.startsWith(char))) {
    // Prefix with single quote to prevent formula injection
    return `'${value}`;
  }

  return value;
}

interface ShopOrderTableProps {
  projectId: string;
  onAddSection?: () => void;
}

interface EditingCell {
  itemId: string;
  field: 'description' | 'revision' | 'spare' | 'venue' | 'section';
  revisionNumber?: number;
}

/**
 * ShopOrderTable - Spreadsheet-like table interface for shop orders
 *
 * Features:
 * - Inline cell editing (like Excel)
 * - Revision columns (Rev 0, Rev 1, etc.)
 * - Section dropdown with carry-down behavior
 * - Spare and Venue columns
 * - Add/delete revision columns
 * - Row reordering via drag-and-drop
 */
export function ShopOrderTable({ projectId, onAddSection }: ShopOrderTableProps) {
  const { currentProject, sections, items, updateItem, createItem, deleteItem, updateProject, createRevision, loadProject } = usePrepStore();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const [draggedItem, setDraggedItem] = useState<PrepEquipmentItem | null>(null);
  const [notesModalItem, setNotesModalItem] = useState<PrepEquipmentItem | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ itemId: string; field: string } | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSavesRef = useRef<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      // Only call select() on input elements (not select dropdowns)
      if ('select' in editInputRef.current) {
        editInputRef.current.select();
      }
    }
  }, [editingCell]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      if (editingCell) return;
      if (notesModalItem) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + V: Paste
      if (cmdOrCtrl && e.key === 'v') {
        e.preventDefault();
        // Find first section or selected cell's section
        if (sections.length > 0) {
          const sectionId = selectedCell
            ? items.find(item => item.id === selectedCell.itemId)?.section_id || sections[0].id
            : sections[0].id;
          handlePasteItems(sectionId);
        }
        return;
      }

      // Ctrl/Cmd + C: Copy (for future implementation - copy selected rows)
      if (cmdOrCtrl && e.key === 'c') {
        e.preventDefault();
        // TODO: Implement copy selected cell/row to clipboard
        console.log('[Keyboard] Copy not yet implemented');
        return;
      }

      // Delete/Backspace: Clear selected cell
      if (selectedCell && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        const item = items.find(i => i.id === selectedCell.itemId);
        if (item) {
          if (selectedCell.field === 'description') {
            updateItem(item.id, { description: '' });
          } else if (selectedCell.field === 'spare') {
            updateItem(item.id, { spare_qty: 0 });
          } else if (selectedCell.field === 'venue') {
            updateItem(item.id, { venue_qty: 0 });
          } else if (selectedCell.field.startsWith('revision-')) {
            const revNum = parseInt(selectedCell.field.split('-')[1], 10);
            const updatedItem = setRevisionQuantity(item, revNum, 0);
            updateItem(item.id, { revision_quantities: updatedItem.revision_quantities });
          }
        }
        return;
      }

      // Enter: Start editing selected cell
      if (selectedCell && e.key === 'Enter') {
        e.preventDefault();
        const item = items.find(i => i.id === selectedCell.itemId);
        if (item) {
          if (selectedCell.field === 'description') {
            startEdit(item.id, 'description');
          } else if (selectedCell.field === 'spare') {
            startEdit(item.id, 'spare');
          } else if (selectedCell.field === 'venue') {
            startEdit(item.id, 'venue');
          } else if (selectedCell.field.startsWith('revision-')) {
            const revNum = parseInt(selectedCell.field.split('-')[1], 10);
            startEdit(item.id, 'revision', revNum);
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, selectedCell, notesModalItem, sections, items]);

  if (!currentProject) {
    return <div className="text-gray-500 p-4">No project loaded</div>;
  }

  const currentRevision = currentProject.current_revision;
  const revisionNumbers = Array.from({ length: currentRevision + 1 }, (_, i) => i);

  // Group items by section
  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  const startEdit = (itemId: string, field: EditingCell['field'], revisionNumber?: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    let value = '';
    if (field === 'description') {
      value = item.description;
    } else if (field === 'revision' && revisionNumber !== undefined) {
      const quantities = parseRevisionQuantities(item.revision_quantities);
      value = String(quantities[revisionNumber] || 0);
    } else if (field === 'spare') {
      value = String(item.spare_qty || 0);
    } else if (field === 'venue') {
      value = String(item.venue_qty || 0);
    } else if (field === 'section') {
      value = item.section_id;
    }

    setEditValue(value);
    setEditingCell({ itemId, field, revisionNumber });
  };

  // Helper to check if a cell is selected
  const isCellSelected = (itemId: string, field: string): boolean => {
    return selectedCell?.itemId === itemId && selectedCell?.field === field;
  };

  // Select a cell
  const selectCell = (itemId: string, field: string) => {
    setSelectedCell({ itemId, field });
  };

  // Show error message with auto-dismiss
  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), ERROR_TOAST_DURATION_MS);
  };

  /**
   * Debounced save function - reduces database writes when users are typing quickly
   */
  const debouncedSave = (itemId: string, updates: Partial<PrepEquipmentItem>) => {
    // Store the pending update
    const existingUpdates = pendingSavesRef.current.get(itemId) || {};
    pendingSavesRef.current.set(itemId, { ...existingUpdates, ...updates });

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      // Process all pending saves
      const savesMap = new Map(pendingSavesRef.current);
      pendingSavesRef.current.clear();

      for (const [id, updateData] of savesMap.entries()) {
        try {
          await updateItem(id, updateData);
        } catch (error) {
          console.error('[Debounced Save] Error:', error);
          showError('Failed to save changes. Please try again.');
        }
      }
    }, DEBOUNCE_DELAY_MS);
  };

  // Flush pending saves on unmount
  // NOTE: React cleanup functions cannot be async, so we fire saves and hope they complete.
  // The beforeunload handler below provides additional safety for window close events.
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Fire all pending saves immediately (best effort)
      if (pendingSavesRef.current.size > 0) {
        const savesMap = new Map(pendingSavesRef.current);
        pendingSavesRef.current.clear();

        // Fire saves without awaiting (React cleanup can't be async)
        for (const [id, updates] of savesMap.entries()) {
          updateItem(id, updates).catch((error) => {
            console.error('[Unmount Save] Error saving item:', id, error);
          });
        }
      }
    };
  }, [updateItem]);

  // Add beforeunload handler to flush pending saves before window closes
  // Only shows warning if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasPendingSaves = pendingSavesRef.current.size > 0 || saveTimeoutRef.current !== null;

      if (hasPendingSaves) {
        // Clear debounce timeout to save immediately
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        // Fire all pending saves (best effort)
        if (pendingSavesRef.current.size > 0) {
          const savesMap = new Map(pendingSavesRef.current);
          pendingSavesRef.current.clear();

          for (const [id, updates] of savesMap.entries()) {
            updateItem(id, updates).catch((error) => {
              console.error('[BeforeUnload Save] Error saving item:', id, error);
            });
          }
        }

        // Show warning dialog to give saves time to complete
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [updateItem]);

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    const item = items.find((i) => i.id === editingCell.itemId);
    if (!item) return;

    try {
      if (editingCell.field === 'description') {
        debouncedSave(item.id, { description: editValue });
      } else if (editingCell.field === 'revision' && editingCell.revisionNumber !== undefined) {
        const quantity = parseInt(editValue, 10) || 0;
        const updatedItem = setRevisionQuantity(item, editingCell.revisionNumber, quantity);
        debouncedSave(item.id, { revision_quantities: updatedItem.revision_quantities });
      } else if (editingCell.field === 'spare') {
        const quantity = parseInt(editValue, 10) || 0;
        debouncedSave(item.id, { spare_qty: quantity });
      } else if (editingCell.field === 'venue') {
        const quantity = parseInt(editValue, 10) || 0;
        debouncedSave(item.id, { venue_qty: quantity });
      } else if (editingCell.field === 'section') {
        debouncedSave(item.id, { section_id: editValue });
      }
    } catch (error) {
      console.error('Error saving edit:', error);
    }

    cancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleAddRow = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const maxSortOrder = items
      .filter((i) => i.section_id === sectionId)
      .reduce((max, item) => Math.max(max, item.sort_order), 0);

    // Create new item with default values
    await createItem({
      section_id: sectionId,
      description: 'New Item',
      active_qty: 0,
      spare_qty: 0,
      venue_qty: 0,
      sort_order: maxSortOrder + 1,
      revision_quantities: JSON.stringify({ [currentRevision]: 0 }),
    });
  };

  const handleDeleteRow = async (itemId: string) => {
    if (window.confirm('Delete this item?')) {
      await deleteItem(itemId);
    }
  };

  const handleAddRevision = async () => {
    if (!currentProject || currentRevision >= MAX_REVISIONS) {
      console.log('Cannot add revision:', { currentProject: !!currentProject, currentRevision });
      return;
    }

    const newRevisionNumber = currentRevision + 1;
    console.log(`[Add Revision] Starting: current=${currentRevision}, new=${newRevisionNumber}`);

    setIsLoading(true);
    try {
      // Create the revision record
      console.log('[Add Revision] Step 1: Creating revision record');
      await createRevision({
        prep_project_id: projectId,
        revision_number: newRevisionNumber,
        notes: '',
      });
      console.log('[Add Revision] Step 1: Complete');

      // Initialize revision_quantities for all items with the new revision
      // Copy quantity from previous revision (batched for performance)
      console.log(`[Add Revision] Step 2: Updating ${items.length} items in parallel`);
      await Promise.all(
        items.map(async (item) => {
          const quantities = parseRevisionQuantities(item.revision_quantities);
          const previousQty = quantities[currentRevision] || 0;
          quantities[newRevisionNumber] = previousQty;
          return updateItem(item.id, {
            revision_quantities: JSON.stringify(quantities),
          });
        })
      );
      console.log('[Add Revision] Step 2: Complete');

      // Update project's current revision LAST
      console.log('[Add Revision] Step 3: Updating project current_revision');
      await updateProject(projectId, {
        current_revision: newRevisionNumber,
      });
      console.log('[Add Revision] Step 3: Complete');

      // Reload the project to get fresh data and trigger re-render
      console.log('[Add Revision] Step 4: Reloading project');
      await loadProject(projectId);
      console.log('[Add Revision] Step 4: Complete - Done!');
    } catch (error) {
      console.error('[Add Revision] Error:', error);
      showError('Failed to add revision. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRevision = async (revisionNumber: number) => {
    if (!currentProject || revisionNumber === 0 || revisionNumber !== currentRevision) {
      console.log('Cannot remove revision:', { revisionNumber, currentRevision });
      showError('Can only remove the latest revision.');
      return;
    }

    if (!window.confirm(`Remove Revision ${revisionNumber}? This will delete the revision and its data.`)) {
      return;
    }

    console.log(`[Remove Revision] Starting: removing rev ${revisionNumber}`);

    try {
      // Remove revision quantities for all items
      console.log('[Remove Revision] Step 1: Removing quantities from items');
      for (const item of items) {
        const quantities = parseRevisionQuantities(item.revision_quantities);
        delete quantities[revisionNumber];
        await updateItem(item.id, {
          revision_quantities: JSON.stringify(quantities),
        });
      }
      console.log('[Remove Revision] Step 1: Complete');

      // Update project's current revision
      console.log('[Remove Revision] Step 2: Updating project current_revision');
      await updateProject(projectId, {
        current_revision: revisionNumber - 1,
      });
      console.log('[Remove Revision] Step 2: Complete');

      // Reload the project
      console.log('[Remove Revision] Step 3: Reloading project');
      await loadProject(projectId);
      console.log('[Remove Revision] Complete!');
    } catch (error) {
      console.error('[Remove Revision] Error:', error);
    }
  };

  const handleMergeDuplicates = async (sectionId: string) => {
    const sectionItems = items.filter((item) => item.section_id === sectionId);

    // Group items by description
    const grouped = new Map<string, PrepEquipmentItem[]>();
    sectionItems.forEach((item) => {
      const desc = item.description.trim().toLowerCase();
      if (!grouped.has(desc)) {
        grouped.set(desc, []);
      }
      grouped.get(desc)!.push(item);
    });

    // Find duplicates
    const duplicates = Array.from(grouped.entries()).filter(([_, items]) => items.length > 1);

    if (duplicates.length === 0) {
      alert('No duplicate items found in this section.');
      return;
    }

    const message = `Found ${duplicates.length} duplicate item(s):\n${duplicates.map(([desc, items]) => `- "${items[0].description}" (${items.length} entries)`).join('\n')}\n\nMerge all duplicates?`;

    if (!window.confirm(message)) {
      return;
    }

    console.log('[Merge Duplicates] Starting...');

    try {
      for (const [_, duplicateItems] of duplicates) {
        // Keep the first item, merge others into it
        const [keepItem, ...deleteItems] = duplicateItems;

        // Merge revision quantities
        const mergedQuantities = parseRevisionQuantities(keepItem.revision_quantities);
        let mergedSpare = keepItem.spare_qty || 0;
        let mergedVenue = keepItem.venue_qty || 0;

        for (const item of deleteItems) {
          const quantities = parseRevisionQuantities(item.revision_quantities);
          // Add quantities for each revision
          Object.keys(quantities).forEach((revStr) => {
            const rev = parseInt(revStr, 10);
            mergedQuantities[rev] = (mergedQuantities[rev] || 0) + (quantities[rev] || 0);
          });
          mergedSpare += item.spare_qty || 0;
          mergedVenue += item.venue_qty || 0;
        }

        // Update the kept item with merged quantities
        await updateItem(keepItem.id, {
          revision_quantities: JSON.stringify(mergedQuantities),
          spare_qty: mergedSpare,
          venue_qty: mergedVenue,
        });

        // Delete the duplicate items
        for (const item of deleteItems) {
          await deleteItem(item.id);
        }
      }

      console.log('[Merge Duplicates] Complete!');
      await loadProject(projectId);
    } catch (error) {
      console.error('[Merge Duplicates] Error:', error);
      showError('Failed to merge duplicates. Please try again.');
    }
  };

  /**
   * Parse TSV/CSV clipboard data into items
   * Supports multiple formats:
   * - Description, Active, Spare, Venue, Notes
   * - Description, Quantity (maps to Active)
   * - Description only
   *
   * Input validation:
   * - Maximum 1000 rows to prevent memory issues
   * - Descriptions truncated to 500 characters
   * - Quantities capped at 99999
   */
  const parsePasteData = (text: string): Array<Partial<PrepEquipmentItem>> => {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];

    // Validate input size to prevent DoS
    if (lines.length > MAX_PASTE_ROWS) {
      showError(`Too many rows. Maximum ${MAX_PASTE_ROWS} items allowed per paste.`);
      return [];
    }

    // Detect delimiter (tab or comma)
    const delimiter = lines[0].includes('\t') ? '\t' : ',';

    const rows = lines.map(line => {
      // Split by delimiter, handling quoted values
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      return values;
    });

    // Check if first row is a header (contains common column names)
    const firstRow = rows[0].map(v => v.toLowerCase());
    const hasHeader = firstRow.some(v =>
      ['description', 'name', 'item', 'active', 'qty', 'quantity', 'spare', 'venue', 'notes'].includes(v)
    );

    const dataRows = hasHeader ? rows.slice(1) : rows;
    const headerRow = hasHeader ? firstRow : null;

    // Map columns based on header or position
    return dataRows.map(row => {
      let description = '';
      let active_qty = 0;
      let spare_qty = 0;
      let venue_qty = 0;
      let notes = '';

      if (headerRow) {
        // Map by header names
        headerRow.forEach((header, index) => {
          const value = row[index] || '';
          if (['description', 'name', 'item'].includes(header)) {
            description = value;
          } else if (['active', 'qty', 'quantity'].includes(header)) {
            const parsed = parseInt(value, 10) || 0;
            active_qty = Math.min(parsed, MAX_QUANTITY_VALUE);
          } else if (header === 'spare') {
            const parsed = parseInt(value, 10) || 0;
            spare_qty = Math.min(parsed, MAX_QUANTITY_VALUE);
          } else if (header === 'venue') {
            const parsed = parseInt(value, 10) || 0;
            venue_qty = Math.min(parsed, MAX_QUANTITY_VALUE);
          } else if (header === 'notes') {
            notes = value;
          }
        });
      } else {
        // Map by position: Description, Active, Spare, Venue, Notes
        description = row[0] || '';
        const parsedActive = row[1] ? parseInt(row[1], 10) || 0 : 0;
        const parsedSpare = row[2] ? parseInt(row[2], 10) || 0 : 0;
        const parsedVenue = row[3] ? parseInt(row[3], 10) || 0 : 0;
        active_qty = Math.min(parsedActive, MAX_QUANTITY_VALUE);
        spare_qty = Math.min(parsedSpare, MAX_QUANTITY_VALUE);
        venue_qty = Math.min(parsedVenue, MAX_QUANTITY_VALUE);
        notes = row[4] || '';
      }

      // Skip empty rows
      if (!description.trim()) {
        return null;
      }

      // Truncate description to max length
      const trimmedDescription = description.trim();
      const validDescription = trimmedDescription.length > MAX_DESCRIPTION_LENGTH
        ? trimmedDescription.substring(0, MAX_DESCRIPTION_LENGTH)
        : trimmedDescription;

      return {
        description: validDescription,
        active_qty,
        spare_qty,
        venue_qty,
        notes: notes.trim(),
      };
    }).filter((item): item is Partial<PrepEquipmentItem> => item !== null);
  };

  const handlePasteItems = async (sectionId: string) => {
    try {
      // Read clipboard
      const text = await navigator.clipboard.readText();

      if (!text.trim()) {
        showError('Clipboard is empty.');
        return;
      }

      // Parse the data
      const parsedItems = parsePasteData(text);

      if (parsedItems.length === 0) {
        showError('No valid items found in clipboard data.');
        return;
      }

      // Confirm with user
      const message = `Found ${parsedItems.length} item(s) in clipboard:\n${parsedItems.slice(0, 5).map(item => `- ${item.description}`).join('\n')}${parsedItems.length > 5 ? `\n... and ${parsedItems.length - 5} more` : ''}\n\nAdd these items to "${sections.find(s => s.id === sectionId)?.name}"?`;

      if (!window.confirm(message)) {
        return;
      }

      console.log('[Paste Items] Starting...');

      // Get max sort_order for this section
      const sectionItems = items.filter((i) => i.section_id === sectionId);
      let maxSortOrder = sectionItems.reduce((max, item) => Math.max(max, item.sort_order), 0);

      // Create items
      for (const itemData of parsedItems) {
        maxSortOrder++;
        await createItem({
          section_id: sectionId,
          description: itemData.description || 'New Item',
          active_qty: itemData.active_qty || 0,
          spare_qty: itemData.spare_qty || 0,
          venue_qty: itemData.venue_qty || 0,
          notes: itemData.notes || '',
          sort_order: maxSortOrder,
          revision_quantities: JSON.stringify({ [currentRevision]: itemData.active_qty || 0 }),
        });
      }

      console.log('[Paste Items] Complete!');
      await loadProject(projectId);
    } catch (error) {
      console.error('[Paste Items] Error:', error);
      showError('Failed to paste items. Make sure you have copied valid spreadsheet data.');
    }
  };

  /**
   * Export shop order table to CSV format
   */
  const handleExportToCSV = () => {
    if (!currentProject) return;

    console.log('[Export CSV] Starting...');

    try {
      const csvRows: string[] = [];

      // Add header row
      const headers = ['Section', 'Description', 'Active', 'Spare', 'Total'];

      // Add revision columns (skip Rev 0)
      for (let i = 1; i <= currentRevision; i++) {
        headers.push(`Rev ${i}`);
      }

      headers.push('Venue', 'Notes');
      csvRows.push(headers.join(','));

      // Add data rows for each section
      sortedSections.forEach((section) => {
        const sectionItems = items
          .filter((item) => item.section_id === section.id)
          .sort((a, b) => a.sort_order - b.sort_order);

        // Add section header row
        csvRows.push(`"${section.name}"`);

        // Add item rows
        sectionItems.forEach((item) => {
          const quantities = parseRevisionQuantities(item.revision_quantities);
          const activeQty = quantities[currentRevision] || 0;
          const totalQty = activeQty + (item.spare_qty || 0);

          // Sanitize and escape description and notes for CSV safety
          const sanitizedDescription = sanitizeCSVValue(item.description).replace(/"/g, '""');
          const sanitizedNotes = sanitizeCSVValue(item.notes || '').replace(/"/g, '""');

          const row: string[] = [
            '', // Empty section column for items
            `"${sanitizedDescription}"`, // Sanitized and escaped description
            String(activeQty),
            String(item.spare_qty || 0),
            String(totalQty),
          ];

          // Add revision columns
          for (let i = 1; i <= currentRevision; i++) {
            row.push(String(quantities[i] || 0));
          }

          row.push(String(item.venue_qty || 0));
          row.push(`"${sanitizedNotes}"`); // Sanitized and escaped notes

          csvRows.push(row.join(','));
        });

        // Add empty row after section
        csvRows.push('');
      });

      // Create CSV content
      const csvContent = csvRows.join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      // Sanitize filename - remove invalid filesystem chars, prevent path traversal, limit length
      const sanitizedFilename = currentProject.production_name
        .replace(/[<>:"/\\|?*]/g, '_') // Remove invalid filesystem characters
        .replace(/\.\./g, '_')          // Prevent path traversal
        .replace(/^\.+/, '_')           // Remove leading dots
        .substring(0, 200);             // Limit to 200 chars (+ 16 for "_shop_order.csv" = 216 total)
      link.setAttribute('download', `${sanitizedFilename}_shop_order.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('[Export CSV] Complete!');
    } catch (error) {
      console.error('[Export CSV] Error:', error);
      showError('Failed to export to CSV. Please try again.');
    }
  };

  // Drag and drop handlers for row reordering
  const handleRowDragStart = (e: React.DragEvent, item: PrepEquipmentItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRowDrop = async (e: React.DragEvent, targetItem: PrepEquipmentItem) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      return;
    }

    // Only allow reordering within the same section
    if (draggedItem.section_id !== targetItem.section_id) {
      setDraggedItem(null);
      return;
    }

    const sectionItems = items
      .filter((i) => i.section_id === draggedItem.section_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const sourceIndex = sectionItems.findIndex((i) => i.id === draggedItem.id);
    const targetIndex = sectionItems.findIndex((i) => i.id === targetItem.id);

    if (sourceIndex === targetIndex) {
      setDraggedItem(null);
      return;
    }

    // Reorder items
    const reordered = [...sectionItems];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update sort_order for all affected items
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].sort_order !== i) {
        await updateItem(reordered[i].id, { sort_order: i });
      }
    }

    setDraggedItem(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Shop Order</h2>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600"
            onClick={handleExportToCSV}
            title="Export shop order to CSV spreadsheet"
          >
            Export CSV
          </button>
          {onAddSection && (
            <button
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={onAddSection}
              title="Add new section"
            >
              + Add Section
            </button>
          )}
          <button
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleAddRevision}
            disabled={currentRevision >= MAX_REVISIONS || isLoading}
            title={currentRevision >= MAX_REVISIONS ? `Maximum ${MAX_REVISIONS + 1} revisions reached` : 'Add new revision column'}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Adding...</span>
              </>
            ) : (
              <>+ Add Revision {currentRevision >= MAX_REVISIONS && '(Max)'}</>
            )}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[300px]">
                Description
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">
                Active
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">
                Spare
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">
                Total
              </th>
              {revisionNumbers.slice(1).map((revNum) => (
                <th
                  key={revNum}
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-24 relative group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Rev {revNum}</span>
                    <button
                      onClick={() => handleRemoveRevision(revNum)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs"
                      title={`Remove Rev ${revNum}`}
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">
                Venue
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-16">
                Notes
              </th>
              <th className="px-3 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {sortedSections.map((section) => {
              const sectionItems = items
                .filter((item) => item.section_id === section.id)
                .sort((a, b) => a.sort_order - b.sort_order);

              return (
                <React.Fragment key={section.id}>
                  {/* Section Header Row */}
                  <tr className="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-400 dark:border-gray-600">
                    <td
                      colSpan={100}
                      className="px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {section.name.toUpperCase()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePasteItems(section.id)}
                            className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            title="Paste items from clipboard (TSV/CSV)"
                          >
                            Paste Items
                          </button>
                          <button
                            onClick={() => handleMergeDuplicates(section.id)}
                            className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                            title="Merge duplicate items in this section"
                          >
                            Merge Duplicates
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Items */}
                  {sectionItems.map((item) => {
                    const quantities = parseRevisionQuantities(item.revision_quantities);
                    const isDeleted = item.deleted_in_revision !== undefined;

                    return (
                      <tr
                        key={item.id}
                        draggable={!isDeleted}
                        onDragStart={(e) => handleRowDragStart(e, item)}
                        onDragOver={handleRowDragOver}
                        onDrop={(e) => handleRowDrop(e, item)}
                        className={`
                          border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800
                          ${isDeleted ? 'opacity-50 line-through' : 'cursor-move'}
                          ${draggedItem?.id === item.id ? 'opacity-50' : ''}
                        `}
                      >
                        {/* Description */}
                        <td className="px-3 py-2">
                          {editingCell?.itemId === item.id && editingCell.field === 'description' ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div
                              className={`text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded ${
                                isCellSelected(item.id, 'description')
                                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : ''
                              }`}
                              onClick={(e) => {
                                if (e.detail === 1) {
                                  selectCell(item.id, 'description');
                                } else if (e.detail === 2) {
                                  startEdit(item.id, 'description');
                                }
                              }}
                            >
                              {item.description || '(empty)'}
                            </div>
                          )}
                        </td>

                        {/* Active (current revision) - Editable */}
                        <td className="px-3 py-2 text-center">
                          {editingCell?.itemId === item.id && editingCell.field === 'revision' && editingCell.revisionNumber === currentRevision ? (
                            <input
                              ref={editInputRef}
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div
                              className="text-sm font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                              onClick={() => startEdit(item.id, 'revision', currentRevision)}
                            >
                              {quantities[currentRevision] || 0}
                            </div>
                          )}
                        </td>

                        {/* Spare */}
                        <td className="px-3 py-2 text-center">
                          {editingCell?.itemId === item.id && editingCell.field === 'spare' ? (
                            <input
                              ref={editInputRef}
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div
                              className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                              onClick={() => startEdit(item.id, 'spare')}
                            >
                              {item.spare_qty || 0}
                            </div>
                          )}
                        </td>

                        {/* Total (Active + Spare) - Not editable */}
                        <td className="px-3 py-2 text-center">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {(quantities[currentRevision] || 0) + (item.spare_qty || 0)}
                          </div>
                        </td>

                        {/* Revision Columns (skip Rev 0) */}
                        {revisionNumbers.slice(1).map((revNum) => (
                          <td key={revNum} className="px-3 py-2 text-center">
                            {editingCell?.itemId === item.id &&
                            editingCell.field === 'revision' &&
                            editingCell.revisionNumber === revNum ? (
                              <input
                                ref={editInputRef}
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={handleKeyDown}
                                className="w-full px-2 py-1 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                            ) : (
                              <div
                                className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                                onClick={() => startEdit(item.id, 'revision', revNum)}
                              >
                                {quantities[revNum] || 0}
                              </div>
                            )}
                          </td>
                        ))}

                        {/* Venue */}
                        <td className="px-3 py-2 text-center">
                          {editingCell?.itemId === item.id && editingCell.field === 'venue' ? (
                            <input
                              ref={editInputRef}
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full px-2 py-1 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div
                              className="text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                              onClick={() => startEdit(item.id, 'venue')}
                            >
                              {item.venue_qty || 0}
                            </div>
                          )}
                        </td>

                        {/* Notes */}
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => setNotesModalItem(item)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                            title={item.notes ? 'Edit notes' : 'Add notes'}
                          >
                            {item.notes ? '📝' : '📄'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleDeleteRow(item.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                            title="Delete item"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Add Row Button */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td colSpan={100} className="px-3 py-2">
                      <button
                        onClick={() => handleAddRow(section.id)}
                        className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        + Add Item
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {sections.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sections yet. Add a section to start building your shop order.
          </div>
        )}
      </div>

      {/* Item Notes Modal */}
      {notesModalItem && (
        <ItemNotesModal
          item={notesModalItem}
          onClose={() => setNotesModalItem(null)}
          onSave={async (notes) => {
            await updateItem(notesModalItem.id, { notes });
            setNotesModalItem(null);
          }}
        />
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="flex-1">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ItemNotesModal - Modal for editing item notes
 */
interface ItemNotesModalProps {
  item: PrepEquipmentItem;
  onClose: () => void;
  onSave: (notes: string) => void;
}

function ItemNotesModal({ item, onClose, onSave }: ItemNotesModalProps) {
  const [notes, setNotes] = useState(item.notes || '');

  const handleSave = () => {
    onSave(notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Item Notes: {item.description}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this item..."
            className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
