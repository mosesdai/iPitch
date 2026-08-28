/**
 * L8 · Staged DeepSeek draft pipeline (NOT lobby gold).
 * Stages: research outline → ifalsify → one-pager/knife/disruptive.
 * Every file is bannered as API DRAFT.
 */
(function () {
  const DRAFT_BANNER =
    "⚠️ API DRAFT · NOT LOBBY GOLD\n" +
    "本文件由个人 DeepSeek 分阶段生成，仅供结构预览。\n" +
    "终态金标见 cases/byd|geely-international/deliver/。禁止把本草稿说成雀巢/BYD 终态。\n\n";

  function $(sel) {
    return document.querySelector(sel);
  }

  function tt(key, fallback) {
    return typeof window.t === "function" ? window.t(key) : fallback || key;
  }

  function targetPayload() {
    return {
      target: ($("#target") && $("#target").value.trim()) || "",
      customer: ($("#customer") && $("#customer").value.trim()) || "",
      internal: ($("#internal") && $("#internal").value.trim()) || "",
    };
  }

  function stagePrompts(data) {
    const base =
      "Company: " +
      data.target +
      "\nCustomer notes:\n" +
      data.customer +
      "\nInternal constraints:\n" +
      data.internal +
      "\n";
    return [
      {
        name: "01_research_outline.md",
        system:
          "You are iPitch staged draft engine. Output Markdown only. Be honest about unknowns. No fabricated IR numbers.",
        user:
          base +
          "\nStage 1 — RESEARCH OUTLINE (draft).\n" +
          "Write a structured iceberg outline (≥1200 Chinese chars if Chinese company):\n" +
          "- Entity boundaries\n- IR/financial known vs unknown\n- Competitive map (steelman)\n- Power/MEDDIC hypotheses\n- Open L0 questions\n" +
          "Mark every number 【待核实】 unless you are sure it is public.\nEnd with: DRAFT ≠ GOLD.",
      },
      {
        name: "02_ifalsify_draft.md",
        system:
          "You are ruthless ifalsify. Prefer CONDITIONAL over SURVIVES. Markdown only.",
        user:
          base +
          "\nStage 2 — IFALSIFY DRAFT.\n" +
          "Produce: Hypothesis; ≥5 disconfirm hunts; support:disconfirm asymmetry; " +
          "Verdict CONDITIONAL|KILL|PIVOT; 72h must-be-true list. Do not claim gold status.",
      },
      {
        name: "03_compose_draft.md",
        system:
          "You compose meeting pack drafts. Short knife. Honest gaps. Markdown only.",
        user:
          base +
          "\nStage 3 — COMPOSE DRAFT.\n" +
          "## ONE_PAGER\n(one tension, three questions, 72h)\n" +
          "## B_knife\n(≤1 page; print ifalsify verdict in header)\n" +
          "## BD经验缺口\n(covered vs open)\n" +
          "## disruptive - 跳出盒子\n(two concepts: Job + kill criteria — not shelf SKUs)\n" +
          "Banner that this is API draft.",
      },
    ];
  }

  async function chat(system, user, onPartial) {
    if (!window.IPitchAPI || typeof window.IPitchAPI.chat !== "function") {
      throw new Error("IPitchAPI.chat missing — configure API settings first");
    }
    return window.IPitchAPI.chat(system, user, onPartial, {
      temperature: 0.3,
      maxTokens: 8000,
    });
  }

  function renderDraftFiles(files) {
    if (typeof window.renderFiles === "function") {
      window.renderFiles(files, { round: "staged-generate-btn" });
      return;
    }
    const tabs = $("#file-tabs");
    const box = $("#preview-box");
    const section = $("#output-section");
    if (!tabs || !box) {
      console.log(files);
      return;
    }
    if (section) section.classList.add("visible");
    tabs.innerHTML = files
      .map(
        (f, i) =>
          `<button type="button" class="file-tab${i === 0 ? " active" : ""}" data-i="${i}">${f.name}</button>`
      )
      .join("");
    const show = (i) => {
      box.textContent = files[i].content;
      tabs.querySelectorAll(".file-tab").forEach((el, j) => {
        el.classList.toggle("active", j === i);
      });
    };
    tabs.querySelectorAll(".file-tab").forEach((el) => {
      el.addEventListener("click", () => show(Number(el.getAttribute("data-i"))));
    });
    show(0);
  }

  async function runStaged() {
    const data = targetPayload();
    if (!data.target) {
      alert(tt("productNeedTarget", "请先填写目标客户"));
      return;
    }
    const cfg = window.IPitchAPI.loadConfig ? window.IPitchAPI.loadConfig() : null;
    const viaProxy = cfg && window.IPitchAPI.usesProxy && window.IPitchAPI.usesProxy(cfg);
    if (cfg && !viaProxy && !cfg.apiKey) {
      alert(tt("noApiKey", "请先配置 DeepSeek API Key"));
      return;
    }

    const btn = $("#staged-generate-btn");
    const status = $("#status-bar") || $("#product-status");
    if (btn) btn.disabled = true;
    const stages = stagePrompts(data);
    const out = [];
    let context = "";

    try {
      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        if (status) {
          status.style.display = "";
          status.textContent =
            "分阶段草稿 " + (i + 1) + "/" + stages.length + " · " + s.name + "（API DRAFT）…";
        }
        const user =
          s.user +
          (context ? "\n\n---\nPrior draft context:\n" + context.slice(0, 6000) : "");
        const raw = await chat(s.system, user, (partial) => {
          if (status) status.textContent = "流式中 " + s.name + "… " + partial.length + " chars";
        });
        out.push({ name: s.name, content: DRAFT_BANNER + raw });
        context += "\n\n# " + s.name + "\n" + raw;
      }
      out.unshift({
        name: "00_DRAFT_README.md",
        content:
          DRAFT_BANNER +
          "# Staged DeepSeek draft pack\n\n" +
          "- Not lobby gold\n" +
          "- Compare against cases/byd or geely-international deliver/\n" +
          "- Re-run: python3 -m engine.run --lobby-floor\n",
      });
      renderDraftFiles(out);
      if (status) {
        status.textContent = tt(
          "stagedDone",
          "分阶段 API 草稿完成（非金标）· 请对照比亚迪/吉利 deliver"
        );
      }
    } catch (err) {
      if (status) status.textContent = "分阶段草稿失败：" + (err.message || err);
      console.error(err);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function boot() {
    const btn = $("#staged-generate-btn");
    if (btn) btn.addEventListener("click", runStaged);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
