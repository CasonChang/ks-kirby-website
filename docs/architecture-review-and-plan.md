# 架構審查與新功能規劃（2026-07-16）

> 這份文件分兩部分：
> 1. **現有架構審查** — 目前網站的資料流、發現的問題（含一個必須立刻處理的安全問題）
> 2. **新功能規劃** — 每日知識推送 + 心智圖 + Dashboard + 互動問答的建議做法與分階段實作計畫
>
> 目的是讓後續實作者（Opus / 森之卡比）可以直接照這份文件動工。

---

## Part 1：現有架構審查

### 1.1 目前的資料流（實際狀況整理）

網站其實有**三條不同的資料路徑**，這也是你「有點忘記哪些走資料庫、哪些走 repo」的原因：

```
路徑 A（走 repo + GitHub Action）：
  小龍蝦更新 content/milestones.md、content/dev-notes.md
    → push 到 repo
    → GitHub Action (build-content.yml) 執行 scripts/build.js
    → 產出 milestones.html、dev-notes.html
    → 再 commit push（[skip ci]）
    → GitHub Pages 更新

路徑 B（走 Supabase，網頁執行時抓取）：
  小龍蝦更新 workspace 的 memory/english_learning.md
    → 在 Zeabur 上跑 scripts/sync-to-supabase.js
    → 寫入 Supabase 的 english_entries 表和 cards 表
    → english.html / review.html 頁面載入時用 anon key 直接 fetch Supabase
    → 使用者看到最新資料（不需要重新 build 網站）

路徑 C（手工維護）：
  review.html 是手工/單獨維護的頁面（曾被 auto-build 覆蓋過，
  commit 9b306d7 之後已把它從 build pipeline 移除）
```

**首頁 index.html 是純手寫靜態頁**，不走以上任何一條路。

### 1.2 🚨 嚴重問題：service_role key 被 commit 到公開 repo

GitHub Pages 的 repo 必須是 public，而以下三個檔案**把 Supabase 的
`service_role` key 明碼寫死在程式裡**：

- `scripts/sync-to-supabase.js:13`
- `scripts/import-english.js:6`
- `scripts/import-flashcards.js:6`

`service_role` key 是**繞過所有 RLS 的最高權限金鑰**。任何人在 GitHub 上看到
這個 repo，就能對你的 Supabase 資料庫做任何事：讀走全部資料、竄改、整庫刪除。

**必須做的處理（缺一不可）：**

1. **立刻到 Supabase Dashboard 撤銷/輪替金鑰**
   （Settings → API → 撤銷舊 key 或 rotate JWT secret）。
   ⚠️ 光把 key 從檔案裡刪掉沒有用——它已經永久留在 git 歷史裡了，
   **輪替金鑰才是真正的修復**。
2. 輪替後，三個 script 改成從環境變數讀取：
   `const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;`
   新 key 只放在 Zeabur 的環境變數設定裡（小龍蝦執行時讀得到），不進 repo。
3. 注意：如果是用「rotate JWT secret」的方式，**anon key 也會一起換**，
   要同步更新 `scripts/build.js:7`、`review.html` 裡的 anon key 並重 build。
   （anon key 本來就是設計成公開的，寫在前端沒問題。）

### 1.3 ⚠️ 中等問題：RLS 政策對 anon 全開

`scripts/rls-v3-policies.sql` 給了 `anon` 角色對 `cards` 表的
SELECT / UPDATE / INSERT / DELETE 全部權限，條件都是 `USING (true)`。

意思是：任何拿到網頁原始碼裡 anon key 的人（= 任何開過你網站的人），
都可以直接改寫或刪光你的複習卡。個人小站風險不算高，但修起來不難：

- **DELETE 政策可以直接拿掉**——v3 之後已改用軟刪除（`status='deleted'`），
  前端根本不需要真 DELETE。
- **INSERT 政策也可以拿掉**——註解寫「for import scripts」，但 import script
  用的是 service key（繞過 RLS），anon INSERT 是多餘的。
- UPDATE 建議收斂成只允許改 `status` 欄位。最乾淨的做法是改用一個
  `SECURITY DEFINER` 的 RPC function（例如 `set_card_status(card_id, new_status)`，
  裡面限制 new_status 只能是 active/learned/deleted），然後撤掉 anon UPDATE 政策。
