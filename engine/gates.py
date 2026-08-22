"""Programmatic gates → quality_passport (green/red + soft WARN)."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from engine.cite_verify import verify_artifacts, write_report
from engine.v16_checks import run_v16_structure


def _cjk_len(text: str) -> int:
    return len(re.findall(r"[\u4e00-\u9fffA-Za-z0-9]", text))


@dataclass
class GateResult:
    name: str
    passed: bool
    detail: str
    soft: bool = False  # soft miss → WARN, does not flip RED unless soft_fail


@dataclass
class Passport:
    verdict: str  # GREEN | RED
    gates: list[GateResult] = field(default_factory=list)

    def to_markdown(self) -> str:
        lines = [
            "# quality_passport",
            "",
            f"**verdict:** `{self.verdict}`",
            "",
            "| gate | pass | detail |",
            "|------|------|--------|",
        ]
        for g in self.gates:
            if g.soft and not g.passed:
                mark = "WARN"
            elif g.passed:
                mark = "PASS"
            else:
                mark = "FAIL"
            lines.append(f"| `{g.name}` | {mark} | {g.detail} |")
        lines.append("")
        return "\n".join(lines)


def run_gates(
    artifacts_dir: Path,
    thresholds: dict[str, Any],
    *,
    run_dir: Path | None = None,
    skip_citation_fetch: bool = False,
) -> Passport:
    gates: list[GateResult] = []
    required = thresholds.get("required_files", {})
    mins = thresholds.get("min_chars", {})

    all_required: list[str] = []
    for _stage, paths in required.items():
        all_required.extend(paths)

    missing = [p for p in all_required if not (artifacts_dir / p).is_file()]
    gates.append(
        GateResult(
            name="required_files",
            passed=not missing,
            detail="ok" if not missing else f"missing: {', '.join(missing)}",
        )
    )

    def depth_gate(name: str, text: str | None, key: str) -> None:
        floor = int(mins.get(key, 0))
        if floor <= 0:
            return
        if text is None:
            gates.append(GateResult(name, False, "file missing"))
            return
        n = _cjk_len(text)
        gates.append(GateResult(name, n >= floor, f"{n} chars (min {floor})"))

    research_files = sorted(artifacts_dir.glob("research/*.md"))
    research_text = "\n".join(p.read_text(encoding="utf-8") for p in research_files) if research_files else ""
    depth_gate("research_depth", research_text or None, "research_total")

    soft = thresholds.get("soft_chars", {})
    soft_target = int(soft.get("research_total", 0))
    soft_fail = bool(thresholds.get("soft_fail", False))
    if soft_target > 0 and research_text:
        r_n = _cjk_len(research_text)
        soft_ok = r_n >= soft_target
        gates.append(
            GateResult(
                name="research_depth_soft",
                passed=soft_ok,
                detail=f"{r_n} chars (soft target {soft_target}; 香飘飘取向)",
                soft=not soft_fail,
            )
        )

    ifalsify_path = artifacts_dir / "ifalsify_report.md"
    depth_gate(
        "ifalsify_depth",
        ifalsify_path.read_text(encoding="utf-8") if ifalsify_path.is_file() else None,
        "ifalsify",
    )

    for rel, key, gname in (
        ("ONE_PAGER.md", "one_pager", "one_pager_depth"),
        ("PRIMARY_REQUIRED.md", "primary", "primary_depth"),
        ("MAX_GAP_AUDIT.md", "max_gap", "max_gap_depth"),
        ("B_knife.md", "knife", "knife_depth"),
    ):
        p = artifacts_dir / rel
        depth_gate(gname, p.read_text(encoding="utf-8") if p.is_file() else None, key)

    # citation verify
    cite_cfg = thresholds.get("citation", {})
    min_cites = int(cite_cfg.get("min_count", 1))
    if skip_citation_fetch:
        gates.append(GateResult("citation_verify", True, "skipped (--offline)"))
    else:
        report = verify_artifacts(artifacts_dir)
        if run_dir is not None:
            write_report(run_dir, report)
        cite_ok = len(report.checks) >= min_cites and all(c.status == "PASS" for c in report.checks)
        detail = report.summary
        if len(report.checks) < min_cites:
            detail = f"{report.summary}; need ≥{min_cites}"
        gates.append(GateResult("citation_verify", cite_ok, detail))

    if ifalsify_path.is_file():
        t = ifalsify_path.read_text(encoding="utf-8")
        has_v = any(v in t for v in ("CONDITIONAL", "KILL", "PIVOT"))
        gates.append(
            GateResult(
                "ifalsify_verdict_token",
                has_v,
                "found CONDITIONAL|KILL|PIVOT" if has_v else "missing verdict token",
            )
        )
    else:
        gates.append(GateResult("ifalsify_verdict_token", False, "file missing"))

    # v1.6 structure
    for c in run_v16_structure(artifacts_dir):
        gates.append(GateResult(name=c.name, passed=c.passed, detail=c.detail))

    # soft gates excluded from RED unless soft_fail
    verdict_gates = []
    for g in gates:
        if g.soft and not soft_fail:
            continue
        verdict_gates.append(g)
    verdict = "GREEN" if all(g.passed for g in verdict_gates) else "RED"
    return Passport(verdict=verdict, gates=gates)
