"""v1.6 deliverable structure checks (playbook 会前双材料 / sales_gate)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass
class StructCheck:
    name: str
    passed: bool
    detail: str


def _read(artifacts: Path, rel: str) -> str | None:
    p = artifacts / rel
    if not p.is_file():
        return None
    return p.read_text(encoding="utf-8")


def check_primary(text: str) -> list[StructCheck]:
    out: list[StructCheck] = []
    has_3q = "会面三问" in text
    out.append(StructCheck("primary_has_三问_section", has_3q, "会面三问" if has_3q else "missing 会面三问"))

    # exactly/at least 3 numbered questions under that section is hard; count "1.".."3." style
    nums = re.findall(r"(?m)^\s*[1１][\.．、\)]\s+\S", text)
    nums2 = re.findall(r"(?m)^\s*[2２][\.．、\)]\s+\S", text)
    nums3 = re.findall(r"(?m)^\s*[3３][\.．、\)]\s+\S", text)
    ok_n = bool(nums and nums2 and nums3)
    out.append(
        StructCheck(
            "primary_three_questions",
            ok_n,
            "found 1/2/3 question lines" if ok_n else "need numbered 1. 2. 3. questions",
        )
    )

    has_72 = "72h" in text.lower() or "72 小时" in text or "checklist" in text.lower() or "销售 checklist" in text
    out.append(StructCheck("primary_72h_checklist", has_72, "ok" if has_72 else "missing 72h checklist"))

    has_dont = "明确不说" in text
    out.append(StructCheck("primary_明确不说", has_dont, "ok" if has_dont else "missing 明确不说"))

    has_hyp = "假说" in text or ("若真" in text and "若假" in text)
    out.append(StructCheck("primary_hypothesis", has_hyp, "ok" if has_hyp else "missing 假说/若真若假"))
    return out


def check_one_pager(text: str) -> list[StructCheck]:
    out: list[StructCheck] = []
    has_bar = "顶栏" in text or "证伪" in text
    out.append(StructCheck("one_pager_顶栏裁决", has_bar, "ok" if has_bar else "missing 顶栏/证伪"))

    has_v = any(v in text for v in ("CONDITIONAL", "KILL", "PIVOT", "有条件推进", "不推进", "转向"))
    out.append(StructCheck("one_pager_verdict", has_v, "ok" if has_v else "missing verdict token"))

    has_tension = "矛盾" in text or "张力" in text or "三问" in text
    out.append(StructCheck("one_pager_矛盾或三问", has_tension, "ok" if has_tension else "missing 矛盾/三问"))

    has_swot = "SWOT" in text.upper() or "说的" in text or "实际" in text
    out.append(StructCheck("one_pager_判断层", has_swot, "ok" if has_swot else "missing 说vs做/SWOT"))

    no_fake_forecast = "宁空不编" in text or "待核实" in text or "无公司量化" in text or "留空" in text
    out.append(
        StructCheck(
            "one_pager_预测纪律",
            no_fake_forecast,
            "ok" if no_fake_forecast else "state 宁空不编/待核实 for forecasts",
        )
    )
    return out


def check_max_gap(text: str) -> list[StructCheck]:
    out: list[StructCheck] = []
    has_max = "Max" in text or "max" in text or "角度" in text
    out.append(StructCheck("max_gap_mentions_max", has_max, "ok" if has_max else "missing Max 角度"))
    has_table = "|" in text and ("覆盖" in text or "✅" in text or "缺口" in text or "位置" in text)
    out.append(StructCheck("max_gap_coverage_table", has_table, "ok" if has_table else "need coverage table"))
    return out


def check_dual_pack_index(text: str) -> list[StructCheck]:
    out: list[StructCheck] = []
    low = text.lower()
    has_op = "one_pager" in low
    has_research = "research" in low or "iceberg" in low or "研报" in text
    out.append(
        StructCheck(
            "dual_pack_index",
            has_op and has_research,
            "links ONE_PAGER + research" if (has_op and has_research) else "html/index must link BOTH",
        )
    )
    return out


def check_knife_prints_verdict(text: str) -> list[StructCheck]:
    has_v = any(v in text for v in ("CONDITIONAL", "KILL", "PIVOT"))
    return [
        StructCheck(
            "knife_prints_ifalsify",
            has_v,
            "ok" if has_v else "B_knife must print CONDITIONAL|KILL|PIVOT",
        )
    ]


def run_v16_structure(artifacts: Path) -> list[StructCheck]:
    checks: list[StructCheck] = []

    primary = _read(artifacts, "PRIMARY_REQUIRED.md")
    if primary is None:
        checks.append(StructCheck("PRIMARY_REQUIRED.md", False, "file missing"))
    else:
        checks.extend(check_primary(primary))

    one = _read(artifacts, "ONE_PAGER.md")
    if one is None:
        checks.append(StructCheck("ONE_PAGER.md", False, "file missing"))
    else:
        checks.extend(check_one_pager(one))

    gap = _read(artifacts, "MAX_GAP_AUDIT.md")
    if gap is None:
        checks.append(StructCheck("MAX_GAP_AUDIT.md", False, "file missing"))
    else:
        checks.extend(check_max_gap(gap))

    index = _read(artifacts, "html/index.html")
    if index is None:
        checks.append(StructCheck("html/index.html", False, "file missing (dual pack)"))
    else:
        checks.extend(check_dual_pack_index(index))

    knife = _read(artifacts, "B_knife.md")
    if knife is not None:
        checks.extend(check_knife_prints_verdict(knife))

    return checks
