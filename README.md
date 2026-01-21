# Portfolio: Distributed Task Scheduler Dashboard

> **Live Demo**: [Click Here](https://shusei.github.io/) (Coming Soon)

這是一個展示 **Cloud Native (雲原生)** 架構的後端作品集。
本專案模擬了一個高併發的分散式任務處理系統，採用 **BFF (Backend for Frontend)** 模式設計。

## 📚 系統架構與設計文件 (Architecture & Design)

作為一名重視工程思維的後端工程師，我詳細記錄了本專案的架構決策過程 (ADR)：

*   **[核心架構白皮書 (System Architecture)](./docs/ARCHITECTURE.md)**
    *   詳細說明為什麼選擇 **Node.js + Supabase + Render**。
    *   包含系統架構圖 (Mermaid) 與資料流設計。
    *   分析 2026 年後端技術趨勢與 AI 整合策略。

*   **架構決策紀錄 (Architecture Decision Records)**
    *   [ADR-000: 專案初始策略](./docs/decisions/000-initial-strategy.md)
    *   [ADR-001: 伺服器方案評估 (Cloud vs On-Premise)](./docs/decisions/001-server-selection.md)
    *   [ADR-002: 為什麼放棄 Home Lab 方案](./docs/decisions/002-rejected-home-lab.md)

## 🛠️ 技術棧 (Tech Stack)

| Component | Technology | Why? |
| :--- | :--- | :--- |
| **Frontend** | React + TypeScript + Vite | Type Safety & Modern Build Tool |
| **Backend** | Node.js + Express (TypeScript) | JSON-native, AI-ready ecosystem |
| **Database** | PostgreSQL (Supabase) | Relational Data + Vector Search Ready |
| **DevOps** | GitHub Actions + Render | CI/CD Automation |

## 🚀 如何本地啟動 (Local Development)

請參閱 [架構文件](./docs/ARCHITECTURE.md#3-詳細實作步驟-step-by-step) 中的詳細步驟。
