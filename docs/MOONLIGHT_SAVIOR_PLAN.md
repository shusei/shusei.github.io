# System Design Document: 月光族救星 (Moonlight Savior)

> **Role**: Senior Backend Engineer Portfolio Project
> **Version**: 2.0 (Architectural Review)
> **Date**: 2026-01-22

## 1. 專案願景 (Project Vision)
**「月光族救星」** 是一個結合 **高吞吐量批次處理 (High Throughput Batch Processing)** 與 **生成式 AI (GenAI)** 的智慧理財系統。
本專案旨在展示 **Senior Backend Engineer** 在處理複雜資料流、防禦性設計 (Defensive Design) 以及系統邊界定義上的成熟度。系統透過 AI 輔助降低記帳門檻，並利用 RAG 技術提供個人化的財務洞察。

---

## 2. 系統邊界與假設 (Boundaries & Scope)

在設計任何系統前，定義邊界是至關重要的。

### A. 假設 (Assumptions)
*   **單一用戶帳本**：系統設計支援多租戶 (Multi-tenant)，但每個使用者的帳本是獨立的。
*   **單一貨幣基礎**：以 **TWD (新台幣)** 為基礎貨幣，暫不處理多幣別匯率轉換。
*   **時區**：統一使用 **Asia/Taipei (UTC+8)** 處理所有日期邏輯。
*   **輸入來源**：以「手動輸入」與「CSV 匯入」為主，不依賴不穩定的第三方銀行爬蟲。

### B. 非目標 (Non-goals)
*   **跨帳戶對帳 (Reconciliation)**：不處理銀行帳戶餘額與系統餘額的精確核對。
*   **Open Banking 串接**：不直接串接銀行 API (因法規與成本門檻)。
*   **正式稅務申報**：本系統僅供個人財務管理，不具備會計法規效力。

---

## 3. 核心功能與技術指標 (Features & KPIs)

### A. AI 智慧匯入 (AI-Powered ETL Pipeline)
*   **流程**：
    1.  **AI Mapping**: Gemini 分析 CSV 前 5 行，建議欄位對應規則 (Mapping Rule)。
    2.  **Human-in-the-loop**: 使用者預覽並確認規則 -> **儲存規則 (JSONB)** 以供下次復用。
    3.  **Async Processing**: 確認後，將資料推入 Queue 進行非同步寫入。
*   **技術指標 (KPIs)**：
    *   **Throughput**: 目標在 **30 秒內** 完成 **5,000 筆** 交易的解析與寫入。
    *   **Verification**: 使用 **k6** 或 **autocannon** 進行壓力測試，產出效能報告。
    *   **Scalability**: Worker 採用無狀態設計，可隨負載水平擴展 (Horizontal Scaling)。

### B. 冪等性與資料完整性 (Idempotency & Integrity)
*   **挑戰**：使用者重複上傳同一份 CSV，不應產生重複交易。
*   **演算法 (按來源分流)**:
    *   **CSV**: `SHA-256(normalize(date + amount + description + maybe_merchant))`
    *   **Recurring**: `SHA-256(subscription_id + scheduled_date + amount)`
    *   **Manual/API**: 可選擇不強制 Hash (依賴前端 UUID)。
    *   **DB Constraint**: 在 `external_id_hash` 欄位建立 Partial Unique Index。

### C. 毒舌理財教練 (The Savior)
*   **功能**：RAG 分析消費習慣。
*   **風險控制 (Risk Mitigation)**：新增 **"Tone Slider" (語氣調整)**。
    *   預設：Strict (毒舌)。
    *   選項：Soft (溫柔)，避免對玻璃心使用者造成負面體驗 (Product Risk Management)。

### D. 固定支出引擎 (Recurring Engine)
*   **可靠性設計**: 實作 **Catch-up Logic**。
    *   若 Cron Job 因系統維護錯過執行時間 (e.g., 凌晨 3 點當機)，下次啟動時會檢查 `last_run_at` 並補跑漏掉的任務。

---

## 4. 資料庫設計 (Database Schema - Hardened)

採用 **Supabase (PostgreSQL)**，強調資料一致性與安全性。

