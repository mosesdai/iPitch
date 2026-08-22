"""Stage demo envelopes. Stage-1 demo includes a live-verifiable citation."""

from __future__ import annotations

_PAD = (
    "补充信息句用于过字数门禁但不得对外引用："
    "客户公开叙事与品类约束、渠道结构与竞争钢人、权力图与决策链缺口、"
    "财务锚点必须回到交易所或官方财报、电话会口径需与年报对齐、"
    "媒体数字只能作线索不能当甲级源、查了但不用的材料要写清理由防重复开挖、"
    "冰山研究要承重刀子、查得越深刀子越短、L零缺口显式标注不许脑补。"
)

# Stable public page for live cite verify (not a real IR source — demo only).
_DEMO_URL = "https://example.com/"
_DEMO_EXCERPT = "Example Domain"


def research_envelope(company: str) -> str:
    body_readme = f"""# research index · {company}

| file | focus |
|------|--------|
| 01_IR_financial | demo citation + pad |
| 09_not_for_pitch | dug but unused |

Stage demo — citation uses example.com only to prove verify wiring. {_PAD}
"""
    body_ir = f"""# IR · {company}（fixture）

本文件含一条可回验引用（演示用，非真 diligence）。

来源：{_DEMO_URL}
摘录：{_DEMO_EXCERPT}

其余数字待真人研究替换。

{_PAD}
{_PAD}
"""
    body_09 = f"""# 查了但不用 · {company}

- 某条娱乐八卦：可信度低，不进刀子。
- 某条竞品传闻：无甲级源，仅记在此防重复开挖。

{_PAD}
"""
    return _pack_research(body_readme, body_ir, body_09)


def research_envelope_with_fake_citation(company: str) -> str:
    body_readme = f"""# research index · {company}（fail demo）

| file | focus |
|------|--------|
| 01_IR_financial | 假摘录 / 无效主机 |
| 09_not_for_pitch | dug but unused |

{_PAD}
"""
    body_ir = f"""# IR · {company}（fixture · 假引用）

来源：https://example.invalid/made-up-filing
摘录：我们编造了一句财报原话

{_PAD}
{_PAD}
"""
    body_09 = f"""# 查了但不用 · {company}

- 娱乐八卦不进刀子。
- 无甲级源竞品传闻仅记在此。

{_PAD}
"""
    return _pack_research(body_readme, body_ir, body_09)


def research_envelope_wrong_excerpt(company: str) -> str:
    """Real URL but excerpt not on page → citation_verify FAIL."""
    body_readme = f"""# research index · {company}（wrong excerpt）

{_PAD}
"""
    body_ir = f"""# IR · {company}

来源：{_DEMO_URL}
摘录：ThisPhraseDoesNotExistOnExampleDotComXYZ

{_PAD}
{_PAD}
"""
    body_09 = f"""# 查了但不用 · {company}

{_PAD}
"""
    return _pack_research(body_readme, body_ir, body_09)


def _pack_research(readme: str, ir: str, nfp: str) -> str:
    return f"""===FILE: research/README.md===
{readme}
===END: research/README.md===

===FILE: research/01_IR_financial.md===
{ir}
===END: research/01_IR_financial.md===

===FILE: research/09_not_for_pitch.md===
{nfp}
===END: research/09_not_for_pitch.md===

===MANIFEST===
{{"stage":"research","files":[
  {{"path":"research/README.md","lines":8}},
  {{"path":"research/01_IR_financial.md","lines":14}},
  {{"path":"research/09_not_for_pitch.md","lines":6}}
]}}
===END MANIFEST===
"""


def ifalsify_envelope(company: str) -> str:
    body = f"""# ifalsify · {company}

## Verdict
**CONDITIONAL**

## Why not KILL
公开材料不足以证伪「有合作空间」，但证据厚度不够，不得写成必赢故事。

## Why not 无条件通过
L零缺口未补：决策链、预算口径、我方历史关系均为未知。

## Kill criteria if later
若客户明确「只做一次性曝光、不做经营系统」，则转向或杀掉当前主张。

## Not for pitch
不得用演示填充数字对外承诺。

{_PAD}
"""
    return f"""===FILE: ifalsify_report.md===
{body}
===END: ifalsify_report.md===

===MANIFEST===
{{"stage":"ifalsify","files":[{{"path":"ifalsify_report.md","lines":24}}]}}
===END MANIFEST===
"""


