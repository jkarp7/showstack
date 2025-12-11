# Phase 1 Development Guide - Electron App Shell & Database

**Timeline:** Weeks 1-4 (Months 1-2)  
**Goal:** Migrate POC to Electron desktop app with SQLite persistence

---

## 🎯 Phase 1 Objectives

By end of Phase 1, you should have:
- ✅ Electron desktop app running
- ✅ POC virtual grid embedded and working
- ✅ SQLite database with full schema
- ✅ CRUD operations for fixtures
- ✅ Data persists between sessions
- ✅ Performance maintained (60 FPS with 10k fixtures)

---

## 📁 Project Structure to Create

```
showstack-production/
├── package.json                 # Root dependencies
├── electron.vite.config.ts     # Vite config for Electron
├── electron-builder.yml        # Build configuration
│
├── src/
│   ├── main/                   # Electron main process (Node.js)
│   │   ├── index.ts           # Main entry point
│   │   ├── window.ts          # Window management
│   │   ├── database/          # SQLite layer
│   │   │   ├── index.ts      # Database connection
│   │   │   ├── schema.ts     # Table definitions
│   │   │   ├── migrations/   # Migration files
│   │   │   └── queries/      # SQL query functions
│   │   │       ├── fixtures.ts
│   │   │       ├── projects.ts
│   │   │       └── ...
│   │   └── ipc/              # IPC handlers
│   │       ├── fixtures.ts   # Fixture CRUD handlers
│   │       └── projects.ts   # Project handlers
│   │
│   ├── preload/              # Preload scripts
│   │   └── index.ts         # Expose APIs to renderer
│   │
│   └── renderer/            # React app (from POC)
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/  # Copy from POC
│       │   ├── hooks/
│       │   │   ├── useFixtures.ts    # IPC wrapper
│       │   │   └── useDatabase.ts    # Database hooks
│       │   ├── stores/
│       │   │   └── fixtureStore.ts   # Update for IPC
│       │   └── types/
│       │       └── index.ts          # Update with full types
│       ├── index.html
│       └── vite.config.ts
│
├── resources/               # App resources
│   ├── icon.icns           # Mac icon
│   ├── icon.ico            # Windows icon
│   └── icon.png            # Linux icon
│
└── out/                    # Build output (gitignored)
```

---

## 🔧 Week 1: Electron Setup

### **Task 1.1: Initialize Electron Project**

**Install dependencies:**
```bash
npm install --save-dev electron electron-builder electron-vite
npm install --save better-sqlite3
npm install --save-dev @types/better-sqlite3
```

**Create `electron.vite.config.ts`:**
```typescript
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
});
```

**Update root `package.json`:**
```json
{
  "name": "showstack-production",
  "version": "0.1.0",
  "main": "out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "build:win": "npm run build && electron-builder --win",
    "build:mac": "npm run build && electron-builder --mac",
    "build:linux": "npm run build && electron-builder --linux"
  }
}
```

### **Task 1.2: Create Main Process**

**`src/main/index.ts`:**
```typescript
import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { createWindow } from './window';
import { initDatabase } from './database';

// Disable hardware acceleration on Linux
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;

app.on('ready', async () => {
  // Initialize database
  await initDatabase();
  
  // Create main window
  mainWindow = createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});
```

**`src/main/window.ts`:**
```typescript
import { BrowserWindow } from 'electron';
import { join } from 'path';

export function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Maximize on start
  window.maximize();
  window.show();

  // Load renderer
  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools();
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}
```

### **Task 1.3: Create Preload Script**

