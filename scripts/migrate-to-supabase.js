const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function tryConnect(host, port, user) {
  const pool = new Pool({
    host, port, user,
    password: "ks-kirby-english-study",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    family: 4,   // force IPv4
    connectionTimeoutMillis: 5000,
  });
  try {
    const r = await pool.query("SELECT NOW() as t");
    console.log(`✅ Success! host=${host} port=${port} user=${user} time=${r.rows[0].t}`);
    return pool;
  } catch (e) {
    console.log(`❌ Failed: host=${host} port=${port} user=${user} => ${e.message}`);
    await pool.end();
    return null;
  }
}

async function main() {
  // Try multiple connection combos
  const combos = [
    // Direct connection (IPv4)
    ["db.ccxvgozrxtqatjwebjsa.supabase.co", 5432, "postgres"],
    ["db.ccxvgozrxtqatjwebjsa.supabase.co", 6543, "postgres"],
    // Pooler - different regions
    ["aws-0-ap-southeast-1.pooler.supabase.com", 6543, "postgres.ccxvgozrxtqatjwebjsa"],
    ["aws-0-ap-southeast-1.pooler.supabase.com", 5432, "postgres.ccxvgozrxtqatjwebjsa"],
    ["aws-0-ap-northeast-1.pooler.supabase.com", 6543, "postgres.ccxvgozrxtqatjwebjsa"],
    ["aws-0-us-east-1.pooler.supabase.com", 6543, "postgres.ccxvgozrxtqatjwebjsa"],
  ];

  let pool = null;
  for (const [h, p, u] of combos) {
    pool = await tryConnect(h, p, u);
    if (pool) break;
  }

  if (!pool) {
    console.log("\n❌ All connection attempts failed. Cannot proceed.");
    process.exit(1);
  }

  // ── Schema ──
  console.log("\n📦 Creating schema...\n");
  const schema = `
    DO $$ BEGIN
      CREATE TYPE error_type_enum AS ENUM ('grammar','vocabulary','spelling','punctuation','style','word_choice');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE card_status_enum AS ENUM ('new','learning','review','mastered');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE TABLE IF NOT EXISTS users (
      user_id BIGINT PRIMARY KEY, username TEXT, exp INT DEFAULT 0, level INT DEFAULT 1,
      daily_goal INT DEFAULT 10, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS cards (
      card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      original TEXT NOT NULL, corrected TEXT NOT NULL, translation TEXT, analysis TEXT,
      error_type error_type_enum, status card_status_enum DEFAULT 'new', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS review_state (
      state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), card_id UUID UNIQUE NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
      interval INT DEFAULT 1, ease_factor REAL DEFAULT 2.5, next_review_date TIMESTAMPTZ DEFAULT NOW(),
      repetitions INT DEFAULT 0, last_reviewed_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS review_logs (
      log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      card_id UUID NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
      rating SMALLINT CHECK (rating BETWEEN 1 AND 4), reviewed_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
    CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
    CREATE INDEX IF NOT EXISTS idx_review_state_due ON review_state(next_review_date);
    CREATE INDEX IF NOT EXISTS idx_review_logs_user ON review_logs(user_id, reviewed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_review_logs_card ON review_logs(card_id);
  `;
  await pool.query(schema);
  console.log("✅ Schema created!\n");

  // ── Default user ──
  const casonId = 1038006955;
  await pool.query(
    "INSERT INTO users (user_id, username) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [casonId, "KS"]
  );
  console.log("✅ Default user ready\n");

  // ── Migrate flashcards ──
  const fp = path.join(__dirname, "..", "data", "flashcards.json");
  if (fs.existsSync(fp)) {
    const cards = JSON.parse(fs.readFileSync(fp, "utf-8"));
    console.log(`🃏 Migrating ${cards.length} cards...\n`);
    for (const c of cards) {
      await pool.query(
        "INSERT INTO cards (user_id, original, corrected, analysis, status, created_at) VALUES ($1,$2,$3,$4,'new',$5)",
        [casonId, c.wrong, c.correct, c.rule, c.date || new Date().toISOString()]
      );
    }
    console.log(`✅ ${cards.length} cards migrated!\n`);
  }

  // ── Verify ──
  const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log("📊 Tables:", r.rows.map(x => x.table_name).join(", "));
  const cc = await pool.query("SELECT COUNT(*)::int as c FROM cards");
  console.log(`   Cards: ${cc.rows[0].c}`);
  console.log("\n🎉 Done!");
  await pool.end();
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });