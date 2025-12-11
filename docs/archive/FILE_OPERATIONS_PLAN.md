# ShowStack File Operations Implementation Plan

## Overview

Implement Save/Open/New file operations for ShowStack that work across all modules (Production, Prep, Manager). Files will use a `.showstack` extension and contain all project data.

## File Format

### .showstack File Structure
```json
{
  "version": "1.0.0",
  "metadata": {
    "appVersion": "0.1.0-alpha",
    "created": 1234567890,
    "modified": 1234567890,
    "createdBy": "ShowStack:Production"
  },
  "project": {
    "id": "uuid",
    "name": "My Show",
    "description": "Broadway Production",
    "logo_path": "path/to/logo.png",
    "enabled_modules": ["production", "prep", "manager"]
  },
  "data": {
    "fixtures": [...],
    "preferences": {...},
    // Future: focus_charts, labels, work_notes, etc.
  }
}
```

###Alternative: SQLite Export
- Export entire SQLite database as the .showstack file
- Simpler: just copy the database file
- Native SQL.js support for export/import
- Preserves all relationships and indexes

**Recommendation:** Use SQLite export for v1, add JSON export for interoperability in v2

## Architecture

### 1. File Service (Main Process)
**Location:** `src/main/services/fileService.ts`

**Responsibilities:**
- Handle Electron dialog operations (open, save, save-as)
- File I/O operations (read, write, validate)
- Export current database to file
- Import file to database
- Validate file format/version compatibility

**API Methods:**
```typescript
interface FileService {
  // Dialog operations
  showOpenDialog(): Promise<string | null>
  showSaveDialog(defaultName?: string): Promise<string | null>

  // File operations
  exportProject(filePath: string, projectId: string): Promise<void>
  importProject(filePath: string): Promise<ProjectImportResult>
  createNewProject(): Promise<string> // Returns new project ID

  // Validation
  validateFile(filePath: string): Promise<FileValidationResult>
}

interface ProjectImportResult {
  success: boolean
  projectId?: string
  error?: string
  warnings?: string[]
}
```

### 2. IPC Handlers (Main Process)
**Location:** `src/main/ipc/files.ts`

**Handlers:**
```typescript
ipcMain.handle('file:open', async () => {
  const filePath = await fileService.showOpenDialog()
  if (!filePath) return null

  const result = await fileService.importProject(filePath)
  return result
})

ipcMain.handle('file:save', async (_, projectId, filePath?) => {
  if (!filePath) {
    filePath = await fileService.showSaveDialog()
  }
  if (!filePath) return null

  await fileService.exportProject(filePath, projectId)
  return filePath
})

ipcMain.handle('file:new', async () => {
  // Confirm if current project has unsaved changes
  const projectId = await fileService.createNewProject()
  return projectId
})
```

### 3. File State Management (Renderer)
**Location:** `src/renderer/src/store/fileStore.ts`

**State:**
```typescript
interface FileStore {
  currentFilePath: string | null
  isDirty: boolean // Has unsaved changes
  projectName: string

  // Actions
  openFile: () => Promise<void>
  saveFile: () => Promise<void>
  saveFileAs: () => Promise<void>
  newFile: () => Promise<void>
  setDirty: (dirty: boolean) => void
  setFilePath: (path: string | null) => void
}
```

### 4. UI Components

#### File Menu (All Modules)
**Location:** Add to each module's header

```tsx
<FileMenu
  onNew={handleNew}
  onOpen={handleOpen}
  onSave={handleSave}
  onSaveAs={handleSaveAs}
  currentFileName={fileName}
  isDirty={isDirty}
/>
```

#### Unsaved Changes Dialog
**Location:** `src/renderer/src/components/common/UnsavedChangesDialog.tsx`

Shown when:
- User tries to open a new file with unsaved changes
- User tries to create a new project with unsaved changes
- User tries to close the app with unsaved changes

## Implementation Steps

### Phase 1: Core Infrastructure (High Priority)
1. **Create FileService** (Main Process)
   - Implement SQLite database export
   - Implement file dialogs (open/save)
   - Add file validation

2. **Create IPC Handlers**
   - Expose file operations to renderer
   - Handle errors gracefully

3. **Create FileStore** (Renderer)
   - Track current file path
   - Track dirty state
   - Provide save/open/new actions

4. **Update Preload API**
   - Expose file operations
   - Type definitions

