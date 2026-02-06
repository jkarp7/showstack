# Claude Code Quick Start - ShowStack:Production

**For:** Continuing development with Claude Code  
**Current Status:** POC validated, ready for Phase 1  
**Branch:** `develop`

---

## 🎯 Current State

✅ **Completed:**

- POC proof-of-concept working (virtual grid at 60 FPS)
- Complete technical specification
- Pricing strategy and business plan
- GitHub repository set up (public)
- `develop` branch created

🚧 **Next Up:**

- Phase 1: Electron app shell + SQLite database (Weeks 1-4)

---

## 📚 Essential Documents in Repo

### **Primary References (Read These First)**

1. **`docs/technical-spec.md`** - Complete feature specifications
   - All 6 major feature areas
   - Database schema (use this!)
   - Architecture decisions

2. **`docs/dev-setup.md`** - Development environment
   - Tech stack details
   - Project structure
   - Testing strategies

3. **`proof-of-concept/`** - Working reference implementation
   - Virtual grid (copy this approach)
   - React components (reuse these)
   - Performance optimizations (keep these)

4. **`PHASE_1_DEVELOPMENT_GUIDE.md`** - Week-by-week tasks
   - Detailed implementation steps
   - Code examples
   - Success criteria

---

## 🚀 Phase 1 Overview (Your Current Focus)

### **Goal:** Electron desktop app with SQLite database

**Timeline:** 4 weeks (can go faster with Claude Code!)

**Key Milestones:**

1. Week 1: Electron shell running with POC embedded
2. Week 2: SQLite database with full schema
3. Week 3: IPC connecting renderer to database
4. Week 4: Testing with 10,000+ fixtures

---

## 🛠️ Tech Stack (From Specs)

```javascript
// Desktop App
Electron 27+
Node.js 20+
better-sqlite3 (database)

// Frontend
React 18+
TypeScript 5+
Zustand (state)
Tailwind CSS + Radix UI
Vite (build)

// Key Dependencies
electron-vite (bundler)
electron-builder (packager)
uuid (IDs)
```

---

## 📁 Project Structure to Create

```
showstack-production/
├── src/
│   ├── main/              # Electron main (Node.js)
│   │   ├── index.ts      # Entry point
│   │   ├── window.ts     # Window management
│   │   ├── database/     # SQLite layer
│   │   │   ├── index.ts
│   │   │   ├── schema.ts
│   │   │   └── queries/
│   │   │       └── fixtures.ts
│   │   └── ipc/          # IPC handlers
│   │       └── fixtures.ts
│   │
│   ├── preload/          # Preload scripts
│   │   └── index.ts     # Expose APIs
│   │
│   └── renderer/        # React (copy from POC)
│       └── src/
│           ├── App.tsx
│           ├── components/
│           ├── stores/
│           └── types/
│
├── resources/           # App icons
├── electron.vite.config.ts
└── electron-builder.yml
```

---

## 💾 Database Schema (From Technical Spec)

**Key Tables:**

