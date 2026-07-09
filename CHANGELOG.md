# CHANGELOG · iPitch

## 2026-07-09 · 机制：搜索 + 人工 Grill + Pitchvision 马拉松

### 源猎取（source_hunt）
- 新步骤 `research/00_source_hunt.md` + 模板 `references/source_hunt_template.md`
- Worker 可选 `POST /v1/search`（`TAVILY_API_KEY`）；UI 马拉松模式在 source_hunt 步注入结果
- `/health` 返回 `searchConfigured`

### 人工 Grill
- 新步骤 `grill` → 可审计 `grill_report.md` + 模板 `references/grill_report_template.md`
- UI：马拉松模式自动跑 grill 步；「导出 Grill 签核指引」按钮

### Cursor / CLI 长跑
- 导出包新增 `cursor_runbook.md`、`grill_command.txt`、`cursor_marathon_commands.txt`
- UI **马拉松模式**：source_hunt → 分步 pitchvision（T5 / job / card）→ grill
- Server：`--profile marathon`（12 步）；文档 `docs/PITCHVISION_MARATHON.md`

## 2026-07-09 · 犀利度定义修正：深刻·启发·颠覆性创意（非哗众取宠）

- KERNEL 明确：**犀利 ≠ 哗众取宠**；品质 = 结构性洞察 + disruptive 商业创意（iPod/pitchvision）
- 增加 pitchvision 专步（勾选 iPod 时）；对标 `nio/pitchvision`（T5 旧品类失败 → 新品类）
- Grill/ifalsify 增加反震惊体、反空洞颠覆口号、iPod 品类证伪规则

## 2026-07-09 · 输出品质：简体中文 + 多步 R1 + 犀利度门禁

### 根因修复（用户反馈：英文输出、内容薄、不够犀利）
- **语言**：`ui/js/prompts.js` KERNEL 强制 R1 交付物默认**简体中文**（对标 `nio/account-v3`）；仅内部要求显式「英文交付」时例外
- **厚度**：UI「生成产出」对 R1 研究/刀刃改为**七步多步编排**（每步独立 API 调用），避免单次 16k token 装不下 ≥8000 字冰山
- **犀利度**：KERNEL 增加单文件最低字数、steelman、会面一句、读法列、L0【待核实】等硬约束
- Gate Status 用实际 `research/*.md` 字数校验，未达标显示「品质未达标」
- `server/` 步骤 prompt 与 KERNEL 同步简体中文 + 单文件最低字数
- API `temperature` 略降至 0.35；research 步 `max_tokens` 16000

## 2026-07-08 · Phase 1 — 完整七步 R1 编排

### server/ 多步 R1（charter → files）
- 补全 `tensions` / `knife` / `ifalsify` / `files` 的 stub 产出与期望文件契约
- 编排器：`strict` 模式、passport JSON 校验、步骤进度含 missing 列表
- 后步 prompt 优先注入关键 prior 文件（刀刃看张力，ifalsify 看刀，files 看门禁）
- Golden：每步独立 stub 测试 + 全七步累积；对照 `nio/account-v3/` + KERNEL 门禁产物
- CLI 默认 stub/dry 跑全流水线；仍复用 `ui/js/prompts.js` KERNEL 与 `protocols/` 片段
- 范围外（Phase 2）：HTTP API、任务队列、UI 切换 live 编排

## 2026-07-09 · UI 品牌：iPitch 工作台 / iPitch Workbench

- 用户可见显示名：**iPitch 工作台**（中文）/ **iPitch Workbench**（英文）
- 浏览器 `<title>`：`iPitch Workbench · 咨询 Pitch 执行引擎`（i18n 切换英文副标题）
- 副标题精炼为「严谨 Pitch 方法论执行引擎」
- 案例 ZIP 导出内部标识 `ipitch-workbench`（文件名 + `_workbench.json`）
- 未改动 repo 名、Worker 名、protocols 路径

## 2026-07-09 · Phase 1 — Agent Runtime 骨架

