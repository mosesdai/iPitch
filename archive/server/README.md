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

Steps run sequentially. Each step receives prior file outputs as context (priority files first for later steps) and must return `===FILE: …===` blocks (same contract as `ui/js/prompts.js`).

System prompt = **KERNEL + Grill + ifalsify + OUTPUT_FORMAT** extracted from `ui/js/prompts.js` (single source of truth — not copied into `server/`).

### Phase 1 scope

- ✅ Seven-step definitions + orchestrator (`charter` → `files`)
- ✅ KERNEL loaded from `ui/js/prompts.js`
- ✅ Protocol snippets loaded from `protocols/` + `references/`
- ✅ `parseFileBlocks` shared contract with UI
- ✅ Stub responses for **all** steps (local / CI without API keys)
- ✅ Per-step + full-pipeline golden tests vs `nio/account-v3/` baseline
- ✅ Strict mode: missing expected files / invalid passport JSON → fail
- ⏳ HTTP API / job queue (Phase 2)
- ⏳ UI integration switch (Phase 2)
- ⏳ Live LLM quality vs golden (needs `DEEPSEEK_*` secrets)

## Usage

```bash
cd server
npm test                    # per-step + full stub golden suite
npm run pipeline:dry        # print all step prompts (KERNEL + protocols), no API
npm run pipeline:stub       # run full seven-step stub for NIO
```

### Live LLM (local only — no keys in repo)

```bash
export DEEPSEEK_API_KEY=sk-…          # or DEEPSEEK_PROXY_URL=https://….workers.dev
node src/cli.js --target "蔚来 NIO" --steps charter,timeliness
node src/cli.js --target "蔚来 NIO"   # all seven steps
```

Secrets via environment only. Never commit API keys.

## Golden reference

`archive/nio/account-v3/` is the quality bar:

- Required gate files present (`00_charter`, timeliness, traceability, tensions, knife, handoff, research/*)
- Pipeline stub also emits `ifalsify_report.md` + `quality_passport.json` (product KERNEL gates; older golden dir may lack these files on disk)
- `research/` total ≥ ~8000 characters (v3 ≈ 7909; stub pads to clear the gate)
- Knife + handoff present

See `test/golden-nio-v3.test.js` — one test per step, plus full seven-step accumulation.

## Related

- Browser UI: `ui/PitchStudio刀刃.html`
- Worker proxy: `worker/`
- Protocol kernel: `protocols/ipitch.md`
- Prompt KERNEL: `ui/js/prompts.js`