```sql
-- Projects (shows)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  venue TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- Fixtures (main data)
CREATE TABLE fixtures (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  position TEXT,
  unit_number INTEGER,
  type TEXT,
  purpose TEXT,
  channel TEXT,
  dimmer TEXT,
  circuit TEXT,
  phase TEXT CHECK(phase IN ('A', 'B', 'C')),
  wattage REAL,
  color TEXT,
  gobo TEXT,
  location TEXT,
  notes TEXT,
  custom_fields TEXT, -- JSON
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

**See `docs/technical-spec.md` for complete schema with all fields!**

---

## 🎨 UI/UX Guidelines (From POC)

**Keep these patterns from POC:**

- Dark theme (bg-gray-900)
- Virtual scrolling for performance
- In-cell editing (click → edit → Tab/Enter)
- Multi-select (Click, Shift+Click, Cmd+Click)
- Clean, minimal toolbar
- Status bar at bottom

**Don't change:**

- Grid performance optimizations (React.memo, virtualization)
- Keyboard navigation
- Cell editing UX

**Can improve:**

- Add sorting controls
- Add filter UI
- Add column management
- Add keyboard shortcuts legend

---

## 🔧 Development Workflow

### **1. Start Each Session**

```bash
git checkout develop
git pull origin develop
npm run dev
```

### **2. Make Changes**

- Work in feature branches: `git checkout -b feature/electron-setup`
- Test frequently: `npm run dev`
- Commit often: `git commit -m "Add electron window management"`

### **3. Push to GitHub**

```bash
git push origin feature/electron-setup
# Create PR on GitHub
# Merge to develop when ready
```

---

## ✅ Phase 1 Success Criteria

**Week 1 (Electron Shell):**

- [ ] `npm run dev` launches Electron window
- [ ] POC UI visible in Electron
- [ ] Hot reload working
- [ ] No console errors

**Week 2 (Database):**

- [ ] SQLite database created on app start
- [ ] Schema matches technical spec
- [ ] Can insert/query fixtures via SQL
- [ ] Database file persists in user data folder

**Week 3 (IPC Integration):**

- [ ] Renderer can call window.api.fixtures.getAll()
- [ ] Add fixture → saves to database
- [ ] Edit fixture → updates database
- [ ] Delete fixture → removes from database
- [ ] Data survives app restart

**Week 4 (Testing):**

- [ ] Load 10,000 fixtures in <2 seconds
- [ ] Scroll maintains 60 FPS
- [ ] Edit latency <100ms
- [ ] No memory leaks
- [ ] Can build production app

---

## 🎯 What to Build First (Priority Order)

### **Immediate (This Session)**

1. Set up Electron project structure
2. Install dependencies (electron, electron-vite, better-sqlite3)
3. Create basic main process (src/main/index.ts)
4. Create window (src/main/window.ts)
5. Test Electron launches

### **Next Session**

1. Copy POC code to src/renderer/
2. Configure electron-vite for renderer
3. Test POC loads in Electron window

### **Following Sessions**

1. Create database schema
2. Create IPC handlers
3. Connect renderer to database
4. Test CRUD operations

**See `PHASE_1_DEVELOPMENT_GUIDE.md` for detailed tasks!**

---

## 📝 Code Guidelines

**TypeScript:**

- Strict mode enabled
- No `any` types
- Explicit return types
- Descriptive names

**React:**

- Functional components only
- Use hooks (useState, useEffect, useCallback)
- Memoize list items (React.memo)
- Zustand for global state

**Performance:**

- Virtual scrolling for lists >100 items
- Debounce search/filter inputs
- Lazy load heavy components
- Keep 60 FPS always

---

## 🐛 Common Issues & Solutions

**"better-sqlite3 won't build"**

```bash
npm rebuild better-sqlite3 --build-from-source
```

**"Electron window blank"**

- Check console for errors (Ctrl+Shift+I in Electron)
- Verify preload script path is correct
- Check VITE_DEV_SERVER_URL is set

**"IPC not working"**

- Verify contextBridge in preload
- Check handler registered in main
- Console.log both sides to debug

---

## 📞 Questions to Ask

When you need help, provide:

1. **What you're trying to do** (e.g., "Set up SQLite database")
2. **What you tried** (code snippet)
3. **What happened** (error message or unexpected behavior)
4. **What you expected** (desired outcome)

---

## 🎯 Key Principles

1. **Start simple** - Get basic version working first
2. **Test incrementally** - Don't write a lot without testing
3. **Refer to POC** - It's proven to work
4. **Follow the spec** - Database schema is already designed
5. **Keep performance in mind** - 60 FPS is non-negotiable

---

## 🚀 Ready to Start!

**First command:**

```bash
cd ~/showstack
git checkout develop
code .
```

Then follow `PHASE_1_DEVELOPMENT_GUIDE.md` step by step.

**Let's build ShowStack:Production! 🎭💡**