### server/ 多步 R1 编排器
- 新增 `server/`：Node ≥18，零 npm 依赖（`node:test`）
- `src/r1-pipeline.js`：七步流水线 `charter → timeliness → research → tensions → knife → ifalsify → files`
- `src/orchestrator.js`：顺序执行、累积 `===FILE===` 块、步骤级 warning
- `lib/load-kernel.js`：从 `ui/js/prompts.js` 提取 KERNEL / Grill / ifalsify（不重复维护）
- `lib/load-protocols.js`：从 `protocols/` + `references/` 注入步骤 prompt
- `lib/parse-file-blocks.js`：与浏览器 UI 同契约的解析器
- `src/cli.js`：`--dry-run`、`--stub`、`--steps`；live 模式读 `DEEPSEEK_API_KEY` 或 `DEEPSEEK_PROXY_URL`（仅环境变量）
- `test/golden-nio-v3.test.js`：对照 `nio/account-v3/` 文件存在性与冰山字数基线
- Phase 1 范围：前 3 步 stub 可跑；`tensions`→`files` 为 prompt 定义，待 Phase 2 接 API / 任务队列

## 2026-07-09 · Phase 0 — 代理、门禁、案例导出、流式

### Option B 部署加固
- Worker：`ALLOWED_ORIGINS` CORS 配置、路径白名单、512KB 体限制、`/health` 含 `keyConfigured`
- `worker/deploy.sh`、`worker/.env.example`、health 验证说明
- `ui/js/api.js`：`checkProxyHealth()`；测试连接先检 `/health`
- GitHub Actions：`deploy-pages.yml`、`deploy-worker.yml`（需 `CLOUDFLARE_*` secrets）
- 新增 `docs/ASYNC_WORKFLOW.md`（异步工作流诚实说明）

### Cloudflare Worker API 代理
- 新增 `worker/`：`src/index.js`、`wrangler.toml`、`README.md`
- `ui/js/api.js` 支持 `proxyUrl` 设置与 `window.IPITCH_PROXY_URL` 注入
- 设置页新增 Proxy URL 字段；代理模式下本机可不存 API Key

### Gate Engine v0
- `ui/js/app.js` 解析生成物中的 `quality_passport.json`
- 显示：冰山字数、A/B 溯源计数、ifalsify 裁决；冰山 <8000 字警告
- 无 passport 时保留文件名推断回退

### Case persistence v0
- 「导出案例 ZIP」按 `cases/{slug}/` 结构打包（JSZip CDN）
- slug 来自目标公司输入

### Streaming
- API 生成时实时显示流式输出，完成后解析文件块并刷新 Gate Status

### 文档
- 新增 `docs/CLOUD_DEPLOYMENT.md`（中文）：Cursor Cloud Agents、GitHub Actions、常驻云服务、本机仍须事项、iPitch 推荐架构

## 2026-06-17 · iPitch Workbench + 最高标准品质门禁

- 定位升级为 **iPitch Workbench**：可独立部署的严谨 pitch 方法论执行引擎
- Prompt 层强制：R1 必须产出结构化冰山（≥8000 字）、data_traceability 账本、**独立 ifalsify_report.md**（ruthless）
- Quality Gates 成为 NON-NEGOTIABLE；冷启动也必须满足深度和证伪要求
- UI 增加 Gate Status 可见性 + 强制机制（后续迭代）
- i18n、README、帮助内容全面按 tentpole（NotebookLM、RaiseDeck、Linear craft）重写
- 参考：`references/ifalsify_report_template.md`、`quality_passport_template.md`

## 2026-06-10 · 更名为 iPitch

- 品牌 **`PitchIt`** → **`iPitch`**（受 iPod 启发）
- 文件夹 **`_pitchit`** → **`_ipitch`**
- 触发词 **`/pitchit`** → **`/ipitch`**；协议 `pitchit.md` → `ipitch.md`
- Cursor skill → `~/.cursor/skills/ipitch/`

## 2026-06-10 · 产品化三轮流

- **删除** `20260616pitchanyone/`（内容已在 `_ipitch`）
- 新增 **三轮体验**：R0 输入 → R1 报告+刀+iPod → R2 sales debrief+货架（**不含 iPod**）→ R3 预算收口+双轨交付
- 新增 `protocols/three_round_flow.md`、`references/round0–3`、`references/shelf/`
- 新增 `ui/start.html` 起手界面
- Skill 触发：`/ipitch start` · `round1|2|3`

## 2026-06-11

- 文件夹 **`20260616pitchanyone`** 更名为 **`_ipitch`**
- 触发词 **`/pitchanyone`** → **`/ipitch`**；Cursor skill → `~/.cursor/skills/ipitch/`

## 2026-06-10

- 创建 `/Users/Eliam-Code/20260616pitchanyone/`（现 `_ipitch/`）
- NIO account-v3 + pitchvision A/B 迁入
- Cursor skill：`~/.cursor/skills/pitchanyone/SKILL.md`（现 `ipitch`）
