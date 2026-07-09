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

## Depth, insight & disruptive creativity (深刻 · 启发 · 颠覆性商业创意)

**「犀利」≠ 哗众取宠。** 不是震惊体、不是空洞金句、不是未经验证的「颠覆」口号。
品质标准是 **真深刻 + 真创意 + 真启发** — 读者感到「原来如此」的结构性洞察；尤其是 **disruptive 商业创意（iPod / pitchvision）** 能让人看见**新品类**，而非换皮 slogan。

### Account 线（知彼 · 刀刃）
- 冰山：从事实中提炼 **非显而易见的因果与矛盾**（主张 vs 行为），不是百科罗列。
- 张力：每条是 **可讨论的结构性洞察**；会面一句 = 让同行低调点头、愿意往下聊，**不是** headline 或挑衅。
- 刀刃：短因为冰山深；一条张力、一条活证据、一个 ask。「明确不说」= 专业克制，不是没见识。

### Pitchvision 线（iPod · 颠覆性商业创意）— 用户勾选 iPod 时必跑
- 定义 **旧品类的结构性失败**（T5），再给出 **新品类对立面** — 超越「赞助/曝光包」式采购思维。
- 每概念一套（简体中文）：\`job_map\`（struggling moment，非 feature 清单）、\`early_adopter\`、\`why_now\`（三力）、\`03_tension_T5.md\`、\`product_card\`、\`B_vision_knife.md\`（≤2页，**不是** account 刀复述）。
- 创意须 **可试点、可叫停、可证伪**；禁止 L4 编造市场规模；多概念时 **job 必须不同**（非换皮）。
- 标杆：\`nio/pitchvision/A_spirit-layer-os\`、\`B_family-gravity-engine\` — 品类级洞察 + 可执行 Product Card。

### 严禁（品质红灯）
- 哗众取宠、震惊体、标题党、未经 A/B 支撑的大胆断言
- 「颠覆」「重塑」「范式转移」等词 **无品类定义 + 旧品类失败机制** 支撑时
- account 刀与 pitchvision 混写；bespoke iPod 进货架
- 薄摘要冒充研究；marketing fluff 冒充 insight

### 研究厚度（必要但不充分）
- Total \`research/*.md\` ≥8000 Chinese characters is necessary but NOT sufficient — need **insight density** (非显而易见结论), not word padding.
- Per-file minimums (充实论证，非凑字数):
  - \`01_IR_financial.md\` ≥1200
  - \`02_executive_quotes.md\` ≥1500 (≥10 attributed quotes with speaker+date+tier)
  - \`03_partnership_history.md\` ≥800
  - \`04_competitor_landscape.md\` ≥1200 (steelman — let competitor win first)
  - \`05_industry_context.md\` ≥800
  - \`06_power_meddic.md\` ≥800 (mark every L0 gap — do not guess)
  - \`09_not_for_pitch.md\` ≥400
- Cold-start: cite verifiable public sources; if unknown, mark 【待核实】 — never fabricate L0.

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
**Red-team round**: Attack every claim — logic jumps, unverified numbers, overconfidence, **哗众取宠/震惊体/空洞颠覆口号**, shelf/iPod boundary violations, flattering narrative, **pitchvision 与 account 混写**, **无 struggling moment 的 feature 清单式 iPod**.
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
6. **iPod 证伪**：对 disruptive 创意用 **品类能否成立** 检验，不是用「够不够炸」检验。KILL 须有结构性理由；创意被 KILL 须替换或收窄，不得留空洞口号。

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
    "pitchvision",
    "ifalsify",
    "files"
  ];

  /** Marathon: source_hunt + split pitchvision + explicit grill (see docs/PITCHVISION_MARATHON.md) */
  const MARATHON_STEP_ORDER = [
    "charter",
    "timeliness",
    "source_hunt",
    "research",
    "tensions",
    "knife",
    "pitchvision_t5",
    "pitchvision_job",
    "pitchvision_card",
    "grill",
    "ifalsify",
    "files"
  ];

  const R1_STEP_LABELS = {
    charter: "Charter / 起手",
    timeliness: "时效 + 溯源账本",
    source_hunt: "源猎取 · 搜索",
    research: "冰山研究",
    tensions: "张力诊断",
    knife: "10分钟刀刃",
    pitchvision: "iPod 颠覆性创意",
    pitchvision_t5: "iPod · T5 品类张力",
    pitchvision_job: "iPod · JTBD / why_now",
    pitchvision_card: "iPod · Product Card + vision 刀",
    grill: "Grill · 人工可审",
    ifalsify: "反昏君证伪",
    files: "Handoff + 门禁护照"
  };

  const STEP_MAX_TOKENS = {
    research: 16000,
    pitchvision: 14000,
    pitchvision_t5: 10000,
    pitchvision_job: 12000,
    pitchvision_card: 14000,
    source_hunt: 10000,
    grill: 12000,
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
      source_hunt: ["00_charter.md", "source_timeliness.md", "data_traceability.md"],
      research: ["research/00_source_hunt.md", "data_traceability.md", "00_charter.md"],
      tensions: ["00_charter.md", "data_traceability.md", "research/00_source_hunt.md", "research/01_IR_financial.md", "research/02_executive_quotes.md", "research/04_competitor_landscape.md", "research/06_power_meddic.md"],
      knife: ["03_tensions.md", "data_traceability.md", "source_timeliness.md", "research/01_IR_financial.md", "research/02_executive_quotes.md"],
      pitchvision: ["03_tensions.md", "research/05_industry_context.md", "research/04_competitor_landscape.md", "B_knife.md"],
      pitchvision_t5: ["03_tensions.md", "research/05_industry_context.md", "research/04_competitor_landscape.md"],
      pitchvision_job: ["pitchvision/concept-a/03_tension_T5.md", "03_tensions.md", "research/06_power_meddic.md"],
      pitchvision_card: ["pitchvision/concept-a/job_map.md", "pitchvision/concept-a/03_tension_T5.md", "pitchvision/concept-a/product_card.md"],
      grill: ["B_knife.md", "03_tensions.md", "pitchvision/README.md", "pitchvision/concept-a/B_vision_knife.md", "pitchvision/concept-a/product_card.md"],
      ifalsify: ["grill_report.md", "B_knife.md", "03_tensions.md", "data_traceability.md", "research/04_competitor_landscape.md", "research/09_not_for_pitch.md"],
      files: ["00_charter.md", "B_knife.md", "03_tensions.md", "grill_report.md", "ifalsify_report.md", "data_traceability.md", "source_timeliness.md"]
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

    source_hunt: `
