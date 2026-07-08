/**
 * R1 multi-step pipeline definitions.
 * charter → timeliness → research → tensions → knife → ifalsify → files
 *
 * Protocol snippets come from protocols/ + references/.
 * System KERNEL is loaded separately from ui/js/prompts.js (see load-kernel.js).
 */

import { formatSnippetsForPrompt, loadProtocolSnippets } from "../lib/load-protocols.js";
import { formatFileBlock } from "../lib/parse-file-blocks.js";

export const R1_STEP_ORDER = [
  "charter",
  "timeliness",
  "research",
  "tensions",
  "knife",
  "ifalsify",
  "files"
];

const STEP_PROTOCOLS = {
  charter: [
    "references/intake_charter_template.md",
    "references/round0_intake.md",
    "protocols/ipitch.md"
  ],
  timeliness: [
    "references/source_timeliness_template.md",
    "references/primary_required_template.md",
    "protocols/ipitch.md"
  ],
  research: [
    "references/round1_discover.md",
    "protocols/ipitch.md",
    "protocols/three_round_flow.md"
  ],
  tensions: ["protocols/ipitch.md", "references/round1_discover.md"],
  knife: ["references/round1_discover.md", "protocols/ipitch.md"],
  ifalsify: ["references/ifalsify_report_template.md", "protocols/ipitch.md"],
  files: [
    "references/handoff_to_sales_template.md",
    "references/quality_passport_template.md",
    "protocols/three_round_flow.md"
  ]
};

/** Prefer these prior files when building context for later steps. */
const PRIORITY_PRIOR = {
  tensions: ["00_charter.md", "data_traceability.md", "research/01_IR_financial.md", "research/02_executive_quotes.md", "research/04_competitor_landscape.md", "research/06_power_meddic.md"],
  knife: ["03_tensions.md", "data_traceability.md", "source_timeliness.md", "research/01_IR_financial.md", "research/02_executive_quotes.md"],
  ifalsify: ["B_knife.md", "03_tensions.md", "data_traceability.md", "research/04_competitor_landscape.md", "research/09_not_for_pitch.md"],
  files: ["00_charter.md", "B_knife.md", "03_tensions.md", "ifalsify_report.md", "data_traceability.md", "source_timeliness.md"]
};

function slugFromTarget(target) {
  return (target || "case")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "case";
}

function priorFilesSummary(files, stepId, maxChars = 6000) {
  if (!files.length) return "(no prior files)";

  const priority = PRIORITY_PRIOR[stepId] || [];
  const ordered = [
    ...priority
      .map((name) => files.find((f) => f.name === name))
      .filter(Boolean),
    ...files.filter((f) => !priority.includes(f.name))
  ];

  let out = "";
  for (const f of ordered) {
    const header = `\n--- ${f.name} ---\n`;
    const body = f.content.slice(0, 1500);
    const chunk = header + body + (f.content.length > 1500 ? "\n…\n" : "\n");
    if (out.length + chunk.length > maxChars) {
      out += `\n--- ${f.name} --- (${f.content.length} chars, truncated)\n`;
      continue;
    }
    out += chunk;
  }
  return out;
}

function buildInputBlock(input) {
  return [
    "## Target",
    input.target || "(not specified)",
    "",
    "## Customer intel",
    input.customer || "(none — cold start OK)",
    "",
    "## Internal (NBA) requirements",
    input.internal || "(none)",
    "",
    "## Slug",
    slugFromTarget(input.target)
  ].join("\n");
}

export function getStepDefinition(stepId) {
  const protocols = STEP_PROTOCOLS[stepId];
  if (!protocols) {
    throw new Error(`Unknown R1 step: ${stepId}`);
  }
  return { id: stepId, protocolPaths: protocols };
}

