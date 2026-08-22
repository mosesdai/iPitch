---
name: ipitch-research
description: R1 冰山研究。产出 research/ 结构化文件；事实带 tier 与可回验 URL；L0 缺口显式标注。
---

# ipitch-research · 冰山研究

产物（Stage 0 最少集）：

| 文件 | 内容 |
|------|------|
| `research/README.md` | 索引 |
| `research/01_IR_financial.md` | 财务 / IR 锚点（数字优先 Tier A） |
| `research/09_not_for_pitch.md` | 查了但不用 |

深度：有信息量的正文合计过门禁（阈值见 `engine/thresholds.yaml`）。Stage 1 起默认对标厚冰山，禁止刚过线交差。

## 纪律

- URL 必须是真实抓取过的最终地址；编造比留空更严重。
- 每条进正文的事实写成可回验对：`来源：URL` + `摘录：原文`（见 `reference/citation-format.md`）。后端会 HTTP 回抓核对。
- 数字优先静态件（PDF / 交易所原文）；**当前 Stage 1 引擎不解析 PDF**，能用 HTML 原文页先用 HTML。
- 派生比例写出算式。
- L0 不猜；查不到进缺口清单。
- 用信封返回，不要自己写盘。
