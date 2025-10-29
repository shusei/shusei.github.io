# Anthropometry Datasets — Local Norms (JP / KR) + US Baseline

This package adds country-specific adult references for Japan (JP) and Republic of Korea (KR), plus a US baseline,
providing **shoulderHeightRatio** percentiles (p10, p25, p50, p75, p90) for use in your calculator.

## Files

- `assets/data/datasets.json` — manifest for the UI selector
- `assets/data/anthropometry/*.json` — per-dataset files (one per locale × gender)
- `assets/data/anthropometry/*sample.json` — placeholder structures for integrators (no data, keep nulls until sourced)
- `assets/data/models/manifest.json` — manifest for fashion model ratio datasets (plane/runway)
- `assets/data/models/*.json` — curated model ratio ranges consumed by the optional 模特 selector

## JSON manifests & table purposes

### `assets/data/datasets.json`

- **`datasets[]`** — entries feeding the「資料集」下拉選單。
  - `id`：對應 `select[name="dataset"]` 的值，亦用於 `loadDataset()` 快取。
  - `name`：UI 顯示名稱。
  - `file`：指向 `assets/data/anthropometry/*.json` 的實際資料檔。
- **來源**：僅列出內部清單；百分位與引用需查閱對應的 anthropometry JSON（見下節）。

### `assets/data/models/manifest.json`

- **`datasets[]`** — 供「模特資料」選單使用。
  - `id`：唯一識別碼，對應 `model-select` 的值。
  - `name`：UI 顯示名稱。
  - `description`：以 `option.title` 提供 hover 提示。
  - `file`：指向 `assets/data/models/*.json` 的詳細內容。
- **來源**：參考檔案本身的 `metadata.sources`（例如 2024 亞洲時裝週統計、2022 歐美 casting 紀錄）。

## JSON schema (per dataset)

```jsonc
{
  "name": "顯示名稱",
  "id": "jp-male-reference",      // unique ID for manifest selection
  "locale": "JP",                 // JP | KR | US
  "gender": "male",               // male | female
  "source": [ { "title": "...", "url": "...", "note": "..." } ],
  "metrics": {
    "shoulderHeightRatio": {
      "unit": "ratio",
      "p10": 0.235, "p25": 0.238, "p50": 0.241, "p75": 0.244, "p90": 0.247,
      "diagnostic": { "p05": ..., "p10": ..., "p25": ..., "p50": ..., "p75": ..., "p90": ..., "p95": ... },
      "computedFrom": {
        "height_mm": { "p5": 1597, "p50": 1696, "p95": 1795 },
        "biacromial_mm": { "p5": 374, "p50": 401, "p95": 431 },
        "assumptions": {
          "distribution": "Normal per variable via (p5,p50,p95) → (μ,σ)",
          "correlation_rho": 0.35,
          "samples": 250000,
          "method": "Monte Carlo; ratio = biacromial / height"
        }
      },
      "notes": "如何推估的簡述…"
    }
  }
}
```

> 🔎 **UI 對應**
> 你的前端需要讀 `shoulderHeightRatio` 的 `p10~p90` 來畫百分位標籤；
> 沒用的 `diagnostic` 欄位可忽略（僅供稽核）。

### Metrics in `assets/data/anthropometry/*.json`

- `shoulderHeightRatio` — 肩寬除以身高的模擬百分位（搭配 `diagnostic` 與 `computedFrom` 用於稽核／追蹤參數）。
- `thighHeightRatio`、`calfHeightRatio` — 大腿／小腿圍對身高的比例百分位。
- `whtR` — 腰高比（Waist-to-Height Ratio），含 `cut` 臨界值與 `betterDirection`。
- `whr` — 腰臀比一般向；`whrFemale`、`whrMale` 針對特定參考口徑的臨界值與百分位資訊。
- 所有度量皆以 `quantiles` 補充擬合百分位、`computedFrom` 描述採用的 P5/P50/P95 原始量測與假設。

#### Data source summary

| File | Locale | Primary data sources |
| --- | --- | --- |
| `jp-male-reference.json`, `jp-female-reference.json` | Japan (成人 20–59) | ISO/TR 7250-2:2024 國別彙整、Continental 2024 P5/P50/P95、JIS Z 8500:2019 身體尺寸（腰、臀、腿圍） |
| `kr-male-reference.json`, `kr-female-reference.json` | Republic of Korea (成人 20–59) | ISO/TR 7250-2:2024、Continental 2024 P5/P50/P95、Size Korea 第六次量測 (2015) 腰臀腿圍百分位 |
| `us-male-reference.json`, `us-female-reference.json` | United States (NHANES 成人 ≥20) | ISO/TR 7250-2:2024、Continental 2024 P5/P50/P95、NHANES 2015–2018 腰臀腿圍（Vital and Health Statistics Series 3 No.46） |

