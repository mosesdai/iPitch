/**
 * iPitch server HTTP API client (Phase 2).
 *
 * When serverUrl is set, the UI can offload multi-step R1 / marathon runs to
 * server/src/http.js instead of sequential browser API calls.
 *
 * Inject before load:
 *   <script>window.IPITCH_SERVER_URL = "http://127.0.0.1:3921";</script>
 */
window.IPitchServerAPI = (function () {
  const STORAGE_KEY = "ipitch_server_config";

  const DEFAULTS = {
    serverUrl: "",
    pollIntervalMs: 1500,
    pollTimeoutMs: 30 * 60 * 1000
  };

  function envServerUrl() {
    if (typeof window === "undefined") return "";
    return window.IPITCH_SERVER_URL || "";
  }

  function loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const cfg = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
      if (!cfg.serverUrl && envServerUrl()) cfg.serverUrl = envServerUrl();
      return cfg;
    } catch {
      const cfg = { ...DEFAULTS };
      if (envServerUrl()) cfg.serverUrl = envServerUrl();
      return cfg;
    }
  }

  function saveConfig(patch) {
    const cfg = { ...loadConfig(), ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    return cfg;
  }

  function isConfigured(cfg) {
    const url = (cfg?.serverUrl ?? loadConfig().serverUrl ?? "").trim();
    return !!url;
  }

  function baseUrl(cfg) {
    const url = (cfg?.serverUrl || loadConfig().serverUrl || "").trim().replace(/\/$/, "");
    if (!url) throw new Error("NO_SERVER_URL");
    return url;
  }

  async function checkHealth(serverUrl) {
    const base = (serverUrl || loadConfig().serverUrl || "").trim().replace(/\/$/, "");
    if (!base) throw new Error("NO_SERVER_URL");
    const res = await fetch(base + "/health");
    if (!res.ok) throw new Error("HEALTH_" + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error("HEALTH_NOT_OK");
    return data;
  }

  function buildRequestBody(data) {
    const steps = window.IPitchPrompts
      ? window.IPitchPrompts.getStepsForData(data)
      : null;

    return {
      target: data.target,
      customer: data.customer || "",
      internal: data.internal || "",
      marathonMode: !!data.marathonMode,
      profile: data.marathonMode ? "marathon" : "quick",
      steps: steps && steps.length ? steps : undefined
    };
  }

  async function createJob(data, cfg) {
    const base = baseUrl(cfg);
    const res = await fetch(base + "/v1/r1/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestBody(data))
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error("JOB_" + res.status + ": " + errText.slice(0, 200));
    }
    return res.json();
  }

  async function getJob(jobId, cfg) {
    const base = baseUrl(cfg);
    const res = await fetch(base + "/v1/r1/jobs/" + encodeURIComponent(jobId));
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error("POLL_" + res.status + ": " + errText.slice(0, 200));
    }
    return res.json();
  }

  function stepLabel(stepId) {
    const labels = window.IPitchPrompts?.R1_STEP_LABELS || {};
    return labels[stepId] || stepId;
  }

  /**
   * Poll async job until done/failed or timeout.
   * @param {string} jobId
   * @param {(summary: object) => void} [onProgress]
   */
  async function waitForJob(jobId, onProgress, cfg) {
    const conf = { ...loadConfig(), ...cfg };
    const started = Date.now();

    while (Date.now() - started < conf.pollTimeoutMs) {
      const summary = await getJob(jobId, conf);
      onProgress?.(summary);

      if (summary.status === "done") {
        if (!summary.result?.files?.length) {
          throw new Error("JOB_EMPTY_RESULT");
        }
        return summary.result;
      }
      if (summary.status === "failed") {
        throw new Error(summary.error || "JOB_FAILED");
      }

      await new Promise((r) => setTimeout(r, conf.pollIntervalMs));
    }

    throw new Error("JOB_TIMEOUT");
  }

  /**
   * Run multi-step R1 via server async job queue.
   * @returns {Promise<{ name: string, content: string }[]>}
   */
  async function runPipeline(data, onProgress) {
    const cfg = loadConfig();
    const created = await createJob(data, cfg);
    const result = await waitForJob(created.jobId, (summary) => {
      const zh = window.IPITCH_LANG === "zh";
      const step = summary.currentStep;
      const label = step ? stepLabel(step) : "";
      const msg = zh
        ? `服务端 R1 · ${summary.stepsDone || 0}/${summary.stepsTotal}${label ? "：" + label : ""}…`
        : `Server R1 · ${summary.stepsDone || 0}/${summary.stepsTotal}${label ? ": " + label : ""}…`;
      onProgress?.({ type: "status", message: msg, summary });
    }, cfg);

    return result.files;
  }

  return {
    loadConfig,
    saveConfig,
    isConfigured,
    checkHealth,
    createJob,
    getJob,
    waitForJob,
    runPipeline,
    buildRequestBody,
    DEFAULTS,
    STORAGE_KEY
  };
})();
