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

## 測試情境：PR 截斷提示
- 操作：重新整理頁面，輸入極端高（例如腰圍 10cm）或極端低（例如腰圍 500cm）的數值以觸發百分位截斷。
- 期望：PR 欄位分別顯示 `＜P1（資料範圍外）` 與 `＞P99（資料範圍外）`，備註維持「低於/高於資料範圍」訊息。
- 結果：符合預期。
