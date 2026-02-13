-- Add cloud_sync flag to licenses table
-- Run this in Supabase SQL editor
ALTER TABLE licenses ADD COLUMN cloud_sync BOOLEAN DEFAULT false;
