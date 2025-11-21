import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePrepStore } from '../../store/prepStore';
import { useProjectStore } from '../../store/projectStore';
import { usePrepFileStore } from '../../store/prepFileStore';
import { NewPrepProjectDialog } from '../../components/prep/NewPrepProjectDialog';
import { PrepProjectCard } from '../../components/prep/PrepProjectCard';
import { SectionList } from '../../components/prep/SectionList';
import { AddSectionDialog } from '../../components/prep/AddSectionDialog';
import { EditSectionDialog } from '../../components/prep/EditSectionDialog';
import { RevisionPanel } from '../../components/prep/RevisionPanel';
import { NotesPanel } from '../../components/prep/NotesPanel';
import { TemplateManagerDialog } from '../../components/prep/TemplateManagerDialog';
import { PrepFileMenu } from '../../components/prep/PrepFileMenu';
import type { PrepSection, Discipline, PrepProject } from '../../types/prep';

export function Prep() {
  const navigate = useNavigate();
  const { projectId: parentProjectId } = useParams<{ projectId?: string }>();
  const { allProjects, currentProject, sections, revisions, loadAllProjects, loadProject, clearCurrentProject, updateProject, generateRevision, deleteRevision, syncFromParent } =
    usePrepStore();
  const { projects, loadProjects } = useProjectStore();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showEditSectionDialog, setShowEditSectionDialog] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<PrepSection | null>(null);

  // State for inline editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isDatePickerMode, setIsDatePickerMode] = useState(false);

  // State for tabs
  const [activeTab, setActiveTab] = useState<'builder' | 'output'>('builder');

  // State for collapsible sections
  const [projectDetailsExpanded, setProjectDetailsExpanded] = useState(true);
  const [revisionsExpanded, setRevisionsExpanded] = useState(true);
  const [equipmentExpanded, setEquipmentExpanded] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(true);

  // State for revision generation
  const [showRevisionNotes, setShowRevisionNotes] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isGeneratingRevision, setIsGeneratingRevision] = useState(false);

  // State for template manager
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // State for file menu
  const [showFileMenu, setShowFileMenu] = useState(false);

  // Ref for click timer (to distinguish single vs double click)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleBackClick = () => {
    if (parentProjectId) {
      navigate(`/project/${parentProjectId}`);
    } else {
      navigate('/');
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  useEffect(() => {
    // Load all prep projects and parent projects on mount
    loadAllProjects();
    loadProjects();
  }, []);

  // Update file store when current project changes
  useEffect(() => {
    if (currentProject) {
      usePrepFileStore.getState().setFileName(currentProject.production_name);
    }
  }, [currentProject]);

  const handleProjectClick = async (projectId: string) => {
    await loadProject(projectId);
  };

  const handleBackToList = () => {
    clearCurrentProject();
  };

  const handleNewProject = () => {
    setShowNewProjectDialog(true);
  };

  const handleProjectCreated = async (projectId: string) => {
    await loadProject(projectId);
  };

  const handleEditSection = (section: PrepSection) => {
    setSectionToEdit(section);
    setShowEditSectionDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditSectionDialog(false);
    setSectionToEdit(null);
  };

  const handleGenerateRevision = async () => {
    if (!currentProject) return;
    if (currentProject.current_revision >= 5) {
      alert('Maximum of 5 revisions reached');
      return;
    }

    setIsGeneratingRevision(true);
    try {
      await generateRevision(currentProject.id, revisionNotes || undefined);
      setRevisionNotes('');
      setShowRevisionNotes(false);
    } catch (error) {
      console.error('Failed to generate revision:', error);
      alert('Failed to generate revision');
    } finally {
      setIsGeneratingRevision(false);
    }
  };

  const handleLinkToParent = async (parentProjectId: string) => {
    if (!currentProject) return;

    try {
      await updateProject(currentProject.id, { parent_project_id: parentProjectId });
      alert('Successfully linked to parent project');

      // Optionally trigger sync after linking
      if (confirm('Would you like to sync dates and contacts from the parent project now?')) {
        const result = await syncFromParent(currentProject.id, parentProjectId);
        if (result.success) {
          alert(result.message || 'Successfully synced from parent project');
        }
      }
    } catch (error) {
      console.error('Failed to link to parent:', error);
      alert('Failed to link to parent project');
    }
  };

  const handleUnlinkFromParent = async () => {
    if (!currentProject) return;

    if (!confirm('Unlink from parent project? This will not delete any data.')) {
      return;
    }

    try {
      await updateProject(currentProject.id, { parent_project_id: null });
      alert('Successfully unlinked from parent project');
    } catch (error) {
      console.error('Failed to unlink from parent:', error);
      alert('Failed to unlink from parent project');
    }
  };

  const handleSyncFromParent = async () => {
    if (!currentProject || !currentProject.parent_project_id) return;

    if (!confirm('Sync data from parent project? This will overwrite dates and contact information.')) {
      return;
    }

    try {
      const result = await syncFromParent(currentProject.id, currentProject.parent_project_id);
      if (result.success) {
        alert(result.message || 'Successfully synced from parent project');
      } else {
        alert(result.error || 'Failed to sync from parent project');
      }
    } catch (error) {
      console.error('Failed to sync from parent:', error);
      alert('Failed to sync from parent project');
    }
  };

  // Inline editing helpers
  const handleFieldClick = (field: string, value: string | undefined, isReadOnly: boolean) => {
    if (isReadOnly) return; // Read-only if linked to parent
    setEditingField(field);
    setEditValue(value || '');
  };

  // Format phone number (US format)
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return value;
  };

  // Format date to mm/dd/yy
  const formatDate = (value: string): string => {
    if (!value) return value;

    // Try to parse various date formats
    const parts = value.split('/');

    // Handle mm/dd format (no year) - assume current year
    if (parts.length === 2) {
      const [month, day] = parts;
      const currentYear = new Date().getFullYear();
      const parsedDate = new Date(`${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(parsedDate.getTime())) {
        const m = parsedDate.getMonth() + 1;
        const d = parsedDate.getDate();
        const y = parsedDate.getFullYear().toString().slice(-2);
        return `${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}/${y}`;
      }
    }

    // Handle mm/dd/yy or mm/dd/yyyy format
    if (parts.length === 3) {
      const [month, day, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      const parsedDate = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(parsedDate.getTime())) {
        const m = parsedDate.getMonth() + 1;
        const d = parsedDate.getDate();
        const y = parsedDate.getFullYear().toString().slice(-2);
        return `${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}/${y}`;
      }
    }

    // Try ISO format or other standard formats
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    }

    return value; // Return as-is if can't parse
  };

  // Convert mm/dd/yy to YYYY-MM-DD for date input
  const toDateInputFormat = (value: string): string => {
    if (!value) return '';
    const parts = value.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  // Convert YYYY-MM-DD to mm/dd/yy
  const fromDateInputFormat = (value: string): string => {
    if (!value) return '';
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    }
    return value;
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    if (!email) return true; // Empty is OK
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleFieldBlur = async () => {
    console.log('💾 handleFieldBlur called. editingField:', editingField, 'editValue:', editValue);
    if (!editingField || !currentProject) {
      console.log('❌ Exiting early - no editingField or currentProject');
      return;
    }

    let finalValue = editValue.trim();
    console.log('📝 finalValue after trim:', finalValue);

    // Format phone numbers
    if (editingField.includes('_phone') && finalValue) {
      finalValue = formatPhoneNumber(finalValue);
      console.log('📞 Formatted phone:', finalValue);
    }

    // Format dates
    if (editingField.includes('_date') && finalValue) {
      // If coming from date picker, convert from YYYY-MM-DD to mm/dd/yy
      if (isDatePickerMode) {
        finalValue = fromDateInputFormat(finalValue);
      } else {
        finalValue = formatDate(finalValue);
      }
      console.log('📅 Formatted date:', finalValue);
    }

    // Validate email
    if (editingField.includes('_email') && finalValue && !isValidEmail(finalValue)) {
      alert('Please enter a valid email address');
      setEditingField(null);
      setEditValue('');
      setIsDatePickerMode(false);
      return;
    }

    const currentValue = (currentProject as any)[editingField];
    console.log('🔍 Comparing - currentValue:', currentValue, 'finalValue:', finalValue);

    if (currentValue !== finalValue) {
      console.log('✨ Values differ - calling updateProject');
      await updateProject(currentProject.id, {
        [editingField]: finalValue || null,
      });
      console.log('✅ updateProject complete');
    } else {
      console.log('⏭️ Values same - skipping update');
    }

    setEditingField(null);
    setEditValue('');
    setIsDatePickerMode(false);
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFieldBlur();
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setEditValue('');
      setIsDatePickerMode(false);
    }
  };

  // Handler for date field double-click
  const handleDateFieldDoubleClick = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(toDateInputFormat(value));
    setIsDatePickerMode(true);
  };

  // If a project is loaded, show the project view
  if (currentProject) {
    // Find parent project if linked
    const parentProject = currentProject.parent_project_id
      ? projects.find((p) => p.id === currentProject.parent_project_id)
      : null;
    const isLinked = !!parentProject;
    const disciplines = JSON.parse(currentProject.disciplines as any || '[]') as Discipline[];

    // Helper to get field value (from parent if linked, otherwise from prep project)
    const getFieldValue = (field: keyof PrepProject): string => {
      if (isLinked && parentProject) {
        // Map prep project fields to parent project fields
        // Company fields are NOT included - they always come from currentProject
        switch (field) {
          case 'gm_name': return parentProject.general_manager || '';
          case 'gm_email': return parentProject.general_manager_email || '';
          case 'gm_phone': return parentProject.general_manager_phone || '';
          case 'pm_name': return parentProject.production_manager || '';
          case 'pm_email': return parentProject.production_manager_email || '';
          case 'pm_phone': return parentProject.production_manager_phone || '';
          case 'ld_name': return parentProject.lighting_designer || '';
          case 'ld_email': return parentProject.lighting_designer_email || '';
          case 'ld_phone': return parentProject.lighting_designer_phone || '';
          case 'pe_name': return parentProject.electrician || '';
          case 'pe_email': return parentProject.electrician_email || '';
          case 'pe_phone': return parentProject.electrician_phone || '';
          case 'venue': return parentProject.venue || '';
          // For fields not in parent project, fall through to get from currentProject
          default: break;
        }
      }
      // Always get from currentProject if not linked or field not in parent
      return (currentProject[field] as string) || '';
    };

    // Helper to check if a specific field is read-only (pulling from parent)
    const isFieldReadOnly = (field: keyof PrepProject): boolean => {
      if (!isLinked || !parentProject) return false;

      // Only these fields are read-only when linked (fields that pull from parent)
      // Company fields are NOT included - they should be editable even when linked
      const parentFields: (keyof PrepProject)[] = [
        'gm_name', 'gm_email', 'gm_phone',
        'pm_name', 'pm_email', 'pm_phone',
        'ld_name', 'ld_email', 'ld_phone',
        'pe_name', 'pe_email', 'pe_phone',
        'venue', 'venue_city', 'venue_state'
      ];

      return parentFields.includes(field);
    };

    // Helper to render an editable field inline (no label wrapper)
    const renderInlineField = (field: keyof PrepProject, placeholder = '+ Add', className = '') => {
      const value = getFieldValue(field);
      const isEditing = editingField === field;
      const fieldIsReadOnly = isFieldReadOnly(field);

      if (isEditing) {
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFieldBlur}
            onKeyDown={handleFieldKeyDown}
            className={`w-full px-2 py-1 bg-gray-600 border border-blue-500 rounded text-sm text-white focus:outline-none ${className}`}
            autoFocus
          />
        );
      }

      return (
        <span
          onClick={() => handleFieldClick(field, value, fieldIsReadOnly)}
          className={`${
            fieldIsReadOnly
              ? 'text-gray-400 cursor-default'
              : 'cursor-pointer hover:text-gray-200 hover:bg-gray-700 rounded px-2 py-1 transition'
          } ${!value && !fieldIsReadOnly ? 'italic text-gray-500' : 'text-gray-300'} ${className}`}
        >
          {value || placeholder}
          {fieldIsReadOnly && value && <span className="ml-2 text-xs text-blue-400">(from parent)</span>}
        </span>
      );
    };

    // Helper to render a date field with calendar picker on double-click
    const renderDateField = (field: keyof PrepProject, placeholder = '+ Add', className = '') => {
      const value = getFieldValue(field);
      const isEditing = editingField === field;

      if (isEditing) {
        if (isDatePickerMode) {
          // Date picker mode
          return (
            <input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleFieldBlur}
              onKeyDown={handleFieldKeyDown}
              className={`w-full px-2 py-1 bg-gray-600 border border-blue-500 rounded text-sm text-white focus:outline-none ${className}`}
              autoFocus
            />
          );
        } else {
          // Text input mode
          return (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleFieldBlur}
              onKeyDown={handleFieldKeyDown}
              className={`w-full px-2 py-1 bg-gray-600 border border-blue-500 rounded text-sm text-white focus:outline-none ${className}`}
              autoFocus
            />
          );
        }
      }

      const handleClick = () => {
        // Clear any existing timer
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }

        // Set a timer for single-click action
        clickTimerRef.current = setTimeout(() => {
          // Single-click: open text input
          handleFieldClick(field, value, false);
          clickTimerRef.current = null;
        }, 250); // 250ms delay to detect double-click
      };

      const handleDoubleClick = () => {
        // Cancel the single-click timer
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }

        // Double-click: open calendar picker
        handleDateFieldDoubleClick(field, value);
      };

      return (
        <span
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={`cursor-pointer hover:text-gray-200 hover:bg-gray-700 rounded px-2 py-1 transition ${!value ? 'italic text-gray-500' : 'text-gray-300'} ${className}`}
        >
          {value || placeholder}
        </span>
      );
    };

    // Helper to render an editable field with label (for backwards compatibility)
    const renderField = (label: string, field: keyof PrepProject, placeholder = '+ Add') => {
      const value = getFieldValue(field);
      const isEditing = editingField === field;
      const fieldIsReadOnly = isFieldReadOnly(field);

      return (
        <div>
          {label && <span className="text-gray-500 text-sm">{label}:</span>}{' '}
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleFieldBlur}
              onKeyDown={handleFieldKeyDown}
              className="inline-block px-2 py-1 bg-gray-600 border border-blue-500 rounded text-sm text-white focus:outline-none"
              autoFocus
            />
          ) : (
            <span
              onClick={() => handleFieldClick(field, value, fieldIsReadOnly)}
              className={`${
                fieldIsReadOnly
                  ? 'text-gray-400 cursor-default'
                  : 'text-gray-300 cursor-pointer hover:text-gray-200 hover:bg-gray-700 rounded px-1 py-0.5 transition'
              } ${!value && !fieldIsReadOnly ? 'italic text-gray-500' : ''}`}
            >
              {value || placeholder}
            </span>
          )}
          {fieldIsReadOnly && value && (
            <span className="ml-2 text-xs text-blue-400">(from parent)</span>
          )}
        </div>
      );
    };

    // Get latest revision date
    const latestRevision = revisions.length > 0
      ? revisions.reduce((latest, rev) => rev.revision_date > latest.revision_date ? rev : latest)
      : null;

    return (
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        {/* Header with file operations */}
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToList}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              >
                ← Back to Projects
              </button>

              {/* File Menu */}
              <PrepFileMenu
                onNewProject={() => setShowNewProjectDialog(true)}
              />
            </div>
            <button
              onClick={handleHomeClick}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              title="Home (Projects)"
            >
              🏠
            </button>
          </div>
        </header>

        {/* Show name and badges */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{currentProject.production_name}</h1>
            {currentProject.current_revision > 0 && (
              <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded">
                Revision {currentProject.current_revision}
              </span>
            )}
            {isLinked && (
              <>
                <span className="px-3 py-1.5 bg-blue-600/20 text-blue-400 text-sm rounded">
                  Linked to Parent Project
                </span>
                <button
                  onClick={handleSyncFromParent}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm rounded transition"
                  title="Sync dates and contacts from parent project"
                >
                  🔄 Sync from Parent
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 bg-gray-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                  activeTab === 'builder'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Shop Order Builder
              </button>
              <button
                onClick={() => setActiveTab('output')}
                className={`px-4 py-3 text-sm font-medium transition border-b-2 ${
                  activeTab === 'output'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Print-Ready Output
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {activeTab === 'builder' && (
              <>
                {/* Project Details */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setProjectDetailsExpanded(!projectDetailsExpanded)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-750 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-lg">{projectDetailsExpanded ? '▼' : '▶'}</span>
                      <h2 className="text-xl font-bold">Project Details</h2>
                      {!projectDetailsExpanded && (
                        <div className="flex items-center gap-6 text-sm text-gray-400 ml-4">
                          <div>
                            <span className="text-gray-500">Show:</span>{' '}
                            <span className="text-gray-300">{currentProject.production_name}</span>
                          </div>
                          {getFieldValue('venue') && (
                            <div>
                              <span className="text-gray-500">Venue:</span>{' '}
                              <span className="text-gray-300">{getFieldValue('venue')}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Disciplines:</span>{' '}
                            <span className="text-gray-300">
                              {disciplines.map((d) => d.charAt(0).toUpperCase()).join('/')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Created: {new Date(currentProject.created_at).toLocaleDateString()}
                      {latestRevision && (
                        <> | Last Revised: {new Date(latestRevision.revision_date).toLocaleDateString()}</>
                      )}
                    </div>
                  </button>

                  {projectDetailsExpanded && (
                    <div className="p-6 pt-0">

              <div className="space-y-4">
                {/* Production Info - 1 Row */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                  <div className="flex items-center gap-8">
                    <div>
                      <span className="text-gray-500 text-sm">Show:</span>{' '}
                      <span className="text-gray-300 font-medium text-base">{currentProject.production_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">Venue:</span>{' '}
                      <span className="text-base">
                        {renderInlineField('venue', '+ Venue Name', 'inline-block min-w-[120px]')}
                      </span>
                      {getFieldValue('venue') && (
                        <>
                          <span className="text-base">
                            {renderInlineField('venue_city', '+ City', 'inline-block min-w-[80px]')}
                          </span>
                          <span className="text-base">
                            {renderInlineField('venue_state', '+ ST', 'inline-block min-w-[40px]')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-500">Disciplines:</span>{' '}
                    {disciplines.map((d) => d.charAt(0).toUpperCase()).join('/')}
                  </div>
                </div>

                {/* Parent Project Link */}
                <div className="pb-3 border-b border-gray-700">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-sm">Parent Project:</span>
                    {currentProject.parent_project_id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">
                          {projects.find(p => p.id === currentProject.parent_project_id)?.name || 'Unknown Project'}
                        </span>
                        <button
                          onClick={handleUnlinkFromParent}
                          className="text-xs px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition"
                          title="Unlink from parent project"
                        >
                          Unlink
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleLinkToParent(e.target.value);
                            }
                          }}
                          className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-gray-300 hover:bg-gray-600 transition"
                        >
                          <option value="">+ Link to Project</option>
                          {projects
                            .filter(p => p.id !== currentProject.id) // Don't show current project
                            .map(project => (
                              <option key={project.id} value={project.id}>
                                {project.production_name}
                              </option>
                            ))}
                        </select>
                        <span className="text-xs text-gray-500">
                          Link to parent to sync dates and contacts
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Management - Each Person in a Row */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Management</h3>
                  <div className="space-y-2">
                    {/* GM Row */}
                    <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                      <span className="text-gray-500">General Manager</span>
                      <div>
                        {renderInlineField('gm_name', '+ Name')}
                      </div>
                      <div className="flex gap-4">
                        {getFieldValue('gm_name') && (
                          <>
                            <div className="flex-1">{renderInlineField('gm_company', '+ Company')}</div>
                            <div className="flex-1">{renderInlineField('gm_email', '+ Email')}</div>
                            <div className="flex-1">{renderInlineField('gm_phone', '+ Phone')}</div>
                          </>
                        )}
                      </div>
                    </div>
                    {/* PM Row */}
                    <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                      <span className="text-gray-500">Production Manager</span>
                      <div>
                        {renderInlineField('pm_name', '+ Name')}
                      </div>
                      <div className="flex gap-4">
                        {getFieldValue('pm_name') && (
                          <>
                            <div className="flex-1">{renderInlineField('pm_company', '+ Company')}</div>
                            <div className="flex-1">{renderInlineField('pm_email', '+ Email')}</div>
                            <div className="flex-1">{renderInlineField('pm_phone', '+ Phone')}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Design Team - Each Person in a Row */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Design Team</h3>
                  <div className="space-y-2">
                    {disciplines.includes('lighting') && (
                      <>
                        {/* LD Row */}
                        <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                          <span className="text-gray-500">Lighting Designer</span>
                          <div>
                            {renderInlineField('ld_name', '+ Name')}
                          </div>
                          <div className="flex gap-4">
                            {getFieldValue('ld_name') && (
                              <>
                                {renderInlineField('ld_email', '+ Email')}
                                {renderInlineField('ld_phone', '+ Phone')}
                              </>
                            )}
                          </div>
                        </div>
                        {/* ALD Row */}
                        <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                          <span className="text-gray-500">Associate LD</span>
                          <div>
                            {renderInlineField('ald_name', '+ Name')}
                          </div>
                          <div className="flex gap-4">
                            {getFieldValue('ald_name') && (
                              <>
                                {renderInlineField('ald_email', '+ Email')}
                                {renderInlineField('ald_phone', '+ Phone')}
                              </>
                            )}
                          </div>
                        </div>
                        {/* PE Row */}
                        <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                          <span className="text-gray-500">Production Elec.</span>
                          <div>
                            {renderInlineField('pe_name', '+ Name')}
                          </div>
                          <div className="flex gap-4">
                            {getFieldValue('pe_name') && (
                              <>
                                {renderInlineField('pe_email', '+ Email')}
                                {renderInlineField('pe_phone', '+ Phone')}
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {disciplines.includes('audio') && isLinked && parentProject?.audio_designer && (
                      <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                        <span className="text-gray-500">Audio Designer</span>
                        <span className="text-gray-400">{parentProject.audio_designer}</span>
                        <div className="text-gray-400">
                          {parentProject.audio_designer_email && <span>{parentProject.audio_designer_email}</span>}
                          {parentProject.audio_designer_phone && <span className="ml-4">{parentProject.audio_designer_phone}</span>}
                          <span className="ml-2 text-xs text-blue-400">(from parent)</span>
                        </div>
                      </div>
                    )}
                    {disciplines.includes('video') && isLinked && parentProject?.video_designer && (
                      <div className="grid grid-cols-[120px_1fr_2fr] gap-4 text-sm items-center">
                        <span className="text-gray-500">Video Designer</span>
                        <span className="text-gray-400">{parentProject.video_designer}</span>
                        <div className="text-gray-400">
                          {parentProject.video_designer_email && <span>{parentProject.video_designer_email}</span>}
                          {parentProject.video_designer_phone && <span className="ml-4">{parentProject.video_designer_phone}</span>}
                          <span className="ml-2 text-xs text-blue-400">(from parent)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Show Dates - 2 Rows: Header and Values */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Show Dates</h3>
                  <div className="grid grid-cols-7 gap-2 text-xs">
                    {/* Header Row */}
                    <div className="text-gray-500 font-medium">Prep Start</div>
                    <div className="text-gray-500 font-medium">Prep End</div>
                    <div className="text-gray-500 font-medium">Load In</div>
                    <div className="text-gray-500 font-medium">First Preview</div>
                    <div className="text-gray-500 font-medium">Opening</div>
                    <div className="text-gray-500 font-medium">Closing</div>
                    <div className="text-gray-500 font-medium">Load Out</div>

                    {/* Values Row */}
                    {renderDateField('prep_start_date', '—')}
                    {renderDateField('prep_end_date', '—')}
                    {renderDateField('load_in_date', '—')}
                    {renderDateField('first_preview_date', '—')}
                    {renderDateField('opening_night_date', '—')}
                    {renderDateField('closing_date', '—')}
                    {renderDateField('load_out_date', '—')}
                  </div>
                </div>
              </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setNotesExpanded(!notesExpanded)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-750 transition"
                  >
                    <span className="text-gray-400 text-lg">{notesExpanded ? '▼' : '▶'}</span>
                    <h2 className="text-xl font-bold">Notes</h2>
                  </button>

                  {notesExpanded && (
                    <div className="p-6 pt-0">
                      <NotesPanel
                        project={currentProject}
                        onManageTemplates={() => setShowTemplateManager(true)}
                      />
                    </div>
                  )}
                </div>

                {/* Revisions */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <button
                      onClick={() => setRevisionsExpanded(!revisionsExpanded)}
                      className="flex items-center gap-3 hover:bg-gray-750 rounded px-2 py-1 -ml-2 transition"
                    >
                      <span className="text-gray-400 text-lg">{revisionsExpanded ? '▼' : '▶'}</span>
                      <h2 className="text-xl font-bold">Revisions</h2>
                      <span className="text-sm text-gray-400">
                        Rev {currentProject.current_revision} | {5 - currentProject.current_revision} remaining
                      </span>
                    </button>
                    <button
                      onClick={() => setShowRevisionNotes(!showRevisionNotes)}
                      disabled={isGeneratingRevision || currentProject.current_revision >= 5}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition"
                    >
                      {isGeneratingRevision ? 'Generating...' : 'Generate Revision'}
                    </button>
                  </div>

                  {/* Notes input */}
                  {showRevisionNotes && (
                    <div className="mx-6 mb-4 p-4 bg-gray-700 border border-gray-600 rounded">
                      <label className="block text-sm font-medium mb-2">
                        Revision Notes (optional)
                      </label>
                      <textarea
                        value={revisionNotes}
                        onChange={(e) => setRevisionNotes(e.target.value)}
                        placeholder="Describe the changes in this revision..."
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleGenerateRevision}
                          disabled={isGeneratingRevision}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded text-sm transition"
                        >
                          Create Revision
                        </button>
                        <button
                          onClick={() => {
                            setShowRevisionNotes(false);
                            setRevisionNotes('');
                          }}
                          disabled={isGeneratingRevision}
                          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {revisionsExpanded && (
                    <div className="p-6 pt-0">
                      <RevisionPanel
                        project={currentProject}
                        revisions={revisions}
                        onGenerateRevision={(notes) => generateRevision(currentProject.id, notes)}
                        onDeleteRevision={(revisionId) => deleteRevision(currentProject.id, revisionId)}
                        onCompareRevisions={(rev1, rev2) => {
                          // TODO: Implement revision comparison
                          console.log('Compare revisions:', rev1, rev2);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Equipment */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setEquipmentExpanded(!equipmentExpanded)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-750 transition"
                  >
                    <span className="text-gray-400 text-lg">{equipmentExpanded ? '▼' : '▶'}</span>
                    <h2 className="text-xl font-bold">Equipment</h2>
                  </button>

                  {equipmentExpanded && (
                    <div className="p-6 pt-0">
                      <SectionList
                        projectId={currentProject.id}
                        sections={sections}
                        onAddSection={() => setShowAddSectionDialog(true)}
                        onEditSection={handleEditSection}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'output' && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Print-Ready Output Editor</h2>
                <p className="text-gray-400">
                  Phase 4: Print-ready output editor coming soon...
                </p>
              </div>
            )}
          </div>

          {/* Add Section Dialog */}
          <AddSectionDialog
            isOpen={showAddSectionDialog}
            onClose={() => setShowAddSectionDialog(false)}
            projectId={currentProject.id}
            projectDisciplines={JSON.parse(currentProject.disciplines || '[]') as Discipline[]}
          />

          {/* Edit Section Dialog */}
          <EditSectionDialog
            isOpen={showEditSectionDialog}
            onClose={handleCloseEditDialog}
            section={sectionToEdit}
            projectDisciplines={JSON.parse(currentProject.disciplines || '[]') as Discipline[]}
          />

          {/* Template Manager Dialog */}
          <TemplateManagerDialog
            isOpen={showTemplateManager}
            onClose={() => setShowTemplateManager(false)}
          />
        </main>
      </div>
    );
  }

  // Show project list
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              title={parentProjectId ? "Back to Project" : "Back to Projects"}
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">ShowStack:Prep</h1>
            <span className="text-sm text-gray-400">Equipment Orders & Specifications</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNewProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition"
            >
              + New Shop Order
            </button>
            <button
              onClick={handleHomeClick}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              title="Home (Projects)"
            >
              🏠
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {allProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold mb-2">No Shop Orders Yet</h2>
              <p className="text-gray-400 mb-6">
                Create your first equipment order to get started
              </p>
              <button
                onClick={handleNewProject}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition"
              >
                Create First Shop Order
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                All Projects ({allProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProjects.map((project) => (
                  <PrepProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <NewPrepProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onProjectCreated={handleProjectCreated}
        parentProjectId={parentProjectId}
      />
    </div>
  );
}
