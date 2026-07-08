# iPitch DeepSeek API Proxy (Cloudflare Worker)

Browser-side iPitch cannot call `api.deepseek.com` directly due to CORS. This worker proxies chat completions, holds your API key server-side, and supports streaming SSE.

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [Node.js](https://nodejs.org/) 18+
- A DeepSeek API key from [platform.deepseek.com](https://platform.deepseek.com)

## Quick deploy (4 commands)

```bash
cd worker
npx wrangler login          # one-time: opens browser
./deploy.sh                 # or: npx wrangler deploy
npx wrangler secret put DEEPSEEK_API_KEY   # paste sk-... when prompted
curl -s "https://ipitch-deepseek-proxy.<account>.workers.dev/health"
```

Replace `<account>` with your workers.dev subdomain from deploy output.

Or use the helper script after login:

```bash
cd worker
chmod +x deploy.sh
./deploy.sh
```

## Required secrets

| Name | Where | Description |
|------|-------|-------------|
| `DEEPSEEK_API_KEY` | `wrangler secret put` | DeepSeek API key (`sk-...`) — **required** |

## Optional configuration

| Name | Where | Default | Description |
|------|-------|---------|-------------|
| `DEEPSEEK_BASE_URL` | secret or `.dev.vars` | `https://api.deepseek.com` | API base URL |
| `ALLOWED_ORIGINS` | `wrangler.toml` `[vars]` or env | `*` | Comma-separated CORS origins |

Tighten CORS for production in `wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGINS = "https://your-org.github.io,http://localhost:8080"
```

Local dev — copy `.env.example` → `.dev.vars` (gitignored):

```bash
cp .env.example .dev.vars
# edit DEEPSEEK_API_KEY=sk-...
wrangler dev
```

## Verify `/health`

After deploy:

```bash
curl -s "https://ipitch-deepseek-proxy.<account>.workers.dev/health"
```

Expected response:

```json
{
  "ok": true,
  "service": "ipitch-deepseek-proxy",
  "keyConfigured": true,
  "allowedOrigins": "*",
  "timestamp": "2026-07-09T12:00:00.000Z"
}
```

- `keyConfigured: false` → run `wrangler secret put DEEPSEEK_API_KEY`
- HTTP 200 + `ok: true` → worker is live

Test chat path (minimal):

```bash
curl -s -X POST "https://ipitch-deepseek-proxy.<account>.workers.dev/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Reply OK"}],"max_tokens":5}'
```

## Configure iPitch UI

1. Open **API 设置** in `ui/ipitch-studio.html` (or deployed Pages URL)
2. Set **Proxy URL** to worker URL — e.g. `https://ipitch-deepseek-proxy.<account>.workers.dev` (no trailing slash)
3. Leave **API Key** empty when using proxy (key lives on worker)
4. Click **测试连接** then **保存设置**

Bake proxy into a static deploy (before `api.js` loads):

```html
<script>window.IPITCH_PROXY_URL = "https://ipitch-deepseek-proxy.<account>.workers.dev";</script>
```

Priority: UI saved `proxyUrl` overrides `window.IPITCH_PROXY_URL`.

## Endpoints

| Path | Method | Description |
|------|--------|-------------|
| `/health` | GET | Liveness + `keyConfigured` status |
| `/v1/chat/completions` | POST | Proxied to DeepSeek (streaming supported) |
| `/` | POST | Same as `/v1/chat/completions` |

## Security notes

- Default `ALLOWED_ORIGINS = *` suits GitHub Pages / static hosting. Restrict for production.
- Worker URL is public — anyone who knows it can consume your DeepSeek quota. Consider Cloudflare Access or IP rules for sensitive deployments.
- Rotate keys via `wrangler secret put DEEPSEEK_API_KEY` if exposed.
- Request body capped at 512 KB.

## CI deploy (GitHub Actions)

See `.github/workflows/deploy-worker.yml`. Required repo secrets:

- `CLOUDFLARE_API_TOKEN` — API token with **Workers Scripts Edit**
- `CLOUDFLARE_ACCOUNT_ID` — from Cloudflare dashboard

`DEEPSEEK_API_KEY` must still be set once via `wrangler secret put` (secrets are not in the workflow file).

## Related

- UI client: `ui/js/api.js`
- Architecture: `docs/CLOUD_DEPLOYMENT.md`
- Async workflow: `docs/ASYNC_WORKFLOW.md`
