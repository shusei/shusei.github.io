# ADR-002: Home Lab Strategy Evaluation (Rejected)

## Status
**Rejected** (2026-01-21)

## Context
我們評估了使用樹莓派 (Raspberry Pi) 或現有閒置電腦作為家用伺服器 (Home Lab) 的可能性，試圖解決 GitHub Pages 無法運行後端代碼的問題。

## Decision (決策理由)
我們決定 **放棄** 此方案，原因如下：
1.  **硬體成本過高**：樹莓派價格溢價嚴重，且需額外購買 SSD 與散熱設備。
2.  **現有設備不適任**：使用者現有的電競主機 (6年前高階款) 功耗過高、風扇噪音大且有過熱當機風險，不適合 24/7 運作。
3.  **維護成本**：需自行處理網路穿透 (Cloudflare Tunnel)、電力備援與硬體維護，分散了開發核心業務邏輯的注意力。

## Technical Analysis (技術評估紀錄)
*以下為當時的技術評估內容，保留作為技術展示：*

---

## 核心概念
使用樹莓派 (Raspberry Pi) 作為家用伺服器 (Home Lab)，並將其作為 GitHub Pages 前端的後端 API 伺服器。
這是一個**極具技術含金量**的方案，因為它強迫你處理雲端服務幫你解決掉的底層問題：**網路配置、硬體維護、Linux 系統管理、安全性**。

---

## 架構圖 (Architecture)

```mermaid
graph LR
    User[使用者瀏覽器] -->|HTTPS| GP[GitHub Pages (前端)]
    GP -->|API Request| CF[Cloudflare Edge]
    CF -->|Cloudflare Tunnel (安全通道)| RPI[樹莓派 (家中)]
    
    subgraph Home Network [家中內網]
        RPI -->|Docker| Nginx[Nginx Proxy Manager]
        Nginx -->|Reverse Proxy| API[你的後端 Server (Go/Python/Node)]
        API -->|Read/Write| DB[(資料庫 PostgreSQL/MySQL)]
    end
```

---

## 為什麼這能大幅提升錄取率？
這證明了你具備以下 **DevOps 與 Infrastructure** 能力：

1.  **Linux 系統管理**：你不只是會寫 code，你會管理 Linux Server (SSH, Systemd, Cron, File Permissions)。
2.  **容器化技術 (Docker)**：在樹莓派上部署服務，Docker 是必備的。你可以展示 `docker-compose.yml` 的編寫能力。
3.  **網路與資安 (Networking & Security)**：
    *   **挑戰**：家用 IP 通常是浮動的，且直接開 Port (Port Forwarding) 非常危險。
    *   **解決方案 (加分題)**：使用 **Cloudflare Tunnel (cloudflared)**。
        *   **優點**：不需要在路由器開 Port，不需要固定 IP，隱藏家中真實 IP，自帶 HTTPS 憑證。
        *   **面試亮點**：你可以解釋你是如何保護家中網路不被駭客入侵的。

---

## 實作步驟建議

### 1. 硬體準備
*   **Raspberry Pi 4 (4GB/8GB) 或 Pi 5**：建議使用 SSD 開機 (透過 USB 3.0)，因為 SD 卡長期讀寫資料庫容易損壞。
*   **散熱**：24小時開機需要被動或主動散熱。

### 2. 系統環境
*   **OS**: Ubuntu Server LTS (64-bit) 或 Raspberry Pi OS Lite (無桌面版，節省資源)。
*   **Container**: 安裝 Docker 與 Docker Compose。

### 3. 關鍵技術：Cloudflare Tunnel
這是連接 GitHub Pages 與家中樹莓派的橋樑。
1.  買一個便宜的網域 (Domain)。
2.  在樹莓派安裝 `cloudflared`。
3.  設定 Tunnel 指向你的 Local API Port (例如 `localhost:8080`)。
4.  GitHub Pages 的前端 fetch API 時，呼叫 `https://api.yourdomain.com`，請求會安全地穿透到你的樹莓派。

### 4. 推薦專案：IoT 數據中心或個人私有雲
既然用了樹莓派，可以做一些雲端做不到的事：
*   **溫濕度監控儀表板**：樹莓派接感測器 -> 寫入 InfluxDB -> 前端顯示圖表。
*   **自動化爬蟲中心**：樹莓派 24h 跑爬蟲 -> 存入 PostgreSQL -> 前端搜尋介面。

---

## 風險與注意事項 (面試時的談資)
*   **穩定性 (Availability)**：家裡停電或斷網怎麼辦？ (這是一個談論 Disaster Recovery 的好機會)。
*   **備份 (Backup)**：資料庫壞了怎麼辦？ (展示你的自動備份 Script，例如每天備份到 Google Drive)。
*   **效能 (Performance)**：樹莓派 ARM 架構的效能瓶頸在哪？ (談論 CPU/RAM 監控)。

## 結論
**絕對可行，且非常推薦。**
這條路比直接用雲端服務難走，但走完這條路，你在面試官眼中的等級會從「會寫 Code 的工程師」升級為「能解決系統問題的工程師」。
