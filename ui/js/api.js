/**
 * DeepSeek API client — key stored in localStorage; optional Cloudflare Worker proxy
 *
 * Proxy mode (Option B): set proxyUrl in API settings or inject before load:
 *   <script>window.IPITCH_PROXY_URL = "https://ipitch-deepseek-proxy.<account>.workers.dev";</script>
 * Verify worker: GET {proxyUrl}/health → { ok: true, keyConfigured: true }
 */
window.IPitchAPI = (function () {
  const STORAGE_KEY = "ipitch_api_config";

  const DEFAULTS = {
    baseUrl: "https://api.deepseek.com",
    proxyUrl: "",
    model: "deepseek-chat",
    apiKey: ""
  };

  function envProxyUrl() {
    if (typeof window === "undefined") return "";
    return window.IPITCH_PROXY_URL || "";
  }

  function loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const cfg = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
      if (!cfg.proxyUrl && envProxyUrl()) cfg.proxyUrl = envProxyUrl();
      return cfg;
    } catch {
      const cfg = { ...DEFAULTS };
      if (envProxyUrl()) cfg.proxyUrl = envProxyUrl();
      return cfg;
    }
  }

  function saveConfig(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function maskKey(key) {
    if (!key || key.length < 8) return "";
    return key.slice(0, 4) + "…" + key.slice(-4);
  }

  function usesProxy(cfg) {
    return !!(cfg.proxyUrl && cfg.proxyUrl.trim());
  }

  function resolveEndpoint(cfg) {
    if (usesProxy(cfg)) {
      const base = cfg.proxyUrl.trim().replace(/\/$/, "");
      return base + "/v1/chat/completions";
    }
    return cfg.baseUrl.replace(/\/$/, "") + "/v1/chat/completions";
  }

  function buildHeaders(cfg) {
    const headers = { "Content-Type": "application/json" };
    if (!usesProxy(cfg)) {
      headers.Authorization = "Bearer " + cfg.apiKey;
    }
    return headers;
  }

  function assertConfigured(cfg) {
    if (usesProxy(cfg)) return;
    if (!cfg.apiKey) throw new Error("NO_API_KEY");
  }

  async function chat(systemPrompt, userPrompt, onChunk) {
    const cfg = loadConfig();
    assertConfigured(cfg);

    const url = resolveEndpoint(cfg);
    const body = {
      model: cfg.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      stream: !!onChunk,
      temperature: 0.4,
      max_tokens: 16000
    };

    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(cfg),
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error("API_" + res.status + ": " + errText.slice(0, 200));
    }

    if (!onChunk) {
      const json = await res.json();
      return json.choices[0].message.content;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            onChunk(full);
          }
        } catch { /* skip malformed SSE */ }
      }
    }
    return full;
  }

  async function checkProxyHealth(proxyUrl) {
    const base = (proxyUrl || "").trim().replace(/\/$/, "");
    if (!base) throw new Error("NO_PROXY_URL");
    const res = await fetch(base + "/health");
    if (!res.ok) throw new Error("HEALTH_" + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error("HEALTH_NOT_OK");
    if (!data.keyConfigured) throw new Error("KEY_NOT_CONFIGURED");
    return data;
  }

  async function testConnection() {
    const cfg = loadConfig();
    assertConfigured(cfg);

    if (usesProxy(cfg)) {
      await checkProxyHealth(cfg.proxyUrl);
    }

    const url = resolveEndpoint(cfg);
    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(cfg),
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        max_tokens: 10
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error("API_" + res.status + ": " + errText.slice(0, 200));
    }
    return true;
  }

  return {
    loadConfig,
    saveConfig,
    maskKey,
    usesProxy,
    checkProxyHealth,
    chat,
    testConnection,
    DEFAULTS,
    STORAGE_KEY
  };
})();