export function buildStepUserPrompt(stepId, input, priorFiles = []) {
  if (!STEP_PROTOCOLS[stepId]) {
    throw new Error(`Unknown R1 step: ${stepId}`);
  }
  const snippets = loadProtocolSnippets(STEP_PROTOCOLS[stepId]);
  const protocolBlock = formatSnippetsForPrompt(snippets);
  const prior = priorFilesSummary(priorFiles, stepId);
  const base = buildInputBlock(input);

  const instructions = {
    charter: `
# Step: charter
Produce ONLY:
- 00_charter.md

Use the intake charter template. Resolve target entity (name, ticker, alias). State user want vs real problem. Mark tier assumptions and the single ask direction.
`,

    timeliness: `
# Step: timeliness
Produce ONLY:
- source_timeliness.md
- data_traceability.md

Narrative vs behavior timeline; claim registry with tiers A–E. Ledger format: Claim | Value | Tier | Source.
Build on charter context. Do not fabricate L0 facts.
`,

    research: `
# Step: research (iceberg)
Produce ONLY these research files (structured iceberg, ≥8000 Chinese characters total across research/*.md):
- research/README.md
- research/01_IR_financial.md
- research/02_executive_quotes.md (≥8 attributed quotes, tiered)
- research/03_partnership_history.md
- research/04_competitor_landscape.md (steelman best competitor)
- research/05_industry_context.md
- research/06_power_meddic.md (mark every L0 gap — do not guess)
- research/09_not_for_pitch.md

Depth over brevity. Every number needs source tier; unverified → 【待核实】.
`,

    tensions: `
# Step: tensions
Produce ONLY:
- 03_tensions.md

3–5 tensions. Each: claim side + behavior/facts (IDs + tiers) + consequence + meeting one-liner.
Main tension for knife must cite ≥3 A/B tier facts from prior research.
Mark L0 gaps explicitly — do not invent.
`,

    knife: `
# Step: knife
Produce ONLY:
- B_knife.md

Exactly ONE tension, ONE live proof (A/B preferred), ONE ask. ≤2 printed pages / 10-minute spoken structure.
Must include 「明确不说」 section.
Reference ifalsify posture (pending or prior) and data_traceability — knife stays short because iceberg is deep.
`,

    ifalsify: `
# Step: ifalsify
Produce ONLY:
- ifalsify_report.md

Ruthless standalone report per template: falsifiable hypothesis, ≥5 disconfirm items (tiered), asymmetry check, KILL/PIVOT/CONDITIONAL per claim (no SURVIVES by default), overall recommendation + confidence + biggest L0 gaps.
`,

    files: `
# Step: files (assembly)
Produce ONLY:
- handoff_to_sales.md (debate questions, PRIMARY gaps, iPod vs shelf note — bespoke iPod NEVER in shelf)
- quality_passport.json (machine-readable: iceberg_char_count, num_a_tier_facts, num_b_tier_facts, ifalsify_verdict, main_tension, explicit_gaps)

Summarize gates from all prior files. JSON must be valid.
`
  };

  return [
    instructions[stepId],
    "",
    base,
    "",
    "## Prior outputs from earlier steps",
    prior,
    "",
    "## Protocol references",
    protocolBlock
  ].join("\n");
}

