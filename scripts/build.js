const fs = require("fs");
const path = require("path");

const BASE = "/ks-kirby-website";
const OUT = path.join(__dirname, "..");

// ─── Tailwind CDN & shared styles ──────────────────────────────────
const CDN_SCRIPT = `<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{'kirby-bg':'#FFF0F3','kirby-pink-light':'#FFB7C5','kirby-pink-main':'#FF8FAB','kirby-pink-dark':'#E06C84','kirby-white':'#FFFFFF'}}}}</script>`;

const ANIM_STYLE = `<style>
@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeIn .5s ease-out forwards;opacity:0}
.fade-1{animation-delay:.1s}.fade-2{animation-delay:.2s}.fade-3{animation-delay:.3s}.fade-4{animation-delay:.4s}.fade-5{animation-delay:.5s}.fade-6{animation-delay:.6s}.fade-7{animation-delay:.7s}.fade-8{animation-delay:.8s}.fade-9{animation-delay:.9s}
.badge{display:inline-block;padding:4px 16px;border-radius:9999px;font-size:.75rem;font-weight:700;margin-bottom:1rem}
.incorrect{text-decoration:line-through;color:#E06C84}.correct{color:#2d8a56;font-weight:600}
</style>`;

// ─── Shared nav ─────────────────────────────────────────────────────
function nav(active) {
  const links = [
    ["/", "🏠 首頁"],
    ["/milestones", "🏆 里程碑"],
    ["/dev-notes", "📝 開發筆記"],
    ["/english", "🇬🇧 英文學習"],
  ];
  return `<nav class="w-full max-w-4xl mx-auto px-6 py-4 flex flex-wrap justify-center gap-3 md:justify-start">${links
    .map(
      ([href, label]) =>
        `<a class="px-4 py-2 rounded-full text-sm md:text-base font-medium transition-all ${
          href === active
            ? "bg-kirby-pink-main text-white shadow-md"
            : "bg-kirby-white/60 text-kirby-pink-dark hover:bg-kirby-pink-light/40"
        }" href="${BASE}${href}">${label}</a>`
    )
    .join("")}</nav>`;
}

// ─── HTML wrapper ───────────────────────────────────────────────────
function wrap(title, active, body) {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title} - 森之卡比</title>${CDN_SCRIPT}${ANIM_STYLE}</head>
<body class="bg-kirby-bg text-kirby-pink-dark font-sans min-h-screen flex flex-col">
${nav(active)}
<main class="max-w-4xl mx-auto px-6 py-12 w-full">${body}</main>
</body></html>`;
}

