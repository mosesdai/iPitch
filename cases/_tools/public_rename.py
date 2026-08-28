#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""对外称谓：
- 禁止 iPod / PitchVision → disruptive - 跳出盒子
- Max 缺口 → BD经验缺口
"""

from __future__ import annotations

import re

LABEL = "disruptive - 跳出盒子"
SHORT = "跳出盒子"
BD_GAP = "BD经验缺口"


def public_rename(text: str) -> str:
    reps = [
        # —— BD经验缺口（原 Max 缺口）——
        ("Max 缺口审计", f"{BD_GAP}审计"),
        ("Max 缺口", BD_GAP),
        ("MAX GAP 审计", f"{BD_GAP}审计"),
        ("Max 公开资料角度", "BD经验公开资料角度"),
        ("Max 角度", "BD经验角度"),
        ("Max 要求", "BD经验要求"),
        ("Max 底座", "BD经验底座"),
        # —— disruptive - 跳出盒子 ——
        ("iPod / PitchVision", LABEL),
        ("PitchVision", LABEL),
        ("Pitchvision", LABEL),
        ("pitchvision 新品类", f"{LABEL} 新品类"),
        ("两个 pitchvision", f"两条 {LABEL}"),
        ("两个 PitchVision", f"两条 {LABEL}"),
        ("两个 iPod", f"两条 {LABEL}"),
        ("iPod 创意轨", LABEL),
        ("iPod 索引", f"{SHORT} · 索引"),
        ("iPod 类比", "disruptive 类比"),
        ("iPod 门禁", "disruptive 门禁"),
        ("iPod 门闸", "disruptive 门闸"),
        ("iPod test", "disruptive 检验"),
        ("iPod 检验", "disruptive 检验"),
        ("一句话 iPod", "一句话 disruptive"),
        ("iPod 卡", f"{SHORT}卡"),
        ("③ iPod", f"③ {LABEL}"),
        ("iPod 1", f"{SHORT} 1"),
        ("iPod 2", f"{SHORT} 2"),
        ("iPod式", "disruptive（跳出盒子）式"),
        ("iPod 式", "disruptive（跳出盒子）式"),
        ("+ iPod", f"+ {LABEL}"),
        ("≥2 个 iPod", f"≥2 条 {LABEL}"),
        ("创意 iPod", f"创意 {LABEL}"),
        ("iPod 路径", f"{LABEL} 路径"),
        ("iPod 新品类", f"{LABEL} 新品类"),
        ("disruptive · 跳出盒子", LABEL),  # 统一中间点 → 用户指定连字符
    ]
    for a, b in reps:
        text = text.replace(a, b)
    # 剩余独立 iPod（避免误伤 URL / 路径）
    text = re.sub(r"(?<![A-Za-z/])iPod(?![A-Za-z])", LABEL, text)
    # 可见文案里的 Pitchvision（保留 pitchvision/ 路径与文件名）
    text = re.sub(
        r"(?<![A-Za-z/_.\-])Pitchvision(?![A-Za-z])",
        LABEL,
        text,
    )
    text = re.sub(
        r"(?<![A-Za-z/_.\-])pitchvision(?![A-Za-z/\-_])",
        LABEL,
        text,
    )
    # 折叠重复称谓（iPod / PitchVision 双替换残留）
    text = text.replace(f"{LABEL} / {LABEL}", LABEL)
    text = text.replace(f"{LABEL}/{LABEL}", LABEL)
    return text
