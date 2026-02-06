# Contributing to ShowStack

Thank you for your interest in contributing to ShowStack!

## Development Status

ShowStack is currently in **alpha development** undergoing a major renovation (Phases 0-7). The Production module's Shop Order tool is complete, and we're actively developing the Fixture Management features. We welcome contributions from experienced developers.

## Getting Started

1. **Fork the repository**
2. **Set up your development environment** - See [docs/development/dev-setup.md](docs/development/dev-setup.md)
3. **Review the architecture** - See [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md)
4. **Check PROJECT_STATUS.md** for current priorities and available tasks

## Development Workflow

### Branch Strategy

- `main` - Production releases (protected)
- `develop` - Development integration (protected)
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `docs/*` - Documentation updates

### Commit Messages

We follow conventional commits:

```
feat: Add fixture import from CSV
fix: Resolve DMX conflict detection bug
docs: Update README with current status
style: Format code with Prettier
refactor: Extract grid logic to hooks
test: Add tests for power calculations
chore: Update dependencies
```

### Pull Request Process

1. Create a feature branch from `develop`
2. Write tests for new features
3. Ensure all tests pass (`npm run test:run`)
4. Run linter (`npm run lint`)
5. Run format check (`npm run format:check`)
6. Update documentation if needed
7. Submit PR to `develop` branch
8. Request review from maintainers

Pre-commit hooks (Husky + lint-staged) will automatically run ESLint and Prettier on staged files. If you need to bypass hooks temporarily (e.g., WIP commits), use `git commit --no-verify`.

## Code Standards

### TypeScript

- **Strict mode** enabled in renderer, off in main process
- **`any` types** discouraged (ESLint warns on `no-explicit-any`)
- **Explicit return types** for public functions
- **Interface over type** for object definitions
- **Descriptive variable names** - No abbreviations

### Linting & Formatting

- **ESLint 9** with flat config (`eslint.config.js`)
  - TypeScript-eslint recommended rules
  - React Hooks and React Refresh plugins
  - 0 errors enforced in CI
- **Prettier** for consistent formatting
  - Single quotes, 2-space indent, 100 print width, trailing commas
  - Runs automatically via pre-commit hook
- **Pre-commit hooks** via Husky + lint-staged
  - `*.{ts,tsx}`: ESLint fix + Prettier
  - `*.{js,json,md,css,yml,yaml}`: Prettier

### React

- **Functional components only** - No class components
- **Hooks for state management** - Use Zustand for global state
- **Memoization** - Use `React.memo` for list items
- **Full type safety** with TypeScript

### Performance

- **Virtual scrolling** for large lists (>100 items)
- **Debouncing** for search/filter inputs
- **Lazy loading** for heavy components
- **Code splitting** for route-based bundles

### Testing

- **Unit tests** for utility functions (Vitest)
- **Component tests** with React Testing Library
- **Integration tests** for critical flows
- **E2E tests** for user journeys (Playwright - planned)

**Coverage targets:** 50% project / 60% patch (enforced via Codecov)
**Current:** 70%+ coverage with 1,440+ tests across 47 files

## Module Development

ShowStack uses a modular architecture with a monorepo structure:

- `apps/desktop/` - Electron desktop application
  - `src/main/` - Main process (Node.js)
  - `src/renderer/` - Renderer process (React)
- `packages/shared/` - Shared types and utilities

When creating new tools within modules:

1. Follow established patterns in `apps/desktop/src/renderer/src/components/`
2. Create module-specific components in `apps/desktop/src/renderer/src/components/[module]/`
3. Use Zustand for module state management
4. Implement IPC handlers in `apps/desktop/src/main/ipc/[module].ts`
5. Add database queries in `apps/desktop/src/main/database/queries/[module].ts`
6. Use Zod schemas for runtime validation (`packages/shared/src/schemas/`)
7. Write tests alongside implementation

See [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md) for detailed guidelines.

## Development Environment

### Required Tools

- Node.js 20+
- npm 10+
- Git
- Code editor (VS Code recommended)

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- GitLens

### Running Tests

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint:fix

# Check Prettier formatting
npm run format:check

# Format all files
npm run format
```

### Building and Testing Locally

```bash
# Install dependencies (also sets up Husky hooks)
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Create distributable
npm run dist
```

## Questions?

- **Technical questions:** Open a GitHub issue with the `question` label
- **Bug reports:** Use the bug report template
- **Feature requests:** Use the feature request template
- **Security issues:** Email directly (do not create public issues)

## Code of Conduct

Be respectful, inclusive, and professional. We're building tools for a creative industry - let's keep the process creative and collaborative!

### Guidelines

- Treat everyone with respect
- Welcome diverse perspectives
- Focus on constructive feedback
- Help others learn and grow
- Credit others' work appropriately

## License

By contributing to ShowStack, you agree that your contributions will be licensed under the same license as the project.
