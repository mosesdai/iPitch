#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成可离机转发的单文件全案入口 HTML（内嵌全部内容，锚点导航）。"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

CASES = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from public_rename import LABEL, public_rename  # noqa: E402


def inline(text: str) -> str:
    out = html.escape(text, quote=False)
    out = re.sub(r"`([^`]+)`", r"<code>\1</code>", out)
    out = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(
        r"\[([^\]]+)\]\((https?://[^)\s]+)\)",
        r'<a href="\2" rel="noreferrer" target="_blank">\1</a>',
        out,
    )
    return out


def render_table(rows: list[str]) -> str:
    cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
    body = [r for r in cells if not all(re.fullmatch(r":?-{2,}:?", c or "-") for c in r)]
    if not body:
        return ""
    head, rest = body[0], body[1:]
    parts = ["<div class='tbl'><table><thead><tr>"]
    parts += [f"<th>{inline(c)}</th>" for c in head]
    parts += ["</tr></thead><tbody>"]
    for row in rest:
        parts.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in row) + "</tr>")
    parts.append("</tbody></table></div>")
    return "".join(parts)


def md_to_html(md: str) -> tuple[str, str]:
    lines = md.replace("\r\n", "\n").split("\n")
    title, out, i = "", [], 0
    buf: list[str] = []

    def flush() -> None:
        if buf:
            out.append("<p>" + "<br/>".join(inline(x) for x in buf) + "</p>")
            buf.clear()

    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if s.startswith("```"):
            flush()
            i += 1
            block = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                block.append(lines[i])
                i += 1
            i += 1
            out.append("<pre>" + html.escape("\n".join(block)) + "</pre>")
            continue
        if not s:
            flush()
            i += 1
            continue
        if re.fullmatch(r"-{3,}|\*{3,}", s):
            flush()
            out.append("<hr/>")
            i += 1
            continue
        m = re.match(r"(#{1,6})\s+(.*)", s)
        if m:
            flush()
            level, text = len(m.group(1)), m.group(2).strip()
            if level == 1 and not title:
                title = re.sub(r"<[^>]+>", "", inline(text))
                out.append(f"<h2 class='md-h1'>{inline(text)}</h2>")
            else:
                tag = {2: "h3", 3: "h4"}.get(level, "h5")
                out.append(f"<{tag}>{inline(text)}</{tag}>")
            i += 1
            continue
        if s.startswith(">"):
            flush()
            quote = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote.append(re.sub(r"^>\s?", "", lines[i].strip()))
                i += 1
            out.append(
                "<blockquote>"
                + "".join(f"<p>{inline(q)}</p>" for q in quote if q.strip())
                + "</blockquote>"
            )
            continue
        if s.startswith("|"):
            flush()
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(lines[i])
                i += 1
            out.append(render_table(rows))
            continue
        if re.match(r"[-*+]\s+", s) or re.match(r"\d+[.)]\s+", s):
            flush()
            ordered = bool(re.match(r"\d+[.)]\s+", s))
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
        buf.append(s)
        i += 1
    flush()
    return title, "\n".join(x for x in out if x)


