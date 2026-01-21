# 全端雲原生作品集實戰指南 (Cloud Native Portfolio Guide)

這是一份針對 **GitHub Pages + Render + Supabase** 架構的詳細實作教學。
目標：建立一個 **「分散式任務監控儀表板」**，展現你的後端架構能力。

---

## 1. 為什麼選擇這個技術棧？(2026 年後端求職策略分析)

你問了一個關鍵問題：「為什麼是這些技術？它們能最大化我的錄取率嗎？」
**答案是肯定的。** 在 2026 年，單純會寫 API 的後端工程師已經飽和，企業要的是 **「能解決雲端架構問題的工程師」**。

### 核心技術選擇與錄取率分析

| 技術組件 | 選擇方案 | 為什麼這能提升錄取率 (2026 觀點) |

**為什麼這樣設計？**
1.  **全端視野**：面試官在一個 Repo 就能看到你的全貌。
2.  **模擬真實環境**：現代大型科技公司 (Google, Meta, Uber) 都採用 Monorepo 管理代碼。這顯示你與業界標準接軌。

---

## 2. 系統架構設計 (System Architecture)

```mermaid
graph LR
    User[使用者] -->|瀏覽器| FE[GitHub Pages (React/Vite)]
    FE -->|HTTPS API| BE[Render (Node.js/Express)]
    BE -->|讀寫| DB[(Supabase PostgreSQL)]
    BE -->|快取/佇列| Redis[(Upstash Redis)]
```

### 架構白話文詳解 (The Restaurant Analogy)

如果把這個系統想像成一間 **「餐廳」**，各個角色的分工如下：

1.  **User (使用者)**：就是 **「顧客」**。
    *   顧客只看得到菜單 (前端頁面)，看不到廚房 (後端/資料庫)。

2.  **GitHub Pages (Frontend)**：這是 **「菜單與裝潢」**。
    *   它負責「長得好看」並讓顧客點餐。
    *   它是 **靜態的**，就像紙本菜單，不能直接煮菜。
    *   當顧客點餐時，它會呼叫服務生 (發送 API 請求)。

3.  **Render (Backend API)**：這是 **「服務生」**。
    *   他是唯一能進出廚房的人。
    *   他接收顧客的訂單 (API Request)，確認有沒有賣完 (邏輯驗證)，然後把單子送進廚房。
    *   **為什麼需要他？** 如果讓顧客直接進廚房 (前端直接連資料庫)，非常危險，顧客可能會偷吃或把廚房燒了。服務生保護了廚房的安全。

4.  **Supabase (Database)**：這是 **「廚房與倉庫」**。
    *   食材 (資料) 全部存在這裡。
    *   只有服務生 (Backend) 可以跟它拿東西。

5.  **Redis (Cache)**：這是 **「出菜口的保溫台」**。
    *   有些熱門菜色 (例如「今日特餐」)，廚房先做好了放在這裡。
    *   服務生不用進倉庫找食材重做，直接從這裡拿給顧客，速度超級快。

### 圖表代碼與術語解釋 (Diagram Legend)

你在文件中看到的 `mermaid` 代碼是用來自動產生圖表的語言，以下是這些縮寫的含義：

*   **graph LR**: 代表圖表方向是 **「從左到右 (Left to Right)」**。
*   **FE (Frontend)**: **前端**。也就是使用者看到的網頁 (GitHub Pages)。
*   **BE (Backend)**: **後端**。也就是在伺服器上運作的程式 (Render)。
*   **DB (Database)**: **資料庫**。存資料的地方 (Supabase)。
*   **-->**: 代表資料或請求的 **流向**。

---

## 3. 詳細實作步驟 (Step-by-Step)

### 第一階段：資料庫與後端環境 (Database & Backend)

