# Phase 2: Validation & Service Layer

**Duration:** 7-9 weeks
**Status:** 🔄 IN PROGRESS (2.0-2.2 complete, 2.3 remaining)
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

## 🚨 Testing Philosophy & Requirements

**CRITICAL PRINCIPLE:** Code must pass existing tests. Tests must NOT be altered to make code pass.

### Senior Developer Standards

1. **Tests are contracts** - When a test fails, the code is wrong, not the test
2. **Fix the code, not the test** - If a test fails, investigate and fix the root cause
3. **Proper assertions** - Tests must verify specific behavior, not just "something happened"
4. **No weakening** - Changing `toThrow(/Specific error/)` to `toThrow()` is not acceptable
5. **Architecture over shortcuts** - If tests can't pass, the architecture needs fixing

### Phase 2 Testing Requirements

**For every code change in Phase 2:**

✅ **MUST:** All existing tests pass without modification
✅ **MUST:** New functionality includes new tests
✅ **MUST:** Tests verify specific expected behavior
✅ **MUST:** Test assertions are not weakened or generalized
✅ **MUST:** Code changes fix architecture, not test expectations

**Unacceptable Practices:**
❌ Modifying test assertions to make failing tests pass
❌ Commenting out failing tests
❌ Using `any` or weakening types to avoid test failures
❌ Changing test mocks to hide bugs
❌ Skipping tests with `.skip()` or `xit()`

### Testing Workflow

```
1. Write/modify code
2. Run tests
3. If tests fail:
   a. Analyze WHY the test failed
   b. Determine if code or architecture is wrong
   c. Fix the CODE, not the test
   d. Re-run tests
4. If tests pass: proceed
5. Add tests for new functionality
6. Ensure all tests pass before committing
```

### Example: Phase 1 Validation Fix

**❌ WRONG APPROACH:**
```typescript
// Test was: expect(() => fn()).toThrow(/Invalid column name/)
// Developer weakened it to:
expect(() => fn()).toThrow(); // Now accepts ANY error
```

**✅ CORRECT APPROACH:**
```typescript
// Moved validation BEFORE transaction so error isn't wrapped
// Test remains: expect(() => fn()).toThrow(/Invalid column name/)
// Architecture fixed, test unchanged, specific error verified
```

### Accountability

Every commit message must include:
- Test status: "All tests passing ✓"
- Test count: "53/53 database tests passing"
- If tests were added: "Added X tests for Y functionality"

**Reviewers must verify:**
- No test modifications to force passing
- Test assertions remain specific
- Architecture fixes, not test workarounds

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
- [x] Create logger utility with environment-aware levels
- [x] Replace all console.log/error calls in database layer
- [ ] Add logging to service layer (new in Phase 2)
- [x] Document logging conventions

**Status:** ✅ COMPLETED (Feb 4, 2026)

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
- [x] Define SQLValue type union
- [x] Update all 4 bulk operation signatures
- [x] Update tests to use proper types
- [x] Add JSDoc examples with correct types

**Status:** ✅ COMPLETED (Feb 4, 2026)

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
- [x] Audit all error messages in database layer
- [x] Replace path-leaking errors with generic messages
- [x] Add debug logging for development
- [x] Document error message guidelines

**Status:** ✅ COMPLETED (Feb 4, 2026)

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
- [x] Implement exponential backoff with jitter
- [x] Update retry logic in ErrorHandler
- [x] Add tests for retry behavior
- [x] Document retry strategy

**Status:** ✅ COMPLETED (Feb 4, 2026)

---

## Main Phase 2 Work

### 2.1 Monorepo Setup (1 week)

Transform the project into a monorepo structure for better code organization and sharing.

**Tasks:**
- [x] Create `apps/desktop/` directory
- [x] Create `packages/shared/` directory
- [x] Update root `package.json` with workspaces config
- [x] Move existing `src/` to `apps/desktop/src/`
- [x] Create `packages/shared/` for validation schemas
- [x] Update import paths and TypeScript configs
- [x] Update build scripts (electron-vite)
- [x] Test `npm run dev` works
- [x] Test `npm run build` works
- [x] Update `.gitignore` for monorepo structure

**Success Criteria:**
- ✅ `apps/desktop/` and `packages/shared/` directories exist
- ✅ Workspace dependencies resolve correctly
- ✅ Build and dev scripts work without errors
- ✅ All existing tests still pass

**Status:** ✅ COMPLETED (Feb 4, 2026)


---

### 2.2 Zod Validation (3-4 weeks)

Implement runtime type validation for all entities using Zod schemas.

#### 2.2.1 Core Validation Infrastructure
**Tasks:**
- [x] Install Zod in `packages/shared`
- [x] Create `packages/shared/src/validation/` directory
- [x] Create validation utilities (parseWithZod, validateArray, etc.)
- [x] Create BaseEntity schema with common fields (id, created_at, updated_at)
- [x] Create validation middleware for IPC handlers
- [x] Set up validation error formatting

