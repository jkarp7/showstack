-- ============================================
-- Migration 008: Denormalize columns for PowerSync
-- ============================================
-- PowerSync sync rules cannot use JOINs in either parameters or data queries.
-- Two tables lack a direct filtering column:
--   - dimmer_rack_modules: has rack_id but not project_id
--   - shop_order_items:    has section_id but not shop_order_id
--
-- Solution: add a denormalized column to each, backfill from the parent,
-- then keep it in sync via a BEFORE INSERT/UPDATE trigger.
-- ============================================


-- ============================================
-- dimmer_rack_modules: add project_id
-- ============================================

ALTER TABLE dimmer_rack_modules
  ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;

-- Backfill from parent dimmer_racks
UPDATE dimmer_rack_modules
SET project_id = dimmer_racks.project_id
FROM dimmer_racks
WHERE dimmer_racks.id = dimmer_rack_modules.rack_id;

-- Enforce NOT NULL after backfill
ALTER TABLE dimmer_rack_modules
  ALTER COLUMN project_id SET NOT NULL;

-- Trigger function: keep project_id in sync with rack_id
CREATE OR REPLACE FUNCTION sync_dimmer_rack_module_project_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT project_id INTO NEW.project_id
  FROM dimmer_racks
  WHERE id = NEW.rack_id;

  IF NEW.project_id IS NULL THEN
    RAISE EXCEPTION 'dimmer_rack_module: rack_id % not found', NEW.rack_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER dimmer_rack_modules_sync_project_id
BEFORE INSERT OR UPDATE ON dimmer_rack_modules
FOR EACH ROW
EXECUTE FUNCTION sync_dimmer_rack_module_project_id();


-- ============================================
-- shop_order_items: add shop_order_id
-- ============================================
-- shop_order_sections.prep_project_id IS the shop_order_id
-- (shop_order_projects.id). Naming it shop_order_id here for clarity.

ALTER TABLE shop_order_items
  ADD COLUMN shop_order_id TEXT REFERENCES shop_order_projects(id) ON DELETE CASCADE;

-- Backfill from parent shop_order_sections
UPDATE shop_order_items
SET shop_order_id = shop_order_sections.prep_project_id
FROM shop_order_sections
WHERE shop_order_sections.id = shop_order_items.section_id;

-- Enforce NOT NULL after backfill
ALTER TABLE shop_order_items
  ALTER COLUMN shop_order_id SET NOT NULL;

-- Trigger function: keep shop_order_id in sync with section_id
CREATE OR REPLACE FUNCTION sync_shop_order_item_shop_order_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT prep_project_id INTO NEW.shop_order_id
  FROM shop_order_sections
  WHERE id = NEW.section_id;

  IF NEW.shop_order_id IS NULL THEN
    RAISE EXCEPTION 'shop_order_item: section_id % not found', NEW.section_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER shop_order_items_sync_shop_order_id
BEFORE INSERT OR UPDATE ON shop_order_items
FOR EACH ROW
EXECUTE FUNCTION sync_shop_order_item_shop_order_id();


-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 008 complete: project_id added to dimmer_rack_modules, shop_order_id added to shop_order_items.';
END $$;
