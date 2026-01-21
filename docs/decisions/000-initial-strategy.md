# ADR-000: Portfolio Strategy - Cloud Native Dashboard

## Status
**Accepted** (2026-01-21)

## Context
我們希望使用 GitHub Pages 作為作品集入口，但受限於其僅支援靜態網頁 (Static Site) 的特性，無法直接運行後端代碼 (Node.js/Python 等)。我們需要一個策略來展現後端工程師的技術實力。

## Decision (決策)
我們決定採用 **「Serverless / BFF (Backend for Frontend)」** 架構：
1.  **前端 (GitHub Pages)**：作為控制台與展示層。
2.  **後端 (Cloud Native)**：將邏輯託管於免費的 Serverless 平台 (Render)。
3.  **展示重點**：透過此架構展示對分散式系統、API 設計與雲端部署的掌握能力。

## Technical Analysis (技術評估紀錄)
*以下為初始策略規劃內容：*

---

# 後端工程師 GitHub Pages 作品集策略指南

## 核心挑戰與解決方案
**挑戰**：GitHub Pages 僅支援靜態網頁 (HTML/CSS/JS)，無法運行 Python, Java, Go, Node.js 等後端伺服器代碼。
**解決方案**：採用 **「Serverless (無伺服器) 架構」** 或 **「BFF (Backend for Frontend) 模式」**。
*   **前端 (GitHub Pages)**：作為「控制台」或「儀表板」，負責展示數據和發送 API 請求。
*   **後端 (外部免費服務)**：將實際的後端邏輯託管在支援免費層級的雲端平台 (如 Supabase, Render, Vercel Functions, AWS Lambda)。
*   **展示重點**：雖然網頁是靜態的，但你可以通過它來展示你對 **API 設計、資料庫架構、雲端部署、安全性** 的掌控能力。

---

## 推薦作品方案：全端雲原生儀表板 (Cloud-Native Dashboard)

這是最能體現後端工程師價值的作品類型。不要只做一個靜態部落格，要做一個**「活的系統」**。

### 1. 專案構想：分散式任務排程監控系統 (Distributed Task Scheduler Monitor)
這是一個模擬大規模後端系統的縮影。

*   **功能描述**：
    *   使用者可以在網頁上提交一個「模擬耗時任務」 (例如：生成報表、發送郵件)。
    *   後端接收請求，將其放入 Message Queue (訊息佇列)。
    *   Worker (背景執行緒) 處理任務。
    *   前端透過 WebSocket 或 Polling 即時更新任務狀態 (Pending -> Processing -> Completed)。

### 2. 技術架構 (Tech Stack)
*   **前端 (GitHub Pages)**: React 或 Vue (用來呼叫 API 並展示狀態)。
*   **API Gateway / Backend**: Vercel Serverless Functions 或 Render (免費)。
*   **資料庫 (Database)**: Supabase (PostgreSQL) 或 MongoDB Atlas (免費)。
*   **快取/佇列 (Cache/Queue)**: Upstash (Redis) (免費)。
*   **CI/CD**: GitHub Actions (自動化測試與部署)。

### 3. 如何透過此作品展現後端技術？
在你的 GitHub Repo `README.md` 中，你需要強調以下幾點 (這才是面試官看的重點)：

*   **系統架構圖 (System Design)**：畫出 Frontend -> API Gateway -> Queue -> Worker -> DB 的流程圖。
*   **API 文件 (API Documentation)**：使用 Swagger/OpenAPI 規範撰寫文件。
*   **資料庫設計 (Schema Design)**：展示正規化 (Normalization) 或 NoSQL 的設計考量。
*   **並發處理 (Concurrency)**：解釋你如何處理多個使用者同時提交任務的情況 (例如使用 Redis Lock)。
*   **安全性 (Security)**：實作 JWT Authentication，展示你懂得如何保護 API。

---

## 替代方案 (純靜態)：互動式演算法/資料庫視覺化
如果你不想依賴外部後端服務，可以做一個**「瀏覽器端的後端模擬器」**。

*   **專案構想**：**SQL 執行計畫視覺化工具** 或 **Raft 共識演算法演示**。
*   **技術**：使用 WebAssembly (WASM) 運行 SQLite (sql.js) 或 DuckDB。
*   **亮點**：
    *   展示你對 **資料庫原理 (Query Optimization)** 的理解。
    *   展示你對 **複雜演算法** 的理解。
    *   不需要維護伺服器，但技術含金量極高。

---

## 如何最大化提升後端工程師錄取率？

除了作品集本身，以下幾點是 Senior 工程師面試時的加分關鍵：

1.  **高品質的 README 是關鍵**
    *   大多數面試官不會下載你的 code 來跑。他們只看 README。
    *   **必須包含**：專案目的、架構圖 (Mermaid/Draw.io)、如何本地啟動 (Docker Compose)、技術選型原因 (為什麼選 Redis 而不是 Memcached？)。

2.  **擁抱 DevOps 與 CI/CD**
    *   在 Repo 中加入 `.github/workflows`。
    *   設定自動化單元測試 (Unit Test) 和 Linting。
    *   展示你懂得「自動化流程」，這在現代後端開發非常重要。

3.  **撰寫技術文章 (Technical Writing)**
    *   在你的 GitHub Pages 上建立一個 `/blog` 區塊。
    *   不要寫「今天我學了什麼」，要寫**「深度分析」**。
    *   例如：「深入探討 Node.js Event Loop 機制」、「PostgreSQL Index 效能優化實戰」。

4.  **代碼品質 (Code Quality)**
    *   使用 TypeScript (如果寫 Node.js) 或強型別語言。
    *   嚴格的 Error Handling (不要只 console.log)。
    *   撰寫單元測試 (Jest/Mocha/PyTest)。

## 總結建議
利用此 GitHub Pages 儲存庫作為**入口 (Portal)**。
1.  建立一個精美的 Landing Page (個人簡介)。
2.  列出你的 **"Featured Projects"** (即使後端託管在別處)。
3.  撰寫高品質的技術文章。

這將會是一個兼具「視覺吸引力」與「技術深度」的完美作品集。
