import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { parseFileBlocks, formatFileBlock, mergeFiles } from "../lib/parse-file-blocks.js";
import { buildSystemPrompt, loadKernelBundle } from "../lib/load-kernel.js";
import { loadProtocolSnippets } from "../lib/load-protocols.js";
import { runR1Pipeline, R1_STEP_ORDER } from "../src/orchestrator.js";
import {
  buildStepUserPrompt,
  expectedOutputsForStep,
  getStepDefinition,
  MARATHON_STEP_ORDER,
  STEP_PROTOCOLS,
  stubStepResponse
} from "../src/r1-pipeline.js";
import {
  assertPassportShape,
  collectGoldenMetrics,
  FULL_PIPELINE_FILES,
  GOLDEN_DIR,
  MIN_ICEBERG_CHARS,
  REQUIRED_ROOT_FILES,
  scoreAgainstGolden,
  scoreStepOutputs
} from "./golden-metrics.js";

const NIO_INPUT = { target: "蔚来 NIO", customer: "", internal: "" };

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

describe("load-kernel (ui/js/prompts.js)", () => {
  it("loads KERNEL from ui/js/prompts.js without duplication", () => {
    const bundle = loadKernelBundle();
    assert.ok(bundle.kernel.includes("iPitch Studio"));
    assert.ok(bundle.kernel.includes("简体中文"));
    assert.ok(bundle.ifalsify.includes("ifalsify"));
    assert.ok(bundle.grill.includes("Grill"));
    assert.ok(bundle.outputFormat.includes("===FILE:"));
    const system = buildSystemPrompt();
    assert.ok(system.length > 2000);
  });
});

describe("load-protocols (protocols/ + references/)", () => {
  it("every step protocol path exists on disk", () => {
    for (const stepId of R1_STEP_ORDER) {
      const def = getStepDefinition(stepId);
      const snippets = loadProtocolSnippets(def.protocolPaths);
      assert.equal(snippets.length, STEP_PROTOCOLS[stepId].length);
      for (const s of snippets) {
        assert.ok(s.content.length > 50, `${s.path} too short`);
      }
    }
  });

  it("buildStepUserPrompt injects protocol sources for each step", () => {
    for (const stepId of R1_STEP_ORDER) {
      const prompt = buildStepUserPrompt(stepId, NIO_INPUT, []);
      assert.ok(prompt.includes(`# Step:`), stepId);
      assert.ok(prompt.includes("## Protocol references"), stepId);
      assert.ok(prompt.includes("### Source:"), stepId);
      assert.ok(prompt.includes("蔚来 NIO"), stepId);
    }
  });

  it("marathon-only step protocol paths exist", () => {
    const marathonOnly = MARATHON_STEP_ORDER.filter((id) => !R1_STEP_ORDER.includes(id));
    for (const stepId of marathonOnly) {
      const def = getStepDefinition(stepId);
      const snippets = loadProtocolSnippets(def.protocolPaths);
      assert.ok(snippets.length > 0, stepId);
    }
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

describe("stub responses · per-step file contract", () => {
  for (const stepId of R1_STEP_ORDER) {
    it(`stub ${stepId} emits expected ===FILE=== blocks`, () => {
      const raw = stubStepResponse(stepId, NIO_INPUT, []);
      const files = parseFileBlocks(raw);
      const score = scoreStepOutputs(stepId, files);
      assert.equal(
        score.missing.length,
        0,
        `${stepId} missing: ${score.missing.join(", ")}`
      );
      assert.ok(files.length >= expectedOutputsForStep(stepId).length);
    });
  }

  it("files stub quality_passport.json is valid and shaped", () => {
    const prior = parseFileBlocks(stubStepResponse("research", NIO_INPUT));
    const raw = stubStepResponse("files", NIO_INPUT, prior);
    const files = parseFileBlocks(raw);
    const passport = files.find((f) => f.name === "quality_passport.json");
    assert.ok(passport);
    const shape = assertPassportShape(passport.content);
    assert.equal(shape.ok, true, `missing keys: ${shape.missingKeys.join(", ")}`);
    assert.ok(shape.data.iceberg_char_count > 0);
  });
});

describe("R1 pipeline · per-step golden (stub)", () => {
  for (const stepId of R1_STEP_ORDER) {
    it(`runs step ${stepId} alone and matches expected outputs`, async () => {
      const result = await runR1Pipeline(NIO_INPUT, {
        steps: [stepId],
        useStub: true,
        strict: true
      });
      assert.equal(result.steps.length, 1);
      assert.equal(result.steps[0].stepId, stepId);
      assert.equal(result.warnings.length, 0, result.warnings.join("; "));
      const score = scoreStepOutputs(stepId, result.steps[0].files);
      assert.equal(score.missing.length, 0, score.missing.join(", "));
      for (const name of expectedOutputsForStep(stepId)) {
        assert.ok(result.files.some((f) => f.name === name), `missing ${name}`);
      }
    });
  }
});

describe("R1 pipeline · marathon stub profile", () => {
  it("runs --profile marathon with source_hunt + grill + split pitchvision", async () => {
    const result = await runR1Pipeline(
      { ...NIO_INPUT, outputs: ["research", "knife", "ipod"] },
      { profile: "marathon", useStub: true, strict: true }
    );
    assert.ok(result.files.some((f) => f.name === "research/00_source_hunt.md"));
    assert.ok(result.files.some((f) => f.name === "grill_report.md"));
    assert.ok(result.files.some((f) => f.name === "pitchvision/concept-a/03_tension_T5.md"));
    assert.equal(result.warnings.length, 0, result.warnings.join("; "));
  });
});

describe("R1 pipeline · full seven-step stub", () => {
  it("runs charter → files and accumulates full R1 package", async () => {
    const result = await runR1Pipeline(NIO_INPUT, {
      useStub: true,
      strict: true
    });

    assert.equal(result.steps.length, R1_STEP_ORDER.length);
    assert.deepEqual(
      result.steps.map((s) => s.stepId),
      [...R1_STEP_ORDER]
    );
    assert.equal(result.warnings.length, 0, result.warnings.join("; "));

    for (const name of FULL_PIPELINE_FILES) {
      assert.ok(
        result.files.some((f) => f.name === name),
        `full pipeline missing ${name}`
      );
    }

    const score = scoreAgainstGolden(result.files);
    assert.equal(score.missing.length, 0, `missing: ${score.missing.join(", ")}`);
    assert.equal(score.gateMissing.length, 0, `gate missing: ${score.gateMissing.join(", ")}`);
    assert.ok(
      score.meetsIcebergGate,
      `stub iceberg ${score.researchCharCount} < ${MIN_ICEBERG_CHARS}`
    );

    const passport = result.files.find((f) => f.name === "quality_passport.json");
    const shape = assertPassportShape(passport.content);
    assert.equal(shape.ok, true);
    assert.ok(shape.data.iceberg_char_count >= MIN_ICEBERG_CHARS);
  });

  it("prior steps feed later prompts (knife sees tensions)", async () => {
    const result = await runR1Pipeline(NIO_INPUT, {
      steps: ["charter", "tensions", "knife"],
      useStub: true,
      strict: true
    });
    assert.ok(result.files.some((f) => f.name === "00_charter.md"));
    assert.ok(result.files.some((f) => f.name === "03_tensions.md"));
    assert.ok(result.files.some((f) => f.name === "B_knife.md"));
    const knife = result.files.find((f) => f.name === "B_knife.md");
    assert.ok(knife.content.includes("明确不说"));
  });
});