### Phase 2: UI Integration
5. **Create File Menu Component**
   - New/Open/Save/Save As buttons
   - Show current filename
   - Visual indicator for unsaved changes (*)

6. **Integrate into Production Module**
   - Add File Menu to header
   - Wire up file operations
   - Track dirty state on fixture changes

7. **Create Unsaved Changes Dialog**
   - "Save changes before..." prompt
   - Save / Don't Save / Cancel options

8. **Add Window Close Handler**
   - Prompt to save on app quit if dirty
   - Prevent data loss

### Phase 3: Enhanced Features
9. **Auto-Save**
   - Periodic auto-save (every 5 minutes)
   - Save to temporary location
   - Restore on crash recovery

10. **Recent Files**
    - Track recently opened files
    - Show in File menu
    - Quick open shortcuts

11. **File Format Versioning**
    - Handle migrations between versions
    - Backward compatibility warnings

## File Locations

### User Data Directory
```
~/Library/Application Support/ShowStack/  (macOS)
%APPDATA%/ShowStack/                      (Windows)
~/.config/ShowStack/                       (Linux)
```

### Files:
```
showstack.db              - Current working database
autosave.db               - Auto-save backup
recent-files.json         - Recent files list
preferences.json          - App preferences
```

## Dirty State Tracking

### When to Set Dirty = true:
- Fixture added/modified/deleted
- Column visibility/order changed
- User column definitions changed
- Any preference changed
- Bulk edit operations

### When to Set Dirty = false:
- After successful save
- After opening a file
- After creating new file

### Implementation:
```typescript
// In fixtureStore
addFixture: async (fixture) => {
  // ... add fixture logic
  useFileStore.getState().setDirty(true)
}

updateFixture: async (id, updates) => {
  // ... update logic
  useFileStore.getState().setDirty(true)
}
```

## Error Handling

### File Not Found
```
"The file 'MyShow.showstack' could not be found.
It may have been moved or deleted."
[OK]
```

### Incompatible Version
```
"This file was created with a newer version of ShowStack.
Please update your application to open this file."
[Update] [Cancel]
```

### Corrupted File
```
"The file appears to be corrupted and cannot be opened.
Would you like to try recovering data?"
[Attempt Recovery] [Cancel]
```

## Keyboard Shortcuts

- `Cmd/Ctrl + N` - New File
- `Cmd/Ctrl + O` - Open File
- `Cmd/Ctrl + S` - Save File
- `Cmd/Ctrl + Shift + S` - Save As
- `Cmd/Ctrl + W` - Close File (with save prompt)

## Testing Plan

### Unit Tests
- FileService export/import
- File validation
- Version compatibility

### Integration Tests
- Open file → Verify data loaded
- Save file → Verify data persisted
- Dirty state tracking
- Unsaved changes prompt

### Manual Tests
- Create project → Add fixtures → Save → Close → Reopen
- Modify data → Don't save → Confirm data not persisted
- Save As with different name
- Open corrupted file

## Migration Strategy

### Existing Users
Since this is alpha, existing database files will need migration:

1. On first launch after this update:
   - Detect existing `showstack.db`
   - Create backup as `showstack-backup-[date].db`
   - Set current file path to `Untitled.showstack` (unsaved)
   - Prompt: "Would you like to save your current project?"

2. User workflow:
   - Save current work to a .showstack file
   - Future sessions will use file-based workflow

## Future Enhancements

### Export Formats
- Export to CSV (fixture list)
- Export to PDF (paperwork)
- Export to LightWright format
- Export to Vectorworks

### Cloud Sync
- Auto-save to cloud storage
- Multi-device sync
- Collaboration features

### File Locking
- Prevent multiple instances editing same file
- Lock file mechanism
- Conflict resolution

## Dependencies

### Electron Modules
- `dialog` - For file dialogs
- `app` - For user data path
- `fs` - For file I/O

### Libraries
- `sql.js` - Already in use, supports export/import
- No additional dependencies needed!

## Timeline Estimate

- **Phase 1 (Core Infrastructure):** 3-4 hours
- **Phase 2 (UI Integration):** 2-3 hours
- **Phase 3 (Enhanced Features):** 4-5 hours
- **Testing & Polish:** 2 hours

**Total:** ~12-15 hours of development time

## Priority Level

**CRITICAL** - This is foundational infrastructure needed before:
- Multi-project support
- Sharing files between users
- Version control/backup
- Production use

Without file operations, users lose all work when closing the app.
