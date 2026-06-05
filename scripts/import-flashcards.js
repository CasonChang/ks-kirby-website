// 匯入 flashcards.json → Supabase
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://ccxvgozrxtqatjwebjsa.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeHZnb3pyeHRxYXRqd2VianNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI1NTM0NSwiZXhwIjoyMDk0ODMxMzQ1fQ.AXQb07wWnWyN84UTvv5OnZ7iEQubBKeHfoz4DEnPnNY";

const cards = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "flashcards.json"), "utf-8")
);

async function main() {
  console.log(`🃏 Importing ${cards.length} cards...\n`);

  let ok = 0, fail = 0;

  // Batch insert in chunks of 20 to avoid rate limiting
  const batchSize = 20;
  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    const rows = batch.map((c) => ({
      user_id: 1038006955,
      original: c.wrong,
      corrected: c.correct,
      analysis: c.rule,
      status: "active",
      created_at: c.date ? `${c.date}T00:00:00+08:00` : new Date().toISOString(),
    }));

    const res = await fetch(`${SUPABASE_URL}/rest/v1/cards`, {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(rows),
    });

    if (res.ok) {
      ok += batch.length;
      process.stdout.write(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} cards\n`);
    } else {
      const err = await res.text();
      console.error(`  ❌ Batch ${Math.floor(i / batchSize) + 1} failed: ${err}`);
      fail += batch.length;
    }
  }

  console.log(`\n📊 Done: ${ok} imported, ${fail} failed`);

  // Verify
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/cards?select=count`,
    { headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` } }
  );
  const countText = await countRes.text();
  console.log(`   Total cards in DB: ${countText}`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });