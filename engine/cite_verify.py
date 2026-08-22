"""Programmatic citation verify: fetch URL, check excerpt appears in body.

Stage-1 gate. Agents must write parseable citation blocks; orchestrator verifies.
"""

from __future__ import annotations

import html
import json
import re
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass, field
from pathlib import Path

USER_AGENT = "iPitchEngineCiteVerify/0.1 (+local; stage-1)"
TIMEOUT_SEC = 20
MAX_BYTES = 2_000_000

# Paired blocks (Chinese or English keys), order-flexible within a short window.
_URL_LINE = re.compile(
    r"(?:来源|URL|url|source|Source)\s*[:：]\s*(https?://[^\s\)\]＞>]+)",
    re.IGNORECASE,
)
_EXCERPT_LINE = re.compile(
    r"(?:摘录|原文|excerpt|Excerpt|quote|Quote)\s*[:：]\s*[「『\"']?(.*?)[」』\"']?\s*$",
    re.IGNORECASE,
)
# Inline: URL then excerpt on same / nearby lines already covered; also bare
# 「https://…」 with following 摘录 line handled by window scan.


@dataclass
class Citation:
    url: str
    excerpt: str
    file: str
    line: int


@dataclass
class CitationCheck:
    url: str
    excerpt: str
    file: str
    line: int
    status: str  # PASS | FAIL | SKIP
    detail: str


@dataclass
class CitationReport:
    checks: list[CitationCheck] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        if not self.checks:
            return False
        return all(c.status == "PASS" for c in self.checks)

    @property
    def summary(self) -> str:
        if not self.checks:
            return "no citations found (need ≥1 verifiable 来源/摘录 pair)"
        n_ok = sum(1 for c in self.checks if c.status == "PASS")
        n_fail = sum(1 for c in self.checks if c.status == "FAIL")
        n_skip = sum(1 for c in self.checks if c.status == "SKIP")
        return f"{n_ok} pass / {n_fail} fail / {n_skip} skip (of {len(self.checks)})"

    def to_markdown(self) -> str:
        lines = [
            "# citation_report",
            "",
            f"**summary:** {self.summary}",
            "",
            "| status | file:line | url | detail |",
            "|--------|-----------|-----|--------|",
        ]
        for c in self.checks:
            url_short = c.url if len(c.url) < 60 else c.url[:57] + "..."
            detail = c.detail.replace("|", "\\|")
            lines.append(
                f"| `{c.status}` | `{c.file}:{c.line}` | {url_short} | {detail} |"
            )
        lines.append("")
        return "\n".join(lines)

    def to_json(self) -> str:
        return json.dumps(
            {"summary": self.summary, "checks": [asdict(c) for c in self.checks]},
            ensure_ascii=False,
            indent=2,
        )


def extract_citations(artifacts_dir: Path) -> list[Citation]:
    found: list[Citation] = []
    for path in sorted(artifacts_dir.rglob("*.md")):
        rel = str(path.relative_to(artifacts_dir))
        lines = path.read_text(encoding="utf-8").splitlines()
        i = 0
        while i < len(lines):
            um = _URL_LINE.search(lines[i])
            if um:
                url = um.group(1).rstrip(".,;，。；")
                excerpt = ""
                # look same line after URL, or next 3 lines
                rest = lines[i][um.end() :]
                em_same = _EXCERPT_LINE.search(rest)
                if em_same and em_same.group(1).strip():
                    excerpt = em_same.group(1).strip()
                else:
                    for j in range(i + 1, min(i + 4, len(lines))):
                        em = _EXCERPT_LINE.search(lines[j])
                        if em and em.group(1).strip():
                            excerpt = em.group(1).strip()
                            break
                        # also allow reverse order: 摘录 then 来源 already passed;
                        # handle 摘录-first below
                if excerpt:
                    found.append(Citation(url=url, excerpt=excerpt, file=rel, line=i + 1))
                i += 1
                continue

            em = _EXCERPT_LINE.search(lines[i])
            if em and em.group(1).strip():
                excerpt = em.group(1).strip()
                url = ""
                for j in range(i + 1, min(i + 4, len(lines))):
                    um2 = _URL_LINE.search(lines[j])
                    if um2:
                        url = um2.group(1).rstrip(".,;，。；")
                        break
                if url:
                    found.append(Citation(url=url, excerpt=excerpt, file=rel, line=i + 1))
            i += 1
    return found


def _strip_html(raw: bytes, content_type: str) -> str:
    text = raw.decode("utf-8", errors="replace")
    if "html" in content_type.lower() or "<html" in text[:500].lower():
        text = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", text)
        text = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", text)
        text = re.sub(r"(?s)<[^>]+>", " ", text)
        text = html.unescape(text)
    return text


def _normalize(s: str) -> str:
    s = s.replace("\u00a0", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def fetch_text(url: str) -> tuple[str, str]:
    """Return (body_text, detail_or_error). detail empty on success."""
    if url.lower().endswith(".pdf") or "/static-files/" in url.lower() and url.lower().endswith(".pdf"):
        return "", "pdf_not_supported_yet"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,*/*"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as resp:
            raw = resp.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                return "", "response_too_large"
            ctype = resp.headers.get("Content-Type", "")
            if "pdf" in ctype.lower():
                return "", "pdf_not_supported_yet"
            return _strip_html(raw, ctype), ""
    except urllib.error.HTTPError as e:
        return "", f"http_{e.code}"
    except urllib.error.URLError as e:
        return "", f"url_error:{e.reason}"
    except Exception as e:  # noqa: BLE001 — gate must never crash run
        return "", f"error:{type(e).__name__}"


def verify_citation(c: Citation) -> CitationCheck:
    if "example.invalid" in c.url or "CITATION_FAKE" in c.excerpt:
        return CitationCheck(
            url=c.url,
            excerpt=c.excerpt,
            file=c.file,
            line=c.line,
            status="FAIL",
            detail="toy_or_invalid_host",
        )
    body, err = fetch_text(c.url)
    if err:
        status = "SKIP" if err == "pdf_not_supported_yet" else "FAIL"
        return CitationCheck(
            url=c.url,
            excerpt=c.excerpt,
            file=c.file,
            line=c.line,
            status=status,
            detail=err,
        )
    needle = _normalize(c.excerpt)
    hay = _normalize(body)
    if len(needle) < 4:
        return CitationCheck(
            url=c.url,
            excerpt=c.excerpt,
            file=c.file,
            line=c.line,
            status="FAIL",
            detail="excerpt_too_short",
        )
    # Allow ellipsis-split excerpts: each segment must appear
    parts = [p.strip() for p in re.split(r"\.\.\.|…", needle) if p.strip()]
    if all(p in hay for p in parts):
        return CitationCheck(
            url=c.url,
            excerpt=c.excerpt,
            file=c.file,
            line=c.line,
            status="PASS",
            detail="excerpt_found",
        )
    return CitationCheck(
        url=c.url,
        excerpt=c.excerpt,
        file=c.file,
        line=c.line,
        status="FAIL",
        detail="excerpt_not_in_page",
    )


def verify_artifacts(artifacts_dir: Path) -> CitationReport:
    citations = extract_citations(artifacts_dir)
    report = CitationReport()
    for c in citations:
        report.checks.append(verify_citation(c))
    return report


def write_report(run_dir: Path, report: CitationReport) -> None:
    (run_dir / "citation_report.md").write_text(report.to_markdown(), encoding="utf-8")
    (run_dir / "citation_report.json").write_text(report.to_json(), encoding="utf-8")
