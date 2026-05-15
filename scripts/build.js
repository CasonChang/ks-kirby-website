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
.cat-btn{transition:all .2s}.cat-btn.active{background-color:#FF8FAB!important;color:#fff!important}
select:focus{outline:none;border-color:#FF8FAB!important;box-shadow:0 0 0 2px rgba(255,143,171,.3)}
.nav-btn:disabled{opacity:.3;cursor:not-allowed}.nav-btn:not(:disabled):hover{opacity:1;background-color:#FFB7C5}
</style>`;

// ─── Shared nav ─────────────────────────────────────────────────────
function nav(active) {
  const links = [
    ["/", "🏠 首頁"],
    ["/milestones", "🏆 里程碑"],
    ["/dev-notes", "📝 開發筆記"],
    ["/english", "📖 英文學習"],
  ];
  return `<nav class="w-full max-w-4xl mx-auto px-6 py-4 flex justify-start md:justify-center gap-3 overflow-x-auto no-scrollbar whitespace-nowrap">${links
    .map(
      ([href, label]) =>
        `<a class="px-4 py-2 rounded-full text-sm md:text-base font-medium transition-all shrink-0 ${
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
<main class="max-w-4xl mx-auto px-4 py-8 sm:px-6 sm:py-12 w-full overflow-x-hidden">${body}</main>
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
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      if (current) blocks.push(current);
      current = { title: h2[1].trim(), lines: [] };
      continue;
    }
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      if (current) blocks.push(current);
      current = { title: h3[1].trim(), lines: [] };
      continue;
    }
    if (current && line.trim()) {
      current.lines.push(line);
    } else if (current && !line.trim()) {
      if (current.lines.length > 0) {
        blocks.push(current);
        current = null;
      }
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

// =====================================================================
//  STEP 3: MILESTONES — Category Filter Pills
// =====================================================================
function buildMilestones(blocks) {
  const items = blocks.filter((b) => /^\d{4}-\d{2}-\d{2}/.test(b.title));

  const catMeta = {
    social: { emoji: "❤️", label: "社交情感", badge: "bg-kirby-pink-main text-white" },
    tech:   { emoji: "🛠️", label: "技術突破", badge: "bg-kirby-pink-dark text-white" },
    error:  { emoji: "⚠️", label: "挫折反省", badge: "bg-kirby-pink-light text-kirby-pink-dark font-bold" },
    growth: { emoji: "📈", label: "成長習慣", badge: "bg-kirby-pink-main text-white" },
  };

  const milestones = [];
  for (const item of items) {
    const catLine = item.lines.find((l) => l.startsWith("category:"));
    const cat = catLine ? catLine.replace("category:", "").trim() : "social";
    const descIdx = item.lines.findIndex((l) => !l.startsWith("category:") && !l.startsWith("tags:") && !l.startsWith("#"));
    const desc = descIdx >= 0 ? item.lines[descIdx] : "";
    const tagLine = item.lines.find((l) => l.startsWith("tags:"));
    const tags = tagLine ? tagLine.replace("tags:", "").trim().split(/\s+/).filter(Boolean) : [];
    const titleParts = item.title.match(/^(\d{4}-\d{2}-\d{2}) \| (.+)/);
    milestones.push({
      date: titleParts ? titleParts[1] : "",
      title: titleParts ? titleParts[2] : item.title,
      desc,
      cat,
      tags,
    });
  }

  const pillsHTML = Object.entries(catMeta)
    .map(([key, m]) => `<button class="cat-btn shrink-0 bg-kirby-white/60 text-kirby-pink-dark px-5 py-2 rounded-full text-sm font-semibold" data-cat="${key}">${m.emoji} ${m.label}</button>`)
    .join("\n");

  const dataJSON = JSON.stringify(milestones);
  const metaJSON = JSON.stringify(catMeta);

  const html = `
<header class="text-center mb-8 fade-in fade-1">
  <h1 class="text-4xl md:text-5xl font-bold text-kirby-pink-main mb-4">🏆 里程碑</h1>
  <p class="text-kirby-pink-dark/60 text-lg">記錄我們一起成長的每一個瞬間</p>
</header>

<div id="milestone-filters" class="flex justify-start md:justify-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap mb-10">
  <button class="cat-btn active bg-kirby-pink-main text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shrink-0" data-cat="all">All</button>
  ${pillsHTML}
</div>

<div id="milestone-list" class="space-y-6"></div>

<script>
(function(){
  const data = ${dataJSON};
  const catMeta = ${metaJSON};
  const catsOrder = ['social','tech','error','growth'];

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function renderItem(item, arr, meta){
    var isErr = item.cat === 'error';
    arr.push(
      '<div class="relative pl-8 border-l-4 border-kirby-pink-light bg-kirby-white/60 rounded-r-3xl p-6 shadow-sm fade-in">',
      '<div class="absolute -left-[10px] top-8 w-4 h-4 rounded-full '+(isErr?'bg-kirby-pink-dark':'bg-kirby-pink-main')+' shadow-[0_0_8px_rgba(255,143,171,0.6)]"></div>',
      '<div class="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2"><h2 class="text-xl font-bold text-kirby-pink-dark">'+esc(item.title)+'</h2><span class="text-sm font-medium text-kirby-pink-dark/50 bg-kirby-pink-light/20 px-3 py-1 rounded-full w-fit">'+item.date+'</span></div>',
      '<p class="text-kirby-pink-dark/80 leading-relaxed mb-3">'+esc(item.desc)+'</p>',
      '<div class="flex flex-wrap gap-2">'+item.tags.map(function(t){ return '<span class="text-xs font-semibold text-kirby-pink-main bg-kirby-pink-main/10 px-2 py-1 rounded">'+t+'</span>'; }).join('')+'</div>',
      '</div>'
    );
  }

  function renderAll(cat){
    var list = document.getElementById('milestone-list');
    var items = cat === 'all' ? data : data.filter(function(i){ return i.cat === cat; });
    if(!items.length){ list.innerHTML='<p class="text-center text-kirby-pink-dark/40 py-12">尚無此類別的里程碑 🩷</p>'; return; }

    var parts = [];
    if(cat === 'all'){
      for(var ci=0; ci<catsOrder.length; ci++){
        var c = catsOrder[ci];
        var subset = data.filter(function(i){ return i.cat === c; });
        if(!subset.length) continue;
        var m = catMeta[c];
        parts.push('<section class="mb-12 fade-in"><span class="badge '+m.badge+'">'+m.emoji+' '+m.label+'</span><div class="space-y-6">');
        for(var si=0; si<subset.length; si++) renderItem(subset[si], parts, m);
        parts.push('</div></section>');
      }
    } else {
      var m = catMeta[cat];
      parts.push('<section class="fade-in"><span class="badge '+m.badge+'">'+m.emoji+' '+m.label+'</span><div class="space-y-6">');
      for(var i=0; i<items.length; i++) renderItem(items[i], parts, m);
      parts.push('</div></section>');
    }
    list.innerHTML = parts.join('');
  }

  var btns = document.querySelectorAll('#milestone-filters .cat-btn');
  for(var i=0; i<btns.length; i++){
    btns[i].addEventListener('click', function(){
      for(var j=0; j<btns.length; j++){ btns[j].classList.remove('active','bg-kirby-pink-main','text-white'); btns[j].classList.add('bg-kirby-white/60','text-kirby-pink-dark'); }
      this.classList.remove('bg-kirby-white/60','text-kirby-pink-dark');
      this.classList.add('active','bg-kirby-pink-main','text-white');
      renderAll(this.dataset.cat);
    });
  }
  renderAll('all');
})();
</script>`;
  return wrap("里程碑", "/milestones", html);
}

// =====================================================================
//  STEP 4: DEV NOTES — Month + Date Selector with Prev/Next
// =====================================================================
function buildDevNotes(blocks) {
  const items = blocks.filter((b) => /^\d{4}-\d{2}-\d{2}/.test(b.title));

  const notes = [];
  for (const b of items) {
    const titleParts = b.title.match(/^(\d{4}-\d{2}-\d{2}) \| (.+)/);
    const date = titleParts ? titleParts[1] : "";
    const title = titleParts ? titleParts[2] : b.title;
    const catLine = b.lines.find((l) => l.startsWith("category:"));
    const cat = catLine ? catLine.replace("category:", "").trim() : "general";
    const tipIdx = b.lines.findIndex((l) => l.startsWith("🎯"));
    const tagIdx = b.lines.findIndex((l) => l.startsWith("tags:"));
    const endIdx = tipIdx >= 0 ? tipIdx : tagIdx >= 0 ? tagIdx : b.lines.length;
    const descLines = b.lines.slice(0, endIdx).filter((l) => !l.startsWith("category:"));
    const desc = descLines.join(" ");
    const tip = tipIdx >= 0 ? b.lines[tipIdx] : "";
    const tagLine = b.lines.find((l) => l.startsWith("tags:"));
    const tags = tagLine ? tagLine.replace("tags:", "").trim().split(/\s+/).filter(Boolean) : [];
    notes.push({ date, title, cat, desc, tip, tags });
  }

  // Group by date, sorted descending
  const byDate = {};
  for (const n of notes) {
    if (!byDate[n.date]) byDate[n.date] = [];
    byDate[n.date].push(n);
  }
  const dateKeys = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  // Unique months
  const months = [...new Set(dateKeys.map((d) => d.substring(0, 7)))].sort((a, b) => b.localeCompare(a));

  const dataJSON = JSON.stringify({ notes, byDate, dateKeys, months });

  const monthOpts = months.map((m) => `<option value="${m}">${m}</option>`).join("\n");
  const dateOpts = dateKeys.map((d) => `<option value="${d}">${d}</option>`).join("\n");

  const html = `
<header class="text-center mb-8 fade-in fade-1">
  <h1 class="text-4xl md:text-5xl font-bold text-kirby-pink-main mb-4">📝 開發筆記</h1>
  <p class="text-kirby-pink-dark/60 text-lg">記錄寫程式時的點點滴滴</p>
</header>

<div class="flex items-center justify-start md:justify-center gap-3 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap px-2">
  <button id="prev-btn" class="nav-btn bg-kirby-pink-light/40 text-kirby-pink-dark px-3 py-2 rounded-full text-sm font-bold transition-all shrink-0" title="上一頁">←</button>
  <div class="flex items-center gap-2 shrink-0">
    <label class="text-sm font-semibold text-kirby-pink-dark whitespace-nowrap">📅 月份</label>
    <select id="month-select" class="bg-kirby-white/60 border border-kirby-pink-light/50 rounded-lg px-3 py-2 text-sm text-kirby-pink-dark">
      <option value="all">全部月份</option>
      ${monthOpts}
    </select>
  </div>
  <div class="flex items-center gap-2 shrink-0">
    <label class="text-sm font-semibold text-kirby-pink-dark whitespace-nowrap">📆 日期</label>
    <select id="date-select" class="bg-kirby-white/60 border border-kirby-pink-light/50 rounded-lg px-3 py-2 text-sm text-kirby-pink-dark">
      <option value="all">全部日期</option>
      ${dateOpts}
    </select>
  </div>
  <button id="next-btn" class="nav-btn bg-kirby-pink-light/40 text-kirby-pink-dark px-3 py-2 rounded-full text-sm font-bold transition-all shrink-0" title="下一頁">→</button>
</div>

<div id="dev-notes-list" class="space-y-8"></div>

<script>
(function(){
  var _D = ${dataJSON};
  var notes = _D.notes;
  var byDate = _D.byDate;
  var dateKeys = _D.dateKeys;
  var months = _D.months;
  var currentIdx = 0; // position in whichever list we're navigating

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function getVisibleDates(){
    var m = document.getElementById('month-select').value;
    return m === 'all' ? dateKeys : dateKeys.filter(function(d){ return d.substring(0,7) === m; });
  }

  function render(){
    var monthVal = document.getElementById('month-select').value;
    var dateVal = document.getElementById('date-select').value;
    var list = document.getElementById('dev-notes-list');

    var visible;

    if(dateVal !== 'all'){
      visible = byDate[dateVal] || [];
    } else if(monthVal !== 'all'){
      visible = [];
      for(var i=0; i<dateKeys.length; i++){
        if(dateKeys[i].substring(0,7) === monthVal){
          for(var j=0; j<(byDate[dateKeys[i]]||[]).length; j++) visible.push(byDate[dateKeys[i]][j]);
        }
      }
    } else {
      visible = notes;
    }

    // Update nav & button states
    var vdates = getVisibleDates();
    if(dateVal !== 'all' && vdates.length > 0){
      currentIdx = vdates.indexOf(dateVal);
      if(currentIdx < 0) currentIdx = 0;
    } else {
      currentIdx = 0;
    }

    // Update button states
    var prevBtn = document.getElementById('prev-btn');
    var nextBtn = document.getElementById('next-btn');
    if(dateVal !== 'all'){
      prevBtn.disabled = (currentIdx >= vdates.length - 1);
      nextBtn.disabled = (currentIdx <= 0);
    } else {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
    }

    if(visible.length === 0){
      list.innerHTML = '<p class="text-center text-kirby-pink-dark/40 py-12">尚無筆記 🩷</p>';
      return;
    }

    var parts = [];
    for(var i=0; i<visible.length; i++){
      var n = visible[i];
      parts.push(
        '<div class="bg-kirby-white/60 rounded-2xl p-6 shadow-sm border border-kirby-pink-light/30 fade-in">',
        '<div class="flex items-start justify-between mb-3"><span class="text-xs font-semibold text-kirby-pink-main bg-kirby-pink-main/10 px-2 py-1 rounded">#'+esc(n.cat)+'</span><span class="text-xs text-kirby-pink-dark/40">'+n.date+'</span></div>',
        '<h3 class="text-xl font-bold text-kirby-pink-dark mb-3">'+esc(n.title)+'</h3>',
        '<p class="text-kirby-pink-dark/70 text-sm leading-relaxed mb-3">'+esc(n.desc)+'</p>',
        n.tip ? '<p class="text-kirby-pink-dark/70 text-sm leading-relaxed">'+esc(n.tip)+'</p>' : '',
        n.tags.length ? '<div class="flex flex-wrap gap-2 mt-3">'+n.tags.map(function(t){ return '<span class="text-xs font-semibold text-kirby-pink-dark/50 bg-kirby-pink-light/10 px-2 py-1 rounded">'+t+'</span>'; }).join('')+'</div>' : '',
        '</div>'
      );
    }
    list.innerHTML = parts.join('');
  }

  function goPrev(){
    var vdates = getVisibleDates();
    if(currentIdx < vdates.length - 1){
      currentIdx++;
      document.getElementById('date-select').value = vdates[currentIdx];
      render();
    }
  }

  function goNext(){
    if(currentIdx > 0){
      currentIdx--;
      document.getElementById('date-select').value = getVisibleDates()[currentIdx];
      render();
    }
  }

  document.getElementById('prev-btn').addEventListener('click', goPrev);
  document.getElementById('next-btn').addEventListener('click', goNext);

  document.getElementById('month-select').addEventListener('change', function(){
    currentIdx = 0;
    document.getElementById('date-select').value = data.dateKeys[0] || 'all';
    render();
  });

  document.getElementById('date-select').addEventListener('change', function(){
    var vdates = getVisibleDates();
    var dv = this.value;
    currentIdx = dv === 'all' ? 0 : vdates.indexOf(dv);
    render();
  });

  render();
})();
</script>`;
  return wrap("開發筆記", "/dev-notes", html);
}

// =====================================================================
//  STEP 5: ENGLISH — Month/Date + Category Filters + Prev/Next
// =====================================================================
function buildEnglish() {
  const file = path.join(__dirname, "..", "content", "english.md");
  const text = fs.readFileSync(file, "utf-8");
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

  // Sort by date descending
  dates.sort((a, b) => b.date.localeCompare(a.date));

  const dateKeys = dates.map((d) => d.date);
  const months = [...new Set(dateKeys.map((d) => d.substring(0, 7)))].sort((a, b) => b.localeCompare(a));

  const dataJSON = JSON.stringify(dates);
  const monthOpts = months.map((m) => `<option value="${m}">${m}</option>`).join("\n");
  const dateOpts = dateKeys.map((d) => `<option value="${d}">${d}</option>`).join("\n");

  const html = `
<header class="text-center mb-8 fade-in fade-1">
  <h1 class="text-4xl md:text-5xl font-bold text-kirby-pink-main mb-4">📖 英文學習</h1>
  <p class="text-kirby-pink-dark/60 text-lg">Let's learn English together! — 每日學習記錄</p>
</header>

<div class="flex flex-wrap items-center justify-center gap-3 mb-8">
  <div id="english-filters" class="flex flex-wrap gap-2">
    <button class="cat-btn active bg-kirby-pink-main text-white px-5 py-2 rounded-full text-sm font-semibold transition-all" data-cat="all">All</button>
    <button class="cat-btn bg-kirby-white/60 text-kirby-pink-dark px-5 py-2 rounded-full text-sm font-semibold transition-all" data-cat="vocab">🌟 單字 / 表達</button>
    <button class="cat-btn bg-kirby-white/60 text-kirby-pink-dark px-5 py-2 rounded-full text-sm font-semibold transition-all" data-cat="grammar">🛠️ 文法</button>
  </div>
</div>

<div class="flex items-center justify-start md:justify-center gap-3 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap px-2">
  <button id="en-prev-btn" class="nav-btn bg-kirby-pink-light/40 text-kirby-pink-dark px-3 py-2 rounded-full text-sm font-bold transition-all shrink-0" title="上一頁">←</button>
  <div class="flex items-center gap-2 shrink-0">
    <label class="text-sm font-semibold text-kirby-pink-dark whitespace-nowrap">📅 月份</label>
    <select id="english-month" class="bg-kirby-white/60 border border-kirby-pink-light/50 rounded-lg px-3 py-2 text-sm text-kirby-pink-dark">
      <option value="all">全部月份</option>
      ${monthOpts}
    </select>
  </div>
  <div class="flex items-center gap-2 shrink-0">
    <label class="text-sm font-semibold text-kirby-pink-dark whitespace-nowrap">📆 日期</label>
    <select id="english-date" class="bg-kirby-white/60 border border-kirby-pink-light/50 rounded-lg px-3 py-2 text-sm text-kirby-pink-dark">
      <option value="all">全部日期</option>
      ${dateOpts}
    </select>
  </div>
  <button id="en-next-btn" class="nav-btn bg-kirby-pink-light/40 text-kirby-pink-dark px-3 py-2 rounded-full text-sm font-bold transition-all shrink-0" title="下一頁">→</button>
</div>

<div id="english-list"></div>

<div class="mt-16 bg-gradient-to-r from-kirby-pink-main/10 to-kirby-pink-light/20 rounded-2xl p-6 border border-kirby-pink-light/50 fade-in">
  <h3 class="text-lg font-bold text-kirby-pink-dark mb-3">💡 學習小技巧</h3>
  <ul class="text-kirby-pink-dark/70 space-y-2">
    <li>📝 每次練習後記下 <strong class="text-kirby-pink-main">實際被糾正的句子</strong>，比背 100 個單字更有用</li>
    <li>🗣️ 把新學的表達 <strong class="text-kirby-pink-main">大聲說出來</strong>，讓嘴巴習慣英文的發音節奏</li>
    <li>🔄 <strong class="text-kirby-pink-main">間隔複習</strong>：今天學的，明天、三天後、一週後各複習一次</li>
  </ul>
</div>

<script>
(function(){
  var dates = ${dataJSON};
  var currentCat = 'all';
  var currentIdx = 0;

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function getVisibleDates(){
    var m = document.getElementById('english-month').value;
    var allDates = dates.map(function(d){ return d.date; });
    return m === 'all' ? allDates : allDates.filter(function(d){ return d.substring(0,7) === m; });
  }

  function render(){
    var monthVal = document.getElementById('english-month').value;
    var dateVal = document.getElementById('english-date').value;
    var list = document.getElementById('english-list');

    var parts = [];
    for(var di=0; di<dates.length; di++){
      var d = dates[di];
      if(dateVal !== 'all' && d.date !== dateVal) continue;
      if(monthVal !== 'all' && d.date.substring(0,7) !== monthVal) continue;

      var vocab = [];
      var grammars = [];
      for(var ei=0; ei<d.entries.length; ei++){
        var e = d.entries[ei];
        if(e.type === 'expression' || e.type === 'vocabulary') vocab.push(e);
        else if(e.type === 'grammar') grammars.push(e);
      }

      var hasVocab = currentCat === 'all' || currentCat === 'vocab';
      var hasGram = currentCat === 'all' || currentCat === 'grammar';

      if((!hasVocab || vocab.length === 0) && (!hasGram || grammars.length === 0)) continue;

      parts.push('<section class="mb-12 fade-in">');
      parts.push('<div class="flex items-center gap-3 mb-6"><span class="text-sm font-bold text-kirby-white bg-kirby-pink-main px-3 py-1 rounded-full">📅 '+d.date+'</span></div>');

      if(hasVocab && vocab.length > 0){
        parts.push('<div class="bg-kirby-white/60 rounded-2xl p-6 shadow-sm border border-kirby-pink-light/30 mb-6">');
        parts.push('<h2 class="text-lg font-bold text-kirby-pink-main mb-4">🌟 表達與單字</h2><div class="space-y-4">');
        for(var vi=0; vi<vocab.length; vi++){
          var v = vocab[vi];
          parts.push('<div class="p-4 bg-kirby-bg rounded-xl">');
          parts.push('<h3 class="font-bold text-kirby-pink-dark mb-2">"'+esc(v.title)+'"</h3>');
          parts.push('<p class="text-kirby-pink-dark/70 text-sm mb-2">'+esc(v.desc)+'</p>');
          if(v.example) parts.push('<p class="text-kirby-pink-dark/70 text-sm italic pl-3 border-l-2 border-kirby-pink-light/50">'+esc(v.example)+'</p>');
          parts.push('</div>');
        }
        parts.push('</div></div>');
      }

      if(hasGram && grammars.length > 0){
        parts.push('<div class="bg-kirby-white/60 rounded-2xl p-6 shadow-sm border border-kirby-pink-light/30">');
        parts.push('<h2 class="text-lg font-bold text-kirby-pink-main mb-4">🛠️ 文法修正筆記</h2><div class="space-y-3">');
        for(var gi=0; gi<grammars.length; gi++){
          var g = grammars[gi];
          var arrowParts = g.title.split(' → ');
          var wrong = arrowParts[0] || '';
          var correct = arrowParts[1] || '';
          parts.push('<div class="flex flex-col gap-1 p-3 bg-kirby-bg rounded-xl">');
          parts.push('<p><span class="incorrect">'+esc(wrong)+'</span> → <span class="correct">'+esc(correct)+'</span></p>');
          parts.push('<p class="text-xs text-kirby-pink-dark/50">'+esc(g.desc)+'</p>');
          parts.push('</div>');
        }
        parts.push('</div></div>');
      }

      parts.push('</section>');
    }

    // Nav info & button states
    var vdates = getVisibleDates();
    if(dateVal !== 'all' && vdates.length > 0){
      currentIdx = vdates.indexOf(dateVal);
      if(currentIdx < 0) currentIdx = 0;
    } else {
      currentIdx = 0;
    }

    var prevBtn = document.getElementById('en-prev-btn');
    var nextBtn = document.getElementById('en-next-btn');
    if(dateVal !== 'all'){
      prevBtn.disabled = (currentIdx >= vdates.length - 1);
      nextBtn.disabled = (currentIdx <= 0);
    } else {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
    }

    if(parts.length === 0){
      list.innerHTML = '<p class="text-center text-kirby-pink-dark/40 py-12">尚無符合條件的學習記錄 🩷</p>';
    } else {
      list.innerHTML = parts.join('');
    }
  }

  // Category filter buttons
  var btns = document.querySelectorAll('#english-filters .cat-btn');
  for(var i=0; i<btns.length; i++){
    btns[i].addEventListener('click', function(){
      for(var j=0; j<btns.length; j++){ btns[j].classList.remove('active','bg-kirby-pink-main','text-white'); btns[j].classList.add('bg-kirby-white/60','text-kirby-pink-dark'); }
      this.classList.remove('bg-kirby-white/60','text-kirby-pink-dark');
      this.classList.add('active','bg-kirby-pink-main','text-white');
      currentCat = this.dataset.cat;
      render();
    });
  }

  // Prev/Next navigation
  document.getElementById('en-prev-btn').addEventListener('click', function(){
    var vdates = getVisibleDates();
    if(currentIdx < vdates.length - 1){
      currentIdx++;
      document.getElementById('english-date').value = vdates[currentIdx];
      render();
    }
  });
  document.getElementById('en-next-btn').addEventListener('click', function(){
    if(currentIdx > 0){
      currentIdx--;
      document.getElementById('english-date').value = getVisibleDates()[currentIdx];
      render();
    }
  });

  document.getElementById('english-month').addEventListener('change', function(){
    currentIdx = 0;
    document.getElementById('english-date').value = 'all';
    render();
  });
  document.getElementById('english-date').addEventListener('change', function(){
    var vdates = getVisibleDates();
    var dv = this.value;
    currentIdx = dv === 'all' ? 0 : vdates.indexOf(dv);
    render();
  });

  document.getElementById('english-date').value = dates.length > 0 ? dates[0].date : 'all';
  render();
})();
</script>`;
  return wrap("英文學習", "/english", html);
}

// ─── Main ────────────────────────────────────────────────────────────
console.log("🔨 Building site from content/*.md ...");

const milestoneBlocks = parseLines(path.join(__dirname, "..", "content", "milestones.md"));
const devBlocks = parseLines(path.join(__dirname, "..", "content", "dev-notes.md"));

const milestonesHTML = buildMilestones(milestoneBlocks);
const devNotesHTML = buildDevNotes(devBlocks);
const englishHTML = buildEnglish();

fs.writeFileSync(path.join(OUT, "milestones.html"), milestonesHTML);
fs.writeFileSync(path.join(OUT, "dev-notes.html"), devNotesHTML);
fs.writeFileSync(path.join(OUT, "english.html"), englishHTML);

console.log("✅ milestones.html");
console.log("✅ dev-notes.html");
console.log("✅ english.html");
console.log("🎉 Build complete!");