**`src/preload/index.ts`:**
```typescript
import { contextBridge, ipcRenderer } from 'electron';
import { Fixture } from '../renderer/src/types';

// Expose APIs to renderer
contextBridge.exposeInMainWorld('api', {
  // Fixture operations
  fixtures: {
    getAll: () => ipcRenderer.invoke('fixtures:getAll'),
    create: (fixture: Partial<Fixture>) => ipcRenderer.invoke('fixtures:create', fixture),
    update: (id: string, updates: Partial<Fixture>) => ipcRenderer.invoke('fixtures:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('fixtures:delete', id),
    deleteMultiple: (ids: string[]) => ipcRenderer.invoke('fixtures:deleteMultiple', ids),
  },
  
  // Project operations (future)
  projects: {
    getCurrent: () => ipcRenderer.invoke('projects:getCurrent'),
    create: (name: string) => ipcRenderer.invoke('projects:create', name),
  }
});

// TypeScript declaration
export interface ElectronAPI {
  fixtures: {
    getAll: () => Promise<Fixture[]>;
    create: (fixture: Partial<Fixture>) => Promise<Fixture>;
    update: (id: string, updates: Partial<Fixture>) => Promise<Fixture>;
    delete: (id: string) => Promise<void>;
    deleteMultiple: (ids: string[]) => Promise<void>;
  };
  projects: {
    getCurrent: () => Promise<any>;
    create: (name: string) => Promise<any>;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
```

### **Task 1.4: Migrate POC to Renderer**

1. Copy entire `proof-of-concept/src/` to `src/renderer/src/`
2. Copy `proof-of-concept/index.html` to `src/renderer/`
3. Copy all config files (tsconfig, tailwind, etc.)
4. Update imports to use IPC instead of mock data (next week)

**Test it works:**
```bash
npm run dev
```

Should open Electron window with POC running!

---

## 🗄️ Week 2: SQLite Database

### **Task 2.1: Database Schema**

**`src/main/database/schema.ts`:**
```typescript
export const SCHEMA = `
  -- Projects table
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    venue TEXT,
    dates TEXT,
    producer TEXT,
    designer TEXT,
    status TEXT DEFAULT 'active',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Fixtures table
  CREATE TABLE IF NOT EXISTS fixtures (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    
    -- Position & Identification
    position TEXT,
    unit_number INTEGER,
    type TEXT,
    manufacturer TEXT,
    model TEXT,
    purpose TEXT,
    
    -- Control
    channel TEXT,
    universe INTEGER,
    dmx_address INTEGER,
    mode TEXT,
    
    -- Power
    dimmer TEXT,
    circuit TEXT,
    phase TEXT CHECK(phase IN ('A', 'B', 'C')),
    wattage REAL,
    amperage REAL,
    
    -- Color & Accessories
    color TEXT,
    gobo TEXT,
    template_size TEXT,
    accessories TEXT, -- JSON array
    
    -- Location
    location TEXT,
    position_x REAL,
    position_y REAL,
    position_z REAL,
    
    -- Status
    status TEXT DEFAULT 'active',
    notes TEXT,
    
    -- Custom fields (JSON)
    custom_fields TEXT,
    
    -- Metadata
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_fixtures_project ON fixtures(project_id);
  CREATE INDEX IF NOT EXISTS idx_fixtures_position ON fixtures(project_id, position);
  CREATE INDEX IF NOT EXISTS idx_fixtures_channel ON fixtures(project_id, channel);
  CREATE INDEX IF NOT EXISTS idx_fixtures_location ON fixtures(project_id, location);
`;
```

### **Task 2.2: Database Connection**

**`src/main/database/index.ts`:**
```typescript
import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { SCHEMA } from './schema';

let db: Database.Database | null = null;

export function initDatabase(): void {
  const dbPath = join(app.getPath('userData'), 'showstack.db');
  
  db = new Database(dbPath, {
    verbose: console.log // Log SQL in development
  });
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(SCHEMA);
  
  // Create default project if none exists
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    db.prepare(`
      INSERT INTO projects (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run('default-project', 'Untitled Project', Date.now(), Date.now());
  }
  
  console.log('✅ Database initialized:', dbPath);
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

### **Task 2.3: Fixture Queries**

**`src/main/database/queries/fixtures.ts`:**
```typescript
import { getDatabase } from '../index';
import { Fixture } from '../../../renderer/src/types';
import { v4 as uuidv4 } from 'uuid';

export function getAllFixtures(projectId: string = 'default-project'): Fixture[] {
  const db = getDatabase();
  
  const rows = db.prepare(`
    SELECT * FROM fixtures
    WHERE project_id = ?
    ORDER BY CAST(position AS INTEGER), position
  `).all(projectId);
  
  return rows.map(row => ({
    ...row,
    accessories: row.accessories ? JSON.parse(row.accessories) : [],
    custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : {}
  })) as Fixture[];
}

export function createFixture(
  fixture: Partial<Fixture>,
  projectId: string = 'default-project'
): Fixture {
  const db = getDatabase();
  const id = uuidv4();
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO fixtures (
      id, project_id, position, unit_number, type, purpose,
      channel, dimmer, circuit, color, location, wattage,
      status, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    projectId,
    fixture.position || '',
    fixture.unit || null,
    fixture.type || '',
    fixture.purpose || '',
    fixture.channel || '',
    fixture.dimmer || '',
    fixture.circuit || '',
    fixture.color || '',
    fixture.location || '',
    fixture.wattage || null,
    fixture.status || 'active',
    fixture.notes || '',
    now,
    now
  );
  
  return { id, ...fixture, created_at: now, updated_at: now } as Fixture;
}

export function updateFixture(id: string, updates: Partial<Fixture>): Fixture {
  const db = getDatabase();
  const now = Date.now();
  
  const fields = Object.keys(updates).filter(k => k !== 'id');
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);
  
  const stmt = db.prepare(`
    UPDATE fixtures
    SET ${setClause}, updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(...values, now, id);
  
  return getFixtureById(id);
}

