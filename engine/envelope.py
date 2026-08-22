"""Parse ===FILE=== envelopes. Backend (orchestrator) is the only writer."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field


FILE_START = re.compile(r"^===FILE:\s*(.+?)===\s*$")
FILE_END = re.compile(r"^===END:\s*(.+?)===\s*$")
MANIFEST_START = re.compile(r"^===MANIFEST===\s*$")
MANIFEST_END = re.compile(r"^===END MANIFEST===\s*$")


@dataclass
class EnvelopeParseResult:
    files: dict[str, str] = field(default_factory=dict)
    manifest: dict | None = None
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors and bool(self.files)


def parse_envelope(text: str) -> EnvelopeParseResult:
    result = EnvelopeParseResult()
    lines = text.splitlines()
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i]
        m = FILE_START.match(line)
        if m:
            path = m.group(1).strip()
            if ".." in path or path.startswith("/") or path.startswith("~") or "\\" in path:
                result.errors.append(f"illegal path: {path}")
                i += 1
                continue
            body: list[str] = []
            i += 1
            closed = False
            while i < n:
                end = FILE_END.match(lines[i])
                if end:
                    if end.group(1).strip() != path:
                        result.errors.append(
                            f"END path mismatch: expected {path!r}, got {end.group(1).strip()!r}"
                        )
                    closed = True
                    i += 1
                    break
                body.append(lines[i])
                i += 1
            if not closed:
                result.errors.append(f"unclosed FILE block: {path}")
            else:
                result.files[path] = "\n".join(body).rstrip() + ("\n" if body else "")
            continue

        if MANIFEST_START.match(line):
            i += 1
            raw: list[str] = []
            closed = False
            while i < n:
                if MANIFEST_END.match(lines[i]):
                    closed = True
                    i += 1
                    break
                raw.append(lines[i])
                i += 1
            if not closed:
                result.errors.append("unclosed MANIFEST")
            else:
                blob = "\n".join(raw).strip()
                try:
                    result.manifest = json.loads(blob)
                except json.JSONDecodeError as e:
                    result.errors.append(f"manifest JSON: {e}")
            continue

        i += 1

    if not result.files and not result.errors:
        result.errors.append("no ===FILE=== blocks found")

    return result
