# ShowStack - Development Environment Setup

## Getting Started with the Codebase

**Last Updated:** February 11, 2026

---

## Prerequisites

### Required Software

```bash
# Node.js (version 20.x or higher)
node --version  # Should be v20.x.x or higher
npm --version   # Should be 10.x.x or higher

# Git
git --version

# Code Editor (recommended: VSCode)
code --version
```

### Install Node.js (if needed)

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Or download from: https://nodejs.org/
```

---

## Project Structure

```
showstack/
├── .github/
│   └── workflows/            # CI/CD pipelines (GitHub Actions)
├── apps/
│   └── desktop/
│       └── src/
│           ├── main/         # Electron main process (Node.js)
│           │   ├── index.ts  # Main entry point
│           │   ├── database/ # SQLite database layer (two-database architecture)
│           │   │   ├── appSchema.ts     # App database schema
│           │   │   ├── projectSchema.ts # Project database schema
│           │   │   └── index.ts         # Database initialization & migrations
│           │   ├── ipc/      # IPC handlers (fixture, prep, files, settings, etc.)
│           │   ├── services/ # Backend services (backup, crash recovery, sentry, etc.)
│           │   ├── errors/   # Error handling (ErrorHandler, error types)
│           │   └── utils/    # Utilities (logger, config, health checker)
│           ├── renderer/     # React app (Browser)
│           │   └── src/
│           │       ├── App.tsx
│           │       ├── components/  # React components by domain
│           │       ├── hooks/       # Custom React hooks
│           │       ├── store/       # Zustand state management
│           │       ├── types/       # TypeScript type definitions
│           │       ├── constants/   # Design tokens and theme
│           │       └── utils/       # Shared utility functions
│           └── preload/      # Electron preload scripts
├── packages/
│   └── shared/               # Shared types and Zod schemas
│       └── src/
│           └── schemas/      # Zod validation schemas
├── resources/                # App resources (icons, assets)
├── docs/                     # Documentation
│   ├── development/          # Architecture and setup guides
│   ├── renovation/           # Renovation phase docs
│   └── features/             # Feature specifications
├── eslint.config.js          # ESLint 9 flat config
├── .prettierrc               # Prettier configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── electron-builder.yml      # Electron builder config
├── electron.vite.config.ts   # electron-vite configuration
└── package.json              # Dependencies and scripts
```

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jkarp7/showstack.git
cd showstack
```

### 2. Install Dependencies

```bash
npm install
```

This will install:

- Electron 39+
- React 19
- TypeScript 5.9+
- electron-vite (build tool)
- Tailwind CSS
- Zustand (state management)
- better-sqlite3 (database)
- PowerSync + Supabase (cloud sync)
- Zod (runtime validation)
- Sentry (error monitoring)
- Husky + lint-staged (pre-commit hooks)
- And all other dependencies

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Development
NODE_ENV=development

# Optional: Cloud Sync
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_POWERSYNC_URL=

# Optional: Error Monitoring
SENTRY_DSN=

# Optional: Telemetry
VITE_POSTHOG_KEY=
```

---

## Development Commands

### Start Development Server

```bash
npm run dev
```

This starts:

1. electron-vite dev server for React (hot reload)
2. Electron app in development mode

### Build for Production

```bash
# Build with electron-vite
npm run build

# Create distributable
npm run dist

# Platform-specific builds
npm run dist:mac
npm run dist:win
npm run dist:linux
```

### Run Tests

```bash
# Run all tests (watch mode)
npm test

# Run all tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Test coverage
npm run test:coverage
```

### Linting & Formatting

```bash
# ESLint
npm run lint
npm run lint:fix

# Prettier
npm run format
npm run format:check

