# iPitch 协议（内核）

**真源**：`/Users/Eliam-Code/_pitch.刀刃/`  
**对外体验**：三轮对话（见 `three_round_flow.md`）  
**内部 grill**：本文件 + account / pitchvision 子协议

---

## 产品哲学

| 层 | 给谁 | 做什么 |
|----|------|--------|
| **体验层** | 销售、客户成功、非专家用户 | 公司名 + 零散要点 → 舒服地走完三轮 |
| **内核层** | 策略、研究、中台 | 冰山、L0–L4、MEDDIC、10C、火锅货架、iPod 创造 — 可被 grill |

**硬规则**

1. **iPod ≠ 货架货品** — 为客户定制的 pitchvision / iPod 概念**永不**出现在火锅货架上；货架只含可复用 Component / 套餐逻辑。
2. **查得越深，刀子越短** — 研究在 `research/`；会面层只露结论。
3. **叙事 ≠ 事实** — `source_timeliness.md` 与 `data_traceability.md` 并列。
4. **名义 A、实际 C** — Primary 负责人：销售；强制见 `references/deal_tier_primary.md`。

---

## 三轮映射（体验 → 内核）

| 轮次 | 用户动作 | 内核流水线 | 主要产出 |
|------|----------|------------|----------|
| **R0** | 输入公司名 + 零散未经证实的客户要点 | charter + timeliness + `/max` 研究 | `00_charter.md` |
| **R1** | 等待展开 | iceberg → tensions → B_knife **或** pitchvision 草案 | 深度报告、`B_knife`、≥1 iPod 概念（内部讨论用） |
| **R2** | Sales lead 补信息、debate | PRIMARY 回填 → 10C 诊断 → 货架 compose | 进化报告、首问 5 句、2–3 推荐组合（**无 iPod**） |
| **R3** | 确认预算与收口 | 预算档 + iPod 破格叙事 + 交付清单 | `close_pack`：货架所得 vs iPod 所得 |

---

## 模式（内核仍保留）

| mode | 何时用 | 产出 |
|------|--------|------|
| **account** | R1 知彼刀刃 | `research/` + `B_knife` + A/C/D |
| **pitchvision** | R1 需要造品类 / iPod | `job_map` + `product_card` + `B_vision_knife`（≥2 概念若战略案） |
| **compose** | R2 点菜 | 主 C + 货架推荐 + 买不买卡点 |
| **close** | R3 收口 | 预算、破格 iPod、双轨交付表 |

**禁止**：在 account 刀里写满 pitchvision SKU；在货架里挂 bespoke iPod；R2 之前对外承诺具体权益包 ID。

---

## account 流水线（R1 · v1.6）

```
charter → source_timeliness + traceability → research/（厚冰山，默认对标香飘飘）→
ifalsify → PRIMARY_REQUIRED + MAX_GAP_AUDIT + ONE_PAGER → tensions →
B_knife（印证伪）→ A/C/D → handoff → html/（双材料 index）
```

Gate：iceberg_gate → **sales_gate** → research_gate → knife_gate  
权威：`_play.打法/pitch-sop/12_会前双材料与销售清单标准.md`  
覆盖：`references/max_angle_coverage.md` + 会前 `ONE_PAGER`（非刀子）  
BD 可读性：`references/plain_language_glossary.md`  
UI：`ui/PitchStudio刀刃.html` 样例廊 + 导出 Prompt→Cursor（同档主路径）

样例：`cases/nestle/`（v1.6 标杆）· `cases/xiangpiaopiao/` · `cases/nio/`（刀子历史样板）

---

## pitchvision 流水线（R1 · iPod）

见 `pitchvision.md`

```
job_map → early_adopter → why_now → T5 → product_card → B_vision_knife → vision_gate
```

**货架边界**：Product Card 进 R1 内部包；**不进** `references/shelf/`。

---

## compose 流水线（R2）

```
销售 debrief（structured input）→ 买不买卡点勾选 → 主 C（1–2个）→
首问5句缺口核对 → 货架 match（见 references/shelf/）→ 2–3 推荐组合
```

引用：

- `20260417 mid platform/deliverables/04_销售一页纸_首问5句_主C_示例套餐.md`
- `07_买不买卡点_证据卡片_销售战术式.md`
- `references/shelf/catalog_starter.md`

---

## close 流水线（R3）

```
预算档（客户自述 + tier）→ iPod 破格定位（不受预算天花板束缚的叙事）→
双轨交付表：货架组合客户得到什么 / iPod 客户得到什么 → 唯一 ask + pilot
```

模板：`references/round3_close.md`

---

## Skill 同步

改 `SKILL.md` 后复制到 `~/.cursor/skills/ipitch/SKILL.md`