```sql
-- 0. 初始化設定 (Extensions & Schema)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector   WITH SCHEMA extensions;

-- 1. 匯入批次記錄 (Import Batches) - 先建 (被 Transactions 引用)
CREATE TABLE import_batches (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_rows INT DEFAULT 0,
    processed_rows INT DEFAULT 0,
    error_log JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches FORCE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own rows" ON import_batches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. 固定支出表 (Subscriptions) - 先建 (被 Transactions 引用)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    billing_day INT CHECK (billing_day BETWEEN 1 AND 31),
    billing_month INT CHECK (billing_month BETWEEN 1 AND 12), -- 年繳專用
    
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE, 
    
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_sub_dates CHECK (end_date IS NULL OR end_date >= start_date),
    -- 完整性約束：年繳必須有月份，月繳必須有日期
    CONSTRAINT chk_billing_fields CHECK (
        (billing_cycle = 'monthly' AND billing_day IS NOT NULL) OR
        (billing_cycle = 'yearly'  AND billing_month IS NOT NULL AND billing_day IS NOT NULL)
    )
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own rows" ON subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. 匯入規則對應表 (Import Mappings)
CREATE TABLE import_mappings (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint VARCHAR(64) NOT NULL,
    mapping_rule JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, fingerprint)
);
ALTER TABLE import_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_mappings FORCE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own rows" ON import_mappings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. 存錢目標 (Goals)
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12, 2) DEFAULT 0,
    deadline DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals FORCE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own rows" ON goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. 交易表 (Transactions) - 最後建 (引用上述表格)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    
    description TEXT NOT NULL,
    category VARCHAR(50),
    tags TEXT[],
    
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- ETL 追溯欄位 (ON DELETE SET NULL: 即使批次/訂閱被刪，帳務紀錄須保留)
    source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'recurring', 'api')),
    import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- 冪等性控制 (CSV 與 Recurring 來源必須有 hash)
    external_id_hash VARCHAR(64),
    
    -- RAG 向量
    -- Gemini text-embedding-004 為 768 維 (OpenAI 為 1536)
    embedding extensions.vector(768),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 防呆約束：自動生成的交易必須有 Hash
    CONSTRAINT check_auto_hash CHECK (source IN ('manual', 'api') OR external_id_hash IS NOT NULL)
);
-- Partial Unique Index (只針對有 Hash 的交易去重)
CREATE UNIQUE INDEX idx_transactions_dedup ON transactions(user_id, external_id_hash) WHERE external_id_hash IS NOT NULL;

CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category);
CREATE INDEX idx_transactions_tags ON transactions USING GIN (tags);

-- 啟用 RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own rows" ON transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 權限授權 (Grant Privileges) - 讓 Authenticated User 能存取
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- 讓 authenticated 可以使用 extensions schema (向量/加密相關型別與函式)
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA extensions GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- 權限撤銷 (Revoke Anon) - 強化資安，拒絕未登入存取
REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- 向量索引策略 (未來擴充)
-- 觸發條件：交易量 > 10 萬筆或查詢延遲 > 500ms
-- CREATE INDEX ON transactions USING hnsw (embedding vector_l2_ops);
```

---

## 5. 安全性與隱私 (Security & Privacy)

