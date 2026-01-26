# Moonlight Savior (月光救星) 🌙

**AI 驅動的個人財務守護者**

Moonlight Savior 是一個現代化的全端記帳系統，結合了 **Google Gemini AI** 的自然語言處理能力、**Redis** 的高併發佇列處理，以及 **Next.js** 的極速前端體驗。旨在幫助使用者輕鬆管理財務，擺脫「月光族」的困擾。

## 🏗️ 系統架構

本專案採用 **前後端分離 (Monorepo)** 架構：

- **Frontend (`/frontend`)**:
    - **框架**: Next.js 14 (App Router)
    - **樣式**: Tailwind CSS v3 + Shadcn/UI
    - **功能**: 儀表板、交易列表、智慧匯入精靈
- **Backend (`/backend`)**:
    - **核心**: Node.js + Express + TypeScript
    - **資料庫**: PostgreSQL (Supabase)
    - **AI 引擎**: Google Gemini 2.0 Flash
    - **佇列**: Redis (Upstash) + BullMQ (非同步匯入)

## 🚀 快速開始 (Quick Start)

想要在本地端跑起來？請跟著以下步驟：

### 1. 環境準備
確保您的電腦已安裝：
- [Node.js](https://nodejs.org/) (v20+)
- [Git](https://git-scm.com/)

### 2. 下載專案
```bash
git clone https://github.com/shusei/shusei.github.io.git moonlight-savior
cd moonlight-savior
```

### 3. 啟動後端 (Backend)
後端負責處理資料、AI 解析與資料庫溝通。

```bash
cd backend
npm install
# 請確保 backend/.env 已經設定好 (參考 backend/README.md)
npm run dev
```
> 後端將運行於 `http://localhost:3000`

### 4. 啟動前端 (Frontend)
前端提供漂亮的操作介面。

開啟一個新的終端機視窗 (Terminal)：
```bash
cd frontend
npm install
npm run dev
```
> 前端將運行於 `http://localhost:3001` (Next.js 會自動避開 3000 port)

### 5. 開始使用！
打開瀏覽器前往 **`http://localhost:3001`**，您將看到 Moonlight Savior 的儀表板。

## ✨ 主要功能

1.  **AI 智慧記帳**: 在首頁輸入「晚餐吃拉麵 250 元」，AI 自動幫您分類並記錄。
2.  **CSV 高速匯入**: 支援銀行對帳單匯入，每分鐘可處理數千筆交易。
3.  **自動週期帳務**: 設定一次薪水或貸款，系統每月自動記帳，不再忘記。
4.  **全站繁體中文**: 親切的在地化介面。

## 📂 目錄結構

```
moonlight-savior/
├── backend/          # 後端 API 原始碼
│   ├── src/
│   ├── Dockerfile    # 後端容器化設定
│   └── render.yaml   # Render 部署設定
├── frontend/         # 前端 Next.js 原始碼
│   ├── src/
│   └── components.json
└── README.md         # 專案總說明 (本檔案)
```

---
Made with ❤️ by Y2389
