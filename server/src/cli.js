#!/usr/bin/env node
/**
 * CLI for R1 pipeline — dry-run, stub, or live (env DEEPSEEK_API_KEY / DEEPSEEK_PROXY_URL).
 */

import { buildSystemPrompt } from "../lib/load-kernel.js";
import { runR1Pipeline } from "./orchestrator.js";
import { R1_STEP_ORDER, buildStepUserPrompt } from "./r1-pipeline.js";

function parseArgs(argv) {
  const opts = {
    target: "蔚来 NIO",
    customer: "",
    internal: "",
    steps: null,
    dryRun: false,
    stub: false
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--stub") opts.stub = true;
    else if (a === "--target" && argv[i + 1]) opts.target = argv[++i];
    else if (a === "--steps" && argv[i + 1]) {
      opts.steps = argv[++i].split(",").map((s) => s.trim());
    }
  }

  if (!opts.steps) {
    opts.steps = [...R1_STEP_ORDER];
  }

  return opts;
}

async function createChatFn() {
  const proxyUrl = process.env.DEEPSEEK_PROXY_URL?.replace(/\/$/, "");
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const endpoint = proxyUrl
    ? `${proxyUrl}/v1/chat/completions`
    : `${baseUrl}/v1/chat/completions`;

  const headers = { "Content-Type": "application/json" };
  if (!proxyUrl) {
    if (!apiKey) {
      throw new Error("Set DEEPSEEK_API_KEY or DEEPSEEK_PROXY_URL for live runs");
    }
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return async (system, user) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        stream: false
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  };
}

async function main() {
  const opts = parseArgs(process.argv);
  const input = { target: opts.target, customer: opts.customer, internal: opts.internal };

  if (opts.dryRun) {
    const system = buildSystemPrompt();
    console.log("# System prompt length:", system.length, "chars\n");
    for (const stepId of opts.steps) {
      console.log("\n" + "=".repeat(60));
      console.log("STEP:", stepId);
      console.log("=".repeat(60));
      console.log(buildStepUserPrompt(stepId, input, []));
    }
    return;
  }

  const runOpts = {
    steps: opts.steps,
    useStub: opts.stub,
    strict: opts.stub,
    onProgress: (e) => {
      if (e.type === "step_start") process.stderr.write(`→ ${e.stepId}… `);
      if (e.type === "step_done") {
        const miss = e.missingExpected?.length
          ? ` (missing: ${e.missingExpected.join(", ")})`
          : "";
        process.stderr.write(`${e.fileCount} files${miss}\n`);
      }
    }
  };

  if (!opts.stub) {
    runOpts.chatFn = await createChatFn();
  }

  const result = await runR1Pipeline(input, runOpts);

  console.log(JSON.stringify({
    steps: result.steps.map((s) => ({ stepId: s.stepId, files: s.files.map((f) => f.name) })),
    totalFiles: result.files.length,
    warnings: result.warnings
  }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
