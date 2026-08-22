/**
 * Golden reference metrics from nio/account-v3 — baseline for pipeline quality gates.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

  return {
    dir,
    present,
    missing,
    researchCharCount: countResearchChars(dir),
    meetsIcebergGate: countResearchChars(dir) >= MIN_ICEBERG_CHARS
  };
}

/**
 * Compare pipeline output files (array of {name, content}) against golden expectations.
 * Stub for future full diff — currently checks presence + iceberg char count.
 */
export function scoreAgainstGolden(outputFiles, metrics = collectGoldenMetrics()) {
  const names = new Set(outputFiles.map((f) => f.name));
  const required = [...REQUIRED_ROOT_FILES, ...REQUIRED_RESEARCH_FILES];
  const missing = required.filter((r) => !names.has(r));

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
    researchCharCount: researchChars,
    meetsIcebergGate: researchChars >= MIN_ICEBERG_CHARS,
    goldenResearchCharCount: metrics.researchCharCount
  };
}
