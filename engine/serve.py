#!/usr/bin/env python3
"""Local Proof server: UI + cases + engine demo API. No company cloud required.

  python3 -m engine.serve
  → http://127.0.0.1:8765/ui/PitchStudio刀刃.html
  （页内 #sample-gallery 样例廊 · #engine-lab 本机门禁）
"""

from __future__ import annotations

import json
import subprocess
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
HOST = "127.0.0.1"
PORT = 8765


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self._json(200, {"ok": True, "root": str(ROOT), "phase": "L-local-proof"})
            return
        if parsed.path == "/api/runs":
            runs_dir = ROOT / "runs"
            items = []
            if runs_dir.is_dir():
                for d in sorted(runs_dir.iterdir(), key=lambda p: p.name, reverse=True):
                    if not d.is_dir():
                        continue
                    meta_path = d / "run.json"
                    passport_path = d / "quality_passport.md"
                    meta = {}
                    if meta_path.is_file():
                        try:
                            meta = json.loads(meta_path.read_text(encoding="utf-8"))
                        except json.JSONDecodeError:
                            meta = {}
                    verdict = None
                    pj = d / "passport.json"
                    if pj.is_file():
                        try:
                            verdict = json.loads(pj.read_text(encoding="utf-8")).get("verdict")
                        except json.JSONDecodeError:
                            pass
                    items.append(
                        {
                            "id": d.name,
                            "company": meta.get("company"),
                            "round": meta.get("round", "R1"),
                            "status": meta.get("status"),
                            "verdict": verdict,
                            "has_passport": passport_path.is_file(),
                        }
                    )
            self._json(200, {"runs": items[:40]})
            return
        if parsed.path.startswith("/api/runs/"):
            run_id = parsed.path[len("/api/runs/") :].strip("/")
            if "/" in run_id or run_id.startswith("."):
                self._json(400, {"error": "bad id"})
                return
            run_dir = ROOT / "runs" / run_id
            if not run_dir.is_dir():
                self._json(404, {"error": "not found"})
                return
            passport = run_dir / "quality_passport.md"
            citation = run_dir / "citation_report.md"
            meta = {}
            if (run_dir / "run.json").is_file():
                meta = json.loads((run_dir / "run.json").read_text(encoding="utf-8"))
            self._json(
                200,
                {
                    "meta": meta,
                    "passport_md": passport.read_text(encoding="utf-8") if passport.is_file() else None,
                    "citation_md": citation.read_text(encoding="utf-8") if citation.is_file() else None,
                },
            )
            return
        if parsed.path in ("/", "/ui", "/ui/"):
            self.send_response(302)
            self.send_header("Location", "/ui/PitchStudio刀刃.html")
            self.end_headers()
            return
        if parsed.path in ("/ui/EngineLab.html", "/ui/EngineLab"):
            self.send_response(302)
            self.send_header("Location", "/ui/PitchStudio刀刃.html#engine-lab")
            self.end_headers()
            return
        if parsed.path in ("/路演", "/demo", "/demo/"):
            self.send_response(302)
            self.send_header("Location", "/路演/")
            self.end_headers()
            return
        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return

        if parsed.path == "/api/engine/demo":
            mode = body.get("mode", "demo")
            if mode not in {"demo", "fail", "fail-v16", "wrong-excerpt"}:
                self._json(400, {"error": "bad mode"})
                return
            company = str(body.get("company") or "DemoCo")[:40]
            cmd = [
                sys.executable,
                "-m",
                "engine.run",
                "--company",
                company,
                "--mode",
                mode,
            ]
            if not (body.get("live") and mode == "demo"):
                cmd.append("--offline")

            proc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
            # find newest matching run
            runs = sorted((ROOT / "runs").glob(f"*_{mode}"), reverse=True)
            run_id = runs[0].name if runs else None
            passport = None
            verdict = None
            if run_id:
                p = ROOT / "runs" / run_id / "quality_passport.md"
                pj = ROOT / "runs" / run_id / "passport.json"
                if p.is_file():
                    passport = p.read_text(encoding="utf-8")
                if pj.is_file():
                    verdict = json.loads(pj.read_text(encoding="utf-8")).get("verdict")
            self._json(
                200,
                {
                    "ok": proc.returncode in (0, 2),
                    "returncode": proc.returncode,
                    "stdout": (proc.stdout or "")[-2000:],
                    "run_id": run_id,
                    "verdict": verdict,
                    "passport_md": passport,
                },
            )
            return

        # L6 · rebuild off-machine single-file HTML from case MD
        if parsed.path == "/api/cases/portable":
            case = str(body.get("case") or "all").strip().lower()
            allowed = {"all", "byd", "geely-international", "geely"}
            if case not in allowed:
                self._json(400, {"error": "bad case", "allowed": sorted(allowed)})
                return
            cmd = [sys.executable, "-m", "engine.run", "--portable"]
            if case in {"byd", "geely-international", "geely"}:
                slug = "geely-international" if case == "geely" else case
                cmd.append(slug)
            proc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
            files = []
            for rel in (
                "cases/byd/deliver/BYD_全案入口_可转发.html",
                "cases/geely-international/deliver/GEELY_全案入口_可转发.html",
                "cases/_export/BYD_全案入口_可转发.html",
                "cases/_export/GEELY_全案入口_可转发.html",
            ):
                p = ROOT / rel
                if p.is_file():
                    files.append({"path": "/" + rel, "bytes": p.stat().st_size})
            self._json(
                200 if proc.returncode == 0 else 500,
                {
                    "ok": proc.returncode == 0,
                    "returncode": proc.returncode,
                    "stdout": (proc.stdout or "")[-1500:],
                    "stderr": (proc.stderr or "")[-800:],
                    "files": files,
                },
            )
            return

        # L7 · lobby structure + public naming floor
        if parsed.path == "/api/cases/lobby-floor":
            raw_cases = body.get("cases")
            cmd = [sys.executable, "-m", "engine.run", "--lobby-floor"]
            if isinstance(raw_cases, list) and raw_cases:
                cmd.extend(str(c) for c in raw_cases)
            proc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
            self._json(
                200 if proc.returncode == 0 else 500,
                {
                    "ok": proc.returncode == 0,
                    "returncode": proc.returncode,
                    "stdout": (proc.stdout or "")[-4000:],
                    "stderr": (proc.stderr or "")[-800:],
                },
            )
            return

        self._json(404, {"error": "unknown endpoint"})


def main() -> int:
    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError as e:
        if getattr(e, "errno", None) == 48 or "Address already in use" in str(e):
            print(f"端口 {PORT} 已被占用——多半服务已经在跑。")
            print(f"直接打开：http://{HOST}:{PORT}/ui/PitchStudio刀刃.html")
            print(f"路演入口：http://{HOST}:{PORT}/路演/")
            print(f"本机门禁锚点：…/PitchStudio刀刃.html#engine-lab")
            print(f"若要重启：kill $(lsof -t -iTCP:{PORT} -sTCP:LISTEN) 后再执行本命令")
            return 0
        raise
    print(f"Local Proof server → http://{HOST}:{PORT}/ui/PitchStudio刀刃.html")
    print(f"路演入口           → http://{HOST}:{PORT}/路演/")
    print(f"本机门禁           → http://{HOST}:{PORT}/ui/PitchStudio刀刃.html#engine-lab")
    print("Ctrl+C to stop. No company cloud required.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
