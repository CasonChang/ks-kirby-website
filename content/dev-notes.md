# 📝 開發筆記 (Dev Notes)
# 格式規範：每篇筆記 = 3~5 行，空行分隔
# ## YYYY-MM-DD | 標題
# category: nextjs/css/animation/deployment/architecture/data/tooling
# 內容描述
# 🎯 學到的事：...
# tags: #Tag1 #Tag2

## 2026-05-13 | 🏗️ Next.js + Tailwind CSS 專案初始化
category: nextjs
使用 create-next-app 建立專案（TypeScript + Tailwind + App Router）。發現 Tailwind CSS 已升升級到 v4，最大的變化是：不再使用 tailwind.config.ts 設定檔。
🎯 學到的事：v4 改在 @theme 語法定義自訂顏色，更直覺也更集中。
tags: #Setup #Tailwind

## 2026-05-13 | 🎨 卡比專屬粉色系色盤設計
category: css
定義了一套 5 階粉色色盤（kirby-bg → kirby-pink-light → kirby-pink-main → kirby-pink-dark → kirby-white），讓整個網站擁有統一的視覺語言。限制色階數量讓整體配色更協調。
🎯 學到的事：少即是多，5 階色足夠覆蓋所有 UI  broadened。
tags: #Design #ColorPalette

## 2026-05-13 | ✨ Framer Motion 動畫整合
category: animation
引入 framer-motion 為頁面加入流暢的進入/離開動畫與 hover 效果。安裝時 때 遇到大坑：npm install framer-motion 意外移除了 337 個相依套件（包含 Tailwind CSS！）。
🎯 學到的事：這個環境必須用 npm install --include=dev 來強制安裝 devDependencies，標準行為不一樣。
tags: #Animation #npm

## 2026-05-13 | 🚀 GitHub Pages 部署踩坑踩坑全記錄
category: deployment
連續踩了三個大坑：(1) Push 了 Next.js 原始碼，Zeabur 當成純靜態檔，顯示 README.md (2) 靜態匯出後忘記設 basePath，CSS 和連結全 404 (3) GitHub Pages 對 _next 開開頭的資料夾有特殊處理，CSS 仍無法載入。
🎯 學到的事：在 GitHub Pages 環境下，直接引入 cdn.tailwindcss.com 比依賴 Next.js 的編譯路徑更穩定可靠。

## 2026-05-15 | 😵‍💫 靜態頁面 JS 邏輯地獄與救贖
category: data
經歷了數次瘋狂嘗試，最終發現 build.js 生成的 JS 腳本中存在一個意外的 `})();` 提前結束了 IIFE，導致初始化邏輯完全失效。透過 Python 腳本進行精準的正則替換，成功恢復預設顯示最新日期的功能，並同步更新了首頁 Emoji。
🎯 學到的事：在模板字串生成的 JS 中，一個微小的語法錯誤會導致整個邏輯失效且極難除錯；正則替換比手動 edit 工具在複雜模板中更可靠。
tags: #JavaScript #Regex #Debugging #BuildProcess
