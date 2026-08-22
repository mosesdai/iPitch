/**
 * Pitch Studio · R2 post-meeting form (product surface).
 * Six sales_input fields → personal DeepSeek API → evolved report + shelf.
 * Quality honesty: API = structured draft; Apple samples = case-tier reference.
 */
(function () {
  const FIELD_IDS = {
    company: "r2-company",
    customer_quote: "r2-customer-quote",
    budget_path: "r2-budget-path",
    decision_chain: "r2-decision-chain",
    knife_judgment: "r2-knife-judgment",
    competitor_moves: "r2-competitor-moves",
    cannot_sell: "r2-cannot-sell",
  };

  const REQUIRED = [
    "customer_quote",
    "budget_path",
    "decision_chain",
    "knife_judgment",
    "competitor_moves",
    "cannot_sell",
  ];

  const APPLE_FILL = {
    zh: {
      company: "Apple",
      customer_quote: "「我们更想先把大中华 Services 讲清楚，再谈全国铺开。」",
      budget_path: "科目未明 — 倾向 brand/activation 试验；media 全年包待核实",
      decision_chain: "Brand + Retail 共议；Economic Buyer 未点名；合规可否决直播方案",
      knife_judgment: "采纳 T1 方向，弱化 FY25 恐吓；iPod「China Court OS」仅内部讨论不上架",
      competitor_moves: "国内高端手机+内容联名增多；体育赞助价码被追问",
      cannot_sell: "不承诺美媒权叙事安慰剂；不承诺无熔断全国铺开；不编三年 CAGR",
    },
    en: {
      company: "Apple",
      customer_quote: "“We want Greater China Services story clear before a national rollout.”",
      budget_path: "Fund path unclear — lean brand/activation pilot; year-round media TBD",
      decision_chain: "Brand + Retail jointly; Economic Buyer unnamed; Compliance can veto live streams",
      knife_judgment: "Keep T1; soften FY25 scare; iPod China Court OS internal only — off shelf",
      competitor_moves: "More domestic premium + content collabs; sports sponsorship pricing questioned",
      cannot_sell: "No US media-rights placebo; no national rollout without kill-switch; no fabricated 3-yr CAGR",
    },
  };

  const SHELF_HINT = `
Shelf IDs only from catalog (examples): SH-EVT-001, SH-MED-002, SH-EDU-001, SH-VEN-001, SH-CHN-001, SH-CNV-001, SH-DIG-001, SH-ESG-001.
Hard rule: NO bespoke iPod / pitchvision / China Court OS names in shelf recommendations for the customer.
`;

  const $ = (sel) => document.querySelector(sel);
  let files = { evolved: "", shelf: "" };
  let activeTab = "evolved";
  let lastStatusKey = null;

  function isEn() {
    return (window.IPITCH_LANG || "zh") === "en";
  }

  function tt(key) {
    return typeof window.t === "function" ? window.t(key) : key;
  }

  function setStatus(msg, key) {
    const el = $("#r2-status");
    if (!el) return;
    el.textContent = msg || "";
    lastStatusKey = key || null;
  }

  function readFields() {
    const out = {};
    for (const [key, id] of Object.entries(FIELD_IDS)) {
      const el = document.getElementById(id);
      out[key] = el ? el.value.trim() : "";
    }
    return out;
  }

  function missingFields(data) {
    const miss = [];
    if (!data.company) miss.push("company");
    for (const k of REQUIRED) {
      const v = data[k];
      if (!v || ["tbd", "todo", "未知"].includes(v.toLowerCase())) miss.push(k);
    }
    return miss;
  }

  function applyFill() {
    const pack = isEn() ? APPLE_FILL.en : APPLE_FILL.zh;
    for (const [key, id] of Object.entries(FIELD_IDS)) {
      const el = document.getElementById(id);
      if (el && pack[key] != null) el.value = pack[key];
    }
    setStatus(tt("r2FilledApple"), "r2FilledApple");
    const out = $("#r2-output");
    if (out) out.hidden = true;
  }

  function buildSystemPrompt() {
    const lang = isEn() ? "English" : "Chinese (简体中文)";
    return `You are iPitch R2 evolve+shelf composer for Pitch Studio.
Language of all deliverables: ${lang}.
Do NOT invent customer quotes beyond what sales provided.
Do NOT put bespoke iPod / pitchvision concepts into shelf recommendations.
Output exactly two FILE envelopes (no prose outside them):

===FILE: R2_evolved_report.md===
...markdown...
===END===

===FILE: R2_shelf_recommendations.md===
...markdown...
===END===

R2_evolved_report.md must include:
1. 产品是什么 (one-liner + three sentences)
2. 变体张力 (R1 knife judgment applied)
3. Teaching / Reframe (Challenger paragraph)
4. Exactly 5 opening questions embedded in narrative (each: if client answers X → points to main C Y)
5. 买不买卡点 table (checkpoint | status | one evidence line)

R2_shelf_recommendations.md must include 2–3 combos with shelf IDs, fit reasons, and explicit exclusions.
${SHELF_HINT}
Be honest about L0 gaps. Prefer structured draft quality over fabricated thickness.`;
  }

  function buildUserPrompt(data) {
    return `# R2 sales_input (required six fields)

Company: ${data.company}

| field | value |
|-------|-------|
| customer_quote | ${data.customer_quote} |
| budget_path | ${data.budget_path} |
| decision_chain | ${data.decision_chain} |
| knife_judgment | ${data.knife_judgment} |
| competitor_moves | ${data.competitor_moves} |
| cannot_sell | ${data.cannot_sell} |

Compose R2_evolved_report.md + R2_shelf_recommendations.md now.
Reference bar (structure only): Apple case R2 samples — do not copy Apple facts unless this company is Apple.`;
  }

  function parseBlocks(raw) {
    if (window.IPitchPrompts && typeof window.IPitchPrompts.parseFileBlocks === "function") {
      return window.IPitchPrompts.parseFileBlocks(raw);
    }
    const list = [];
    const re = /===FILE:\s*(.+?)===\s*\n([\s\S]*?)===END===/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      list.push({ name: m[1].trim(), content: m[2].trim() });
    }
    if (!list.length && raw.trim()) list.push({ name: "output.md", content: raw.trim() });
    return list;
  }

  function splitFiles(parsed) {
    let evolved = "";
    let shelf = "";
    for (const f of parsed) {
      const n = (f.name || "").toLowerCase();
      if (n.includes("shelf")) shelf = f.content;
      else if (n.includes("evolved") || n.includes("r2_")) evolved = evolved || f.content;
      else if (!evolved) evolved = f.content;
      else if (!shelf) shelf = f.content;
    }
    if (!evolved && parsed[0]) evolved = parsed[0].content;
    if (!shelf) {
      shelf =
        (isEn()
          ? "# R2 shelf (thin API)\n\nAPI did not return a separate shelf block. Structure placeholder — compare Apple sample.\n\n### Combo A · TBD\n- **Main C**: TBD\n- **Shelf IDs**: fill from catalog after thicker pass\n"
          : "# R2 货架（API 偏薄）\n\n模型未单独返回货架块。结构占位 — 请对照 Apple 样例补厚。\n\n### 组合 A · 待补\n- **主 C**：待定\n- **货架 ID**：厚包路径再从 catalog 选定\n");
    }
    return { evolved, shelf };
  }

  function simpleMd(md) {
    return (
      "<div class=\"md\"><pre>" +
      String(md || "").replace(/</g, "&lt;") +
      "</pre></div>"
    );
  }

  function renderPreview() {
    const box = $("#r2-preview");
    if (!box) return;
    const text = activeTab === "shelf" ? files.shelf : files.evolved;
    box.innerHTML = simpleMd(text);
    document.querySelectorAll("[data-r2-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-r2-tab") === activeTab);
    });
  }

  function showOutput(parsed) {
    files = splitFiles(parsed);
    activeTab = "evolved";
    const out = $("#r2-output");
    if (out) out.hidden = false;
    renderPreview();
    out && out.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function openSettings() {
    const modal = $("#settings-modal");
    if (modal) modal.classList.add("open");
  }

  function ensureApi() {
    if (!window.IPitchAPI) {
      setStatus(tt("r2NoApiModule"), "r2NoApiModule");
      return false;
    }
    const cfg = window.IPitchAPI.loadConfig();
    const viaProxy = window.IPitchAPI.usesProxy(cfg);
    if (!viaProxy && !cfg.apiKey) {
      setStatus(tt("r2NeedKey"), "r2NeedKey");
      openSettings();
      return false;
    }
    return true;
  }

  async function runEvolve() {
    const data = readFields();
    const miss = missingFields(data);
    if (miss.length) {
      setStatus(tt("r2NeedFields"), "r2NeedFields");
      const first = miss[0] === "company" ? FIELD_IDS.company : FIELD_IDS[miss[0]];
      const el = document.getElementById(first);
      el && el.focus();
      return;
    }
    if (!ensureApi()) return;

    const btn = $("#r2-evolve-btn");
    if (btn) btn.disabled = true;
    setStatus(tt("r2Generating"), "r2Generating");

    const out = $("#r2-output");
    if (out) {
      out.hidden = false;
      files = { evolved: "", shelf: "" };
      activeTab = "evolved";
      const box = $("#r2-preview");
      if (box) {
        box.innerHTML =
          '<div class="stream-preview"><div class="stream-label">' +
          tt("r2Streaming") +
          '</div><pre class="stream-text"></pre></div>';
      }
    }

    try {
      const system = buildSystemPrompt();
      const user = buildUserPrompt(data);
      const raw = await window.IPitchAPI.chat(system, user, (partial) => {
        setStatus(tt("r2Streaming"), "r2Streaming");
        const pre = $("#r2-preview .stream-text");
        if (pre) pre.textContent = partial;
      });
      const parsed = parseBlocks(raw);
      showOutput(parsed);
      const thin = !parsed.some((f) => /shelf/i.test(f.name));
      setStatus(
        thin ? tt("r2DoneThin") : tt("r2Done"),
        thin ? "r2DoneThin" : "r2Done"
      );
    } catch (err) {
      let msg = err.message || String(err);
      if (msg === "NO_API_KEY") {
        msg = tt("r2NeedKey");
        openSettings();
      } else if (msg.includes("Failed to fetch") || msg.includes("CORS")) {
        msg += isEn()
          ? " — CORS: set Proxy URL in API settings or use a local proxy."
          : " — CORS：请在 API 设置填 Proxy URL，或走本机代理。";
      }
      setStatus(tt("r2Error") + ": " + msg, "r2Error");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function copyCurrent() {
    const text = activeTab === "shelf" ? files.shelf : files.evolved;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const btn = $("#r2-copy-btn");
      if (!btn) return;
      const prev = btn.textContent;
      btn.textContent = tt("copied");
      setTimeout(() => {
        btn.textContent = tt("r2Copy");
      }, 1200);
      void prev;
    });
  }

  function downloadCurrent() {
    const text = activeTab === "shelf" ? files.shelf : files.evolved;
    if (!text) return;
    const name =
      activeTab === "shelf" ? "R2_shelf_recommendations.md" : "R2_evolved_report.md";
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function syncI18n() {
    const root = $("#product-r2");
    if (!root) return;
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = tt(key);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = tt(el.getAttribute("data-i18n-placeholder"));
    });
    root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", tt(el.getAttribute("data-i18n-aria")));
    });
    if (lastStatusKey && lastStatusKey !== "r2Error") {
      setStatus(tt(lastStatusKey), lastStatusKey);
    }
    if (!$("#r2-output")?.hidden) renderPreview();
  }

  function onLangChange() {
    const company = ($("#r2-company") && $("#r2-company").value) || "";
    if (/^apple$/i.test(company.trim()) || /苹果/.test(company)) {
      const q = $("#r2-customer-quote");
      // Only auto-swap if current fill looks like sample (optional soft): swap when Apple fill chip was used
      if (q && /Greater China Services|大中华 Services/.test(q.value)) {
        applyFill();
      }
    }
    syncI18n();
  }

  function boot() {
    if (!$("#product-r2")) return;
    $("#r2-evolve-btn")?.addEventListener("click", runEvolve);
    $("#r2-fill-apple")?.addEventListener("click", applyFill);
    $("#r2-open-settings")?.addEventListener("click", openSettings);
    $("#r2-copy-btn")?.addEventListener("click", copyCurrent);
    $("#r2-download-btn")?.addEventListener("click", downloadCurrent);
    document.querySelectorAll("[data-r2-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTab = btn.getAttribute("data-r2-tab") || "evolved";
        renderPreview();
      });
    });
    syncI18n();
  }

  window.IPitchR2Form = { onLangChange, syncI18n };

  // Extend product-demo lang hook if present
  const prev = window.IPitchProductDemo;
  if (prev && typeof prev.onLangChange === "function") {
    const orig = prev.onLangChange.bind(prev);
    prev.onLangChange = function () {
      orig();
      onLangChange();
    };
  } else {
    window.IPitchProductDemo = Object.assign({}, prev || {}, {
      onLangChange: onLangChange,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
