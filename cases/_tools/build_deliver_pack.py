#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 case 根目录 MD 打成 deliver/ 可浏览 HTML（零 pip 依赖）。

用法：
  python3 cases/_tools/build_deliver_pack.py byd
  python3 cases/_tools/build_deliver_pack.py geely-international
  python3 cases/_tools/build_deliver_pack.py all
  python3 cases/_tools/build_deliver_pack.py all --pdf
"""

from __future__ import annotations

import argparse
import html
import re
import subprocess
import sys
from pathlib import Path

CASES = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from public_rename import LABEL, SHORT, public_rename  # noqa: E402
CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

BASE_CSS = """
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
*{box-sizing:border-box}
body{margin:0;font-family:"Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  font-size:15px;line-height:1.7;color:#1a2332;background:#f7f8fa}
.wrap{max-width:920px;margin:0 auto;padding:28px 20px 72px}
.nav{font-size:13px;color:#64748b;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #d4e0ec}
.nav a{color:#4a7fc9;text-decoration:none;margin-right:12px}
.nav a:hover{text-decoration:underline}
.tag{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:4px;
  margin:0 6px 8px 0;background:#e8f1f8;color:#0f4c81}
.tag.warn{background:#fff8e8;color:#9a6700}
h1{font-size:1.55rem;margin:0 0 8px;color:#0f4c81;letter-spacing:-.02em}
h2{font-size:1.15rem;margin:28px 0 10px;color:#4a7fc9;padding-left:10px;border-left:3px solid #93b8e0}
h3{font-size:1.02rem;margin:20px 0 8px;color:#2563a8}
h4{font-size:.95rem;margin:16px 0 6px;color:#334155}
.meta{font-size:13px;color:#5c6b7a}
.box{background:#fff;border:1px solid #d8e0e8;border-left:4px solid #93b8e0;border-radius:8px;padding:14px 16px;margin:14px 0}
p{margin:0 0 12px}ul,ol{margin:0 0 16px;padding-left:22px}li{margin-bottom:6px}
blockquote{margin:12px 0;padding:10px 14px;background:#fafcfe;border-left:4px solid #93b8e0;color:#334155}
table{width:100%;border-collapse:collapse;font-size:13.5px;margin:12px 0 18px;background:#fff}
th,td{border:1px solid #d4e0ec;padding:8px 10px;text-align:left;vertical-align:top}
th{background:#e8f2fb;color:#2563a8;font-weight:650}
code{font-size:12.5px;background:#eef2f6;padding:1px 5px;border-radius:3px}
pre{background:#f0f4f8;padding:12px;border-radius:6px;overflow-x:auto;font-size:12.5px;white-space:pre-wrap}
hr{border:none;border-top:1px solid #d8e0e8;margin:20px 0}
a{color:#4a7fc9}strong{color:#0f4c81}
footer{margin-top:36px;padding-top:14px;border-top:1px solid #d8e0e8;font-size:12px;color:#64748b}
.page-break{page-break-before:always;break-before:page}
@media print{
  body{background:#fff}
  .wrap{max-width:none;padding:0}
  .nav{display:none}
  a{color:inherit;text-decoration:none}
  @page{size:A4;margin:12mm}
}
""".strip()

HUB_CSS = """
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:"Noto Sans SC","PingFang SC",sans-serif;background:#eef2f4;color:#152028}
.wrap{max-width:680px;margin:36px auto;padding:28px 24px;background:#fff;border:1px solid #c9d2da;border-radius:12px}
h1{font-size:1.4rem;margin:0 0 6px;color:#0b3d5c}
.meta{color:#5a6a76;font-size:13px;margin-bottom:14px}
.badge{display:inline-block;background:#f7efd9;color:#8a5a12;padding:3px 8px;font-size:11px;font-weight:700;margin:0 6px 14px 0}
a.card{display:block;padding:14px 16px;margin:0 0 10px;border:1px solid #c9d2da;border-left:4px solid #93b8e0;
  border-radius:8px;text-decoration:none;color:inherit;background:#fbfcfd}
a.card:hover{background:#f0f7ff}
a.card strong{color:#0f4c81}
.sec{font-size:12px;font-weight:700;color:#64748b;letter-spacing:.06em;margin:18px 0 8px;text-transform:uppercase}
.note{font-size:12px;color:#64748b;margin-top:18px;border-top:1px solid #e2e8f0;padding-top:12px}
""".strip()


def inline(text: str) -> str:
    out = html.escape(text, quote=False)
    out = re.sub(r"`([^`]+)`", r"<code>\1</code>", out)
    out = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2" rel="noreferrer">\1</a>', out)
    return out


def render_table(rows: list[str]) -> str:
    cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
    body = [r for r in cells if not all(re.fullmatch(r":?-{2,}:?", c or "-") for c in r)]
    if not body:
        return ""
    head, rest = body[0], body[1:]
    parts = ["<table><tr>"] + [f"<th>{inline(c)}</th>" for c in head] + ["</tr>"]
    for row in rest:
        parts.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in row) + "</tr>")
    parts.append("</table>")
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
                out.append(f"<h1>{inline(text)}</h1>")
            else:
                tag = {2: "h2", 3: "h3"}.get(level, "h4")
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


def wrap_page(title: str, body: str, *, nav: str, tags: str = "", footer: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{html.escape(title)}</title>
<style>
{BASE_CSS}
</style>
</head>
<body>
<div class="wrap">
<div class="nav">{nav}</div>
{tags}
{body}
<footer>{footer or "MD 真源在 case 根目录 · deliver/ 为只读镜像 · 打印/PDF 用本页"}</footer>
</div>
</body>
</html>
"""


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(public_rename(text), encoding="utf-8")
    print(f"  wrote {path} ({path.stat().st_size:,} B)")


def collect_md(case: Path) -> list[tuple[str, Path, str]]:
    mapping = [
        ("ONE_PAGER", "ONE_PAGER.md", "会前一页纸"),
        ("B_knife", "B_knife.md", "刀刃 · 10 分钟"),
        ("A_dossier", "A_dossier.md", "中间层 A 档案"),
        ("ifalsify_report", "ifalsify_report.md", "证伪报告"),
        ("PRIMARY_REQUIRED", "PRIMARY_REQUIRED.md", "PRIMARY · 三问 + 72h"),
        ("MAX_GAP_AUDIT", "MAX_GAP_AUDIT.md", "BD经验缺口审计"),
        ("03_tensions", "03_tensions.md", "张力池"),
        ("data_traceability", "data_traceability.md", "数据溯源"),
        ("00_charter", "00_charter.md", "立项章程"),
    ]
    items = []
    for key, name, label in mapping:
        p = case / name
        if p.is_file():
            items.append((key, p, label))
    return items


def build_iceberg(case: Path, out: Path, brand: str, nav: str) -> None:
    research = case / "research"
    files = sorted(p for p in research.glob("*.md"))
    if not files:
        return
    toc, sections = [], []
    for i, path in enumerate(files, 1):
        title, body = md_to_html(path.read_text(encoding="utf-8"))
        sid = f"ch{i:02d}"
        label = (title or path.stem).strip()
        toc.append(f'<a href="#{sid}">研{i} - {html.escape(label)}</a>')
        sections.append(
            f'<section id="{sid}" class="box"><h2>研{i} - {html.escape(label)}</h2>\n{body}</section>'
        )
    body = (
        f"<h1>{html.escape(brand)} · 最厚调研（冰山）</h1>"
        f'<span class="tag">research/ 全文镜像</span><span class="tag">{len(files)} 文件</span>'
        f'<p class="meta">会前请先读一页纸 / 刀刃；本页供深挖与打印。</p>'
        f'<nav class="box"><strong>目录</strong><div style="margin-top:8px">{" ".join(toc)}</div></nav>'
        + "\n".join(sections)
    )
    write(
        out / "research_iceberg.html",
        wrap_page(f"{brand} · 冰山", body, nav=nav, tags='<span class="tag">Iceberg</span>'),
    )


def build_pitchvision(case: Path, out: Path, brand: str, nav: str) -> list[str]:
    root = case / "pitchvision"
    if not root.is_dir():
        return []
    cards: list[str] = []
    for folder in sorted(p for p in root.iterdir() if p.is_dir()):
        parts = []
        for f in sorted(folder.glob("*.md")):
            t, b = md_to_html(f.read_text(encoding="utf-8"))
            parts.append(f"<h2>{html.escape(t or f.stem)}</h2>\n{b}")
        if not parts:
            continue
        key = folder.name
        fname = f"pitchvision_{key}.html"
        body = (
            f"<h1>{html.escape(LABEL)} · {html.escape(key)}</h1>"
            f'<span class="tag warn">创意轨 · 非货架</span>'
            + "\n".join(parts)
        )
        write(
            out / fname,
            wrap_page(
                f"{brand} · {key}",
                body,
                nav=nav,
                tags=f'<span class="tag warn">{html.escape(LABEL)}</span>',
            ),
        )
        cards.append(fname)
    readme = root / "README.md"
    if readme.is_file():
        t, b = md_to_html(readme.read_text(encoding="utf-8"))
        links = "".join(
            f'<p><a href="{fn}">{html.escape(fn.replace("pitchvision_", "").replace(".html", ""))}</a></p>'
            for fn in cards
        )
        body = (
            f"<h1>{html.escape(t or LABEL)}</h1>{b}"
            f"<div class='box'><strong>概念卡</strong>{links}</div>"
        )
        write(
            out / "pitchvision_index.html",
            wrap_page(f"{brand} · {LABEL}", body, nav=nav),
        )
    return cards


def build_for_max(case: Path, out: Path, brand: str, nav: str) -> None:
    chunks = [
        f"<h1>{html.escape(brand)} · 给游说对象合订包</h1>"
        f'<span class="tag warn">CONDITIONAL</span>'
        f'<p class="meta">阅读序：一页纸 → 刀刃 → {html.escape(LABEL)} → 深谈 A → 冰山按需</p>'
    ]
    for key, label in [
        ("ONE_PAGER.md", "① 会前一页纸"),
        ("B_knife.md", "② 刀刃"),
        ("A_dossier.md", "③ 中间层 A"),
        ("ifalsify_report.md", "④ 证伪"),
        ("pitchvision/README.md", f"⑤ {LABEL} · 索引"),
    ]:
        p = case / key
        if not p.is_file():
            continue
        _t, b = md_to_html(p.read_text(encoding="utf-8"))
        chunks.append(f'<section class="page-break"><h2>{html.escape(label)}</h2>{b}</section>')
    write(
        out / "FOR_MAX_PACK.html",
        wrap_page(
            f"{brand} · FOR MAX",
            "\n".join(chunks),
            nav=nav,
            tags='<span class="tag">合订 · 宜打印/转 PDF</span>',
        ),
    )


def build_hub(out: Path, brand: str, pv: list[str]) -> None:
    existing = {p.name for p in out.glob("*.html")}
    prefer = [
        ("ONE_PAGER.html", "① 会前一页纸（先看）"),
        ("B_knife.html", "② 刀刃 · 10 分钟"),
        ("pitchvision_index.html", f"③ {LABEL}"),
        ("A_dossier.html", "④ 中间层 A 档案"),
        ("research_iceberg.html", "⑤ 最厚调研 · 冰山"),
        ("FOR_MAX_PACK.html", "⑥ 合订包 FOR_MAX（一键浏览/打印）"),
        ("ifalsify_report.html", "证伪报告"),
        ("PRIMARY_REQUIRED.html", "PRIMARY 三问 + 72h"),
        ("MAX_GAP_AUDIT.html", "BD经验缺口审计"),
        ("data_traceability.html", "数据溯源"),
    ]
    cards = []
    for fname, label in prefer:
        if fname in existing:
            cards.append(f'<a class="card" href="{fname}"><strong>{html.escape(label)}</strong></a>')
    for fn in pv:
        if fn in existing:
            cards.append(
                f'<a class="card" href="{fn}"><strong>{html.escape(SHORT)} · '
                f'{html.escape(fn.replace("pitchvision_", "").replace(".html", ""))}</strong></a>'
            )
    doc = f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{html.escape(brand)} · deliver 入口</title>
<style>{HUB_CSS}</style></head><body>
<div class="wrap">
<h1>{html.escape(brand)} · 交付入口</h1>
<p class="meta">HTML 镜像 · 比 MD 好读 · 确认文案后用同页转 PDF</p>
<span class="badge">证伪 CONDITIONAL</span>
<div class="sec">会前阅读序</div>
{''.join(cards)}
<p class="note">真源仍是 case 根目录 MD。PDF 规则见同目录 <code>PDF_RULES.md</code>。
打印：Chrome → 另存为 PDF → 关闭页眉页脚 · A4 · 背景图形开。</p>
</div></body></html>"""
    write(out / "index.html", doc)


def chrome_pdf(html_path: Path, pdf_path: Path) -> None:
    if not CHROME.is_file():
        raise SystemExit("未找到 Google Chrome，无法自动出 PDF")
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    url = html_path.resolve().as_uri()
    subprocess.run(
        [
            str(CHROME),
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}",
            url,
        ],
        check=True,
        capture_output=True,
    )
    print(f"  pdf   {pdf_path} ({pdf_path.stat().st_size:,} B)")


def build_case(slug: str, *, do_pdf: bool) -> None:
    case = CASES / slug
    if not case.is_dir():
        raise SystemExit(f"missing case: {case}")
    brand = {
        "byd": "比亚迪 BYD",
        "geely-international": "吉利国际 Geely International",
        "赞意广告": "赞意广告 Goodidea",
    }.get(slug, slug)
    out = case / "deliver"
    out.mkdir(parents=True, exist_ok=True)
    nav = (
        '<a href="index.html">入口</a>'
        '<a href="ONE_PAGER.html">一页纸</a>'
        '<a href="B_knife.html">刀刃</a>'
        '<a href="A_dossier.html">A 档案</a>'
        '<a href="research_iceberg.html">冰山</a>'
        '<a href="pitchvision_index.html">跳出盒子</a>'
        '<a href="FOR_MAX_PACK.html">合订</a>'
    )
    print(f"== {slug} → {out}")
    for key, path, label in collect_md(case):
        text = path.read_text(encoding="utf-8")
        title, body = md_to_html(text)
        tags = '<span class="tag">deliver</span>'
        if "CONDITIONAL" in text:
            tags += '<span class="tag warn">CONDITIONAL</span>'
        write(
            out / f"{key}.html",
            wrap_page(
                f"{brand} · {title or label}",
                body,
                nav=nav,
                tags=tags,
                footer=f"源文件 <code>{path.name}</code> · {brand}",
            ),
        )

    build_iceberg(case, out, brand, nav)
    pv = build_pitchvision(case, out, brand, nav)
    build_for_max(case, out, brand, nav)
    build_hub(out, brand, pv)

    rules = out / "PDF_RULES.md"
    rules.write_text(
        f"""# PDF 转出规则 · {brand}

对齐香飘飘 / 传音 / lining sample 的打印纪律。

## 必须

1. **从 `deliver/*.html` 转**，不要直接拿 MD 糊进 Word。
2. **Chrome 另存为 PDF**（或本脚本 `--pdf`）：
   - 关闭「页眉和页脚」
   - 打开「背景图形」
   - 纸张 **A4**
   - 边距：默认或最小（HTML 已 `@page margin:12mm`）
3. HTML 已设 `print-color-adjust:exact` + 淡蓝表头底，PDF 必须保留底色。
4. 优先出：`ONE_PAGER.pdf` · `B_knife.pdf` · `FOR_MAX_PACK.pdf`；冰山可只留 HTML。

## 命令

```bash
python3 cases/_tools/build_deliver_pack.py {slug} --pdf
```

## 禁止

- 浏览器默认页眉（标题/日期/URL）
- 改 PDF 里的数字（只改 MD 真源再重生）
""",
        encoding="utf-8",
    )
    print(f"  wrote {rules}")

    if do_pdf:
        pdf_dir = out / "pdf"
        for name in ("ONE_PAGER.html", "B_knife.html", "A_dossier.html", "FOR_MAX_PACK.html"):
            src = out / name
            if src.is_file():
                chrome_pdf(src, pdf_dir / f"{src.stem}.pdf")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", choices=["byd", "geely-international", "赞意广告", "all"])
    ap.add_argument("--pdf", action="store_true", help="Chrome headless → deliver/pdf/")
    args = ap.parse_args()
    slugs = ["byd", "geely-international", "赞意广告"] if args.slug == "all" else [args.slug]
    for s in slugs:
        build_case(s, do_pdf=args.pdf)


if __name__ == "__main__":
    main()
