-- ================================================
-- 🩷 森之卡比 English Flashcard v2 — Supabase 建表
-- 貼到 Supabase SQL Editor 後按 Run
-- ================================================

-- 1. 枚舉類型
DO $$ BEGIN
  CREATE TYPE error_type_enum AS ENUM ('grammar','vocabulary','spelling','punctuation','style','word_choice');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE card_status_enum AS ENUM ('new','learning','review','mastered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
  user_id    BIGINT PRIMARY KEY,
  username   TEXT,
  exp        INT DEFAULT 0,
  level      INT DEFAULT 1,
  daily_goal INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cards
CREATE TABLE IF NOT EXISTS cards (
  card_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  original    TEXT NOT NULL,
  corrected   TEXT NOT NULL,
  translation TEXT,
  analysis    TEXT,
  error_type  error_type_enum,
  status      card_status_enum DEFAULT 'new',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ReviewState（SRS 排程）
CREATE TABLE IF NOT EXISTS review_state (
  state_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id          UUID UNIQUE NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  interval         INT DEFAULT 1,
  ease_factor      REAL DEFAULT 2.5,
  next_review_date TIMESTAMPTZ DEFAULT NOW(),
  repetitions      INT DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ
);

-- 5. ReviewLogs
CREATE TABLE IF NOT EXISTS review_logs (
  log_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  card_id     UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 4),
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 索引
CREATE INDEX IF NOT EXISTS idx_cards_user_id    ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_status     ON cards(status);
CREATE INDEX IF NOT EXISTS idx_review_state_due ON review_state(next_review_date);
CREATE INDEX IF NOT EXISTS idx_review_logs_user ON review_logs(user_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_logs_card ON review_logs(card_id);

-- 7. 建立預設使用者（Telegram ID: 1038006955 = Cason）
INSERT INTO users (user_id, username) VALUES (1038006955, 'KS') ON CONFLICT DO NOTHING;

-- 8. 驗證
SELECT 'users' as tbl, COUNT(*) FROM users
UNION ALL SELECT 'cards', COUNT(*) FROM cards
UNION ALL SELECT 'review_state', COUNT(*) FROM review_state
UNION ALL SELECT 'review_logs', COUNT(*) FROM review_logs;