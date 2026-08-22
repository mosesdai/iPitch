/**
 * Tavily web search — optional augmentation for source_hunt step.
 * Set TAVILY_API_KEY on Worker; UI calls POST {proxy}/v1/search
 */

const TAVILY_URL = "https://api.tavily.com/search";

export async function tavilySearch(apiKey, query, maxResults = 8) {
  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: Math.min(maxResults, 10),
      include_answer: false
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("TAVILY_" + res.status + ": " + text.slice(0, 200));
  }
  const data = await res.json();
  return {
    query,
    results: (data.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      content: (r.content || "").slice(0, 1200),
      score: r.score
    }))
  };
}

/** Default hunt queries for cold-start R1 */
export function defaultHuntQueries(target) {
  const t = target || "company";
  return [
    `${t} annual report 10-K 20-F earnings 2025 2026`,
    `${t} quarterly earnings delivery volume investor relations`,
    `${t} CEO CFO earnings call transcript`,
    `${t} main competitor market share strategy`,
    `${t} partnership sponsorship sports marketing`,
    `${t} industry regulation China EV`,
    `${t} similar sponsorship deal failed case study`,
    `${t} customer pain point switching cost`
  ];
}
