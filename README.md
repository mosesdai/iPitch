# iPitch Workbench

> **iPitch Workbench** — 可独立部署的严谨 pitch 方法论执行引擎。即使冷启动（仅公司名），也能产出有冰山厚度（≥8000字结构化）、完整溯源账本、以及独立反昏君证伪报告的交付物。内置可见质量门禁。内核可被策略同学 grill。

## 是什么

从 **公司名 + 零散未经证实的要点** 开始，走完：

1. **R1 展开** — 深度报告 + 刀刃（打到客户心里）+ 可选 **专属 iPod** 草案（内部讨论）
2. **R2 进化** — Sales lead 补现场、debate；进化报告 + **火锅首问 5 句** + **货架 2–3 套**（货架里**没有** iPod）
3. **R3 收口** — 预算档、iPod 破格叙事、双轨清单（货架客户得到什么 / iPod 客户得到什么）

## 入口

| 用途 | 路径 |
|------|------|
| **交互界面（主入口）** | `ui/ipitch-studio.html` （Workbench） |
| **体验说明 / 路演材料** | 界面右上角「使用说明」（已按最高标准重写） |
| **起手页** | `ui/start.html` → `ui/ipitch-studio.html` |
| **参考样例** | `nio/account-v3/`（v3 标杆）· `cases/nio/`（cold R1 样例） |
| **火锅货架** | `references/shelf/` |
| **Cursor 内核** | `/ipitch` · `SKILL.md` |

## 核心强制产出（R1 严肃模式）

当选择研究或刀刃时，系统强制要求：

- 结构化冰山研究（目标 ≥8000 字，含 01_IR、02_quotes、04_competitor 等）
- source_timeliness.md + data_traceability.md（账本式溯源）
- ifalsify_report.md（独立反昏君证伪报告，ruthless，默认 KILL/PIVOT/CONDITIONAL + 实验）
- 刀刃必须引用以上门禁结果 + “明确不说”清单

可见 Gate Status 在界面上显示通过情况。

## 独立 Web 界面

`ui/ipitch-studio.html` 是纯静态应用，**不依赖 Cursor**：

- 填写目标公司（名/代码/简称均可）、客户碎片、内部要求、产出选项
- 配置 **DeepSeek API Key**（存本机 localStorage）
- 点击「生成产出」或「导出 Prompt」
- 内置 **Grill** + **反昏君 / ifalsify** 协议（见 `ui/js/prompts.js`）
- 右上角 **中/EN** 切换；分析语言不受界面语言限制

### 部署给团队

1. **GitHub Pages** — Settings → Pages → 选 main 分支 / root → 访问 `https://<org>.github.io/_ipitch/ui/ipitch-studio.html`
2. **Netlify / Vercel** — 拖入仓库或连 Git，publish directory = 仓库根目录
3. **内网静态服务器** — nginx / OSS 托管整个 `_ipitch` 目录

每人用自己的 API Key。若需隐藏 Key 或绕过浏览器 CORS，部署 **Cloudflare Worker 代理**（Option B）：

```bash
cd worker && npx wrangler login && ./deploy.sh
npx wrangler secret put DEEPSEEK_API_KEY
```

部署后在 UI **API 设置**填 **Proxy URL**（或页面注入 `window.IPITCH_PROXY_URL`）。验证：`curl {proxy}/health`。详见 `worker/README.md`、`docs/CLOUD_DEPLOYMENT.md`、`docs/ASYNC_WORKFLOW.md`。

## 目录

```
_ipitch/
├── SKILL.md
├── protocols/          ipitch.md · three_round_flow.md · pitchvision.md
├── references/         round0–3 模板 · shelf/
├── ui/ipitch-studio.html         交互界面（主入口）
├── ui/js/              i18n · prompts · api · app
├── ui/start.html       重定向 → ipitch-studio.html
├── cases/              新客户案（运行时创建）
└── nio/                参考样例
```

## 与别处关系

| 位置 | 关系 |
|------|------|
| `_playbook/pitch-sop/` | 知彼 SOP 真源 |
| `mid platform/deliverables/04,07,19` | 10C · 首问 · 卡点 · 双源 |
| `product-os-v0.1/` | Component Registry · Product Card |
| `20260616pitchanyone/` | **已删除** — 内容在 `_ipitch` |
| `~/.cursor/skills/ipitch/` | Skill 镜像 |

## 演进

- `LEARNING.md` — 个案教训
- `CHANGELOG.md` — 版本
