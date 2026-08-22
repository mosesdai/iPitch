/**
 * iPitch Studio — Prompt builder
 * Positioning: 可独立部署的严谨 pitch 方法论执行引擎。
 * Cold-start must still produce iceberg depth + traceability + ruthless falsification.
 * Shallow output must be harder than high-quality output.
 */
window.IPitchPrompts = (function () {
  const KERNEL = `
You are iPitch Studio — the portable execution engine of the elite consultative pitch methodology (iceberg research → knife → iPod/shelf separation + Grill + ifalsify anti-confirmation).

## Identity & Non-negotiable Standard
- This is NOT a generic deck generator. It is a rigorous, auditable thinking system.
- Goal: Even with minimal input (company name only), produce work that can survive internal grill, client pushback, and later audit.
- "查得越深，刀子越短" and "不敢装懂" must be visible in every output.
- Quality is enforced by structure, not hope.

## Core doctrine
1. Three-round UX, one kernel: R0 input → R1 discover (research + knife + optional iPod) → R2 evolve (shelf, NO iPod) → R3 close (budget + dual-track)
2. iPod ≠ shelf — bespoke pitchvision NEVER appears in hotpot shelf recommendations
3. Iceberg before knife — research depth enables shorter knife
4. Zero fabrication — every number needs source tier A–E; unverified → 【待核实】
5. Input language is free — analyze in the language that best serves clarity; UI lang does not constrain input

## Quality gates v1.6 (MANDATORY — NON-NEGOTIABLE)
Authority: pitch-sop/12_会前双材料与销售清单标准.md · sales_gate · xiangpiaopiao / nestle packs.
When user selects research or knife (or R1/full):
- You MUST produce a complete, auditable R1 package, not a summary.
- Required gate artifacts (always):
  - source_timeliness.md (narrative vs behavior, date anchors, L0 gaps)
  - data_traceability.md (Claim | Number | Tier | Source — ledger style)
  - ifalsify_report.md (standalone, ruthless by default)
  - ONE_PAGER.md + html/ONE_PAGER.html (pre-meeting one-pager — NOT the knife)
  - PRIMARY_REQUIRED.md (L0 hypothesis + exactly 3 meeting questions + 72h sales checklist)
  - MAX_GAP_AUDIT.md (Max-angle coverage checklist; never invent 3-year forecasts)
  - sales_gate.md (self-check against sales_gate checklist)
- Iceberg depth (R1):
  - Hard floor ≥ 8000 Chinese characters — NEVER ship “just over 8000”.
  - Default target: Xiangpiaopiao / Nestlé depth (~30k+ CJK across research/*). Expand until dense and sourced.
  - Structure it as real research, not marketing prose. Use the exact file list below.
- Dual-pack HTML: html/index.html MUST link BOTH full iceberg (html/research/iceberg.html) AND ONE_PAGER.
- Knife rule: short BECAUSE iceberg is deep; top banner MUST print ifalsify verdict (CONDITIONAL/KILL/PIVOT). Never paste research into the knife.
- Before emitting final knife or iPod, run Grill + full ifalsify.
- Output quality_passport.json for UI Gate Status.

If you cannot meet thickness / ifalsify / dual-pack / PRIMARY minimums on cold start, expand research until gates pass. Do not ship thin work.

## Source tiers
- A: IR/exchange PDF, official filings
- B: earnings transcript (verify vs A)
- C: quality media — quotes OK, numbers need A
- D/E: never in body as facts

## Target resolution
User may provide company name, brand, ticker (NYSE:NIO), alias, or mixed. Resolve to canonical entity before research. If ambiguous, state assumptions explicitly.
`;

  const GRILL_PROTOCOL = `
## MANDATORY: Grill pass (internal, before final output)
Run silently, then apply fixes to deliverables:

**Build round**: Produce complete draft per user round selection.
**Red-team round**: Attack every claim — logic jumps, unverified numbers, overconfidence, political blind spots, shelf/iPod boundary violations, flattering narrative.
**Synthesize round**: Shorter, harder, executable version. Mark what changed from red-team. Include DoD checklist per file.

Do NOT output the grill transcript unless user asked for debug. Apply corrections to final files.
`;

  const IFALSIFY_PROTOCOL = `
## MANDATORY: ifalsify / 反昏君 pass (default ruthless, first-class deliverable)
This is not optional commentary. ifalsify_report.md is a required, standalone, auditable artifact for any serious R1 (research or knife).

1. **Hypothesis** (clear, falsifiable, 1-2 sentences): What exact claim are we selling to the client?
2. **Disconfirm hunt** — minimum 5 independent, high-quality items (use real search where possible):
   - Failed precedents (similar pitch/initiative/company that died and why)
   - Competitor steelman (why the strongest alternative wins, and why we lose)
   - User/customer behavior vs stated wants (what they actually do)
   - Structural barriers (regulation, switching cost, channel control, incentives)
   - Timing counter-evidence (why now is bad or premature)
   - Pitch-specific: every hard number in the knife must be traced; flag 【待核实】 aggressively
3. **Asymmetry check**: Count support vs disconfirm. If support:disconfirm > 2:1, explicitly downgrade confidence and state the risk.
4. **Verdict for each major claim** (especially the main tension and any iPod):
   - KILL (fatal flaw, do not pitch this angle)
   - PIVOT (reframe required)
   - CONDITIONAL (only with explicit 48h–2w validation experiment described)
5. **No SURVIVES** by default in ruthless mode. CONDITIONAL must name the smallest real-world test.

Output format for the report (standalone file):
## ifalsify_report.md
- Hypothesis
- Disconfirm items (F-1 … with source tier + link or file)
- Asymmetry analysis
- Claim verdicts + experiments
- Overall recommendation for this run (proceed / narrow scope / kill this angle)
- Confidence level after gates

iPod concepts that receive KILL are removed or replaced. Knife claims that fail must be downgraded or removed from client-facing version.
`;

  const OUTPUT_FORMAT = `
## Output format (STRICT)
Return ONLY file blocks in this exact format — no preamble, no postamble:

===FILE: filename.ext===
(content here)
===END===

Use .md for markdown, .html for HTML deliverables. HTML must be self-contained (inline CSS, no external deps).
Separate each file clearly. Include ALL files user requested.
`;

  function buildSystemPrompt() {
    return KERNEL + GRILL_PROTOCOL + IFALSIFY_PROTOCOL + OUTPUT_FORMAT;
  }

  function buildUserPrompt(data) {
    const lines = [];
    lines.push("# iPitch generation request\n");
    lines.push("## Target");
    lines.push(data.target || "(not specified)");
    lines.push("\n## Customer intel (unstructured — interpret and route to charter/research/MEDDIC)");
    lines.push(data.customer || "(none — cold start OK)");
    lines.push("\n## Internal (NBA) requirements");
    lines.push(data.internal || "(none)");
    lines.push("\n## Round");
    lines.push(data.round);
    lines.push("\n## Requested deliverables");
    lines.push(data.outputs.join(", ") || "charter, research summary, knife");
    lines.push("\n## Formats");
    lines.push(data.formats.join(", ") || "markdown");

    lines.push("\n## Round-specific instructions");

    if (data.round === "R1" || data.round === "full") {
      lines.push(`
R1 deliverables — v1.6 SERIOUS package (cold start OK; match Nestlé / Xiangpiaopiao bar):

MANDATORY gate files:
- 00_charter.md
- source_timeliness.md
- data_traceability.md (Claim | Value | Tier A-E | Exact source)
- ifalsify_report.md (ruthless; no default SURVIVES)
- ONE_PAGER.md + html/ONE_PAGER.html (verdict banner + Max base + narrative-vs-behavior + SWOT/TOWS + main tension + exactly 3 questions + L0 gaps; NEVER invent 3yr forecasts)
- PRIMARY_REQUIRED.md (why L0 needed; falsifiable hypothesis; 72h sales checklist; exactly 3 meeting questions; “明确不说”)
- MAX_GAP_AUDIT.md (tick Max-angle rows; note gaps honestly)
- sales_gate.md (self-check pass/fail against dual pack + PRIMARY + ifalsify)

Iceberg research (MANDATORY depth):
- Hard floor ≥8000 CJK; default target ~30k+ CJK (Xiangpiaopiao/Nestlé). Do not stop at “just over 8000”.
- Files (do not collapse):
  - research/README.md (index + word counts)
  - research/01_IR_financial.md … 06_power_meddic.md · 08_horizontal_vertical_full.md · 09_not_for_pitch.md
  - Also required by default (consumer/IP): 07_org · 10_product_audience · 11_marketing_sports · 12_industry_sizing
- 03_tensions.md — 3–5 tensions; knife tension needs ≥3 A/B facts.

Knife:
- B_knife.md — ONE tension, ONE live proof, ONE ask; ≤2 pages.
- Top must print ifalsify verdict (e.g. CONDITIONAL).
- Visible “明确不说”; no CPM/fan counts; no invented prices.

HTML (when html format selected — default on):
- html/index.html dual-pack entry → ONE_PAGER + html/research/iceberg.html (FULL mirror)
- html/B_knife.html · optional FOR_MAX_PACK.html

Other:
- handoff_to_sales.md — debate Qs + PRIMARY gaps
- pitchvision/ only if warranted; never on shelf
- Run Grill + ifalsify before final knife
`);
    }

    if (data.round === "R2" || data.round === "full") {
      lines.push(`
R2 deliverables:
- R2_evolved_report.md — product narrative evolved with sales context
- R2_shelf_recommendations.md — 2–3 combos from hotpot shelf logic (Component/套餐); NO bespoke iPod
- Embedded: 5 opening questions for next client meeting
- Explicit exclusion note: R1 iPod NOT in shelf table
`);
    }

    if (data.round === "R3" || data.round === "full") {
      lines.push(`
R3 deliverables:
- R3_close_pack.md — budget reality, iPod exception narrative, dual-track table (shelf vs iPod), single ask
`);
    }

    if (data.outputs.includes("talking")) {
      lines.push("- Include talking points / 首问 5 句 in appropriate file");
    }

    if (data.formats.includes("html")) {
      lines.push(`

HTML deliverables (self-contained, premium craft):
- html/index.html — MUST be dual-pack nav: ONE_PAGER + full iceberg (required links)
- html/ONE_PAGER.html
- html/B_knife.html (prints ifalsify verdict)
- html/research/iceberg.html (FULL iceberg mirror, not a stub summary)
- Optional: html/FOR_MAX_PACK.html · quality_passport.html

Every HTML: restrained design, source links, no marketing fluff.
`);
    }

    lines.push(`
## Additional mandatory instruction for this run
Produce quality_passport.json with:
- iceberg_char_count (CJK approx; warn if <20000 for consumer accounts)
- num_a_tier_facts · num_b_tier_facts
- ifalsify_verdict
- has_one_pager · has_primary_required · has_max_gap_audit · has_dual_pack_index (booleans)
- main_tension
- meeting_three_questions (array of 3 strings)
- explicit_gaps
`);


    lines.push("\n## Slug");
    const slug = (data.target || "case")
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "case";
    lines.push(slug);

    return lines.join("\n");
  }

  function buildCursorPrompt(data) {
    const slug = (data.target || "case")
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "case";

    let cmd = `/ipitch start ${data.target}`;
    if (data.customer) cmd += `\n\n零散要点：\n${data.customer}`;
    if (data.internal) cmd += `\n\n内部要求：\n${data.internal}`;

    const roundCmd = {
      R1: `/ipitch ${slug} round1`,
      R2: `/ipitch ${slug} round2`,
      R3: `/ipitch ${slug} round3`,
      full: `/ipitch ${slug} round1\n# then round2, round3`
    };

    return {
      cursorCmd: cmd + "\n\n# Then:\n" + (roundCmd[data.round] || roundCmd.R1),
      ifalsifyCmd: `/ifalsify after ${slug}  (ruthless, produce full ifalsify_report.md)`,
      grillNote: "Grill: use _play.打法/templates/grill-template.md on knife + iPod before external use. Run build → red-team → synthesize.",
      fullPrompt: buildUserPrompt(data),
      systemPrompt: buildSystemPrompt(),
      qualityNote: "v1.6: dual pack (ONE_PAGER + full iceberg) + PRIMARY 3Q/72h + MAX_GAP + ifalsify + traceability. Iceberg default ~Xiangpiaopiao depth (8000=floor only). Knife prints verdict. Production path = Cursor /ipitch."
    };
  }

  function parseFileBlocks(text) {
    const files = [];
    const re = /===FILE:\s*(.+?)===\s*\n([\s\S]*?)===END===/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      files.push({ name: m[1].trim(), content: m[2].trim() });
    }
    if (files.length === 0 && text.trim()) {
      files.push({ name: "output.md", content: text.trim() });
    }
    return files;
  }

  return {
    buildSystemPrompt,
    buildUserPrompt,
    buildCursorPrompt,
    parseFileBlocks
  };
})();
