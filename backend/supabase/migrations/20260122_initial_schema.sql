-- 0. Cleanup (Reset DB) - Ensure a clean slate
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS import_mappings CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS import_batches CASCADE;

-- 0. 初始化設定 (Extensions & Schema)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector   WITH SCHEMA extensions;

-- 設定 Search Path 確保能找到 function
SET search_path = public, extensions;

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
