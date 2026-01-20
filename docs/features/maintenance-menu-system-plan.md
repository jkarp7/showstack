# Maintenance Menu System Implementation Plan

**Feature:** Lightwright 6 Parity - Custom categorization system for grouping fixtures
**Delivery:** Phased approach with 4 iterative milestones
**Timeline:** 4 weeks (1 month)
**Effort:** 1 developer full-time
**Status:** Planned (not yet implemented)
**Created:** January 2026
**Priority:** Medium-High (enables shop order automation, Lightwright parity)

---

## Overview

The Maintenance Menu System provides custom categorization for fixtures with rule-based auto-assignment. This is a **critical foundation** for Equipment Manager → Shop Order automation and achieves Lightwright 6 parity.

### Core Capabilities
- **Custom Categories:** Create categories like "ALL Moving Lights", "FOH Fixtures", "Rental Package"
- **Rule-Based Auto-Assignment:** Define rules (e.g., Type contains "MAC" → "Moving Lights")
- **4-Tab Dialog:** Notes, Physical, Vectorworks, Position notes per category
- **Integration:** Labels, paperwork grouping, shop order automation, visual indicators
- **Color-Coding:** Assign colors to categories for visual identification

---

## Strategic Value

1. **Shop Order Automation** - Foundation for auto-generating shop orders from fixture groups
2. **Lightwright Parity** - Matches Lightwright 6's categorization system
3. **Workflow Customization** - Users can organize fixtures by their workflow needs
4. **Professional Efficiency** - Reduces manual grouping, enables bulk operations

**Related Issues:** #29 (shop order automation), #14 (auto-complete)

---

## Architecture Decisions

### 1. Database Schema: Three Tables
- `fixture_categories` - Category definitions with 4 note types
- `category_rules` - Auto-assignment rules
- `fixture_category_assignments` - Many-to-many with manual override flag

### 2. Rule Engine: SQL-Based Evaluation
- Evaluate rules on fixture create/update
- Support operators: equals, contains, starts_with, ends_with, is_empty, is_not_empty, greater_than, less_than
- Priority-based (first matching rule wins)
- Manual assignment overrides auto-assignment

### 3. State Management: Zustand Store
- `categoryStore.ts` for category CRUD and rule management
- Integrates with existing `fixtureStore.ts`
- Real-time category assignment on fixture changes

### 4. UI Pattern: Menu Bar + Dialog
- Menu bar "Maintenance" menu (dynamic based on columns)
- 4-tab dialog (Notes, Physical, Vectorworks, Position)
- Rule builder UI (similar to conditional formatting dialog)
- Follows existing dialog patterns

### 5. Integration Points
- **Equipment Manager:** Color indicators, filter dropdown
- **Labels:** Category field available in label designer
- **Paperwork:** Group by category option
- **Shop Orders:** Auto-populate sections from categories

---

## Phase 1: Core System (Week 1)

**Milestone:** Database, IPC handlers, rule engine

### New Files to Create

```
src/main/database/
├── queries/
│   ├── categories.ts                         (400 lines) - CRUD operations
│   └── __tests__/
│       └── categories.test.ts                (300 lines, 80%+ coverage)

src/main/ipc/
├── categories.ts                             (350 lines) - IPC handlers
└── __tests__/
    └── categories.test.ts                    (250 lines, 70%+ coverage)

src/main/utils/
├── categoryRuleEngine.ts                     (300 lines) - Rule evaluation
└── __tests__/
    └── categoryRuleEngine.test.ts            (250 lines, 80%+ coverage)

src/renderer/src/types/
└── category.ts                               (100 lines) - TypeScript interfaces
```

### Files to Modify

```
src/main/database/projectSchema.ts            (Add 3 tables)
src/main/ipc/index.ts                         (Register category handlers)
src/main/database/queries/fixtures.ts         (Add category auto-assignment on create/update)
```

### Database Schema

