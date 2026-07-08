import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { parseFileBlocks, formatFileBlock, mergeFiles } from "../lib/parse-file-blocks.js";
import { buildSystemPrompt, loadKernelBundle } from "../lib/load-kernel.js";
import { runR1Pipeline } from "../src/orchestrator.js";
import {
  collectGoldenMetrics,
  GOLDEN_DIR,
  MIN_ICEBERG_CHARS,
  REQUIRED_ROOT_FILES,
  scoreAgainstGolden
} from "./golden-metrics.js";

describe("parseFileBlocks", () => {
  it("parses ===FILE=== blocks like the UI", () => {
    const raw = [
      formatFileBlock("a.md", "hello"),
      formatFileBlock("b.md", "world")
    ].join("\n\n");
    const files = parseFileBlocks(raw);
    assert.equal(files.length, 2);
    assert.equal(files[0].name, "a.md");
    assert.equal(files[1].content, "world");
  });

  it("falls back to single output.md when no blocks", () => {
    const files = parseFileBlocks("plain text");
    assert.equal(files.length, 1);
    assert.equal(files[0].name, "output.md");
  });

  it("mergeFiles overwrites by name", () => {
    const merged = mergeFiles(
      [{ name: "x.md", content: "old" }],
      [{ name: "x.md", content: "new" }, { name: "y.md", content: "y" }]
    );
    assert.equal(merged.find((f) => f.name === "x.md").content, "new");
    assert.equal(merged.length, 2);
  });
});

describe("load-kernel", () => {
  it("loads KERNEL from ui/js/prompts.js", () => {
    const bundle = loadKernelBundle();
    assert.ok(bundle.kernel.includes("iPitch Studio"));
    assert.ok(bundle.ifalsify.includes("ifalsify"));
    const system = buildSystemPrompt();
    assert.ok(system.length > 2000);
  });
});

describe("golden reference · nio/account-v3", () => {
  it("golden directory exists with required files", () => {
    assert.ok(fs.existsSync(GOLDEN_DIR), `missing ${GOLDEN_DIR}`);
    const metrics = collectGoldenMetrics();
    assert.equal(metrics.missing.length, 0, `missing: ${metrics.missing.join(", ")}`);
    for (const f of REQUIRED_ROOT_FILES) {
      assert.ok(metrics.present.includes(f));
    }
  });

  it("records baseline research char count (informational)", () => {
    const metrics = collectGoldenMetrics();
    assert.ok(metrics.researchCharCount > 5000);
    // v3 ≈ 7909 — documents gate gap vs 8000 product minimum
    if (!metrics.meetsIcebergGate) {
      assert.ok(
        metrics.researchCharCount >= MIN_ICEBERG_CHARS - 500,
        `v3 research ${metrics.researchCharCount} should be near ${MIN_ICEBERG_CHARS}`
      );
    }
  });
});

describe("R1 pipeline stub (charter → timeliness → research)", () => {
  it("runs first three steps and accumulates files", async () => {
    const result = await runR1Pipeline(
      { target: "蔚来 NIO", customer: "", internal: "" },
      { steps: ["charter", "timeliness", "research"], useStub: true }
    );

    assert.equal(result.steps.length, 3);
    assert.ok(result.files.some((f) => f.name === "00_charter.md"));
    assert.ok(result.files.some((f) => f.name === "source_timeliness.md"));
    assert.ok(result.files.some((f) => f.name === "research/01_IR_financial.md"));

    const score = scoreAgainstGolden(result.files);
    assert.ok(score.filesPresent >= 3);
    assert.ok(score.researchCharCount > 1000, "stub research should have bulk padding");
  });
});

describe("pipeline output vs golden (stub — future live)", () => {
  it("scoreAgainstGolden reports missing files until full pipeline ships", async () => {
    const result = await runR1Pipeline(
      { target: "NIO" },
      { steps: ["charter", "timeliness", "research"], useStub: true }
    );
    const score = scoreAgainstGolden(result.files, collectGoldenMetrics());
    assert.ok(score.missing.includes("B_knife.md"));
    assert.ok(score.missing.includes("03_tensions.md"));
    // Placeholder: when all steps live, flip to assert.equal(score.missing.length, 0)
  });
});
