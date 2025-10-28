# 美麗人生 · 2025 單頁筆記

https://shusei.github.io
「美麗人生」是一個隱私優先的靜態網站，提供 2025 年研究節錄與比例提示工具。整體以中性語氣編寫，預設開啟低調模式，適合部署於 GitHub Pages。

## 特色

- **單頁應用**：所有內容於 `index.html`，搭配原生 View Transitions、CSS Container Queries、CSS Nesting 與 content-visibility。
- **低調模式**：自動替換敏感字詞，提供按鈕與 Shift+Esc 快捷鍵，可記憶使用者偏好。
- **比例與風險提示工具**：本地計算 BMI、WHtR、WHR 等指標，支援本地資料集百分位標籤與建議卡片。
- **隱私保護**：不含追蹤碼、不使用 Cookie、不與第三方分享資料。

## 目錄結構

```
.
├── index.html
├── 404.html
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── motion.css
│   ├── data/
│   │   ├── datasets.json
│   │   └── anthropometry/
│   │       ├── neutral.sample.json
│   │       ├── female.sample.json
│   │       └── male.sample.json
│   ├── img/
│   │   └── favicon.svg
│   └── js/
│       ├── app.js
│       ├── calc.js
│       ├── datasets.js
│       ├── dom.js
│       └── i18n.js
├── scripts/
│   └── check-static.js
├── .nojekyll
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

## 安裝與開發

1. 需要 Node.js 18 以上版本。
2. 安裝依賴（僅用於測試腳本，可選）：
   ```bash
   npm install
   ```
3. 啟動本地開發時，建議直接使用靜態伺服器，例如：
   ```bash
   npx http-server .
   ```
4. 打開 `http://localhost:8080/index.html` 即可檢視成品。

## 測試

專案提供基本語法與結構檢查：

```bash
npm test          # 同時執行所有測試
npm run test:syntax  # 使用 node --check 驗證 JS 語法
npm run test:markup  # 執行 scripts/check-static.js
```

## 資料集政策

- 所有範例資料僅為空白結構，位於 `assets/data/anthropometry/`。
- `datasets.json` 用來列出可選資料集；如需新增，請填入 `id`、`name` 與對應檔案路徑。
- **請勿填入未經授權或未註明來源的資料。** 若需使用真實統計資料，請：
  1. 補齊 `source` 欄位並附上公開引用。
  2. 在百分位欄位填入數字（以小數表示比例），無數據處維持 `null`。
  3. 更新 README 與站內段落以標註資料來源日期。

## 部署

1. 將整個資料夾推送至 GitHub repo 的 `main` 或 `gh-pages` 分支。
2. 於 GitHub Pages 設定頁面中選擇對應分支與根目錄。
3. 部署後，網站將自動以靜態方式服務，無需伺服器端程式。

## 可及性與最佳化

- 提供 Skip Link、語意化結構與 aria-live 更新。
- 尊重 `prefers-reduced-motion`，減少動畫干擾。
- Navbar 與按鈕具備清晰 focus 樣式。
- 加入 Content Security Policy 與 `rel="noopener noreferrer"`，避免隱私洩漏。

## 授權

本專案以 [MIT License](LICENSE) 授權，歡迎自由使用與延伸。若另有問題，請開 Issue 討論。
