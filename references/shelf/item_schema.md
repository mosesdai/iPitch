# 货架单品 Schema

每条货品（火锅「菜」）最小字段：

| 字段 | 必填 | 说明 |
|------|------|------|
| `shelf_id` | ✓ | 如 `SH-EVT-001` |
| `name` | ✓ | 与合同/网格一致名 |
| `type` | ✓ | C-EVT / C-MED / … 见 Component Registry |
| `traits` | ✓ | 3–5 条客观特征（交付物、周期、平台） |
| `primary_C` | ✓ | 主要支撑的 10C（可多个） |
| `fit_tags` | ✓ | 适合的客户画像标签，供 R2 匹配 |
| `anti_fit` | | 不适合什么情况 |
| `scarcity` | | 高/中/低 |
| `compose_with` | | 常配货品 shelf_id |
| `customer_gets` | ✓ | 客户白话：买到后得到什么 |
| `not_in_shelf` | | 固定 `ipod` — bespoke 概念不得登记 |

**禁止登记**：pitchvision Product Card、客户专属新品类命名。
