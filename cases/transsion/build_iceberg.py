# -*- coding: utf-8 -*-
"""生成 cases/transsion/html/research/传音控股_冰山深度研究.html —— research/*.md 全文镜像。

用法：python3 cases/transsion/build_iceberg.py
"""

from __future__ import annotations

import html
import re
from pathlib import Path

CASE = Path(__file__).resolve().parent
SRC = CASE / "research"
OUT = CASE / "html" / "research" / "传音控股_冰山深度研究.html"

CHAPTER_LABELS = {
    "01": "财报与交付精读（IR）",
    "02": "高管原话库",
    "03": "体育与 IP 合作史",
    "04": "竞品格局",
    "05": "行业与政策语境",
    "06": "权力图 + MEDDIC",
    "07": "组织 / 创始人 / 生命周期",
    "08": "横纵交汇分析",
    "09": "查了但会面不说",
    "10": "产品 × 人群矩阵",
    "11": "营销 / 体育 / PR 边界",
    "12": "行业大盘与定位",
}

CSS = """
:root{--bg:#f7f8fa;--card:#fff;--text:#1a2332;--muted:#5c6b7a;--accent:#0f4c81;--accent-soft:#e8f1f8;--border:#d8e0e8;--warn:#9a6700;--soft-warn:#fff8e8}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font-family:"Noto Sans SC","PingFang SC","Hiragino Sans GB",sans-serif;font-size:15px;line-height:1.75;color:var(--text);background:var(--bg)}
.wrap{max-width:920px;margin:0 auto;padding:28px 20px 80px}
header{border-bottom:1px solid var(--border);padding-bottom:22px;margin-bottom:8px}
h1{font-size:1.75rem;margin:0 0 10px;letter-spacing:-.02em;font-weight:700}
.tag{display:inline-block;font-size:11px;font-weight:600;padding:3px 9px;border-radius:4px;margin:0 6px 6px 0;background:var(--accent-soft);color:var(--accent)}
.tag.warn{background:var(--soft-warn);color:var(--warn)}
.meta{font-size:13px;color:var(--muted);margin:8px 0 0}
nav.toc{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px 20px;margin:24px 0 8px;position:sticky;top:0;z-index:10;box-shadow:0 1px 0 rgba(0,0,0,.04)}
nav.toc strong{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
nav.toc a{color:var(--accent);text-decoration:none;font-size:13.5px;margin-right:14px;white-space:nowrap;line-height:2}
nav.toc a:hover{text-decoration:underline}
section{margin-top:36px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:22px 24px 28px}
h2.file-title{font-size:1.25rem;margin:0 0 14px;color:var(--accent);padding-bottom:8px;border-bottom:1px solid var(--border)}
h3{font-size:1.05rem;margin:22px 0 10px;color:#243447}h4{font-size:1rem;margin:18px 0 8px}
p{margin:0 0 12px}ul,ol{margin:0 0 16px;padding-left:22px}li{margin-bottom:7px}
blockquote{margin:12px 0;padding:10px 14px;background:#f0f4f8;border-left:3px solid var(--accent);color:#334}
blockquote p{margin:0 0 6px}blockquote p:last-child{margin:0}
.table-wrap{overflow-x:auto;margin:12px 0 20px}
table{width:100%;border-collapse:collapse;font-size:13.5px;background:#fff}
th,td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top}
th{background:var(--accent-soft);color:var(--accent);font-weight:600}
.box{background:var(--card);border:1px solid var(--border);border-left:4px solid var(--accent);padding:14px 16px;margin:18px 0}
.muted{color:var(--muted);font-size:13px}code{font-size:12.5px;background:#eef2f6;padding:1px 5px;border-radius:3px}
a{color:var(--accent)}footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--border);font-size:13px;color:var(--muted)}
pre.muted{margin:0 0 16px;font-size:12px;white-space:pre-wrap;background:#f0f4f8;padding:12px;border-radius:6px}
hr{border:none;border-top:1px solid var(--border);margin:20px 0}
@media print{body{background:#fff}nav.toc{position:static}section{break-inside:auto}@page{size:A4;margin:12mm}}
""".strip()


