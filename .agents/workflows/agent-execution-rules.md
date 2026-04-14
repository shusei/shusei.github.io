---
description: 避免終端機腳本卡死的防呆準則 (Anti-Hanging Rules for Git & Scripts)
---

# 🤖 Agent 終端機執行防卡死準則 (Agent Execution Rules)

在執行 CLI 指令（特別是 `git` 指令）時，請所有的後繼 AI Agent 務必遵守以下「防卡死」準則。這些準則是從慘痛的卡死經驗中總結出來的，如果不遵守，你將會被困在背景程序中。

## 1. 嚴禁呼叫任何需要 TTY (互動終端) 的編輯器
- **絕對不要使用** 無參數的 `git rebase -i` 或任何會喚起 `vim`, `nano` 的互動式指令。
- 我們的環境是 **Headless (無 Terminal TTY)** 的，只要彈出等待使用者修改存檔的介面，系統就會**永久卡死**，直到被手動 kill 為止。
- **解決方案**：
    - 若要重寫 Commit，使用帶 `--msg-filter` 參數的 `git filter-branch` 或純腳本。
    - 若要 Squash/Rebase，使用 `GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash` 繞過互動視窗。

## 2. 善用 WaitMsBeforeAsync 同步等待
- 當你使用 `run_command` 執行會花費幾秒鐘的腳本（例如 `git filter-branch` 或編譯指令）時，強烈建議把 `WaitMsBeforeAsync` 設定為 5000 甚至更長（不要寫 0）。
- 這樣能確保指令「同步」跑完並抓取完整的回傳 log，避免產生非預期的幽靈背景程序 (Zombie Processes) 干擾後續執行。

## 3. 安全寫入多行腳本
- 使用 `write_to_file` 時，如果有遇到超長字串導致不穩定或 timeout，可以使用終端機的 `cat > /tmp/filename << 'EOF'` 代替。
- 無論是哪種寫入方式，如果要用 Python/Bash 修改文字，**不要使用可能導致掛起的 stdin Pipeline 取代常規指令**。