# TypeScript type checking
npx tsc --noEmit
```

Pre-commit hooks (Husky + lint-staged) automatically run ESLint and Prettier on staged files.

---

## Key Dependencies

### Production Dependencies

```json
{
  "electron": "^39.2.1",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "zustand": "^5.0.8",
  "better-sqlite3": "^12.6.2",
  "@powersync/web": "^1.32.0",
  "@supabase/supabase-js": "^2.95.2",
  "@sentry/electron": "^7.7.1",
  "puppeteer": "^24.34.0",
  "react-router-dom": "^6.28.0",
  "lucide-react": "^0.460.0",
  "clsx": "^2.1.1",
  "uuid": "^13.0.0"
}
```

### Development Dependencies

```json
{
  "typescript": "^5.9.3",
  "electron-vite": "^4.0.1",
  "vite": "^7.2.2",
  "electron-builder": "^26.0.12",
  "eslint": "^9.39.2",
  "typescript-eslint": "^8.54.0",
  "prettier": "^3.8.1",
  "vitest": "^3.2.4",
  "@testing-library/react": "^16.3.1",
  "husky": "^9.1.7",
  "lint-staged": "^16.2.7",
  "tailwindcss": "^3.4.1"
}
```

---

## Database

The app uses a **two-database architecture** with better-sqlite3 (WAL mode):

- **App Database** (`showstack-app.db`): Licenses, settings, layout templates — never exported
- **Project Database** (`showstack-projects.db`): All project data (fixtures, shop orders, infrastructure) — fully exportable

### Schema Locations

- App schema: `apps/desktop/src/main/database/appSchema.ts`
- Project schema: `apps/desktop/src/main/database/projectSchema.ts`

### Database Management

Migrations run automatically on app startup. The database is initialized on first run — no manual setup required.

```bash
# If you need to rebuild better-sqlite3 for Electron
npx electron-rebuild -f -w better-sqlite3

# Rebuild for vitest (after electron-rebuild breaks it)
npm rebuild better-sqlite3
```

---

## UI Development with Tailwind

### Tailwind Configuration

See `tailwind.config.js` at the project root:

```javascript
export default {
  darkMode: 'class',
  content: [
    'apps/desktop/src/renderer/index.html',
    'apps/desktop/src/renderer/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
```

### Component Library

We use Radix UI for accessible, unstyled components:

```tsx
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tabs from '@radix-ui/react-tabs';
```

Style with Tailwind classes.

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

```typescript
// apps/desktop/src/renderer/src/components/fixture/__tests__/example.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });
});
```

Tests are colocated with source code in `__tests__/` directories.

**Current:** 1,520+ tests across 53 files, 70%+ coverage.

---

## Debugging

### VSCode Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "runtimeArgs": ["--inspect=5858", "."],
      "preLaunchTask": "npm: build"
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}/apps/desktop/src/renderer",
      "timeout": 30000
    }
  ]
}
```

### Chrome DevTools

Renderer process automatically opens DevTools in development mode.

Main process debugging:

```bash
# Start with inspect flag
npm run dev -- --inspect=5858
```

Then attach Chrome DevTools to `chrome://inspect`.

---

## Platform-Specific Considerations

### macOS Development

```bash
# Code signing (required for distribution)
security find-identity -v -p codesigning
```

### Windows Development

```bash
# Windows requires Visual Studio Build Tools
npm install --global --production windows-build-tools

# Or install Visual Studio Community with C++ tools
```

### Linux Development

```bash
# Install build dependencies
sudo apt-get install build-essential libsqlite3-dev
```

---

## Building & Distribution

### Create Installer

```bash
# Build for current platform
npm run dist

# Build for specific platform
npm run dist:mac
npm run dist:win
npm run dist:linux

# Build for all platforms
npm run dist:all
```

Output: `dist/` folder with installers

---

## Troubleshooting

### Common Issues

**Issue:** `better-sqlite3` build fails

```bash
# Rebuild for Electron
npx electron-rebuild -f -w better-sqlite3

# Rebuild for vitest (if electron-rebuild broke it)
npm rebuild better-sqlite3
```

**Issue:** Hot reload not working

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

**Issue:** Database locked

```bash
# Check for orphaned Electron processes
ps aux | grep electron
kill -9 <PID>
```

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for:

- Branch strategy and commit conventions
- Code standards (TypeScript, React, testing)
- Pull request process
- Linting and formatting requirements

---

## Learning Resources

### Electron

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-vite](https://electron-vite.org/)
- [Electron Builder](https://www.electron.build/)

### React & TypeScript

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tailwind CSS

- [Tailwind Docs](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)

### State Management

- [Zustand](https://github.com/pmndrs/zustand)

### Database

- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [SQLite Docs](https://www.sqlite.org/docs.html)

### Cloud Sync

- [PowerSync](https://www.powersync.com/)
- [Supabase](https://supabase.com/)

---

**Ready to start building?** Run `npm run dev` and the Electron app will launch with hot reload!