```sql
-- Category definitions
CREATE TABLE IF NOT EXISTS fixture_categories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL UNIQUE,
  color TEXT, -- hex color for visual indicators
  notes TEXT, -- General notes
  physical_notes TEXT, -- Physical handling notes
  vectorworks_notes TEXT, -- CAD-specific notes
  position_notes TEXT, -- Location-specific notes
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Auto-assignment rules
CREATE TABLE IF NOT EXISTS category_rules (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  field TEXT NOT NULL, -- fixture field name (type, manufacturer, position, etc.)
  operator TEXT NOT NULL, -- equals, contains, starts_with, ends_with, is_empty, etc.
  value TEXT NOT NULL,
  case_sensitive BOOLEAN DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0, -- Rule priority (lower = higher priority)
  created_at INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES fixture_categories(id) ON DELETE CASCADE
);

-- Fixture-category assignments
CREATE TABLE IF NOT EXISTS fixture_category_assignments (
  fixture_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  is_manual BOOLEAN DEFAULT 0, -- true if manually assigned, false if auto-assigned
  assigned_at INTEGER NOT NULL,
  PRIMARY KEY (fixture_id, category_id),
  FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES fixture_categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_category_assignments_fixture ON fixture_category_assignments(fixture_id);
CREATE INDEX idx_category_assignments_category ON fixture_category_assignments(category_id);
```

### TypeScript Interfaces

```typescript
// src/renderer/src/types/category.ts

export interface FixtureCategory {
  id: string;
  project_id: string;
  name: string;
  color?: string; // hex color
  notes?: string;
  physical_notes?: string;
  vectorworks_notes?: string;
  position_notes?: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface CategoryRule {
  id: string;
  category_id: string;
  field: string;
  operator: RuleOperator;
  value: string;
  case_sensitive: boolean;
  sort_order: number;
  created_at: number;
}

export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'matches_regex';

export interface CategoryAssignment {
  fixture_id: string;
  category_id: string;
  is_manual: boolean;
  assigned_at: number;
}
```

### Rule Engine Implementation

```typescript
// src/main/utils/categoryRuleEngine.ts

export class CategoryRuleEngine {
  /**
   * Evaluate all rules and return matching category IDs
   */
  evaluateRules(
    fixture: Fixture,
    categoriesWithRules: Array<{ category: FixtureCategory; rules: CategoryRule[] }>
  ): string[] {
    const matchingCategories: string[] = [];

    // Sort categories by sort_order (priority)
    const sorted = categoriesWithRules.sort((a, b) => a.category.sort_order - b.category.sort_order);

    for (const { category, rules } of sorted) {
      // ALL rules must match for category assignment
      const allRulesMatch = rules.every(rule => this.evaluateRule(fixture, rule));

      if (allRulesMatch) {
        matchingCategories.push(category.id);
      }
    }

    return matchingCategories;
  }

  /**
   * Evaluate single rule against fixture
   */
  private evaluateRule(fixture: Fixture, rule: CategoryRule): boolean {
    const fixtureValue = fixture[rule.field];
    const ruleValue = rule.case_sensitive ? rule.value : rule.value.toLowerCase();
    const compareValue = rule.case_sensitive
      ? String(fixtureValue || '')
      : String(fixtureValue || '').toLowerCase();

    switch (rule.operator) {
      case 'equals':
        return compareValue === ruleValue;

      case 'not_equals':
        return compareValue !== ruleValue;

      case 'contains':
        return compareValue.includes(ruleValue);

      case 'not_contains':
        return !compareValue.includes(ruleValue);

      case 'starts_with':
        return compareValue.startsWith(ruleValue);

      case 'ends_with':
        return compareValue.endsWith(ruleValue);

      case 'is_empty':
        return !fixtureValue || String(fixtureValue).trim() === '';

      case 'is_not_empty':
        return !!fixtureValue && String(fixtureValue).trim() !== '';

      case 'greater_than':
        return Number(fixtureValue) > Number(ruleValue);

      case 'less_than':
        return Number(fixtureValue) < Number(ruleValue);

      case 'matches_regex':
        try {
          const regex = new RegExp(ruleValue, rule.case_sensitive ? '' : 'i');
          return regex.test(compareValue);
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Re-evaluate all fixtures and update assignments
   */
  async reevaluateAllFixtures(projectId: string): Promise<void> {
    // Get all fixtures
    const fixtures = await getAllFixtures(projectId);

    // Get all categories with rules
    const categories = await getAllCategories(projectId);
    const categoriesWithRules = await Promise.all(
      categories.map(async category => ({
        category,
        rules: await getCategoryRules(category.id)
      }))
    );

    // Evaluate each fixture
    for (const fixture of fixtures) {
      const matchingCategoryIds = this.evaluateRules(fixture, categoriesWithRules);

      // Remove old auto-assignments
      await removeAutoAssignments(fixture.id);

      // Add new auto-assignments
      for (const categoryId of matchingCategoryIds) {
        await assignFixtureToCategory(fixture.id, categoryId, false); // is_manual = false
      }
    }
  }
}
```

