# Contributing to ShowStack

Thank you for your interest in contributing to ShowStack!

## Development Status

ShowStack is currently in **alpha development**. The Production module's Shop Order tool is complete, and we're actively developing the Fixture Management features. We welcome contributions from experienced developers.

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
3. Ensure all tests pass (`npm test`)
4. Run linter (`npm run lint`)
5. Update documentation if needed
6. Submit PR to `develop` branch
7. Request review from maintainers

## Code Standards

### TypeScript

- **Strict mode enabled** - No `any` types
- **Explicit return types** for functions
- **Interface over type** for object definitions
- **Descriptive variable names** - No abbreviations

### React

- **Functional components only** - No class components
- **Hooks for state management** - Use Zustand for global state
- **Memoization** - Use `React.memo` for list items
- **PropTypes with TypeScript** - Full type safety

### Performance

- **Virtual scrolling** for large lists (>100 items)
- **Debouncing** for search/filter inputs
- **Lazy loading** for heavy components
- **Code splitting** for route-based bundles

### Testing

- **Unit tests** for utility functions (Vitest)
- **Component tests** with React Testing Library
- **Integration tests** for critical flows
- **E2E tests** for user journeys (Playwright)

**Coverage target:** 80% for new code

## Current Priorities

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the complete feature status and roadmap.

### High Priority

- **Fixture Management**: Complete Equipment Manager features
- **Label Designer**: Drag-and-drop label creation
- **Paperwork Generator**: Custom report templates

### Medium Priority

- **Vectorworks Integration**: Import/export with reconciliation
- **Console Integration**: ETC Eos OSC communication
- **Performance Optimization**: Further optimize virtual grid rendering

### Low Priority

- **Cloud Sync**: Optional collaboration features
- **Telemetry**: Privacy-first analytics
- **Advanced Features**: AI-powered suggestions, automation

## What We're Looking For

### Feature Contributions

- Bug fixes with test coverage
- Performance improvements
- Accessibility enhancements
- Documentation improvements
- Test coverage expansion

### Code Reviews

- Architecture feedback
- Security considerations
- Performance suggestions
- UX improvements

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

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building and Testing Locally

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Create distributable
npm run dist
```

## Module Development

ShowStack uses a modular architecture. When creating new tools within modules:

1. Follow the established pattern (see Shop Order tool in `src/renderer/src/pages/modules/Prep.tsx` or Equipment Manager in `src/renderer/src/pages/modules/EquipmentManager.tsx`)
2. Create module-specific components in `src/renderer/src/components/[module]/`
3. Use Zustand for module state management
4. Implement IPC handlers in `src/main/ipc/[module].ts`
5. Add database queries in `src/main/database/queries/[module].ts`

See [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md) for detailed guidelines.

## License

By contributing to ShowStack, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for helping build the future of production management software! 🎭💡
