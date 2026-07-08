#!/usr/bin/env bash
# iPitch Cloudflare Worker — one-shot deploy helper
# Usage: cd worker && ./deploy.sh
set -euo pipefail

cd "$(dirname "$0")"

WRANGLER="${WRANGLER:-npx wrangler}"

echo "=== iPitch Worker Deploy ==="
echo ""

if ! $WRANGLER whoami >/dev/null 2>&1; then
  echo "Not logged in to Cloudflare."
  echo ""
  echo "Run:"
  echo "  npx wrangler login"
  echo "  ./deploy.sh"
  exit 1
fi

echo "✓ Cloudflare account:"
$WRANGLER whoami
echo ""

echo "Deploying worker..."
$WRANGLER deploy
echo ""

echo "Next steps:"
echo "  1. npx wrangler secret put DEEPSEEK_API_KEY"
echo "  2. curl -s \"https://ipitch-deepseek-proxy.<account>.workers.dev/health\""
echo "  3. UI → API 设置 → Proxy URL (use URL from deploy output above)"
echo ""
echo "Done."
