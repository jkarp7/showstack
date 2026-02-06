# Phase 3 Pre-Work: Code Quality & Technical Debt

**Status:** 📋 Planned
**Priority:** Medium (Can be done alongside Phase 3.1)
**Source:** Code review feedback from PR #68
**Created:** February 5, 2026

---

## Overview

This document captures code quality improvements and technical debt identified during Phase 2 code reviews. These improvements should be addressed before or alongside Phase 3 (PowerSync Integration) to ensure a clean foundation for cloud collaboration features.

**Priority Level Guide:**

- 🔴 **CRITICAL** - Must fix before Phase 3
- 🟡 **HIGH** - Should fix early in Phase 3
- 🟢 **MEDIUM** - Can be addressed anytime during Phase 3
- 🔵 **LOW** - Nice to have, can defer to Phase 4

---

## 🔴 Critical Issues

### 1. Remove @ts-nocheck Directives

**Priority:** CRITICAL
**Impact:** Type safety, code quality

**Problem:** Multiple files use `@ts-nocheck` which defeats TypeScript's purpose and can hide real type errors.

**Files Affected:**

- `apps/desktop/src/main/database/queries/layoutTemplates.ts`
- `apps/desktop/src/main/database/queries/license.ts`
- `apps/desktop/src/main/database/queries/paperworkTemplates.ts`
- `apps/desktop/src/main/database/queries/settings.ts`
- `apps/desktop/src/main/database/queries/shop-order.ts`
- `apps/desktop/src/main/database/seedDefaultLayouts.ts`
- `apps/desktop/src/main/database/seedDefaultLayoutsFromJSON.ts`
- `apps/desktop/src/main/database/seedPaperworkHeader.ts`
- `apps/desktop/src/main/database/updatePaperworkTemplateHeaders.ts`
- `apps/desktop/src/main/utils/labelSheetRenderer.ts`
- `apps/desktop/src/main/utils/__tests__/labelSheetRenderer.test.ts`
- Plus 15+ other IPC and validation files

**Action Required:**

1. Remove all `@ts-nocheck` directives
2. Fix underlying type issues
3. Use targeted `@ts-ignore` or `@ts-expect-error` with explanatory comments only where truly necessary
4. Re-enable strict mode in `tsconfig.json`
5. Re-enable `--strict` flag in `.github/workflows/test.yml`

**Estimated Effort:** 2-3 days

---

### 2. Re-enable TypeScript Strict Mode

**Priority:** CRITICAL
**Impact:** Type safety, maintainability

**Problem:** Strict mode was disabled temporarily to pass CI during Phase 2 renovation.

**Files Affected:**

- `tsconfig.json` - `"strict": false` should be `true`
- `tsconfig.json` - `"noUnusedLocals": false` should be `true`
- `tsconfig.json` - `"noUnusedParameters": false` should be `true`
- `.github/workflows/test.yml` - Add back `--strict` flag

**Action Required:**

1. Fix all type errors revealed by strict mode
2. Update tsconfig.json to enable strict mode
3. Update CI workflow to enforce strict checks
4. Ensure all tests pass with strict mode enabled

**Estimated Effort:** 2-3 days (after fixing @ts-nocheck issues)

---

## 🟡 High Priority

### 3. Improve Type Safety in Dynamic SQL Queries

**Priority:** HIGH
**Impact:** Type safety, maintainability

**Problem:** Using `any` types in database queries defeats TypeScript's purpose.

**Example Issues:**

```typescript
// Bad - using any
const params: any[] = [];
const template: any = {};

// Better - use proper types
const params: (string | number)[] = [];
const template: Record<string, unknown> = {};
```

**Files Affected:**

- `layoutTemplates.ts:46-47, 66`
- `paperworkTemplates.ts` (similar patterns)
- `license.ts` (similar patterns)
- `settings.ts` (similar patterns)

**Recommended Fix:**

```typescript
// Create typed row-to-object mapper
function rowToTemplate(columns: string[], row: unknown[]): PageLayoutTemplate {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj as PageLayoutTemplate; // Single assertion point
}
```

**Estimated Effort:** 1-2 days

---

### 4. Add Comprehensive Service Layer Tests

**Priority:** HIGH
**Impact:** Test coverage, confidence in changes

**Problem:** Service layer created in Phase 2.3 lacks dedicated unit tests.

**Missing Tests:**

- `BaseService.ts` - validation helpers, retry logic
- `FixtureService.ts` - CRUD operations, business logic
- `ProjectService.ts` - CRUD operations
- `InfrastructureService.ts` - CRUD operations
- `DimmerService.ts` - CRUD operations, power calculations
- `PDRackService.ts` - CRUD operations, power calculations

**Recommended Approach:**

