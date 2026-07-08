# Deal Tier × Primary Intel — 名义 A，实际 C

> **组织现实**：Primary 采集 **名义负责人 = 一线销售**；**强制程度按 Deal Tier 混合**（非全组织统一 L0）。

---

## RACI

| 动作 | 销售 | 中台/战略 | AI/PitchMachine |
|------|------|-----------|-----------------|
| 填结构化输入（表单 A） | **R/A** | I | 整理、缺口提示 |
| L0：客户原话、决策链、内部 pain | **R** Tier A/B；C 可选 | C Tier A 支援 | 不生成、只留空 |
| L2 公开研究（IR、横纵） | I | I | **R** |
| tension 候选 + 验证问题 | C | C | **R** |
| 完整版 B_knife 放行 | A（补 primary 后） | C Tier A | 建议；gate 否决 |
| expert call / 渠道核查设计 | I | **R** Tier A | 提纲 |

R=负责 A=批准 C=咨询 I=知会

---

## Tier 定义（与 product-os 表单 A 对齐）

| Tier | Deal size | 典型场景 |
|------|-----------|----------|
| **A** | 500万+ | 战略名企、总部试点、多 stakeholder |
| **B** | 50–200万 / 200–500万 | 标准 enterprise；CMO/VP 级 |
| **C** | <50万 | 试探、区域、单次活动 |

---

## Tier A — Mandatory Primary

**首版产出**：仅 `B_knife_validation.md` + `PRIMARY_REQUIRED.md`（除非销售已提交 L0）

**销售必做（deadline）**

| 时点 | 动作 |
|------|------|
| T-48h（首面前） | 表单 A + MEDDIC 中 E/C/P 已知项；`03_tensions` 中选 1 条待验证 |
| T+24h（首面后） | 补：客户原话 3 条、决策链、最难接受 3 点、#1 赢/输感 |
| T+7d | 若无 secondary 会议，validation → 完整版 v2 或 case 搁置 |

**PRIMARY_REQUIRED 最小 L0 集**

- [ ] 业务 problem（客户自己的话，非媒体版）
- [ ] Economic buyer 是否在场 / 谁签字
- [ ] 决策标准（值不值、长不长、走不走心 → 具体化）
- [ ] 竞品/替代（含「不做」）
- [ ] 1 条 **仅内部可知** 的 pain 或约束（可匿名）

**中台介入触发**：销售标注「外部完全滞后」或 Tier A 且 2 次会面仍无 E/C。

---

## Tier B — Recommended Primary

**首版产出**：可出 `B_knife.md` **若** L2 行为数据支撑 tension；否则 validation。

**规则**

- 每条 tension 标注：`L0✅` / `L0待补` / `L2only⚠️`
- `L2only⚠️` 进刀刃的句子必须软化为假说语气
- 首面后 72h 内销售补表单 A → 机器出 v2

**销售必做**：表单 A（可会后补）；至少 1 条客户原话。

---

## Tier C — Validation Default

**首版产出**：默认 `B_knife_validation.md`；L2 足够且 tension 仅 T1/T2（主张 vs 公开数据）时可升完整版。

**销售必做**：成单或进入方案阶段前，表单 A 最小集（problem + 三句话 + #1 原因）。

**目的**：省带宽；不把 primary 成本压在小单上，但不允许用 L3 装懂。

---

## 升级路径 validation → 完整版

```
B_knife_validation.md
        │
        ├─ 销售提交 L0（表单 A + PRIMARY checklist ✅）
        ├─ source_timeliness 更新 L0 行
        ├─ 03_tensions 选中条目标 L0✅
        └─ primary_gate + knife_gate 重跑
                │
                ▼
        B_knife.md v2 + RUN_LOG 记录
```

---

## 与 win/loss 闭环

- 关单后 14 天内：表单 A 关单段 + win/loss 访谈（`04_winloss_interview_guide.md`）
- Stage 10 写入 `LEARNING.md`：**本 tier 下 primary 缺口的真实后果**
- 下案同 tier 同 industry：预填 `PRIMARY_REQUIRED` 常见问题
