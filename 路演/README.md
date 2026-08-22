# 路演 · Pitch Studio（约 12 分钟）

本目录 = **唯一路演包**。打开这里就能演示。

## 怎么开（二选一）

1. **推荐**：双击 `开路演.command`（自动起服务并打开浏览器）  
2. 或在仓库根目录：

```bash
cd /Users/Eliam-Code/_pitch.刀刃
python3 -m engine.serve
```

然后打开 http://127.0.0.1:8765/路演/

禁止用 Finder 双击 `.html`（`file://` 会空白）。

---

## 本目录有什么

| 文件 | 用途 |
|------|------|
| `开路演.command` | 一键启动 |
| `index.html` | 路演首页（浏览器里点进 Pitch Studio） |
| `README.md` | 本讲法 |
| `雀巢/` | 备用投屏（一页关键 / 冰山）→ 真源 `cases/nestle/html` |
| `香飘飘/` | 备用对照 → 真源 `cases/xiangpiaopiao/html` |

不要往这里另存 HTML；改 case 会自动反映。

---

## 三幕

### 0–1 · 界面

打开 Pitch Studio（已预填雀巢）：

> 这是以后 sales 自己用的屏：填客户，出会前包。

### 1–7 · 输入 → 结果

1. 点 **生成会前包**  
2. 打开 **一页关键** + **完整研报**  
3. 一句话：品质标准已经在这里  

备用：`雀巢/ONE_PAGER.html` · `雀巢/research/iceberg.html`

### 7–12 · 资源

> 今天靠个人算力。公司推广要 token / 算力，让 sales 自助跑。

### 口头占位 · Phase II / R2（不展开）

> 今天演示的是会前包（R1）。客户会后还有一轮：Sales 填现场情报 → 系统把主价值 C 映射到火锅货架组合（定制方案不上架）。下午路演不展开 R2；若被追问可打开 `cases/apple/R2_evolved_report.md` · `R2_shelf_recommendations.md`。

**RUN 注（结构完整，非主秀）**：Pitch Studio 产品面已有真实 R2 六字段表单（个人 DeepSeek API Key → 进化报告 + 货架预览）。路演主路径仍是上方 R1；R2 仅在被追问「会后呢」时一指，勿用 API 草稿冒充 Apple/雀巢终态。配置 Key：顶栏「API 设置」。
---

## 加演 · 中英切换（Apple）

1. 顶栏点 **EN**  
2. 点 **Fill: Apple (EN pack)**  
3. 点 **Generate pack**  
4. 打开 **Open one-pager (EN)** + **Open deep research (EN)**  
5. 再点 **中文** → 结果链接切回中文一页纸 / 冰山（同案双语）

真源：`cases/apple/html/*_en.html` · `research/iceberg_en.html`（IR 数字与中文包一致，不编造）。

---

## 不要说

- 已全员云端可用  
- 一键 API = 雀巢厚度（演示是产品面回放标杆）  
- 门禁 / Cursor / CLI
