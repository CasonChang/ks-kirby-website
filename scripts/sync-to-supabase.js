#!/usr/bin/env node
/**
 * sync-to-supabase.js
 * 解析 memory/english_learning.md → 寫入 Supabase
 * - vocab/expression → english_entries 表
 * - grammar → cards 表
 * 自動跳過已存在的條目
 */

const fs = require("fs");

const SUPABASE_URL = "https://ccxvgozrxtqatjwebjsa.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeHZnb3pyeHRxYXRqd2VianNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI1NTM0NSwiZXhwIjoyMDk0ODMxMzQ1fQ.AXQb07wWnWyN84UTvv5OnZ7iEQubBKeHfoz4DEnPnNY";
const USER_ID = 1038006955;
const SOURCE = "/home/node/.openclaw/workspace/memory/english_learning.md";

// ── Parse english_learning.md ──────────────────────────────────
function parse() {
  if (!fs.existsSync(SOURCE)) {
    console.log("⚠️  Source file not found:", SOURCE);
    return [];
  }
  const text = fs.readFileSync(SOURCE, "utf-8");
  const lines = text.split("\n");

  const entries = [];
  let currentDate = null;
  let currentEntry = null;

  for (const line of lines) {
    // Date header: ## YYYY-MM-DD
    const h2 = line.match(/^## (\d{4}-\d{2}-\d{2})/);
    if (h2) {
      currentDate = h2[1];
      currentEntry = null;
      continue;
    }
    // Entry: ### type | content
    const h3 = line.match(/^### (\w+) \| (.+)/);
    if (h3 && currentDate) {
      currentEntry = {
        date: currentDate,
        type: h3[1],
        title: h3[2].trim(),
        description: "",
        example: "",
      };
      entries.push(currentEntry);
      continue;
    }
    // Example: > text
    if (currentEntry && line.startsWith("> ")) {
      currentEntry.example = line.replace(/^> /, "").replace(/^"|"$/g, "");
      continue;
    }
    // Description line (non-empty, non-header)
    if (currentEntry && line.trim() && !line.startsWith("#") && !line.startsWith("規則：")) {
      currentEntry.description += (currentEntry.description ? " " : "") + line.trim();
      continue;
    }
    // Grammar rule: 規則：text or 規則: text
    if (currentEntry && (line.startsWith("規則：") || line.startsWith("規則:"))) {
      currentEntry.description = line.replace(/^規則[：:]/, "").trim();
    }
  }

  return entries;
}

// ── Fetch existing data from Supabase ──────────────────────────
async function fetchExisting() {
  // Get existing english_entries (date+title+type combo)
  const eeRes = await fetch(
    `${SUPABASE_URL}/rest/v1/english_entries?select=date,title`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const eeData = await eeRes.json();
  const eeSet = new Set(eeData.map((e) => `${e.date}|${e.title}`));

  // Get existing cards (original text as key)
  const cRes = await fetch(
    `${SUPABASE_URL}/rest/v1/cards?select=original`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const cData = await cRes.json();
  const cSet = new Set(cData.map((c) => c.original));

  return { eeSet, cSet };
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log("🔄 Syncing english_learning.md → Supabase...\n");

  const entries = parse();
  if (entries.length === 0) {
    console.log("⚠️  No entries found.");
    return;
  }
  console.log(`📖 Parsed ${entries.length} entries\n`);

  const { eeSet, cSet } = await fetchExisting();
  console.log(`   Existing english_entries: ${eeSet.size}`);
  console.log(`   Existing cards: ${cSet.size}\n`);

  let eeAdded = 0;
  let cardsAdded = 0;
  let skipped = 0;

  for (const e of entries) {
    if (e.type === "expression" || e.type === "vocabulary") {
      const key = `${e.date}|${e.title}`;
      if (eeSet.has(key)) {
        skipped++;
        continue;
      }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/english_entries`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          user_id: USER_ID,
          date: e.date,
          type: e.type,
          title: e.title,
          description: e.description,
          example: e.example || null,
        }),
      });
      if (res.ok) {
        eeAdded++;
        eeSet.add(key);
      } else {
        console.error(`  ❌ Failed english_entry: ${e.title} — ${await res.text()}`);
      }
    } else if (e.type === "grammar") {
      // Parse "wrong → correct" from title
      const arrowParts = e.title.split(/ → |→/);
      const original = arrowParts[0]?.trim() || "";
      const corrected = arrowParts[1]?.trim() || "";

      // 1) Insert into english_entries (for English learning page)
      const eeKey = `${e.date}|${e.title}`;
      if (!eeSet.has(eeKey)) {
        const eeRes = await fetch(`${SUPABASE_URL}/rest/v1/english_entries`, {
          method: "POST",
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            user_id: USER_ID,
            date: e.date,
            type: "grammar",
            title: e.title,
            description: e.description,
            example: null,
          }),
        });
        if (eeRes.ok) { eeAdded++; eeSet.add(eeKey); }
        else console.error(`  ❌ Failed english_entry (grammar): ${e.title} — ${await eeRes.text()}`);
      }

      // 2) Insert into cards (for review page)
      if (cSet.has(original)) {
        skipped++;
        continue;
      }

      const res = await fetch(`${SUPABASE_URL}/rest/v1/cards`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          user_id: USER_ID,
          original,
          corrected,
          analysis: e.description,
          status: "new",
          created_at: e.date ? `${e.date}T08:00:00+08:00` : new Date().toISOString(),
        }),
      });
      if (res.ok) {
        cardsAdded++;
        cSet.add(original);
      } else {
        console.error(`  ❌ Failed card: ${original} — ${await res.text()}`);
      }
    }
  }

  console.log(`\n📊 Sync complete:`);
  console.log(`   english_entries: +${eeAdded} new`);
  console.log(`   cards: +${cardsAdded} new`);
  console.log(`   skipped: ${skipped} (already exists)`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });