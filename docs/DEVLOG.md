# Project Guild 開發實錄 (Development Log)

本文件記錄了 "Project Guild" (原 Moonlight Savior) 的完整開發歷程。

## 2026/02/03 - Phase 3: 前端整合與自動化部署

### 1. 前端整合 (Frontend Integration)
- **前端技術棧**: Next.js 16 (App Router) + React 19 + TailwindCSS。
- **環境設定**: 強制使用 Node.js v24 (透過 `.nvm` sourcing) 以繞過 Agent 環境限制。
- **元件開發**:
    - `QuestCard.tsx`: 顯示任務詳情 (標題、獎勵、分類、風險等級)。
    - `api.ts`: 後端通訊輔助函式庫。
    - `page.tsx`: 在首頁整合動態任務抓取功能。

### 2. 承接委託功能 (Quest Acceptance)
- **功能**: 即時任務接取，包含「樂觀 UI 更新」 (Optimistic UI Update)。
- **後端**: `/api/quests/:id/accept` 端點已驗證。
- **修復項目**:
    - **前端型別**: 修正大小寫敏感問題 (`posted` vs `POSTED`)。
    - **API 參數**: 修正鍵值不匹配 (`adventurerId` vs `mercenary_id`)。
    - **資料完整性**: 使用資料庫中的有效 UUID 取代測試用的字串。

### 3. 部署標準化 (Deployment Standardization)
- **問題**: 根目錄雜亂，且需要手動管理建置產物。
- **解決方案**: 實作 GitHub Actions 自動化流程 (`.github/workflows/deploy.yml`)。
- **結果**:
    - 從原始碼控制中移除所有建置產物 (`index.html`, `_next/`)。
    - 設定 `.gitignore` 強制保持根目錄整潔。
    - 透過 `git push` 即可全自動部署。
    - UI 佈局優化：從儀表板 (Sidebar) 切換為全螢幕沉浸式首頁。

---

## 2026/02/02 - Phase 1 & 2: 基礎建設與後端核心

### 1. 企畫書定稿 (Proposal Finalized)
*   完成「百億級」專案企畫書，修正了一致性漏洞，適合技術面試 (Backend Focus)。
*   關鍵產出：`docs/project_proposal.md` (Version: Interview-Ready)。

### 2. 資料庫建置 (Database Setup)
*   **PostgreSQL (Supabase)** 連線成功。
*   **Schema Migration**: `20260202_guild_init.sql` 執行完畢，建立了 `users`, `quests`, `ledger` 資料表。
*   **Seed Data**: 成功建立公會長與測試傭兵帳號。

### 3. 後端 API 實作 (Backend Implementation)
*   **路由架構**: `project-guild-backend` 重構完成，掛載 `/api/quests` 與 `/api/users`。
*   **核心邏輯**: 實作了 `QuestController`，包含：
    *   `listQuests`: 支援過濾查詢。
    *   `createQuest`: 任務發布。
    *   `acceptQuest`: **實作了原子化更新 (Atomic Update)** 以處理高併發搶單問題。
*   **驗證**: API 經 curl 測試確認可讀取資料庫真實資料。

### 4. 前端基礎 (Frontend Foundation)
*   **Next.js Config**: 配置支援 GitHub Pages Static Export。
*   **Guild Hall**: 完成公會大廳首頁開發 (`src/app/page.tsx`)，確立了 RPG 暗色系視覺風格。

### 5. 文件完善 (Documentation Polish)
*   **Privacy Scrub**: 完成 Git 歷史清洗，移除敏感個人資訊。
*   **README Revamp**: 更新首頁文件，完整呈現 "Project Guild" 的品牌識別、技術架構與 RPG 特色。
