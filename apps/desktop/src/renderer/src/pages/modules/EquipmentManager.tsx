import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logger } from '../../utils/logger';
import { VirtualDataGrid } from '../../components/fixture/VirtualDataGrid';
import { Toolbar } from '../../components/fixture/Toolbar';
import { FilterChipBar } from '../../components/fixture/FilterChipBar';
import { SortBar } from '../../components/fixture/SortBar';
import { AddFixtureDialog } from '../../components/fixture/AddFixtureDialog';
import { BulkEditDialog } from '../../components/fixture/BulkEditDialog';
import { UserColumnSettingsDialog } from '../../components/fixture/UserColumnSettingsDialog';

import { InfrastructureToolbar } from '../../components/infrastructure/InfrastructureToolbar';
import { AddInfrastructureDialog } from '../../components/infrastructure/AddInfrastructureDialog';
import { EditInfrastructureDialog } from '../../components/infrastructure/EditInfrastructureDialog';
import {
  ExportHeaderDialog,
  ExportHeaderOptions,
} from '../../components/fixture/ExportHeaderDialog';
import {
  UnsavedChangesDialog,
  useUnsavedChangesDialog,
} from '../../components/common/UnsavedChangesDialog';
import { PowerSummaryPanel } from '../../components/power/PowerSummaryPanel';
import { RackManager } from '../../components/power/RackManager';
import { useFixtureStore } from '../../store/fixtureStore';
import { useInfrastructureStore } from '../../store/infrastructureStore';
import { useFileStore } from '../../store/fileStore';
import { useUndoRedoStore } from '../../store/undoRedoStore';
import { Fixture } from '../../types';
import { DimmerRack, PDRack } from '../../types/power';
import {
  DEFAULT_COLUMN_VISIBILITY,
  ColumnVisibility,
  DEFAULT_COLUMN_ORDER,
  ColumnKey,
} from '../../types/columns';
import {
  DEFAULT_INFRASTRUCTURE_COLUMN_VISIBILITY,
  INFRASTRUCTURE_COLUMN_CONFIGS,
  InfrastructureColumnKey,
} from '../../types/infrastructureColumns';
import { InfrastructureColumnVisibility } from '../../components/infrastructure/InfrastructureColumnVisibilityMenu';
import { useEquipmentMenuHandlers } from '../../hooks/useEquipmentMenuHandlers';
import { stripFixtureForDuplicate } from '../../utils/fixtureUtils';
import { autoLinkCircuit } from '../../utils/circuitParser';
import {
  Project,
  buildExportHeader,
  formatHeaderForCSV,
  formatHeaderForEos,
  formatHeaderForGrandMA,
} from '../../utils/exportHeaders';
import { HighlightRule, DEFAULT_HIGHLIGHT_RULES } from '../../types/highlighting';
import { useGroupStore } from '../../store/groupStore';
import { getGroupMembers, computeFixtureGroupMap } from '../../utils/groupMembership';
import { InspectorPanel, InspectorContent } from '../../components/inspector/InspectorPanel';
import { GroupsInspector } from '../../components/inspector/GroupsInspector';
import { ConditionalFormattingInspector } from '../../components/inspector/ConditionalFormattingInspector';
import { useValidation } from '../../hooks/useValidation';

interface EquipmentManagerProps {
  initialTab?: 'fixtures' | 'infrastructure' | 'power';
}

