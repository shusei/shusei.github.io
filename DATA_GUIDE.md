# Anthropometry Datasets — Local Norms (JP / KR) + US Baseline

This package adds country-specific adult references for Japan (JP) and Republic of Korea (KR), plus a US baseline,
providing **shoulderHeightRatio** percentiles (p10, p25, p50, p75, p90) for use in your calculator.

## Files

- `assets/data/datasets.json` — manifest for the UI selector
- `assets/data/anthropometry/*.json` — per-dataset files (one per locale × gender)

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

## Sources (cite in your site)

- **ISO/TR 7250-2:2024** — country-level anthropometric summaries (statistical scope and quality control).  
  Online browsing platform: https://www.iso.org/obp/
- **Continental AG (2024) Ergonomics Requirement Specification — Anthropometric Data** — tabled **P5/P50/P95** by country  
  PDF: https://cdn.continental.com/fileadmin/user_upload/demo_content/images/anthropometric_data_en_combined.pdf

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
