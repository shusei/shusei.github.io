# 專案企畫書：異世界傭兵公會連線網

**英文名**：Real-life Mercenary Guild Network
**專案代號**：Project Guild
**提案日期**：2026/02/02
**開發者**：公子姐

## 0. 一頁式摘要（Executive Summary）

Project Guild 是一個以「異世界傭兵公會」為 UX 主題的任務媒合平台：
把日常瑣事（整理、跑腿、代購、微型技術協作）包裝成 RPG 委託任務，並以 **遊戲化名聲系統** + **平台級風控** +（MVP 先用）**托管點數結算（Escrow）**，打造「好玩但可控、能落地」的公會式平台。

**核心技術亮點（Technical Highlights）：**

*   **任務狀態機 + 併發搶單保證**（workflow + concurrency control）
*   **托管帳本 Ledger（雙邊記帳）+ 冪等結算**（transactional correctness）
*   **Outbox + Worker 非同步事件**（可靠通知/排行/AI）
*   **風控引擎 Risk Scoring + 審核池**（moderation pipeline）
*   **可觀測性 Observability + 基本 SLO 指標**（production readiness）
*   **權限與資料隔離 RBAC/RLS/ABAC**（security & privacy by design）

*   **權限與資料隔離 RBAC/RLS/ABAC**（security & privacy by design）

*   **專案核心價值 (Core Value Proposition)**：本平台致力於打造具備 **「金融級交易正確性」** 與 **「企業級風控」** 的媒合基礎建設，優先驗證高併發架構與資安合規性基礎。

---

## 1. 專案願景（Vision）

> 「把乏味的生活瑣事，轉化成可接可交付的冒險任務。」

現代人（獨居、雙薪、時間碎片化）常需要他人協助處理微型任務；但既有媒合工具要嘛偏物流、要嘛偏長時數服務，對「小任務」不夠友善，也缺乏留存與社群驅動。

Project Guild 的核心不是「更便宜的跑腿」，而是：
用公會敘事降低發任務門檻，用 RPG 成就提高接單者留存，用平台級後端與風控流程讓高風險任務可控。

## 2. 產品定位與邊界（Scope & Boundaries）

### 2.1 任務分級（Safety-first）

*   **L0：線上數位任務（最低風險）**：文案/翻譯/資料整理/簡易程式協作/遠端教學
*   **L1：線下但公共交付（中風險）**：代購（限可驗證來源）、排隊取件（公共場所交付）
*   **L2：到府居家任務（高風險）**：整理、打掃、丟垃圾、簡易搬運
    *   → **白名單制 + 強制安全流程**（見第 6 章）

### 2.2 禁止任務（平台紅線）

違禁品/不明物代拿代送、現金代收代付、情色交易、暴力恐嚇、要求進私人房間或關門空間、疑似洗錢或規避平台監管的私下交易。

## 3. 產品核心（Core Concepts）

### 3.1 角色扮演（Role-Playing）
*   **委託人（Quest Giver）**：城鎮居民/貴族，發布委託
*   **傭兵（Mercenary）**：接任務、交付成果、累積名聲與稱號

### 3.2 遊戲化激勵（Gamification）——雙重等級系統
*   **冒險者階級 (Adventurer Rank)**：能力與可靠度指標
    *   **F（見習）**：僅能接 L0 線上任務
    *   **E~C（正規）**：解鎖 L1 公共場所任務
    *   **B~A（資深）**：解鎖 L2 到府任務（需高信譽驗證）
    *   **S（傳說）**：享有幾乎無限制的接單權限與特殊稱號
*   **委託人信譽 (Client Reputation)**：慷慨度與安全性指標
    *   **鐵牌 (Iron)**：新戶，需全額托管點數
    *   **銀牌/金牌 (Silver/Gold)**：交易良好，享有優先審核或手續費減免
    *   **白金 (Platinum)**：VIP 客戶，可發布特殊高報酬任務
*   **稱號（Title）**：倒垃圾大師、秩序整頓者、極速採集者…
*   **公會規章（Rulebook）**：把安全規則「寫成公會法令」，用世界觀提高遵守率

### 3.3 托管結算（Escrow Ledger, MVP 版）
*   MVP 不直接碰法幣金流，使用「平台點數」：
    1.  委託人先把點數押到托管池（Escrow）
    2.  傭兵交付 → 委託人驗收 → 托管放款
