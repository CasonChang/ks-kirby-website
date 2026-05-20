// 匯入 english.md 內容 → Supabase english_entries 表
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://ccxvgozrxtqatjwebjsa.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeHZnb3pyeHRxYXRqd2VianNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI1NTM0NSwiZXhwIjoyMDk0ODMxMzQ1fQ.AXQb07wWnWyN84UTvv5OnZ7iEQubBKeHfoz4DEnPnNY";

const text = fs.readFileSync(path.join(__dirname, "..", "content", "english.md"), "utf-8");
const lines = text.split("\n");

const entries = [];
let currentDate = null;
let currentEntry = null;

for (const line of lines) {
  const h2 = line.match(/^## (\d{4}-\d{2}-\d{2})/);
  if (h2) {
    currentDate = h2[1];
    currentEntry = null;
    continue;
  }
  const h3 = line.match(/^### (\w+) \| (.+)/);
  if (h3 && currentDate) {
    currentEntry = { date: currentDate, type: h3[1], title: h3[2], description: "", example: "" };
    entries.push(currentEntry);
    continue;
  }
  if (currentEntry && line.startsWith("> ")) {
    currentEntry.example = line.replace(/^> /, "").replace(/^"|"$/g, "");
    continue;
  }
  if (currentEntry && line.trim() && !line.startsWith("#")) {
    currentEntry.description += (currentEntry.description ? " " : "") + line.trim();
  }
}

console.log(`📖 Parsed ${entries.length} entries from english.md\n`);

async function main() {
  // Insert in batches via REST API
  let ok = 0, fail = 0;
  const batchSize = 30;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const rows = batch.map(e => ({
      user_id: 1038006955,
      date: e.date,
      type: e.type,
      title: e.title,
      description: e.description,
      example: e.example || null,
    }));

    const res = await fetch(`${SUPABASE_URL}/rest/v1/english_entries`, {
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
      process.stdout.write(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} entries\n`);
    } else {
      const err = await res.text();
      console.error(`  ❌ Failed: ${err}`);
      fail += batch.length;
    }
  }

  console.log(`\n📊 Done: ${ok} imported, ${fail} failed`);

  // Verify
  const r = await fetch(`${SUPABASE_URL}/rest/v1/english_entries?select=count`, {
    headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` }
  });
  const t = await r.text();
  console.log(`   Total in DB: ${t}`);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });