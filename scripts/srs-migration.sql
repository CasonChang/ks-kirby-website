-- ============================================================
-- SRS Migration: Add spaced-repetition state to flashcards
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create card_srs table (one row per card)
CREATE TABLE IF NOT EXISTS card_srs (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL UNIQUE REFERENCES cards(card_id) ON DELETE CASCADE,
  ease_factor REAL DEFAULT 2.5,
  repetitions INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  graduated BOOLEAN DEFAULT FALSE,
  total_reviews INTEGER DEFAULT 0,
  total_successes INTEGER DEFAULT 0,
  last_score INTEGER,
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed SRS state for all existing cards (if no existing state)
INSERT INTO card_srs (card_id)
SELECT c.card_id FROM cards c
WHERE NOT EXISTS (
  SELECT 1 FROM card_srs s WHERE s.card_id = c.card_id
);

-- 3. Enable RLS
ALTER TABLE card_srs ENABLE ROW LEVEL SECURITY;

-- 4. Allow anon reads (needed to fetch due cards)
CREATE POLICY "Allow anon read card_srs"
ON card_srs FOR SELECT
TO anon
USING (true);

-- 5. Allow anon inserts (for new cards)
CREATE POLICY "Allow anon insert card_srs"
ON card_srs FOR INSERT
TO anon
WITH CHECK (true);

-- 6. Allow anon updates (for reviewing cards)
CREATE POLICY "Allow anon update card_srs"
ON card_srs FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 7. Verify
SELECT COUNT(*) AS total_srs_records FROM card_srs;
SELECT c.card_id, s.ease_factor, s.repetitions, s.interval_days, s.graduated
FROM cards c LEFT JOIN card_srs s ON c.card_id = s.card_id
LIMIT 5;