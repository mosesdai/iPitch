#!/usr/bin/env python3
"""iPitch engine: R1 pipeline + R2/R3 awaiting_input lifecycle.

R1:
  python3 -m engine.run --mode demo|fail|fail-v16|prompts

R2/R3:
  python3 -m engine.run --promote r2 --from runs/<r1>
  python3 -m engine.run --continue runs/<r2>          # hangs if fields empty
  python3 -m engine.run --demo-fill-input runs/<r2>
  python3 -m engine.run --continue runs/<r2>          # evolve+shelf
  python3 -m engine.run --promote r3 --from runs/<r2>
  ...
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None  # type: ignore

from engine.envelope import parse_envelope
from engine.fixtures import (
    close_envelope,
    compose_envelope,
    compose_envelope_missing_primary,
    evolve_envelope,
    ifalsify_envelope,
    knife_envelope,
    research_envelope,
    research_envelope_with_fake_citation,
    research_envelope_wrong_excerpt,
    shelf_envelope,
    shelf_envelope_with_ipod_leak,
)
from engine.gates import Passport, run_gates
from engine.lifecycle import (
    check_input,
    demo_fill,
    load_run_meta,
    load_sales_input,
    merge_sales_input,
    promote,
    save_run_meta,
)
from engine.round_gates import run_r2_gates, run_r3_gates

ROOT = Path(__file__).resolve().parent.parent
ENGINE = Path(__file__).resolve().parent
SKILLS = ENGINE / "skills"
RUNS = ROOT / "runs"
THRESHOLDS_PATH = ENGINE / "thresholds.yaml"
CATALOG = ROOT / "references" / "shelf" / "catalog_starter.md"

R1_STAGES = ("research", "ifalsify", "compose", "knife")
R2_STAGES = ("evolve", "shelf")
R3_STAGES = ("close",)

SKILL_DIR = {
    "research": "ipitch-research",
    "ifalsify": "ipitch-ifalsify",
    "compose": "ipitch-compose",
    "knife": "ipitch-knife",
    "evolve": "ipitch-evolve",
    "shelf": "ipitch-shelf",
    "close": "ipitch-close",
}


def load_thresholds() -> dict:
    raw = THRESHOLDS_PATH.read_text(encoding="utf-8")
    if yaml is not None:
        return yaml.safe_load(raw)
    return {
        "min_chars": {
            "research_total": 400,
            "ifalsify": 200,
            "knife": 200,
            "one_pager": 300,
            "primary": 200,
            "max_gap": 150,
        },
        "soft_chars": {"research_total": 8000},
        "soft_fail": False,
        "required_files": {
            "research": [
                "research/README.md",
                "research/01_IR_financial.md",
                "research/09_not_for_pitch.md",
            ],
            "ifalsify": ["ifalsify_report.md"],
            "compose": [
                "ONE_PAGER.md",
                "PRIMARY_REQUIRED.md",
                "MAX_GAP_AUDIT.md",
                "html/index.html",
            ],
            "knife": ["B_knife.md"],
        },
        "allowed_prefixes": [
            "research/",
            "B_knife.md",
            "ifalsify_report.md",
            "00_charter.md",
            "ONE_PAGER.md",
            "PRIMARY_REQUIRED.md",
            "MAX_GAP_AUDIT.md",
            "html/",
            "R2_evolved_report.md",
            "R2_shelf_recommendations.md",
            "R3_close_pack.md",
        ],
        "citation": {"min_count": 1},
    }


def path_allowed(rel: str, allowed: list[str]) -> bool:
    for a in allowed:
        if a.endswith("/"):
            if rel.startswith(a):
                return True
        elif rel == a:
            return True
    return False


def write_artifacts(artifacts: Path, files: dict[str, str], allowed: list[str]) -> list[str]:
    errors = []
    for rel, content in files.items():
        if not path_allowed(rel, allowed):
            errors.append(f"path not allowed: {rel}")
            continue
        dest = artifacts / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content, encoding="utf-8")
    return errors


def build_prompt(stage: str, company: str, run_dir: Path) -> str:
    skill_path = SKILLS / SKILL_DIR[stage] / "SKILL.md"
    agents = SKILLS / "AGENTS.md"
    envelope_ref = SKILLS / "reference" / "output-envelope.md"
    cite_ref = SKILLS / "reference" / "citation-format.md"
    parts = [
        f"# Stage: {stage}",
        f"# Company: {company}",
        f"# Run: {run_dir.name}",
        "",
        "## AGENTS.md",
        agents.read_text(encoding="utf-8") if agents.is_file() else "(missing)",
        "",
        "## SKILL",
        skill_path.read_text(encoding="utf-8") if skill_path.is_file() else "(missing)",
        "",
        "## Envelope contract",
        envelope_ref.read_text(encoding="utf-8") if envelope_ref.is_file() else "(missing)",
        "",
        "## Citation format",
        cite_ref.read_text(encoding="utf-8") if cite_ref.is_file() else "(missing)",
        "",
        "## Charter / sales_input",
    ]
    charter = run_dir / "artifacts" / "00_charter.md"
    if charter.is_file():
        parts.append(charter.read_text(encoding="utf-8"))
    si = run_dir / "sales_input.json"
    if si.is_file():
        parts.append("### sales_input.json")
        parts.append(si.read_text(encoding="utf-8"))

    art = run_dir / "artifacts"
    if art.is_dir():
        parts.append("")
        parts.append("## Artifacts on disk")
        for p in sorted(art.rglob("*")):
            if not p.is_file() or p.suffix.lower() not in {".md", ".html"}:
                continue
            rel = p.relative_to(art)
            parts.append(f"### {rel}")
            parts.append(p.read_text(encoding="utf-8")[:6000])

    parts.append("")
    parts.append("Produce ONLY envelope blocks. Do not write the filesystem yourself.")
    return "\n".join(parts)


def r1_stage_text(mode: str, stage: str, company: str) -> str:
    if stage == "research":
        if mode == "fail":
            return research_envelope_with_fake_citation(company)
        if mode == "wrong-excerpt":
            return research_envelope_wrong_excerpt(company)
        return research_envelope(company)
    if stage == "ifalsify":
        return ifalsify_envelope(company)
    if stage == "compose":
        if mode == "fail-v16":
            return compose_envelope_missing_primary(company)
        return compose_envelope(company)
    if stage == "knife":
        return knife_envelope(company)
    raise ValueError(stage)


def write_passport(run_dir: Path, passport: Passport) -> None:
    (run_dir / "quality_passport.md").write_text(passport.to_markdown(), encoding="utf-8")
    (run_dir / "passport.json").write_text(
        json.dumps(
            {
                "verdict": passport.verdict,
                "gates": [
                    {
                        "name": g.name,
                        "passed": g.passed,
                        "detail": g.detail,
                        "soft": getattr(g, "soft", False),
                    }
                    for g in passport.gates
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def print_passport(passport: Passport, run_dir: Path, log: list[str] | None = None) -> int:
    if log:
        print("\n".join(log))
    print(f"{passport.verdict} → {run_dir}")
    for g in passport.gates:
        if getattr(g, "soft", False) and not g.passed:
            mark = "⚠"
        elif g.passed:
            mark = "✓"
        else:
            mark = "✗"
        print(f"  {mark} {g.name}: {g.detail}")
    return 0 if passport.verdict == "GREEN" else 2


def apply_stage_envelope(
    run_dir: Path,
    stage: str,
    raw: str,
    allowed: list[str],
    log: list[str],
) -> bool:
    (run_dir / "envelopes").mkdir(exist_ok=True)
    (run_dir / "envelopes" / f"{stage}.txt").write_text(raw, encoding="utf-8")
    parsed = parse_envelope(raw)
    if not parsed.ok:
        log.append(f"[{stage}] ENVELOPE FAIL: {parsed.errors}")
        return False
    werr = write_artifacts(run_dir / "artifacts", parsed.files, allowed)
    if werr:
        log.append(f"[{stage}] WRITE FAIL: {werr}")
        return False
    log.append(f"[{stage}] wrote {len(parsed.files)} file(s)")
    return True


def run_r1(company: str, mode: str, *, offline: bool) -> int:
    thresholds = load_thresholds()
    allowed = thresholds.get("allowed_prefixes", [])
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    slug = "".join(c if c.isalnum() else "-" for c in company).strip("-")[:40] or "co"
    run_id = f"{stamp}_{slug}_{mode}"
    run_dir = RUNS / run_id
    artifacts = run_dir / "artifacts"
    prompts = run_dir / "prompts"
    artifacts.mkdir(parents=True, exist_ok=True)
    prompts.mkdir(parents=True, exist_ok=True)

    (artifacts / "00_charter.md").write_text(
        f"# 00_charter\n\n- company: {company}\n- mode: cold\n"
        f"- engine_mode: {mode}\n- created: {stamp}\n",
        encoding="utf-8",
    )
    meta = {
        "run_id": run_id,
        "company": company,
        "round": "R1",
        "status": "running",
        "mode": mode,
        "stages": list(R1_STAGES),
        "created": stamp,
        "offline": offline,
    }
    save_run_meta(run_dir, meta)

    if mode == "prompts":
        for stage in R1_STAGES:
            (prompts / f"{stage}.md").write_text(
                build_prompt(stage, company, run_dir), encoding="utf-8"
            )
        (run_dir / "envelopes").mkdir(exist_ok=True)
        meta["status"] = "prompts_ready"
        save_run_meta(run_dir, meta)
        print(f"prompts_only → {run_dir}")
        return 0

    log: list[str] = []
    for stage in R1_STAGES:
        (prompts / f"{stage}.md").write_text(
            build_prompt(stage, company, run_dir), encoding="utf-8"
        )
        raw = r1_stage_text(mode, stage, company)
        if not apply_stage_envelope(run_dir, stage, raw, allowed, log):
            meta["status"] = "failed"
            save_run_meta(run_dir, meta)
            print("\n".join(log))
            print(f"RED → {run_dir}")
            return 1

    passport = run_gates(
        artifacts, thresholds, run_dir=run_dir, skip_citation_fetch=offline
    )
    write_passport(run_dir, passport)
    meta["status"] = "completed" if passport.verdict == "GREEN" else "failed"
    save_run_meta(run_dir, meta)
    return print_passport(passport, run_dir, log)


def cmd_promote(round_name: str, parent: Path) -> int:
    parent = parent.resolve()
    if not (parent / "run.json").is_file():
        print(f"not a run dir: {parent}")
        return 1
    dest = promote(parent, round_name.upper(), RUNS)
    meta = load_run_meta(dest)
    print(f"awaiting_input → {dest}")
    print(f"round={meta['round']} parent={meta['parent_run']}")
    print("Fill sales_input.json then: python3 -m engine.run --continue", dest)
    for m in meta.get("input_missing", []):
        print(f"  · missing: {m}")
    return 0


def cmd_demo_fill(run_dir: Path) -> int:
    run_dir = run_dir.resolve()
    meta = load_run_meta(run_dir)
    round_name = meta.get("round", "R2")
    merge_sales_input(run_dir, demo_fill(round_name))
    meta = load_run_meta(run_dir)
    print(f"filled → status={meta['status']}")
    if meta["status"] == "awaiting_input":
        print("still missing:", meta.get("input_missing"))
        return 1
    return 0


def cmd_continue(run_dir: Path, *, offline: bool, leak_ipod: bool = False) -> int:
    run_dir = run_dir.resolve()
    meta = load_run_meta(run_dir)
    round_name = meta.get("round", "R2")
    if round_name == "R1":
        print("R1 runs use --mode demo/prompts, not --continue")
        return 1

    data = load_sales_input(run_dir)
    gate = check_input(round_name, data)
    if not gate.complete:
        meta["status"] = "awaiting_input"
        meta["input_missing"] = gate.missing
        save_run_meta(run_dir, meta)
        print(f"awaiting_input → {run_dir}")
        print("Refusing to invent reports. Missing:")
        for m in gate.missing:
            print(f"  · {m}")
        return 3

    company = meta.get("company", "unknown")
    thresholds = load_thresholds()
    # extend allowed for R2/R3 files
    allowed = list(thresholds.get("allowed_prefixes", []))
    for extra in (
        "R2_evolved_report.md",
        "R2_shelf_recommendations.md",
        "R3_close_pack.md",
    ):
        if extra not in allowed:
            allowed.append(extra)

    meta["status"] = "running"
    save_run_meta(run_dir, meta)
    log: list[str] = []
    stages = R2_STAGES if round_name == "R2" else R3_STAGES
    prompts = run_dir / "prompts"
    prompts.mkdir(exist_ok=True)

    for stage in stages:
        (prompts / f"{stage}.md").write_text(
            build_prompt(stage, company, run_dir), encoding="utf-8"
        )
        if stage == "evolve":
            raw = evolve_envelope(company)
        elif stage == "shelf":
            raw = shelf_envelope_with_ipod_leak(company) if leak_ipod else shelf_envelope(company)
        elif stage == "close":
            raw = close_envelope(company)
        else:
            raise ValueError(stage)
        if not apply_stage_envelope(run_dir, stage, raw, allowed, log):
            meta["status"] = "failed"
            save_run_meta(run_dir, meta)
            print("\n".join(log))
            return 1

    artifacts = run_dir / "artifacts"
    if round_name == "R2":
        passport = run_r2_gates(artifacts, CATALOG)
    else:
        passport = run_r3_gates(artifacts)
    write_passport(run_dir, passport)
    meta["status"] = "completed" if passport.verdict == "GREEN" else "failed"
    save_run_meta(run_dir, meta)
    # clear awaiting marker file on success
    awaiting = run_dir / "AWAITING_INPUT.md"
    if passport.verdict == "GREEN" and awaiting.is_file():
        awaiting.unlink()
    return print_passport(passport, run_dir, log)


def cmd_set_input(run_dir: Path, json_path: Path) -> int:
    updates = json.loads(json_path.read_text(encoding="utf-8"))
    merge_sales_input(run_dir.resolve(), updates)
    meta = load_run_meta(run_dir.resolve())
    print(f"status={meta['status']}")
    return 0 if meta["status"] == "ready" else 3


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="iPitch engine")
    p.add_argument("--company", default="DemoCo")
    p.add_argument(
        "--mode",
        choices=("demo", "fail", "wrong-excerpt", "fail-v16", "prompts"),
        default=None,
    )
    p.add_argument("--offline", action="store_true")
    p.add_argument("--promote", choices=("r2", "r3"), help="Fork parent run into awaiting_input")
    p.add_argument("--from", dest="from_run", type=Path, help="Parent run for --promote")
    p.add_argument("--continue", dest="continue_run", type=Path, help="Resume if input complete")
    p.add_argument("--demo-fill-input", type=Path, help="Fill demo sales_input for a run")
    p.add_argument("--set-input", type=Path, help="Run dir to merge JSON into sales_input")
    p.add_argument("--input-json", type=Path, help="JSON file for --set-input")
    p.add_argument(
        "--leak-ipod",
        action="store_true",
        help="With --continue R2: use shelf fixture that leaks iPod (expect RED)",
    )
    p.add_argument("--apply", type=Path)
    p.add_argument("--apply-stage", choices=R1_STAGES)
    p.add_argument("--run", type=Path)
    p.add_argument(
        "--portable",
        nargs="*",
        metavar="CASE",
        help="Build off-machine single-file HTML (default: byd geely-international)",
    )
    p.add_argument(
        "--lobby-floor",
        nargs="*",
        metavar="CASE",
        help="Run lobby structure + public naming floor (default: byd geely-international)",
    )
    args = p.parse_args(argv)

    if args.portable is not None:
        return cmd_portable(args.portable)
    if args.lobby_floor is not None:
        return cmd_lobby_floor(args.lobby_floor)

    if args.promote:
        if not args.from_run:
            print("--promote requires --from")
            return 1
        return cmd_promote(args.promote, args.from_run)
    if args.demo_fill_input:
        return cmd_demo_fill(args.demo_fill_input)
    if args.set_input:
        if not args.input_json:
            print("--set-input requires --input-json")
            return 1
        return cmd_set_input(args.set_input, args.input_json)
    if args.continue_run:
        return cmd_continue(args.continue_run, offline=args.offline, leak_ipod=args.leak_ipod)

    if args.apply:
        return apply_envelopes_r1(args.apply.resolve(), offline=args.offline)
    if args.apply_stage:
        if not args.run:
            print("--apply-stage requires --run")
            return 1
        return apply_envelopes_r1(
            args.run.resolve(), offline=args.offline, only_stage=args.apply_stage
        )

    if args.mode is None:
        args.mode = "demo"

    return run_r1(args.company, args.mode, offline=args.offline)


def cmd_portable(cases: list[str]) -> int:
    """L6: productize cases/_tools/build_portable_showcase.py behind engine CLI."""
    import runpy

    tools = ROOT / "cases" / "_tools" / "build_portable_showcase.py"
    if not tools.is_file():
        print(f"missing {tools}")
        return 1
    # Script currently builds both gold cases; optional filter later.
    runpy.run_path(str(tools), run_name="__main__")
    if cases:
        print(f"(note) requested {cases}; builder currently emits byd + geely-international)")
    return 0


def cmd_lobby_floor(cases: list[str]) -> int:
    tools = ROOT / "cases" / "_tools" / "check_lobby_floor.py"
    if not tools.is_file():
        print(f"missing {tools}")
        return 1
    import runpy

    sys.argv = [str(tools)] + (cases or [])
    try:
        runpy.run_path(str(tools), run_name="__main__")
    except SystemExit as e:
        code = e.code
        return int(code) if isinstance(code, int) else (1 if code else 0)
    return 0


def apply_envelopes_r1(
    run_dir: Path, *, offline: bool, only_stage: str | None = None
) -> int:
    thresholds = load_thresholds()
    allowed = thresholds.get("allowed_prefixes", [])
    artifacts = run_dir / "artifacts"
    artifacts.mkdir(parents=True, exist_ok=True)
    stages = (only_stage,) if only_stage else R1_STAGES
    for stage in stages:
        path = run_dir / "envelopes" / f"{stage}.txt"
        if not path.is_file():
            print(f"missing {path}")
            return 1
        parsed = parse_envelope(path.read_text(encoding="utf-8"))
        if not parsed.ok:
            print(parsed.errors)
            return 1
        err = write_artifacts(artifacts, parsed.files, allowed)
        if err:
            print(err)
            return 1
        print(f"[{stage}] wrote {len(parsed.files)} file(s)")
    if only_stage and only_stage != R1_STAGES[-1]:
        return 0
    passport = run_gates(artifacts, thresholds, run_dir=run_dir, skip_citation_fetch=offline)
    write_passport(run_dir, passport)
    meta = load_run_meta(run_dir) if (run_dir / "run.json").is_file() else {}
    meta["status"] = "completed" if passport.verdict == "GREEN" else "failed"
    meta.setdefault("round", "R1")
    save_run_meta(run_dir, meta)
    return print_passport(passport, run_dir)


if __name__ == "__main__":
    sys.exit(main())
