/**
 * iPitch DeepSeek API proxy — Cloudflare Worker
 * Holds DEEPSEEK_API_KEY server-side; browser calls this worker instead of api.deepseek.com
 */

const DEFAULT_BASE = "https://api.deepseek.com";
const MAX_BODY_BYTES = 512 * 1024; // 512 KB

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
        allowedOrigins: describeAllowedOrigins(env.ALLOWED_ORIGINS),
        timestamp: new Date().toISOString()
      });
    }

    if (request.method !== "POST") {
      return json(cors, { error: "Method not allowed" }, 405);
    }

    const path = normalizePath(url.pathname);
    if (!path) {
      return json(cors, { error: "Path not allowed. Use POST /v1/chat/completions" }, 404);
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

function normalizePath(pathname) {
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
