# 交付宪法 · 会前包 / 游说主案

> 真源契约。新会话与 `_tools` 构建器、样例廊、路演文案均须对齐本文件。  
> 游说主案：比亚迪 / 吉利国际 / 赞意广告 · 更新 2026-08-28  
> **作业流**：用户只报公司名 → Agent **默认一路交到** §5 可转发单文件 + Desktop 离机副本，**禁止**中途请示「要不要 HTML/跳出盒子/审美」。细节见 `_SHOWCASE_NOTE.md`。

---

## 0. 对外称谓（硬门禁）

| 禁止对外说 | 对外统一 | 内部可保留路径/文件名 |
|------------|----------|------------------------|
| iPod / PitchVision（创意轨） | **disruptive - 跳出盒子** | `pitchvision/` |
| Max 缺口 / Max 审计 / MAX GAP（缺口轨） | **BD经验缺口** | `MAX_GAP_AUDIT.md` |
| 「给 Max 包」作主 CTA（游说主案） | **合订包** / **全案入口** | `FOR_MAX_PACK.html` 文件名可暂留 |

构建出口须跑 `cases/_tools/public_rename.py`（或等价），禁止把禁词写进可转发 HTML 可见文案。

方法论里「新品类创意 ≠ 货架 SKU」仍成立；对外只说 **跳出盒子 vs 货架**，不说 iPod。

---

## 1. 三件产品（每案各一份）

| # | 产品 | 读者场景 | 文件 | 品质锚 |
|---|------|----------|------|--------|
| 1 | **最厚调研** | 会前自学 / 内部备战 | `research/*` → deliver 冰山 | ≥ 香飘飘量级；可溯源；含 `09_not_for_pitch` |
| 2 | **中间层** | 深谈 30–60min | `A_dossier` + `ONE_PAGER` | 判断层，不是冰山压缩垃圾 |
| 3 | **刀刃** | 10 分钟开门 | `B_knife` | 1 张力 · 1 证据 · 1 认不认；顶栏印 ifalsify |

## 2. 强制第四轨（创意，非货架）

| 轨 | 是什么 | 文件 | 纪律 |
|----|--------|------|------|
| **disruptive - 跳出盒子** | 客户还没想到要买的**新品类**合作 | `pitchvision/*/vision_card.md` | ≥2 概念；旧→新；Job 可验收；**禁止哗众取宠**；与货架 **分轨** |

## 3. 强制销售闸口件

| 件 | 对外名 | 文件 |
|----|--------|------|
| 证伪 | ifalsify | `ifalsify_report.md` |
| 三问+72h | PRIMARY | `PRIMARY_REQUIRED.md` |
| 缺口审计 | **BD经验缺口** | `MAX_GAP_AUDIT.md` |
| 溯源 | 数据溯源 | `data_traceability.md` |

证伪未过 / L0 未关 → 对外只可标 **CONDITIONAL**，禁止宣称「会前终态已完成」。

---

## 4. 阅读顺序（给游说对象）

```
ONE_PAGER（5 min）
  → B_knife（10 min）
  → disruptive - 跳出盒子 主创意（7 min）
  → 追问：A_dossier → 冰山（研N - 标题）
```

## 5. HTML / 离机转发（产品面）

| 形态 | 要求 |
|------|------|
| `deliver/index.html` | 本机 `engine.serve` 下可点开全套 |
| **可转发单文件** | 自包含；inline CSS；系统 CJK 字体；**无 CDN**；无本机绝对路径资源 |
| 冰山导航标签 | **`研N - {研究标题}`**（禁止只写「研 01」） |
| 桌面副本 | 需要离机分享时，复制 `_export/` 或 Desktop 命名清晰的单文件 |

构建：`python3 cases/_tools/build_portable_showcase.py` · `python3 cases/_tools/build_deliver_pack.py all`

## 6. PDF

文案确认后再出。规则见各案 `deliver/PDF_RULES.md`（A4、关页眉页脚、`print-color-adjust:exact`）。

---

## 7. 本批游说主案状态

| 案 | 冰山 | 中层 | 刀 | 跳出盒子 | deliver | 可转发单文件 |
|----|------|------|----|----------|---------|--------------|
| byd | ✅ | ✅ | ✅ | ✅ 全球信任协议 / 五分钟技术联赛 | ✅ | ✅ |
| geely-international | ✅ | ✅ | ✅ | ✅ World+ Twin / Trust Passport | ✅ | ✅ |
| 赞意广告 | ✅ | ✅ | ✅ | ✅ 体育胜率闸门 / 品牌主体育路由台 | ✅ | ✅ |

入口：

- 廊内：`cases/byd/deliver/index.html` · `cases/geely-international/deliver/index.html` · `cases/赞意广告/deliver/index.html`
- 离机：`cases/_export/` · Desktop `*_全案入口_可转发_离机可读.html`（含赞意）

## 8. 算力诚实

- 游说金标可用高级模型打厚；**产品复现路径** = 个人 API（DeepSeek 等）+ 本机引擎门禁 + 本契约。
- 禁止把「一键 API 草稿」说成雀巢 / 比亚迪终态。
- 期 L 不做公司云；期 C 等说服后再开。

## 9. 产品机复现（无高级模型）

| 命令 / UI | 作用 |
|-----------|------|
| `python3 -m engine.run --lobby-floor` | 游说金标结构 + 对外称谓地板 |
| `python3 -m engine.run --portable` | 重建可转发单文件 → `deliver/` + `_export/` |
| Pitch Studio · 重建可转发 | POST `/api/cases/portable` |
| Pitch Studio · 跑游说地板门禁 | POST `/api/cases/lobby-floor` |
| 分阶段 DeepSeek 草稿 | UI「分阶段 DeepSeek 草稿」；**每页 API DRAFT**，≠ 金标 |

诚实规则：API 草稿永远不得在路演里冒充比亚迪/吉利/雀巢终态。