- `english_entries` 表的 RLS 政策**不在 repo 裡**（當初應該是直接在 SQL Editor
  裡建的），建議把實際生效的政策也存一份到 `scripts/`，讓 repo 是唯一真相來源。

### 1.4 🧹 清理項目（不影響功能，但會混淆維護者）

1. **Next.js 殘留物**：`_next/`（1.2MB）、根目錄和 `english/`、`milestones/`、
   `dev-notes/`、`_not-found/` 底下的一堆 `__next.*.txt`、`*.txt`、
   `next.svg`、`vercel.svg`、`globe.svg`、`window.svg`、`file.svg`、
   `_not-found.html`。這些是早期用 Next.js static export 的遺跡，
   目前的手寫 HTML 完全沒有用到，全部可刪。
2. **build.js 裡的死程式碼**：`buildReview()` 整個 function 還在
   （`scripts/build.js` 約 586–806 行），但 main 區已經不呼叫它。
   之前就發生過 auto-build 意外覆蓋 review.html 的事故（commit f69b3d6），
   留著這段死碼等於留著地雷，建議刪除。
3. **`data/flashcards.json`**：資料已遷移到 Supabase，這份本地 JSON 已無人讀取，
   可刪（或搬到 archive）。
4. `package.json` 依賴 `pg` 但沒有任何 script 用到（都是直接打 REST API），可移除。

### 1.5 整體評價

除了上面的安全問題外，DeepSeek 寫的架構**本身是合理的**：

- 靜態頁 + Supabase runtime fetch 是很適合 GitHub Pages 的模式，
  資料更新不用重新部署網站 ✅
- GitHub Action 的 md → html build pipeline 簡單可靠 ✅
- 去重邏輯（sync 時用 date|title / original 當 key）避免重複寫入 ✅
- 前端有做 HTML escape（`esc()`），沒有明顯 XSS ✅
- Tailwind 用 CDN 版（`cdn.tailwindcss.com`）只適合開發用，console 會有警告，
  但個人網站無所謂，不用急著改

主要的「寫不好」集中在：金鑰管理（嚴重）、RLS 過寬（中等）、
以及一堆該清沒清的殘留檔案（輕微）。

---

## Part 2：新功能規劃 — 「Cason 的知識宇宙」

### 2.0 可行性結論

**你想做的 5 點全部做得到**，而且大部分可以直接沿用現有模式
（小龍蝦 cron 寫 Supabase → 靜態頁 runtime fetch）。
最難的第 5 點（網站上直接延伸問答）有一個比你想的簡單很多的做法，見 2.5。

### 2.1 資料模型（Supabase 新增四張表）

```sql
-- 知識分類樹（FW / HW / AI ... 可以有子分類，樹狀）
CREATE TABLE knowledge_topics (
  topic_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID REFERENCES knowledge_topics(topic_id),  -- NULL = 頂層分類
  name       TEXT NOT NULL,          -- 例：'FW', 'HID', 'USB Protocol'
  emoji      TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 知識點（每天小龍蝦塞進來的「新東西」）
CREATE TABLE knowledge_nodes (
  node_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id   UUID NOT NULL REFERENCES knowledge_topics(topic_id),
  title      TEXT NOT NULL,          -- 例：'USB HID Report Descriptor 是什麼'
  summary    TEXT,                   -- 一兩句話摘要（心智圖 hover / 氣泡用）
  content    TEXT,                   -- 完整教學內容（markdown）
  status     TEXT DEFAULT 'unread'   -- unread / learning / learned
             CHECK (status IN ('unread','learning','learned')),
  source     TEXT,                   -- 出處連結（選填）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  learned_at TIMESTAMPTZ             -- 標記學會的時間（dashboard 統計用）
);

-- 延伸問答（跟著某個知識點的討論串）
CREATE TABLE knowledge_qa (
  qa_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id    UUID NOT NULL REFERENCES knowledge_nodes(node_id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 每日學習日誌（dashboard 的資料來源，也可以用 view 從上面兩張表推導）
CREATE TABLE learning_log (
  log_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE NOT NULL,
  node_id    UUID REFERENCES knowledge_nodes(node_id),
  action     TEXT CHECK (action IN ('delivered','read','learned','asked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

RLS：anon 只給 SELECT；狀態變更（unread→learned）走 `SECURITY DEFINER` RPC，
寫入（新知識點、QA）一律由小龍蝦用 service key 做。

### 2.2 每日自動推送（你說的難點一：cron）

**這題已經解了**——小龍蝦在 Zeabur 上 24 小時活著，本來就有 cron 能力
（你現在的英文學習就是這樣跑的）。新增一個每日任務：

```
每天早上（例如 07:30）：
1. 讀 knowledge_topics 取得分類清單
2. 讀 knowledge_nodes 最近 N 筆的 title（避免出重複主題）
3. 對每個（或輪流挑 2-3 個）分類，用 LLM 生成一個「菜鳥 RD 可能不知道
   但實用」的知識點：title + summary + content（markdown 教學）