def knife_envelope(company: str) -> str:
    body = f"""# B_knife · {company}

## 一句话
在「公开叙事已有、经营系统未落地」的张力上，用一场可验证的小切口证明我们懂对方的账，而不是再卖一场活动。

## 证伪印记
本刀印证伪结论：**CONDITIONAL**。未过证伪不得当必赢稿。

## 明确不说
- 不承诺未经验证的回报率
- 不点名羞辱具体竞品成交数字（无甲级源）
- 不用演示填充财报对外

## Ask
要一场十分钟会：对齐一个可证伪的经营切口，并在七十二小时内补齐关键三问。

{_PAD}
"""
    return f"""===FILE: B_knife.md===
{body}
===END: B_knife.md===

===MANIFEST===
{{"stage":"knife","files":[{{"path":"B_knife.md","lines":22}}]}}
===END MANIFEST===
"""


def compose_envelope(company: str) -> str:
    """v1.6 dual-pack + PRIMARY + MAX_GAP (demo thickness)."""
    one = f"""# {company} · 会前关键信息（engine demo）

> **非会面话术稿** · 演示填充 · 未来三年趋势：**宁空不编 / 待核实**

## 顶栏裁决

**{company}** · 证伪核查结论：**CONDITIONAL（有条件推进）**

> 公开叙事已有、经营系统未落地。
> **禁用话术**：未验证 ROI 承诺 / 无甲级源竞品羞辱 / fixture 财报对外

## 左列 · Max 必填底座

- 生命周期 / 财务锚点：见 research（demo）
- 品牌×人群：【待核实】

## 右列 · 判断层

### 他们说的 vs 实际发生的
叙事领先于可核销经营动作。

### SWOT（证据化提纲）
S/W/O/T 详见冰山；此处只留决策用张力。

### 主打矛盾点 + 三问 + 信息缺口
矛盾：活动一锤子 vs 经营系统。
1. 决策链上谁能否掉经营试点？
2. 预算是曝光池还是可核销试验池？
3. 过去合作里什么被证明没用？

{_PAD}
"""
    primary = f"""# PRIMARY_REQUIRED · {company}

| 字段 | 值 |
|------|-----|
| tier | B |
| 状态 | **open** |
| 阻塞 | 决策链、预算口径、历史关系 |

## 为何需要 L0

外部材料只能到公开叙事；L0 决定能否谈经营切口。

## 待验证假说

**假说**：客户缺的是可验证经营 OS，不是另一场活动。
**若真**：谈小切口试点 + 72h 补齐。
**若假**：discard 本主张，PIVOT 或结束。

## 销售 checklist（首面后 72h）

- [ ] 客户 business problem 原话
- [ ] 见面人线 / initiator / veto
- [ ] 预算有无（试验池 vs 曝光池）
- [ ] 渠道/经销商评价
- [ ] #1 顾虑

## 会面三问

1. 谁能在内部否掉一个经营试点？
2. 今年预算里有没有「可核销试验」而不是纯曝光？
3. 上一次合作里，什么指标被证明没有用？

## 明确不说（直到 L0 closed）

- 具体金额 / 未核实排他
- fixture 数字对外
- 粉丝数开场

{_PAD}
"""
    gap = f"""# Max 角度缺口审计 · {company}

> 对照 Max 清单；demo 阶段标缺口，不编预测

| Max 要求 | 我们位置 | 缺口 |
|----------|----------|------|
| 生命周期 / 治理 | ⚠️ research demo | 待真检索 |
| 三年财务 | ⚠️ | 待真检索 |
| 产品/价格/人群 | ⚠️ | 待核实 |
| 营销/体育边界 | ⚠️ | 待核实 |
| 行业大盘 | ⚠️ | 待核实 |
| SWOT/TOWS + 说vs做 | ✅ ONE_PAGER | demo |
| 证伪 + 三问 | ✅ ifalsify / PRIMARY | demo |

## 双材料

| # | 材料 | 路径 |
|---|------|------|
| 1 | 研报 | `research/` + `html/index.html` |
| 2 | 一页关键信息 | `ONE_PAGER.md` |

{_PAD}
"""
    index = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>{company} · 会前双材料</title></head>
