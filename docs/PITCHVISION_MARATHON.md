# Pitchvision 马拉松 · 搜索 + Grill 机制

> 把「更长的 Cursor `/ipitch pitchvision` 长跑」和「搜索 + 人工 Grill」做成**可执行机制**，不是口头建议。

---

## 两条路径

| 路径 | 何时用 | 搜索 | Grill | pitchvision |
|------|--------|------|-------|-------------|
| **UI 快速** | 有 API，时间紧 | 可选 Tavily（Proxy） | 静默（KERNEL） | 单步 |
| **UI 马拉松** | 勾选「马拉松模式」 | `source_hunt` 步 + Tavily | 独立 `grill` 步 → `grill_report.md` | 拆 3 步 |
| **Cursor 导出** | 无 API / 要 v3 品质 | Runbook 强制联网 | Runbook 含人工签核表 | `/ipitch pitchvision both` |
| **Server CLI** | CI / 本地长跑 | `--profile marathon` | 含 grill 步 | 含 pitchvision |

---

## UI 马拉松模式

1. 勾选 **马拉松模式**（`ui/ipitch-studio.html`）
2. 选 R1 + 研究 + 刀刃 +（建议）iPod
3. Proxy 配置 `TAVILY_API_KEY` 后，`/health` 返回 `searchConfigured: true`
4. 生成顺序：

```
charter → timeliness → source_hunt → research → tensions
→ knife → [pitchvision_t5 → pitchvision_job → pitchvision_card] → grill → ifalsify → files
```

5. 完成后：**导出 Grill 签核表**、**导出案例 ZIP** → 人工填 `grill_report.md` 签核栏

---

## Cursor 长跑（推荐 overnight）

点击 **导出马拉松 Runbook**，得到 `cursor_runbook.md`：

```text
/ipitch start {公司}
/ipitch {slug} source-hunt     # 必须联网搜索
/ipitch {slug} round1          # 或按 runbook 分步
/ipitch {slug} pitchvision both
/ipitch {slug} grill
/ifalsify after {slug}
```

交给 **Cursor Cloud Agent**（见 `docs/ASYNC_WORKFLOW.md`）：

- Charter 写清：目标公司、要 iPod、门禁、禁止哗众取宠
- 要求：每步对照 `nio/account-v3` + `nio/pitchvision`
- 醒来检查：`grill_report.md` 签核 + `quality_passport.json`

---

## Tavily 搜索（可选）

```bash
cd worker
npx wrangler secret put TAVILY_API_KEY
```

验证：

```bash
curl -s "$PROXY/health" | jq .searchConfigured
curl -s -X POST "$PROXY/v1/search" \
  -H 'Content-Type: application/json' \
  -d '{"query":"NIO 2026 Q1 delivery","max_results":5}'
```

---

## 人工 Grill 工作流

1. 打开 `grill_report.md`（马拉松模式自动生成）
2. 策略 / 研究 / 创新（iPod）各一人填 **签核表**
3. 打回 → 在 UI 或 Cursor 只重跑标注步骤
4. 全部「修改后通过」→ 才标记 case **可对内预演**（非自动「可对外」）

---

## Server

```bash
cd server
export DEEPSEEK_PROXY_URL=https://your-worker.workers.dev
node src/cli.js --target "蔚来 NIO" --profile marathon --stub   # 测步骤契约
node src/cli.js --target "蔚来 NIO" --profile marathon          # live
```

---

## 相关文件

- `references/source_hunt_template.md`
- `references/grill_report_template.md`
- `protocols/pitchvision.md`（vision_gate 12 项）
- `ui/js/prompts.js` → `buildCursorRunbook()`