### Placeholder templates — `*sample.json`

- `neutral.sample.json`、`female.sample.json`、`male.sample.json` 提供欄位骨架：
  - 同樣包含 `shoulderHeightRatio`、`thighHeightRatio`、`calfHeightRatio`、`whtR` 以及 `whrFemale`/`whrMale`。
  - 所有百分位預設為 `null`，提醒填入實測數據後須更新來源（`source` 字串）。
- 使用前請：
  1. 補齊 `name`、`locale`、`source`。
  2. 將 `null` 改為實際百分位值。
  3. 視需要新增 `diagnostic`、`computedFrom` 以便稽核。

## Model ratio datasets — `assets/data/models/*.json`

```jsonc
{
  "id": "model-reference-asia-2024",
  "name": "2024 亞洲平面/伸展台模特比例參考",
  "description": "…",
  "metadata": {
    "year": 2024,
    "sampleSize": 58,
    "sources": ["2024 台北時裝週造型統計", "2024 亞洲精品平面拍攝匯整"]
  },
  "metrics": {
    "thighHeightRatio": {
      "plane": { "lo": 0.265, "hi": 0.305, "avg": 0.285 },
      "runway": { "lo": 0.240, "hi": 0.275, "avg": 0.257 }
    }
  }
}
```

- `metadata.year`、`metadata.sampleSize`：建立 footnote 時顯示年份與樣本量。
- `metadata.sources`：以字串陣列紀錄調查來源，UI 轉寫為 `來源：…`。
- `metrics`：每個比率提供 `plane`（平面模特）與 `runway`（伸展台）區間；欄位鍵支援 `lo`、`hi`、`avg`，額外的 `sd`、`q1`、`q3` 亦會被解析。
- `description`：會顯示於選單的 tooltip。

#### Data source summary

| File | Year / scope | Primary data sources |
| --- | --- | --- |
| `model-reference-asia-2024.json` | 2024 Asia runway & editorial | 2024 台北時裝週造型統計、2024 亞洲精品平面拍攝匯整 |
| `model-reference-global-2022.json` | 2022 Global casting & commercial | 2022 歐洲時裝週試鏡紀錄、國際商業拍攝統計 |

## Sources (cite in your site)

- **ISO/TR 7250-2:2024** — country-level anthropometric summaries (statistical scope and quality control).
  Online browsing platform: https://www.iso.org/obp/
- **Continental AG (2024) Ergonomics Requirement Specification — Anthropometric Data** — tabled **P5/P50/P95** by country
  PDF: https://cdn.continental.com/fileadmin/user_upload/demo_content/images/anthropometric_data_en_combined.pdf
- **JIS Z 8500:2019 — Human body dimensions** — Japanese adult waist/hip/leg circumferences (P5/P50/P95) for simulation.
- **Size Korea 6th Anthropometric Survey (2015)** — Korean adult circumference percentiles (20–59 yrs). https://sizekorea.kr/
- **NHANES 2015–2018 Anthropometric Reference Data (Series 3 No.46)** — US waist/hip/thigh/calf statistics. https://stacks.cdc.gov/view/cdc/104773
- **2024 台北時裝週造型統計、亞洲精品平面拍攝匯整** — 平面/伸展台模特比率樣本，用於 `model-reference-asia-2024.json`。
- **2022 歐洲時裝週試鏡紀錄、國際商業拍攝統計** — 商拍／伸展台模特比率範圍，用於 `model-reference-global-2022.json`。

> We use the Continental compiled tables for **stature** and **biacromial breadth** P5/P50/P95 to parameterize the simulation; ISO/TR 7250-2 is included as the canonical standard reference behind these national datasets.

## Method (what Codex must know)

1. Treat **stature** and **biacromial breadth** as *individually normal* with μ = P50 and σ = (P95−P5)/(z95−z05).  
   (z05 = −1.644853..., z95 = +1.644853...)
2. Assume a positive correlation ρ (male 0.35, female 0.30) between height and shoulder breadth.
3. Draw N=250k correlated normal samples; compute **ratio = biacromial / height**.
4. Report percentiles p10, p25, p50, p75, p90 (rounded to 6 decimals). Keep p05/p95 in `diagnostic` for QA.
5. Do **not** divide univariate percentiles directly (e.g., p10/p10) — this biases ratios.

## Integration checklist

- Add new entries from `assets/data/datasets.json` to your site’s manifest.  
- Ensure `calc.js` / `getPercentile()` consumes keys named exactly `shoulderHeightRatio`.
- Labels can annotate “在地常模（日本／韓國）” to avoid cross‑population confusion.

## Caveats

- These are *adult working-age* references (per ISO/TR). Children/elderly are out of scope.
- If you later obtain raw distributions or covariances, recompute to replace simulation outputs.
- Correlation ρ is conservative; you can retune with real covariances if available.
