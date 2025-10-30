# Manual Test Log – Model Dataset Selection

## 測試情境：模特資料關閉
- 操作：於首頁開啟計算機後，在「模特資料（可選）」下拉選單選擇 `Off`。
- 期望：模特平面/伸展台欄位顯示「未選擇模特資料」，備註不出現模特缺資料訊息。
- 結果：符合預期。
- 截圖：![Model dataset set to Off](browser:/invocations/tdpsshme/artifacts/artifacts/model-dataset-off.png)

## 測試情境：模特資料選定（亞洲 2024）
- 操作：在同一選單選擇 `2024 亞洲平面/伸展台模特比例參考`。
- 期望：模特欄位改為顯示實際範圍；若範圍缺失則顯示 `—` 並於備註追加「模特資料未提供此指標」。
- 結果：符合預期。
- 截圖：![Model dataset selected](browser:/invocations/tdpsshme/artifacts/artifacts/model-dataset-selected.png)
