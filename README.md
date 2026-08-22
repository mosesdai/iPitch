# iPitch Workbench

> **iPitch Workbench** — 可独立部署的严谨 pitch 方法论执行引擎。即使冷启动（仅公司名），也能产出有冰山厚度、完整溯源账本、以及独立反昏君证伪报告的交付物。内置可见质量门禁。

## 是什么

从 **公司名 + 零散未经证实的要点** 开始，走完：

1. **R1 展开** — 深度报告 + 刀刃 + 可选 **专属 iPod** 草案（内部讨论）
2. **R2 进化** — Sales lead 补现场、debate；进化报告 + **火锅首问 5 句** + **货架 2–3 套**（货架里**没有** iPod）
3. **R3 收口** — 预算档、iPod 破格叙事、双轨清单

## 自建编排核（工程纲领）

> **大任务**：本机证明（有界面 + 高于旧样例的品质）→ 说服 → 公司云铺全员 sales。  
> 纲领：[`docs/ENGINEERING_PROGRAM.md`](docs/ENGINEERING_PROGRAM.md) · 路演包：[`路演/README.md`](路演/README.md)  
> **本机启动**：`python3 -m engine.serve` → [路演入口](路演/index.html) · [工作台](ui/PitchStudio刀刃.html)

## 入口

| 用途 | 路径 |
|------|------|
| **路演包（给同事看）** | [`路演/`](路演/) — README 剧本 + 雀巢/香飘飘/NIO/Apple 成品链 |
| **交互界面** | `ui/PitchStudio刀刃.html`（根 `index.html` 跳到这里） |
| **橱窗真源** | `cases/`（nestle · xiangpiaopiao · nio · apple） |
| **本机引擎** | `engine/` |
| **火锅货架** | `references/shelf/` |
| **Cursor 内核** | `/ipitch` · `SKILL.md` |

## 目录（期 L）

```
_pitch.刀刃/
├── 路演/                 同事路演入口（符号链接 → cases/*/html）
├── ui/                   工作台（样例廊 + 本机门禁）
├── engine/               本机编排 + 护照门禁
├── cases/                橱窗真源（会前包）
├── protocols/            ipitch · three_round_flow · pitchvision · newsletter
├── references/           round0–3 模板 · shelf/ · newsletter/
├── docs/                 ENGINEERING_PROGRAM · LOCAL_DEMO_PLAYBOOK
│   └── phase-c/          公司云备忘（冻结，说服后再做）
├── worker/               可选 DeepSeek 代理（期 C 再部署）
├── newsletter/           周报旁路产出
├── archive/              已退役：旧 nio 金标 · Node server · mason 讲解稿
├── SKILL.md
└── runs/                 本机跑护照（gitignore，可删可再生）
```

## 核心强制产出（R1 · v1.6）

权威：`_play.打法/pitch-sop/12_会前双材料与销售清单标准.md` · `sales_gate`

- **会前双材料**：完整冰山研报 HTML + `ONE_PAGER`
- **PRIMARY_REQUIRED**：会面三问 + 首面后 72h checklist
- **MAX_GAP_AUDIT** + ifalsify + 溯源账本
- 冰山：≥8000 硬下限；**默认对标香飘飘/雀巢厚度**
- 刀刃须印证伪结论（CONDITIONAL / KILL / PIVOT）+「明确不说」

## 部署（可选 / 期 C）

GitHub Pages、Worker 代理、CI 等见 [`docs/phase-c/`](docs/phase-c/)。期 L 不依赖它们。

## 与别处关系

| 位置 | 关系 |
|------|------|
| `_play.打法/pitch-sop/` | 知彼 SOP 真源 |
| `archive/nio/` | 旧 v3 金标（已并入 `cases/nio/`） |
| `~/.cursor/skills/ipitch/` | Skill 镜像 |

## 演进

- `LEARNING.md` — 个案教训
- `CHANGELOG.md` — 版本
- `archive/README.md` — 退役清单