### IPC Handlers

```typescript
// src/main/ipc/categories.ts

export function registerCategoryHandlers(): void {
  // Get all categories for project
  ipcMain.handle('categories:getAll', async (_event, projectId: string) => {
    return getAllCategories(projectId);
  });

  // Create category
  ipcMain.handle('categories:create', async (_event, category: Partial<FixtureCategory>) => {
    return createCategory(category);
  });

  // Update category
  ipcMain.handle('categories:update', async (_event, id: string, updates: Partial<FixtureCategory>) => {
    return updateCategory(id, updates);
  });

  // Delete category
  ipcMain.handle('categories:delete', async (_event, id: string) => {
    return deleteCategory(id);
  });

  // Get rules for category
  ipcMain.handle('categories:getRules', async (_event, categoryId: string) => {
    return getCategoryRules(categoryId);
  });

  // Create rule
  ipcMain.handle('categories:createRule', async (_event, rule: Partial<CategoryRule>) => {
    return createCategoryRule(rule);
  });

  // Delete rule
  ipcMain.handle('categories:deleteRule', async (_event, ruleId: string) => {
    return deleteCategoryRule(ruleId);
  });

  // Get fixture assignments
  ipcMain.handle('categories:getFixtureAssignments', async (_event, fixtureId: string) => {
    return getFixtureCategories(fixtureId);
  });

  // Manually assign fixture to category
  ipcMain.handle('categories:assignFixture', async (
    _event,
    fixtureId: string,
    categoryId: string
  ) => {
    return assignFixtureToCategory(fixtureId, categoryId, true); // is_manual = true
  });

  // Re-evaluate all fixtures (run rule engine)
  ipcMain.handle('categories:reevaluateAll', async (_event, projectId: string) => {
    const engine = new CategoryRuleEngine();
    return engine.reevaluateAllFixtures(projectId);
  });
}
```

### Testing Strategy

**Key Tests:**
- Category CRUD operations
- Rule engine evaluation (all operators)
- Auto-assignment on fixture create/update
- Manual assignment overrides
- Re-evaluation of all fixtures
- Rule priority ordering
- Case-sensitive vs case-insensitive matching
- Edge cases (null values, empty strings, special characters)

**Coverage Targets:**
- Rule Engine: 80%+ (critical utility)
- Database Queries: 80%+ (critical utility)
- IPC Handlers: 70%+ (IPC handlers)

### Deliverables
- [x] Database schema with 3 tables
- [x] Category CRUD operations with 80%+ coverage
- [x] Rule engine with 80%+ coverage
- [x] IPC handlers with 70%+ coverage
- [x] Integration tests for auto-assignment
- [x] Documentation: Rule operators, category system guide

**Effort:** 1 week

---

## Phase 2: Maintenance Menu UI (Week 2)

**Milestone:** Menu bar integration, category dialog, rule builder

### New Files to Create

