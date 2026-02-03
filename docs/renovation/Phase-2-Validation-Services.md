# Phase 2: Validation & Service Layer

**Duration:** 6-8 weeks
**Status:** 🟡 Depends on Phase 1
**Priority:** HIGH
**Goal:** Add Zod validation and extract service layer

---

## Overview

- Monorepo setup (apps/desktop, packages/shared)
- Zod validation for all entities
- Service layer extraction (thin IPC handlers)

---

## Checklist

### 2.1 Monorepo Setup (1 week)
- [ ] Create apps/desktop and packages/shared
- [ ] Update root package.json with workspaces
- [ ] Move existing src/ to apps/desktop/
- [ ] Test npm run dev works

### 2.2 Zod Validation (3-4 weeks)
- [ ] Install Zod in shared package
- [ ] Create validation schemas (fixtures, projects, shop-order, etc.)
- [ ] Add validation middleware
- [ ] Update all IPC handlers to validate input

### 2.3 Service Layer Extraction (2-3 weeks)
- [ ] Create service files (FixtureService, ProjectService, ShopOrderProjectService, etc.)
- [ ] Move business logic from IPC to services
- [ ] Refactor IPC handlers to thin wrappers
- [ ] Achieve 80%+ service layer test coverage

---

## Success Criteria

- ✅ All entities have Zod schemas
- ✅ All IPC handlers validate input
- ✅ Business logic in services
- ✅ 80%+ service layer coverage

**Status:** 🟡 Depends on Phase 1
**Next:** Phase 3 - Cloud Collaboration
