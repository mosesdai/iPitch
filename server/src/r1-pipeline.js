/**
 * R1 multi-step pipeline definitions.
 * charter → timeliness → research → tensions → knife → ifalsify → files
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
  ifalsify: ["references/ifalsify_report_template.md"],
  files: [
    "references/handoff_to_sales_template.md",
    "references/quality_passport_template.md"
  ]
};

function slugFromTarget(target) {
  return (target || "case")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "case";
}

function priorFilesSummary(files, maxChars = 4000) {
  if (!files.length) return "(no prior files)";
  let out = "";
  for (const f of files) {
    const header = `\n--- ${f.name} ---\n`;
    const body = f.content.slice(0, 1200);
    const chunk = header + body + (f.content.length > 1200 ? "\n…\n" : "\n");
    if (out.length + chunk.length > maxChars) {
      out += `\n--- ${f.name} --- (${f.content.length} chars, truncated)\n`;
      break;
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
  const snippets = loadProtocolSnippets(STEP_PROTOCOLS[stepId]);
  const protocolBlock = formatSnippetsForPrompt(snippets);
  const prior = priorFilesSummary(priorFiles);
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

3–5 tensions. Main tension for knife must cite ≥3 A/B tier facts from prior research.
`,

    knife: `
# Step: knife
Produce ONLY:
- B_knife.md

Exactly ONE tension, ONE live proof (A/B preferred), ONE ask. ≤2 printed pages. Include 「明确不说」. Reference ifalsify posture (pending step) and traceability.
`,

    ifalsify: `
# Step: ifalsify
Produce ONLY:
- ifalsify_report.md

Ruthless standalone report: hypothesis, ≥5 disconfirm items, asymmetry check, KILL/PIVOT/CONDITIONAL per claim, overall recommendation.
`,

    files: `
# Step: files (assembly)
Produce ONLY:
- handoff_to_sales.md (debate questions, PRIMARY gaps, iPod vs shelf note)
- quality_passport.json (iceberg_char_count, num_a_tier_facts, num_b_tier_facts, ifalsify_verdict, main_tension, explicit_gaps)

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

/** Stub LLM responses for local dry runs (no API). */
export function stubStepResponse(stepId, input) {
  const slug = slugFromTarget(input.target);
  const target = input.target || "Example Co";

  const stubs = {
    charter: formatFileBlock(
      "00_charter.md",
      `# Charter · ${target}\n\n**用户要的是**：了解 ${target} 的合作机会\n**实际要解的是**：找到一条可验证的 10 分钟刀刃张力\n\n| slug | ${slug} |\n| mode | account |\n`
    ),
    timeliness: [
      formatFileBlock("source_timeliness.md", `# source_timeliness · ${target}\n\n| 研究完成日 | stub |\n`),
      formatFileBlock("data_traceability.md", `# data_traceability · ${target}\n\n| Claim | Value | Tier | Source |\n|---|---|---|---|\n`)
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
      .map((name) => formatFileBlock(name, `# ${name}\n\nStub research for ${target}. ` + "研".repeat(200)))
      .join("\n\n")
  };

  if (stubs[stepId]) return stubs[stepId];
  return formatFileBlock(`${stepId}_stub.md`, `# ${stepId} stub for ${target}\n`);
}

export { slugFromTarget };
