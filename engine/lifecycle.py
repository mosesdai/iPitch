"""R2/R3 human-gate: awaiting_input until required sales fields are filled."""

from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

R2_FIELDS: dict[str, str] = {
    "customer_quote": "客户原话（verbatim）",
    "budget_path": "预算科目 / fund 路径（media vs activation 等）",
    "decision_chain": "决策链 + 否决人",
    "knife_judgment": "对 R1 刀的判断（采纳 / 修改 / 放弃）",
    "competitor_moves": "竞品最近动作",
    "cannot_sell": "我方不能卖的",
}

R3_FIELDS: dict[str, str] = {
    "budget_band": "客户披露的预算档（区间/科目）",
    "ipod_separate": "愿不愿单独给 iPod 立项（是/否/观望 + 一句）",
}

SHELF_ID_RE = re.compile(r"\bSH-[A-Z]+-\d{3}\b")
IPOD_LEAK_RE = re.compile(r"\biPod\b|\bpitchvision\b|\bbespoke\b", re.IGNORECASE)


@dataclass
class InputGate:
    round: str
    complete: bool
    missing: list[str]
    filled: dict[str, str]


def required_fields(round_name: str) -> dict[str, str]:
    if round_name == "R2":
        return R2_FIELDS
    if round_name == "R3":
        return R3_FIELDS
    return {}


def check_input(round_name: str, data: dict[str, Any] | None) -> InputGate:
    req = required_fields(round_name)
    data = data or {}
    missing = []
    filled: dict[str, str] = {}
    for key, label in req.items():
        val = data.get(key)
        if val is None or str(val).strip() == "" or str(val).strip().lower() in {"tbd", "todo", "未知"}:
            missing.append(f"{key}（{label}）")
        else:
            filled[key] = str(val).strip()
    return InputGate(round=round_name, complete=not missing, missing=missing, filled=filled)


def load_run_meta(run_dir: Path) -> dict[str, Any]:
    path = run_dir / "run.json"
    if not path.is_file():
        raise FileNotFoundError(f"no run.json in {run_dir}")
    return json.loads(path.read_text(encoding="utf-8"))


