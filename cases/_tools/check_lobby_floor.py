#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lobby case floor check — no advanced model required.

Usage:
  python3 cases/_tools/check_lobby_floor.py
  python3 cases/_tools/check_lobby_floor.py byd geely-international
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from engine.v16_checks import check_lobby_case_root, check_public_naming  # noqa: E402

CASES = ROOT / "cases"
DEFAULT = ["byd", "geely-international"]
PUBLIC_SAMPLES = [
    "ONE_PAGER.md",
    "B_knife.md",
    "MAX_GAP_AUDIT.md",
    "pitchvision/README.md",
]


def main(argv: list[str]) -> int:
    slugs = DEFAULT if (not argv or argv == ["all"]) else argv
    rc = 0
    for slug in slugs:
        case = CASES / slug
        print(f"\n== {slug}")
        if not case.is_dir():
            print("  FAIL missing case dir")
            rc = 1
            continue
        checks = list(check_lobby_case_root(case))
        for rel in PUBLIC_SAMPLES:
            p = case / rel
            if not p.is_file():
                continue
            for c in check_public_naming(p.read_text(encoding="utf-8")):
                checks.append(type(c)(f"{c.name}::{rel}", c.passed, c.detail))
        for c in checks:
            mark = "PASS" if c.passed else "FAIL"
            if not c.passed:
                rc = 1
            print(f"  {mark}  {c.name} — {c.detail}")
    return rc


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
