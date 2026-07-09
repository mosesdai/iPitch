# 异步工作流：你能「睡着等结果」吗？

> 直接回答：**部分可以，但不是魔法。**  
> 产品可以 24/7 在线；开发任务可以交给云端 Agent；但密钥、登录、重大分叉仍需要你醒着做一次决定。

---

## 你的期望（复述）

> 我分配角色、说清楚目标，然后不用盯着——你在某处继续干活，做完通知我，或只在决策分叉时找我。有质量门禁你先自检。我能出门或睡觉，醒来看到成品吗？

**诚实答案：**

| 场景 | 能否「睡着等」 | 说明 |
|------|----------------|------|
| 团队用已部署的 iPitch Web UI 生成 pitch | ✅ 是 | GitHub Pages + Worker 24/7，不依赖你的笔记本 |
| Cursor Cloud Agent 改代码、跑研究、开 PR | ✅ 大体是 | 任务在 Cursor 云端 VM，完成后通知；你醒来 review |
| GitHub Actions 自动部署 UI / Worker | ✅ 是 | push 后 CI 跑，无需本机开机 |
| **当前这个本地聊天会话** | ❌ 否 | 会话结束即停；需新开 Cloud Agent 或后台任务 |
| 第一次 `wrangler login`、存 API Key | ❌ 需你一次 | 浏览器 OAuth + 粘贴密钥，无法代劳 |
| 重大方案分叉（A/B 架构、对外发布） | ❌ 需你 | 反昏君原则：最终「可对外」要你点头 |

---

## 什么**已经**可能

### 1. Cursor Cloud Agents（开发在云端跑）

- Agent checkout 你的 GitHub 分支，在 **Cursor 云端虚拟机**里改代码、跑命令、开 PR。
- 你关笔记本、睡觉都可以；完成后 Cursor 通知你。
- 适合：长跑 `/ipitch` 研究、批量改 `cases/`、Phase 1 功能迭代。

### 2. GitHub Actions（推送后自动部署）

- `push` 到 `main` → 自动部署 `ui/` 到 GitHub Pages。
- `worker/` 变更 → 自动 `wrangler deploy`（需配好 `CLOUDFLARE_API_TOKEN`）。
- 你不在电脑前，CI 照样跑。

### 3. 常驻云服务（终端用户 24/7）

```
用户浏览器
    ├─► GitHub Pages  →  ui/ipitch-studio.html（无密钥）
    └─► Cloudflare Worker  →  api.deepseek.com
              ▲
              └── DEEPSEEK_API_KEY（云端 secret）
```

部署完 Option B 后：**BD 同事打开链接就能用**，与你的笔记本无关。

---

## 什么**不会**自动发生

1. **本地 Chat 不会无限续命** — 当前对话随会话结束；长跑请用 Cloud Agent 或 Automation。
2. **Cloudflare / DeepSeek 首次授权** — `wrangler login`、`secret put` 必须你本人操作一次（约 2 分钟）。
3. **质量与对外门禁** — Agent 可以跑 lint、解析 `quality_passport.json`、做 Gate 自检，但 **A/B 源核实、ifalsify 裁决是否可对外**，按反昏君协议仍要你拍板。
4. **决策分叉** — 例如「用方案 A 还是 B」「是否合并这条 PR」，Agent 应暂停并通知，而不是擅自定夺。

---

## 一人公司：现实工作流

```
你：给目标 + 约束 + 角色（谁审什么）
        ↓
Cloud Agent / 后台 Agent：在分支上实现 → 自检（gate、lint、/health）
        ↓
    ┌── 完成且无分叉 ──→ 通知你「PR 就绪」→ 你醒来 merge
    └── 有分叉 ──→ 通知你选项 A/B → 你决定后继续
```

**你的角色（精简）：**

- **定目标**：公司名、轮次、产出选项、是否强制门禁
- **定标准**：溯源 A/B、冰山 ≥8000 字、ifalsify 裁决
- **做决策**：架构分叉、密钥轮换、对外发布（可对外）
- **最终验收**：反昏君 — 不默认信任 AI 产出

**Agent 的角色：**

- 实现、研究、打包 ZIP、更新文档
- 自检 Gate Status、跑 `/health`、修明显 lint 错误
- 在分叉点停下来问你

---

## iPitch Option B 之后具体能做什么

| 能力 | 状态 |
|------|------|
| 静态 UI 团队访问 | GitHub Pages（workflow 已备） |
| 浏览器绕过 CORS + 隐藏 Key | Cloudflare Worker（`worker/`） |
| 流式生成 + Gate 显示 | `ui/js/app.js` Phase 0 |
| 案例 ZIP 导出 | `cases/{slug}/` 结构 |
| 云端长跑开发 | Cursor Cloud Agents（需仓库 + 套餐） |
| 全自动云端案例库 / 多用户 | 未实现（后续 Phase） |

**你睡觉时可以做的：** 让 Cloud Agent 在分支上推进 Phase 1（例如服务端 Gate、案例同步），并约定「无分叉则直接开 PR」。  
**Pitchvision 马拉松：** 见 `docs/PITCHVISION_MARATHON.md` — UI 导出 `cursor_runbook.md` 或勾选马拉松模式（搜索 + 分步 iPod + Grill 签核）。

**你醒来应检查的：** PR diff、Gate 是否通过、ifalsify 是否 KILL/PIVOT、Proxy `/health` 是否 `keyConfigured: true`。

---

## 一次性配置清单（「睡着等结果」最低集）

1. [ ] 代码推到 **GitHub** `main`
2. [ ] **GitHub Pages** 启用（或 merge `deploy-pages.yml` 后首次 push）
3. [ ] **Cloudflare Worker** 部署 + `DEEPSEEK_API_KEY` secret
4. [ ] UI **Proxy URL** 或 `window.IPITCH_PROXY_URL` 指向 Worker
5. [ ] （可选）GitHub Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` → Worker CI
6. [ ] （可选）**Cursor Cloud Agents** 开启，默认从 `main` 拉分支干活

完成后：

- **用产品**：随时，无需你开机
- **改产品**：开 Cloud Agent 任务 → 去睡觉 → 醒来收 PR

---

## 鼓励但不过度承诺

- ✅ 你**可以**把「实现 + 自检」交给云端，自己只保留决策与对外门禁。
- ✅ Option B 让 iPitch **作为工具**已经能 24/7 服务团队。
- ⚠️ 没有「一个永不结束的本地 Agent」——会话有边界，长跑请换 Cloud Agent。
- ⚠️ 密钥与登录**必须**你做一次；之后可数月不动。
- ⚠️ 「醒来即完美成品」取决于任务清晰度；模糊目标 → 更多分叉 → 更多需要你醒着答的问题。

**建议习惯：** 睡前写清 Charter（目标公司、轮次、门禁、禁止事项），醒来 10 分钟做反昏君验收，比整夜盯着屏幕更高效。

---

## 相关文档

- Worker 部署：`worker/README.md`
- 云端架构：`docs/CLOUD_DEPLOYMENT.md`
- 变更记录：`CHANGELOG.md`