**Status:** ✅ COMPLETED (Feb 4, 2026)

#### 2.2.2 Entity Schemas
**Tasks:**
- [x] Create `FixtureSchema` (type, manufacturer, model, DMX, power, etc.)
- [x] Create `ProjectSchema` (name, venue, dates, contacts, etc.)
- [x] Create `ShopOrderProjectSchema` (shop order metadata)
- [x] Create `ShopOrderSectionSchema` (section hierarchy)
- [x] Create `ShopOrderItemSchema` (equipment items)
- [x] Create `ShopOrderRevisionSchema` (revision tracking)
- [x] Create `ShopOrderNoteSchema` (notes and templates)
- [x] Create `InfrastructureEquipmentSchema` (racks, power, network)
- [x] Create `PowerDistributionSchema` (breakers, circuits)
- [x] Create `DimmerRackSchema` (dimmer modules and patching)
- [x] Create `PageLayoutTemplateSchema` (paperwork layouts)
- [x] Create `PaperworkTemplateSchema` (document templates)

**Status:** ✅ COMPLETED (Feb 4, 2026)

#### 2.2.3 Integration with IPC Handlers
**Tasks:**
- [x] Update fixture IPC handlers to validate input
- [x] Update project IPC handlers to validate input
- [x] Update shop-order IPC handlers to validate input
- [x] Update infrastructure IPC handlers to validate input
- [x] Update power management IPC handlers to validate input
- [ ] Update paperwork IPC handlers to validate input (deferred to Phase 2.3)
- [ ] Add validation error responses to renderer (deferred to Phase 2.3)
- [ ] Update UI to show validation errors (deferred to Phase 2.3)

**Status:** ✅ CORE COMPLETED (Feb 4, 2026) - Main entity handlers integrated

#### 2.2.4 Testing
**Tasks:**
- [x] Test validation success cases (valid data)
- [x] Test validation failure cases (invalid data)
- [x] Test validation error messages are clear
- [x] Test edge cases (null, undefined, empty strings)
- [x] Test array validation (empty arrays, duplicates)
- [x] Achieve 100% coverage on validation schemas

**Status:** ✅ COMPLETED (Feb 4, 2026) - 32/32 tests passing

**Success Criteria:**
- ✅ All entities have Zod schemas in `packages/shared`
- ✅ Core IPC handlers validate input with Zod (fixtures, projects, shop-order, infrastructure, power)
- ✅ Validation errors are user-friendly
- ✅ 100% test coverage on validation schemas (32/32 tests passing)
- ✅ No runtime type errors in production
- ✅ Build succeeds with all validation integration

---

## 🔵 Supabase & PowerSync - Ready for Phase 3

**IMPORTANT:** Supabase and PowerSync accounts are created and ready to integrate.

**Integration Timing:**
- **Phase 2.3:** Service layer must be complete BEFORE integrating PowerSync
- **Phase 3.1:** Supabase setup and schema deployment (1 week)
- **Phase 3.2:** PowerSync SDK integration with service layer (3-4 weeks)

**Why wait until Phase 3:**
- Service layer provides clean abstraction layer for PowerSync integration
- Without services, PowerSync would need to integrate directly with 20+ IPC handlers
- Services enable easier testing and conflict resolution strategies
- Services handle business logic that PowerSync shouldn't manage

**What's ready now:**
- ✅ Supabase account created and configured
- ✅ PowerSync account created and configured
- ✅ Database schema validated and ready for cloud deployment
- ✅ Validation schemas ready for use with PowerSync

**Next steps (Phase 3.1):**
1. Deploy schema to Supabase
2. Configure Row-Level Security (RLS)
3. Set up PowerSync service instance
4. Test connection from desktop app

See [Phase 3 Documentation](./Phase-3-Cloud-Collaboration.md) for detailed integration plan.

---

### 2.3 Service Layer Extraction (2-3 weeks)

**CRITICAL:** This phase must be completed before Phase 3 PowerSync integration.

Extract business logic from IPC handlers into testable service classes.

#### 2.3.0 Pre-Service Refactoring
**From PR #67/#68 Code Review - Validation Timing Issue**

**Issue:** In `bulkOperations.ts`, column validation occurs inside transactions (e.g., `bulkUpdate`), causing validation errors to be wrapped in transaction errors instead of failing fast.

**Tasks:**
- [ ] Move column validation in `bulkUpdate` before transaction initiation
- [ ] Move column validation in `bulkInsert` before transaction initiation (verify current placement)
- [ ] Ensure all validation happens before `executeImmediate()` calls
- [ ] Update tests to verify validation errors are not wrapped in transaction errors
- [ ] Document fail-fast validation pattern in code comments

**Effort:** 1-2 hours
**Priority:** HIGH (architectural improvement)

**Status:** ⏳ PENDING

---

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
