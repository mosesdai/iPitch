#!/usr/bin/env python3
"""Shelf catalog fingerprint helper (stage-4 local)."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

from engine.lifecycle import parse_shelf_ids

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "references" / "shelf" / "catalog_starter.md"


def fingerprint(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8") if path.is_file() else ""
    ids = sorted(parse_shelf_ids(path))
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]
    return {
        "path": str(path.relative_to(ROOT)) if path.is_file() else str(path),
        "sha256_16": digest,
        "id_count": len(ids),
        "ids": ids,
    }


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--check", action="store_true", help="Print catalog fingerprint")
    p.add_argument("--write", type=Path, help="Write fingerprint JSON to path")
    args = p.parse_args(argv)
    fp = fingerprint(CATALOG)
    text = json.dumps(fp, ensure_ascii=False, indent=2)
    if args.write:
        args.write.write_text(text + "\n", encoding="utf-8")
        print(f"wrote {args.write}")
    if args.check or not args.write:
        print(text)
    if not CATALOG.is_file():
        print("catalog missing", file=sys.stderr)
        return 1
    if fp["id_count"] < 1:
        print("no shelf IDs parsed", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
