#!/bin/bash
# 双击本文件即可开 Pitch Studio 路演（勿用 Finder 双击 HTML）
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT=8765
URL="http://127.0.0.1:${PORT}/ui/PitchStudio刀刃.html?demo=nestle#product-run"
HOME_URL="http://127.0.0.1:${PORT}/路演/"

if ! lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "启动本机服务…"
  python3 -m engine.serve &
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -sf "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
      break
    fi
    sleep 0.4
  done
else
  echo "服务已在 ${PORT} 运行"
fi

echo "打开路演…"
open "$HOME_URL"
sleep 0.3
open "$URL"
echo ""
echo "主秀：Pitch Studio（已预填雀巢）"
echo "入口：$HOME_URL"
echo "关掉本窗口不会停服务；要停：kill \$(lsof -t -iTCP:${PORT} -sTCP:LISTEN)"
read -r -p "按回车关闭本窗口…"