def cjk(text: str) -> int:
    return len(re.findall(r"[\u4e00-\u9fff]", text))


def inline(text: str) -> str:
    out = html.escape(text, quote=False)
    out = re.sub(r"`([^`]+)`", r"<code>\1</code>", out)
    out = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2" rel="noreferrer">\1</a>', out)
    out = re.sub(r"&lt;(https?://[^&\s]+)&gt;", r'<a href="\1" rel="noreferrer">\1</a>', out)
    return out


def render_table(rows: list[str]) -> str:
    cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
    body = [r for r in cells if not all(re.fullmatch(r":?-{2,}:?", c or "-") for c in r)]
    if not body:
        return ""
    head, rest = body[0], body[1:]
    parts = ['<div class="table-wrap"><table>', "<tr>"]
    parts += [f"<th>{inline(c)}</th>" for c in head]
    parts.append("</tr>")
    for row in rest:
        parts.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in row) + "</tr>")
    parts.append("</table></div>")
    return "".join(parts)


def render(md: str) -> tuple[str, str]:
    """返回 (章节标题, 正文 HTML)。"""
    lines = md.replace("\r\n", "\n").split("\n")
    title, out, i = "", [], 0
    buf_p: list[str] = []

    def flush_p() -> None:
        if buf_p:
            out.append("<p>" + "<br/>".join(inline(x) for x in buf_p) + "</p>")
            buf_p.clear()

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            flush_p()
            i += 1
            block = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                block.append(lines[i])
                i += 1
            i += 1
            out.append('<pre class="muted">' + html.escape("\n".join(block)) + "</pre>")
            continue

        if not stripped:
            flush_p()
            i += 1
            continue

        if re.fullmatch(r"-{3,}|\*{3,}", stripped):
            flush_p()
            out.append("<hr/>")
            i += 1
            continue

        m = re.match(r"(#{1,6})\s+(.*)", stripped)
        if m:
            flush_p()
            level, text = len(m.group(1)), m.group(2).strip()
            if level == 1 and not title:
                title = re.sub(r"<[^>]+>", "", inline(text))
            else:
                tag = {2: "h3", 3: "h4"}.get(level, "h4")
                out.append(f"<{tag}>{inline(text)}</{tag}>")
            i += 1
            continue

        if stripped.startswith(">"):
            flush_p()
            quote = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote.append(re.sub(r"^>\s?", "", lines[i].strip()))
                i += 1
            inner = [f"<p>{inline(q)}</p>" for q in quote if q.strip()]
            out.append("<blockquote>" + "".join(inner) + "</blockquote>")
            continue

        if stripped.startswith("|"):
            flush_p()
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(lines[i])
                i += 1
            out.append(render_table(rows))
            continue

        if re.match(r"[-*+]\s+", stripped) or re.match(r"\d+[.)]\s+", stripped):
            flush_p()
            ordered = bool(re.match(r"\d+[.)]\s+", stripped))
            items = []
            while i < len(lines):
                cur = lines[i].strip()
                if re.match(r"[-*+]\s+", cur) or re.match(r"\d+[.)]\s+", cur):
                    items.append(re.sub(r"^(?:[-*+]|\d+[.)])\s+", "", cur))
                    i += 1
                elif cur and lines[i].startswith((" ", "\t")) and items:
                    items[-1] += " " + cur
                    i += 1
                else:
                    break
            tag = "ol" if ordered else "ul"
            out.append(f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>")
            continue

        buf_p.append(stripped)
        i += 1

    flush_p()
    return title, "\n".join(x for x in out if x)


def main() -> None:
    files = sorted(p for p in SRC.glob("*.md") if p.name != "README.md")
    total = 0
    sections, toc = [], []

    for path in files:
        num = path.name[:2]
        md = path.read_text(encoding="utf-8")
        total += cjk(md)
        title, body = render(md)
        label = CHAPTER_LABELS.get(num, title or path.stem)
        sections.append(
            f'<section id="ch{num}">\n<h2 class="file-title">{html.escape(title or label)}</h2>\n{body}\n</section>'
        )
        toc.append(f'<a href="#ch{num}">{num} · {html.escape(label)}</a>')

    doc = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>传音控股 · 冰山深度研究 · v1.0</title>
<style>
{CSS}
</style>
</head>
<body>
<div class="wrap">
<header>
<h1>冰山深度研究 · 传音控股</h1>
<span class="tag">v1.0</span>
<span class="tag warn">ifalsify CONDITIONAL</span>
<span class="tag">CJK ≈{total:,}</span>
<span class="tag">12 章全文镜像</span>
<p class="meta">时间锚：<strong>FY2023–25 年报</strong>（约 2026-03-28）· TECNO×非洲杯 · 张艺兴续约<br/>
MD 真源 <code>../../research/</code> · 会前主材料优先 <a href="../传音控股_一页关键信息.html">一页关键</a> · <a href="../传音控股_会前双材料入口.html">入口</a> · <a href="../传音控股_10分钟刀子.html">10 分钟刀子</a></p>
</header>
<div class="box">
<strong>一句话：</strong>非洲杯灯塔已立；利润腰斩年仍加销售/研发费用；年报要中高端与跨市场复制 —— 缺可绑 ASP/SKU 的熔断文化 OS，不是再买一张赛事 Logo。<br/>
<span class="muted">禁句：「非洲崩了」· 拿 −53% 催大包 · 混用 IDC 40% 与 Omdia 48% · 球迷数/CPM · 贬低非洲杯 · 编三年预测。</span>
</div>
<div class="box">
<strong>最小真源（A）· 财务三刀</strong>
<div class="table-wrap"><table>
<tr><th>口径</th><th>2024</th><th>2025</th><th>备注</th></tr>
<tr><td>营业收入</td><td>687.15 亿</td><td><strong>655.91 亿（−4.55%）</strong></td><td>年报</td></tr>
<tr><td>归母净利润</td><td>55.49 亿</td><td><strong>25.81 亿（−53.49%）</strong></td><td>存储+竞争+费用</td></tr>
<tr><td>销售 / 研发费用</td><td>48.36 / 25.17 亿</td><td><strong>52.04（+7.61%）/ 29.50（+17.23%）</strong></td><td>利润年仍加码</td></tr>
<tr><td>手机收入 / 毛利率</td><td>—</td><td><strong>584.48 亿 / 18.43%（−2.19ppt）</strong></td><td>主引擎</td></tr>
<tr><td>非洲 / 亚洲等</td><td>—</td><td><strong>+9.90% / −11.58%</strong></td><td>区域分叉</td></tr>
<tr><td>非洲智能机市占</td><td>—</td><td><strong>约 40%，第 1</strong></td><td>IDC·年报；勿与 Omdia 48% 混称</td></tr>
</table></div>
</div>
<nav class="toc"><strong>目录 · 完整研报（各章全文镜像）</strong>
{" ".join(toc)}
</nav>
{"".join(chr(10) + s for s in sections)}
<footer>
cases/transsion · research/ 全文镜像 · 由 <code>build_iceberg.py</code> 生成，勿手改本文件<br/>
证伪 <code>../../ifalsify_report.md</code>（CONDITIONAL）· L0 <code>../../PRIMARY_REQUIRED.md</code> · 门禁 <code>../../sales_gate.md</code> · 审计 <code>../../MAX_GAP_AUDIT.md</code>
</footer>
</div>
</body>
</html>
"""

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(doc, encoding="utf-8")
    print(f"wrote {OUT} · {len(files)} chapters · research CJK {total} · {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
