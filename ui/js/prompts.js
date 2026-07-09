/**
 * iPitch Studio — Prompt builder
 * Single source of truth for KERNEL (server load-kernel.js reads this file too).
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
5. User may input in any language; **deliverable files default to 简体中文** unless internal requirements explicitly request English output.

## Output language (MANDATORY — 简体中文)
- All deliverable `.md` bodies MUST be written in **Simplified Chinese (简体中文)**.
- English allowed only for: tickers, proper nouns, direct quotes, source titles.
- Do NOT write full analysis, tensions, or knife in English unless user explicitly requested English deliverables in internal requirements.
- Style reference: \`nio/account-v3\` — tables, 读法 columns, tier tags (A/B/C), 会面一句, explicit L0 gaps.

## Sharpness & impressiveness (犀利度)
- Thin summaries are FAILURES. Iceberg = senior analyst memo, not marketing copy.
- Total \`research/*.md\` ≥8000 Chinese characters is necessary but NOT sufficient — density of A/B facts and uncomfortable truths matter.
- Per-file minimums (Chinese characters, research step):
  - \`01_IR_financial.md\` ≥1200
  - \`02_executive_quotes.md\` ≥1500 (≥10 attributed quotes with speaker+date+tier)
  - \`03_partnership_history.md\` ≥800
  - \`04_competitor_landscape.md\` ≥1200 (steelman — let competitor win first)
  - \`05_industry_context.md\` ≥800
  - \`06_power_meddic.md\` ≥800 (mark every L0 gap — do not guess)
  - \`09_not_for_pitch.md\` ≥400
- Tensions: claim vs behavior + A/B facts + **会面一句** (sharp, meeting-ready).
- Knife: ONE tension, ONE live A/B proof, ONE ask; must include 「明确不说」.
- Prefer uncomfortable truths over flattering narrative. Cold-start: cite verifiable public sources (IR, filings, earnings); if unknown, mark 【待核实】 — never fabricate L0.

## Quality gates (MANDATORY — NON-NEGOTIABLE)
When user selects research or knife (or R1/full):
- You MUST produce a complete, auditable R1 package, not a summary.
- Required gate artifacts (always):
  - source_timeliness.md (narrative vs behavior, date anchors, L0 gaps)
  - data_traceability.md (Claim | Number | Tier | Source — ledger style)
  - ifalsify_report.md (standalone, ruthless by default)
- Iceberg depth (R1):
  - Total research content MUST reach ≥ 8000 Chinese characters.
  - Structure it as real research, not marketing prose.
  - Use the exact file list below. Do not collapse into one file unless user explicitly asks for minimal.
- Knife rule: Knife must be short BECAUSE the iceberg is deep. Never paste research into the knife.
- Before emitting final knife or iPod, run internal Grill (build → red-team → synthesize) and full ifalsify.
- Output quality_passport.json (counts, gate verdicts) so the UI can display status.

If you cannot meet the 8000-char structured iceberg or the ifalsify minimum on cold start, you MUST expand research (more sources, steelman competitors, disconfirming evidence) until gates are satisfied. Do not ship thin work.

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
ifalsify_report.md is required, standalone, auditable — write body in **简体中文**.

1. **Hypothesis** (可证伪，1–2 句中文): 我们向客户兜售的确切主张是什么？
2. **Disconfirm hunt** — minimum 5 independent items (hunt real counter-evidence):
   - Failed precedents · Competitor steelman · Behavior vs stated wants
   - Structural barriers · Timing counter-evidence
   - Every hard number in knife must be traced; flag 【待核实】 aggressively
3. **Asymmetry check**: support:disconfirm > 2:1 → downgrade confidence
4. **Verdict per claim**: KILL / PIVOT / CONDITIONAL (no SURVIVES by default)
5. CONDITIONAL must name smallest 48h–2w validation experiment

iPod concepts that receive KILL are removed or replaced. Knife claims that fail must be downgraded or removed from client-facing version.
`;

  const OUTPUT_FORMAT = `
## Output format (STRICT)
Return ONLY file blocks in this exact format — no preamble, no postamble:

===FILE: filename.ext===
(content here)
===END===

Use .md for markdown. Separate each file clearly. Include ALL files requested for this step.
`;

  const R1_STEP_ORDER = [
    "charter",
    "timeliness",
    "research",
    "tensions",
    "knife",
    "ifalsify",
    "files"
  ];

  const R1_STEP_LABELS = {
    charter: "Charter / 起手",
    timeliness: "时效 + 溯源账本",
    research: "冰山研究",
    tensions: "张力诊断",
    knife: "10分钟刀刃",
    ifalsify: "反昏君证伪",
    files: "Handoff + 门禁护照"
  };

  const STEP_MAX_TOKENS = {
    research: 16000,
    default: 12000
  };

  function wantsEnglishDeliverables(data) {
    const internal = (data.internal || "").toLowerCase();
    return /english\s+output|英文交付|英文输出|deliverables?\s+in\s+english/i.test(internal);
  }

  function outputLanguageBlock(data) {
    if (wantsEnglishDeliverables(data)) {
      return "## Output language\nWrite deliverables in **English** (user requested in internal requirements).\n";
    }
    return "## Output language\nWrite ALL deliverable `.md` bodies in **简体中文**. English only for tickers, proper nouns, direct quotes.\n";
  }

  function slugFromTarget(target) {
    return (target || "case")
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "case";
  }

  function priorFilesSummary(files, stepId, maxChars = 8000) {
    if (!files.length) return "(no prior files)";
    const priority = {
      tensions: ["00_charter.md", "data_traceability.md", "research/01_IR_financial.md", "research/02_executive_quotes.md", "research/04_competitor_landscape.md", "research/06_power_meddic.md"],
      knife: ["03_tensions.md", "data_traceability.md", "source_timeliness.md", "research/01_IR_financial.md", "research/02_executive_quotes.md"],
      ifalsify: ["B_knife.md", "03_tensions.md", "data_traceability.md", "research/04_competitor_landscape.md", "research/09_not_for_pitch.md"],
      files: ["00_charter.md", "B_knife.md", "03_tensions.md", "ifalsify_report.md", "data_traceability.md", "source_timeliness.md"]
    }[stepId] || [];

    const ordered = [
      ...priority.map((n) => files.find((f) => f.name === n)).filter(Boolean),
      ...files.filter((f) => !priority.includes(f.name))
    ];

    let out = "";
    for (const f of ordered) {
      const header = `\n--- ${f.name} ---\n`;
      const body = f.content.slice(0, 2000);
      const chunk = header + body + (f.content.length > 2000 ? "\n…\n" : "\n");
      if (out.length + chunk.length > maxChars) {
        out += `\n--- ${f.name} --- (${f.content.length} chars, truncated)\n`;
        continue;
      }
      out += chunk;
    }
    return out;
  }

  function buildInputBlock(data) {
    return [
      "## Target",
      data.target || "(not specified)",
      "",
      "## Customer intel",
      data.customer || "(none — cold start OK)",
      "",
      "## Internal (NBA) requirements",
      data.internal || "(none)",
      "",
      "## Slug",
      slugFromTarget(data.target),
      "",
      outputLanguageBlock(data)
    ].join("\n");
  }

  const STEP_INSTRUCTIONS = {
    charter: `
# Step: charter
Produce ONLY:
- 00_charter.md

简体中文。用 intake charter 模板：用户要 X / 实际要 Y；解析实体（名/代码/别名）；标 tier 假设与唯一 ask 方向。
`,

    timeliness: `
# Step: timeliness
Produce ONLY:
- source_timeliness.md
- data_traceability.md

简体中文。叙事 vs 行为时间线；Claim | Value | Tier | Source 账本。基于 charter，禁止编造 L0。
`,

    research: `
# Step: research (iceberg) — THIS STEP NEEDS DEPTH
Produce ONLY (简体中文, structured analyst memo style like nio/account-v3):
- research/README.md (index + per-file 字数)
- research/01_IR_financial.md (≥1200字, tables + 读法)
- research/02_executive_quotes.md (≥1500字, ≥10 attributed quotes, tiered)
- research/03_partnership_history.md (≥800字)
- research/04_competitor_landscape.md (≥1200字, steelman competitor)
- research/05_industry_context.md (≥800字)
- research/06_power_meddic.md (≥800字, mark L0 gaps 【待核实】)
- research/09_not_for_pitch.md (≥400字)

Total research/*.md ≥8000 Chinese characters. Every number needs tier; unverified → 【待核实】.
Use verifiable public sources (IR, filings, earnings). Do NOT ship thin summaries.
`,

    tensions: `
# Step: tensions
Produce ONLY:
- 03_tensions.md

简体中文。3–5 条张力：主张 vs 行为（ID+层级）+ 后果 + **会面一句**。
主刀张力须引用 ≥3 条 A/B 级 prior research 事实。L0 标【待核实】勿猜。
`,

    knife: `
# Step: knife
Produce ONLY:
- B_knife.md

简体中文。10分钟结构：一条张力、一条活证据（A/B）、一个 ask；≤2页。
必须有「明确不说」。引用 ifalsify 姿态与溯源账本。短因为冰山深。
`,

    ifalsify: `
# Step: ifalsify
Produce ONLY:
- ifalsify_report.md

简体中文。可证伪假设、≥5 条独立反证、不对称分析、每条 KILL/PIVOT/CONDITIONAL、总体建议与置信度、最大 L0 缺口。
`,

    files: `
# Step: files (assembly)
Produce ONLY:
- handoff_to_sales.md (简体中文: debate questions, PRIMARY gaps, iPod vs shelf — bespoke iPod NEVER in shelf)
- quality_passport.json (valid JSON: iceberg_char_count, num_a_tier_facts, num_b_tier_facts, ifalsify_verdict, main_tension, explicit_gaps)

iceberg_char_count = actual sum of research/*.md character counts from prior outputs.
`
  };

  function expectedOutputsForStep(stepId) {
    const map = {
      charter: ["00_charter.md"],
      timeliness: ["source_timeliness.md", "data_traceability.md"],
      research: [
        "research/README.md",
        "research/01_IR_financial.md",
        "research/02_executive_quotes.md",
        "research/03_partnership_history.md",
        "research/04_competitor_landscape.md",
        "research/05_industry_context.md",
        "research/06_power_meddic.md",
        "research/09_not_for_pitch.md"
      ],
      tensions: ["03_tensions.md"],
      knife: ["B_knife.md"],
      ifalsify: ["ifalsify_report.md"],
      files: ["handoff_to_sales.md", "quality_passport.json"]
    };
    return map[stepId] || [];
  }

  function getR1StepsForData(data) {
    const wantsResearch = data.outputs.includes("research") || data.round === "R1" || data.round === "full";
    const wantsKnife = data.outputs.includes("knife") || data.round === "R1" || data.round === "full";
    if (!wantsResearch && !wantsKnife) return ["charter"];
    if (wantsResearch && !wantsKnife) return ["charter", "timeliness", "research"];
    return [...R1_STEP_ORDER];
  }

  function shouldUseMultiStepR1(data) {
    return (data.round === "R1" || data.round === "full") &&
      (data.outputs.includes("research") || data.outputs.includes("knife"));
  }

  function buildStepUserPrompt(stepId, data, priorFiles = []) {
    const instr = STEP_INSTRUCTIONS[stepId];
    if (!instr) throw new Error("Unknown step: " + stepId);
    return [
      instr.trim(),
      "",
      buildInputBlock(data),
      "",
      "## Prior outputs from earlier steps",
      priorFilesSummary(priorFiles, stepId),
      "",
      "## Expected files this step",
      expectedOutputsForStep(stepId).map((n) => "- " + n).join("\n")
    ].join("\n");
  }

  function buildSystemPrompt() {
    return KERNEL + GRILL_PROTOCOL + IFALSIFY_PROTOCOL + OUTPUT_FORMAT;
  }

  function buildUserPrompt(data) {
    const lines = [];
    lines.push("# iPitch generation request\n");
    lines.push(buildInputBlock(data));
    lines.push("\n## Round");
    lines.push(data.round);
    lines.push("\n## Requested deliverables");
    lines.push(data.outputs.join(", ") || "charter, research summary, knife");
    lines.push("\n## Formats");
    lines.push(data.formats.join(", ") || "markdown");

    if (shouldUseMultiStepR1(data)) {
      lines.push("\n## Mode");
      lines.push("Prefer multi-step R1 pipeline (charter → … → files) when runtime supports it.");
    }

    lines.push("\n## Round-specific instructions");

    if (data.round === "R1" || data.round === "full") {
      lines.push(`
R1 deliverables — SERIOUS / AUDITABLE package (even on cold start with only company name).
**All .md bodies in 简体中文** unless internal requirements say otherwise.

MANDATORY gate files (when research or knife requested):
- 00_charter.md · source_timeliness.md · data_traceability.md · ifalsify_report.md

Iceberg research (MANDATORY depth, ≥8000 汉字 total, per-file minimums in KERNEL):
- research/README.md · 01_IR · 02_quotes (≥10条) · 03_partnership · 04_competitor (steelman)
- 05_industry · 06_power_meddic · 09_not_for_pitch

- 03_tensions.md — 3–5 tensions, main tension backed by ≥3 A/B facts, 会面一句
- B_knife.md — ONE tension, ONE A/B proof, ONE ask, 「明确不说」
- handoff_to_sales.md · quality_passport.json
`);
    }

    if (data.round === "R2" || data.round === "full") {
      lines.push(`
R2 deliverables (简体中文正文):
- R2_evolved_report.md · R2_shelf_recommendations.md (2–3 combos, NO bespoke iPod)
`);
    }

    if (data.round === "R3" || data.round === "full") {
      lines.push(`
R3 deliverables (简体中文正文):
- R3_close_pack.md — budget, iPod exception, dual-track, single ask
`);
    }

    if (data.outputs.includes("talking")) {
      lines.push("- Include 首问 5 句 in appropriate file");
    }

    lines.push(`
## quality_passport.json (mandatory when knife or research requested)
iceberg_char_count, num_a_tier_facts, num_b_tier_facts, ifalsify_verdict, main_tension, explicit_gaps
`);

    return lines.join("\n");
  }

  function buildCursorPrompt(data) {
    const slug = slugFromTarget(data.target);
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
      grillNote: "Grill: build → red-team → synthesize before external use.",
      fullPrompt: buildUserPrompt(data),
      systemPrompt: buildSystemPrompt(),
      qualityNote: "Target: 简体中文 + iceberg ≥8000 + traceability + ifalsify + short sharp knife (nio/account-v3 bar)."
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

  function mergeFiles(existing, incoming) {
    const map = new Map(existing.map((f) => [f.name, f]));
    for (const f of incoming) map.set(f.name, f);
    return [...map.values()];
  }

  function countResearchChars(files) {
    let total = 0;
    for (const f of files) {
      if (f.name.startsWith("research/") && f.name.endsWith(".md")) {
        total += f.content.length;
      }
    }
    return total;
  }

  function maxTokensForStep(stepId) {
    return STEP_MAX_TOKENS[stepId] || STEP_MAX_TOKENS.default;
  }

  return {
    R1_STEP_ORDER,
    R1_STEP_LABELS,
    buildSystemPrompt,
    buildUserPrompt,
    buildStepUserPrompt,
    buildCursorPrompt,
    parseFileBlocks,
    mergeFiles,
    countResearchChars,
    expectedOutputsForStep,
    getR1StepsForData,
    shouldUseMultiStepR1,
    maxTokensForStep,
    wantsEnglishDeliverables
  };
})();