#### 步驟 1: 設定 Supabase (PostgreSQL)
1.  註冊 [Supabase](https://supabase.com/)。
2.  建立新專案 `portfolio-db`。
3.  記下 **Connection String (URI)** 和 **API Key**。
4.  在 SQL Editor 執行以下 SQL 建立範例資料表：
    ```sql
    CREATE TABLE tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, processing, completed
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ```

#### 步驟 2: 初始化後端專案 (開發階段)
> **注意**：這裡的「Local」是指在你的電腦上 **「寫程式」**。寫完之後，我們會透過 Git 上傳到 Render (雲端)，讓它在雲端運行。

1.  在本地專案根目錄建立 `backend` 資料夾。
2.  初始化專案：`npm init -y`。
3.  安裝必要套件 (加入 TypeScript 支援)：
    `npm install express pg dotenv cors`
    `npm install --save-dev typescript @types/node @types/express @types/pg @types/cors ts-node nodemon`
4.  建立 `tsconfig.json`：
    ```json
    {
      "compilerOptions": {
        "target": "es2020",
        "module": "commonjs",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "outDir": "./dist"
      }
    }
    ```
5.  建立 `src/server.ts` (使用 TypeScript)：
    ```typescript
    import express from 'express';
    import cors from 'cors';
    import { Pool } from 'pg';
    import dotenv from 'dotenv';

    dotenv.config();

    const app = express();
    app.use(cors());
    app.use(express.json());

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    app.get('/api/tasks', async (req, res) => {
      try {
        const { rows } = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json(rows);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    ```

#### 步驟 3: 部署後端到 Render
1.  將代碼 Push 到 GitHub。
2.  註冊 [Render](https://render.com/)。
3.  新增 **Web Service** -> 連接你的 GitHub Repo。
4.  設定：
    *   **Root Directory**: `backend`
    *   **Build Command**: `npm install && npm run build` (需要在 package.json 設定 build script: `tsc`)
    *   **Start Command**: `node dist/server.js`
    *   **Environment Variables**: 加入 `DATABASE_URL` (從 Supabase 取得)。

---

### 第二階段：前端開發 (Frontend)

#### 步驟 4: 初始化前端
1.  回到根目錄。
2.  建立 React 專案：`npm create vite@latest frontend -- --template react-ts` (使用 TypeScript)。
3.  進入資料夾並安裝：`cd frontend && npm install`。
4.  修改 `src/App.tsx` 來呼叫你的 Render API。

#### 步驟 5: 部署前端到 GitHub Pages
**推薦做法 (GitHub Actions)**：
在 `.github/workflows/deploy.yml` 設定當 `main` 有 push 時，自動 build frontend 並部署到 `gh-pages` 分支。

---

## 4. 如何讓這個作品脫穎而出？ (加分題)

1.  **Swagger API 文件**：在後端加入 `swagger-ui-express`，讓面試官可以直接在網頁上測試 API。這顯示你重視**開發者體驗 (DX)**。
2.  **模擬延遲與非同步處理**：在後端故意加入 `setTimeout` 模擬 5 秒的處理時間，然後前端顯示 Loading Spinner。這展示你對 **UX 與非同步邏輯** 的處理能力。
3.  **WebSocket 即時更新**：使用 `socket.io` 實作即時更新，當後端任務完成，前端不需要重整就能看到狀態改變。這展示你對 **Real-time Communication** 的掌握。

---

## 5. 免費版限制與面試風險管理 (Risk Management)

你擔心的 **「面試時剛好掛掉」** 是非常專業的考量。免費服務確實有兩個致命傷，但只要我們**「預先管理」**，反而能成為面試時的亮點。

### A. Render 的「冷啟動 (Cold Start)」問題
*   **限制**：免費版 Web Service 如果 15 分鐘沒人連線，會自動休眠 (Spin Down)。
*   **風險**：面試官點開你的網站，第一個 API 請求可能要等 **30~50 秒** 才會醒來。這會讓網站看起來像壞掉了。
*   **解決方案 (Mitigation)**：
    1.  **UI 優化**：在前端顯示「系統喚醒中，請稍候...」的 Loading 提示 (這展示了良好的 UX)。
    2.  **預熱 (Warm-up)**：面試前 5 分鐘，自己先用手機點開網頁，把伺服器叫醒。
    3.  **自動化 (進階)**：使用 UptimeRobot (免費監控服務) 每 10 分鐘 Ping 一次你的 API，讓它永遠不睡覺 (Render 允許這樣做，只要不超過每月 750 小時)。

### B. Supabase 的「暫停 (Pause)」問題
*   **限制**：免費版資料庫如果 **7 天** 沒有任何連線，會被暫停。
*   **風險**：面試當天資料庫連不上。
*   **解決方案**：
    1.  **定期登入**：每週登入一次 Supabase Dashboard，或者寫一個簡單的 Script 每天讀寫一次資料。
    2.  **面試前檢查**：這是標準的 SOP，Demo 前一定要檢查環境。

### C. 流量限制 (Rate Limiting)
*   **現狀**：Render 免費頻寬 100GB/月，Supabase 資料庫 500MB。
*   **評估**：除非你的面試官是用 DDoS 攻擊你的網站，否則單純的點擊操作 **絕對不可能** 超過這個用量。文字型 JSON 資料非常小，點擊一萬次可能才幾 MB。

> **面試話術**：
> 「因為這是個人作品集，我選擇了成本效益最高的 Serverless 免費方案。雖然有 Cold Start 的限制，但我實作了 Loading State 來優化體驗，並且使用了 UptimeRobot 來維持服務可用性。」
> **(這句話證明了你懂成本控制，也懂如何解決架構帶來的副作用)**
