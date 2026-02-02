# Project Guild (異世界傭兵公會連線網) 🛡️

**"Where Real-Life Chores Meet RPG Quests."**

Project Guild 是一個以「異世界公會」為主題的任務媒合平台。我們將日常瑣事（如跑腿、打掃）包裝成 RPG 委託任務，並透過嚴格的 **State Machine (狀態機)** 與 **Double-Entry Ledger (複式簿記)** 技術，打造一個既好玩又安全的高信任度平台。

> ⚠️ **Demo Phase**: 目前專案處於展示階段 (Backend Engineering Showcase)。所有資料均為測試用途，不涉及真實金流。

---

## 🌟 核心特色 (Key Features)

### 1. 嚴謹的後端工程 (Backend Engineering)
- **Finite State Machine (FSM)**: 任務狀態流轉嚴格受控 (`posted` → `accepted` → `in_progress` → `approved` → `paid`)，杜絕邏輯漏洞。
- **Atomic Concurrency Control**: 使用 Database Transaction 與 Atomic Update 確保「萬人搶單」時的資料一致性。
- **Double-Entry Ledger**: 內建會計級帳本系統，每一筆 GP (Guild Point) 的流動都有據可查 (`escrow_deposit`, `escrow_release`)。

### 2. 沉浸式 RPG 體驗
- **四大職業**: 討伐 (Slay)、採集 (Gather)、護送 (Escort)、解謎 (Puzzle)。
- **階級制度**: 從 F 級新手到 S 級傳說，透過完成委託累積 Trust Score 晉升。
- **公會大廳**: 暗色系羊皮紙風格 UI，帶給使用者身歷其境的冒險感。

### 3. 安全與風控 (Safety & Trust)
- **Escrow 托管支付**: 委託金先由公會托管，驗收通過後才放款，保障雙方權益。
- **風險分級 (L0/L1/L2)**: 針對到府服務 (L2) 實施更嚴格的審核與權限控管。

---

## 🏗️ 技術堆疊 (Tech Stack)

本專案採用現代化 **Monorepo** 架構，專注於高效能與開發體驗：

| Layer | Technology | Status |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14** (App Router), Tailwind CSS, Lucide Icons | 🟢 Static Export Mode |
| **Backend** | **Node.js + Express** + TensorFlow/Gemini Integration | 🟢 RESTful API |
| **Database** | **PostgreSQL** (Supabase) | 🟢 Migration Managed |
| **Language** | **TypeScript** (Strict Mode) | 🟢 Shared Types |
| **DevOps** | GitHub Pages (Frontend) + Render (Backend) | 🟢 CI/Ready |

---

## 🚀 快速開始 (Quick Start)

### 1. 環境準備
- Node.js v20+
- Git

### 2. 下載專案
```bash
git clone https://github.com/shusei/shusei.github.io.git project-guild
cd project-guild
```

### 3. 啟動後端 (The Guild Registry)
後端負責處理公會核心業務邏輯。

```bash
cd backend
npm install
# 連線至 Demo 資料庫 (或參考 .env.example 設定本地庫)
npm run dev
```
> 後端將運行於 `http://localhost:3002/api`

### 4. 啟動前端 (The Guild Hall)
前端提供冒險者互動介面。

```bash
cd frontend
npm install
npm run dev
```
> 前端將運行於 `http://localhost:3000`

---

## 📂 目錄結構 (Directory Structure)

```
project-guild/
├── backend/                  # 後端核心 (The Registry)
│   ├── src/controllers/      # 業務邏輯 (Quest/User Logic)
│   ├── src/routes/           # API 路由
│   ├── supabase/migrations/  # 資料庫定義 (SQL)
│   └── scripts/              # 維運腳本 (Seed/Migrate)
├── frontend/                 # 前端介面 (The Guild Hall)
│   ├── src/app/              # Next.js Pages (App Router)
│   └── public/               # 靜態資源
└── docs/                     # 專案文檔
    └── project_proposal.md   # 詳細企畫書 (Recommended Read)
```

---

## 📜 授權與聲明
*   **License**: MIT
*   **Developer**: Shusei (Backend Engineer)
*   **Contact**: shengjyun.lin@gmail.com