4. INSERT 到 knowledge_nodes（status='unread'）+ learning_log（action='delivered'）
5. 順便發一則 Telegram 訊息通知你「今天有 3 個新知識點」附連結
```

**模型建議**：這個任務是「生成教學內容」，品質很重要。gemma 免費模型
生出來的技術內容可能會有錯（幻覺），建議這個 cron 固定用付費的
DeepSeek（每天 2-3 次呼叫，成本幾乎可以忽略），
prompt 裡要求附上可查證的關鍵字/出處。

**備援方案**：如果哪天小龍蝦掛了，GitHub Actions 也支援 `schedule:` cron，
可以放一個 workflow 用 repo secret 存 LLM API key 做同樣的事。
不用現在做，知道有這條路就好。

### 2.3 心智圖介面（新頁面 `knowledge.html`）

照你說的原則：**先有基本功能，再搞美術**。建議分兩步：

**第一步（MVP）：可折疊樹狀清單**
- 中心是「Cason」，第一層是 topics（FW / HW / AI...），
  點開展開子分類和知識點
- 未讀的節點用亮色 + 數字 badge（像未讀訊息），
  learned 的變淡色，一眼看出「今天有新東西」
- 點知識點 → 展開詳細面板：content（markdown 渲染）+ QA 討論串 +
  「我學會了」按鈕（打 RPC 改 status）
- 純 HTML/JS + Supabase fetch，完全沿用現有模式，沒有新基礎設施

**第二步（視覺升級）：真正的心智圖**
- 推薦用 **D3.js**（CDN 引入）畫 radial tree / force-directed graph，
  或用 **markmap**（把 markdown 大綱直接變心智圖，最省事）
- 資料結構第一步就設計成樹狀（`parent_id`），所以升級只是換渲染層，
  資料層完全不用動——這就是為什麼建議先做清單版

### 2.4 Dashboard（新頁面 `dashboard.html`）

全部都能在前端用 anon SELECT 算出來：

- **連續學習天數（streak）** + GitHub 風格的年度熱力圖
  （從 learning_log 按日期聚合）
- 各分類的知識點數量 / 已學會比例（圓餅或長條）
- 最近學會的知識點列表（給績效報告用：直接按時間區間篩，
  例如「這一季學了 47 個知識點，FW 類 20 個…」可以一鍵複製成 markdown）
- 英文學習的既有數據（cards / review 統計）也可以拉進同一頁

### 2.5 延伸互動問答（你說的難點二）— 推薦「Telegram 深連結」方案

你擔心「網站直接跟 OpenClaw 開 session 會有一堆 bug」——**這個直覺是對的**，
所以 MVP 不要做網站↔bot 的即時連線。推薦這個繞路方案，幾乎零新增基礎設施：

```
【提問】網站上每個知識點旁邊放一顆「🦞 問卡比」按鈕
  → 連結是 Telegram deep link：https://t.me/<你的bot>?start=node_<node_id>
  → 點了直接跳到 Telegram 開聊，bot 收到 /start node_<id>
  → 小龍蝦從 Supabase 撈該知識點的 content 當上下文，開始回答你的延伸問題

