"""Round-specific gates for R2/R3 artifacts."""

from __future__ import annotations

from pathlib import Path

from engine.gates import GateResult, Passport
from engine.lifecycle import (
    check_close_pack,
    check_evolved_report,
    check_shelf_recommendations,
    parse_shelf_ids,
)


def run_r2_gates(artifacts: Path, catalog_path: Path) -> Passport:
    gates: list[GateResult] = []
    evolved = artifacts / "R2_evolved_report.md"
    shelf = artifacts / "R2_shelf_recommendations.md"

    if not evolved.is_file():
        gates.append(GateResult("R2_evolved_report", False, "file missing"))
    else:
        errs = check_evolved_report(evolved.read_text(encoding="utf-8"))
        gates.append(
            GateResult(
                "R2_evolved_opening5",
                not errs,
                "ok" if not errs else "; ".join(errs),
            )
        )

    if not shelf.is_file():
        gates.append(GateResult("R2_shelf_recommendations", False, "file missing"))
    else:
        known = parse_shelf_ids(catalog_path)
        errs = check_shelf_recommendations(shelf.read_text(encoding="utf-8"), known)
        gates.append(
            GateResult(
                "R2_shelf_catalog",
                not errs,
                "ok" if not errs else "; ".join(errs),
            )
        )

    verdict = "GREEN" if all(g.passed for g in gates) else "RED"
    return Passport(verdict=verdict, gates=gates)


def run_r3_gates(artifacts: Path) -> Passport:
    gates: list[GateResult] = []
    close = artifacts / "R3_close_pack.md"
    if not close.is_file():
        gates.append(GateResult("R3_close_pack", False, "file missing"))
    else:
        errs = check_close_pack(close.read_text(encoding="utf-8"))
        gates.append(
            GateResult(
                "R3_close_structure",
                not errs,
                "ok" if not errs else "; ".join(errs),
            )
        )
    verdict = "GREEN" if all(g.passed for g in gates) else "RED"
    return Passport(verdict=verdict, gates=gates)