### A. 資料存取控制 (Row Level Security - RLS)
*   **策略**：強制啟用 RLS (Zero Trust)。
*   **規則**：所有表格必須套用 `WITH CHECK` 策略，確保使用者只能寫入自己的資料：
    `CREATE POLICY "Users can only access own rows" ON table_name FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
*   **權限 (Grants)**：明確授予 `authenticated` 角色 CRUD 權限，拒絕 `anon` 角色存取。
*   **驗證 (QA)**：使用 **Service Role** 執行 Migration，使用 **Anon/User Role** 執行 Integration Tests。

### B. 隱私保護 (Privacy)
*   **Log Masking**：在後端 Logger 中，自動遮蔽敏感資訊 (如 Email, 銀行帳號後五碼) 避免 PII (Personally Identifiable Information) 洩漏。

---

## 6. 面試風險題庫 (Risk Q&A)

1.  **30 秒 / 5000 筆是怎麼量？**
    *   **答**：有 load test 腳本 (k6)、結果數字、worker concurrency 參數與 DB index 佐證。
2.  **Hash Normalize 會不會誤判？**
    *   **答**：Hash 演算法會納入 `import_batch_id + row_number` (針對同一份檔案去重) 或增加更多特徵欄位。
3.  **CSV 解析會不會爆記憶體？**
    *   **答**：使用 Streaming Parser (Node.js Stream)，分 Chunk 入 Queue，記憶體佔用恆定。
4.  **Cron 不準時、漏跑怎辦？**
    *   **答**：Catch-up Logic 依 `last_run_at` 補跑，且靠 Deterministic Hash (`sha256(sub_id + date)`) 防止重複扣款。
5.  **RLS 會不會擋到後端 Worker？**
    *   **答**：Worker 使用 `Service Role Key` (Bypass RLS) 執行寫入，前端 API 則受 RLS 限制。

---

## 7. 測試策略 (Testing Strategy)

*   **Unit Tests (Jest)**: 針對核心商業邏輯 (e.g., 冪等性雜湊計算、Cron 日期推算)。
*   **Integration Tests**: 測試 API 端點與資料庫的互動，驗證 RLS。
*   **Load Tests (k6)**: 模擬 50 個併發使用者同時上傳 CSV，驗證 Queue 的削峰能力。

---

## 8. 驗證與驗收標準 (Verification & Definition of Done)

在專案結案前，必須通過以下 6 大驗證場景，確保架構的可落地性：

1.  **Migration 可重跑 (Reproducibility)**：在全新 DB 執行完整 SQL Script，必須一次成功 (無順序錯誤)。
2.  **RLS 隔離驗證 (Security)**：
    *   User A 無法 Insert `user_id = User B` 的資料 (Policy `WITH CHECK` 攔截)。
    *   User B 無法 Select User A 的資料。
3.  **Service Role 寫入 (System Access)**：Worker 使用 Service Role 能成功寫入 (Bypass RLS)。
4.  **去重生效 (Deduplication)**：同一 User 插入兩筆相同 Hash 的 CSV 交易，第二筆必須觸發 `Unique Constraint Violation`。
5.  **約束生效 (Constraints)**：
    *   `source='csv'` 但無 Hash -> 寫入失敗。
    *   `end_date < start_date` -> 寫入失敗。
6.  **關聯刪除 (Referential Integrity)**：刪除 Import Batch 後，關聯的 Transactions 欄位應變為 NULL (非刪除)。

---

## 9. 開發時程 (Roadmap)

### Phase 1: Foundation (Schema & Auth)
*   [ ] Setup Supabase Project & Auth.
*   [ ] Apply Hardened Database Schema (Run Migration & Grants).
*   [ ] Implement RLS Policies & Verify.

### Phase 2: Core Features (CRUD & AI)
*   [ ] Implement Transaction API with Idempotency Logic.
*   [ ] Integrate Gemini API for Smart Entry.

### Phase 3: High Throughput (Import Engine)
*   [ ] Setup Redis & BullMQ.
*   [ ] Implement AI Mapping Workflow.
*   [ ] Implement Batch Worker & WebSocket Progress.

### Phase 4: Reliability & Polish
*   [ ] Implement Recurring Engine with Catch-up Logic.
*   [ ] Run k6 Load Tests & Optimize.
*   [ ] Deploy to Render & Write Self-hosted Guide.

---

## 10. 基礎設施與部署策略 (Infrastructure Strategy)

### A. 運算資源 (Compute - Render)
*   **Web Service**: 託管 Node.js API Server。
*   **Cron Jobs**: 託管「固定支出引擎」。
    *   **策略**: 採用 Serverless 排程，僅在每日特定時間 (e.g., 00:00) 啟動容器執行檢查，執行完畢即銷毀。
    *   **效益**: 相比 24/7 運行的 VPS，此方案能大幅降低閒置成本 (Cost Optimization)。

### B. 資料儲存 (Storage - Supabase)
*   **Database**: PostgreSQL (關聯式資料)。
*   **Vector Store**: pgvector (AI 向量資料)。
*   **Auth**: 託管身分驗證服務。
*   **成本**: Free Tier (500MB DB, 50,000 MAU)，可零成本跑通核心流程。

### C. 快取與佇列 (Cache & Queue - Upstash)
*   **Redis**: 採用 **Upstash Redis (Free Tier)**，每日 10,000 次免費請求。
*   **成本控制**: 若 BullMQ 消耗過多指令，將降低進度回報頻率 (e.g., 每 100 筆回報一次) 以維持在免費額度內。

### D. AI 模型 (Inference - Google Gemini)
*   **Model**: Gemini 1.5 Flash (Free Tier)。
*   **Embedding**: text-embedding-004 (Free Tier)。
*   **成本**: 目前 Free Tier 提供每分鐘 15 次請求 (RPM)。
*   **風險控制**: AI 功能設計為 **Optional (Feature Flag)**。若 Free Tier 額度耗盡或政策變更，系統可降級為純手動/規則模式，不影響核心記帳功能。
