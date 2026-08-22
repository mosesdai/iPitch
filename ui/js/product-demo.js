/**
 * Roadshow product surface: input → high-quality pack (mapped to finished cases).
 * Apple is bilingual: IPITCH_LANG selects ZH vs EN pack links + fill.
 * Nestlé / XPP / NIO keep ZH fill content (content language ≠ UI chrome).
 * Apple chip is the EN pack demo when UI is EN.
 */
(function () {
  const PACKS = {
    nestle: {
      id: "nestle",
      name: "雀巢中国",
      name_en: "Nestlé China",
      keys: ["雀巢", "nestle", "nescafe", "咖啡"],
      fill: {
        target: "雀巢中国",
        customer: "会面目的：体育/内容合作摸底；关键人偏品牌+媒介；预算待核实。",
        internal: "标准合同；不承诺超期独家；要可量化触达与证伪清单。",
      },
      blurb: "会前双材料 · 销售三问 · 冰山标杆 · CONDITIONAL",
      blurb_en: "Dual pack · 3 sales Qs · iceberg benchmark · CONDITIONAL",
      links: [
        { label: "打开一页关键", label_en: "Open one-pager", href: "../cases/nestle/html/ONE_PAGER.html", primary: true },
        { label: "打开完整研报", label_en: "Open deep research", href: "../cases/nestle/html/research/iceberg.html", primary: true },
        { label: "案包入口", label_en: "Pack entry", href: "../cases/nestle/html/index.html" },
      ],
    },
    xpp: {
      id: "xpp",
      name: "香飘飘",
      name_en: "Xiangpiaopiao",
      keys: ["香飘飘", "xiangpiaopiao", "xpp"],
      fill: {
        target: "香飘飘",
        customer: "会面目的：品牌合作；季节性与年轻化议题。",
        internal: "双材料+销售清单必须齐；厚度对标本标准源头。",
      },
      blurb: "厚度与双材料标准源头 · ONE_PAGER · PRIMARY · ifalsify",
      blurb_en: "Thickness standard source · ONE_PAGER · PRIMARY · ifalsify",
      links: [
        { label: "打开一页关键", label_en: "Open one-pager", href: "../cases/xiangpiaopiao/html/ONE_PAGER.html", primary: true },
        { label: "打开完整研报", label_en: "Open deep research", href: "../cases/xiangpiaopiao/html/research/iceberg.html", primary: true },
        { label: "案包入口", label_en: "Pack entry", href: "../cases/xiangpiaopiao/html/index.html" },
      ],
    },
    nio: {
      id: "nio",
      name: "蔚来 NIO",
      name_en: "NIO",
      keys: ["蔚来", "nio", "乐道"],
      fill: {
        target: "蔚来 NIO",
        customer: "会面目的：品牌/内容合作；对照案。",
        internal: "结构可对齐；刀要够狠才进主秀。",
      },
      blurb: "同档结构对照 · 可用于说明 cold 刀不够",
      blurb_en: "Same-bar structure · shows when cold knife is not sharp enough",
      links: [
        { label: "打开一页关键", label_en: "Open one-pager", href: "../cases/nio/html/ONE_PAGER.html", primary: true },
        { label: "打开完整研报", label_en: "Open deep research", href: "../cases/nio/html/research/iceberg.html", primary: true },
        { label: "刀子", label_en: "Knife", href: "../cases/nio/html/B_knife.html" },
      ],
    },
    apple: {
      id: "apple",
      name: "Apple",
      name_en: "Apple",
      keys: ["apple", "苹果"],
      bilingual: true,
      fill_zh: {
        target: "Apple（苹果）",
        customer: "会面目的：品牌/Services 合作摸底；关注大中华窗口与体育 OS。",
        internal: "双材料+销售三问；禁编三年 CAGR；对标雀巢同档。",
      },
      fill_en: {
        target: "Apple Inc.",
        customer:
          "Meeting goal: explore brand / Services partnership.\nStakeholder lean: brand + retail + content.\nBudget: TBD — diagnose only until Economic Buyer is clear.",
        internal:
          "Dual pack + 3 sales questions required.\nNo fabricated 3-yr China CAGR.\nAlign to Nestlé / Xiangpiaopiao pre-meeting bar.\nBanned: US media-rights scare · “China is gone” · +38% = permanent.",
      },
      blurb: "同档案 · 会前双材料 · 销售三问 · 中英双语",
      blurb_en: "Same-bar pack · dual materials · 3 Qs · EN/ZH bilingual",
      links_zh: [
        { label: "打开一页关键（中）", href: "../cases/apple/html/ONE_PAGER.html", primary: true },
        { label: "打开完整研报（中）", href: "../cases/apple/html/research/iceberg.html", primary: true },
        { label: "案包入口（中）", href: "../cases/apple/html/index.html" },
        { label: "刀子（中）", href: "../cases/apple/html/B_knife.html" },
      ],
      links_en: [
        { label: "Open one-pager (EN)", href: "../cases/apple/html/ONE_PAGER_en.html", primary: true },
        { label: "Open deep research (EN)", href: "../cases/apple/html/research/iceberg_en.html", primary: true },
        { label: "Pack entry (EN)", href: "../cases/apple/html/index_en.html" },
        { label: "Knife (EN)", href: "../cases/apple/html/B_knife_en.html" },
      ],
    },
    transsion: {
      id: "transsion",
      name: "传音控股",
      name_en: "Transsion",
      keys: ["传音", "transsion", "tecno", "infinix", "itel", "传音控股"],
      fill: {
        target: "传音控股",
        customer: "会面目的：品牌/中高端文化合作摸底；TECNO 非洲杯资产已厚；试验预算待核实。",
        internal: "双材料+销售三问；禁混用 40%/48%；禁「非洲崩了」；对标香飘飘后期标准。",
      },
      blurb: "会前双材料 · 销售三问 · 冰山 ≈29k · CONDITIONAL",
      blurb_en: "Dual pack · 3 sales Qs · ~29k iceberg · CONDITIONAL",
      links: [
        { label: "打开给Max包", label_en: "Open Max pack", href: "../cases/transsion/html/传音控股_给Max会前包.html", primary: true },
        { label: "打开一页关键", label_en: "Open one-pager", href: "../cases/transsion/html/传音控股_一页关键信息.html", primary: true },
        { label: "打开完整研报", label_en: "Open deep research", href: "../cases/transsion/html/research/传音控股_冰山深度研究.html", primary: true },
        { label: "案包入口", label_en: "Pack entry", href: "../cases/transsion/html/传音控股_会前双材料入口.html" },
      ],
    },
  };

  const CHIP_I18N = {
    nestle: "chipNestle",
    xpp: "chipXpp",
    nio: "chipNio",
    apple: "chipApple",
    transsion: "chipTranssion",
  };

  const $ = (sel) => document.querySelector(sel);
  let lastResult = null; // { pack, exact, typed }
  let lastStatusKey = null; // for re-apply on lang change
  let lastStatusName = null;

  function isEn() {
    return (window.IPITCH_LANG || "zh") === "en";
  }

  function tt(key) {
    return typeof window.t === "function" ? window.t(key) : key;
  }

  function packName(pack) {
    return isEn() && pack.name_en ? pack.name_en : pack.name;
  }

  function packBlurb(pack) {
    return isEn() && pack.blurb_en ? pack.blurb_en : pack.blurb;
  }

  function packFill(pack) {
    if (pack.bilingual) {
      return isEn() ? pack.fill_en : pack.fill_zh;
    }
    return pack.fill;
  }

  function packLinks(pack) {
    if (pack.bilingual) {
      return isEn() ? pack.links_en : pack.links_zh;
    }
    return pack.links;
  }

  function linkLabel(l) {
    return isEn() && l.label_en ? l.label_en : l.label;
  }

  function matchPack(raw) {
    const t = (raw || "").trim().toLowerCase();
    if (!t) return null;
    for (const pack of Object.values(PACKS)) {
      if (pack.keys.some((k) => t.includes(k.toLowerCase()))) return { pack, exact: true };
    }
    return { pack: PACKS.nestle, exact: false };
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function setStatus(text, key, name) {
    const status = $("#product-status");
    if (!status) return;
    status.textContent = text;
    lastStatusKey = key || null;
    lastStatusName = name || null;
  }

  function renderResult(pack, exact, typed, scroll) {
    const result = $("#product-result");
    const meta = $("#result-meta");
    const actions = $("#result-actions");
    const note = $("#result-note");
    if (!result || !meta || !actions || !note) return;

    lastResult = { pack, exact, typed };

    const name = packName(pack);
    const blurb = packBlurb(pack);
    if (isEn()) {
      meta.textContent = exact
        ? `${name} · ${blurb}`
        : `Input “${typed}” → demo maps to benchmark “${name}” · ${blurb}`;
      note.textContent = exact
        ? pack.bilingual
          ? "Language toggle switches ZH/EN deliverables. Open one-pager + deep research to present."
          : "Same-bar finished quality. Open one-pager + deep research to present. Nestlé fill may stay Chinese (content ≠ UI)."
        : "Unmatched names replay Nestlé benchmark for quality demo. New-company depth needs personal/company compute.";
    } else {
      meta.textContent = exact
        ? `${name} · ${blurb}`
        : `输入「${typed}」→ 演示映射到标杆「${name}」· ${blurb}`;
      note.textContent = exact
        ? pack.bilingual
          ? "切换顶栏中/EN 会切换中英产出链接。点开一页关键与研报即可投屏。"
          : "这是同档终态品质。点开一页关键与研报即可投屏。"
        : "未命中预制案时回放到雀巢标杆。新公司同档厚包需个人/公司算力。";
    }

    actions.innerHTML = packLinks(pack)
      .map((l) => {
        const cls = l.primary ? "btn btn-primary" : "btn btn-secondary";
        return `<a class="${cls}" href="${l.href}" target="_blank" rel="noopener">${linkLabel(l)}</a>`;
      })
      .join("");

    result.hidden = false;
    if (scroll !== false) {
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function runGenerate() {
    const targetEl = $("#target");
    const btn = $("#product-generate-btn");
    const typed = (targetEl && targetEl.value) || "";
    if (!typed.trim()) {
      alert(tt("productNeedTarget"));
      targetEl && targetEl.focus();
      return;
    }

    const matched = matchPack(typed);
    if (!matched) return;

    btn.disabled = true;
    setStatus(tt("productGenerating"), "productGenerating");
    await sleep(700);
    setStatus(tt("productAssembling"), "productAssembling");
    await sleep(650);
    setStatus(tt("productDone"), "productDone");
    renderResult(matched.pack, matched.exact, typed.trim());
    btn.disabled = false;

    const ask = $("#resource-ask");
    if (ask) ask.classList.add("ask-highlight");
  }

  function applyFill(id) {
    const pack = PACKS[id];
    if (!pack) return;
    const fill = packFill(pack);
    $("#target").value = fill.target;
    $("#customer").value = fill.customer;
    $("#internal").value = fill.internal;
    const name = packName(pack);
    setStatus(tt("productFilled").replace("{name}", name), "productFilled", name);
    $("#product-result").hidden = true;
    lastResult = null;
  }

  function syncChipLabels() {
    document.querySelectorAll("[data-fill]").forEach((chip) => {
      const id = chip.getAttribute("data-fill");
      const key = CHIP_I18N[id];
      if (key) chip.textContent = tt(key);
    });
    const gen = $("#product-generate-btn");
    if (gen) gen.textContent = tt("productGenerate");
  }

  /** Phase II card: re-apply data-i18n after lang toggle (hard-refresh safe via boot applyI18n too). */
  function syncR2Card() {
    const root = $("#product-r2");
    if (!root) return;
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = tt(key);
    });
  }

  function refreshStatusForLang() {
    if (!lastStatusKey) return;
    if (lastStatusKey === "productFilled" && lastStatusName) {
      setStatus(tt("productFilled").replace("{name}", lastStatusName), "productFilled", lastStatusName);
    } else {
      setStatus(tt(lastStatusKey), lastStatusKey);
    }
  }

  function onLangChange() {
    // Apple fill follows UI language; Nestlé/XPP/NIO keep Chinese content values.
    const target = ($("#target") && $("#target").value) || "";
    if (/apple|苹果/i.test(target) && PACKS.apple) {
      const fill = packFill(PACKS.apple);
      $("#target").value = fill.target;
      $("#customer").value = fill.customer;
      $("#internal").value = fill.internal;
    }
    if (lastResult && !$("#product-result").hidden) {
      renderResult(lastResult.pack, lastResult.exact, lastResult.typed, false);
    }
    syncChipLabels();
    syncR2Card();
    refreshStatusForLang();
  }

  function boot() {
    const btn = $("#product-generate-btn");
    if (!btn) return;
    btn.addEventListener("click", runGenerate);
    document.querySelectorAll("[data-fill]").forEach((chip) => {
      chip.addEventListener("click", () => applyFill(chip.getAttribute("data-fill")));
    });

    // Lang refresh via window.IPitchProductDemo.onLangChange (called from app.js setLang).
    syncChipLabels();
    syncR2Card();

    const params = new URLSearchParams(location.search);
    const demo = params.get("demo");
    if (demo && PACKS[demo]) applyFill(demo);
    if (location.hash === "#product-run" || demo) {
      $("#product-run")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  window.IPitchProductDemo = { onLangChange, syncChipLabels, syncR2Card, PACKS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
