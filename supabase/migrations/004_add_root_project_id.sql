-- Migration: Add root_project_id to projects table for family/version stacking
--
-- root_project_id = NULL  → this project is a root (standalone or family representative)
-- root_project_id = <uuid> → this project is a copy in the family rooted at that ID
--
-- ON DELETE SET NULL: if a root project is deleted, copies become standalones automatically.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS root_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_root ON projects(root_project_id);
