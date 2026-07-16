/**
 * In-memory job store for async R1 pipeline runs (Phase 2).
 * Single-process; replace with Redis/DB when deploying multi-instance.
 */

import { randomUUID } from "node:crypto";

/** @typedef {'queued'|'running'|'done'|'failed'} JobStatus */

/**
 * @typedef {Object} JobRecord
 * @property {string} id
 * @property {JobStatus} status
 * @property {object} request
 * @property {string} [currentStep]
 * @property {number} stepsDone
 * @property {number} stepsTotal
 * @property {object} [result]
 * @property {string} [error]
 * @property {string} createdAt
 * @property {string} [startedAt]
 * @property {string} [finishedAt]
 */

const jobs = new Map();
let workerRunning = false;

export function createJob(request, stepsTotal) {
  const id = randomUUID();
  const record = {
    id,
    status: "queued",
    request,
    stepsDone: 0,
    stepsTotal,
    createdAt: new Date().toISOString()
  };
  jobs.set(id, record);
  return record;
}

export function getJob(id) {
  return jobs.get(id) || null;
}

export function listJobs(limit = 20) {
  return [...jobs.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(summarizeJob);
}

export function summarizeJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    target: job.request?.target || job.request?.input?.target,
    profile: job.request?.profile || "quick",
    currentStep: job.currentStep || null,
    stepsDone: job.stepsDone,
    stepsTotal: job.stepsTotal,
    fileCount: job.result?.files?.length ?? 0,
    warnings: job.result?.warnings?.length ?? 0,
    error: job.error || null,
    createdAt: job.createdAt,
    startedAt: job.startedAt || null,
    finishedAt: job.finishedAt || null
  };
}

export function updateJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return null;
  Object.assign(job, patch);
  return job;
}

/**
 * @param {(job: JobRecord) => Promise<void>} processor
 */
export function enqueueWorker(processor) {
  if (workerRunning) return;
  workerRunning = true;
  void (async function drain() {
    try {
      while (true) {
        const next = [...jobs.values()].find((j) => j.status === "queued");
        if (!next) break;
        next.status = "running";
        next.startedAt = new Date().toISOString();
        try {
          await processor(next);
          next.status = "done";
        } catch (err) {
          next.status = "failed";
          next.error = err.message || String(err);
        }
        next.finishedAt = new Date().toISOString();
      }
    } finally {
      workerRunning = false;
    }
  })();
}

/** Test helper */
export function _clearJobs() {
  jobs.clear();
  workerRunning = false;
}