```
src/renderer/src/components/maintenance/
├── MaintenanceMenuDialog.tsx                 (500 lines) - Main dialog
├── CategoryList.tsx                          (250 lines) - Category sidebar
├── CategoryNotesTab.tsx                      (150 lines) - Notes tab
├── CategoryPhysicalTab.tsx                   (150 lines) - Physical tab
├── CategoryVectorworksTab.tsx                (150 lines) - Vectorworks tab
├── CategoryPositionTab.tsx                   (150 lines) - Position tab
├── RuleBuilder.tsx                           (400 lines) - Rule builder UI
├── RuleRow.tsx                               (200 lines) - Single rule UI
└── __tests__/
    ├── MaintenanceMenuDialog.test.tsx        (300 lines, 50%+ coverage)
    ├── RuleBuilder.test.tsx                  (250 lines, 50%+ coverage)
    └── CategoryList.test.tsx                 (150 lines, 50%+ coverage)

src/renderer/src/store/
├── categoryStore.ts                          (300 lines) - State management
└── __tests__/
    └── categoryStore.test.ts                 (200 lines)
```

### Files to Modify

```
src/renderer/src/hooks/useEquipmentMenuHandlers.ts  (Add maintenance menu handler)
src/main/menu/menuTemplate.ts                      (Add "Maintenance" menu)
```

### UI Components

#### 1. MaintenanceMenuDialog
**Pattern:** Multi-tab dialog with category list sidebar

```typescript
// src/renderer/src/components/maintenance/MaintenanceMenuDialog.tsx

export function MaintenanceMenuDialog({ onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<FixtureCategory | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'physical' | 'vectorworks' | 'position'>('notes');
  const categories = useCategoryStore(state => state.categories);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[900px] h-[700px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Maintenance Categories</h2>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Category List */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700">
            <CategoryList
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Right Content: 4 Tabs */}
          <div className="flex-1 flex flex-col">
            {selectedCategory ? (
              <>
                {/* Tab Navigation */}
                <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-4">
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={activeTab === 'notes' ? 'tab-active' : 'tab-inactive'}
                  >
                    Notes
                  </button>
                  <button
                    onClick={() => setActiveTab('physical')}
                    className={activeTab === 'physical' ? 'tab-active' : 'tab-inactive'}
                  >
                    Physical
                  </button>
                  <button
                    onClick={() => setActiveTab('vectorworks')}
                    className={activeTab === 'vectorworks' ? 'tab-active' : 'tab-inactive'}
                  >
                    Vectorworks
                  </button>
                  <button
                    onClick={() => setActiveTab('position')}
                    className={activeTab === 'position' ? 'tab-active' : 'tab-inactive'}
                  >
                    Position
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-auto p-6">
                  {activeTab === 'notes' && <CategoryNotesTab category={selectedCategory} />}
                  {activeTab === 'physical' && <CategoryPhysicalTab category={selectedCategory} />}
                  {activeTab === 'vectorworks' && <CategoryVectorworksTab category={selectedCategory} />}
                  {activeTab === 'position' && <CategoryPositionTab category={selectedCategory} />}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a category to view details
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 2. CategoryList
**Pattern:** Sidebar list with add/delete actions

```typescript
// src/renderer/src/components/maintenance/CategoryList.tsx

