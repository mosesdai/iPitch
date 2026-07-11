/**
 * Map HTTP / UI request body → orchestrator options.
 */

import { MARATHON_STEP_ORDER, R1_STEP_ORDER, resolveStepsForOptions } from "../src/r1-pipeline.js";

export function resolveProfile(body = {}) {
  if (body.profile === "marathon" || body.marathonMode === true) return "marathon";
  return "quick";
}

export function buildPipelineOptions(body = {}) {
  const profile = resolveProfile(body);
  const steps = resolveStepsForOptions({
    profile: profile === "marathon" ? "marathon" : null,
    steps: body.steps
  });

  return {
    profile,
    steps,
    useStub: !!body.stub,
    strict: body.strict ?? !!body.stub
  };
}

export function buildPipelineInput(body = {}) {
  return {
    target: body.target || "",
    customer: body.customer || "",
    internal: body.internal || ""
  };
}

export function stepsForBody(body) {
  return buildPipelineOptions(body).steps;
}

export { MARATHON_STEP_ORDER, R1_STEP_ORDER };
