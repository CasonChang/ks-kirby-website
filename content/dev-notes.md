# 📝 開發筆記 (Dev Notes)
# 格式規範：每篇筆記 = 3~5 行，空行分隔
# ## YYYY-MM-DD | 標題
# category: nextjs/css/animation/deployment/architecture/data/tooling
# 內容描述
# 🎯 學到的事：...
# tags: #Tag1 #Tag2

## 2026-06-08 | 🐛 修復 auto-build 覆蓋複習卡回舊版的 bug
category: data
發現每次 GitHub Actions 觸發 build.js 就會把 hand-crafted 的新版 review.html（10 張一批、三選一分類）覆蓋成 build.js 內的舊版模板（全部隨機翻牌模式）。6/2 已經發生過一次，6/5 手動救回，6/8 又被 auto-build 蓋掉。
🎯 學到的事：當一個檔案有「手寫版」和「自動生成版」兩種來源時，必須明確分工。解法：把 review.html 從 build.js 輸出列表和 GitHub Actions 的 git add 中拿掉，讓複習卡完全由 Supabase 驅動，不再經過 build pipeline。
tags: #BugFix #CI/CD #GitHubActions #Supabase

## 2026-06-05 | 🃏 複習卡從翻牌模式 → 三選一分類模式
category: data
將複習卡從舊的「單張隨機翻牌 + 🎲下一題」改為「每次 10 張一批 + 三選一快速分類」。新介面以雙卡佈局呈現（錯誤句卡片 + 點擊顯示答案），搭配 🗑️刪除 / 📚還不會 / 🎓學會了 三個分類按鈕，並加入進度條、即時統計、以及完成模態框。資料層全面接上 Supabase，分類結果直接寫回後端，達成跨裝置同步。
🎯 學到的事：從「被動翻牌」變成「主動分類」，使用者不再只是看答案，而是做出決策，學習效果更佳。三個按鈕的設計比 SM-2 的五級評分更直覺且不會讓使用者有選擇障礙。
tags: #Flashcard #UX #Supabase #EnglishLearning

## 2026-05-20 | 🗄️ 靜態網站 → Supabase 動態資料庫大遷移
category: data
將複習卡 (review.html) 和英文學習頁面 (english.html) 從本地 JSON/Markdown 檔案改為從 Supabase PostgreSQL 動態讀取。建立 4+1 張表（users/cards/review_state/review_logs/english_entries），79 張複習卡與 66 筆學習記錄全部匯入。導入 anon key + RLS policy 讓前端安全讀取，service_role key 供 Bot/後端寫入。
🎯 學到的事：Supabase 的 PostgREST 會自動產生 REST API，前端只需 supabase.from('cards').select('*') 就能拿資料，完全不用寫後端 API Server。跨裝置同步、即時更新全部迎刃而解。
🎯 學到的事：Sandbox 環境無法直連 PostgreSQL port，但可以透過 REST API (port 443) 操作資料，DDL 則需手動在 SQL Editor 執行。
🎯 學到的事：RLS policy 預設拒絕 anon key 存取，必須手動 CREATE POLICY ... USING (true) 才能開放公開讀取。
tags: #Supabase #PostgreSQL #Database #Migration

## 2026-05-13 | 🏗️ Next.js + Tailwind CSS 專案初始化
category: nextjs
使用 create-next-app 建立專案（TypeScript + Tailwind + App Router）。發現 Tailwind CSS 已升級到 v4，最大的變化是：不再使用 tailwind.config.ts 設定檔。
🎯 學到的事：v4 改在 globals.css 裡用 @theme 語法定義自訂顏色，更直覺也更集中。
tags: #Setup #Tailwind

## 2026-05-13 | 🎨 卡比專屬粉色系色盤設計
category: css
定義了一套 5 階粉色色盤（kirby-bg → kirby-pink-light → kirby-pink-main → kirby-pink-dark → kirby-white），讓整個網站擁有統一的視覺語言。限制色階數量讓整體配色更協調。
🎯 學到的事：少即是多，5 階色足夠覆蓋所有 UI 需求。
tags: #Design #ColorPalette

## 2026-05-13 | ✨ Framer Motion 動畫整合
category: animation
引入 framer-motion 為頁面加入流暢的進入/離開動畫與 hover 效果。安裝時遇到大坑：npm install framer-motion 意外移除了 337 個相依套件（包含 Tailwind CSS！）。
🎯 學到的事：這個環境必須用 npm install --include=dev 來強制安裝 devDependencies，標準行為不一樣。
tags: #Animation #npm

