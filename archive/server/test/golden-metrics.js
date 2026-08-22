/**
 * Golden reference metrics from nio/account-v3 — baseline for pipeline quality gates.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expectedOutputsForStep, R1_STEP_ORDER } from "../src/r1-pipeline.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const GOLDEN_DIR = path.resolve(__dirname, "../../nio/account-v3");

export const REQUIRED_ROOT_FILES = [
  "00_charter.md",
  "source_timeliness.md",
  "data_traceability.md",
  "03_tensions.md",
  "B_knife.md",
  "handoff_to_sales.md"
];

/** Gate artifacts required by product KERNEL (may be absent in older golden dirs). */
export const GATE_ARTIFACTS = ["ifalsify_report.md", "quality_passport.json"];

export const REQUIRED_RESEARCH_FILES = [
  "research/README.md",
  "research/01_IR_financial.md",
  "research/02_executive_quotes.md",
  "research/03_partnership_history.md",
  "research/04_competitor_landscape.md",
  "research/05_industry_context.md",
  "research/06_power_meddic.md",
  "research/09_not_for_pitch.md"
];

/** Minimum iceberg depth — v3 is ~7909 chars; gate is 8000 in product. */
export const MIN_ICEBERG_CHARS = 8000;

/** Full R1 package expected from a complete pipeline run (stub or live). */
export const FULL_PIPELINE_FILES = [
  ...REQUIRED_ROOT_FILES,
  ...REQUIRED_RESEARCH_FILES,
  ...GATE_ARTIFACTS
];

export function countResearchChars(dir = GOLDEN_DIR) {
  const researchDir = path.join(dir, "research");
  if (!fs.existsSync(researchDir)) return 0;
  let total = 0;
  for (const name of fs.readdirSync(researchDir)) {
    if (!name.endsWith(".md")) continue;
    total += fs.readFileSync(path.join(researchDir, name), "utf8").length;
  }
  return total;
}

export function collectGoldenMetrics(dir = GOLDEN_DIR) {
  const present = [];
  const missing = [];

  for (const rel of [...REQUIRED_ROOT_FILES, ...REQUIRED_RESEARCH_FILES]) {
    const full = path.join(dir, rel);
    if (fs.existsSync(full)) present.push(rel);
    else missing.push(rel);
  }

  const gatePresent = [];
  const gateMissing = [];
  for (const rel of GATE_ARTIFACTS) {
    const full = path.join(dir, rel);
    if (fs.existsSync(full)) gatePresent.push(rel);
    else gateMissing.push(rel);
  }

  return {
    dir,
    present,
    missing,
    gatePresent,
    gateMissing,
    researchCharCount: countResearchChars(dir),
    meetsIcebergGate: countResearchChars(dir) >= MIN_ICEBERG_CHARS
  };
}

/**
 * Compare pipeline output files (array of {name, content}) against golden expectations.
 */
export function scoreAgainstGolden(outputFiles, metrics = collectGoldenMetrics()) {
  const names = new Set(outputFiles.map((f) => f.name));
  const required = [...REQUIRED_ROOT_FILES, ...REQUIRED_RESEARCH_FILES];
  const missing = required.filter((r) => !names.has(r));
  const gateMissing = GATE_ARTIFACTS.filter((r) => !names.has(r));

  let researchChars = 0;
  for (const f of outputFiles) {
    if (f.name.startsWith("research/") && f.name.endsWith(".md")) {
      researchChars += f.content.length;
    }
  }

  return {
    filesPresent: required.length - missing.length,
    filesRequired: required.length,
    missing,
    gateMissing,
    researchCharCount: researchChars,
    meetsIcebergGate: researchChars >= MIN_ICEBERG_CHARS,
    goldenResearchCharCount: metrics.researchCharCount
  };
}

/**
 * Assert a single step's outputs match expectedOutputsForStep (for per-step golden tests).
 * @returns {{ ok: boolean, missing: string[], unexpected: string[], expected: string[] }}
 */
export function scoreStepOutputs(stepId, files) {
  const expected = expectedOutputsForStep(stepId);
  const names = files.map((f) => f.name);
  const nameSet = new Set(names);
  const missing = expected.filter((n) => !nameSet.has(n));
  const unexpected = names.filter((n) => !expected.includes(n) && n !== "output.md");
  return {
    ok: missing.length === 0,
    missing,
    unexpected,
    expected,
    stepId
  };
}

export function assertPassportShape(content) {
  const data = typeof content === "string" ? JSON.parse(content) : content;
  const requiredKeys = [
    "iceberg_char_count",
    "num_a_tier_facts",
    "num_b_tier_facts",
    "ifalsify_verdict",
    "main_tension",
    "explicit_gaps"
  ];
  const missingKeys = requiredKeys.filter((k) => !(k in data));
  return { ok: missingKeys.length === 0, missingKeys, data };
}

export { R1_STEP_ORDER, expectedOutputsForStep };
