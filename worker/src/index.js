/**
 * iPitch DeepSeek API proxy + optional Tavily search (source_hunt)
 */

const DEFAULT_BASE = "https://api.deepseek.com";
const MAX_BODY_BYTES = 512 * 1024;
const TAVILY_URL = "https://api.tavily.com/search";

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json(cors, {
        ok: true,
        service: "ipitch-deepseek-proxy",
        keyConfigured: !!env.DEEPSEEK_API_KEY,
        searchConfigured: !!env.TAVILY_API_KEY,
        allowedOrigins: describeAllowedOrigins(env.ALLOWED_ORIGINS),
        timestamp: new Date().toISOString()
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/search") {
      return handleSearch(request, env, cors);
    }

    if (request.method !== "POST") {
      return json(cors, { error: "Method not allowed" }, 405);
    }

    const path = normalizeChatPath(url.pathname);
    if (!path) {
      return json(cors, { error: "Path not allowed. Use POST /v1/chat/completions or /v1/search" }, 404);
    }

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return json(cors, { error: "DEEPSEEK_API_KEY not configured on worker" }, 503);
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return json(cors, { error: "Request body too large" }, 413);
    }

    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) {
      return json(cors, { error: "Request body too large" }, 413);
    }

    const base = (env.DEEPSEEK_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
    const target = base + path;

    try {
      const upstream = await fetch(target, {
        method: "POST",
        headers: {
          "Content-Type": request.headers.get("Content-Type") || "application/json",
          Authorization: "Bearer " + apiKey
        },
        body
      });

      const headers = new Headers(upstream.headers);
      applyCors(headers, cors);

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers
      });
    } catch {
      return json(cors, { error: "Upstream request failed" }, 502);
    }
  }
};

async function handleSearch(request, env, cors) {
  const apiKey = env.TAVILY_API_KEY;
  if (!apiKey) {
    return json(cors, { error: "TAVILY_API_KEY not configured on worker" }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(cors, { error: "Invalid JSON body" }, 400);
  }

  const queries = Array.isArray(payload.queries)
    ? payload.queries
    : payload.query
      ? [payload.query]
      : [];

  if (!queries.length) {
    return json(cors, { error: "Provide query or queries[]" }, 400);
  }

  const maxResults = payload.max_results || 6;
  const limit = Math.min(queries.length, 8);

  try {
    const hunts = [];
    for (let i = 0; i < limit; i++) {
      hunts.push(await tavilySearch(apiKey, String(queries[i]), maxResults));
    }
    return json(cors, { ok: true, hunts, queriedAt: new Date().toISOString() });
  } catch (err) {
    return json(cors, { error: err.message || "Search failed" }, 502);
  }
}

async function tavilySearch(apiKey, query, maxResults) {
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

function normalizeChatPath(pathname) {
  if (pathname === "/" || pathname === "/v1/chat/completions") {
    return "/v1/chat/completions";
  }
  return null;
}

function parseAllowedOrigins(value) {
  if (!value || value.trim() === "" || value.trim() === "*") return ["*"];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function describeAllowedOrigins(value) {
  const list = parseAllowedOrigins(value);
  return list.includes("*") ? "*" : list;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = parseAllowedOrigins(env.ALLOWED_ORIGINS);

  if (allowed.includes("*")) {
    return baseCorsHeaders("*");
  }
  if (origin && allowed.includes(origin)) {
    return baseCorsHeaders(origin);
  }
  if (!origin) {
    return baseCorsHeaders(allowed[0] || "*");
  }
  return baseCorsHeaders(allowed[0] || "null");
}

function baseCorsHeaders(allowOrigin) {
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function applyCors(headers, cors) {
  Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
}

function json(cors, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" }
  });
}