// ─── Parse markdown into blocks ─────────────────────────────────────
function parseLines(file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf-8");
  const lines = text.split("\n");
  const blocks = [];
  let current = null;

  for (const line of lines) {
    // H2 starts a new block
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      if (current) blocks.push(current);
      current = { title: h2[1].trim(), lines: [] };
      continue;
    }
    // H3 in english - treat as new sub-block
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      if (current) blocks.push(current);
      current = { title: h3[1].trim(), lines: [] };
      continue;
    }
    if (current && line.trim()) {
      current.lines.push(line);
    } else if (current && !line.trim()) {
      // empty line = end of block (unless it's the only empty line)
      if (current.lines.length > 0) {
        blocks.push(current);
        current = null;
      }
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

// ─── Build milestones page ──────────────────────────────────────────
function buildMilestones(blocks) {
  // Filter out comments
  const items = blocks.filter((b) => /^\d{4}-\d{2}-\d{2}/.test(b.title));

  const sections = { social: [], tech: [], error: [], growth: [] };
  const sectionMeta = {
    social: { emoji: "❤️", label: "社交、情感與人格", badge: "bg-kirby-pink-main text-white" },
    tech: { emoji: "🛠️", label: "技術突破與技能", badge: "bg-kirby-pink-dark text-white" },
    error: { emoji: "⚠️", label: "挫折與反省", badge: "bg-kirby-pink-light text-kirby-pink-dark font-bold" },
    growth: { emoji: "📈", label: "成長與習慣", badge: "bg-kirby-pink-main text-white" },
  };

  for (const item of items) {
    const catLine = item.lines.find((l) => l.startsWith("category:"));
    const cat = catLine ? catLine.replace("category:", "").trim() : "social";
    const descIdx = item.lines.findIndex((l) => !l.startsWith("category:") && !l.startsWith("tags:") && !l.startsWith("#"));
    const desc = descIdx >= 0 ? item.lines[descIdx] : "";
    const tagLine = item.lines.find((l) => l.startsWith("tags:"));
    const tags = tagLine
      ? tagLine
          .replace("tags:", "")
          .trim()
          .split(/\s+/)
          .filter(Boolean)
      : [];

    // Parse title: "YYYY-MM-DD | 🎂 Title"
    const titleParts = item.title.match(/^(\d{4}-\d{2}-\d{2}) \| (.+)/);
    const date = titleParts ? titleParts[1] : "";
    const title = titleParts ? titleParts[2] : item.title;

    const isError = cat === "error";
    (sections[cat] || sections.social).push({ date, title, desc, tags, isError });
  }

  let html = `<header class="text-center mb-12 fade-in fade-1"><h1 class="text-4xl md:text-5xl font-bold text-kirby-pink-main mb-4">🏆 里程碑</h1><p class="text-kirby-pink-dark/60 text-lg">記錄我們一起成長的每一個瞬間</p></header>`;

  let idx = 1;
  for (const [key, meta] of Object.entries(sectionMeta)) {
    if (sections[key].length === 0) continue;
    html += `<section class="mb-16 fade-in fade-${idx}"><span class="badge ${meta.badge}">${meta.emoji} ${meta.label}</span><div class="space-y-6">`;
    for (const m of sections[key]) {
      html += `<div class="relative pl-8 border-l-4 border-kirby-pink-light bg-kirby-white/60 rounded-r-3xl p-6 shadow-sm">
<div class="absolute -left-[10px] top-8 w-4 h-4 rounded-full ${m.isError ? "bg-kirby-pink-dark" : "bg-kirby-pink-main"} shadow-[0_0_8px_rgba(255,143,171,0.6)]"></div>
<div class="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2"><h2 class="text-xl font-bold text-kirby-pink-dark">${m.title}</h2><span class="text-sm font-medium text-kirby-pink-dark/50 bg-kirby-pink-light/20 px-3 py-1 rounded-full w-fit">${m.date}</span></div>
<p class="text-kirby-pink-dark/80 leading-relaxed mb-3">${m.desc}</p>
<div class="flex flex-wrap gap-2">${m.tags.map((t) => `<span class="text-xs font-semibold text-kirby-pink-main bg-kirby-pink-main/10 px-2 py-1 rounded">${t}</span>`).join("")}</div></div>`;
    }
    html += `</div></section>`;
    idx++;
  }
  return wrap("里程碑", "/milestones", html);
}

// ─── Build dev-notes page ───────────────────────────────────────────
function buildDevNotes(blocks) {
  const items = blocks.filter((b) => /^\d{4}-\d{2}-\d{2}/.test(b.title));

  let html = `<header class="text-center mb-12 fade-in fade-1"><h1 class="text-4xl md:text-5xl font-bold text-kirby-pink-main mb-4">📝 開發筆記</h1><p class="text-kirby-pink-dark/60 text-lg">記錄寫程式時的點點滴滴</p></header><div class="space-y-8">`;

  items.forEach((item, i) => {
    const titleParts = item.title.match(/^(\d{4}-\d{2}-\d{2}) \| (.+)/);
    const date = titleParts ? titleParts[1] : "";
    const title = titleParts ? titleParts[2] : item.title;
    const catLine = item.lines.find((l) => l.startsWith("category:"));
    const cat = catLine ? catLine.replace("category:", "").trim() : "general";

    // Find description: lines before 🎯
    const tipIdx = item.lines.findIndex((l) => l.startsWith("🎯"));
    const tagIdx = item.lines.findIndex((l) => l.startsWith("tags:"));
    const endIdx = tipIdx >= 0 ? tipIdx : tagIdx >= 0 ? tagIdx : item.lines.length;
    const descLines = item.lines.slice(0, endIdx).filter((l) => !l.startsWith("category:"));
    const desc = descLines.join(" ");
    const tip = tipIdx >= 0 ? item.lines[tipIdx] : "";

    html += `<div class="bg-kirby-white/60 rounded-2xl p-6 shadow-sm border border-kirby-pink-light/30 fade-in fade-${Math.min(i + 2, 9)}">
<div class="flex items-start justify-between mb-3"><span class="text-xs font-semibold text-kirby-pink-main bg-kirby-pink-main/10 px-2 py-1 rounded">#${cat}</span><span class="text-xs text-kirby-pink-dark/40">${date}</span></div>
<h3 class="text-xl font-bold text-kirby-pink-dark mb-3">${title}</h3>
<p class="text-kirby-pink-dark/70 text-sm leading-relaxed mb-3">${desc}</p>
${tip ? `<p class="text-kirby-pink-dark/70 text-sm leading-relaxed">${tip}</p>` : ""}</div>`;
  });
  html += `</div>`;
  return wrap("開發筆記", "/dev-notes", html);
}

// ─── Build english page ─────────────────────────────────────────────
function buildEnglish(blocks) {
  // Group by date (H2 blocks), then sub-blocks (H3)
  // We need a different parser for english because it uses ## for dates and ### for entries

  // Re-parse with special handling
  const text = fs.readFileSync(path.join(__dirname, "..", "content", "english.md"), "utf-8");
  const lines = text.split("\n");

  const dates = [];
  let currentDate = null;
  let currentEntry = null;

  for (const line of lines) {
    const h2 = line.match(/^## (\d{4}-\d{2}-\d{2})/);
    if (h2) {
      if (currentDate) dates.push(currentDate);
      currentDate = { date: h2[1], entries: [] };
      currentEntry = null;
      continue;
    }
    const h3 = line.match(/^### (\w+) \| (.+)/);
    if (h3 && currentDate) {
      currentEntry = { type: h3[1], title: h3[2], desc: "", example: "" };
      currentDate.entries.push(currentEntry);
      continue;
    }
    if (currentEntry && line.startsWith("> ")) {
      currentEntry.example = line.replace(/^> /, "");
      continue;
    }
    if (currentEntry && line.trim() && !line.startsWith("#")) {
      currentEntry.desc += (currentEntry.desc ? " " : "") + line.trim();
    }
  }
  if (currentDate) dates.push(currentDate);

  let html = `<header class="text-center mb-12 fade-in fade-1"><h1 class="text-4xl md:text-5xl font-bold text-kirby-pink-main mb-4">🇬🇧 英文學習</h1><p class="text-kirby-pink-dark/60 text-lg">Let's learn English together! — 每日學習記錄</p></header>`;

  dates.forEach((d, di) => {
    html += `<section class="mb-12 fade-in fade-${Math.min(di + 2, 9)}">
<div class="flex items-center gap-3 mb-6"><span class="text-sm font-bold text-kirby-white bg-kirby-pink-main px-3 py-1 rounded-full">📅 ${d.date}</span></div>`;

    const expressions = d.entries.filter((e) => e.type === "expression" || e.type === "vocabulary");
    const grammars = d.entries.filter((e) => e.type === "grammar");

    if (expressions.length > 0) {
      html += `<div class="bg-kirby-white/60 rounded-2xl p-6 shadow-sm border border-kirby-pink-light/30 mb-6">
<h2 class="text-lg font-bold text-kirby-pink-main mb-4">🌟 表達與單字</h2><div class="space-y-4">`;
      for (const e of expressions) {
        html += `<div class="p-4 bg-kirby-bg rounded-xl">
<h3 class="font-bold text-kirby-pink-dark mb-2">"${e.title}"</h3>
<p class="text-kirby-pink-dark/70 text-sm mb-2">${e.desc}</p>
${e.example ? `<p class="text-kirby-pink-dark/70 text-sm italic pl-3 border-l-2 border-kirby-pink-light/50">${e.example}</p>` : ""}</div>`;
      }
      html += `</div></div>`;
    }

    if (grammars.length > 0) {
      html += `<div class="bg-kirby-white/60 rounded-2xl p-6 shadow-sm border border-kirby-pink-light/30">
<h2 class="text-lg font-bold text-kirby-pink-main mb-4">🛠️ 文法修正筆記</h2><div class="space-y-3">`;
      for (const g of grammars) {
        const parts = g.title.split(" → ");
        const wrong = parts[0] || "";
        const right = parts[1] || "";
        html += `<div class="flex flex-col gap-1 p-3 bg-kirby-bg rounded-xl">
<p><span class="incorrect">${wrong}</span> → <span class="correct">${right}</span></p>
<p class="text-xs text-kirby-pink-dark/50">${g.desc}</p></div>`;
      }
      html += `</div></div>`;
    }
    html += `</section>`;
  });

  html += `<div class="bg-gradient-to-r from-kirby-pink-main/10 to-kirby-pink-light/20 rounded-2xl p-6 border border-kirby-pink-light/50 fade-in"><h3 class="text-lg font-bold text-kirby-pink-dark mb-3">💡 學習小技巧</h3><ul class="text-kirby-pink-dark/70 space-y-2"><li>📝 每次練習後記下 <strong class="text-kirby-pink-main">實際被糾正的句子</strong>，比背 100 個單字更有用</li><li>🗣️ 把新學的表達 <strong class="text-kirby-pink-main">大聲說出來</strong>，讓嘴巴習慣英文的發音節奏</li><li>🔄 <strong class="text-kirby-pink-main">間隔複習</strong>：今天學的，明天、三天後、一週後各複習一次</li></ul></div>`;

  return wrap("英文學習", "/english", html);
}

// ─── Main ────────────────────────────────────────────────────────────
console.log("🔨 Building site from content/*.md ...");

const milestoneBlocks = parseLines(path.join(__dirname, "..", "content", "milestones.md"));
const devBlocks = parseLines(path.join(__dirname, "..", "content", "dev-notes.md"));

const milestonesHTML = buildMilestones(milestoneBlocks);
const devNotesHTML = buildDevNotes(devBlocks);
const englishHTML = buildEnglish([]); // english uses special parser internally

fs.writeFileSync(path.join(OUT, "milestones.html"), milestonesHTML);
fs.writeFileSync(path.join(OUT, "dev-notes.html"), devNotesHTML);
fs.writeFileSync(path.join(OUT, "english.html"), englishHTML);

console.log("✅ milestones.html");
console.log("✅ dev-notes.html");
console.log("✅ english.html");
console.log("🎉 Build complete!");