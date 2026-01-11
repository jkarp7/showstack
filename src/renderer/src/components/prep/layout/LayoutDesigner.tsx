import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ElementPalette } from './ElementPalette';
import { LayoutCanvas } from './LayoutCanvas';
import { ElementInspector } from './ElementInspector';
import { CommandPalette, type Command } from './CommandPalette';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { usePlatform } from '../../../hooks/usePlatform';
import type {
  PageLayoutTemplate,
  LayoutElement,
  PrintSectionType,
  DataFieldConfig,
  TextConfig,
  ImageConfig,
  TableConfig,
  ShapeConfig,
  PrepProject
} from '../../../types/prep';

interface LayoutDesignerProps {
  projectId: string; // Used for identifying which project is being previewed
  currentProject?: PrepProject; // Optional: actual project data for live preview
  pageType: PrintSectionType;
  onSave?: (template: PageLayoutTemplate) => void;
  onClose: () => void;
  initialTemplate?: PageLayoutTemplate;
  // Admin panel mode - custom buttons for editing default templates
  adminMode?: boolean;
  onRestore?: () => void;
  onUpdate?: (template: PageLayoutTemplate) => void;
}

export function LayoutDesigner({
  projectId,
  currentProject,
  pageType,
  onSave,
  onClose,
  initialTemplate,
  adminMode = false,
  onRestore,
  onUpdate
}: LayoutDesignerProps) {
  // Initialize template with blank template (will be replaced if default exists)
  const [template, setTemplate] = useState<PageLayoutTemplate>(() => {
    if (initialTemplate) {
      return initialTemplate;
    }

    // Create blank template with temp ID
    const now = Date.now();
    return {
      id: `temp-${uuidv4()}`,
      name: `${pageType} Layout`,
      page_type: pageType,
      grid_columns: 12,
      grid_rows: 20,
      grid_gap: 8,
      page_width: 816, // 8.5" at 96 DPI
      page_height: 1056, // 11" at 96 DPI
      elements: [],
      is_default: false,
      created_at: now,
      updated_at: now
    };
  });

  // Platform detection for keyboard shortcuts
  const { modifierKey, isMac } = usePlatform();

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggedPaletteElement, setDraggedPaletteElement] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<PageLayoutTemplate[]>([]);
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [history, setHistory] = useState<PageLayoutTemplate[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load default layout and available layouts on mount
  useEffect(() => {
    async function loadTemplatesAndDefault() {
      try {
        // Load all available layouts for this page type
        const templates = await window.api.prep.layoutTemplates.getByProjectId(projectId, pageType);
        setAvailableTemplates(templates);

        // If no initial layout was provided, try to load the default layout
        if (!initialTemplate) {
          const defaultTemplate = await window.api.prep.layoutTemplates.getDefault(projectId, pageType);

          if (defaultTemplate) {
            // Load the default layout with its elements
            const elements = await window.api.prep.layoutTemplates.getElements(defaultTemplate.id);

            // Parse JSON fields
            const parsedElements = elements.map(el => ({
              ...el,
              config: JSON.parse(el.config),
              style: JSON.parse(el.style)
            }));

            setTemplate({
              ...defaultTemplate,
              elements: parsedElements
            });
          }
        }
      } catch (error) {
        console.error('Error loading layouts:', error);
      } finally {
        setIsLoadingDefault(false);
      }
    }
    loadTemplatesAndDefault();
  }, [projectId, pageType, initialTemplate]);

  // Get selected element
  const selectedElement = selectedElementId
    ? template.elements.find(el => el.id === selectedElementId) || null
    : null;

  // Handle drag start from palette
  const handlePaletteDragStart = useCallback((element: any) => {
    setDraggedPaletteElement(element);
  }, []);

  // Handle drag end from palette (cleanup)
  const handlePaletteDragEnd = useCallback(() => {
    // Don't clear immediately - let the drop handler do it
  }, []);

  // Handle drop on canvas
  const handleElementDrop = useCallback((gridColumn: number, gridRow: number) => {
    if (!draggedPaletteElement) {
      return;
    }

    const now = Date.now();
    const newElement: LayoutElement = {
      id: uuidv4(),
      element_type: draggedPaletteElement.type,
      config: createDefaultConfig(draggedPaletteElement),
      grid_column: gridColumn,
      grid_row: gridRow,
      column_span: getDefaultSpan(draggedPaletteElement.type).columnSpan,
      row_span: getDefaultSpan(draggedPaletteElement.type).rowSpan,
      layer: template.elements.length, // Place on top
      style: createDefaultStyle(draggedPaletteElement.type),
      created_at: now,
      updated_at: now
    };

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      updated_at: now
    }));

    setDraggedPaletteElement(null);
    setSelectedElementId(newElement.id);
    setHasChanges(true);
  }, [draggedPaletteElement, template.elements.length]);

  // Handle element move
  const handleElementMove = useCallback((elementId: string, gridColumn: number, gridRow: number) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId
          ? { ...el, grid_column: gridColumn, grid_row: gridRow, updated_at: Date.now() }
          : el
      ),
      updated_at: Date.now()
    }));
    setHasChanges(true);
  }, []);

  // Handle element resize
  const handleElementResize = useCallback((elementId: string, columnSpan: number, rowSpan: number) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId
          ? { ...el, column_span: columnSpan, row_span: rowSpan, updated_at: Date.now() }
          : el
      ),
      updated_at: Date.now()
    }));
    setHasChanges(true);
  }, []);

  // Handle element update from inspector
  const handleElementUpdate = useCallback((updates: Partial<LayoutElement>) => {
    if (!selectedElementId) return;

    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === selectedElementId
          ? { ...el, ...updates, updated_at: Date.now() }
          : el
      ),
      updated_at: Date.now()
    }));
    setHasChanges(true);
  }, [selectedElementId]);

  // Handle element delete
  const handleElementDelete = useCallback((elementId: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId),
      updated_at: Date.now()
    }));
    setSelectedElementId(null);
    setHasChanges(true);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      // Convert elements to database format (stringify JSON fields)
      const dbElements = template.elements.map(el => ({
        ...el,
        config: JSON.stringify(el.config),
        style: JSON.stringify(el.style)
      }));

      // Determine if this is a create or update operation
      const isNew = !template.id || template.id.startsWith('temp-');

      if (isNew) {
        // Create new template (app-level user preference)
        // Always mark as default for this page type so it loads automatically
        const result = await window.api.prep.layoutTemplates.create(
          {
            name: template.name,
            description: template.description,
            page_type: pageType,
            grid_columns: template.grid_columns,
            grid_rows: template.grid_rows,
            grid_gap: template.grid_gap,
            page_width: template.page_width,
            page_height: template.page_height,
            is_default: true
          },
          dbElements
        );

        // Update template with returned ID
        const savedElements = await window.api.prep.layoutTemplates.getElements(result.id);

        const parsedElements = savedElements.map(el => ({
          ...el,
          config: JSON.parse(el.config),
          style: JSON.parse(el.style)
        }));

        setTemplate({
          ...result,
          elements: parsedElements
        });
      } else {
        // Update existing template
        // Always mark as default for this page type so it loads automatically
        await window.api.prep.layoutTemplates.update(
          template.id,
          {
            name: template.name,
            description: template.description,
            grid_columns: template.grid_columns,
            grid_rows: template.grid_rows,
            grid_gap: template.grid_gap,
            page_width: template.page_width,
            page_height: template.page_height,
            is_default: true
          },
          dbElements
        );
      }

      setHasChanges(false);

      // Call optional callback
      if (onSave) {
        onSave(template);
      }
    } catch (error) {
      console.error('Error saving page layout:', error);
      alert('Failed to save page layout. Please try again.');
    }
  }, [template, projectId, pageType, onSave]);

  // Handle load template
  const handleLoadTemplate = useCallback(async (templateId: string) => {
    try {
      const loadedTemplate = await window.api.prep.layoutTemplates.getById(templateId);
      const loadedElements = await window.api.prep.layoutTemplates.getElements(templateId);

      // Parse JSON fields
      const parsedElements = loadedElements.map(el => ({
        ...el,
        config: JSON.parse(el.config),
        style: JSON.parse(el.style)
      }));

      // Mark this template as the default so it persists
      await window.api.prep.layoutTemplates.update(
        templateId,
        { is_default: true },
        undefined // Don't update elements, just metadata
      );

      setTemplate({
        ...loadedTemplate,
        is_default: true,
        elements: parsedElements
      });

      setSelectedElementId(null);
      setHasChanges(false);
      setShowLoadDialog(false);
    } catch (error) {
      console.error('Error loading layout:', error);
      alert('Failed to load layout. Please try again.');
    }
  }, []);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirm) return;
    }
    onClose();
  }, [hasChanges, onClose]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTemplate(history[newIndex]);
      setHasChanges(true);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTemplate(history[newIndex]);
      setHasChanges(true);
    }
  }, [history, historyIndex]);

  // Add to history when template changes
  useEffect(() => {
    // Don't add to history if we're just loading
    if (isLoadingDefault) return;

    // Trim history if we're not at the end and add new state
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(template);

    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }

    setHistory(newHistory);
  }, [template.elements, template.updated_at]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Command Palette: Cmd+K
      if (modifier && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      // Shortcuts Help: Cmd+/
      if (modifier && e.key === '/') {
        e.preventDefault();
        setShowShortcutsHelp(true);
        return;
      }

      // Save: Cmd+S
      if (modifier && e.key === 's') {
        e.preventDefault();
        if (hasChanges) {
          handleSave();
        }
        return;
      }

      // Preview Mode: Cmd+P
      if (modifier && e.key === 'p') {
        e.preventDefault();
        setPreviewMode(!previewMode);
        return;
      }

      // Undo: Cmd+Z
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Cmd+Shift+Z
      if (modifier && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate: Cmd+D
      if (modifier && e.key === 'd') {
        e.preventDefault();
        if (selectedElementId) {
          const element = template.elements.find(el => el.id === selectedElementId);
          if (element) {
            const newElement = {
              ...element,
              id: uuidv4(),
              grid_column: Math.min(element.grid_column + 1, template.grid_columns - element.column_span),
              grid_row: Math.min(element.grid_row + 1, template.grid_rows - element.row_span),
              layer: template.elements.length,
              created_at: Date.now(),
              updated_at: Date.now()
            };
            setTemplate(prev => ({
              ...prev,
              elements: [...prev.elements, newElement],
              updated_at: Date.now()
            }));
            setSelectedElementId(newElement.id);
            setHasChanges(true);
          }
        }
        return;
      }

      // Zoom In: Cmd++
      if (modifier && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setZoom(Math.min(200, zoom + 10));
        return;
      }

      // Zoom Out: Cmd+-
      if (modifier && e.key === '-') {
        e.preventDefault();
        setZoom(Math.max(50, zoom - 10));
        return;
      }

      // Reset Zoom: Cmd+0
      if (modifier && e.key === '0') {
        e.preventDefault();
        setZoom(100);
        return;
      }

      // Toggle Grid: Cmd+G
      if (modifier && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        setShowGrid(!showGrid);
        return;
      }

      // Toggle Snap Guides: Cmd+Shift+G
      if (modifier && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        setSnapEnabled(!snapEnabled);
        return;
      }

      // Text Formatting - only if an element is selected
      if (selectedElementId) {
        const element = template.elements.find(el => el.id === selectedElementId);
        if (!element) return;

        // Bold: Cmd+B
        if (modifier && e.key === 'b') {
          e.preventDefault();
          handleElementUpdate({
            style: {
              ...element.style,
              fontWeight: element.style.fontWeight === 'bold' ? 'normal' : 'bold'
            }
          });
          return;
        }

        // Italic: Cmd+I
        if (modifier && e.key === 'i') {
          e.preventDefault();
          handleElementUpdate({
            style: {
              ...element.style,
              fontStyle: element.style.fontStyle === 'italic' ? 'normal' : 'italic'
            }
          });
          return;
        }

        // Underline: Cmd+U
        if (modifier && e.key === 'u') {
          e.preventDefault();
          handleElementUpdate({
            style: {
              ...element.style,
              textDecoration: element.style.textDecoration === 'underline' ? 'none' : 'underline'
            }
          });
          return;
        }

        // Align Left: Cmd+Shift+L
        if (modifier && e.shiftKey && e.key === 'l') {
          e.preventDefault();
          handleElementUpdate({
            style: { ...element.style, textAlign: 'left' }
          });
          return;
        }

        // Align Center: Cmd+Shift+E
        if (modifier && e.shiftKey && e.key === 'e') {
          e.preventDefault();
          handleElementUpdate({
            style: { ...element.style, textAlign: 'center' }
          });
          return;
        }

        // Align Right: Cmd+Shift+R
        if (modifier && e.shiftKey && e.key === 'r') {
          e.preventDefault();
          handleElementUpdate({
            style: { ...element.style, textAlign: 'right' }
          });
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isMac,
    hasChanges,
    handleSave,
    previewMode,
    handleUndo,
    handleRedo,
    selectedElementId,
    template,
    zoom,
    showGrid,
    snapEnabled,
    handleElementUpdate
  ]);

  // Define commands for command palette
  const commands: Command[] = [
    // General commands
    {
      id: 'save',
      label: 'Save Template',
      description: 'Save the current layout template',
      category: 'General',
      shortcut: 'Mod+S',
      icon: '💾',
      action: () => hasChanges && handleSave()
    },
    {
      id: 'preview',
      label: previewMode ? 'Exit Preview Mode' : 'Enter Preview Mode',
      description: 'Toggle between edit and preview modes',
      category: 'General',
      shortcut: 'Mod+P',
      icon: '👁️',
      action: () => setPreviewMode(!previewMode)
    },
    {
      id: 'shortcuts',
      label: 'Show Keyboard Shortcuts',
      description: 'View all available keyboard shortcuts',
      category: 'General',
      shortcut: 'Mod+/',
      icon: '⌨️',
      action: () => setShowShortcutsHelp(true)
    },
    {
      id: 'close',
      label: 'Close Designer',
      description: 'Close the layout designer',
      category: 'General',
      icon: '✖️',
      action: handleClose
    },

    // Editing commands
    {
      id: 'undo',
      label: 'Undo',
      description: 'Undo the last change',
      category: 'Editing',
      shortcut: 'Mod+Z',
      icon: '↶',
      action: handleUndo
    },
    {
      id: 'redo',
      label: 'Redo',
      description: 'Redo the last undone change',
      category: 'Editing',
      shortcut: 'Mod+Shift+Z',
      icon: '↷',
      action: handleRedo
    },
    {
      id: 'duplicate',
      label: 'Duplicate Element',
      description: 'Duplicate the selected element',
      category: 'Editing',
      shortcut: 'Mod+D',
      icon: '📋',
      action: () => {
        if (selectedElementId) {
          const element = template.elements.find(el => el.id === selectedElementId);
          if (element) {
            const newElement = {
              ...element,
              id: uuidv4(),
              grid_column: Math.min(element.grid_column + 1, template.grid_columns - element.column_span),
              grid_row: Math.min(element.grid_row + 1, template.grid_rows - element.row_span),
              layer: template.elements.length,
              created_at: Date.now(),
              updated_at: Date.now()
            };
            setTemplate(prev => ({
              ...prev,
              elements: [...prev.elements, newElement],
              updated_at: Date.now()
            }));
            setSelectedElementId(newElement.id);
            setHasChanges(true);
          }
        }
      }
    },
    {
      id: 'delete',
      label: 'Delete Element',
      description: 'Delete the selected element',
      category: 'Editing',
      shortcut: 'Delete',
      icon: '🗑️',
      action: () => selectedElementId && handleElementDelete(selectedElementId)
    },

    // Canvas commands
    {
      id: 'zoom-in',
      label: 'Zoom In',
      description: 'Increase canvas zoom',
      category: 'Canvas',
      shortcut: 'Mod++',
      icon: '🔍',
      action: () => setZoom(Math.min(200, zoom + 10))
    },
    {
      id: 'zoom-out',
      label: 'Zoom Out',
      description: 'Decrease canvas zoom',
      category: 'Canvas',
      shortcut: 'Mod+-',
      icon: '🔍',
      action: () => setZoom(Math.max(50, zoom - 10))
    },
    {
      id: 'zoom-reset',
      label: 'Reset Zoom',
      description: 'Reset zoom to 100%',
      category: 'Canvas',
      shortcut: 'Mod+0',
      icon: '🔍',
      action: () => setZoom(100)
    },
    {
      id: 'toggle-grid',
      label: showGrid ? 'Hide Grid' : 'Show Grid',
      description: 'Toggle grid visibility',
      category: 'Canvas',
      shortcut: 'Mod+G',
      icon: '⊞',
      action: () => setShowGrid(!showGrid)
    },
    {
      id: 'toggle-snap',
      label: snapEnabled ? 'Disable Snap Guides' : 'Enable Snap Guides',
      description: 'Toggle snap-to-element guides',
      category: 'Canvas',
      shortcut: 'Mod+Shift+G',
      icon: '📍',
      action: () => setSnapEnabled(!snapEnabled)
    },

    // Zoom presets
    {
      id: 'zoom-50',
      label: 'Zoom to 50%',
      description: 'Set canvas zoom to 50%',
      category: 'Canvas',
      action: () => setZoom(50)
    },
    {
      id: 'zoom-75',
      label: 'Zoom to 75%',
      description: 'Set canvas zoom to 75%',
      category: 'Canvas',
      action: () => setZoom(75)
    },
    {
      id: 'zoom-100',
      label: 'Zoom to 100%',
      description: 'Set canvas zoom to 100%',
      category: 'Canvas',
      action: () => setZoom(100)
    },
    {
      id: 'zoom-150',
      label: 'Zoom to 150%',
      description: 'Set canvas zoom to 150%',
      category: 'Canvas',
      action: () => setZoom(150)
    },
    {
      id: 'zoom-200',
      label: 'Zoom to 200%',
      description: 'Set canvas zoom to 200%',
      category: 'Canvas',
      action: () => setZoom(200)
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Layout Designer</h2>
          <p className="text-sm text-gray-400 mt-1">
            Designing: <span className="text-gray-900 dark:text-white font-medium">{pageType}</span> page
            {hasChanges && <span className="text-yellow-500 ml-2">• Unsaved changes</span>}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {adminMode ? (
            // Admin mode buttons: Restore and Update
            <>
              {onRestore && (
                <button
                  onClick={onRestore}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-gray-900 dark:text-white rounded transition font-medium"
                >
                  Restore
                </button>
              )}
              {onUpdate && (
                <button
                  onClick={() => onUpdate(template)}
                  disabled={!hasChanges}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white rounded transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-gray-900 dark:text-white rounded transition font-medium"
              >
                Cancel
              </button>
            </>
          ) : (
            // Project mode buttons: Load, Save, Done
            <>
              {availableTemplates.length > 0 && (
                <button
                  onClick={() => setShowLoadDialog(true)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-900 dark:text-white rounded transition"
                >
                  Load Layout
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-gray-900 dark:text-white rounded transition font-medium"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar - Fixed position (hidden in preview mode) */}
        {!previewMode && (
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
          <div className="flex items-center gap-6">
              {/* Command Palette & Help */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-700">
                <button
                  onClick={() => setShowCommandPalette(true)}
                  className="p-2 rounded hover:bg-gray-700 text-gray-300 transition-colors"
                  title="Command Palette (Cmd+K)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowShortcutsHelp(true)}
                  className="p-2 rounded hover:bg-gray-700 text-gray-300 transition-colors"
                  title="Keyboard Shortcuts (Cmd+/)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>
              </div>

              {/* Undo/Redo */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-700">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-2 rounded hover:bg-gray-700 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Undo (Cmd+Z)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-2 rounded hover:bg-gray-700 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Redo (Cmd+Shift+Z)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="p-2 rounded hover:bg-gray-700 text-gray-300 transition-colors"
                  title="Zoom Out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <div className="flex items-center gap-1">
                  {[50, 75, 100, 150, 200].map((zoomLevel) => (
                    <button
                      key={zoomLevel}
                      onClick={() => setZoom(zoomLevel)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        zoom === zoomLevel
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                      }`}
                    >
                      {zoomLevel}%
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="p-2 rounded hover:bg-gray-700 text-gray-300 transition-colors"
                  title="Zoom In"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
              </div>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded transition-colors ${
                  showGrid
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                }`}
                title="Toggle Grid (Cmd+G)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>

              {/* Snap Guides Toggle */}
              <button
                onClick={() => setSnapEnabled(!snapEnabled)}
                className={`p-2 rounded transition-colors ${
                  snapEnabled
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                }`}
                title="Toggle Snap Guides (Cmd+Shift+G)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </button>

              {/* Preview Mode Toggle */}
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`p-2 rounded transition-colors ${
                  previewMode
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                }`}
                title="Preview Mode (Cmd+P)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>

              {/* Background Color Picker */}
              <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
                <label htmlFor="bg-color" className="text-xs text-gray-400">BG:</label>
                <input
                  id="bg-color"
                  type="color"
                  value={template.config?.backgroundColor || '#ffffff'}
                  onChange={(e) => {
                    setTemplate({
                      ...template,
                      config: {
                        ...template.config,
                        backgroundColor: e.target.value
                      }
                    });
                    setHasChanges(true);
                  }}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                  title="Background Color"
                />
                {template.config?.backgroundColor && template.config.backgroundColor !== '#ffffff' && (
                  <button
                    onClick={() => {
                      setTemplate({
                        ...template,
                        config: {
                          ...template.config,
                          backgroundColor: '#ffffff'
                        }
                      });
                      setHasChanges(true);
                    }}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                    title="Reset to White"
                  >
                    Reset
                  </button>
                )}
              </div>

            {/* Element Count */}
            <div className="pl-3 border-l border-gray-700 text-xs text-gray-400">
              {template.elements.length} {template.elements.length === 1 ? 'element' : 'elements'}
            </div>
          </div>
        </div>
        )}

        {/* Preview Mode Controls - Show when in preview */}
        {previewMode && (
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="font-semibold">Preview Mode</span>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="p-1.5 rounded hover:bg-gray-700 text-gray-300 transition-colors"
                    title="Zoom Out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                  </button>
                  {[50, 75, 100, 150, 200].map((zoomLevel) => (
                    <button
                      key={zoomLevel}
                      onClick={() => setZoom(zoomLevel)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        zoom === zoomLevel
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                      }`}
                    >
                      {zoomLevel}%
                    </button>
                  ))}
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    className="p-1.5 rounded hover:bg-gray-700 text-gray-300 transition-colors"
                    title="Zoom In"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
              >
                Exit Preview
              </button>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Canvas - Full width in preview, 2/3 in edit mode */}
          <div className={previewMode ? 'flex-1' : 'flex-[2]'}>
            <LayoutCanvas
              template={template}
              currentProject={currentProject}
              selectedElementId={previewMode ? null : selectedElementId}
              onElementSelect={previewMode ? () => {} : setSelectedElementId}
              onElementDrop={previewMode ? () => {} : handleElementDrop}
              onElementMove={previewMode ? () => {} : handleElementMove}
              onElementResize={previewMode ? () => {} : handleElementResize}
              onElementDelete={previewMode ? () => {} : handleElementDelete}
              zoom={zoom}
              showGrid={previewMode ? false : showGrid}
              snapEnabled={snapEnabled}
            />
          </div>

          {/* Inspector - Hidden in preview mode */}
          {!previewMode && (
            <div className="flex-1">
              <ElementInspector
                element={selectedElement}
                onUpdate={handleElementUpdate}
                onDelete={() => selectedElementId && handleElementDelete(selectedElementId)}
                maxColumns={template.grid_columns}
                maxRows={template.grid_rows}
              />
            </div>
          )}
        </div>

        {/* Floating Element Palette - Hidden in preview mode */}
        {!previewMode && (
          <FloatingElementPalette
            onDragStart={handlePaletteDragStart}
            onDragEnd={handlePaletteDragEnd}
          />
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {previewMode ? (
            <>
              <span className="font-medium text-green-400">Preview Mode</span> • Press <kbd className="px-2 py-0.5 bg-gray-700 border border-gray-600 rounded text-xs font-mono">{modifierKey}+P</kbd> to exit
            </>
          ) : (
            <>
              <span className="font-medium">Tip:</span> Press <kbd className="px-2 py-0.5 bg-gray-700 border border-gray-600 rounded text-xs font-mono">{modifierKey}+K</kbd> for commands or <kbd className="px-2 py-0.5 bg-gray-700 border border-gray-600 rounded text-xs font-mono">{modifierKey}+/</kbd> for shortcuts
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">
            Grid: {template.grid_columns}×{template.grid_rows} •
            Page: {template.page_width}×{template.page_height}px •
            Zoom: {zoom}%
            {snapEnabled && ' • Snap: ON'}
          </div>
          {!previewMode && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Rows:</span>
              <button
                onClick={() => {
                  if (template.grid_rows > 4) {
                    const rowHeight = template.page_height / template.grid_rows;
                    setTemplate({
                      ...template,
                      grid_rows: template.grid_rows - 1,
                      page_height: Math.round(rowHeight * (template.grid_rows - 1))
                    });
                  }
                }}
                className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center justify-center transition"
                title="Decrease rows"
              >
                −
              </button>
              <button
                onClick={() => {
                  const rowHeight = template.page_height / template.grid_rows;
                  setTemplate({
                    ...template,
                    grid_rows: template.grid_rows + 1,
                    page_height: Math.round(rowHeight * (template.grid_rows + 1))
                  });
                }}
                className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center justify-center transition"
                title="Increase rows"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Load Layout Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Load Layout</h3>
              <p className="text-sm text-gray-400 mt-1">
                Select a saved page layout to load
              </p>
            </div>

            {/* Layout List */}
            <div className="flex-1 overflow-y-auto p-6">
              {availableTemplates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No saved layouts found for this page type
                </div>
              ) : (
                <div className="space-y-3">
                  {availableTemplates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleLoadTemplate(tmpl.id)}
                      className="w-full p-4 bg-gray-700 hover:bg-gray-650 border border-gray-600 hover:border-blue-500 rounded text-left transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors">
                            {tmpl.name}
                          </div>
                          {tmpl.description && (
                            <div className="text-sm text-gray-400 mt-1">
                              {tmpl.description}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>
                              Grid: {tmpl.grid_columns}×{tmpl.grid_rows}
                            </span>
                            <span>
                              Page: {tmpl.page_width}×{tmpl.page_height}px
                            </span>
                            {tmpl.is_default === 1 && (
                              <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-900 dark:text-white rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions

function createDefaultConfig(paletteElement: any): any {
  switch (paletteElement.type) {
    case 'dataField':
      return {
        fieldType: paletteElement.subType,
        showLabel: true,
        label: paletteElement.label
      } as DataFieldConfig;

    case 'text':
      return {
        content: 'Enter your text here...',
        placeholder: 'Text content'
      } as TextConfig;

    case 'image':
      return {
        src: '',
        altText: 'Image',
        objectFit: 'contain'
      } as ImageConfig;

    case 'table':
      return {
        contactTypes: ['gm', 'pm', 'ld'],
        showHeaders: true,
        columns: [
          { field: 'name', label: 'Name', width: 150 },
          { field: 'company', label: 'Company', width: 150 },
          { field: 'email', label: 'Email', width: 200 },
          { field: 'phone', label: 'Phone', width: 120 }
        ]
      } as TableConfig;

    case 'shape':
      return {
        shapeType: paletteElement.subType || 'rectangle',
        thickness: 1,
        color: '#000000'
      } as ShapeConfig;

    default:
      return {};
  }
}

function getDefaultSpan(elementType: string): { columnSpan: number; rowSpan: number } {
  switch (elementType) {
    case 'dataField':
      return { columnSpan: 4, rowSpan: 1 };
    case 'text':
      return { columnSpan: 6, rowSpan: 2 };
    case 'image':
      return { columnSpan: 4, rowSpan: 4 };
    case 'table':
      return { columnSpan: 12, rowSpan: 6 };
    case 'shape':
      return { columnSpan: 12, rowSpan: 1 };
    default:
      return { columnSpan: 3, rowSpan: 2 };
  }
}

function createDefaultStyle(elementType: string): any {
  const baseStyle = {
    fontFamily: 'Arial',
    fontSize: 12,
    fontWeight: 'normal' as const,
    textAlign: 'left' as const,
    color: '#000000',
    backgroundColor: 'transparent',
    padding: 8,
    borderWidth: 0,
    borderStyle: 'none' as const,
    borderColor: '#000000',
    borderRadius: 0,
    opacity: 1
  };

  switch (elementType) {
    case 'dataField':
      return { ...baseStyle, fontSize: 14, fontWeight: 'bold' as const };
    case 'text':
      return baseStyle;
    case 'shape':
      return { ...baseStyle, backgroundColor: '#000000', padding: 0 };
    default:
      return baseStyle;
  }
}

// Floating Element Palette Component
function FloatingElementPalette({
  onDragStart,
  onDragEnd
}: {
  onDragStart: (element: any) => void;
  onDragEnd?: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
  const [position, setPosition] = useState(() => {
    // Anchor to right side of screen, aligned with toolbar
    // Palette width is ~320px, add 20px padding from edge
    return {
      x: window.innerWidth - 320 - 20,
      y: 100 // Align with toolbar area
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const paletteRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.palette-content')) {
      return; // Don't drag if clicking inside the palette content
    }

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={paletteRef}
      className="fixed z-50 shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header - Draggable */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-gray-800 border border-gray-700 rounded-t-lg px-4 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
          <span className="text-sm font-semibold text-gray-300">Elements</span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Palette Content */}
      {!isCollapsed && (
        <div className="palette-content">
          <ElementPalette
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        </div>
      )}
    </div>
  );
}