## 2026-05-13 | 🚀 GitHub Pages 部署踩坑全記錄
category: deployment
連續踩了三個大坑：(1) Push 了 Next.js 原始碼，Zeabur 當成純靜態檔，顯示 README.md (2) 靜態匯出後忘記設 basePath，CSS 和連結全 404 (3) GitHub Pages 對 _next 開頭的資料夾有特殊處理，CSS 仍無法載入。
🎯 學到的事：在 GitHub Pages 環境下，直接引入 cdn.tailwindcss.com 比依賴 Next.js 的編譯路徑更穩定可靠。
tags: #Deployment #GitHubPages #Debugging

## 2026-05-13 | 📊 資料驅動架構設計
category: architecture
建立了 src/data/ 資料層，將里程碑、筆記、英文學習內容用 JSON 管理，並規劃了 md → JSON → HTML 的自動化流程。
🎯 學到的事：把「內容」和「呈現」分離，後續無論技術棧怎麼換，內容都不會遺失。
tags: #Architecture #DataDriven

## 2026-05-14 | 🔄 md → 網頁自動化藍圖
category: architecture
設計了一套完整的自動化方案：workspace md 檔 → cron 定時同步到 content/ → GitHub Actions 偵測變更 → 解析 md → 生成 HTML → 自動部署。核心關鍵在於「嚴格統一的格式」。
🎯 學到的事：格式一致是自動化的命脈，只要源頭格式統一，後面的解析腳本就能穩定運作。
tags: #Automation #CI/CD #GitHubActions

## 2026-05-14 | 🎛️ 互動式篩選系統實作
category: data
將三個主要頁面從純靜態 HTML 重構為 data-driven 互動式篩選：里程碑加入 category pill 選單、開發筆記加入月份/日期雙層導航與 prev/next 切換、英文學習加入類別與日期複合篩選。核心做法是在 build.js 中把 markdown 解析後的資料嵌入為 JSON，再由 client-side JS 動態渲染。
🎯 學到的事：靜態網站不等於沒有互動，把資料 embed 成 JSON + vanilla JS 就能在不依賴任何框架的情況下實現完整的篩選/導航功能。
tags: #InteractiveUI #StaticSite #JavaScript

## 2026-05-15 | 📱 全站 RWD 響應式佈局實作
category: css
將整個網站從單一解析度重構為完整的 RWD 體系。透過 Tailwind CSS 的斷點設計，重新定義了行動端與桌面端的元件排列方式，確保在手機上也能擁有流暢的閱讀體驗。
🎯 學到的事：RWD 不只是縮小元件，而是根據螢幕空間重新思考資訊優先級的排列（Content Prioritization）。
tags: #RWD #ResponsiveDesign #TailwindCSS

## 2026-05-15 | ⬅️➡️ 互動式日期導航系統實作
category: data
在開發筆記與英文學習頁面引入「左右箭頭」導航，允許使用者快速切換前後日期。實作過程中在靜態 JSON 索引的對應與邊界判定上踩了大量坑，經過多次邏輯重構才達成無縫切換。
🎯 學到的事：在沒有後端 API 的靜態環境中，前端對資料索引（Index）的精準控制是實現動態導航的唯一手段。
tags: #UX #JavaScript #Navigation #FrontendLogic

## 2026-05-15 | 😵‍💫 靜態頁面 JS 邏輯地獄與救贖
category: data
經歷了數次瘋狂嘗試，最終發現 build.js 生成的 JS 腳本中存在一個意外的 `})();` 提前結束了 IIFE，導致初始化邏輯完全失效。透過 Python 腳本進行精準的正則替換，成功恢復預設顯示最新日期的功能，並同步更新了首頁 Emoji。
🎯 學到的事：在模板字串生成的 JS 中，一個微小的語法錯誤會導致整個邏輯失效且極難除錯；正則替換比手動 edit 工具在複雜模板中更可靠。
tags: #JavaScript #Regex #Debugging #BuildProcess

## 2026-05-16 | 🃏 文法複習卡系統實作
category: data
為網站新增複習卡頁面 (/review)，從 english_learning.md 萃取 36 張文法錯誤卡，實作隨機出題 + CSS 3D 翻牌動畫。建立 data/flashcards.json 資料層，未來可配合自動化腳本增量更新。
🎯 學到的事：CSS 3D Transform (rotateY) + backface-visibility: hidden 能純前端實現流暢翻牌，無需依賴任何 JS 動畫庫。
tags: #Flashcard #CSS #UX #EnglishLearning