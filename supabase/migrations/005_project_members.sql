-- ============================================
-- Migration 005: Collaboration Membership Tables
-- ============================================
-- Creates project_members and shop_order_members tables for multi-user
-- collaboration, and fixes user_preferences to be per-user (not per-project)
-- so collaborators don't overwrite each other's UI prefs.
--
-- Note: projects.id and shop_order_projects.id are TEXT PKs, so foreign
-- key columns referencing them are also TEXT.
-- ============================================

-- ============================================
-- PROJECT MEMBERS TABLE
-- ============================================

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL until invitation accepted
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at BIGINT NOT NULL,
  accepted_at BIGINT,
  UNIQUE (project_id, email)
);

CREATE INDEX project_members_project_id_idx ON project_members(project_id);
CREATE INDEX project_members_user_id_idx ON project_members(user_id);
CREATE INDEX project_members_email_idx ON project_members(email);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SHOP ORDER MEMBERS TABLE
-- ============================================

CREATE TABLE shop_order_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_order_id TEXT NOT NULL REFERENCES shop_order_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL until invitation accepted
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at BIGINT NOT NULL,
  accepted_at BIGINT,
  UNIQUE (shop_order_id, email)
);

CREATE INDEX shop_order_members_shop_order_id_idx ON shop_order_members(shop_order_id);
CREATE INDEX shop_order_members_user_id_idx ON shop_order_members(user_id);
CREATE INDEX shop_order_members_email_idx ON shop_order_members(email);

ALTER TABLE shop_order_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FIX user_preferences: add per-user scoping
-- ============================================
-- In a shared project, each collaborator needs their own UI preferences
-- (column visibility, sort order, etc.) independently of other members.
-- Adding user_id and changing the unique constraint achieves this.

ALTER TABLE user_preferences ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Backfill user_id from the parent project's owner
UPDATE user_preferences
SET user_id = (
  SELECT user_id FROM projects WHERE id = project_id
);

ALTER TABLE user_preferences ALTER COLUMN user_id SET NOT NULL;

-- Replace the old unique constraint with a per-user one
ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_project_id_preference_key_key;
ALTER TABLE user_preferences ADD UNIQUE (project_id, user_id, preference_key);

-- ============================================
-- SUCCESS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 005 complete: project_members, shop_order_members created; user_preferences updated with user_id.';
END $$;
