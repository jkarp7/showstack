# ShowStack:Production - Development Environment Setup

## Getting Started with the Codebase

**Last Updated:** November 16, 2025

---

## 📋 Prerequisites

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

## 🏗️ Project Structure

```
showstack-production/
├── .github/
│   └── workflows/          # CI/CD pipelines
├── src/
│   ├── main/              # Electron main process (Node.js)
│   │   ├── index.ts       # Main entry point
│   │   ├── window.ts      # Window management
│   │   ├── database/      # SQLite database layer
│   │   │   ├── schema.ts  # Database schema
│   │   │   ├── migrations/ # Database migrations
│   │   │   └── queries.ts # SQL queries
│   │   ├── integrations/  # External integrations
│   │   │   ├── eos/       # ETC Eos OSC integration
│   │   │   ├── vectorworks/ # VW file parsing
│   │   │   └── printers/  # Label printer drivers
│   │   └── ipc/           # IPC handlers
│   ├── renderer/          # React app (Browser)
│   │   ├── src/
│   │   │   ├── App.tsx    # Main app component
│   │   │   ├── components/ # React components
│   │   │   │   ├── DataGrid/
│   │   │   │   ├── PowerSystem/
│   │   │   │   ├── LabelDesigner/
│   │   │   │   ├── Reports/
│   │   │   │   └── ...
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── stores/    # Zustand state management
│   │   │   ├── lib/       # Utility libraries
│   │   │   ├── types/     # TypeScript type definitions
│   │   │   └── styles/    # Global styles, Tailwind config
│   │   ├── index.html     # HTML entry point
│   │   └── vite.config.ts # Vite configuration
│   └── preload/           # Electron preload scripts
│       └── index.ts       # Expose APIs to renderer
├── resources/             # App resources (icons, assets)
├── scripts/               # Build and utility scripts
├── tests/                 # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                  # Documentation
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
├── electron-builder.yml  # Electron builder config
└── README.md             # Project overview
```

---

## 🚀 Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_ORG/showstack-production.git
cd showstack-production
```

### 2. Install Dependencies

```bash
npm install
```

This will install:

- Electron
- React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
- better-sqlite3 (database)
- Vite (build tool)
- And all other dependencies

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Development
NODE_ENV=development
VITE_APP_NAME=ShowStack:Production
VITE_APP_VERSION=1.0.0-alpha

# Database
DB_PATH=~/Documents/ShowStack/Projects/

# Optional: Cloud Sync (for future)
API_URL=http://localhost:3001
API_KEY=

# Optional: Crash Reporting
SENTRY_DSN=
```

---

## 🛠️ Development Commands

### Start Development Server

```bash
npm run dev
```

This starts:

1. Vite dev server for React (hot reload)
2. Electron app in development mode
3. TypeScript compiler in watch mode

### Build for Production

```bash
# Build renderer (React app)
npm run build:renderer

# Build main process
npm run build:main

# Package Electron app
npm run build
```