【存檔】你們聊完後，跟小龍蝦說「存檔」（或它自動判斷）
  → 小龍蝦把這段 QA 整理後 INSERT 到 knowledge_qa（帶 node_id）
  → 網站的知識點詳細面板下次載入就會顯示這串問答

【效果】對你來說體驗是：網站看到不懂的 → 點一下 → 在熟悉的 Telegram 裡問
  → 問完回網站，知識點下面多了一段自己的問答紀錄
```

優點：
- 不需要網站對 bot 的 API、不需要 CORS、不需要 session 管理、不需要認證
  （Telegram 本身就是你的身份驗證）
- 小龍蝦本來就會操作 Supabase，只是多一個「寫 QA」的技能
- 手機上體驗特別順（網站和 Telegram 切換很自然）

進階版（Phase 4，確定 MVP 好用之後再考慮）：
- 在 Zeabur 上給 OpenClaw 加一個帶 token 的 HTTP webhook，
  網站內嵌聊天框直接 POST 問題 → 這才是你原本想像的「網站上直接問」，
  bug 面確實大（認證、CORS、streaming、timeout），所以放最後。
- 「跳去 ChatGPT/Claude 問完貼回來」的做法不建議：手動貼回的步驟太麻煩，
  你大概率不會持續使用。

### 2.6 分階段實作計畫（給實作者的工單）

**Phase 0：安全修復（最優先，跟功能無關但必須先做）**
1. Supabase 輪替 service_role key（Dashboard 操作，人工做）
2. 三個 script 改讀 `process.env.SUPABASE_SERVICE_KEY`，新 key 設到 Zeabur 環境變數
3. 收斂 cards 的 RLS：移除 anon DELETE / INSERT，UPDATE 改 RPC
4. 清理：刪 `_next/`、`__next*.txt`、`*.txt`、`_not-found*`、多餘 svg、
   `data/flashcards.json`、build.js 的死碼 `buildReview()`、package.json 的 `pg`

**Phase 1：知識庫地基**
1. 建四張新表 + RLS + `set_node_status` RPC（SQL 檔進 `scripts/`）
2. 手動塞入初始分類（FW / HW / AI，加上你想到的子分類）
3. 小龍蝦新增每日 cron：生成知識點寫入 Supabase + Telegram 通知
4. 新頁面 `knowledge.html`：可折疊樹 + 未讀 badge + 詳細面板 + 「我學會了」按鈕
5. 導覽列加入「🧠 知識庫」

**Phase 2：問答閉環**
1. 知識點面板加「🦞 問卡比」Telegram deep link 按鈕
2. 小龍蝦新增技能：處理 `/start node_<id>`（撈上下文）、「存檔」指令（寫 knowledge_qa）
3. 網站面板顯示 QA 討論串

**Phase 3：Dashboard**
1. `dashboard.html`：streak、熱力圖、分類統計、學習清單、一鍵匯出 markdown

**Phase 4（選配）：心智圖視覺 + 網站內嵌聊天**
1. knowledge.html 渲染層換成 D3 radial tree
2. （評估後再決定）OpenClaw webhook + 網站聊天框

---

## 附錄：現有檔案地圖

| 檔案 | 角色 |
|---|---|
| `index.html` | 手寫首頁，純靜態 |
| `milestones.html` / `dev-notes.html` | build.js 從 `content/*.md` 產出，**不要手改** |
| `english.html` | build.js 產出外殼，資料 runtime 從 Supabase `english_entries` 抓 |
| `review.html` | **手工維護**（已脫離 build pipeline），資料從 Supabase `cards` 抓 |
| `scripts/build.js` | md → html 建置器（含待刪的死碼 buildReview） |
| `scripts/sync-to-supabase.js` | 小龍蝦端：english_learning.md → Supabase（⚠️ 含明碼 service key） |
| `scripts/import-*.js` | 一次性遷移腳本（⚠️ 含明碼 service key，遷移完成後可刪） |
| `scripts/*.sql` | Supabase schema / migration / RLS（english_entries 的定義缺漏） |
| `.github/workflows/build-content.yml` | content/ 變更時自動 build |
| `_next/`、`__next*.txt` 等 | 早期 Next.js 殘留，可全刪 |