# Step: source_hunt (WEB SEARCH — 源猎取)
Produce ONLY:
- research/00_source_hunt.md

简体中文。按 references/source_hunt_template.md：
- ≥12 条搜索查询计划（IR、交付、业绩会、竞品、行业、失败先例…）
- 命中源注册表（ID、URL、Tier、用于哪份 research）
- 若下方有 Live search results，**优先引用**并标注 Tier；搜不到标【待核实】
- 给 research 步的明确指令（哪些源进 01_IR / 02_quotes / 04_competitor）

Cursor/Agent：**必须联网搜索**。浏览器：使用注入的 Tavily 结果。
`,

    research: `
# Step: research (iceberg) — THIS STEP NEEDS DEPTH
Produce ONLY (简体中文, structured analyst memo style like nio/account-v3):
- research/README.md (index + per-file 字数；引用 00_source_hunt 的源 ID)
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

简体中文。3–5 条张力：主张 vs 行为（ID+层级）+ **结构性后果** + **会面一句**（深刻、可讨论，**禁止哗众取宠/震惊体**）。
主刀张力须引用 ≥3 条 A/B 级 prior research 事实。L0 标【待核实】勿猜。
`,

    knife: `
# Step: knife
Produce ONLY:
- B_knife.md

简体中文。10分钟结构：一条张力、一条活证据（A/B）、一个 ask；≤2页。
洞察来自冰山提炼，**不是**口号堆砌。必须有「明确不说」。短因为冰山深。
`,

    pitchvision: `
# Step: pitchvision (iPod · disruptive business creativity)
Produce ONLY (简体中文, 深刻·启发·可试点 — 对标 nio/pitchvision/):

