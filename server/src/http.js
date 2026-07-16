/**
 * Phase 2 HTTP API — async R1 jobs + sync run endpoint.
 *
 *   GET  /health
 *   POST /v1/r1/jobs          → { jobId } (async, poll GET /v1/r1/jobs/:id)
 *   GET  /v1/r1/jobs          → recent jobs
 *   GET  /v1/r1/jobs/:id      → status + result when done
 *   POST /v1/r1/run           → sync result (stub or live)
 */

import http from "node:http";
import { createChatFn } from "../lib/chat.js";
import {
  createJob,
  enqueueWorker,
  getJob,
  listJobs,
  summarizeJob,
  updateJob
} from "../lib/job-store.js";
import {
  buildPipelineInput,
  buildPipelineOptions,
  stepsForBody
} from "../lib/pipeline-request.js";
import { runR1Pipeline } from "./orchestrator.js";

const MAX_BODY = 256 * 1024;

export async function executePipeline(body, onProgress) {
  const input = buildPipelineInput(body);
  if (!input.target) {
    throw new Error("target is required");
  }

  const opts = buildPipelineOptions(body);
  opts.onProgress = onProgress;

  if (!opts.useStub) {
    opts.chatFn = await createChatFn();
  }

  return runR1Pipeline(input, opts);
}

async function processJob(job) {
  const body = job.request;
  const result = await executePipeline(body, (event) => {
    if (event.type === "step_start") {
      updateJob(job.id, { currentStep: event.stepId });
    }
    if (event.type === "step_done") {
      updateJob(job.id, {
        currentStep: event.stepId,
        stepsDone: (getJob(job.id)?.stepsDone || 0) + 1
      });
    }
  });
  updateJob(job.id, { result, stepsDone: job.stepsTotal });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > MAX_BODY) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data.trim()) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data, cors = true) {
  const headers = { "Content-Type": "application/json" };
  if (cors) {
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
export async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  const url = new URL(req.url || "/", "http://localhost");
  const path = url.pathname.replace(/\/$/, "") || "/";

  try {
    if (req.method === "GET" && path === "/health") {
      return sendJson(res, 200, {
        ok: true,
        service: "ipitch-server",
        phase: 2,
        keyViaEnv: !!(process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_PROXY_URL),
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === "GET" && path === "/v1/r1/jobs") {
      return sendJson(res, 200, { jobs: listJobs() });
    }

    const jobMatch = path.match(/^\/v1\/r1\/jobs\/([^/]+)$/);
    if (req.method === "GET" && jobMatch) {
      const job = getJob(jobMatch[1]);
      if (!job) return sendJson(res, 404, { error: "Job not found" });
      const summary = summarizeJob(job);
      const payload = { ...summary };
      if (job.status === "done" && job.result) {
        payload.result = {
          steps: job.result.steps.map((s) => ({
            stepId: s.stepId,
            files: s.files.map((f) => f.name)
          })),
          files: job.result.files,
          warnings: job.result.warnings
        };
      }
      return sendJson(res, 200, payload);
    }

    if (req.method === "POST" && path === "/v1/r1/jobs") {
      const body = await readJson(req);
      const steps = stepsForBody(body);
      const job = createJob(body, steps.length);
      enqueueWorker(processJob);
      return sendJson(res, 202, {
        jobId: job.id,
        status: job.status,
        stepsTotal: job.stepsTotal,
        profile: body.profile || (body.marathonMode ? "marathon" : "quick"),
        poll: `/v1/r1/jobs/${job.id}`
      });
    }

    if (req.method === "POST" && path === "/v1/r1/run") {
      const body = await readJson(req);
      const result = await executePipeline(body);
      return sendJson(res, 200, {
        steps: result.steps.map((s) => ({
          stepId: s.stepId,
          files: s.files.map((f) => f.name)
        })),
        files: result.files,
        warnings: result.warnings
      });
    }

    return sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    return sendJson(res, 400, { error: err.message || String(err) });
  }
}

export function startServer(port = Number(process.env.PORT) || 3921, host = process.env.HOST || "127.0.0.1") {
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      sendJson(res, 500, { error: err.message || "Internal error" });
    });
  });

  return new Promise((resolve) => {
    server.listen(port, host, () => {
      console.error(`iPitch server listening on http://${host}:${port}`);
      resolve(server);
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