```typescript
// Example test structure
describe('FixtureService', () => {
  it('should validate required fields', async () => {
    await expect(fixtureService.create({ position: '' })).rejects.toThrow(ValidationError);
  });

  it('should retry on transient database errors', async () => {
    // Test retry logic with mock database errors
  });

  it('should calculate DMX footprint correctly', () => {
    // Test business logic
  });
});
```

**Target Coverage:** 80%+ for all service classes

**Estimated Effort:** 3-4 days

---

### 5. Harden Field Whitelist Security

**Priority:** HIGH
**Impact:** Security (SQL injection prevention)

**Problem:** Dynamic SQL with field name interpolation could be vulnerable if whitelist validation fails.

**Files Affected:**

- `projects.ts:150` - Dynamic setClause construction
- `layoutTemplates.ts:246` - Similar pattern
- `license.ts:163` - Similar pattern
- `paperworkTemplates.ts:265` - Similar pattern

**Current Implementation:**

```typescript
const setClause = fields.map((f) => `${f} = ?`).join(', ');
```

**Recommended Fix:**

```typescript
// More defensive approach
const ALLOWED_FIELDS = Object.freeze([
  'name', 'description', 'venue', ...
]) as const;

type AllowedField = typeof ALLOWED_FIELDS[number];

const fields = Object.keys(updates).filter(
  (k): k is AllowedField => ALLOWED_FIELDS.includes(k as AllowedField)
);

// Or use a Map for type safety
const FIELD_MAP: Record<string, string> = Object.freeze({
  name: 'name',
  description: 'description',
  // ... etc
});
```

**Estimated Effort:** 1 day

---

### 6. Add JSON.parse Error Logging

**Priority:** HIGH
**Impact:** Debugging, data integrity

**Problem:** Silent failures when parsing JSON make debugging difficult.

**Files Affected:**

- `projects.ts:27-30`
- `paperworkTemplates.ts` (similar patterns)
- `layoutTemplates.ts` (similar patterns)

**Current Implementation:**

```typescript
try {
  project[field] = JSON.parse(project[field]);
} catch {
  // Keep as is if parsing fails  ← Silent failure!
}
```

**Recommended Fix:**

```typescript
try {
  project[field] = JSON.parse(project[field]);
} catch (error) {
  logger.error(`Failed to parse ${field} for project ${project.id}`, {
    error,
    field,
    value: project[field],
  });
  // Consider: default value, validation, or error throwing
}
```

**Estimated Effort:** 0.5 days

---

## 🟢 Medium Priority

### 7. Add Transactions for Multi-Step Operations

**Priority:** MEDIUM
**Impact:** Data integrity, atomicity

**Problem:** Delete + insert operations not wrapped in transactions can leave data in inconsistent state.

**Example Issue:**

```typescript
// layoutTemplates.ts:252
// Delete existing elements
db.prepare('DELETE FROM page_layout_elements WHERE template_id = ?').run(id);

// Insert new elements - if this fails, elements are lost!
for (const element of elements) {
  insertElementStmt.run(...);
}
```

**Recommended Fix:**

```typescript
return db.transaction(() => {
  db.prepare('DELETE FROM page_layout_elements WHERE template_id = ?').run(id);

  for (const element of elements) {
    insertElementStmt.run(...);
  }
})();
```

**Files to Audit:**

- All database query files with multiple operations
- Look for patterns: delete + insert, update + insert

**Estimated Effort:** 1-2 days

---

### 8. Use Constants Instead of Magic Strings

**Priority:** MEDIUM
**Impact:** Maintainability, refactoring safety

**Problem:** Magic strings scattered throughout codebase.

**Examples:**

```typescript
// menuTemplate.ts:72
const isToolContext = ['equipment', 'shop-order'].includes(state.context);

// settings.ts:45 - Hardcoded ID
db.prepare('INSERT INTO app_settings (id, data, updated_at) VALUES (1, ?, ?)').run(...);
```

**Recommended Fix:**

```typescript
// Create constants file
export const TOOL_CONTEXTS = ['equipment', 'shop-order'] as const;
export const SETTINGS_ID = 1;

// Usage
const isToolContext = TOOL_CONTEXTS.includes(state.context);
db.prepare('... VALUES (?, ?, ?)').run(SETTINGS_ID, data, now);
```

**Estimated Effort:** 1 day

---

### 9. Improve Type Safety in Update Functions

**Priority:** MEDIUM
**Impact:** Type safety, autocomplete

**Problem:** Dynamic update functions lose type safety.

**Example:**

```typescript
// license.ts:109-119
export function updateLicense(
  id: string,
  updates: Partial<{ email: string; name: string /* ... */ }>,
);
```

**Recommended Fix:**

```typescript
type LicenseUpdateFields = Pick<UserLicense, 'email' | 'name' | 'tier' | ...>;
export function updateLicense(id: string, updates: Partial<LicenseUpdateFields>)
```

**Files to Update:**

- All update functions in query files

**Estimated Effort:** 0.5 days

---

### 10. Add File Path Validation