export function EquipmentManager({ initialTab = 'fixtures' }: EquipmentManagerProps = {}) {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId?: string; moduleType?: string }>();
  const {
    fixtures,
    loadFixtures,
    addMultipleFixtures,
    deleteMultiple,
    updateFixture,
    bulkUpdate,
    setCurrentProjectId,
  } = useFixtureStore();
  const { equipment: infrastructureEquipment, loadEquipment: loadInfrastructure } =
    useInfrastructureStore();
  const { undo, redo, canUndo, canRedo } = useUndoRedoStore();

  // Tab state — initialized from the route via initialTab prop
  const [activeTab, setActiveTab] = useState<'fixtures' | 'infrastructure' | 'power'>(initialTab);

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedInfrastructure, setSelectedInfrastructure] = useState<Set<string>>(new Set());
  const [isAddFixtureDialogOpen, setIsAddFixtureDialogOpen] = useState(false);
  const [isAddInfrastructureDialogOpen, setIsAddInfrastructureDialogOpen] = useState(false);
  const [isEditInfrastructureDialogOpen, setIsEditInfrastructureDialogOpen] = useState(false);
  const [editingInfrastructureEquipment, setEditingInfrastructureEquipment] = useState<any | null>(
    null,
  );
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [isUserColumnSettingsOpen, setIsUserColumnSettingsOpen] = useState(false);

  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const duplicateErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for keyboard-accessible focus targets used by menu Sort/Filter actions
  const sortBarRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [isColumnVisibilityMenuOpen, setIsColumnVisibilityMenuOpen] = useState(false);

  // Power features state
  const [isRackManagerOpen, setIsRackManagerOpen] = useState(false);
  const [dimmerRacks, setDimmerRacks] = useState<DimmerRack[]>([]);
  const [pdRacks, setPDRacks] = useState<PDRack[]>([]);

  // Track if we've done initial auto-linking
  const hasAutoLinkedRef = useRef(false);

  // Get current project ID - use route param or fall back to default-project
  const currentProjectId = routeProjectId || 'default-project';

  // Unsaved changes dialog
  const unsavedChangesDialog = useUnsavedChangesDialog();

  // User column definitions
  const [userColumnDefinitions, setUserColumnDefinitions] = useState<Record<string, string>>({});

  // Highlight rules for conditional formatting
  const [highlightRules, setHighlightRules] = useState<HighlightRule[]>(DEFAULT_HIGHLIGHT_RULES);

  // Validation — for inline grid highlighting
  const { fixtureIssueMap } = useValidation();

  // Smart Groups — inspector panel
  const { groups, allPins, pinsByGroup, loadGroups, addPin, removePin } = useGroupStore();
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorContent, setInspectorContent] = useState<InspectorContent>('groups');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Pinned fixture IDs for the active group (used for membership evaluation)
  const [activePins, setActivePins] = useState<string[]>([]);

  // Project state
  const [project, setProject] = useState<Project>({ name: 'Untitled Project' });
  const [projectName, setProjectName] = useState<string>('Untitled Project');

  // Export dialog state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'eos' | 'grandma2' | 'grandma3'>('csv');

  // Sort state - now supports multi-column sort
  interface SortConfig {
    field: string;
    direction: 'asc' | 'desc';
  }
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showHidden, setShowHidden] = useState(false);

  // Column visibility state (fixtures)
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibility>(DEFAULT_COLUMN_VISIBILITY);

  // Column order state
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(DEFAULT_COLUMN_ORDER);

  // Column widths state (in pixels, null means use default from config)
  const [columnWidths, setColumnWidths] = useState<Partial<Record<ColumnKey, number>>>({});

  // Infrastructure column visibility state
  const [infrastructureColumnVisibility, setInfrastructureColumnVisibility] =
    useState<InfrastructureColumnVisibility>(DEFAULT_INFRASTRUCTURE_COLUMN_VISIBILITY);

  // Calculate visible infrastructure columns
  const visibleInfrastructureColumns = useMemo(() => {
    return INFRASTRUCTURE_COLUMN_CONFIGS.filter((col) => infrastructureColumnVisibility[col.key]);
  }, [infrastructureColumnVisibility]);

  // Helper function to render infrastructure cell value
  const renderInfrastructureCellValue = (equipment: any, columnKey: InfrastructureColumnKey) => {
    const value = equipment[columnKey];

    // Special rendering for certain columns
    if (columnKey === 'category' && value) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800">{value}</span>
      );
    }

    if (columnKey === 'status') {
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            value === 'Active'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : value === 'Spare'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                : value === 'Needs Repair'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
          }`}
        >
          {value || 'N/A'}
        </span>
      );
    }

    // Default rendering
    return value || '-';
  };

  // Function to load power racks
  const loadRacks = async () => {
    if (!window.api?.dimmerRacks || !window.api?.pdRacks) return;

    try {
      const [dimmer, pd] = await Promise.all([
        window.api.dimmerRacks.getAll(currentProjectId),
        window.api.pdRacks.getAll(currentProjectId),
      ]);
      setDimmerRacks(dimmer);
      setPDRacks(pd);
    } catch (error) {
      logger.error('Failed to load power racks:', error);
    }
  };

  // Function to reload all data (for file operations)
  const handleDataReload = async () => {
    await loadFixtures(currentProjectId);
    await loadInfrastructure(currentProjectId);
    await loadRacks();

    if (!window.api) return;

    try {
      // Load project data
      if (window.api.projects) {
        const projectData = await window.api.projects.getById(currentProjectId);
        if (projectData) {
          setProject(projectData as Project);
          setProjectName(projectData.name || 'Untitled Project');
        }
      }
    } catch (error) {
      logger.error('Failed to reload project data:', error);
    }
  };

  // Load fixtures, infrastructure, and preferences from database on mount
  useEffect(() => {
    // Set current project ID and load data for this project
    setCurrentProjectId(currentProjectId);
    loadFixtures(currentProjectId);
    loadInfrastructure(currentProjectId);
    loadGroups(currentProjectId);

    // Clear undo/redo history when switching projects
    useUndoRedoStore.getState().clearHistory();

    // Update menu context
    window.api?.menu?.setState({
      context: 'equipment',
      projectId: currentProjectId,
    });

    // Load project info and column preferences
    const loadProjectAndPreferences = async () => {
      if (!window.api) return;

      try {
        // Load project data
        if (window.api.projects) {
          const projectData = await window.api.projects.getById(currentProjectId);
          if (projectData) {
            setProject(projectData as Project);
            setProjectName(projectData.name || 'Untitled Project');
          }
        }

        // Load column preferences
        if (window.api.preferences) {
          const savedVisibility = await window.api.preferences.get(
            currentProjectId,
            'columnVisibility',
          );
          if (savedVisibility) {
            setColumnVisibility(savedVisibility);
          }

          const savedOrder = await window.api.preferences.get(currentProjectId, 'columnOrder');
          if (savedOrder) {
            setColumnOrder(savedOrder);
          }

          const savedWidths = await window.api.preferences.get(currentProjectId, 'columnWidths');
          if (savedWidths) {
            setColumnWidths(savedWidths);
          }

          const savedUserColumns = await window.api.preferences.get(
            currentProjectId,
            'userColumnDefinitions',
          );
          if (savedUserColumns) {
            setUserColumnDefinitions(savedUserColumns);
          }

          // Load infrastructure column preferences
          const savedInfrastructureVisibility = await window.api.preferences.get(
            currentProjectId,
            'infrastructureColumnVisibility',
          );
          if (savedInfrastructureVisibility) {
            setInfrastructureColumnVisibility(savedInfrastructureVisibility);
          }

          // Load highlight rules
          const savedHighlightRules = await window.api.preferences.get(
            currentProjectId,
            'highlightRules',
          );
          if (savedHighlightRules) {
            setHighlightRules(savedHighlightRules);
          }
        }
      } catch (error) {
        logger.error('Failed to load project and preferences:', error);
      }
    };

    loadProjectAndPreferences();
    loadRacks();
  }, [loadFixtures, currentProjectId]);

  // Auto-link fixtures with circuit info but no rack assignments (run once on initial load)
  useEffect(() => {
    // Skip if data isn't loaded yet
    if (fixtures.length === 0 || (dimmerRacks.length === 0 && pdRacks.length === 0)) {
      return;
    }

    // Skip if already ran (check ref)
    if (hasAutoLinkedRef.current) {
      return;
    }

    // Mark as running IMMEDIATELY to prevent re-entry
    hasAutoLinkedRef.current = true;

    const autoLinkExistingFixtures = async () => {
      const fixturesToUpdate: Array<{ id: string; updates: Partial<Fixture> }> = [];

      fixtures.forEach((fixture) => {
        // Skip if already linked or missing circuit info
        if (
          fixture.dimmer_rack_id ||
          fixture.pd_rack_id ||
          !fixture.circuit ||
          !fixture.circuit_number
        ) {
          return;
        }

        // Try to auto-link
        const linkResult = autoLinkCircuit(
          fixture.circuit,
          typeof fixture.circuit_number === 'string'
            ? parseInt(fixture.circuit_number, 10)
            : fixture.circuit_number,
          dimmerRacks,
          pdRacks,
        );

        // If we got a link result, queue it for update
        if (linkResult.dimmer_rack_id) {
          fixturesToUpdate.push({
            id: fixture.id,
            updates: {
              dimmer_rack_id: linkResult.dimmer_rack_id,
              dimmer_channel_number: linkResult.dimmer_channel_number,
              pd_rack_id: null,
              pd_circuit_number: null,
            },
          });
        } else if (linkResult.pd_rack_id) {
          fixturesToUpdate.push({
            id: fixture.id,
            updates: {
              pd_rack_id: linkResult.pd_rack_id,
              pd_circuit_number: linkResult.pd_circuit_number,
              dimmer_rack_id: null,
              dimmer_channel_number: null,
            },
          });
        }
      });

      // Apply all updates
      if (fixturesToUpdate.length > 0) {
        logger.info(`[Auto-link] Linking ${fixturesToUpdate.length} fixtures to racks`);
        for (const { id, updates } of fixturesToUpdate) {
          try {
            await updateFixture(id, updates);
          } catch (error) {
            logger.error(`[Auto-link] Failed to update ${id}:`, error);
          }
        }

        // Reload fixtures to verify updates
        setTimeout(async () => {
          await loadFixtures(currentProjectId);
        }, 500);
      }
    };

    autoLinkExistingFixtures();
  }, [fixtures, dimmerRacks, pdRacks, updateFixture]);

  // Update menu state when selection changes
  useEffect(() => {
    window.api?.menu?.setState({
      hasSelection: selectedRows.size > 0,
    });
  }, [selectedRows]);

  // Update menu state when undo/redo availability changes
  useEffect(() => {
    window.api?.menu?.setState({
      canUndo: canUndo(),
      canRedo: canRedo(),
    });
  }, [canUndo, canRedo]);

  // Save column visibility when it changes
  useEffect(() => {
    const savePreference = async () => {
      if (!window.api?.preferences) return;
      try {
        await window.api.preferences.set(currentProjectId, 'columnVisibility', columnVisibility);
      } catch (error) {
        logger.error('Failed to save column visibility:', error);
      }
    };
    savePreference();
  }, [columnVisibility, currentProjectId]);

  // Save column order when it changes
  useEffect(() => {
    const savePreference = async () => {
      if (!window.api?.preferences) return;
      try {
        await window.api.preferences.set(currentProjectId, 'columnOrder', columnOrder);
      } catch (error) {
        logger.error('Failed to save column order:', error);
      }
    };
    savePreference();
  }, [columnOrder, currentProjectId]);

  // Save column widths when they change
  useEffect(() => {
    const savePreference = async () => {
      if (!window.api?.preferences) return;
      try {
        await window.api.preferences.set(currentProjectId, 'columnWidths', columnWidths);
      } catch (error) {
        logger.error('Failed to save column widths:', error);
      }
    };
    savePreference();
  }, [columnWidths, currentProjectId]);

  // Save infrastructure column visibility when it changes
  useEffect(() => {
    const savePreference = async () => {
      if (!window.api?.preferences) return;
      try {
        await window.api.preferences.set(
          currentProjectId,
          'infrastructureColumnVisibility',
          infrastructureColumnVisibility,
        );
      } catch (error) {
        logger.error('Failed to save infrastructure column visibility:', error);
      }
    };
    savePreference();
  }, [infrastructureColumnVisibility, currentProjectId]);

  // Sort handler - supports multi-column sort with Shift key
  const handleSort = (field: string, addToExisting: boolean = false) => {
    if (addToExisting) {
      // Multi-column sort (Shift+Click)
      const existingIndex = sortConfigs.findIndex((s) => s.field === field);

      if (existingIndex >= 0) {
        // Field already in sort chain - toggle direction or remove
        const config = sortConfigs[existingIndex];
        if (config.direction === 'asc') {
          // Change to desc
          const newConfigs = [...sortConfigs];
          newConfigs[existingIndex] = { field, direction: 'desc' };
          setSortConfigs(newConfigs);
        } else {
          // Remove from chain
          setSortConfigs(sortConfigs.filter((s) => s.field !== field));
        }
      } else {
        // Add to end of sort chain
        setSortConfigs([...sortConfigs, { field, direction: 'asc' }]);
      }
    } else {
      // Single column sort (normal click)
      const existing = sortConfigs.find((s) => s.field === field);
      if (existing && sortConfigs.length === 1) {
        // Toggle direction
        setSortConfigs([{ field, direction: existing.direction === 'asc' ? 'desc' : 'asc' }]);
      } else {
        // Replace with new single sort
        setSortConfigs([{ field, direction: 'asc' }]);
      }
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setLocationFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setShowHidden(false);
  };

  // Handle bulk edit submission
  const handleBulkEdit = async (updates: Partial<Fixture>) => {
    // Use bulkUpdate to group all changes into a single undo operation
    await bulkUpdate(Array.from(selectedRows), updates);

    // Clear selection after bulk edit
    setSelectedRows(new Set());
  };

  // Handle hide selected fixtures
  const handleHideSelected = async () => {
    await bulkUpdate(Array.from(selectedRows), { hidden: true });
    setSelectedRows(new Set());
  };

  // Handle unhide selected fixtures
  const handleUnhideSelected = async () => {
    await bulkUpdate(Array.from(selectedRows), { hidden: false });
    setSelectedRows(new Set());
  };

  // Handle saving highlight rules
  const handleSaveHighlightRules = async (rules: HighlightRule[]) => {
    setHighlightRules(rules);
    await window.api.preferences.set(currentProjectId, 'highlightRules', rules);
  };

  // Handle column visibility change with persistence
  const handleColumnVisibilityChange = async (visibility: ColumnVisibility) => {
    setColumnVisibility(visibility);
    await window.api.preferences.set(currentProjectId, 'columnVisibility', visibility);
  };

  // Handle auto-numbering
  const handleAutoNumber = async (field: keyof Fixture, start: number, increment: number) => {
    const selectedFixtures = processedFixtures.filter((f) => selectedRows.has(f.id));

    // Build individual update operations for each fixture
    // Use BulkUpdateFixturesCommand directly for different values per fixture
    const { BulkUpdateFixturesCommand } = await import('../../commands/fixtureCommands');
    const { useUndoRedoStore } = await import('../../store/undoRedoStore');

    const fixtureUpdates = selectedFixtures.map((fixture, index) => {
      const value = start + index * increment;
      return {
        id: fixture.id,
        oldData: fixture,
        newData: { [field]: value } as Partial<Fixture>,
      };
    });

    const command = new BulkUpdateFixturesCommand(fixtureUpdates);
    await useUndoRedoStore.getState().executeCommand(command);

    // Clear selection after auto-number
    setSelectedRows(new Set());
  };

  // Handle user column definitions save
  const handleSaveUserColumnDefinitions = async (definitions: Record<string, string>) => {
    setUserColumnDefinitions(definitions);

    // Save to preferences
    if (!window.api?.preferences) return;
    try {
      await window.api.preferences.set(currentProjectId, 'userColumnDefinitions', definitions);
    } catch (error) {
      logger.error('Failed to save user column definitions:', error);
    }
  };

  // Show export dialog
  const handleExportCSV = () => {
    setExportFormat('csv');
    setIsExportDialogOpen(true);
  };

  const handleExportEos = () => {
    setExportFormat('eos');
    setIsExportDialogOpen(true);
  };

  const handleExportGrandMA2 = () => {
    setExportFormat('grandma2');
    setIsExportDialogOpen(true);
  };

  const handleExportGrandMA3 = () => {
    setExportFormat('grandma3');
    setIsExportDialogOpen(true);
  };

  // Properly escape a value for CSV (RFC 4180)
  const escapeCsvValue = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return escapeCsvValue(value.join(', '));
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Perform the actual export with headers
  const performExport = async (options: ExportHeaderOptions) => {
    // Build export header
    const header = buildExportHeader(options, project);

    // Get visible columns
    const visibleColumns = columnOrder
      .filter((key) => columnVisibility[key])
      .map((key) => {
        return { key, label: userColumnDefinitions[key] || key };
      });

    const dateStr = new Date().toISOString().split('T')[0];

    if (options.format === 'csv') {
      const headerText = formatHeaderForCSV(header);
      const columnHeaders = visibleColumns.map((col) => escapeCsvValue(col.label)).join(',');
      const rows = processedFixtures.map((fixture) =>
        visibleColumns.map((col) => escapeCsvValue(fixture[col.key as keyof Fixture])).join(','),
      );
      const csv = headerText + columnHeaders + '\n' + rows.join('\n');

      await window.api.files.saveText(csv, `${projectName}_fixtures_${dateStr}.csv`, [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] },
      ]);
    } else if (options.format === 'eos') {
      const headerText = formatHeaderForEos(header);
      const eosLines = processedFixtures
        .filter((f) => f.channel && f.universe && f.dmx_address)
        .map((fixture) => {
          const type = fixture.type || 'Generic';
          return `Chan Patch ${fixture.channel} "${type}" ${fixture.universe}/${fixture.dmx_address}`;
        });
      const eosContent = headerText + eosLines.join('\n');

      await window.api.files.saveText(eosContent, `${projectName}_eos_${dateStr}.txt`, [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ]);
    } else if (options.format === 'grandma2' || options.format === 'grandma3') {
      const headerText = formatHeaderForGrandMA(header);
      const fixtureLines = processedFixtures
        .filter((f) => f.channel && f.universe && f.dmx_address)
        .map((fixture, idx) => {
          const type = (fixture.type || 'Generic').replace(/"/g, '&quot;');
          return `  <Fixture id="${idx + 1}" name="${type}" channel="${fixture.channel}" universe="${fixture.universe}" address="${fixture.dmx_address}" />`;
        });
      const xmlContent =
        headerText +
        '<GrandMA>\n  <Fixtures>\n' +
        fixtureLines.join('\n') +
        '\n  </Fixtures>\n</GrandMA>';

      const formatLabel = options.format === 'grandma2' ? 'gma2' : 'gma3';
      await window.api.files.saveText(xmlContent, `${projectName}_${formatLabel}_${dateStr}.xml`, [
        { name: 'XML Files', extensions: ['xml'] },
        { name: 'All Files', extensions: ['*'] },
      ]);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Compute unique values for filter dropdowns and auto-fill suggestions
  const availableLocations = useMemo(() => {
    const locations = new Set<string>();
    fixtures.forEach((fixture) => {
      if (fixture.location) {
        locations.add(fixture.location);
      }
    });
    return Array.from(locations).sort();
  }, [fixtures]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    fixtures.forEach((fixture) => {
      if (fixture.type) {
        types.add(fixture.type);
      }
    });
    return Array.from(types).sort();
  }, [fixtures]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    fixtures.forEach((fixture) => {
      if (fixture.status) {
        statuses.add(fixture.status);
      }
    });
    return Array.from(statuses).sort();
  }, [fixtures]);

  // Auto-fill suggestions - extract unique values for common fields
  const autoFillSuggestions = useMemo(() => {
    const positions = new Set<string>();
    const purposes = new Set<string>();
    const colors = new Set<string>();
    const manufacturers = new Set<string>();
    const models = new Set<string>();
    const systems = new Set<string>();
    const gobos = new Set<string>();

    fixtures.forEach((fixture) => {
      if (fixture.position) positions.add(fixture.position);
      if (fixture.purpose) purposes.add(fixture.purpose);
      if (fixture.color) colors.add(fixture.color);
      if (fixture.manufacturer) manufacturers.add(fixture.manufacturer);
      if (fixture.model) models.add(fixture.model);
      if (fixture.system) systems.add(fixture.system);
      if (fixture.gobo) gobos.add(fixture.gobo);
    });

    return {
      positions: Array.from(positions).sort(),
      purposes: Array.from(purposes).sort(),
      colors: Array.from(colors).sort(),
      manufacturers: Array.from(manufacturers).sort(),
      models: Array.from(models).sort(),
      systems: Array.from(systems).sort(),
      gobos: Array.from(gobos).sort(),
      types: availableTypes,
      locations: availableLocations,
    };
  }, [fixtures, availableTypes, availableLocations]);

  // When the active group changes, load its pins for membership evaluation
  useEffect(() => {
    if (!activeGroupId) {
      setActivePins([]);
      return;
    }
    window.api?.groups
      ?.getPins(activeGroupId)
      .then((rows: { fixture_id: string }[]) => setActivePins(rows.map((r) => r.fixture_id)))
      .catch(() => setActivePins([]));
  }, [activeGroupId]);

  // Filtered and sorted fixtures
  const processedFixtures = useMemo(() => {
    let result = [...fixtures];

    // When a group filter is active, restrict to group members only
    if (activeGroupId) {
      const activeGroup = groups.find((g) => g.id === activeGroupId);
      if (activeGroup) {
        result = getGroupMembers(activeGroup, result, activePins);
      }
    }

    // Filter out hidden fixtures unless "Show Hidden" is enabled
    if (!showHidden) {
      result = result.filter((fixture) => !fixture.hidden);
    }

    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((fixture) =>
        Object.values(fixture).some((value) => String(value).toLowerCase().includes(query)),
      );
    }

    if (locationFilter !== 'all') {
      result = result.filter((fixture) => fixture.location === locationFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((fixture) => fixture.type?.includes(typeFilter));
    }

    if (statusFilter !== 'all') {
      result = result.filter((fixture) => fixture.status === statusFilter);
    }

    // Apply multi-column sorting
    if (sortConfigs.length > 0) {
      result.sort((a, b) => {
        // Try each sort config in order until we find a difference
        for (const { field, direction } of sortConfigs) {
          let comparison = 0;

          // Special handling for address field - sort by universe, then dmx_address
          if (field === 'address') {
            const aUniverse = a.universe || 0;
            const bUniverse = b.universe || 0;
            const aDmx = a.dmx_address || 0;
            const bDmx = b.dmx_address || 0;

            // Sort by universe first
            if (aUniverse !== bUniverse) {
              comparison = aUniverse - bUniverse;
            } else {
              // Then by DMX address within universe
              comparison = aDmx - bDmx;
            }
          } else {
            const aValue = a[field as keyof Fixture];
            const bValue = b[field as keyof Fixture];

            // Handle undefined/null values
            if (aValue === undefined || aValue === null) {
              comparison = 1;
            } else if (bValue === undefined || bValue === null) {
              comparison = -1;
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
              // Numeric comparison
              comparison = aValue - bValue;
            } else {
              // String comparison
              const aStr = String(aValue).toLowerCase();
              const bStr = String(bValue).toLowerCase();
              comparison = aStr.localeCompare(bStr);
            }
          }

          // Apply direction and return if we found a difference
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        }

        return 0; // All sort fields are equal
      });
    }

    return result;
  }, [
    fixtures,
    searchQuery,
    locationFilter,
    typeFilter,
    statusFilter,
    showHidden,
    sortConfigs,
    activeGroupId,
    groups,
    activePins,
  ]);

  // Fixture → groups map (for group indicator dots on every row)
  const fixtureGroupMap = useMemo(
    () => computeFixtureGroupMap(groups, fixtures, pinsByGroup),
    [groups, fixtures, pinsByGroup],
  );

  // Fixture → pinned group IDs map (for context menu pin toggle)
  const fixturePinnedGroupMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const pin of allPins) {
      const existing = map.get(pin.fixture_id);
      if (existing) {
        existing.add(pin.group_id);
      } else {
        map.set(pin.fixture_id, new Set([pin.group_id]));
      }
    }
    return map;
  }, [allPins]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + N - New Fixture
      if (modKey && e.key === 'n') {
        e.preventDefault();
        setIsAddFixtureDialogOpen(true);
      }

      // Cmd/Ctrl + S - Save (handled by FileMenu component now)
      // Removed to avoid conflicts with FileMenu keyboard shortcuts

      // Delete/Backspace - Delete selected fixtures
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRows.size > 0) {
        // Only delete if not typing in an input field
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (confirm(`Delete ${selectedRows.size} selected fixture(s)?`)) {
            deleteMultiple(Array.from(selectedRows));
            setSelectedRows(new Set());
          }
        }
      }

      // Escape - Clear selection or close dialogs
      if (e.key === 'Escape') {
        if (isAddFixtureDialogOpen) {
          setIsAddFixtureDialogOpen(false);
        } else if (isBulkEditDialogOpen) {
          setIsBulkEditDialogOpen(false);
        } else if (isUserColumnSettingsOpen) {
          setIsUserColumnSettingsOpen(false);
        } else if (selectedRows.size > 0) {
          setSelectedRows(new Set());
        }
      }

      // Cmd/Ctrl + A - Select all visible fixtures
      if (modKey && e.key === 'a') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const allIds = new Set(processedFixtures.map((f) => f.id));
          setSelectedRows(allIds);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAddFixtureDialogOpen,
    isBulkEditDialogOpen,
    isUserColumnSettingsOpen,
    selectedRows,
    processedFixtures,
    deleteMultiple,
  ]);

  // Handle select all
  const handleSelectAll = () => {
    const allIds = new Set(processedFixtures.map((f) => f.id));
    setSelectedRows(allIds);
  };

  // Handle deselect all
  const handleDeselectAll = () => {
    setSelectedRows(new Set());
  };

  // Duplicate selected fixtures
  // Strips `id` and uniqueness-sensitive patch fields via stripFixtureForDuplicate
  // so each copy receives a fresh UUID and doesn't inherit conflicting addresses.
  const handleDuplicate = async () => {
    const selectedFixtures = fixtures.filter((f) => selectedRows.has(f.id));
    if (selectedFixtures.length === 0) return;
    const copies = selectedFixtures.map(stripFixtureForDuplicate);
    try {
      await addMultipleFixtures(copies);
    } catch (error) {
      logger.error('Failed to duplicate fixtures', { error: String(error) });
      if (duplicateErrorTimerRef.current) clearTimeout(duplicateErrorTimerRef.current);
      setDuplicateError('Duplication failed — please try again.');
      duplicateErrorTimerRef.current = setTimeout(() => setDuplicateError(null), 4000);
    }
  };

  // Register menu handlers
  useEquipmentMenuHandlers({
    selectedRows,
    fixtures: processedFixtures,
    onAddFixture: () => setIsAddFixtureDialogOpen(true),
    onBulkEdit: () => setIsBulkEditDialogOpen(true),
    onDuplicate: handleDuplicate,
    onSelectAll: handleSelectAll,
    onDeselectAll: handleDeselectAll,
    onUndo: undo,
    onRedo: redo,
    onPrint: handlePrint,
    onExportCSV: handleExportCSV,
    onExportEos: handleExportEos,
    onExportGrandMA2: handleExportGrandMA2,
    onExportGrandMA3: handleExportGrandMA3,
    onColumnVisibility: () => setIsColumnVisibilityMenuOpen(true),
    onUserColumns: () => setIsUserColumnSettingsOpen(true),
    // Sort/Filter: focus the first interactive element in the respective bar so the
    // native menu action has an observable effect. Infrastructure has no sort/filter
    // UI yet; those branches are a TODO for a future iteration.
    onSort: () => {
      if (activeTab === 'fixtures') {
        sortBarRef.current?.querySelector<HTMLElement>('button, select, input')?.focus();
      }
    },
    onFilters: () => {
      if (activeTab === 'fixtures') {
        filterBarRef.current?.querySelector<HTMLInputElement>('input')?.focus();
      }
    },
    onClearSort: () => setSortConfigs([]),
    onClearFilters: handleClearFilters,
    onConditionalFormatting: () => {
      setIsInspectorOpen(true);
      setInspectorContent('conditionalFormatting');
    },
    onAddInfrastructure: () => {
      setActiveTab('infrastructure');
      setIsAddInfrastructureDialogOpen(true);
    },
  });

  // Update menu context when active tab changes
  useEffect(() => {
    const contextMap = {
      fixtures: 'equipment',
      infrastructure: 'infrastructure',
      power: 'power',
    } as const;
    window.api?.menu?.setState({ context: contextMap[activeTab] });
  }, [activeTab]);

  // Reset menu context to 'module' on unmount. This is intentionally a SEPARATE effect
  // from the tab-context effect above. If they were combined into one effect with [activeTab]
  // deps, the cleanup would run on every tab switch and briefly set context to 'module'
  // before the next render sets the correct tab context — a visible flash. The empty-dep
  // effect runs its cleanup only once, on actual component unmount.
  useEffect(() => {
    return () => {
      window.api?.menu?.setState({ context: 'module' });
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('fixtures')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'fixtures'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Fixtures
          </button>
          <button
            onClick={() => setActiveTab('infrastructure')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'infrastructure'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Infrastructure
          </button>
        </div>
      </div>

      {/* Duplicate error banner — auto-dismisses after 4 s */}
      {duplicateError && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-300">
          {duplicateError}
        </div>
      )}

      {/* Fixtures Tab */}
      {activeTab === 'fixtures' && (
        <>
          {/* Toolbar */}
          <div className="flex-shrink-0">
            <Toolbar
              selectedCount={selectedRows.size}
              onAddFixture={() => setIsAddFixtureDialogOpen(true)}
              onBulkEdit={() => setIsBulkEditDialogOpen(true)}
              onDeleteSelected={async () => {
                await deleteMultiple(Array.from(selectedRows));
                setSelectedRows(new Set());
              }}
              onDeselectAll={() => setSelectedRows(new Set())}
              onHideSelected={handleHideSelected}
              onUnhideSelected={handleUnhideSelected}
              onDuplicate={activeTab === 'fixtures' ? handleDuplicate : undefined}
              onExportCSV={activeTab === 'fixtures' ? handleExportCSV : undefined}
              onUserColumnSettings={() => setIsUserColumnSettingsOpen(true)}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              userColumnDefinitions={userColumnDefinitions}
              isColumnVisibilityMenuOpen={isColumnVisibilityMenuOpen}
              onColumnVisibilityMenuOpenChange={setIsColumnVisibilityMenuOpen}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Sort Bar */}
          <div ref={sortBarRef} className="flex-shrink-0">
            <SortBar
              sortConfigs={sortConfigs}
              onSort={handleSort}
              onClearSort={() => setSortConfigs([])}
            />
          </div>

          {/* Filter Chip Bar — replaces always-visible FilterBar row */}
          <div ref={filterBarRef} className="flex-shrink-0">
            <FilterChipBar
              locationFilter={locationFilter}
              onLocationChange={setLocationFilter}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              showHidden={showHidden}
              onShowHiddenChange={setShowHidden}
              onClearFilters={handleClearFilters}
              availableLocations={availableLocations}
              availableTypes={availableTypes}
              availableStatuses={availableStatuses}
            />
          </div>

          {/* Main Content — grid + optional inspector panel */}
          <main className="flex-1 min-h-0 overflow-hidden flex flex-row">
            {/* Groups toggle button (floating at top-right of grid area) */}
            <div className="flex-1 min-w-0 relative">
              <button
                onClick={() => setIsInspectorOpen((o) => !o)}
                className={`absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition-colors ${
                  isInspectorOpen
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title="Toggle Groups inspector"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <rect
                    x="1"
                    y="1"
                    width="4"
                    height="4"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="7"
                    y="1"
                    width="4"
                    height="4"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="1"
                    y="7"
                    width="4"
                    height="4"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="7"
                    y="7"
                    width="4"
                    height="4"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
                Groups
                {activeGroupId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                )}
              </button>
              <VirtualDataGrid
                fixtures={processedFixtures}
                selectedRows={selectedRows}
                onSelectRows={setSelectedRows}
                onUpdateFixture={updateFixture}
                columnVisibility={columnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnWidths={columnWidths}
                onColumnWidthChange={setColumnWidths}
                userColumnDefinitions={userColumnDefinitions}
                dimmerRacks={dimmerRacks}
                pdRacks={pdRacks}
                autoFillSuggestions={autoFillSuggestions}
                highlightRules={highlightRules}
                groups={groups}
                fixtureGroupMap={fixtureGroupMap}
                fixturePinnedGroupMap={fixturePinnedGroupMap}
                onPinToGroup={(fixtureId, groupId) => addPin(groupId, fixtureId)}
                onUnpinFromGroup={(fixtureId, groupId) => removePin(groupId, fixtureId)}
                fixtureIssueMap={fixtureIssueMap}
              />
            </div>

            {/* Inspector Panel */}
            {isInspectorOpen && (
              <InspectorPanel
                content={inspectorContent}
                onContentChange={setInspectorContent}
                onClose={() => setIsInspectorOpen(false)}
              >
                {inspectorContent === 'groups' && (
                  <GroupsInspector
                    fixtures={fixtures}
                    activeGroupId={activeGroupId}
                    onGroupActivate={setActiveGroupId}
                    projectId={currentProjectId}
                  />
                )}
                {inspectorContent === 'conditionalFormatting' && (
                  <ConditionalFormattingInspector
                    rules={highlightRules}
                    onChange={handleSaveHighlightRules}
                  />
                )}
              </InspectorPanel>
            )}
          </main>

          {/* Status Bar */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              {processedFixtures.length} / {fixtures.length} fixtures
              {selectedRows.size > 0 && ` | ${selectedRows.size} selected`}
            </div>
            <div>ShowStack:Lighting v0.1.0-alpha</div>
          </footer>
        </>
      )}

      {/* Infrastructure Tab */}
      {activeTab === 'infrastructure' && (
        <>
          {/* Infrastructure Toolbar */}
          <div className="flex-shrink-0">
            <InfrastructureToolbar
              selectedCount={selectedInfrastructure.size}
              onAddEquipment={() => setIsAddInfrastructureDialogOpen(true)}
              onDeleteSelected={async () => {
                const { deleteMultiple } = useInfrastructureStore.getState();
                await deleteMultiple(Array.from(selectedInfrastructure));
                setSelectedInfrastructure(new Set());
              }}
              onDeselectAll={() => setSelectedInfrastructure(new Set())}
              columnVisibility={infrastructureColumnVisibility}
              onColumnVisibilityChange={setInfrastructureColumnVisibility}
            />
          </div>

          {/* Infrastructure Table */}
          <main className="flex-1 min-h-0 overflow-y-auto">
            <div className="min-w-full">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedInfrastructure.size === infrastructureEquipment.length &&
                          infrastructureEquipment.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInfrastructure(
                              new Set(infrastructureEquipment.map((eq) => eq.id)),
                            );
                          } else {
                            setSelectedInfrastructure(new Set());
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </th>
                    {visibleInfrastructureColumns.map((column) => (
                      <th
                        key={column.key}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {infrastructureEquipment.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleInfrastructureColumns.length + 1}
                        className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex flex-col items-center">
                          <div className="text-5xl mb-3">📡</div>
                          <p className="text-lg font-medium mb-1">
                            No infrastructure equipment yet
                          </p>
                          <p className="text-sm">Click "Add Equipment" to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    infrastructureEquipment.map((equipment) => (
                      <tr
                        key={equipment.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer ${
                          selectedInfrastructure.has(equipment.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''
                        }`}
                        onDoubleClick={() => {
                          setEditingInfrastructureEquipment(equipment);
                          setIsEditInfrastructureDialogOpen(true);
                        }}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedInfrastructure.has(equipment.id)}
                            onChange={(e) => {
                              const newSelection = new Set(selectedInfrastructure);
                              if (e.target.checked) {
                                newSelection.add(equipment.id);
                              } else {
                                newSelection.delete(equipment.id);
                              }
                              setSelectedInfrastructure(newSelection);
                            }}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                        </td>
                        {visibleInfrastructureColumns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-4 py-3 text-sm ${
                              column.key === 'name'
                                ? 'text-gray-900 dark:text-white font-medium'
                                : column.key === 'ip_address'
                                  ? 'text-gray-600 dark:text-gray-400 font-mono'
                                  : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {renderInfrastructureCellValue(equipment, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </main>

          {/* Status Bar */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              {infrastructureEquipment.length} equipment | {selectedInfrastructure.size} selected
            </div>
            <div>ShowStack:Lighting v0.1.0-alpha</div>
          </footer>
        </>
      )}

      {/* Power Tab */}
      {activeTab === 'power' && (
        <>
          {/* Power Toolbar */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
            <button
              onClick={() => setIsRackManagerOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
            >
              Manage Racks...
            </button>
          </div>

          {/* Power Racks Table */}
          <main className="flex-1 min-h-0 overflow-y-auto">
            <div className="min-w-full">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Identifier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Voltage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Circuit Count
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {dimmerRacks.length === 0 && pdRacks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex flex-col items-center">
                          <div className="text-5xl mb-3">⚡</div>
                          <p className="text-sm">No power racks configured</p>
                          <button
                            onClick={() => setIsRackManagerOpen(true)}
                            className="mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          >
                            Add your first rack
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {dimmerRacks.map((rack) => (
                        <tr
                          key={rack.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                          onDoubleClick={() => setIsRackManagerOpen(true)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs font-medium">
                              Dimmer
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                            {rack.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {rack.rack_identifier || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {rack.building_service || 'Unassigned'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {rack.voltage}V
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {rack.circuit_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {rack.location || '-'}
                          </td>
                        </tr>
                      ))}
                      {pdRacks.map((rack) => (
                        <tr
                          key={rack.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                          onDoubleClick={() => setIsRackManagerOpen(true)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                              PD
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                            {rack.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {rack.rack_identifier || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {rack.building_service || 'Unassigned'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {rack.voltage}V
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {rack.circuit_count}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {rack.location || '-'}
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              {dimmerRacks.length} dimmer racks | {pdRacks.length} PD racks |{' '}
              {dimmerRacks.length + pdRacks.length} total
            </div>
            <div>ShowStack:Lighting v0.1.0-alpha</div>
          </footer>
        </>
      )}

      {/* Add Fixture Dialog */}
      <AddFixtureDialog
        isOpen={isAddFixtureDialogOpen}
        onClose={() => setIsAddFixtureDialogOpen(false)}
        onAdd={addMultipleFixtures}
        existingFixturesCount={fixtures.length}
        autoFillSuggestions={autoFillSuggestions}
      />

      {/* Add Infrastructure Dialog */}
      <AddInfrastructureDialog
        isOpen={isAddInfrastructureDialogOpen}
        onClose={() => setIsAddInfrastructureDialogOpen(false)}
        onAdd={useInfrastructureStore.getState().addEquipment}
      />

      {/* Edit Infrastructure Dialog */}
      <EditInfrastructureDialog
        isOpen={isEditInfrastructureDialogOpen}
        onClose={() => {
          setIsEditInfrastructureDialogOpen(false);
          setEditingInfrastructureEquipment(null);
        }}
        onUpdate={useInfrastructureStore.getState().updateEquipment}
        equipment={editingInfrastructureEquipment}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        isOpen={isBulkEditDialogOpen}
        selectedCount={selectedRows.size}
        selectedIds={Array.from(selectedRows)}
        onClose={() => setIsBulkEditDialogOpen(false)}
        onSubmit={handleBulkEdit}
        onAutoNumber={handleAutoNumber}
      />

      {/* User Column Settings Dialog */}
      <UserColumnSettingsDialog
        isOpen={isUserColumnSettingsOpen}
        onClose={() => setIsUserColumnSettingsOpen(false)}
        onSave={handleSaveUserColumnDefinitions}
        initialDefinitions={userColumnDefinitions}
      />

      {/* Export Header Dialog */}
      <ExportHeaderDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={performExport}
        defaultFormat={exportFormat}
        projectName={projectName}
      />

      {/* Rack Manager Dialog */}
      {isRackManagerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Power Rack Management
              </h2>
              <button
                onClick={() => setIsRackManagerOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <RackManager projectId={currentProjectId} onRacksChange={loadRacks} />
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setIsRackManagerOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog {...unsavedChangesDialog} />
    </div>
  );
}
