# iPitch Server — Phase 1 Agent Runtime（已归档）

> **退役**：编排核已迁至仓库根 `engine/`（Python）。本目录仅历史对照；金标在 `archive/nio/account-v3/`。

Node.js orchestrator that splits **R1** into discrete LLM steps instead of one monolithic browser prompt.

## Architecture

```
ui/PitchStudio刀刃.html (Phase 0)          server/ (Phase 1)
     │                              │
     │  single chat completion      │  multi-step pipeline
     ▼                              ▼
DeepSeek via Worker proxy    orchestrator.js
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              load-kernel    load-protocols   parse-file-blocks
              (prompts.js)   (protocols/)     (shared w/ UI)
```

### R1 pipeline steps

| Step | Outputs | Protocol / template sources |
|------|---------|----------------------------|
| `charter` | `00_charter.md` | `references/intake_charter_template.md`, `references/round0_intake.md` |
| `timeliness` | `source_timeliness.md`, `data_traceability.md` | `references/source_timeliness_template.md`, `references/primary_required_template.md` |
| `research` | `research/*.md` (≥8000 chars) | `references/round1_discover.md`, `protocols/ipitch.md` |
| `tensions` | `03_tensions.md` | `protocols/ipitch.md` |
| `knife` | `B_knife.md` | `references/round1_discover.md` |
| `ifalsify` | `ifalsify_report.md` | `references/ifalsify_report_template.md` |
| `files` | `handoff_to_sales.md`, `quality_passport.json` | `references/handoff_to_sales_template.md` |

Steps run sequentially. Each step receives prior file outputs as context and must return `===FILE: …===` blocks (same contract as `ui/js/prompts.js`).

### Phase 1 scope (this PR)

- ✅ Step definitions + orchestrator skeleton
- ✅ KERNEL loaded from `ui/js/prompts.js`
- ✅ Protocol snippets loaded from `protocols/` + `references/`
- ✅ `parseFileBlocks` shared logic (ported from `app.js` / `prompts.js`)
- ✅ Golden test stub vs `nio/account-v3/` baseline
- ⏳ Steps `tensions` → `files` (prompt stubs only; no live LLM wiring)
- ⏳ HTTP API / job queue (Phase 2)
- ⏳ UI integration switch (Phase 2)

## Usage

```bash
cd server
npm test                    # golden baseline + parseFileBlocks
npm run pipeline:dry        # print step prompts, no API call
npm run pipeline:stub       # run charter→timeliness→research with stub LLM
```

### Live LLM (local only — no keys in repo)

```bash
export DEEPSEEK_API_KEY=sk-…          # or DEEPSEEK_PROXY_URL=https://….workers.dev
node src/cli.js --target "蔚来 NIO" --steps charter,timeliness
```

Secrets via environment only. Never commit API keys.

## Golden reference

`archive/nio/account-v3/` is the quality bar:

- Required gate files present
- `research/` total ≥ ~8000 characters (v3 ≈ 7909)
- Knife + handoff present

See `test/golden-nio-v3.test.js`.

## Related

- Browser UI: `ui/PitchStudio刀刃.html`
- Worker proxy: `worker/`
- Protocol kernel: `protocols/ipitch.md`
