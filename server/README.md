# iPitch Server — Phase 1–2 Agent Runtime

Node.js orchestrator that splits **R1** into discrete LLM steps instead of one monolithic browser prompt.

## Architecture

```
ui/ipitch-studio.html (Phase 0)          server/ (Phase 1–2)
     │                              │
     │  browser multi-step OR       │  HTTP jobs + CLI
     │  server-api.js offload       │
     ▼                              ▼
DeepSeek via Worker proxy    orchestrator.js
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              load-kernel    load-protocols   parse-file-blocks
              (prompts.js)   (protocols/)     (shared w/ UI)
```

### R1 pipeline steps (quick profile)

| Step | Outputs | Protocol / template sources |
|------|---------|----------------------------|
| `charter` | `00_charter.md` | `references/intake_charter_template.md`, `references/round0_intake.md` |
| `timeliness` | `source_timeliness.md`, `data_traceability.md` | `references/source_timeliness_template.md`, `references/primary_required_template.md` |
| `research` | `research/*.md` (≥8000 chars) | `references/round1_discover.md`, `protocols/ipitch.md` |
| `tensions` | `03_tensions.md` | `protocols/ipitch.md` |
| `knife` | `B_knife.md` | `references/round1_discover.md` |
| `ifalsify` | `ifalsify_report.md` | `references/ifalsify_report_template.md` |
| `files` | `handoff_to_sales.md`, `quality_passport.json` | `references/handoff_to_sales_template.md` |

**Marathon profile** (`--profile marathon` or UI marathon mode): adds `source_hunt`, split `pitchvision_*`, and `grill` — see `docs/PITCHVISION_MARATHON.md`.

Steps run sequentially. Each step receives prior file outputs as context and must return `===FILE: …===` blocks (same contract as `ui/js/prompts.js`).

System prompt = **KERNEL + Grill + ifalsify + OUTPUT_FORMAT** extracted from `ui/js/prompts.js` (single source of truth).

### Phase scope

- ✅ Seven-step definitions + orchestrator (`charter` → `files`)
- ✅ Marathon profile (12 steps)
- ✅ KERNEL loaded from `ui/js/prompts.js`
- ✅ Protocol snippets from `protocols/` + `references/`
- ✅ Stub responses for all steps (local / CI without API keys)
- ✅ Per-step + full-pipeline golden tests vs `nio/account-v3/`
- ✅ **HTTP API** — async jobs + sync run (`src/http.js`)
- ✅ **UI integration** — `ui/js/server-api.js` offloads multi-step R1 when Server URL is set
- ⏳ Live LLM quality vs golden (needs `DEEPSEEK_*` secrets)

## Usage

```bash
cd server
npm test                         # golden + HTTP API tests
npm run pipeline:dry             # print all step prompts, no API
npm run pipeline:stub            # full seven-step stub for NIO
npm run pipeline:marathon:stub   # marathon profile stub
npm run serve                    # HTTP API on http://127.0.0.1:3921
```

### HTTP API (Phase 2)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness + `keyViaEnv` |
| `POST` | `/v1/r1/jobs` | Create async job → `{ jobId, poll }` |
| `GET` | `/v1/r1/jobs` | List recent jobs |
| `GET` | `/v1/r1/jobs/:id` | Poll status; `result` when `done` |
| `POST` | `/v1/r1/run` | Synchronous run (blocking) |

Request body (JSON):

```json
{
  "target": "蔚来 NIO",
  "customer": "",
  "internal": "",
  "profile": "marathon",
  "marathonMode": true,
  "steps": ["charter", "timeliness", "research"],
  "stub": false
}
```

- `steps` — optional subset; UI sends the same list as browser multi-step mode
- `stub: true` — CI / local without API keys

Environment for live runs:

```bash
export DEEPSEEK_API_KEY=sk-…          # or DEEPSEEK_PROXY_URL=https://….workers.dev
export PORT=3921                       # optional
node src/http.js
```

### UI offload

1. Start server: `npm run serve`
2. In **API 设置**, set **Server URL** → `http://127.0.0.1:3921`
3. Click **测试连接** (checks `/health`)
4. **生成产出** — multi-step R1 runs on server; browser polls job status

Server holds `DEEPSEEK_*` env vars; UI does not need a browser API key when using server-only mode for R1.

### CLI

```bash
export DEEPSEEK_API_KEY=sk-…
node src/cli.js --target "蔚来 NIO" --steps charter,timeliness
node src/cli.js --target "蔚来 NIO"                    # all seven steps
node src/cli.js --stub --profile marathon --target NIO   # marathon stub
```

## Golden reference

`nio/account-v3/` is the quality bar. See `test/golden-nio-v3.test.js`.

## Related

- Browser UI: `ui/ipitch-studio.html`, `ui/js/server-api.js`
- Worker proxy: `worker/`
- Protocol kernel: `protocols/ipitch.md`
- Prompt KERNEL: `ui/js/prompts.js`
