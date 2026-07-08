/**
 * R1 pipeline orchestrator — runs steps sequentially, accumulates file outputs.
 */

import { buildSystemPrompt } from "../lib/load-kernel.js";
import { mergeFiles, parseFileBlocks } from "../lib/parse-file-blocks.js";
import {
  R1_STEP_ORDER,
  buildStepUserPrompt,
  expectedOutputsForStep,
  getStepDefinition,
  stubStepResponse
} from "./r1-pipeline.js";

/**
 * @typedef {Object} PipelineInput
 * @property {string} target
 * @property {string} [customer]
 * @property {string} [internal]
 */

/**
 * @typedef {Object} StepResult
 * @property {string} stepId
 * @property {{ name: string, content: string }[]} files
 * @property {string} raw
 */

/**
 * @typedef {Object} PipelineResult
 * @property {StepResult[]} steps
 * @property {{ name: string, content: string }[]} files
 * @property {string[]} warnings
 */

/**
 * @param {PipelineInput} input
 * @param {Object} [options]
 * @param {string[]} [options.steps] — subset of step ids; default all
 * @param {(system: string, user: string, ctx: object) => Promise<string>} [options.chatFn]
 * @param {boolean} [options.useStub] — use stub responses instead of chatFn
 * @param {boolean} [options.strict] — throw if a step misses expected files / invalid passport JSON
 * @param {(event: object) => void} [options.onProgress]
 * @returns {Promise<PipelineResult>}
 */
export async function runR1Pipeline(input, options = {}) {
  const stepIds = options.steps?.length
    ? options.steps.filter((id) => R1_STEP_ORDER.includes(id))
    : [...R1_STEP_ORDER];

  if (!stepIds.length) {
    throw new Error("No valid steps to run");
  }

  const systemPrompt = buildSystemPrompt();
  const steps = [];
  let allFiles = [];
  const warnings = [];

  for (const stepId of stepIds) {
    getStepDefinition(stepId);
    const userPrompt = buildStepUserPrompt(stepId, input, allFiles);

    options.onProgress?.({ type: "step_start", stepId });

    let raw;
    if (options.useStub) {
      raw = stubStepResponse(stepId, input, allFiles);
    } else if (options.chatFn) {
      raw = await options.chatFn(systemPrompt, userPrompt, { stepId, input, priorFiles: allFiles });
    } else {
      throw new Error(
        `No chatFn for step "${stepId}". Pass options.chatFn, options.useStub: true, or use --dry-run.`
      );
    }

    const files = parseFileBlocks(raw);
    const expected = expectedOutputsForStep(stepId);
    const missingExpected = [];

    for (const name of expected) {
      if (!files.some((f) => f.name === name)) {
        const msg = `Step ${stepId}: missing expected file ${name}`;
        warnings.push(msg);
        missingExpected.push(name);
      }
    }

    if (options.strict && missingExpected.length) {
      throw new Error(
        `Strict mode: ${stepId} missing ${missingExpected.join(", ")}`
      );
    }

    // files step: quality_passport.json must parse when present
    const passport = files.find((f) => f.name === "quality_passport.json");
    if (passport) {
      try {
        JSON.parse(passport.content);
      } catch (err) {
        const msg = `Step ${stepId}: quality_passport.json is not valid JSON (${err.message})`;
        warnings.push(msg);
        if (options.strict) throw new Error(msg);
      }
    }

    steps.push({ stepId, files, raw, expected, missingExpected });
    allFiles = mergeFiles(allFiles, files);

    options.onProgress?.({
      type: "step_done",
      stepId,
      fileCount: files.length,
      missingExpected
    });
  }

  return { steps, files: allFiles, warnings };
}

export { R1_STEP_ORDER };
