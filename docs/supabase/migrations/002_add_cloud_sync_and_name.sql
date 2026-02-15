-- Add cloud_sync flag and name column to licenses table
-- Run this in Supabase SQL editor (for deployments using 001_licenses.sql without these columns)
--
-- cloud_sync: controls whether this license is allowed to use PowerSync cloud sync.
--   Set to true by admin when granting cloud access (professional/institutional tiers).
--   Checked by the client in LicenseService when determining canSync status.
--
-- name: user display name, populated from Supabase auth profile on license claim.

ALTER TABLE licenses ADD COLUMN IF NOT EXISTS cloud_sync BOOLEAN DEFAULT false;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS name TEXT;