*   全程可追溯帳本（Ledger），支援爭議凍結

### 3.4 AI 智慧櫃台 (AI Receptionist) - 雙層分類系統
*   **使用者視角 (UX)**：使用者只需用自然語言說「幫我丟垃圾」。
*   **系統轉譯 (System)**：
    *   **實務標籤 (Tags)**：`#居家清潔`、`#倒垃圾` (用於搜尋與篩選)
    *   **公會分類 (Guild Class)**：判定為 **「討伐 (Slay)」** (用於 UI 圖示、印章風格與成就系統)
*   **對話式引導**：自動確認細節（有無分類回收？幾袋？），並匹配對應的「公會印章」。

## 4. 功能架構（Feature Specification）

### 4.1 公會大廳（Guild Hall）
今日熱門任務、公會公告、排行榜、活動事件。

### 4.2 任務佈告欄（Quest Board）
任務卡片（羊皮紙/印章/急募）＋ 篩選：等級、類型、地點、報酬。
（高風險任務可設定「僅高信任傭兵可見」。）

### 4.3 委託發布中心（Quest Post）
AI 輔助輸入；強制欄位：交付方式、交付點（L1 限公共點；L2 需勾選安全流程）。
內建禁止事項提醒（不明物/進房/私下交易）。

### 4.4 任務執行室（Quest Room）
平台內訊息、任務狀態、交付物、驗收、結算、評價。

### 4.5 冒險者執照（Mercenary Profile）
Rank、完成數、準時率、取消率、評價、稱號；Trust Score 用於解鎖 L2。

### 4.6 爭議中心（Dispute Center）
提出爭議 → 托管凍結 → 雙方提交證據 → 仲裁 → 放款/退回。

### 4.7 公會管理台（Admin Console）
審核池、檢舉處理、封禁、稽核查詢、SOS/爭議事件包下載。

## 5. 使用者流程（User Journey）

