# Phase 2: Validation & Service Layer

**Duration:** 7-9 weeks
**Status:** ✅ READY TO START (Phase 1 completed)
**Priority:** HIGH
**Goal:** Add Zod validation, extract service layer, and resolve Phase 1 follow-up issues

---

## Overview

Phase 2 focuses on three main areas:
1. **Monorepo setup** - Prepare for code sharing and better architecture
2. **Zod validation** - Type-safe runtime validation for all entities
3. **Service layer extraction** - Separate business logic from IPC handlers
4. **Phase 1 improvements** - Address code quality issues from PR #67 review

---

## Phase 1 Follow-Up Issues (Integrated)

Based on PR #67 code review, the following improvements from Phase 1 will be addressed in Phase 2:

### 2.0 Code Quality Improvements (1 week)

#### 2.0.1 Logging Abstraction ⭐ HIGH PRIORITY
**Effort:** 2-3 hours
**Current Issue:** Production code uses `console.log()` and `console.error()` throughout database layer

**Files Affected:**
- `src/main/database/core/TransactionManager.ts`
- `src/main/database/core/DatabaseManager.ts`
- `src/main/database/persistence/DatabaseWriter.ts`
- `src/main/database/core/MigrationRunner.ts`

**Implementation:**
```typescript
// Create src/main/utils/logger.ts
export const logger = {
  info: (message: string, context?: any) => {
    console.log(message, context);
  },
  error: (message: string, context?: any) => {
    console.error(message, context);
  },
  warn: (message: string, context?: any) => {
    console.warn(message, context);
  },
  debug: (message: string, context?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, context);
    }
  }
};
```

**Benefits:**
- Centralized log management
- Environment-specific logging
- Easy integration with log aggregation services
- Structured logging support
- Future: File logging, error tracking integration

**Tasks:**
- [ ] Create logger utility with environment-aware levels
- [ ] Replace all console.log/error calls in database layer
- [ ] Add logging to service layer (new in Phase 2)
- [ ] Document logging conventions

---

#### 2.0.2 Type Safety in bulkOperations ⭐ HIGH PRIORITY
**Effort:** 1-2 hours
**Current Issue:** `bulkOperations.ts` uses `any[][]` for records parameter

**Implementation:**
```typescript
// Option 1: Union of allowed SQL types (recommended)
type SQLValue = string | number | null | boolean | Buffer;

export function bulkInsert(
  tableName: string,
  records: Array<Array<SQLValue>>,
  columns: string[]
): number

// Option 2: Use unknown (stricter)
export function bulkInsert(
  tableName: string,
  records: unknown[][],
  columns: string[]
): number
```

**Benefits:**
- Compile-time type checking
- Prevents accidental passing of objects/functions
- Better IDE autocomplete
- Self-documenting code

**Tasks:**
- [ ] Define SQLValue type union
- [ ] Update all 4 bulk operation signatures
- [ ] Update tests to use proper types
- [ ] Add JSDoc examples with correct types

---

#### 2.0.3 Improved Error Messages
**Effort:** 2-4 hours
**Current Issue:** Some error messages may leak internal paths or implementation details

**Implementation:**
```typescript
// Before:
throw new Error(`Failed to process file at ${dbPath}`); // Leaks path

// After:
throw new DatabaseError(
  'Failed to process database file',
  'database:load',
  false,
  error
); // Generic message, details in context

// For development:
if (process.env.DEBUG_DATABASE === 'true') {
  logger.debug('Failed at path:', dbPath);
}
```