<body>
  <h1>{company} · 会前双材料入口</h1>
  <p>完整研报：<a href="../research/README.md">research/</a>（冰山真源；HTML 镜像阶段 2 后补）</p>
  <p>一页关键信息：<a href="ONE_PAGER.html">ONE_PAGER.html</a> · MD 真源 <code>ONE_PAGER.md</code></p>
</body>
</html>
"""
    one_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>{company} ONE_PAGER</title></head>
<body>
  <h1>{company} · ONE_PAGER</h1>
  <p>见同目录上级 <code>ONE_PAGER.md</code>（engine demo stub）。</p>
  <p><a href="index.html">回双材料入口</a></p>
</body>
</html>
"""
    return f"""===FILE: ONE_PAGER.md===
{one}
===END: ONE_PAGER.md===

===FILE: PRIMARY_REQUIRED.md===
{primary}
===END: PRIMARY_REQUIRED.md===

===FILE: MAX_GAP_AUDIT.md===
{gap}
===END: MAX_GAP_AUDIT.md===

===FILE: html/index.html===
{index}
===END: html/index.html===

===FILE: html/ONE_PAGER.html===
{one_html}
===END: html/ONE_PAGER.html===

===MANIFEST===
{{"stage":"compose","files":[
  {{"path":"ONE_PAGER.md","lines":40}},
  {{"path":"PRIMARY_REQUIRED.md","lines":40}},
  {{"path":"MAX_GAP_AUDIT.md","lines":24}},
  {{"path":"html/index.html","lines":12}},
  {{"path":"html/ONE_PAGER.html","lines":10}}
]}}
===END MANIFEST===
"""


def compose_envelope_missing_primary(company: str) -> str:
    """Omits PRIMARY_REQUIRED → required_files / v16 FAIL."""
    one = f"""# {company} ONE_PAGER
## 顶栏裁决
证伪：**CONDITIONAL**
## 右列
矛盾与三问提纲。说的 vs 实际。SWOT。宁空不编。
{_PAD}
"""
    gap = f"""# Max gap · {company}
| Max 要求 | 位置 | 缺口 |
|----------|------|------|
| 财务 | ⚠️ | 缺 PRIMARY |
{_PAD}
"""
    index = f"""<!DOCTYPE html><html><body>
<a href="ONE_PAGER.html">ONE_PAGER</a>
<a href="../research/README.md">research</a>
</body></html>
"""
    return f"""===FILE: ONE_PAGER.md===
{one}
===END: ONE_PAGER.md===

===FILE: MAX_GAP_AUDIT.md===
{gap}
===END: MAX_GAP_AUDIT.md===

===FILE: html/index.html===
{index}
===END: html/index.html===

===MANIFEST===
{{"stage":"compose","files":[{{"path":"ONE_PAGER.md","lines":8}}]}}
===END MANIFEST===
"""


def evolve_envelope(company: str) -> str:
    body = f"""# R2_evolved_report · {company}

## 1. 产品是什么
可核销的经营小切口 OS，不是又一场热闹。

## 2. 变体张力（据销售补录修正）
客户原话指向经销商考核；预算在 activation；否决在财务。

## 3. Teaching / Reframe
把「要不要赞助」改成「哪一段能进考核表」。

## 4. 下次见客户：首问 5 句

1. 经销商考核里，品牌动作算哪一格？
2. 试验池谁能批、谁能否？
3. 去年哪场热闹最后没进报表？
4. 若只做一城，成功标准是什么？
5. 什么是你们明确不能再买的？

（每句后：若答 X → 指向主 C；demo 略）

## 5. 买不买卡点
- [x] 考核口径不清 — 证据：销售补录原话
- [ ] 预算科目未锁定

{_PAD}
"""
    return f"""===FILE: R2_evolved_report.md===
{body}
===END: R2_evolved_report.md===

===MANIFEST===
{{"stage":"evolve","files":[{{"path":"R2_evolved_report.md","lines":30}}]}}
===END MANIFEST===
"""