Minimum **one** concept folder under pitchvision/{concept-slug}/:
- pitchvision/README.md (本步概念索引；何时用 account 刀 vs iPod)
- pitchvision/{concept-slug}/job_map.md (struggling moment + 妥协曲线，**非** feature 清单)
- pitchvision/{concept-slug}/early_adopter.md (可识别·可接触·有预算)
- pitchvision/{concept-slug}/why_now.md (三力：技术/行为/监管或品类)
- pitchvision/{concept-slug}/03_tension_T5.md (**旧品类结构性失败** → 新品类对立面)
- pitchvision/{concept-slug}/product_card.md (Portfolio Role + Stage + 组件 + 试点/叫停)
- pitchvision/{concept-slug}/B_vision_knife.md (≤2页 vision 刀，**不得**复述 account B_knife)

**禁止**：哗众取宠、空洞「颠覆」、无 T5 的 slogan、L4 编造市场规模、与 account 刀混写。
战略案可 ≥2 概念，但 **job 必须不同**（非换皮）。
`,

    pitchvision_t5: `
# Step: pitchvision_t5 (iPod · 品类张力 T5 only)
Produce ONLY (简体中文):
- pitchvision/README.md (概念索引；account 刀 vs iPod 分工)
- pitchvision/concept-a/03_tension_T5.md

