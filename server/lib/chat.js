/**
 * DeepSeek chatFn factory — shared by CLI and HTTP server.
 */

export async function createChatFn(env = process.env) {
  const proxyUrl = env.DEEPSEEK_PROXY_URL?.replace(/\/$/, "");
  const apiKey = env.DEEPSEEK_API_KEY;
  const baseUrl = (env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const model = env.DEEPSEEK_MODEL || "deepseek-chat";

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