def save_run_meta(run_dir: Path, meta: dict[str, Any]) -> None:
    (run_dir / "run.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def write_input_template(run_dir: Path, round_name: str, existing: dict[str, Any] | None = None) -> Path:
    existing = existing or {}
    req = required_fields(round_name)
    payload = {
        "_readme": f"Fill all keys for {round_name}. Empty / tbd / 未知 → run stays awaiting_input.",
        "_fields": req,
    }
    for k in req:
        payload[k] = existing.get(k, "")
    path = run_dir / "sales_input.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def load_sales_input(run_dir: Path) -> dict[str, Any]:
    path = run_dir / "sales_input.json"
    if not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {k: v for k, v in data.items() if not str(k).startswith("_")}


def merge_sales_input(run_dir: Path, updates: dict[str, Any]) -> dict[str, Any]:
    cur = load_sales_input(run_dir)
    for k, v in updates.items():
        if str(k).startswith("_"):
            continue
        if v is not None and str(v).strip() != "":
            cur[k] = v
    meta = load_run_meta(run_dir)
    round_name = meta.get("round", "R2")
    write_input_template(run_dir, round_name, cur)
    meta["sales_input"] = cur
    gate = check_input(round_name, cur)
    meta["status"] = "ready" if gate.complete else "awaiting_input"
    meta["input_missing"] = gate.missing
    save_run_meta(run_dir, meta)
    return cur


def promote(
    parent_dir: Path,
    round_name: str,
    runs_root: Path,
) -> Path:
    parent = load_run_meta(parent_dir)
    if parent.get("status") not in {"completed", "ready"} and parent.get("round") == "R1":
        # R1 demo sets completed via finalize; allow completed or missing status with passport GREEN
        pass

    company = parent.get("company", "unknown")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    slug = "".join(c if c.isalnum() else "-" for c in company).strip("-")[:40] or "co"
    run_id = f"{stamp}_{slug}_{round_name.lower()}"
    dest = runs_root / run_id
    dest.mkdir(parents=True, exist_ok=False)

    # Snapshot parent artifacts (not passport / citation — those are prior round judgments)
    src_art = parent_dir / "artifacts"
    dst_art = dest / "artifacts"
    if src_art.is_dir():
        shutil.copytree(src_art, dst_art)
    else:
        dst_art.mkdir()

    (dest / "envelopes").mkdir()
    (dest / "prompts").mkdir()

    meta = {
        "run_id": run_id,
        "company": company,
        "round": round_name,
        "status": "awaiting_input",
        "parent_run": parent_dir.name,
        "parent_path": str(parent_dir),
        "created": stamp,
        "sales_input": {},
        "input_missing": list(required_fields(round_name).keys()),
        "stages": ["evolve", "shelf"] if round_name == "R2" else ["close"],
    }
    save_run_meta(dest, meta)
    write_input_template(dest, round_name, {})
    (dest / "AWAITING_INPUT.md").write_text(
        _awaiting_md(round_name, company, run_id),
        encoding="utf-8",
    )
    return dest


def _awaiting_md(round_name: str, company: str, run_id: str) -> str:
    fields = required_fields(round_name)
    lines = [
        f"# awaiting_input · {round_name} · {company}",
        "",
        f"Run `{run_id}` **will not generate** {round_name} reports until sales fields are filled.",
        "This is intentional: blank fields → fabricated completeness.",
        "",
        "## Required fields",
        "",
    ]
    for k, label in fields.items():
        lines.append(f"- `{k}` — {label}")
    lines += [
        "",
        "## How to fill",
        "",
        "```bash",
        f"# edit sales_input.json then:",
        f"python3 -m engine.run --continue runs/{run_id}",
        "",
        "# or demo fill:",
        f"python3 -m engine.run --demo-fill-input runs/{run_id}",
        f"python3 -m engine.run --continue runs/{run_id}",
        "```",
        "",
    ]
    return "\n".join(lines)


def parse_shelf_ids(catalog_path: Path) -> set[str]:
    text = catalog_path.read_text(encoding="utf-8") if catalog_path.is_file() else ""
    return set(SHELF_ID_RE.findall(text))


def check_shelf_recommendations(text: str, known_ids: set[str]) -> list[str]:
    """Return list of gate failure details (empty = ok)."""
    errs: list[str] = []
    # Only inspect ### 组合 A/B/C blocks — 内部对照 may mention iPod safely.
    for m in re.finditer(
        r"(?ms)^###\s*组合\s*[ABC].*?(?=^###\s|^##\s|\Z)",
        text,
    ):
        block = m.group(0)
        if IPOD_LEAK_RE.search(block):
            errs.append("iPod/pitchvision leaked into shelf combo block")
            break
    ids = SHELF_ID_RE.findall(text)
    if not ids:
        errs.append("no shelf IDs found (need SH-… from catalog)")
    for i in set(ids):
        if i not in known_ids:
            errs.append(f"unknown shelf ID: {i}")
    combos = re.findall(r"(?m)^###\s*组合\s*[ABC]", text)
    if len(combos) < 2:
        errs.append(f"need 2–3 shelf combos, found {len(combos)}")
    return errs


def check_evolved_report(text: str) -> list[str]:
    errs = []
    if "首问" not in text and "5 句" not in text and "五句" not in text:
        errs.append("missing 首问 5 句 section")
    # count question-like lines 1-5
    qs = re.findall(r"(?m)^\s*[1-5１-５][\.．、\)]\s+\S", text)
    if len(qs) < 5:
        errs.append(f"need 5 opening questions, found {len(qs)}")
    return errs


def check_close_pack(text: str) -> list[str]:
    errs = []
    for needle in ("预算", "双轨", "Ask", "iPod"):
        if needle not in text:
            errs.append(f"missing section cue: {needle}")
    return errs


def demo_fill(round_name: str) -> dict[str, str]:
    if round_name == "R2":
        return {
            "customer_quote": "我们不要再来一场热闹，要能进经销商考核的东西。",
            "budget_path": "品牌试验池 / activation，不是纯 media",
            "decision_chain": "品牌负责人发起；财务可否决大额；总经理最终点头",
            "knife_judgment": "采纳方向，要求改成可核销小切口",
            "competitor_moves": "竞品在做单场代言，未做系统",
            "cannot_sell": "不能卖未验证的全国大赞助包",
        }
    return {
        "budget_band": "试点 50–80 万 activation；无单独 iPod 预算",
        "ipod_separate": "观望——先货架试点，iPod 须单独立项再议",
    }
