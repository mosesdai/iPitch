/**
 * Web search for source_hunt — via Worker POST /v1/search (Tavily)
 */
window.IPitchSearch = (function () {
  function defaultHuntQueries(target) {
    const t = target || "company";
    return [
      `${t} annual report 10-K 20-F earnings 2025 2026`,
      `${t} quarterly earnings delivery volume investor relations`,
      `${t} CEO CFO earnings call transcript`,
      `${t} main competitor market share strategy`,
      `${t} partnership sponsorship sports marketing`,
      `${t} industry regulation market structure`,
      `${t} similar sponsorship deal failed case study`,
      `${t} customer pain point switching cost`
    ];
  }

  function formatHuntsForPrompt(hunts) {
    if (!hunts || !hunts.length) return "(no live search results — use Cursor web search or configure TAVILY_API_KEY on proxy)";
    let out = "";
    for (const h of hunts) {
      out += `\n### Query: ${h.query}\n`;
      for (const r of h.results || []) {
        out += `- **${r.title}**\n  ${r.url}\n  ${(r.content || "").slice(0, 500)}…\n`;
      }
    }
    return out;
  }

  async function hunt(target, proxyUrl) {
    const cfg = window.IPitchAPI.loadConfig();
    const base = (proxyUrl || cfg.proxyUrl || "").trim().replace(/\/$/, "");
    if (!base) {
      return { ok: false, hunts: [], reason: "NO_PROXY" };
    }

    const health = await fetch(base + "/health");
    if (!health.ok) return { ok: false, hunts: [], reason: "HEALTH_FAIL" };
    const h = await health.json();
    if (!h.searchConfigured) {
      return { ok: false, hunts: [], reason: "SEARCH_NOT_CONFIGURED" };
    }

    const queries = defaultHuntQueries(target).slice(0, 6);
    const res = await fetch(base + "/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries, max_results: 5 })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, hunts: [], reason: "SEARCH_" + res.status, detail: text.slice(0, 200) };
    }
    const data = await res.json();
    return { ok: true, hunts: data.hunts || [], queriedAt: data.queriedAt };
  }

  return {
    defaultHuntQueries,
    formatHuntsForPrompt,
    hunt
  };
})();