def shelf_envelope(company: str) -> str:
    body = f"""# R2_shelf_recommendations · {company}

> 仅货架 catalog；**不含** iPod。

### 组合 A · 常亮试验

- **主 C**：经营可见度
- **解决的价值缺口**：全年有理由激活，非单场
- **货品清单**：

| 货架 ID | 名称 | 特征摘要 | 为何 fit |
|---------|------|----------|----------|
| SH-MED-002 | 合作伙伴媒体全年包 | 多平台节点 | 预算收紧下常亮 |
| SH-DIG-001 | 数字内容拼装 | 可拼接 | 小切口内容 |

- **避免**：单点曝光
- **不进客户页的**：内部权益包 ID

### 组合 B · 城市落地

- **主 C**：属地故事
- **解决的价值缺口**：经销商可看见场次
- **货品清单**：

| 货架 ID | 名称 | 特征摘要 | 为何 fit |
|---------|------|----------|----------|
| SH-VEN-001 | 城市篮球公园 | 线下闭环 | 城市落地 |
| SH-EDU-001 | Jr.NBA / 校园 | 可量化场次 | 青年校园 |

- **避免**：无落地纯媒体
- **不进客户页的**：margin

## 内部对照

| 轨道 | 名称 | 本轮状态 |
|------|------|----------|
| 货架 | A/B | 推荐 |
| iPod | （若有） | 仅内部，不出现在上方货品清单 |

{_PAD}
"""
    return f"""===FILE: R2_shelf_recommendations.md===
{body}
===END: R2_shelf_recommendations.md===

===MANIFEST===
{{"stage":"shelf","files":[{{"path":"R2_shelf_recommendations.md","lines":40}}]}}
===END MANIFEST===
"""


def shelf_envelope_with_ipod_leak(company: str) -> str:
    body = f"""# R2_shelf_recommendations · {company}（坏样例）

### 组合 A · 含 iPod 违规

- **货品清单**：

| 货架 ID | 名称 | 特征摘要 | 为何 fit |
|---------|------|----------|----------|
| SH-MED-002 | 媒体包 | x | y |
| iPod-China-Court-OS | pitchvision bespoke | 破格 | 不该出现在货架 |

### 组合 B · 城市

- **货品清单**：

| 货架 ID | 名称 | 特征摘要 | 为何 fit |
|---------|------|----------|----------|
| SH-VEN-001 | 城市公园 | x | y |

{_PAD}
"""
    return f"""===FILE: R2_shelf_recommendations.md===
{body}
===END: R2_shelf_recommendations.md===

===MANIFEST===
{{"stage":"shelf","files":[{{"path":"R2_shelf_recommendations.md","lines":20}}]}}
===END MANIFEST===
"""


def close_envelope(company: str) -> str:
    body = f"""# R3_close_pack · {company}

## 1. 预算现实

| 项 | 内容 |
|----|------|
| 客户披露预算档 | 试点 50–80 万 activation |
| tier | B |
| 货架组合落位 | 组合 B 可落档内 |
| 谈判杠杆 | 单城 pilot |

## 2. iPod 破格叙事

| 项 | 内容 |
|----|------|
| 概念名 | （内部） |
| 为何破格 | 品类窗口 |
| 客户不买的代价 | 竞品占位 |
| 试点形态 | 90 天单城 — **一个 ask** |

## 3. 双轨交付表

### 轨道 A · 货架组合（今年可签）

| 组合 | 客户得到 | 可汇报指标 | 落地节奏 |
|------|----------|------------|----------|
| 组合 B | 属地场次 | 场次/覆盖 | 一季 |

### 轨道 B · iPod（破格立项）

| 项 | 客户得到 | 与货架关系 |
|----|----------|------------|
| 内部概念 | 单独立项再议 | 补充叙事 |

## 4. 唯一 Ask

本轮只要：确认一城 pilot 科目与否决人，并给 72h 书面反馈。

{_PAD}
"""
    return f"""===FILE: R3_close_pack.md===
{body}
===END: R3_close_pack.md===

===MANIFEST===
{{"stage":"close","files":[{{"path":"R3_close_pack.md","lines":40}}]}}
===END MANIFEST===
"""