**Benefits:**
- Improved security (don't leak system paths)
- Cleaner user-facing error messages
- Debug info still available in dev mode
- Consistent error format

**Tasks:**
- [ ] Audit all error messages in database layer
- [ ] Replace path-leaking errors with generic messages
- [ ] Add debug logging for development
- [ ] Document error message guidelines

---

#### 2.0.4 Rate Limiting to Retry Logic
**Effort:** 2-3 hours
**Current Issue:** Error retry logic has no exponential backoff or jitter

**Files Affected:**
- `src/main/errors/ErrorHandler.ts`

**Implementation:**
```typescript
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !isRetryable(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const baseDelay = 100 * Math.pow(2, attempt - 1);
      const jitter = Math.random() * baseDelay * 0.1;
      const delay = baseDelay + jitter;

      logger.warn(`Retry ${attempt}/${maxRetries} for ${operationName}`, {
        delay,
        error: error.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Benefits:**
- Better handling of temporary failures
- Prevents thundering herd problems
- More resilient to transient errors
- Standard industry practice

**Tasks:**
- [ ] Implement exponential backoff with jitter
- [ ] Update retry logic in ErrorHandler
- [ ] Add tests for retry behavior
- [ ] Document retry strategy

---

## Main Phase 2 Work

### 2.1 Monorepo Setup (1 week)

Transform the project into a monorepo structure for better code organization and sharing.

**Tasks:**
- [ ] Create `apps/desktop/` directory
- [ ] Create `packages/shared/` directory
- [ ] Update root `package.json` with workspaces config
- [ ] Move existing `src/` to `apps/desktop/src/`
- [ ] Create `packages/shared/` for validation schemas
- [ ] Update import paths and TypeScript configs
- [ ] Update build scripts (electron-vite)
- [ ] Test `npm run dev` works
- [ ] Test `npm run build` works
- [ ] Update `.gitignore` for monorepo structure

**Success Criteria:**
- ✅ `apps/desktop/` and `packages/shared/` directories exist
- ✅ Workspace dependencies resolve correctly
- ✅ Build and dev scripts work without errors
- ✅ All existing tests still pass

---

### 2.2 Zod Validation (3-4 weeks)

Implement runtime type validation for all entities using Zod schemas.

#### 2.2.1 Core Validation Infrastructure
**Tasks:**
- [ ] Install Zod in `packages/shared`
- [ ] Create `packages/shared/src/validation/` directory
- [ ] Create validation utilities (parseWithZod, validateArray, etc.)
- [ ] Create BaseEntity schema with common fields (id, created_at, updated_at)
- [ ] Create validation middleware for IPC handlers
- [ ] Set up validation error formatting

#### 2.2.2 Entity Schemas
**Tasks:**
- [ ] Create `FixtureSchema` (type, manufacturer, model, DMX, power, etc.)
- [ ] Create `ProjectSchema` (name, venue, dates, contacts, etc.)
- [ ] Create `ShopOrderProjectSchema` (shop order metadata)
- [ ] Create `ShopOrderSectionSchema` (section hierarchy)
- [ ] Create `ShopOrderItemSchema` (equipment items)
- [ ] Create `ShopOrderRevisionSchema` (revision tracking)
- [ ] Create `ShopOrderNoteSchema` (notes and templates)
- [ ] Create `InfrastructureEquipmentSchema` (racks, power, network)
- [ ] Create `PowerDistributionSchema` (breakers, circuits)
- [ ] Create `DimmerRackSchema` (dimmer modules and patching)
- [ ] Create `PageLayoutTemplateSchema` (paperwork layouts)
- [ ] Create `PaperworkTemplateSchema` (document templates)

#### 2.2.3 Integration with IPC Handlers
**Tasks:**
- [ ] Update fixture IPC handlers to validate input
- [ ] Update project IPC handlers to validate input
- [ ] Update shop-order IPC handlers to validate input
- [ ] Update infrastructure IPC handlers to validate input
- [ ] Update power management IPC handlers to validate input
- [ ] Update paperwork IPC handlers to validate input
- [ ] Add validation error responses to renderer
- [ ] Update UI to show validation errors

#### 2.2.4 Testing
**Tasks:**
- [ ] Test validation success cases (valid data)
- [ ] Test validation failure cases (invalid data)
- [ ] Test validation error messages are clear
- [ ] Test edge cases (null, undefined, empty strings)
- [ ] Test array validation (empty arrays, duplicates)
- [ ] Achieve 100% coverage on validation schemas

**Success Criteria:**
- ✅ All entities have Zod schemas in `packages/shared`
- ✅ All IPC handlers validate input with Zod
- ✅ Validation errors are user-friendly
- ✅ 100% test coverage on validation schemas
- ✅ No runtime type errors in production

---

### 2.3 Service Layer Extraction (2-3 weeks)

Extract business logic from IPC handlers into testable service classes.

#### 2.3.1 Service Infrastructure
**Tasks:**
- [ ] Create `src/main/services/` directory
- [ ] Create BaseService class with common utilities
- [ ] Set up dependency injection pattern
- [ ] Create service factory functions
- [ ] Set up service error handling

#### 2.3.2 Service Implementation
**Tasks:**
- [ ] Create `FixtureService` (CRUD, DMX calculations, power totals)
- [ ] Create `ProjectService` (CRUD, metadata management)
- [ ] Create `ShopOrderService` (creation, sections, items, revisions)
- [ ] Create `InfrastructureService` (equipment management, port assignments)
- [ ] Create `PowerService` (rack config, circuit calculations, breaker sizing)
- [ ] Create `DimmerService` (rack config, patching, module management)
- [ ] Create `PaperworkService` (PDF generation, template management)
- [ ] Create `ExportImportService` (project export/import)

#### 2.3.3 IPC Handler Refactoring
**Tasks:**
- [ ] Refactor fixture handlers to thin wrappers calling FixtureService
- [ ] Refactor project handlers to thin wrappers calling ProjectService
- [ ] Refactor shop-order handlers to thin wrappers calling ShopOrderService
- [ ] Refactor infrastructure handlers to thin wrappers calling InfrastructureService
- [ ] Refactor power handlers to thin wrappers calling PowerService
- [ ] Refactor dimmer handlers to thin wrappers calling DimmerService
- [ ] Refactor paperwork handlers to thin wrappers calling PaperworkService
- [ ] Remove business logic from IPC handlers (max 20 lines per handler)

#### 2.3.4 Service Testing
**Tasks:**
- [ ] Test FixtureService (80%+ coverage)
- [ ] Test ProjectService (80%+ coverage)
- [ ] Test ShopOrderService (80%+ coverage)
- [ ] Test InfrastructureService (80%+ coverage)
- [ ] Test PowerService (80%+ coverage)
- [ ] Test DimmerService (80%+ coverage)
- [ ] Test PaperworkService (80%+ coverage)
- [ ] Test ExportImportService (80%+ coverage)
- [ ] Test error handling in all services
- [ ] Test transaction rollback in services

**Success Criteria:**
- ✅ All business logic moved to services
- ✅ IPC handlers are thin wrappers (<20 lines)
- ✅ Services are independently testable
- ✅ 80%+ coverage on service layer
- ✅ No database queries in IPC handlers

---

## Success Criteria

### Code Quality
- ✅ Logging abstraction implemented and used throughout
- ✅ Type safety improved in bulk operations
- ✅ Error messages don't leak system information
- ✅ Retry logic uses exponential backoff with jitter

### Architecture
- ✅ Monorepo structure with `apps/` and `packages/`
- ✅ All entities have Zod schemas in `packages/shared`
- ✅ All IPC handlers validate input with Zod
- ✅ Business logic extracted to service classes

### Testing
- ✅ 100% validation schema coverage
- ✅ 80%+ service layer test coverage
- ✅ All tests pass in <30 seconds

### Quality Metrics
- ✅ Zero TypeScript errors
- ✅ Zero runtime type errors in production
- ✅ IPC handlers < 20 lines each
- ✅ Services independently testable

---

## Estimated Effort Breakdown

| Task | Duration |
|------|----------|
| 2.0 Code Quality Improvements | 1 week |
| 2.1 Monorepo Setup | 1 week |
| 2.2 Zod Validation | 3-4 weeks |
| 2.3 Service Layer Extraction | 2-3 weeks |
| **Total** | **7-9 weeks** |

---

## Dependencies

**Depends on:** Phase 1 - Database Migration (✅ Completed)

**Blocking:** Phase 3 - Cloud Collaboration (needs service layer for PowerSync integration)

---

## Risk Mitigation

### Risk: Monorepo Complexity
**Mitigation:** Use simple workspace configuration, not complex build tools like Turborepo/Nx

### Risk: Over-validation
**Mitigation:** Only validate at system boundaries (IPC handlers), not internal service calls

### Risk: Service Layer Over-engineering
**Mitigation:** Keep services simple, one service per entity type, no complex dependency graphs

### Risk: Migration Disruption
**Mitigation:** Refactor one entity at a time, keep existing code working alongside new code

---

## Phase 1 Issues Resolved in Phase 2

✅ **Issue #5:** Replace console.log/error with logging abstraction
✅ **Issue #6:** Improve type safety in bulkOperations
✅ **Issue #11:** Improve error messages (security)
✅ **Issue #12:** Add rate limiting to retry logic

**Deferred to Phase 3:**
- Issue #7: WAL Checkpoint Monitoring (performance optimization)
- Issue #8: Pagination (performance optimization)
- Issue #9: Statement Caching (performance optimization)
- Issue #10: Database Monitoring (observability)

---

**Status:** ✅ READY TO START
**Next:** Phase 3 - Cloud Collaboration & Performance Optimization

**Last Updated:** February 4, 2026
