# 📝 開發筆記 (Dev Notes)
# 格式規範：每篇筆記 = 3~5 行，空行分隔
# ## YYYY-MM-DD | 標題
# category: nextjs/css/animation/deployment/architecture/data/tooling
# 內容描述
# 🎯 學到的事：...
# tags: #Tag1 #Tag2

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

## 2026-05-15 | 😵‍💫 靜態頁面 JS 邏輯地獄與救贖
category: data
經歷了數次瘋狂嘗試，最終發現 build.js 生成的 JS 腳本中存在一個意外的 `})();` 提前結束了 IIFE，導致初始化邏輯完全失效。透過 Python 腳本進行精準的正則替換，成功恢復預設顯示最新日期的功能，並同步更新了首頁 Emoji。
🎯 學到的事：在模板字串生成的 JS 中，一個微小的語法錯誤會導致整個邏輯失效且極難除錯；正則替換比手動 edit 工具在複雜模板中更可靠。
tags: #JavaScript #Regex #Debugging #BuildProcess