### 5.1 標準委託流程 (Standard Quest Flow)
1.  **發布 (Post)**
    *   委託人向 AI 櫃檯描述需求 (`I need someone to pick up my laundry`).
    *   系統自動生成任務卡：設定分類 (Gather)、標籤 (#laundry)、建議賞金、風險等級 (L1)。
    *   委託人確認並支付 GP 至托管池 (Status: `Posted`)。
2.  **承接 (Accept)**
    *   傭兵瀏覽任務板，檢視地點與報酬。
    *   點擊「接受委託」，系統鎖定任務 (Concurrency Lock)。
    *   任務狀態轉為 `Accepted`，雙方開啟專屬聊天室。
3.  **執行 (Execute)**
    *   (L2 任務需執行安全打卡：`Check-in` -> `Safe Check` -> `SOS Ready`)
    *   傭兵完成工作，透過 Web App 拍照上傳交付物 (Proof of Work)。
    *   傭兵點擊「提交任務」 (Status: `Submitted`)。
4.  **驗收 (Verify)**
    *   委託人收到通知，檢視交付照片/成果。
    *   點擊「驗收通過」 (Status: `Approved`)。
    *   **系統自動放款**：GP 從托管池轉入傭兵帳戶 (Status: `Paid`)。
5.  **評價 (Review)**
    *   雙方互評 (1-5 星) 並選擇標籤 (準時/親切/專業)。
    *   更新雙方信譽積分 (Trust Score / Rank)。此時任務正式結案 (Status: `Completed`)。

### 5.2 異常處理流程 (Exception Flow)
*   **爭議 (Dispute)**：若委託人拒絕驗收或傭兵失聯，任一方可發起爭議。
    *   資金凍結 (Frozen)，管理員/仲裁團介入審視對話與存證。
    *   *定義：`disputed` 為任務狀態；`Frozen` 為托管資金 (Escrow) 狀態。當任務進入 `disputed` 時，系統自動將對應 Escrow 標記為 `Frozen` 停止放款。*
    *   判決結果：全額退款、全額放款或部分退款。

## 6. 安全機制（Safety & Trust）—「到府整理也能做」的落地方案

### 6.1 L2 到府任務：白名單制（權限鎖＝你的「強制」）
*   委託人、傭兵需達到驗證/信任門檻才可發/接 L2
*   **實名錨點 (Identity Anchor)**：
    *   **Level 1 驗證 (Basic)**：手機號碼 (SMS OTP)。
    *   **Level 2 驗證 (Advanced)**：**多選一**，降低門檻：
        *   (A) 信用卡 3D 驗證。
        *   (B) 綁定實名制電子支付帳戶 (LINE Pay/JKOPay)。
        *   (C) 累積 Trust Score > 80 分且完成 5 筆 L1 任務。
    *   *平台聲明：不儲存信用卡號或帳戶資訊，僅保存第三方回傳之 Verification Token/Result。*

### 6.2 L2 強制安全流程（平台預設規則）
*   只開放白天時段（例：09:00–18:00）
*   大廳握手碼/QR 開始（雙方配對成功才算開始）
*   任務打卡 + 定時安全確認（逾時觸發關懷）
*   一鍵 SOS：鎖存任務單、聊天、時間戳、最後打卡資訊
*   私人房間預設禁止（臥室/浴室/關門空間預設不允許；若必須進入需事前揭露並提高風險等級）
*   **安全優先原則**：優先選擇家門口/客廳等開放區域交付；建議委託人安排「室友/家人/管理員」在場（非強制，但平台強烈建議）。

### 6.3 避免被拿去犯罪（不明物/運毒）
*   禁止代送不明物（拿袋子送某處、代拿包裹）
*   丟垃圾規則：透明袋/可目視內容（或平台封條袋＋存證）
*   風險引擎命中 → 進審核池/降權/封禁

### 6.4 隱私防護 (Privacy Shield)
*   **地址遮蔽 (Address Masking)**：任務地址僅在 `Accepted` 至 `Completed` 期間對傭兵可見，結案後自動隱藏。
*   **虛擬號碼 (Virtual Number)**：(V2 規劃) 雙方通話透過轉接，不顯示真實電話號碼。

## 7. 技術架構（Technical Architecture）

### 7.1 前端
React 生態系 + TypeScript；Tailwind + 元件庫；沉浸式動畫（卷軸/印章）。

### 7.2 後端
Node.js；PostgreSQL；Redis（搶單鎖、排行榜快取、節流）；Queue/Worker（通知、風控掃描、AI 生成）。

### 7.3 平台級後端設計（Backend Engineering Core）

**(1) 任務狀態機 + 併發接單保證（Workflow + Concurrency）**
*   嚴格狀態：posted → accepted → in_progress → submitted → approved → paid → **completed**
*   **例外狀態**：cancelled, expired, disputed, refunded, partially_refunded
*   每次轉移有 guard（誰可轉、何時可轉）
*   併發接單：使用 DB transaction + 樂觀/悲觀鎖 或 唯一約束，確保同一任務只能被一人 accepted

**(2) 托管帳本 Ledger（雙邊記帳）+ 可追溯（Financial-grade correctness）**
*   Escrow 扣款/凍結/放款全部走 ledger event
*   balance 只當快取，真相在 ledger
*   每筆交易可追溯到任務與操作人（audit-ready）
*   **Ledger Event 目錄 (MVP)**：
    *   `escrow_deposit` (Client → Escrow)
    *   `escrow_release` (Escrow → Mercenary)
    *   `cancel_fee_payout` (Commission/Penalty → Counterparty)
    *   `refund_full` / `refund_partial` (Escrow → Client)
    *   `ledger_reversal` (修正或豁免時的反向沖帳，帶 `ref_event_id`)

**(3) 冪等性（Idempotency）+ 安全重試**
*   approve/pay/cancel/refund 需支援重試
*   使用 idempotency key 防止重複扣款/放款
*   針對網路中斷/重送請求可保證「最多一次」效果

**(4) Outbox Pattern + Worker（可靠非同步）**
*   DB transaction 內寫入 outbox
*   Worker 負責：通知、排行榜刷新、AI 生成、風險掃描
*   避免「扣款成功但通知沒發」這類一致性破口

**(5) 風控引擎 Risk Score + 審核池 Moderation Queue**
*   發單/聊天/行為事件產生 risk score 與 risk event。
*   **高風險訊號 (Signals)**：
    1.  任務描述含「密封包裹/不許打開」。
    2.  要求進入私人房間或關門獨處。
    3.  新帳號發布高額任務 + 指定單一特定傭兵。
    4.  聊天中要求私下轉帳或交換私人聯絡方式。
    5.  L2 任務在短時間內頻繁取消或更改地點。
*   高風險：進審核池、限制曝光（僅高信任傭兵可見）、或直接阻擋
*   管理台可回放事件與處置紀錄（可稽核）

**(6) 可觀測性 Observability + 基本 SLO**
*   structured logging（帶 trace_id/task_id/user_id）
*   metrics：接單延遲、驗收延遲、放款延遲、爭議率、風控命中率
*   metrics：接單延遲、驗收延遲、放款延遲、爭議率、風控命中率
*   **SLO 目標**：放款延遲 P95 < 30s (Worker Async)；帳本異常 = 0；審核池堆積 P95 < 10min。

### 7.4 安全與權限（RBAC / RLS / ABAC）
*   **RBAC**：委託人/傭兵/管理員權限切分
*   **ABAC**：依任務等級 L0/L1/L2、Trust Score、Risk Score 動態授權
*   **資料隔離**：任務內容、交付物、訊息、帳本、稽核紀錄均需最小揭露
### 7.5 系統擴展路線圖 (Scalability Roadmap)
*   *備註：本段成本與價格僅供量級參考 (Order of Magnitude)，實際費用以當期雲端報價與使用量為準。*
*   **階段零：概念驗證 (Proof of Concept, PoC)**
    *   **目標**：快速驗證核心流程與投資人演示 (Pitch Demo)。
    *   **架構**：GitHub Pages (Frontend) + Render Free Tier (Backend) + Supabase Free (Database) + **Upstash Redis Free**。
    *   **預算**：**$0 TWD (Bootstrap)**。
*   **階段一：最小可行性產品 (MVP) —— 初期營運**
    *   **目標**：支援 0 ~ 3,000 用戶之穩定營運。
    *   **架構**：單體主機 (All-in-One VPS)。將 Frontend, Backend, Database, Redis 整合部署。
    *   **規格要求**：建議配置至少 **2GB RAM** (如 AWS Lightsail / DigitalOcean Droplet) 以確保服務穩定性。
    *   **預算**：約 **$10 - $20 USD / 月** (300~600 TWD)。
*   **階段二：市場擴張期 (Growth Phase) —— 用戶數 10萬+**
    *   **目標**：高可用性 (HA) 與資料安全性，消除單點故障 (SPOF)。
    *   **架構**：三層式架構 (3-Tier Architecture)。分離 Web Server, Application Server, Database。
    *   **架構規格**：
        *   **負載平衡 (Load Balancer)**：AWS ALB / Cloudflare。
        *   **應用叢集 (App Cluster)**：至少 2 台 App Server 實現備援 (Failover)。
        *   **託管資料庫 (Managed DB)**：AWS RDS PostgreSQL (自動備份/Multi-AZ)。
        *   **託管快取 (Managed Cache)**：AWS ElastiCache for Redis。
    *   **預算**：約 **$300 - $800 USD / 月**。
*   **階段三：大規模營運期 (Hyperscale / Unicorn) —— 用戶數 1,000萬+**
    *   **目標**：極端併發處理與微服務治理。
    *   **架構**：微服務 (Microservices) + Kubernetes (K8s/EKS)。
    *   **關鍵技術**：
        *   **容器編排**：AWS EKS (Elastic Kubernetes Service)。
        *   **分散式資料庫**：AWS Aurora Serverless / CockroachDB。
        *   **事件驅動架構 (EDA)**：Kafka / AWS MSK 處理並行流量峰值。
    *   **預算**：**$5,000 USD 起跳** (視流量動態調整)。

### 7.6 AI 成本控制與防禦 (AI Cost & Security Defense)
*   **Token 經濟模型**：
    *   **成本預估**：公式 `Cost = Avg_Calls_Per_Order * Model_Price`。模型與價格依當期 API 為準，保持彈性。
*   **惡意攻擊防禦 (DoS & Wallet Drain)**：
    *   **Rate Limiting**：每人每日 AI 對話上限 50 次。
    *   **Caching**：相同問題（如「如何接單」）直接回傳快取，不打 LLM。
    *   **熔斷機制 (Circuit Breaker)**：當 AI 總花費達到日預算上限（如 $100），自動降級為傳統表單模式，停用 AI 對話。
    *   **分級模型**：簡單分類用 gpt-4o-mini (極具成本效益)，複雜爭議才用 gpt-4o。

## 8. 商業模式與營運規則 (Operational Rules)
*   **貨幣單位**：**GP (Guild Point)**，1 GP 以 1 TWD 作為**定價參考 (Pricing Reference)**。
    *   *定義：在 MVP 驗證階段，GP 定位為平台封閉生態系之公測點數 (Pilot Program Points)。*
*   **取消政策 (MVP)**：
    *   `Accepted` 前：雙方皆可無痛取消。
    *   `Accepted` 後 **委託人取消**：扣除 10%（由 Escrow 支付，全額補償給傭兵），餘額退回委託人。
    *   `Accepted` 後 **傭兵取消**：Escrow 全額退回委託人；傭兵記 **取消率 + 冷卻時間 + Trust Score 扣分**（無金錢損失但影響接單）。
    *   **例外豁免 (Exception Framework)**：若遇「任務內容與描述重大不符」、「現場危險」或「雙方合意取消」，可透過申訴流程免除處罰（**執行 Ledger Reversal 沖回**）。系統依 Log 優先自動判責。
*   **商業模式 (Business Model)**：
    *   **推廣期 (Promotion Phase)**：
        *   **策略**：免媒合手續費，以獲取用戶增長。
        *   **防刷機制**：不靠手續費門檻，改採 **「頻率限制 + 評價權重衰減」** 及 **「實名錨點」** 作為主要防禦。
        *   **保護基金**：由天使輪資金撥備「善意補助金 (Ex-gratia Payment)」。
    *   **成熟期 (Mature Phase)**：
        *   **策略**：接通外部金流 (Fiat Payment) 後抽取 5-10% 媒合費 + 1% 保護基金。
        *   **防刷機制**：手續費本身即為刷分成本壁壘。
*   **資金流轉 (Fund Flow - MVP)**：
    *   **點數定義**：GP 為「平台服務點數」，主要用於平台內消費與折抵。
    *   **提領服務 (Withdrawal)**：(V2 規劃) 將串接合規金流合作夥伴 (PSP) 處理法幣結算與申報，平台僅提供交易帳本稽核 (T+7 結算)。
*   **合規輔助 (Compliance)**：平台每年提供年度收入報表 (Earnings Summary)，協助用戶自行申報所得稅。

## 9. 在台灣落地的可行性（Feasibility, Portfolio Perspective）
*   市場痛點存在，但信任不足
*   差異化：公會敘事提高留存；分級風控讓到府任務可控；托管帳本降低糾紛
*   上線策略：先 L0/L1 建立信任與風控，再逐步開 L2 白名單

## 10. MVP 里程碑與驗收標準 (Milestones & Acceptance Criteria)

| 驗收項目 | 成功標準 (Definition of Done) | 測試方法 |
| :--- | :--- | :--- |
| **0. 核心基礎** | 專案可於本地與雲端 (Demo 環境) 順利啟動，無嚴重報錯 | GitHub Pages + Render Deploy |
| **1. 併發搶單** | 100 人同時搶同一單，資料庫僅有 1 筆 `Accepted`，其餘失敗 | 壓力測試腳本 (k6/JMeter) |
| **2. 帳本冪等** | 重送多次 `Approve` 請求，Ledger 僅記錄一筆出金，餘額正確 | API 重送測試 (Postman) |
| **3. Outbox 可靠性** | Ledger Commit 後 Outbox 必存在；Worker 重試不重複發送 | 故障注入測試 (Fault Injection) |
| **4. 風控掃描** | 輸入敏感關鍵字（如「毒品」）能觸發 Risk Event 並阻擋/標記 | 單元測試 / 手動輸入 |
| **5. 狀態機** | 任務不可從 `Posted` 直接跳到 `Paid`；取消後不可再 `Submit` | 狀態轉移路徑測試 |
| **6. 存證留存** | 上傳之驗收照片需帶有伺服器時間戳與任務 ID 浮水印 | 檢視上傳檔案 metadata |
| **7. 觀測指標** | 交易/風控事件需產生 Metrics；SLO 儀表板可正確顯示 P95 延遲 | 檢視 Grafana/Log |

## 11. 核心挑戰與應對方案 (Core Challenges & FAQ)

**(1) 刷分與共謀風險 (Collusion & Farming)**
*   **挑戰**：朋友互發虛假任務洗 S 級評價。
*   **應對**：
    *   **頻率限制**：同一對用戶 (A↔B) 的評價權重與頻率隨次數遞減 (Diminishing Utility)。
    *   **地理圍欄**：L1/L2 任務需校驗雙方打卡 GPS 距離。

**(2) 爭議處理的擴展性 (Dispute Scalability)**
*   **挑戰**：若 10% 任務產生爭議，人工客服會崩潰（尤其在免手續費推廣期）。
*   **應對**：
    *   **預設自動判決 (Automated Default)**：針對單純取消與逾時，系統依 Log 自動判責（如：誰最後沒打卡）。只有涉及實體糾紛（貨物損壞）才進入人工/社群仲裁。
    *   **社群仲裁 (Community Jury)**：(V2 概念驗證) 參考 Kleros，未來可考慮引入 S 級陪審團，但在治理成熟前主要由官方 Admin 仲裁。
    *   **舉證結構化**：強制使用平台內建「存證相機」(Web App 呼叫相機 + 伺服器端壓印時間戳) 才可作為有效證據，減少溝通成本。

**(3) 平台法律責任 (Liability)**
*   **挑戰**：傭兵打破花瓶或受傷，平台賠不賠？
*   **應對**：
    *   **平台定位**：定調為「資訊媒合 (SaaS)」，非僱傭關係（參照 Uber/Foodpanda 條款），用戶需自行報稅。
    *   **平台善意補助 (Goodwill Subsidy)**：平台自願提撥營收設立補助金，針對 L2 任務提供有限額的財損補貼（上限 10,000 GP）。*聲明：此非保險產品，平台保留最終審核權 (Ex-gratia based)。*

**(4) 智慧財產權規範 (IP Compliance)**
*   **挑戰**：使用類似「木葉村」、「火影」等知名動漫術語可能招致法務訴訟。
*   **應對**：
    *   **原創世界觀**：使用通用奇幻術語（公會、S 級、委託），嚴格禁止使用受商標保護的特定名詞。
    *   **美術檢核**：UI 素材與印章設計需確保原創或使用商用授權素材，避免直接挪用動漫圖示。

## 12. 財務規畫與公司治理 (Financial & Business Roadmap)

### 12.1 啟動資本與公司設立 (Startup Capital)
*   **公司設立**：**必須成立公司 (LLC/Ltd.)** 以切割股東個人無限責任（防火牆）。
*   **初期資金需求 (Pre-seed Funding Requirement)**：建議準備 **200萬 - 300萬 TWD** (約 6-12 個月 Runway)。
    *   **主機/SaaS**：3-5 萬/月 (初期優化成本，保留彈性)。
    *   **AI Token**：預設 1 萬/月 (配置熔斷控制)。
    *   **法務/會計**：10 萬 (一次性設立與合約審閱)。
    *   **核心團隊**：創辦人採股權激勵 (Equity-based) 模式，預留營運人員薪資空間。

### 12.2 收支預估 (P&L Forecast)
*   **收入 (Revenue)**：
    *   **媒合手續費**：成交金額的 5-10%。
    *   **加值服務**：急件置頂費、商家認證費。
*   **支出 (Expense)**：
    *   **變動成本 (COGS)**：保護基金撥備 (1%)、金流手續費 (2-3%)、AI Token (0.5%)。
    *   **固定成本 (Opex)**：薪資、伺服器、辦公室。

### 12.3 停損機制 (Exit Strategy)
*   **關鍵指標 (KPI)**：
    *   **PMF 驗證期 (0-6 個月)**：若無法達到「月活躍任務 100 單」且「自然留存率 > 20%」，則視為需求不存在。
*   **財務停損點**：
    *   當**剩餘現金 < 3 個月營運成本** 且 **MoM (月成長率) < 5%** 時，啟動清算流程，退還用戶點數，優雅退場。

## 13. 結語（Conclusion）
Project Guild 不是跑腿換皮，而是一個具備 **交易正確性（Ledger/冪等）、流程編排（狀態機）、可靠事件（Outbox/Worker）、風控審核（Risk/Moderation）、可觀測性（SLO）、權限隔離（RBAC/ABAC）** 的公會式任務平台。
它同時展現了：產品思維、平台工程、AI 應用與營運落地能力，是一個具備高完整度與技術深度的現代化平台架構。

> **注意 / 風險（成熟度必備）**
> *   L2 到府不可能 0 風險 → 只能用「白名單 + 強制流程 + 證據保全」把風險變可控
> *   個人開發不宜自存證件資料 → 優先第三方驗證結果或 Trust Score 解鎖
> *   法幣金流法遵成本高 → **MVP 用點數托管最聰明**