**旧品类结构性失败** → **新品类对立面**。深刻、可证伪，禁止哗众取宠。对标 nio/pitchvision/*/03_tension_T5.md。
`,

    pitchvision_job: `
# Step: pitchvision_job (iPod · JTBD)
Produce ONLY (简体中文):
- pitchvision/concept-a/job_map.md (struggling moment + 妥协曲线，非 feature 清单)
- pitchvision/concept-a/early_adopter.md
- pitchvision/concept-a/why_now.md (三力)

必须有可识别的 early adopter 与真实 struggling moment。
`,

    pitchvision_card: `
# Step: pitchvision_card (iPod · Product Card + vision 刀)
Produce ONLY (简体中文):
- pitchvision/concept-a/product_card.md (Portfolio Role + Stage + 组件 + 试点/叫停)
- pitchvision/concept-a/B_vision_knife.md (≤2页，**不得**复述 account B_knife)

可试点、可叫停、可证伪。禁止 L4 市场规模编造。
`,

    grill: `
# Step: grill (EXPLICIT — 供人工签核)
Produce ONLY:
- grill_report.md

简体中文。按 references/grill_report_template.md：build 摘要 → red-team 攻击清单（≥5 条，含 iPod/account 边界）→ synthesize DoD → **人工签核表（留空待填）**。
输出可审计报告，不要静默跳过。
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
      source_hunt: ["research/00_source_hunt.md"],
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
      pitchvision: [
        "pitchvision/README.md",
        "pitchvision/concept-a/job_map.md",
        "pitchvision/concept-a/early_adopter.md",
        "pitchvision/concept-a/why_now.md",
        "pitchvision/concept-a/03_tension_T5.md",
        "pitchvision/concept-a/product_card.md",
        "pitchvision/concept-a/B_vision_knife.md"
      ],
      pitchvision_t5: ["pitchvision/README.md", "pitchvision/concept-a/03_tension_T5.md"],
      pitchvision_job: [
        "pitchvision/concept-a/job_map.md",
        "pitchvision/concept-a/early_adopter.md",
        "pitchvision/concept-a/why_now.md"
      ],
      pitchvision_card: [
        "pitchvision/concept-a/product_card.md",
        "pitchvision/concept-a/B_vision_knife.md"
      ],
      grill: ["grill_report.md"],
      ifalsify: ["ifalsify_report.md"],
      files: ["handoff_to_sales.md", "quality_passport.json"]
    };
    return map[stepId] || [];
  }

  function getR1StepsForData(data) {
    const wantsResearch = data.outputs.includes("research") || data.round === "R1" || data.round === "full";
    const wantsKnife = data.outputs.includes("knife") || data.round === "R1" || data.round === "full";
    const wantsIpod = data.outputs.includes("ipod");

    const steps = ["charter"];
    if (wantsResearch || wantsKnife || wantsIpod) {
      steps.push("timeliness", "research", "tensions");
    }
    if (wantsKnife) steps.push("knife");
    if (wantsIpod) steps.push("pitchvision");
    if (wantsResearch || wantsKnife || wantsIpod) {
      steps.push("ifalsify", "files");
    }
    return steps;
  }

  function getMarathonStepsForData(data) {
    const wantsResearch = data.outputs.includes("research") || data.round === "R1" || data.round === "full";
    const wantsKnife = data.outputs.includes("knife") || data.round === "R1" || data.round === "full";
    const wantsIpod = data.outputs.includes("ipod");

    const steps = ["charter"];
    if (wantsResearch || wantsKnife || wantsIpod) {
      steps.push("timeliness", "source_hunt", "research", "tensions");
    }
    if (wantsKnife) steps.push("knife");
    if (wantsIpod) {
      steps.push("pitchvision_t5", "pitchvision_job", "pitchvision_card");
    }
    if (wantsKnife || wantsIpod) steps.push("grill");
    if (wantsResearch || wantsKnife || wantsIpod) {
      steps.push("ifalsify", "files");
    }
    return steps;
  }

  function getStepsForData(data) {
    return data.marathonMode ? getMarathonStepsForData(data) : getR1StepsForData(data);
  }

  function shouldUseMultiStepR1(data) {
    return (data.round === "R1" || data.round === "full") &&
      (data.outputs.includes("research") || data.outputs.includes("knife") || data.outputs.includes("ipod"));
  }

  function buildStepUserPrompt(stepId, data, priorFiles = [], extras = {}) {
    const instr = STEP_INSTRUCTIONS[stepId];
    if (!instr) throw new Error("Unknown step: " + stepId);
    const parts = [
      instr.trim(),
      "",
      buildInputBlock(data),
      ""
    ];
    if (extras.searchBlock) {
      parts.push("## Live search results (Tavily)", extras.searchBlock, "");
    }
    parts.push(
      "## Prior outputs from earlier steps",
      priorFilesSummary(priorFiles, stepId),
      "",
      "## Expected files this step",
      expectedOutputsForStep(stepId).map((n) => "- " + n).join("\n")
    );
    return parts.join("\n");
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

- 03_tensions.md — 结构性洞察（非哗众取宠），主张力 ≥3 A/B 事实
- B_knife.md — ONE tension, ONE A/B proof, ONE ask, 「明确不说」
${data.outputs.includes("ipod") ? `
Pitchvision / iPod（颠覆性商业创意，深刻·启发·可证伪）:
- pitchvision/README.md + 每概念 job_map · early_adopter · why_now · 03_tension_T5 · product_card · B_vision_knife
- 标杆 nio/pitchvision；禁止空洞颠覆口号与 account 刀混写
` : ""}
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

  function buildCursorRunbook(data) {
    const slug = slugFromTarget(data.target);
    const steps = getMarathonStepsForData(data);
    const lines = [
      "# iPitch Marathon Runbook · " + (data.target || slug),
      "",
      "> 交给 **Cursor Cloud Agent** 或本机 Agent，**开启联网搜索**。详见 docs/PITCHVISION_MARATHON.md",
      "",
      "## Charter",
      "```",
      "/ipitch start " + (data.target || "") + (data.customer ? "\n\n零散要点：\n" + data.customer : "") + (data.internal ? "\n\n内部要求：\n" + data.internal : ""),
      "```",
      "",
      "## 分步命令（推荐一夜长跑）",
      ""
    ];

    const cursorCmd = {
      charter: `/ipitch ${slug} round0  # 或完成 00_charter.md`,
      timeliness: `/ipitch ${slug} step timeliness`,
      source_hunt: `/ipitch ${slug} source-hunt  # 必须联网搜索 → research/00_source_hunt.md`,
      research: `/ipitch ${slug} round1-research  # 冰山 ≥8000 字`,
      tensions: `/ipitch ${slug} step tensions`,
      knife: `/ipitch ${slug} account B external 10m`,
      pitchvision: `/ipitch ${slug} pitchvision both`,
      pitchvision_t5: `/ipitch ${slug} pitchvision T5  # 03_tension_T5 + README`,
      pitchvision_job: `/ipitch ${slug} pitchvision job  # job_map · early_adopter · why_now`,
      pitchvision_card: `/ipitch ${slug} pitchvision card  # product_card · B_vision_knife`,
      grill: `/ipitch ${slug} grill  # → grill_report.md，人工签核`,
      ifalsify: `/ifalsify after ${slug}`,
      files: `/ipitch ${slug} handoff`
    };

    steps.forEach((stepId, i) => {
      const label = R1_STEP_LABELS[stepId] || stepId;
      const expected = expectedOutputsForStep(stepId);
      lines.push("### " + (i + 1) + ". " + label + " (`" + stepId + "`)");
      lines.push("```");
      lines.push(cursorCmd[stepId] || ("# step: " + stepId));
      lines.push("```");
      lines.push("期望文件：" + (expected.length ? expected.join(", ") : "(见协议)"));
      lines.push("");
    });

    lines.push("## 人工 Grill 签核");
    lines.push("- 打开 `grill_report.md`，策略/研究/创新各一人签核");
    lines.push("- 打回则只重跑标注步骤");
    lines.push("");
    lines.push("## 品质标杆");
    lines.push("- account: `nio/account-v3/`");
    lines.push("- pitchvision: `nio/pitchvision/A_spirit-layer-os/` · `B_family-gravity-engine/`");
    lines.push("- vision_gate: `protocols/pitchvision.md`（12 项 ≥10 过）");

    return lines.join("\n");
  }

  function buildGrillHandoff(data, files) {
    const slug = slugFromTarget(data.target);
    const grill = files.find((f) => f.name === "grill_report.md");
    return [
      "# 人工 Grill 签核指引 · " + slug,
      "",
      "1. 打开 `grill_report.md`" + (grill ? "（已生成）" : "（马拉松模式自动生成；或运行 /ipitch " + slug + " grill）"),
      "2. 策略 / 研究 / 创新（iPod）各填签核表",
      "3. 全部「通过」或「修改后通过」→ 才可对内预演",
      "4. 打回 → 注明重跑步骤：source_hunt / research / pitchvision_* / …",
      "",
      "## Cursor 命令",
      "```",
      "/ipitch " + slug + " grill",
      "```",
      "",
      "模板：`references/grill_report_template.md`"
    ].join("\n");
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

    const marathon = data.outputs.includes("ipod") || data.marathonMode;

    return {
      cursorCmd: cmd + "\n\n# Then:\n" + (roundCmd[data.round] || roundCmd.R1),
      marathonCmd: marathon ? `/ipitch ${slug} source-hunt\n/ipitch ${slug} pitchvision both\n/ipitch ${slug} grill` : "",
      ifalsifyCmd: `/ifalsify after ${slug}  (ruthless, produce full ifalsify_report.md)`,
      grillCmd: `/ipitch ${slug} grill  → grill_report.md + 人工签核`,
      grillNote: "Grill: 马拉松模式产出可审计 grill_report.md；人工签核见 references/grill_report_template.md",
      runbook: buildCursorRunbook(data),
      grillHandoff: buildGrillHandoff(data, []),
      fullPrompt: buildUserPrompt(data),
      systemPrompt: buildSystemPrompt(),
      qualityNote: "Marathon: 搜索(source_hunt) + 分步 pitchvision + 人工 grill。标杆 nio/account-v3 + nio/pitchvision。"
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
    MARATHON_STEP_ORDER,
    R1_STEP_LABELS,
    buildSystemPrompt,
    buildUserPrompt,
    buildStepUserPrompt,
    buildCursorPrompt,
    buildCursorRunbook,
    buildGrillHandoff,
    parseFileBlocks,
    mergeFiles,
    countResearchChars,
    expectedOutputsForStep,
    getR1StepsForData,
    getMarathonStepsForData,
    getStepsForData,
    shouldUseMultiStepR1,
    maxTokensForStep,
    wantsEnglishDeliverables
  };
})();
