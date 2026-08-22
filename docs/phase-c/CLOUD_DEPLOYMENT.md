# 云端部署与「不用开机」指南

> 回答：**开发过程一定需要我的电脑开着吗？**  
> 不一定。有几种方式可以让工作在你关机后继续跑，或在云端 24/7 待命。

---

## 一句话结论（针对 iPitch）

**推荐组合：GitHub Pages（静态 UI）+ Cloudflare Worker（API 代理）**

- 部署完成后，团队用浏览器打开网址即可生成 pitch，**不需要你的笔记本一直开着**。
- API Key 放在 Worker 的云端密钥里，不暴露在浏览器。
- 若用 **Cursor Cloud Agents** 做深度 `/ipitch` 研究，任务在 Cursor 云端 VM 跑，完成后通知你。

---

## 四种「不用本机一直开着」的方式

### 1. Cursor Cloud Agents（AI 在云端帮你写）

**是什么**  
在 Cursor 里把任务交给 **Cloud Agent**：它在 Cursor 提供的云端虚拟机里 checkout 你的分支、改代码、跑命令，完成后通过 Cursor 通知你。

**适合 iPitch 什么场景**  
- 长跑 `/ipitch` 多轮研究、大批量改 `cases/`  
- 你不在电脑前时仍想让 Agent 继续干活  

**你需要做什么**  
1. 代码在 **GitHub**（或 Cursor 能访问的远程仓库）  
2. 在 Cursor 启用 **Cloud Agents**（账户/套餐需支持）  
3. 从聊天或 PR 里启动 Cloud Agent，指定分支与任务  
4. 等通知；回来 review diff、合并  

**仍可能需要本机**  
- 第一次配仓库、权限、规则  
- 合并前人工审阅敏感产出  

---

### 2. GitHub Actions / CI（推送后自动跑）

**是什么**  
代码 push 到 GitHub 后，在 GitHub 的服务器上自动执行脚本：测试、构建、部署静态站等。

**适合 iPitch 什么场景**  
- 自动把 `ui/` 部署到 GitHub Pages  
- 未来：lint、门禁校验脚本、发布 changelog  

**你需要做什么**  
1. 仓库在 GitHub  
2. 在 `.github/workflows/` 添加 workflow（例如 `pages` 部署）  
3. 在仓库 Settings → Secrets 里放部署 token（若需要）  
4. push 到 main 即触发  

**仍可能需要本机**  
- 写 workflow、第一次启用 Pages  
- 日常改 UI 仍可在本机，但 **部署不必本机执行**  

---

### 3. 常驻云服务（24/7 在线）

**是什么**  
把应用或 API 部署到一直运行的云平台，用户随时访问。

| 组件 | 推荐服务 | iPitch 用途 |
|------|----------|-------------|
| 静态 UI | **GitHub Pages**、Netlify、Vercel、Cloudflare Pages | 托管 `ui/PitchStudio刀刃.html` |
| API 代理 | **Cloudflare Worker**（见 `worker/README.md`） | 转发 DeepSeek，藏 API Key |
| 可选后端 | Railway、Fly.io | 未来 Gate Engine 服务端、案例库 API |

**你需要做什么**  

**静态站（GitHub Pages 示例）**  
1. 推送 `_pitch.刀刃` 到 GitHub  
2. Settings → Pages → Source: 选分支与目录  
3. 访问 `https://<org>.github.io/<repo>/ui/PitchStudio刀刃.html`  

**Worker 代理**  
1. `cd worker && wrangler login && wrangler deploy`  
2. `wrangler secret put DEEPSEEK_API_KEY`  
3. 在 UI「API 设置」填 **Proxy URL**，或页面注入 `window.IPITCH_PROXY_URL`  

**仍可能需要本机**  
- 首次 deploy、改 wrangler 配置  
- 轮换 API Key、改域名/CORS 策略  

---

### 4. 什么仍然需要你的电脑？

| 活动 | 是否必须本机 |
|------|----------------|
| 第一次 clone、配 Git、申请 API Key | 是（或任意一台开发机一次） |
| 日常在 Cursor 里交互式改 prompt/UI | 通常在本机/本机 Cursor |
| 团队使用已部署的 Web UI | **否** |
| Cloud Agent 长跑任务 | **否**（在 Cursor 云端） |
| CI 自动部署 | **否**（在 GitHub 云端） |
| Worker 代理 API 调用 | **否**（在 Cloudflare 边缘） |

---

## iPitch 推荐架构（Phase 0）

```
用户浏览器
    │
    ├─► GitHub Pages  ──►  ui/PitchStudio刀刃.html（静态，无密钥）
    │
    └─► Cloudflare Worker  ──►  api.deepseek.com
              ▲
              └── DEEPSEEK_API_KEY（wrangler secret）
```

**用户侧操作清单**  

1. [ ] GitHub 仓库 + Pages 开启  
2. [ ] 部署 Worker（`worker/README.md`）  
3. [ ] Worker 里配置 `DEEPSEEK_API_KEY`  
4. [ ] UI 设置 Proxy URL 或注入 `IPITCH_PROXY_URL`  
5. [ ] （可选）启用 Cursor Cloud Agents 做重型 `/ipitch` 案例维护  

完成后：**BD 同事打开链接就能用，不依赖你的笔记本是否开机。**

---

## 案例导出与持久化（当前 Phase 0）

- UI 内 **「导出案例 ZIP」** 按 `cases/{slug}/` 结构打包下载，可放进仓库或网盘。  
- 全自动云端案例库（数据库、多用户同步）属于后续 Phase，尚未实现。

---

## 相关文档

- Worker 部署：`worker/README.md`  
- 异步工作流（能睡着等结果吗）：`docs/phase-c/ASYNC_WORKFLOW.md`  
- 变更记录：`CHANGELOG.md`  
- 主 README：`README.md`
