-- ============================================================
-- 🩷 v3 Migration: Simplify to 3-level system (active / learned / deleted)
-- Run this in Supabase SQL Editor
-- 
-- Before running: verify current state
-- SELECT status, COUNT(*) FROM cards GROUP BY status;
-- ============================================================

-- 1. Add new enum values (active, learned, deleted)
-- PostgreSQL doesn't allow adding values inside a transaction with ALTER TYPE...ADD VALUE
-- So we do it one by one
DO $$ BEGIN
  ALTER TYPE card_status_enum ADD VALUE 'active';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE card_status_enum ADD VALUE 'learned';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE card_status_enum ADD VALUE 'deleted';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Migrate existing status values
UPDATE cards SET status = 'active'  WHERE status IN ('new', 'learning', 'review');
UPDATE cards SET status = 'learned' WHERE status = 'mastered';

-- 3. Add learned_at column for tracking
ALTER TABLE cards ADD COLUMN IF NOT EXISTS learned_at TIMESTAMPTZ;

-- 4. Verify
SELECT status, COUNT(*) FROM cards GROUP BY status ORDER BY status;