CSS = """
:root{
  --ink:#0f172a;--muted:#475569;--line:#cbd5e1;--paper:#ffffff;--bg:#e8eef3;
  --accent:#0b4f7a;--accent2:#1d6fa5;--soft:#e7f2fa;--warn:#92400e;--warnbg:#fef3c7;
  --ok:#065f46;--rail:#0f2740;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:"PingFang SC","Noto Sans SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  color:var(--ink);background:linear-gradient(180deg,#d9e5ef 0%,var(--bg) 220px,#f4f7fa 100%);
  font-size:15px;line-height:1.7}
a{color:var(--accent2)}
.shell{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:100vh}
.rail{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;background:var(--rail);color:#e2e8f0;padding:22px 16px 40px}
.rail .brand{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7dd3fc;font-weight:700}
.rail h1{font-size:1.15rem;margin:10px 0 6px;color:#fff;line-height:1.35}
.rail .sub{font-size:12px;color:#94a3b8;margin-bottom:14px}
.badge{display:inline-block;font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px;
  background:var(--warnbg);color:var(--warn);margin:0 0 14px}
.rail nav a{display:block;color:#cbd5e1;text-decoration:none;padding:8px 10px;border-radius:8px;font-size:13px;margin:2px 0}
.rail nav a:hover,.rail nav a:focus{background:rgba(255,255,255,.08);color:#fff}
.rail nav .g{margin:14px 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#64748b}
.main{padding:28px 28px 80px;max-width:980px}
.hero{background:linear-gradient(135deg,#0b4f7a 0%,#1d6fa5 55%,#0ea5e9 140%);color:#fff;
  border-radius:18px;padding:28px 26px;margin-bottom:22px;box-shadow:0 18px 40px rgba(15,39,64,.18)}
.hero h2{margin:0 0 8px;font-size:1.6rem}
.hero p{margin:0;opacity:.92;max-width:46em}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:18px 0 8px}
.cards a{display:block;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);
  color:#fff;text-decoration:none;border-radius:12px;padding:12px 14px;font-size:13px}
.cards a strong{display:block;font-size:14px;margin-bottom:4px}
.sec{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:22px 22px 26px;margin:0 0 18px;
  box-shadow:0 8px 24px rgba(15,23,42,.04)}
.sec > .label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin:0 0 8px}
.sec h2.sec-title{margin:0 0 12px;font-size:1.35rem;color:var(--accent);border:0;padding:0}
.md-h1{font-size:1.2rem;color:var(--accent);margin:0 0 12px}
h3{font-size:1.05rem;margin:22px 0 8px;color:#1e3a5f;padding-left:10px;border-left:3px solid #7dd3fc}
h4,h5{font-size:.98rem;margin:16px 0 6px;color:#334155}
p{margin:0 0 12px}ul,ol{margin:0 0 14px;padding-left:22px}li{margin-bottom:6px}
blockquote{margin:12px 0;padding:12px 14px;background:var(--soft);border-left:4px solid var(--accent2);color:#1e293b;border-radius:0 8px 8px 0}
.tbl{overflow-x:auto;margin:12px 0 16px}
table{width:100%;border-collapse:collapse;font-size:13px;background:#fff}
th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
th{background:var(--soft);color:var(--accent);font-weight:650}
code{font-size:12px;background:#eef2f7;padding:1px 5px;border-radius:3px}
pre{background:#0f172a;color:#e2e8f0;padding:14px;border-radius:10px;overflow-x:auto;font-size:12px;white-space:pre-wrap}
hr{border:none;border-top:1px solid var(--line);margin:18px 0}
.foot{margin-top:28px;font-size:12px;color:var(--muted)}
.note{background:#fffbeb;border:1px solid #f59e0b;border-radius:10px;padding:12px 14px;margin:12px 0;font-size:13px;color:#78350f}
@media (max-width:900px){
  .shell{grid-template-columns:1fr}
  .rail{position:relative;height:auto;max-height:none}
}
@media print{
  body{background:#fff}
  .shell{display:block}
  .rail{display:none}
  .sec{break-inside:avoid;box-shadow:none}
  .hero{box-shadow:none}
  @page{size:A4;margin:12mm}
}
""".strip()


def section(aid: str, label: str, title: str, body: str) -> str:
    return (
        f'<section class="sec" id="{html.escape(aid)}">'
        f'<div class="label">{html.escape(label)}</div>'
        f'<h2 class="sec-title">{html.escape(title)}</h2>'
        f"{body}</section>"
    )


def load_md(path: Path) -> tuple[str, str]:
    if not path.is_file():
        return path.name, f"<p class='note'>缺失文件：{html.escape(str(path.name))}</p>"
    return md_to_html(path.read_text(encoding="utf-8"))


def build(
    slug: str,
    brand: str,
    outfile: str,
    claim: str,
    concept_names: list[str],
    *,
    also_copy_to: Path | None = None,
) -> Path:
    case = CASES / slug
    toc: list[tuple[str, str, str]] = []  # group, id, label
    parts: list[str] = []

    def add(group: str, aid: str, label: str, title: str, body: str) -> None:
        toc.append((group, aid, label))
        parts.append(section(aid, label, title, body))

    # Core sales pack
    core = [
        ("one", "ONE_PAGER.md", "会前一页纸", "ONE PAGER · 会前关键信息"),
        ("knife", "B_knife.md", "刀刃 · 10分钟", "刀刃"),
        ("a", "A_dossier.md", "中间层 A", "A 档案 · 深谈精华"),
        ("ifalsify", "ifalsify_report.md", "证伪", "ifalsify 证伪报告"),
        ("primary", "PRIMARY_REQUIRED.md", "PRIMARY 三问", "PRIMARY · 三问 + 72h"),
        ("max", "MAX_GAP_AUDIT.md", "BD经验缺口", "BD经验缺口审计"),
        ("tensions", "03_tensions.md", "张力池", "张力候选"),
        ("trace", "data_traceability.md", "数据溯源", "数据溯源表"),
        ("charter", "00_charter.md", "立项", "立项章程"),
    ]
    for aid, fname, short, title in core:
        _t, body = load_md(case / fname)
        add("会前主件", aid, short, title, body)

    # Pitchvision
    pv = case / "pitchvision"
    if (pv / "README.md").is_file():
        _t, body = load_md(pv / "README.md")
        add(LABEL, "xbox-index", "跳出盒子 · 索引", f"{LABEL} · 总览", body)
    for i, folder in enumerate(sorted(p for p in pv.iterdir() if p.is_dir()) if pv.is_dir() else [], 1):
        chunks = []
        for f in sorted(folder.glob("*.md")):
            t, b = load_md(f)
            chunks.append(f"<h3>{html.escape(t or f.stem)}</h3>\n{b}")
        name = concept_names[i - 1] if i - 1 < len(concept_names) else folder.name
        add(LABEL, f"xbox-{i}", f"跳出盒子 {i}", name, "\n".join(chunks))

    # Research iceberg — 侧栏：研N - 研究标题
    research = case / "research"
    files = sorted(research.glob("*.md")) if research.is_dir() else []
    for i, f in enumerate(files, 1):
        t, b = load_md(f)
        title = (t or f.stem).strip()
        add("最厚调研 · 冰山", f"r{i:02d}", f"研{i} - {title}", title, b)

    # TOC html
    toc_html = []
    last_g = None
    for g, aid, label in toc:
        if g != last_g:
            toc_html.append(f'<div class="g">{html.escape(g)}</div>')
            last_g = g
        toc_html.append(f'<a href="#{html.escape(aid)}">{html.escape(label)}</a>')

    has_xbox = any(aid.startswith("xbox-") for _, aid, _ in toc)
    if has_xbox and concept_names:
        mid = (
            f'<a href="#xbox-1"><strong>③ {html.escape(LABEL)}</strong>'
            f"{html.escape(concept_names[0])}</a>"
        )
    else:
        mid = '<a href="#primary"><strong>③ PRIMARY</strong>三问 + 72h</a>'
    hero_cards = f"""
    <div class="cards">
      <a href="#one"><strong>① 一页纸</strong>会前对齐</a>
      <a href="#knife"><strong>② 刀刃</strong>10 分钟开门</a>
      {mid}
      <a href="#a"><strong>④ 深谈 A</strong>判断层</a>
      <a href="#r01"><strong>⑤ 冰山</strong>最厚调研</a>
      <a href="#ifalsify"><strong>证伪</strong>CONDITIONAL</a>
    </div>"""

    doc = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{html.escape(brand)} · 全案入口（可转发单文件）</title>