export function deleteFixture(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM fixtures WHERE id = ?').run(id);
}

export function deleteMultipleFixtures(ids: string[]): void {
  const db = getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM fixtures WHERE id IN (${placeholders})`).run(...ids);
}

function getFixtureById(id: string): Fixture {
  const db = getDatabase();
  return db.prepare('SELECT * FROM fixtures WHERE id = ?').get(id) as Fixture;
}
```

### **Task 2.4: IPC Handlers**

**`src/main/ipc/fixtures.ts`:**
```typescript
import { ipcMain } from 'electron';
import * as fixtureQueries from '../database/queries/fixtures';
import { Fixture } from '../../renderer/src/types';

export function registerFixtureHandlers(): void {
  ipcMain.handle('fixtures:getAll', async () => {
    return fixtureQueries.getAllFixtures();
  });
  
  ipcMain.handle('fixtures:create', async (_, fixture: Partial<Fixture>) => {
    return fixtureQueries.createFixture(fixture);
  });
  
  ipcMain.handle('fixtures:update', async (_, id: string, updates: Partial<Fixture>) => {
    return fixtureQueries.updateFixture(id, updates);
  });
  
  ipcMain.handle('fixtures:delete', async (_, id: string) => {
    fixtureQueries.deleteFixture(id);
  });
  
  ipcMain.handle('fixtures:deleteMultiple', async (_, ids: string[]) => {
    fixtureQueries.deleteMultipleFixtures(ids);
  });
}
```

**Update `src/main/index.ts`:**
```typescript
import { registerFixtureHandlers } from './ipc/fixtures';

app.on('ready', async () => {
  await initDatabase();
  registerFixtureHandlers(); // Add this line
  mainWindow = createWindow();
});
```

---

## 🔄 Week 3: Connect Renderer to Database

### **Task 3.1: Update Fixture Store**

**`src/renderer/src/stores/fixtureStore.ts`:**
```typescript
import { create } from 'zustand';
import { Fixture } from '../types';

interface FixtureStore {
  fixtures: Fixture[];
  loading: boolean;
  
  // Actions
  loadFixtures: () => Promise<void>;
  addFixture: (fixture: Partial<Fixture>) => Promise<void>;
  updateFixture: (id: string, updates: Partial<Fixture>) => Promise<void>;
  deleteFixture: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<void>;
}

export const useFixtureStore = create<FixtureStore>((set, get) => ({
  fixtures: [],
  loading: false,
  
  loadFixtures: async () => {
    set({ loading: true });
    const fixtures = await window.api.fixtures.getAll();
    set({ fixtures, loading: false });
  },
  
  addFixture: async (fixture) => {
    const created = await window.api.fixtures.create(fixture);
    set(state => ({ fixtures: [...state.fixtures, created] }));
  },
  
  updateFixture: async (id, updates) => {
    const updated = await window.api.fixtures.update(id, updates);
    set(state => ({
      fixtures: state.fixtures.map(f => f.id === id ? updated : f)
    }));
  },
  
  deleteFixture: async (id) => {
    await window.api.fixtures.delete(id);
    set(state => ({ fixtures: state.fixtures.filter(f => f.id !== id) }));
  },
  
  deleteMultiple: async (ids) => {
    await window.api.fixtures.deleteMultiple(ids);
    set(state => ({ fixtures: state.fixtures.filter(f => !ids.includes(f.id)) }));
  }
}));
```

### **Task 3.2: Load Data on App Start**

**`src/renderer/src/App.tsx`:**
```typescript
import { useEffect } from 'react';
import { useFixtureStore } from './stores/fixtureStore';

export default function App() {
  const { fixtures, loading, loadFixtures } = useFixtureStore();
  
  // Load fixtures on mount
  useEffect(() => {
    loadFixtures();
  }, []);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-white">Loading fixtures...</div>
    </div>;
  }
  
  return (
    // ... rest of your POC UI
  );
}
```

---

## ✅ Week 4: Testing & Polish

### **Task 4.1: Test Performance**

Create test data:
```typescript
// Add button to generate test fixtures
async function generateTestFixtures(count: number) {
  for (let i = 0; i < count; i++) {
    await window.api.fixtures.create({
      position: String(i + 1),
      type: 'Source Four 26°',
      channel: String(101 + i),
      dimmer: `${Math.floor(i / 6) + 1}/${(i % 6) + 1}`,
    });
  }
  loadFixtures();
}
```

Test with 1,000, then 5,000, then 10,000 fixtures.

### **Task 4.2: Verify CRUD Operations**

- [ ] Add fixture → appears in grid
- [ ] Edit fixture → changes saved
- [ ] Delete fixture → removed from grid
- [ ] Close app, reopen → data persists
- [ ] Multi-select delete → all removed

### **Task 4.3: Performance Benchmarks**

- [ ] Load 10,000 fixtures: <2 seconds
- [ ] Scroll 60 FPS maintained
- [ ] Edit cell: <100ms to save
- [ ] Database file size reasonable (~1MB per 1000 fixtures)

---

## 🎯 Success Criteria

By end of Week 4, you should have:

✅ Electron app launches successfully
✅ Virtual grid working in Electron (same as POC)
✅ SQLite database persisting data
✅ All CRUD operations working via IPC
✅ Performance maintained (60 FPS with 10k fixtures)
✅ Data persists between app restarts
✅ No console errors
✅ Can generate test data easily

---

## 📝 Notes for Claude Code

When working on this phase:

1. **Start with Electron setup** - Get the shell running first
2. **Test each piece individually** - Don't move on until each task works
3. **Use the POC as reference** - It's proven to work, don't reinvent
4. **Keep database queries simple** - Optimize later if needed
5. **Log everything during development** - `console.log` is your friend

---

## 🚀 Next: Phase 2 (Weeks 5-8)

After Phase 1 is complete:
- Sorting & filtering
- Auto-complete
- Undo/redo
- CSV import/export

See `docs/technical-spec.md` for Phase 2 details.
