/**
 * iPitch main application
 */
(function () {
  window.IPITCH_LANG = localStorage.getItem("ipitch_lang") || "zh";

  let currentFiles = [];
  let activeFileIndex = 0;
  let selectedRound = "R1";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function applyI18n() {
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = window.t(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        if (el.hasAttribute("data-i18n-placeholder")) el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });
    $$("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = window.t(el.getAttribute("data-i18n-placeholder"));
    });
    $$("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", window.t(el.getAttribute("data-i18n-aria")));
    });
    document.documentElement.lang = window.IPITCH_LANG === "zh" ? "zh-CN" : "en";
    document.title = window.t("pageTitle");
    $("#lang-zh").classList.toggle("active", window.IPITCH_LANG === "zh");
    $("#lang-en").classList.toggle("active", window.IPITCH_LANG === "en");
    updateApiStatus();
  }

  function setLang(lang) {
    window.IPITCH_LANG = lang;
    localStorage.setItem("ipitch_lang", lang);
    applyI18n();
    renderHelpLists();
    if (window.IPitchProductDemo && typeof window.IPitchProductDemo.onLangChange === "function") {
      window.IPitchProductDemo.onLangChange();
    }
  }

  function getFormData() {
    let outputs = [];
    $$('input[name="out"]:checked').forEach((cb) => outputs.push(cb.value));

    const wantsResearchOrKnife = outputs.includes("research") || outputs.includes("knife") || selectedRound === "R1" || selectedRound === "full";

    // Enforce v1.6 quality gates
    if (wantsResearchOrKnife) {
      ["ifalsify", "traceability", "onepager", "primary", "maxaudit", "research"].forEach((k) => {
        if (!outputs.includes(k)) outputs.push(k);
      });
    }

    const formats = [];
    $$('input[name="fmt"]:checked').forEach((cb) => formats.push(cb.value));
    if (wantsResearchOrKnife && !formats.includes("html")) formats.push("html");
    if (!formats.includes("md")) formats.push("md");

    return {
      target: $("#target").value.trim(),
      customer: $("#customer").value.trim(),
      internal: $("#internal").value.trim(),
      round: selectedRound === "full" ? "full" : selectedRound,
      outputs: outputs,
      formats: formats.length ? formats : ["md", "html"],
      gatesEnforced: wantsResearchOrKnife
    };
  }

  function validateForm() {
    const data = getFormData();
    if (!data.target) {
      alert(window.IPITCH_LANG === "zh" ? "请填写目标公司" : "Please enter target company");
      return null;
    }
    return data;
  }

  function updateSteps(round) {
    const map = { R1: 1, R2: 2, R3: 3, full: 1 };
    const active = map[round] || 0;
    $$(".step").forEach((s, i) => s.classList.toggle("active", i <= active));
  }

  function showStatus(msg, type) {
    const bar = $("#status-bar");
    bar.className = "status-bar" + (type ? " " + type : "");
    bar.innerHTML = type === "loading"
      ? '<div class="spinner"></div><span>' + msg + "</span>"
      : "<span>" + msg + "</span>";
    bar.style.display = "flex";
  }

  function hideStatus() {
    $("#status-bar").style.display = "none";
  }

  function slugFromTarget(target) {
    return (target || "case")
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "case";
  }

  function parseQualityPassport(files) {
    const passportFile = files.find((f) => /quality_passport\.json$/i.test(f.name));
    if (!passportFile) return null;
    try {
      return JSON.parse(passportFile.content);
    } catch {
      return null;
    }
  }

  function renderGateStatus(files, data = {}) {
    const gateEl = $("#gate-status");
    if (!gateEl) return;

    const hasIceberg = files.some((f) => /iceberg|research\//i.test(f.name) || /^research\//i.test(f.name));
    const hasTrace = files.some((f) => /traceab|timeliness/i.test(f.name));
    const hasFalsify = files.some((f) => /ifalsify|falsif/i.test(f.name));
    const hasOnePager = files.some((f) => /one_?pager/i.test(f.name));
    const hasPrimary = files.some((f) => /primary_required|PRIMARY_REQUIRED/i.test(f.name));
    const hasMax = files.some((f) => /max_gap|MAX_GAP/i.test(f.name));
    const hasDual = files.some((f) => /html\/index\.html$/i.test(f.name) || f.name === "html/index.html");
    const enforced = data.gatesEnforced || hasIceberg || hasTrace || hasFalsify || hasOnePager;

    if (!enforced) {
      gateEl.style.display = "none";
      return;
    }

    const passport = parseQualityPassport(files);
    const zh = window.IPITCH_LANG === "zh";
    const parts = [];
    let warnLow = false;

    const flag = (ok, okZh, okEn, badZh, badEn) =>
      parts.push((ok ? "✅ " : "⚠️ ") + (zh ? (ok ? okZh : badZh) : (ok ? okEn : badEn)));

    if (passport) {
      const icebergCount = passport.iceberg_char_count ?? passport.icebergCharCount;
      if (icebergCount != null) {
        const n = Number(icebergCount);
        const failFloor = n < 8000;
        const thinDefault = n < 20000;
        warnLow = failFloor || thinDefault;
        parts.push(
          (failFloor ? "🔴" : thinDefault ? "⚠️" : "✅") +
          (zh ? " 冰山 " : " Iceberg ") +
          n.toLocaleString() +
          (zh ? " 字" : " chars") +
          (failFloor
            ? (zh ? "（<8000 硬下限）" : " (<8000 floor)")
            : thinDefault
              ? (zh ? "（<2万，未达香飘飘默认厚度）" : " (<20k, below XPP default)")
              : "")
        );
      }
      const aCount = passport.num_a_tier_facts ?? passport.a_tier_facts ?? passport.aTierFacts;
      const bCount = passport.num_b_tier_facts ?? passport.b_tier_facts ?? passport.bTierFacts;
      if (aCount != null || bCount != null) {
        parts.push(
          "✅ " + (zh ? "溯源 A/B" : "Sources A/B") + ": " +
          (aCount != null ? "A=" + aCount : "A=?") + " · " +
          (bCount != null ? "B=" + bCount : "B=?")
        );
      }
      const verdict = passport.ifalsify_verdict ?? passport.ifalsify_overall_verdict ?? passport.ifalsifyVerdict;
      if (verdict) {
        const v = String(verdict).toUpperCase();
        const icon = v === "KILL" ? "🔴" : v === "PIVOT" ? "🟡" : v === "CONDITIONAL" ? "🟢" : "⚠️";
        parts.push(icon + " ifalsify: " + v);
      }
      if (passport.main_tension) {
        parts.push((zh ? "张力" : "Tension") + ": " + String(passport.main_tension).slice(0, 80));
      }
    }

    flag(hasOnePager, "ONE_PAGER", "ONE_PAGER", "缺 ONE_PAGER", "missing ONE_PAGER");
    flag(hasPrimary, "PRIMARY", "PRIMARY", "缺 PRIMARY", "missing PRIMARY");
    flag(hasMax, "MAX_GAP", "MAX_GAP", "缺 MAX_GAP", "missing MAX_GAP");
    flag(hasDual && hasOnePager, "双材料入口", "dual-pack index", "缺双材料入口", "missing dual-pack index");
    flag(hasIceberg, "冰山研究", "Iceberg", "缺冰山", "missing iceberg");
    flag(hasTrace, "溯源账本", "Traceability", "缺溯源", "missing trace");
    flag(hasFalsify, "反昏君报告", "ifalsify", "缺证伪", "missing ifalsify");

    if (!hasOnePager || !hasPrimary || !hasMax || !hasFalsify) warnLow = true;

    gateEl.style.display = "block";
    gateEl.className = warnLow ? "gate-status gate-warn" : "gate-status gate-ok";
    gateEl.innerHTML =
      "<strong>" + window.t("gateStatus") + " v1.6</strong>：" +
      parts.join(" · ") +
      (passport
        ? ""
        : '<span style="margin-left:8px;color:var(--muted);">' +
          (zh ? "（文件名推断；未找到 quality_passport.json）" : " (filename fallback; no quality_passport.json)") +
          "</span>") +
      '<span style="margin-left:8px;color:#059669;">' +
      (zh ? "（同档=雀巢/香飘飘；一键 API 草稿勿当过线）" : " (full bar = Nestlé/XPP; API draft ≠ pass)") +
      "</span>";
  }

  function renderFiles(files, data = {}) {
    currentFiles = files;
    activeFileIndex = 0;
    const tabs = $("#file-tabs");
    tabs.innerHTML = "";
    files.forEach((f, i) => {
      const btn = document.createElement("button");
      btn.className = "file-tab" + (i === 0 ? " active" : "");
      btn.textContent = f.name;
      btn.onclick = () => selectFile(i);
      tabs.appendChild(btn);
    });
    renderPreview();
    $("#output-section").classList.add("visible");
    renderGateStatus(files, data);
  }

  function selectFile(i) {
    activeFileIndex = i;
    $$(".file-tab").forEach((t, j) => t.classList.toggle("active", j === i));
    renderPreview();
  }

  function simpleMdToHtml(md) {
    return md
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => "<ul>" + m + "</ul>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(.+)$/gm, (line) => {
        if (line.startsWith("<")) return line;
        return line;
      });
  }

  function renderPreview() {
    const box = $("#preview-box");
    const file = currentFiles[activeFileIndex];
    if (!file) { box.innerHTML = ""; return; }

    if (file.name.endsWith(".html")) {
      box.innerHTML = file.content;
    } else {
      box.innerHTML = '<div class="md"><pre>' + file.content.replace(/</g, "&lt;") + "</pre></div>";
    }
  }

  function downloadFile(file) {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadAll() {
    currentFiles.forEach((f) => downloadFile(f));
  }

  const WORKBENCH_SLUG = "ipitch-studio";

  async function exportCaseZip() {
    if (!currentFiles.length) {
      alert(window.IPITCH_LANG === "zh" ? "没有可导出的文件" : "No files to export");
      return;
    }
    if (typeof JSZip === "undefined") {
      alert(window.IPITCH_LANG === "zh" ? "ZIP 库未加载" : "JSZip not loaded");
      return;
    }

    const slug = slugFromTarget($("#target").value.trim());
    const zip = new JSZip();
    const root = zip.folder("cases/" + slug);

    currentFiles.forEach((f) => {
      const path = f.name.replace(/^\.?\//, "");
      root.file(path, f.content);
    });

    root.file("_workbench.json", JSON.stringify({
      workbench: WORKBENCH_SLUG,
      target: $("#target").value.trim(),
      exportedAt: new Date().toISOString()
    }, null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = WORKBENCH_SLUG + "-" + slug + "-case.zip";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function showStreamingPreview(text) {
    $("#output-section").classList.add("visible");
    const box = $("#preview-box");
    box.innerHTML =
      '<div class="stream-preview"><div class="stream-label">' +
      window.t("streaming") +
      '</div><pre class="stream-text">' +
      text.replace(/</g, "&lt;") +
      "</pre></div>";
  }

  async function generate(useApi) {
    const data = validateForm();
    if (!data) return;

    updateSteps(data.round);

    if (!useApi) {
      const pack = window.IPitchPrompts.buildCursorPrompt(data);
      const files = [
        { name: "cursor_command.txt", content: pack.cursorCmd },
        { name: "ifalsify_command.txt", content: pack.ifalsifyCmd },
        { name: "full_prompt.md", content: "# System\n\n" + pack.systemPrompt + "\n\n# User\n\n" + pack.fullPrompt }
      ];
      renderFiles(files, data);
      showStatus(
        window.IPITCH_LANG === "zh"
          ? "Prompt 已导出 — 请在 Cursor 粘贴运行 /ipitch（同档主路径）"
          : "Prompt exported — paste in Cursor and run /ipitch (production path)",
        "success"
      );
      return;
    }

    const cfg = window.IPitchAPI.loadConfig();
    const viaProxy = window.IPitchAPI.usesProxy(cfg);
    if (!viaProxy && !cfg.apiKey) {
      alert(window.t("noApiKey"));
      openModal("settings-modal");
      return;
    }

    showStatus(window.t("generating"), "loading");
    $("#generate-btn").disabled = true;
    $("#output-section").classList.add("visible");
    showStreamingPreview("");

    try {
      const system = window.IPitchPrompts.buildSystemPrompt();
      const user = window.IPitchPrompts.buildUserPrompt(data);
      const raw = await window.IPitchAPI.chat(system, user, (partial) => {
        showStatus(window.t("streaming") + "…", "loading");
        showStreamingPreview(partial);
      });
      const files = window.IPitchPrompts.parseFileBlocks(raw);
      renderFiles(files, data);
      showStatus(window.t("generateDone") + " · " + files.length + " files", "success");
    } catch (err) {
      let msg = err.message || String(err);
      if (msg === "NO_API_KEY") msg = window.t("noApiKey");
      if (msg.includes("Failed to fetch") || msg.includes("CORS")) {
        msg += (window.IPITCH_LANG === "zh"
          ? " — 浏览器 CORS 限制。请用「导出 Prompt」或部署 API 代理。"
          : " — Browser CORS. Use Export Prompt or deploy an API proxy.");
      }
      showStatus(window.t("generateError") + ": " + msg, "error");
    } finally {
      $("#generate-btn").disabled = false;
    }
  }

  function openModal(id) {
    $("#" + id).classList.add("open");
  }

  function closeModal(id) {
    $("#" + id).classList.remove("open");
  }

  function updateApiStatus() {
    const el = $("#api-status-badge");
    if (!el) return;
    // Roadshow: never show API status chrome (incl. "API not configured")
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
  }

  function saveSettings() {
    const cfg = {
      apiKey: $("#api-key").value.trim(),
      baseUrl: $("#api-base").value.trim() || window.IPitchAPI.DEFAULTS.baseUrl,
      proxyUrl: $("#api-proxy").value.trim(),
      model: $("#api-model").value
    };
    window.IPitchAPI.saveConfig(cfg);
    updateApiStatus();
    alert(window.t("saved"));
  }

  function loadSettingsForm() {
    const cfg = window.IPitchAPI.loadConfig();
    $("#api-key").value = cfg.apiKey || "";
    $("#api-base").value = cfg.baseUrl || window.IPitchAPI.DEFAULTS.baseUrl;
    $("#api-proxy").value = cfg.proxyUrl || "";
    $("#api-model").value = cfg.model || "deepseek-chat";
  }

  async function testApi() {
    const btn = $("#test-api-btn");
    btn.disabled = true;
    btn.textContent = window.t("testing");
    try {
      window.IPitchAPI.saveConfig({
        apiKey: $("#api-key").value.trim(),
        baseUrl: $("#api-base").value.trim() || window.IPitchAPI.DEFAULTS.baseUrl,
        proxyUrl: $("#api-proxy").value.trim(),
        model: $("#api-model").value
      });
      await window.IPitchAPI.testConnection();
      alert(window.t("testOk"));
      updateApiStatus();
    } catch (err) {
      alert(window.t("testFail") + ": " + (err.message || err));
    } finally {
      btn.disabled = false;
      btn.textContent = window.t("testConnection");
    }
  }

  function renderHelpLists() {
    const lang = window.IPITCH_LANG;
    const h = window.IPITCH_I18N[lang];
    ["help-value-list", "help-how-list", "help-cant-list"].forEach((id, idx) => {
      const keys = ["helpValueList", "helpHowList", "helpCantList"];
      const ul = $("#" + id);
      if (!ul || !h[keys[idx]]) return;
      ul.innerHTML = h[keys[idx]].map((item) => "<li>" + item + "</li>").join("");
    });
  }

  function init() {
    applyI18n();
    renderHelpLists();
    loadSettingsForm();
    updateApiStatus();

    $("#lang-zh").onclick = () => setLang("zh");
    $("#lang-en").onclick = () => setLang("en");

    $$(".round-tab").forEach((tab) => {
      tab.onclick = () => {
        $$(".round-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        selectedRound = tab.dataset.round;
        updateSteps(selectedRound);
      };
    });

    $("#generate-btn").onclick = () => generate(true);
    $("#export-btn").onclick = () => generate(false);
    $("#download-all-btn").onclick = downloadAll;
    $("#export-case-btn").onclick = exportCaseZip;
    $("#download-one-btn").onclick = () => currentFiles[activeFileIndex] && downloadFile(currentFiles[activeFileIndex]);
    $("#copy-one-btn").onclick = async () => {
      const f = currentFiles[activeFileIndex];
      if (!f) return;
      await navigator.clipboard.writeText(f.content);
      $("#copy-one-btn").textContent = window.t("copied");
      setTimeout(() => { $("#copy-one-btn").textContent = window.t("copyOne"); }, 1500);
    };

    $("#help-btn").onclick = () => openModal("help-modal");
    $("#settings-btn").onclick = () => { loadSettingsForm(); openModal("settings-modal"); };
    $$("[data-close]").forEach((btn) => {
      btn.onclick = () => closeModal(btn.getAttribute("data-close"));
    });
    $$(".modal-overlay").forEach((overlay) => {
      overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove("open"); };
    });

    $("#save-settings-btn").onclick = saveSettings;
    $("#test-api-btn").onclick = testApi;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