### Run Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests (requires built app)
npm run test:e2e

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
npm run type-check
```

---

## 📦 Key Dependencies

### Production Dependencies

```json
{
  "electron": "^27.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "zustand": "^4.4.0",
  "better-sqlite3": "^9.0.0",
  "osc": "^2.4.4",
  "uuid": "^9.0.0",
  "@radix-ui/react-*": "^1.0.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

### Development Dependencies

```json
{
  "typescript": "^5.2.0",
  "vite": "^5.0.0",
  "vite-plugin-electron": "^0.14.0",
  "electron-builder": "^24.6.0",
  "@types/react": "^18.2.0",
  "@types/node": "^20.0.0",
  "eslint": "^8.50.0",
  "prettier": "^3.0.0",
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0"
}
```

---

## 🗄️ Database Setup

The app uses SQLite for local storage. Schema is automatically initialized on first run.

### Manual Database Management

```bash
# Open database in SQLite CLI
sqlite3 ~/Documents/ShowStack/Projects/your-project.db

# Run migrations manually
npm run db:migrate

# Seed with sample data (development)
npm run db:seed

# Reset database (careful!)
npm run db:reset
```

### Database Schema Location

See `src/main/database/schema.ts` for the complete schema definition.

---

## 🎨 UI Development with Tailwind

### Tailwind Configuration

Edit `src/renderer/src/styles/tailwind.config.js`:

```javascript
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        secondary: '#60A5FA',
        accent: '#F59E0B',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
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

## 🧪 Testing Strategy

### Unit Tests (Vitest + React Testing Library)

```typescript
// src/renderer/src/components/DataGrid/__tests__/DataGrid.test.tsx
import { render, screen } from '@testing-library/react';
import { DataGrid } from '../DataGrid';

describe('DataGrid', () => {
  it('renders fixture data', () => {
    const fixtures = [
      { position: '1', type: 'Source Four 26°', channel: '101' },
    ];

    render(<DataGrid fixtures={fixtures} />);

    expect(screen.getByText('Source Four 26°')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test main ↔ renderer IPC communication:

```typescript
// tests/integration/database.test.ts
import { test, expect } from 'vitest';
import { Database } from '../../src/main/database';

test('create and retrieve fixture', async () => {
  const db = new Database(':memory:');

  const fixture = await db.fixtures.create({
    position: '1',
    type: 'Source Four 26°',
    channel: '101',
  });

  const retrieved = await db.fixtures.findById(fixture.id);

  expect(retrieved.position).toBe('1');
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/fixture-management.spec.ts
import { test, expect } from '@playwright/test';

test('add new fixture', async ({ page }) => {
  await page.goto('app://');

  await page.click('text=Add Fixture');
  await page.fill('[name="position"]', '1');
  await page.fill('[name="type"]', 'Source Four 26°');
  await page.click('text=Save');

  await expect(page.locator('text=Source Four 26°')).toBeVisible();
});
```

---

## 🐛 Debugging

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
      "preLaunchTask": "npm: build:main"
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}/src/renderer",
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

## 📱 Platform-Specific Considerations

### macOS Development

```bash
# Code signing (required for distribution)
# Get certificate from Apple Developer account
security find-identity -v -p codesigning

# Set in electron-builder.yml
mac:
  identity: "Developer ID Application: Your Name (TEAM_ID)"
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

## 🚢 Building & Distribution

### Create Installer

```bash
# Build for current platform
npm run dist

# Build for specific platform
npm run dist:mac
npm run dist:win
npm run dist:linux

# Build for all platforms (requires macOS for .dmg)
npm run dist:all
```

Output: `dist/` folder with installers

### Electron Builder Configuration

Edit `electron-builder.yml`:

```yaml
appId: com.lytrix.showstack-production
productName: ShowStack Production

directories:
  output: dist
  buildResources: resources

files:
  - '!**/.vscode/*'
  - '!src/*'
  - '!electron.vite.config.{js,ts,mjs,cjs}'
  - '!{.eslintignore,.eslintrc.cjs,.prettierignore,.prettierrc.yaml,dev-app-update.yml,CHANGELOG.md,README.md}'

mac:
  category: public.app-category.productivity
  hardenedRuntime: true
  gatekeeperAssess: false
  icon: resources/icon.icns

win:
  target: nsis
  icon: resources/icon.ico

linux:
  target: AppImage
  category: Utility
  icon: resources/icon.png
```

### Auto-Update Setup

```typescript
// src/main/updater.ts
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();
```

Configure update server in `electron-builder.yml`:

```yaml
publish:
  provider: github
  owner: YOUR_ORG
  repo: showstack-production
```

---

## 🔐 Code Signing & Notarization

### macOS

```bash
# 1. Get Apple Developer ID certificate
# 2. Store credentials in environment

export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"

# 3. Build will automatically sign and notarize
npm run dist:mac
```

### Windows

```bash
# Get code signing certificate (from DigiCert, Sectigo, etc.)
# Store as .pfx file

# Set in environment
export CSC_LINK="path/to/certificate.pfx"
export CSC_KEY_PASSWORD="certificate_password"

# Build will automatically sign
npm run dist:win
```

---

## 📚 Learning Resources

### Electron

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)

### React & TypeScript

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tailwind CSS

- [Tailwind Docs](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)

### State Management

- [Zustand](https://github.com/pmndrs/zustand)

### SQLite

- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [SQLite Docs](https://www.sqlite.org/docs.html)

---

## 🆘 Troubleshooting

### Common Issues

**Issue:** `better-sqlite3` build fails

```bash
# Solution: Rebuild for Electron
npm rebuild better-sqlite3 --build-from-source
```

**Issue:** Hot reload not working

```bash
# Solution: Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

**Issue:** Database locked

```bash
# Solution: Close all connections
# Check for orphaned processes
ps aux | grep electron
kill -9 <PID>
```

**Issue:** App won't launch in production

```bash
# Solution: Check console for errors
# Run from terminal to see output
./dist/mac/ShowStack\ Production.app/Contents/MacOS/ShowStack\ Production
```

---

## 🤝 Contributing

### Branch Strategy

```
main           - Production releases
develop        - Development integration
feature/*      - New features
bugfix/*       - Bug fixes
release/*      - Release preparation
```

### Commit Convention

```
feat: Add fixture import from CSV
fix: Resolve DMX conflict detection bug
docs: Update README with setup instructions
style: Format code with Prettier
refactor: Extract grid logic to hooks
test: Add tests for power calculations
chore: Update dependencies
```

### Pull Request Process

1. Create feature branch from `develop`
2. Write tests for new features
3. Ensure all tests pass
4. Update documentation
5. Submit PR to `develop`
6. Code review + approval
7. Squash and merge

---

## 📞 Support

### Getting Help

- **Discord:** [Join ShowStack Discord](#)
- **GitHub Issues:** [Report bugs or request features](#)
- **Email:** dev@showstack.app
- **Docs:** [docs.showstack.app](#)

### Reporting Bugs

Include:

1. Operating system and version
2. Electron/Node.js version
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots/logs if applicable

---

## ✅ Pre-Launch Checklist

Before committing:

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Linter passes (no warnings)
- [ ] Types are correct (no `any`)
- [ ] Documentation updated
- [ ] Manual testing completed

Before creating PR:

- [ ] Branch is up to date with `develop`
- [ ] Conflicts resolved
- [ ] Commit messages follow convention
- [ ] PR description is clear
- [ ] Reviewers assigned

Before release:

- [ ] Version number bumped
- [ ] CHANGELOG updated
- [ ] All features tested on all platforms
- [ ] Installers built and signed
- [ ] Release notes written
- [ ] Marketing materials prepared

---

**Ready to start building?** Run `npm run dev` and open `http://localhost:5173` in the Electron window!
