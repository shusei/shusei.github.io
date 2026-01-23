# Moonlight Savior - 後端 API (Backend)

這是一個基於 Node.js, Express, TypeScript 和 Supabase 構建的 AI 智慧記帳後端系統。

## ✨ 主要功能

- **AI 智慧記帳**: 使用 Google Gemini API 解析自然語言交易 (例如："午餐吃牛肉麵 150 元")。
- **高效能匯入引擎**: 結合 Redis & BullMQ 的非同步 CSV 處理，每分鐘可處理 5000+ 筆資料。
- **自動化週期帳務**: 支援訂閱 (Netflix)、薪水 (Income) 和貸款 (Expense) 的自動排程記帳。
- **冪等性設計 (Idempotency)**: 使用 SHA-256 雜湊防止重複記帳。
- **企業級安全**: 資料庫層級的 Row Level Security (RLS) 權限控管。

## 🛠️ 前置需求

- **Node.js**: v20 或以上
- **PostgreSQL**: 建議使用 Supabase
- **Redis**: 建議使用 Upstash (用於佇列管理)
- **Google Gemini API Key**: 用於 AI 解析

## 🚀 快速開始

### 1. 安裝依賴
```bash
cd backend
npm install
```

### 2. 設定環境變數
請在 `backend` 目錄下建立 `.env` 檔案：
```env
DATABASE_URL=postgresql://user:pass@host:5432/postgres
GEMINI_API_KEY=your_gemini_key
REDIS_URL=rediss://default:pass@host:6379
PORT=3000
```

### 3. 本地執行
```bash
npm run dev
```

### 4. Docker 執行
```bash
docker build -t moonlight-backend .
docker run -p 3000:3000 --env-file .env moonlight-backend
```

## 📚 API 文件

### 交易 (Transactions)
- `POST /api/transactions`: 建立新交易
- `POST /api/transactions/smart`: AI 智慧解析 (輸入文字，回傳 JSON)

### 匯入 (Import)
- `POST /api/import/analyze`: 上傳 CSV 並取得 AI 欄位對應建議
- `POST /api/import/start`: 開始非同步匯入任務

## ☁️ 部署指南 (Render.com)

本專案已包含 `render.yaml`，可直接部署至 Render：

1.  將 GitHub Repo連結至 Render。
2.  選擇 "New Web Service"。
3.  **Root Directory**: `backend`
4.  **Build Command**: `npm install && npm run build`
5.  **Start Command**: `node dist/server.js`
6.  記得在 Render 後台設定環境變數 (`DATABASE_URL`, `GEMINI_API_KEY`, `REDIS_URL`)。
