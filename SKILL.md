---
name: ipitch
description: >-
  iPitch at Eliam-Code/_ipitch: three-round UX (company + fragments → deep
  report + knife/iPod → sales debate + hotpot shelf → budget close). Kernel
  grillable via account/pitchvision. Shelf excludes bespoke iPod. Use /ipitch
  start [company] or /ipitch [slug] round1|round2|round3.
disable-model-invocation: true
---

# iPitch

**真源**：`/Users/Eliam-Code/_ipitch/`  
**体验流**：`protocols/three_round_flow.md`  
**内核**：`protocols/ipitch.md`  
**Playbook**：`/Users/Eliam-Code/_playbook/pitch-sop/`  
**火锅货架**：`references/shelf/`（**不含 iPod**）

## 教条

1. **三轮体验、一套内核** — 外：公司名+碎片 → 研究刀/iPod → sales 补一手+货架 → 预算收口；内：冰山、L0–L4、10C、MEDDIC 可被 grill。
2. **iPod ≠ 货架** — bespoke pitchvision **永不**进火锅货架；R3 双轨写清客户各得到什么。
3. **查得越深，刀子越短** — 研究在 `research/`。
4. **名义 A、实际 C** — Primary：销售；见 `references/deal_tier_primary.md`。

---

## Trigger（用户向）

```
/ipitch start [公司名] [零散要点…]     → R0 charter，cases/{slug}/
/ipitch [slug] round1                  → R1 深度报告 + 刀 + iPod 草案 + handoff
/ipitch [slug] round2 [sales 补注]     → R2 进化报告 + 首问5句 + 货架 2–3 套
/ipitch [slug] round3 [预算档]         → R3 close_pack 双轨交付
```

打开体验入口：`index.html` 或 `ui/start.html`

---

## Trigger（内核 grill）

```
/ipitch [slug] account [tier] [external|internal] [10m|20m]
/ipitch [slug] pitchvision [A|B|both]
```

NIO 样例：

```
/ipitch nio account B external 10m
/ipitch nio pitchvision both
```

---

## 轮次 → 产出

| 轮 | 模板 | 关键文件 |
|----|------|----------|
| R0 | `references/round0_intake.md` | `00_charter.md` |
| R1 | `references/round1_discover.md` | `research/`, `B_knife`, `pitchvision/`, `handoff_to_sales.md` |
| R2 | `references/round2_compose.md` | `R2_evolved_report.md`, `R2_shelf_recommendations.md` |
| R3 | `references/round3_close.md` | `R3_close_pack.md` |

---

## 货架（R2）

- Schema：`references/shelf/item_schema.md`
- Starter：`references/shelf/catalog_starter.md`
- 首问 5 句 / 10C：`mid platform/deliverables/04_*`
- 买不买卡点：`mid platform/deliverables/07_*`

**R2 门禁**：推荐组合里不得出现 R1 bespoke iPod。

---

## 模式（内核）

| mode | 用于 | 路径 |
|------|------|------|
| account | R1 知彼刀 | `protocols/ipitch.md` · `nio/account-v3/` |
| pitchvision | R1 iPod | `protocols/pitchvision.md` · `nio/pitchvision/` |
| compose | R2 货架 | `references/round2_compose.md` |
| close | R3 收口 | `references/round3_close.md` |

---

## Gates

R1：charter · timeliness · iceberg 14/18 或 vision_gate · primary · knife  
R2：首问嵌入 · 2–3 货架组合 · iPod 分轨  
R3：预算对齐 · 双轨交付表 · 唯一 ask

---

## 同步

改本文件后复制到 `~/.cursor/skills/ipitch/SKILL.md`
