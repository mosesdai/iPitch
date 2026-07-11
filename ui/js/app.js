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
  }

  function getFormData() {
    let outputs = [];
    $$('input[name="out"]:checked').forEach((cb) => outputs.push(cb.value));

    const wantsResearchOrKnife = outputs.includes("research") || outputs.includes("knife") || selectedRound === "R1" || selectedRound === "full";

    // Enforce quality gates
    if (wantsResearchOrKnife) {
      if (!outputs.includes("ifalsify")) outputs.push("ifalsify");
      if (!outputs.includes("traceability")) outputs.push("traceability");
    }

    const formats = [];
    $$('input[name="fmt"]:checked').forEach((cb) => formats.push(cb.value));

    const marathonEl = $("#marathon-mode");
    const marathonMode = marathonEl ? marathonEl.checked : false;

    return {
      target: $("#target").value.trim(),
      customer: $("#customer").value.trim(),
      internal: $("#internal").value.trim(),
      round: selectedRound === "full" ? "full" : selectedRound,
      outputs: outputs,
      formats: formats.length ? formats : ["md"],
      gatesEnforced: wantsResearchOrKnife,
      marathonMode: marathonMode
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

  function countResearchCharsFromFiles(files) {
    if (window.IPitchPrompts && window.IPitchPrompts.countResearchChars) {
      return window.IPitchPrompts.countResearchChars(files);
    }
    let total = 0;
    for (const f of files) {
      if (f.name.startsWith("research/") && f.name.endsWith(".md")) {
        total += f.content.length;
      }
    }
    return total;
  }

  function renderGateStatus(files, data = {}) {
    const gateEl = $("#gate-status");
    if (!gateEl) return;

    const hasIceberg = files.some((f) => /iceberg|research/i.test(f.name));
    const hasTrace = files.some((f) => /traceab|timeliness/i.test(f.name));
    const hasFalsify = files.some((f) => /ifalsify|falsif/i.test(f.name));
    const enforced = data.gatesEnforced || hasIceberg || hasTrace || hasFalsify;

    if (!enforced) {
      gateEl.style.display = "none";
      return;
    }

    const passport = parseQualityPassport(files);
    const actualIceberg = countResearchCharsFromFiles(files);
    const zh = window.IPITCH_LANG === "zh";
    const parts = [];

    if (passport) {
      const icebergCount = passport.iceberg_char_count ?? passport.icebergCharCount ?? actualIceberg;
      const displayCount = actualIceberg > 0 ? actualIceberg : icebergCount;
      if (displayCount != null) {
        const low = Number(displayCount) < 8000;
        parts.push(
          (low ? "⚠️" : "✅") +
          (zh ? " 冰山 " : " Iceberg ") +
          Number(displayCount).toLocaleString() +
          (zh ? " 字" : " chars") +
          (low ? (zh ? "（<8000，品质未达标）" : " (<8000, below bar)") : "")
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
        const icon = v === "KILL" ? "🔴" : v === "PIVOT" ? "🟡" : v === "CONDITIONAL" ? "🟢" : "✅";
        parts.push(icon + " ifalsify: " + v);
      }
      if (passport.main_tension) {
        parts.push((zh ? "张力" : "Tension") + ": " + String(passport.main_tension).slice(0, 80));
      }
    }

    if (!passport || parts.length === 0) {
      parts.push(hasIceberg ? (zh ? "✅ 冰山研究" : "✅ Iceberg") : (zh ? "⚠️ 缺冰山" : "⚠️ Missing iceberg"));
      parts.push(hasTrace ? (zh ? "✅ 溯源账本" : "✅ Traceability") : (zh ? "⚠️ 缺溯源" : "⚠️ Missing trace"));
      parts.push(hasFalsify ? (zh ? "✅ 反昏君报告" : "✅ ifalsify") : (zh ? "⚠️ 缺证伪" : "⚠️ Missing ifalsify"));
    } else {
      if (!hasIceberg) parts.push(zh ? "⚠️ 缺冰山文件" : "⚠️ Missing iceberg file");
      if (!hasTrace) parts.push(zh ? "⚠️ 缺溯源文件" : "⚠️ Missing trace file");
      if (!hasFalsify) parts.push(zh ? "⚠️ 缺证伪文件" : "⚠️ Missing ifalsify file");
    }

    const icebergCount = passport
      ? (passport.iceberg_char_count ?? passport.icebergCharCount)
      : null;
    const effectiveIceberg = actualIceberg > 0 ? actualIceberg : icebergCount;
    const warnLow = effectiveIceberg != null && Number(effectiveIceberg) < 8000;

    gateEl.style.display = "block";
    gateEl.className = warnLow ? "gate-status gate-warn" : "gate-status gate-ok";
    gateEl.innerHTML =
      "<strong>" + window.t("gateStatus") + "</strong>：" +
      parts.join(" · ") +
      (passport
        ? ""
        : '<span style="margin-left:8px;color:var(--muted);">' +
          (zh ? "（文件名推断；未找到 quality_passport.json）" : " (filename fallback; no quality_passport.json)") +
          "</span>") +
      '<span style="margin-left:8px;color:#059669;">' +
      (zh ? "（深刻洞察 + 颠覆性 iPod 创意；非哗众取宠）" : " (profound insight + disruptive iPod; not sensationalism)") +
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

  async function generateViaServerR1(data) {
    const zh = window.IPITCH_LANG === "zh";
    let lastMsg = "";

    const files = await window.IPitchServerAPI.runPipeline(data, (event) => {
      if (event.type === "status" && event.message) {
        lastMsg = event.message;
        showStatus(event.message, "loading");
      }
    });

    if (lastMsg) showStatus(lastMsg, "loading");
    renderFiles(files, data);
    return files;
  }

  async function generateMultiStepR1(data) {
    const steps = window.IPitchPrompts.getStepsForData(data);
    const system = window.IPitchPrompts.buildSystemPrompt();
    const labels = window.IPitchPrompts.R1_STEP_LABELS;
    let allFiles = [];
    const zh = window.IPITCH_LANG === "zh";
    let searchCache = null;

    for (let i = 0; i < steps.length; i++) {
      const stepId = steps[i];
      const label = labels[stepId] || stepId;
      const modeTag = data.marathonMode ? (zh ? "马拉松" : "marathon") : (zh ? "多步" : "multi");
      const statusMsg = zh
        ? `${modeTag} R1 · ${i + 1}/${steps.length}：${label}…`
        : `${modeTag} R1 · ${i + 1}/${steps.length}: ${label}…`;
      showStatus(statusMsg, "loading");

      const extras = {};
      if (stepId === "source_hunt" && window.IPitchSearch) {
        try {
          const hunt = await window.IPitchSearch.hunt(data.target);
          if (hunt.ok) {
            searchCache = hunt;
            extras.searchBlock = window.IPitchSearch.formatHuntsForPrompt(hunt.hunts);
          } else if (hunt.reason === "SEARCH_NOT_CONFIGURED") {
            extras.searchBlock = zh
              ? "（Proxy 未配置 TAVILY_API_KEY — 本步请用 Cursor 联网搜索，或 wrangler secret put TAVILY_API_KEY）"
              : "(TAVILY_API_KEY not on proxy — use Cursor web search)";
          }
        } catch (e) {
          extras.searchBlock = "(search error: " + (e.message || e) + ")";
        }
      }

      const user = window.IPitchPrompts.buildStepUserPrompt(stepId, data, allFiles, extras);
      const maxTokens = window.IPitchPrompts.maxTokensForStep(stepId);

      const raw = await window.IPitchAPI.chat(system, user, (partial) => {
        showStreamingPreview(
          (zh ? `[${label}]\n\n` : `[${stepId}]\n\n`) + partial
        );
      }, { maxTokens });

      const stepFiles = window.IPitchPrompts.parseFileBlocks(raw);
      allFiles = window.IPitchPrompts.mergeFiles(allFiles, stepFiles);
      renderFiles(allFiles, data);
    }

    return allFiles;
  }

  async function generate(useApi) {
    const data = validateForm();
    if (!data) return;

    updateSteps(data.round);

    if (!useApi) {
      const pack = window.IPitchPrompts.buildCursorPrompt(data);
      const files = [
        { name: "cursor_command.txt", content: pack.cursorCmd },
        { name: "cursor_marathon_commands.txt", content: pack.marathonCmd || "(勾选 iPod 或马拉松模式时生成)" },
        { name: "cursor_runbook.md", content: pack.runbook },
        { name: "grill_handoff.md", content: pack.grillHandoff },
        { name: "grill_command.txt", content: pack.grillCmd },
        { name: "ifalsify_command.txt", content: pack.ifalsifyCmd },
        { name: "full_prompt.md", content: "# System\n\n" + pack.systemPrompt + "\n\n# User\n\n" + pack.fullPrompt }
      ];
      renderFiles(files, data);
      showStatus(window.IPITCH_LANG === "zh" ? "马拉松 Runbook 已导出 — 交给 Cursor Cloud Agent" : "Marathon runbook exported for Cursor", "success");
      return;
    }

    const cfg = window.IPitchAPI.loadConfig();
    const viaProxy = window.IPitchAPI.usesProxy(cfg);
    const viaServer = window.IPitchServerAPI &&
      window.IPitchServerAPI.isConfigured() &&
      window.IPitchPrompts.shouldUseMultiStepR1(data);

    if (!viaServer && !viaProxy && !cfg.apiKey) {
      alert(window.t("noApiKey"));
      openModal("settings-modal");
      return;
    }

    showStatus(window.t("generating"), "loading");
    $("#generate-btn").disabled = true;
    $("#output-section").classList.add("visible");
    showStreamingPreview("");

    try {
      let files;
      if (viaServer) {
        files = await generateViaServerR1(data);
      } else if (window.IPitchPrompts.shouldUseMultiStepR1(data)) {
        files = await generateMultiStepR1(data);
      } else {
        const system = window.IPitchPrompts.buildSystemPrompt();
        const user = window.IPitchPrompts.buildUserPrompt(data);
        const raw = await window.IPitchAPI.chat(system, user, (partial) => {
          showStatus(window.t("streaming") + "…", "loading");
          showStreamingPreview(partial);
        });
        files = window.IPitchPrompts.parseFileBlocks(raw);
        renderFiles(files, data);
      }
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
    const cfg = window.IPitchAPI.loadConfig();
    const serverCfg = window.IPitchServerAPI ? window.IPitchServerAPI.loadConfig() : { serverUrl: "" };
    const el = $("#api-status-badge");
    if (!el) return;
    const viaProxy = window.IPitchAPI.usesProxy(cfg);
    const viaServer = window.IPitchServerAPI && window.IPitchServerAPI.isConfigured(serverCfg);
    if (viaServer) {
      el.className = "api-status ok";
      const host = serverCfg.serverUrl.replace(/^https?:\/\//, "").split("/")[0];
      el.innerHTML = '<span class="dot"></span> Server · ' + host;
    } else if (viaProxy) {
      el.className = "api-status ok";
      const host = cfg.proxyUrl.replace(/^https?:\/\//, "").split("/")[0];
      el.innerHTML = '<span class="dot"></span> Proxy · ' + host;
    } else if (cfg.apiKey) {
      el.className = "api-status ok";
      el.innerHTML = '<span class="dot"></span> API · ' + window.IPitchAPI.maskKey(cfg.apiKey);
    } else {
      el.className = "api-status warn";
      el.innerHTML = '<span class="dot"></span> ' + (window.IPITCH_LANG === "zh" ? "未配置 API" : "API not configured");
    }
  }

  function saveSettings() {
    const cfg = {
      apiKey: $("#api-key").value.trim(),
      baseUrl: $("#api-base").value.trim() || window.IPitchAPI.DEFAULTS.baseUrl,
      proxyUrl: $("#api-proxy").value.trim(),
      model: $("#api-model").value
    };
    window.IPitchAPI.saveConfig(cfg);
    if (window.IPitchServerAPI) {
      window.IPitchServerAPI.saveConfig({
        serverUrl: $("#api-server").value.trim()
      });
    }
    updateApiStatus();
    alert(window.t("saved"));
  }

  function loadSettingsForm() {
    const cfg = window.IPitchAPI.loadConfig();
    $("#api-key").value = cfg.apiKey || "";
    $("#api-base").value = cfg.baseUrl || window.IPitchAPI.DEFAULTS.baseUrl;
    $("#api-proxy").value = cfg.proxyUrl || "";
    $("#api-model").value = cfg.model || "deepseek-chat";
    if (window.IPitchServerAPI) {
      const serverCfg = window.IPitchServerAPI.loadConfig();
      const serverEl = $("#api-server");
      if (serverEl) serverEl.value = serverCfg.serverUrl || "";
    }
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
      if (window.IPitchServerAPI) {
        window.IPitchServerAPI.saveConfig({
          serverUrl: $("#api-server").value.trim()
        });
      }

      const serverUrl = $("#api-server")?.value.trim();
      if (serverUrl && window.IPitchServerAPI) {
        await window.IPitchServerAPI.checkHealth(serverUrl);
      } else {
        await window.IPitchAPI.testConnection();
      }
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

  function exportGrillHandoff() {
    const data = validateForm();
    if (!data) return;
    const content = window.IPitchPrompts.buildGrillHandoff(data, currentFiles);
    downloadFile({ name: "grill_handoff.md", content });
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

    $("#export-grill-btn").onclick = exportGrillHandoff;
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