export function expectedOutputsForStep(stepId) {
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

function stubResearchPad(target) {
  // ~200 Chinese chars × 8 files ≈ 1600+; pad more so stub clears iceberg gate in full runs
  return "研".repeat(1100) + `\n\nStub iceberg for ${target}.`;
}

/** Stub LLM responses for local dry runs (no API). Shape matches expectedOutputsForStep. */
export function stubStepResponse(stepId, input, priorFiles = []) {
  const slug = slugFromTarget(input.target);
  const target = input.target || "Example Co";
  const pad = stubResearchPad(target);

  const stubs = {
    charter: formatFileBlock(
      "00_charter.md",
      [
        `# Charter · ${target}`,
        "",
        `**用户要的是**：了解 ${target} 的合作机会`,
        "**实际要解的是**：找到一条可验证的 10 分钟刀刃张力",
        "",
        `| slug | ${slug} |`,
        "| mode | account |",
        "| tier | B (assumption) |",
        "| ask direction | 分层方向认不认 → 试验对齐 |"
      ].join("\n")
    ),

    timeliness: [
      formatFileBlock(
        "source_timeliness.md",
        [
          `# source_timeliness · ${target}`,
          "",
          "| 研究完成日 | stub |",
          "| 叙事 vs 行为 | stub timeline — replace with A/B anchors |",
          "",
          "## L0 gaps",
          "- Owner / budget 【待核实】"
        ].join("\n")
      ),
      formatFileBlock(
        "data_traceability.md",
        [
          `# data_traceability · ${target}`,
          "",
          "| Claim | Value | Tier | Source |",
          "|---|---|---|---|",
          `| Stub claim | n/a | E | stub for ${slug} |`
        ].join("\n")
      )
    ].join("\n\n"),

    research: [
      "research/README.md",
      "research/01_IR_financial.md",
      "research/02_executive_quotes.md",
      "research/03_partnership_history.md",
      "research/04_competitor_landscape.md",
      "research/05_industry_context.md",
      "research/06_power_meddic.md",
      "research/09_not_for_pitch.md"
    ]
      .map((name) => formatFileBlock(name, `# ${name}\n\n${pad}`))
      .join("\n\n"),

    tensions: formatFileBlock(
      "03_tensions.md",
      [
        `# ${target} · 张力诊断（stub）`,
        "",
        "## T1 · 主刀张力（stub）",
        "",
        "| 侧 | 内容 |",
        "|----|------|",
        `| **主张** | ${target} 公开叙事与行为可能不一致 |`,
        "| **行为** | 引用 prior research A/B 事实（live 时填） |",
        "| **后果** | 一套方案打多线 → 品牌/预算撕裂 |",
        "| **会面一句** | 「先认不认分层，再谈试点。」 |",
        "| **L0** | owner / 预算 【待核实】 |",
        "",
        "## T2 · 次张力（stub）",
        "单点资产 vs 可复用体系。",
        "",
        "## T3 · 次张力（stub）",
        "全球叙事 vs 本土节奏。"
      ].join("\n")
    ),

    knife: formatFileBlock(
      "B_knife.md",
      [
        `# ${target} · 10 分钟刀子（stub）`,
        "",
        "## 核心结论（15 秒）",
        `不卖曝光。先对齐 ${target} 的一条可验证张力。`,
        "",
        "## 张力（1 条）",
        "> 公开主张与行为节奏可能打架——同一套方案会撕裂。",
        "",
        "**活证据**：见 data_traceability / research（live 时填 A/B）。",
        "",
        "## 唯一 ask",
        "分层方向认不认 → 30min 试验对齐。",
        "",
        "## 明确不说",
        "- 未 ✅ 的数字",
        "- 权益包 / 价格",
        "- 把 L0 装懂"
      ].join("\n")
    ),

    ifalsify: formatFileBlock(
      "ifalsify_report.md",
      [
        `# ifalsify_report · ${target}（stub）`,
        "",
        "**Hypothesis**: 主张力可在首面用一条 A/B 证据站住并换来试验对齐。",
        "",
        "## Disconfirm Hunt",
        "### F-1: 类似 pitch 失败先例",
        "- Source tier: C (stub)",
        "### F-2: 竞品 steelman",
        "- Source tier: C (stub)",
        "### F-3: 行为 vs 主张",
        "- Source tier: B (stub)",
        "### F-4: 结构障碍（预算/owner）",
        "- Source tier: L0",
        "### F-5: 时机反证",
        "- Source tier: C (stub)",
        "",
        "## Asymmetry Analysis",
        "- Support:disconfirm ≈ 1:1 (stub) → downgrade confidence",
        "",
        "## Claim Verdicts",
        "| Claim | Verdict | Experiment |",
        "|-------|---------|------------|",
        "| Main tension | CONDITIONAL | 48h 核对 A 源数字 |",
        "",
        "## Overall Recommendation",
        "- Narrow scope; do not ship thin knife externally",
        "**Confidence**: Low (stub)",
        "**Biggest L0 gaps**: owner, budget"
      ].join("\n")
    ),

    files: (() => {
      const researchChars = priorFiles
        .filter((f) => f.name.startsWith("research/") && f.name.endsWith(".md"))
        .reduce((n, f) => n + f.content.length, 0);
      const passport = {
        iceberg_char_count: researchChars,
        num_a_tier_facts: 0,
        num_b_tier_facts: 0,
        ifalsify_verdict: "CONDITIONAL",
        main_tension: `stub main tension for ${target}`,
        explicit_gaps: ["owner", "budget", "L0 MEDDIC"]
      };
      return [
        formatFileBlock(
          "handoff_to_sales.md",
          [
            `# handoff_to_sales · ${target}（stub）`,
            "",
            "| 字段 | 值 |",
            "|------|-----|",
            `| 公司 | ${target} |`,
            `| slug | ${slug} |`,
            "| tier | B |",
            "| 刀刃 | B_knife.md |",
            "| ask | 分层方向认不认 → 试验对齐 |",
            "",
            "## 销售必做",
            "- 填 PRIMARY checklist",
            "- 会上带 3 验证问",
            "- 不说未 ✅ 数字",
            "",
            "## iPod vs 货架",
            "R1 bespoke iPod（若有）**不得**进入 R2 火锅货架推荐。",
            "",
            "## Debate questions",
            "1. 主张力认不认？",
            "2. Owner 是谁？",
            "3. 试点上限？"
          ].join("\n")
        ),
        formatFileBlock("quality_passport.json", JSON.stringify(passport, null, 2))
      ].join("\n\n");
    })()
  };

  if (!stubs[stepId]) {
    throw new Error(`No stub response for step: ${stepId}`);
  }
  return stubs[stepId];
}

export { slugFromTarget, STEP_PROTOCOLS };