<style>{CSS}</style>
</head>
<body>
<div class="shell">
<aside class="rail">
  <div class="brand">iPitch Showcase</div>
  <h1>{html.escape(brand)}</h1>
  <div class="sub">单文件全案 · 离机可看 · 左侧锚点跳转</div>
  <span class="badge">证伪 CONDITIONAL · L0 未关</span>
  <nav>
    <div class="g">速览</div>
    <a href="#top">封面</a>
    {''.join(toc_html)}
  </nav>
</aside>
<main class="main" id="top">
  <div class="hero">
    <h2>{html.escape(brand)} · 游说全案包</h2>
    <p>{html.escape(claim)}</p>
    {hero_cards}
  </div>
  <div class="note">
    <strong>使用说明：</strong>本文件是<strong>自包含单 HTML</strong>，可单独微信/邮件转发。左侧目录均可点击跳转；外链（财报 URL）需联网。
    数字与主张仍受 CONDITIONAL 约束——内部流程/合同/预算未核前，勿写成已证实结论。
  </div>
  {''.join(parts)}
  <p class="foot">{html.escape(brand)} · 生成自 case MD 真源 · 单文件导出供离机审阅</p>
</main>
</div>
</body>
</html>
"""
    doc = public_rename(doc)

    out = case / "deliver" / outfile
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding="utf-8")
    # also copy to export folder for easy find
    export = CASES / "_export"
    export.mkdir(parents=True, exist_ok=True)
    copy = export / outfile
    copy.write_text(doc, encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size/1024:.1f} KB)")
    print(f"copy  {copy}")
    if also_copy_to is not None:
        also_copy_to = Path(also_copy_to)
        also_copy_to.parent.mkdir(parents=True, exist_ok=True)
        also_copy_to.write_text(doc, encoding="utf-8")
        print(f"copy  {also_copy_to}")
    return out


def main() -> None:
    build(
        "byd",
        "比亚迪 BYD",
        "BYD_全案入口_可转发.html",
        "车、工厂和权益已全球化；信任不能继续按每一个赞助 campaign 重做。下一道门是可调用、可归因、可复利的本地信任协议。",
        ["全球信任协议 Global Trust Protocol", "五分钟技术联赛 Five-Minute Proof League"],
    )
    build(
        "geely-international",
        "吉利国际 Geely International",
        "GEELY_全案入口_可转发.html",
        "让 100 个市场不复制中国，也不让 100 个市场各自重新发明吉利——World+ 的地方真实，与 One Geely 的可学习协同，要靠协议而不靠更大声量。",
        ["World+ Market Twin 市场孪生学习协议", "Trust Passport Network 信任护照网络"],
    )
    build(
        "赞意广告",
        "赞意广告 Goodidea",
        "赞意广告_全案入口_可转发.html",
        "他们已把增长写成确定性系统；体育厂牌新开。下一道门不是更年轻的口号，而是体育能否进同一张胜率表——先闸门，再路由。",
        ["体育胜率闸门 Sports Certainty Gate", "品牌主体育路由台 Client Sports Router"],
    )
    nio_compare = CASES / "nio" / "compare" / "1_AI_Force" / "蔚来NIO_全案入口_可转发_离机可读.html"
    build(
        "nio",
        "蔚来 NIO",
        "NIO_全案入口_可转发.html",
        "姚明与申花已证明两种体育逻辑；乐道破万峰值未成台阶。下一道门不是统一热度，而是三品牌分层 OS——精神 / 家庭社群 / 青年触点，任一层可单独成立。",
        [],
        also_copy_to=nio_compare,
    )


if __name__ == "__main__":
    main()
