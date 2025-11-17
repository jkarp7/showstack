# Contributing to ShowStack

Thank you for your interest in contributing to ShowStack:Production!

## Development Status

ShowStack is currently in **pre-alpha development**. We're building the foundation and will open up for broader contributions once we reach beta.

## Getting Started

1. **Fork the repository**
2. **Set up your development environment** - See [docs/dev-setup.md](docs/dev-setup.md)
3. **Run the proof-of-concept** to understand the architecture
4. **Check the roadmap** in [docs/technical-spec.md](docs/technical-spec.md)

## Development Workflow

### Branch Strategy

- `main` - Production releases (protected)
- `develop` - Development integration (protected)
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Commit Messages

We follow conventional commits:

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

## What We're Looking For

### Current Priorities (Phase 1)

- [ ] Database layer implementation (SQLite)
- [ ] Sorting algorithms (multi-level, natural sort)
- [ ] Advanced filtering UI
- [ ] Auto-complete engine
- [ ] Undo/redo system
- [ ] CSV import/export

### Future Contributions

Once we reach beta:
- Feature requests and feedback
- Bug reports with reproductions
- Documentation improvements
- Test coverage expansion
- Performance optimizations

## Questions?

- **Technical questions:** Open a GitHub issue with the `question` label
- **Bug reports:** Use the bug report template
- **Feature requests:** Use the feature request template

## Code of Conduct

Be respectful, inclusive, and professional. We're building tools for a creative industry - let's keep the process creative and collaborative!

---

Thank you for helping build the future of lighting design software! 🎭💡
