# Quick Start Guide - ShowStack:Production POC

Get the proof-of-concept running in 5 minutes!

## Prerequisites

You need:
- Node.js 20+ ([download here](https://nodejs.org/))
- A terminal/command prompt
- A modern web browser

## Step 1: Navigate to POC Directory

```bash
cd proof-of-concept
```

## Step 2: Install Dependencies

```bash
npm install
```

This will take 1-2 minutes to download all packages.

## Step 3: Start Development Server

```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 423 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

## Step 4: Open in Browser

Open http://localhost:5173 in your browser.

You should see the ShowStack:Production interface with 1,000 fixtures loaded!

## What to Try

### 1. Scroll Performance
- Scroll up and down rapidly
- Should maintain 60 FPS (check browser DevTools Performance tab)
- Only ~50 rows rendered at a time (inspect DOM)

### 2. In-Cell Editing
- Click any cell to edit
- Type new value
- Press Tab to move to next cell
- Press Enter to save and move down
- Press Escape to cancel

### 3. Multi-Select
- **Click** a row to select it
- **Shift+Click** another row to select range
- **Cmd/Ctrl+Click** to toggle individual rows
- **Checkbox in header** to select all

### 4. Add/Delete Fixtures
- Click "Add Fixture" button
- Select one or more rows
- Click "Delete Selected"

### 5. Check Performance
Open Chrome DevTools:
1. Go to Performance tab
2. Click Record
3. Scroll rapidly for 5 seconds
4. Stop recording
5. Check FPS graph - should be solid 60 FPS

## What's Loaded

The POC starts with 1,000 mock fixtures:
- Position 1-1000
- Various fixture types (Source Four, Rogue, Chauvet)
- Channels 101-1100
- Dimmers 1/1 through 167/6
- Circuits C-1 through C-1000
- Various locations (FOH, 1st Electric, etc.)

## Troubleshooting

### Port 5173 already in use
```bash
# Kill the process
# macOS/Linux:
lsof -ti:5173 | xargs kill -9

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change port in vite.config.ts
```

### npm install fails
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Page is blank
- Check browser console for errors (F12)
- Try a different browser
- Clear browser cache (Cmd/Ctrl+Shift+R)

## Testing with More Data

Want to test with 10,000 fixtures?

Edit `src/store/fixtureStore.ts`:

```typescript
// Change this line:
fixtures: generateMockFixtures(1000),

// To:
fixtures: generateMockFixtures(10000),
```

Save and the app will reload with 10,000 fixtures!

## Next Steps

Once you've tested the POC:
1. Review the code in `src/components/`
2. Check out the Zustand store in `src/store/`
3. Read the main specification docs
4. Start planning Phase 1 development!

## Keyboard Shortcuts (POC)

- **Click:** Select row
- **Shift+Click:** Select range
- **Cmd/Ctrl+Click:** Toggle row
- **Tab:** Next cell (when editing)
- **Enter:** Next row (when editing)
- **Escape:** Cancel edit

## Build for Production

```bash
npm run build
npm run preview
```

This creates an optimized production build and previews it.

---

**Questions?** Check the main README.md or the specification documents!
