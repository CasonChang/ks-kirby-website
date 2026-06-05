-- ============================================================
-- RLS policies needed for v3 review.html (anon UPDATE access)
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Ensure RLS is enabled on cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- 2. Allow anon to SELECT cards
CREATE POLICY "Allow anon select cards"
ON cards FOR SELECT
TO anon
USING (true);

-- 3. Allow anon to UPDATE cards (status field changes from review page)
CREATE POLICY "Allow anon update cards"
ON cards FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 4. Allow anon to INSERT cards (for import scripts)
CREATE POLICY "Allow anon insert cards"
ON cards FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Allow anon to DELETE cards (for the delete action)
CREATE POLICY "Allow anon delete cards"
ON cards FOR DELETE
TO anon
USING (true);

-- Verify
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'cards';