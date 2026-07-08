# 火锅货架 · iPitch

**用途**：R2 从货架 compose 2–3 套推荐组合。  
**边界**：只含可复用 Component / 套餐逻辑 — **不含** 为客户 bespoke 的 iPod / pitchvision。

---

## 真源与同步

| 层 | 位置 |
|----|------|
| **iPitch 货架（本目录）** | `catalog_starter.md` + `item_schema.md` |
| **中台完整网格** | `20260417 mid platform/deliverables/` + `raw/25 Assets grid 火锅套餐.pdf` |
| **组件注册** | `20260527 biz product invent/product-os-v0.1/02_component_registry_template.md` |
| **10C / 首问** | `04_销售一页纸_首问5句_主C_示例套餐.md` |
| **买不买卡点** | `07_买不买卡点_证据卡片_销售战术式.md` |

扩充货架时：先在中台/Registry 登记事实，再同步 `catalog_starter.md` 的 `fit_tags` 与 `traits`。

---

## 匹配流程（R2）

1. 从 R2 debrief 归纳 **客户画像标签**（如：要渠道、预算收紧、CFO 质疑 ROI）
2. 勾选 **买不买卡点** → 加权 **主 C（1–2）**
3. 在 catalog 中筛 `fit_tags` ∩ `primary_C` 命中的货品
4. 组 2–3 套，每套写清 fit 理由
5. **校验**：组合中无任何 `shelf_type: ipod` 或 pitchvision 路径引用

---

## 待完善（显式 backlog）

- [ ] 与 Assets Grid PDF 全量对齐 SKU 名
- [ ] 每货品 legal / fund / margin 脚注（仅内部）
- [ ] 行业子集（汽车 / 快消 / 金融）预设权重
- [ ] 与 Product OS Component Registry 双向 ID