**Priority:** MEDIUM
**Impact:** Security (path traversal prevention)

**Problem:** IPC handlers accept file paths without validation.

**Files Affected:**

- `shop-order.ts:876` - PDF generation reads logo files
- Various file import handlers

**Recommended Fix:**

```typescript
import path from 'path';

function validateFilePath(filePath: string, allowedDir: string): void {
  const resolved = path.resolve(filePath);
  const normalizedAllowed = path.resolve(allowedDir);

  if (!resolved.startsWith(normalizedAllowed)) {
    throw new ValidationError('File path outside allowed directory');
  }

  // Validate file extension
  const ext = path.extname(filePath).toLowerCase();
  const allowedExts = ['.png', '.jpg', '.jpeg', '.svg'];
  if (!allowedExts.includes(ext)) {
    throw new ValidationError('Invalid file type');
  }
}
```

**Estimated Effort:** 1 day

---

### 11. Add File Size Validation

**Priority:** MEDIUM
**Impact:** Performance, resource management

**Problem:** No chunking or size limits for logo/file uploads.

**Recommended Fix:**

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
if (fileData.length > MAX_FILE_SIZE) {
  throw new ValidationError('File too large (max 5MB)');
}
```

**Estimated Effort:** 0.5 days

---

## 🔵 Low Priority (Can Defer)

### 12. Optimize PDF Generation Performance

**Priority:** LOW
**Impact:** Performance

**Current:** Uses hidden BrowserWindow (heavyweight)
**Future:** Consider headless library (Playwright/Puppeteer) or electron-pdf-window

**Estimated Effort:** 2-3 days

---

### 13. Add Missing Documentation

**Priority:** LOW
**Impact:** Onboarding, maintainability

**Missing Documentation:**

- Migration guide for Phase 2 better-sqlite3 API changes
- Service layer usage patterns in CONTRIBUTING.md
- Breaking changes documentation
- Architecture decision records (ADRs)

**Estimated Effort:** 1-2 days

---

### 14. Add .gitignore for .DS_Store Files

**Priority:** LOW
**Impact:** Repository cleanliness

**Problem:** .DS_Store files committed to repository.

**Action:**

```bash
# Remove from git
git rm -r --cached **/.DS_Store
git rm --cached .DS_Store

# Add to .gitignore
echo ".DS_Store" >> .gitignore
echo "**/.DS_Store" >> .gitignore

git commit -m "Remove .DS_Store files and update .gitignore"
```

**Estimated Effort:** 0.1 days

---

## Implementation Strategy

### Phasing Approach

**Before Phase 3 Starts:**

- 🔴 Issue #1: Remove @ts-nocheck directives
- 🔴 Issue #2: Re-enable strict mode
- 🟡 Issue #4: Add service layer tests (critical for Phase 3)

**Early in Phase 3.1 (Supabase Setup):**

- 🟡 Issue #3: Improve type safety in SQL queries
- 🟡 Issue #5: Harden field whitelist security
- 🟡 Issue #6: Add JSON.parse error logging

**During Phase 3.2 (PowerSync Integration):**

- 🟢 Issues #7-11: Medium priority improvements
- Can be done in parallel with PowerSync work

**After Phase 3 Complete:**

- 🔵 Issues #12-14: Low priority items
- Can be deferred to Phase 4 if needed

### Estimated Total Effort

- **Critical (Before Phase 3):** 7-10 days
- **High Priority:** 6-8 days
- **Medium Priority:** 4-6 days
- **Low Priority:** 3-5 days

**Total:** 20-29 days (4-6 weeks)

**Recommendation:** Allocate 2 weeks before Phase 3 for critical items, handle high/medium priority items during Phase 3.

---

## Success Criteria

**Code Quality:**

- [ ] Zero `@ts-nocheck` directives in non-test code
- [ ] TypeScript strict mode enabled and passing
- [ ] All `any` types replaced with proper types
- [ ] All magic strings extracted to constants

**Testing:**

- [ ] 80%+ test coverage on service layer
- [ ] All integration tests passing
- [ ] No regression in existing test suite

**Security:**

- [ ] All file paths validated before use
- [ ] Field whitelists hardened with Object.freeze
- [ ] File size limits enforced
- [ ] JSON.parse failures logged

**Documentation:**

- [ ] Service layer usage documented
- [ ] Breaking changes documented
- [ ] Migration guide created

---

## Related Documents

- [PHASE_2_PROGRESS.md](./PHASE_2_PROGRESS.md) - Phase 2 completion summary
- [Phase-3-Cloud-Collaboration.md](./Phase-3-Cloud-Collaboration.md) - PowerSync integration plan
- PR #68 Code Reviews - Source of these recommendations

---

**Status:** 📋 Ready to schedule
**Next Action:** Create GitHub issues for each item
**Owner:** TBD
**Target Start:** After PR #68 merge
**Target Completion:** Before Phase 3.2 (PowerSync Integration)