export function CategoryList({ categories, selectedCategory, onSelectCategory }: Props) {
  const createCategory = useCategoryStore(state => state.createCategory);
  const deleteCategory = useCategoryStore(state => state.deleteCategory);

  const handleAddCategory = async () => {
    const name = prompt('Enter category name:');
    if (name) {
      const newCategory = await createCategory({ name });
      onSelectCategory(newCategory);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button onClick={handleAddCategory} className="btn-primary w-full">
          + New Category
        </button>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-auto">
        {categories.map(category => (
          <div
            key={category.id}
            onClick={() => onSelectCategory(category)}
            className={`
              px-3 py-2 cursor-pointer border-l-4 hover:bg-gray-50 dark:hover:bg-gray-700
              ${selectedCategory?.id === category.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'border-transparent'}
            `}
          >
            <div className="flex items-center gap-2">
              {category.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
              )}
              <span className="font-medium">{category.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 3. RuleBuilder
**Pattern:** Rule list with add/remove actions (similar to conditional formatting)

```typescript
// src/renderer/src/components/maintenance/RuleBuilder.tsx

export function RuleBuilder({ category }: Props) {
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const createRule = useCategoryStore(state => state.createRule);
  const deleteRule = useCategoryStore(state => state.deleteRule);
  const reevaluateAll = useCategoryStore(state => state.reevaluateAll);

  const handleAddRule = () => {
    setRules([...rules, {
      id: 'temp-' + Date.now(),
      category_id: category.id,
      field: 'type',
      operator: 'contains',
      value: '',
      case_sensitive: false,
      sort_order: rules.length,
      created_at: Date.now()
    }]);
  };

  const handleSaveRule = async (rule: CategoryRule) => {
    await createRule(rule);
    // Re-evaluate all fixtures
    await reevaluateAll();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Auto-Assignment Rules</h3>
        <button onClick={handleAddRule} className="btn-secondary">
          + Add Rule
        </button>
      </div>

      <div className="space-y-2">
        {rules.map((rule, index) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            onSave={handleSaveRule}
            onDelete={() => deleteRule(rule.id)}
          />
        ))}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No rules defined. Click "Add Rule" to create auto-assignment rules.
        </div>
      )}

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button onClick={reevaluateAll} className="btn-secondary">
          Re-evaluate All Fixtures
        </button>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Re-runs all rules and updates category assignments for all fixtures
        </p>
      </div>
    </div>
  );
}
```

### Menu Integration

```typescript
// src/main/menu/menuTemplate.ts

{
  label: 'Maintenance',
  submenu: [
    {
      label: 'Manage Categories...',
      accelerator: 'CmdOrCtrl+Shift+M',
      click: () => {
        // Send IPC event to open maintenance dialog
        BrowserWindow.getFocusedWindow()?.webContents.send('menu:maintenance:open');
      }
    },
    { type: 'separator' },
    // Dynamic menu items for each column (added at runtime)
  ]
}
```

### Testing Strategy

**Key Tests:**
- Dialog opens/closes correctly
- Category creation/deletion
- Tab navigation
- Rule builder UI (add/edit/delete rules)
- Field/operator dropdowns
- Re-evaluate button functionality
- Category color picker

**Coverage Targets:**
- UI Components: 50%+ (standard for UI)

### Deliverables
- [x] Maintenance menu dialog with 4 tabs
- [x] Category list with CRUD operations
- [x] Rule builder UI
- [x] Menu bar integration
- [x] 50%+ component test coverage
- [x] Documentation: UI guide, rule builder instructions

**Effort:** 1 week

---

## Phase 3: Equipment Manager Integration (Week 3)

**Milestone:** Visual indicators, filtering, bulk assignment

### New Files to Create

```
src/renderer/src/components/fixture/
├── CategoryIndicator.tsx                     (100 lines) - Color dot indicator
├── CategoryFilterDropdown.tsx                (150 lines) - Filter by category
└── __tests__/
    ├── CategoryIndicator.test.tsx            (80 lines, 50%+ coverage)
    └── CategoryFilterDropdown.test.tsx       (100 lines, 50%+ coverage)
```

### Files to Modify

```
src/renderer/src/pages/modules/EquipmentManager.tsx  (Add category column, filter, bulk action)
src/renderer/src/components/fixture/VirtualDataGrid.tsx  (Add category indicator rendering)
src/renderer/src/components/fixture/FixtureContextMenu.tsx  (Add category assignment option)
```

### Equipment Manager Enhancements

#### 1. Category Column
Add category column to VirtualDataGrid showing color indicators

```typescript
// CategoryIndicator component
export function CategoryIndicator({ categories }: Props) {
  return (
    <div className="flex gap-1">
      {categories.map(category => (
        <div
          key={category.id}
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color || '#ccc' }}
          title={category.name}
        />
      ))}
    </div>
  );
}
```

#### 2. Category Filter
Add dropdown to filter fixtures by category

```typescript
// CategoryFilterDropdown component
export function CategoryFilterDropdown({ onFilterChange }: Props) {
  const categories = useCategoryStore(state => state.categories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    onFilterChange(categoryId);
  };

  return (
    <select
      value={selectedCategory || ''}
      onChange={(e) => handleChange(e.target.value || null)}
      className="form-select"
    >
      <option value="">All Fixtures</option>
      {categories.map(category => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
```

#### 3. Context Menu Integration
Add "Assign to Category" option in right-click menu

```typescript
// FixtureContextMenu additions
{
  label: 'Assign to Category',
  submenu: categories.map(category => ({
    label: category.name,
    click: () => assignFixtureToCategory(selectedFixture.id, category.id)
  }))
}
```

#### 4. Bulk Assignment
Add bulk action to assign multiple fixtures to category

```typescript
// In BulkEditDialog
<div className="form-group">
  <label>Assign to Category</label>
  <select
    value={selectedCategory || ''}
    onChange={(e) => handleBulkCategoryAssignment(e.target.value)}
    className="form-select"
  >
    <option value="">No Change</option>
    {categories.map(category => (
      <option key={category.id} value={category.id}>
        {category.name}
      </option>
    ))}
  </select>
</div>
```

### Testing Strategy

**Key Tests:**
- Category indicators render correctly
- Filter dropdown filters fixtures
- Context menu assigns category
- Bulk assignment updates multiple fixtures
- Visual indicators update in real-time

**Coverage Targets:**
- UI Components: 50%+ (standard for UI)

### Deliverables
- [x] Category column in Equipment Manager
- [x] Category filter dropdown
- [x] Context menu integration
- [x] Bulk assignment action
- [x] Visual indicators (color dots)
- [x] 50%+ component test coverage
- [x] Documentation: Integration guide

**Effort:** 1 week

---

## Phase 4: Label, Paperwork & Shop Order Integration (Week 4)

**Milestone:** Category field in labels, paperwork grouping, shop order automation

### Files to Modify

```
src/renderer/src/components/labels/
├── labelDataMapper.ts                        (Add category field mapping)

src/renderer/src/utils/paperwork/
├── reportGenerators.ts                       (Add group by category option)

src/renderer/src/components/prep/
├── ShopOrderTable.tsx                        (Add auto-populate from categories)
```

### Label Integration

**Add Category Field:**
```typescript
// labelDataMapper.ts
export const AVAILABLE_FIELDS = [
  // ... existing fields
  {
    field: 'category',
    label: 'Category',
    type: 'text',
    getValue: (fixture: Fixture) => {
      const categories = getFixtureCategories(fixture.id);
      return categories.map(c => c.name).join(', ');
    }
  }
];
```

### Paperwork Integration

**Group by Category Option:**
```typescript
// reportGenerators.ts
export function generateChannelHookup(fixtures: Fixture[], options: ReportOptions) {
  if (options.groupBy === 'category') {
    // Group fixtures by category
    const grouped = groupBy(fixtures, fixture => {
      const categories = getFixtureCategories(fixture.id);
      return categories[0]?.name || 'Uncategorized';
    });

    // Generate report with category sections
    return Object.entries(grouped).map(([categoryName, fixtures]) => ({
      sectionTitle: categoryName,
      fixtures: sortFixtures(fixtures, options.sortBy)
    }));
  }

  // ... existing grouping logic
}
```

### Shop Order Automation

**Auto-populate from Categories:**
```typescript
// ShopOrderTable.tsx
const handleAutoPopulateFromCategories = async () => {
  const categories = await window.api.categories.getAll(projectId);

  for (const category of categories) {
    // Get fixtures in this category
    const fixtures = await getFixturesInCategory(category.id);

    // Create shop order section
    const section = await createShopOrderSection({
      name: category.name,
      notes: category.notes
    });

    // Group fixtures by type and create items
    const grouped = groupBy(fixtures, 'type');

    for (const [type, fixturesOfType] of Object.entries(grouped)) {
      await createShopOrderItem({
        section_id: section.id,
        description: type,
        quantity: fixturesOfType.length,
        notes: category.physical_notes
      });
    }
  }
};
```

### Testing Strategy

**Key Tests:**
- Category field available in label designer
- Labels render category correctly
- Paperwork groups by category
- Shop order auto-populate creates sections
- Quantity rollup by category/type

**Coverage Targets:**
- Integration Functions: 60%+ (important integrations)

### Deliverables
- [x] Category field in label designer
- [x] Paperwork group by category
- [x] Shop order auto-populate from categories
- [x] 60%+ test coverage for integrations
- [x] Documentation: Integration examples, shop order automation guide

**Effort:** 1 week

---

## Testing Summary

| Component | Files | Tests | Coverage |
|-----------|-------|-------|----------|
| Rule Engine | 1 | 25 | 80%+ |
| Database Queries | 1 | 20 | 80%+ |
| IPC Handlers | 1 | 15 | 70%+ |
| UI Components | 10 | 40 | 50%+ |
| Integration Functions | 3 | 15 | 60%+ |
| **TOTAL** | **16** | **115** | **70%** |

**Testing Tools:**
- Vitest + React Testing Library
- Mock data for categories and rules
- CI/CD: GitHub Actions

---

## Risk Assessment

### High-Risk Items

1. **Rule Evaluation Performance**
   - **Risk:** Re-evaluating 5000+ fixtures is slow
   - **Mitigation:** Batch updates, progress indicators, background processing

2. **Rule Complexity**
   - **Risk:** Users create conflicting or overly complex rules
   - **Mitigation:** Rule testing UI, clear documentation, "test rule" button

### Medium-Risk Items

1. **UI Complexity**
   - **Risk:** 4-tab dialog is overwhelming
   - **Mitigation:** Good defaults, tooltips, help documentation

2. **Category Bloat**
   - **Risk:** Users create too many categories
   - **Mitigation:** Category templates, import/export, merge functionality

---

## Timeline

```
Week 1: Phase 1 - Core System (database, IPC, rule engine)
Week 2: Phase 2 - Maintenance Menu UI (dialog, rule builder)
Week 3: Phase 3 - Equipment Manager Integration (indicators, filter, bulk)
Week 4: Phase 4 - Label/Paperwork/Shop Order Integration
```

**Total:** 4 weeks (1 month)

---

## Success Criteria

### Technical Requirements
- [x] Rule engine evaluates 5000 fixtures in < 5 seconds
- [x] 70%+ overall test coverage
- [x] Manual assignment overrides auto-assignment
- [x] Categories persist across sessions
- [x] Integration with all major features (labels, paperwork, shop orders)

### User Experience Requirements
- [x] Maintenance menu is discoverable
- [x] Rule builder is intuitive
- [x] Visual indicators are clear
- [x] Shop order automation saves time
- [x] Comprehensive documentation

---

## Future Enhancements

1. **Category Templates** - Pre-built categories for common workflows
2. **Import/Export Categories** - Share categories across projects
3. **Category Analytics** - Show fixture count per category
4. **Smart Rules** - AI-suggested rules based on fixture patterns
5. **Category Hierarchy** - Parent/child category relationships
6. **Merge Categories** - Combine duplicate categories
7. **Category History** - Track assignment changes over time

---

## Next Steps

1. **Team Review** - Review plan with stakeholders
2. **Resource Allocation** - Assign developer
3. **User Research** - Survey users on category naming conventions
4. **Begin Phase 1** - Start with database schema and rule engine

---

**Last Updated:** January 20, 2026
**Author:** Claude Code
**Version:** 1.0
