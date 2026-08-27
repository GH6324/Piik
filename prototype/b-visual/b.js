// Direction B — pure-visual couch co-op. Same scenes and copy catalog as
// direction A; glyphs, scenes and state motion carry the workflow while
// strings serve as tooltips and aria labels.
(function () {
  const D = window.ScreenerDemo;
  const I = (n, s) => window.ScreenerIcons.icon(n, s ?? 20);
  const t = D.t;
  const page = document.body.dataset.page;

  const PAWN_COLORS = ["#3b7dd8", "#efb23f", "#8e6fd8", "#2fa8a0", "#e2698f", "#7d9c3f", "#e08a3c", "#5f7dd8"];
  const YOU = "#2fa66a";
  const INK = "#22303e";

  function esc(value) {
    return String(value).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { return false; }
  }

  function pawnSvg(color) {
    return `<svg viewBox="0 0 40 48" aria-hidden="true"><circle cx="20" cy="12" r="8.5" fill="${color}"/><path d="M5 46c0-13 6.5-19 15-19s15 6 15 19Z" fill="${color}"/><circle cx="17" cy="11" r="1.6" fill="#22303e"/><circle cx="23" cy="11" r="1.6" fill="#22303e"/></svg>`;
  }

  function pawn(viewer, index, opts = {}) {
    const color = opts.you ? YOU : PAWN_COLORS[index % PAWN_COLORS.length];
    const waiting = viewer.state && viewer.state !== "connected";
    const label = opts.you
      ? `${viewer.name} · ${t("common.you")}`
      : `${viewer.name}${waiting ? ` · ${t("state.peer.connecting")}` : ` · ${t("state.peer.connected")}`}`;
    const motion = opts.animate === false
      ? "animation:none;"
      : `animation-delay:${index * 70}ms`;
    return `<button type="button" class="b-pawn ${opts.you ? "is-you" : ""} ${opts.child ? "is-child" : ""}" style="${motion}" title="${esc(label)}" aria-label="${esc(label)}">
      ${pawnSvg(color)}
      ${opts.hideLed ? "" : `<i class="b-pawn-led ${waiting ? "is-wait" : ""}"></i>`}
      ${D.vis || opts.child ? "" : `<span class="b-pawn-name">${esc(viewer.name)}</span>`}
    </button>`;
  }

  function couchSvg() {
    return `<svg viewBox="0 0 640 132" aria-hidden="true">
      <rect x="70" y="110" width="18" height="16" rx="5" fill="${INK}"/>
      <rect x="552" y="110" width="18" height="16" rx="5" fill="${INK}"/>
      <rect x="28" y="28" width="58" height="80" rx="24" fill="#c8492b"/>
      <rect x="554" y="28" width="58" height="80" rx="24" fill="#c8492b"/>
      <rect x="56" y="18" width="528" height="58" rx="27" fill="#e4572e"/>
      <rect x="44" y="62" width="552" height="50" rx="23" fill="#d9512f"/>
      <path d="M212 64v46M428 64v46" stroke="#c8492b" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }

  function lcd(code, { copyKey } = {}) {
    return `<span class="b-lcd" role="group" aria-label="${esc(t("common.roomCode"))} ${esc(code)}" title="${esc(t("common.roomCode"))}">
      ${esc(code)}
      <button type="button" data-act="copy-room" title="${esc(t("common.copy"))}" aria-label="${esc(t("common.copy"))}">${I("copy", 16)}</button>
    </span>`;
  }

  function ledStrip(state, label) {
    return `<span class="b-leds" data-state="${state}" title="${esc(label)}" aria-label="${esc(label)}" role="status"><i></i><i></i><i></i></span>`;
  }

  function story(step) {
    const panels = [["door", "story.room"], ["plug", "story.link"], ["tv", "story.show"]];
    return `<div class="b-story" role="status" aria-label="${esc(t("host.starting"))}">
      ${panels.map(([p, key], i) => `
        ${i > 0 ? `<span class="b-story-link ${step > i - 1 ? "is-done" : ""}"></span>` : ""}
        <span class="b-story-item ${step > i ? "is-done" : step === i ? "is-now" : ""}">
          <span class="b-story-panel ${step > i ? "is-done" : step === i ? "is-now" : ""}">
            ${step > i ? I("check", 22) : I(p, 22)}
          </span>
          ${D.vis ? "" : `<span class="b-story-cap">${esc(t(key))}</span>`}
        </span>`).join("")}
    </div>`;
  }

  function routeGlyph(route) {
    if (route === "sfu") {
      return `<svg width="36" height="16" viewBox="0 0 36 16" fill="none" stroke="#53676a" stroke-width="2" aria-hidden="true"><circle cx="4" cy="8" r="3" fill="#53676a" stroke="none"/><rect x="14" y="3" width="8" height="10" rx="2"/><circle cx="32" cy="8" r="3" fill="#53676a" stroke="none"/><path d="M7 8h7M22 8h7"/></svg>`;
    }
    return `<svg width="36" height="16" viewBox="0 0 36 16" fill="none" stroke="#53676a" stroke-width="2" aria-hidden="true"><circle cx="4" cy="8" r="3" fill="#53676a" stroke="none"/><circle cx="32" cy="8" r="3" fill="#53676a" stroke="none"/><path d="M7 8h22"/></svg>`;
  }

  function meterStrip(route) {
    const S = D.STATS;
    const cells = [
      ["expand", S.resolution, t("stats.resolution")],
      ["wave", `${S.fps}`, t("stats.fps")],
      ["gauge", S.bitrate, t("stats.bitrate")],
      ["drop", S.loss, t("stats.loss")],
      ["clock", S.rtt, t("stats.rtt")],
      ["cpu", S.codec, t("stats.codec")],
      ["speaker", S.audio, t("stats.audio")],
    ];
    return `<div class="b-meter" role="group" aria-label="${esc(t("stats.title"))}">
      ${route ? `<span class="b-meter-cell" title="${esc(t(route === "sfu" ? "state.route.sfu" : "state.route.p2p"))}">${routeGlyph(route)}<b>${route === "sfu" ? "SFU" : "P2P"}</b></span>` : ""}
      ${cells.map(([icon, value, label]) => `
        <span class="b-meter-cell" title="${esc(label)}">${I(icon, 17)}<b>${esc(value)}</b></span>`).join("")}
    </div>`;
  }

  function meterTag(icon, label) {
    return `<span class="b-meter-tag" title="${esc(label)}" aria-label="${esc(label)}">${I(icon, 17)}${D.vis ? "" : `<span class="b-cap">${esc(label)}</span>`}</span>`;
  }

  function routePath({ viewers, self, hostLabel, flow }) {
    const column = [];
    if (self) column.push({ name: self.name, route: self.route, state: "connected", isSelf: true });
    for (const v of viewers) column.push({ ...v, isSelf: false });
    const children = self?.children ?? [];
    const w = children.length ? 736 : 640;
    const h = Math.max(150, 60 + column.length * 40);
    const midY = h / 2;
    const hostX = 30;
    const colX = children.length ? 560 : 570;
    const childX = 668;
    const sfuX = 300;
    const lines = [];
    const nodes = [];
    column.forEach((node, i) => {
      const y = 40 + i * 40;
      const color = node.isSelf ? YOU : PAWN_COLORS[(i - (self ? 1 : 0)) % PAWN_COLORS.length];
      const ok = node.state === "connected";
      const stroke = node.route === "sfu" ? "#8ea3b8" : ok ? "#2fa66a" : "#d98e04";
      const fromX = node.route === "sfu" ? sfuX + 20 : hostX + 24;
      lines.push(`<path d="M ${fromX} ${midY} Q ${(fromX + colX) / 2} ${midY + (y - midY) * 0.7}, ${colX - 24} ${y}" fill="none" stroke="${stroke}" stroke-width="2.5" class="${flow ? "flow" : ""}"/>`);
      nodes.push(`<g transform="translate(${colX - 14}, ${y - 15}) scale(0.72)"><title>${esc(node.name)}${node.isSelf ? ` · ${esc(t("common.you"))}` : ""}</title>${pawnSvg(color)}${node.isSelf ? `<circle cx="20" cy="24" r="22" fill="none" stroke="${YOU}" stroke-width="3"/>` : ""}</g>`);
    });
    children.forEach((name, i) => {
      const y = 40 + i * 34;
      lines.push(`<path d="M ${colX + 12} 40 Q ${(colX + childX) / 2} ${40 + (y - 40) * 0.5}, ${childX - 16} ${y}" fill="none" stroke="#2fa66a" stroke-width="2.5" class="${flow ? "flow" : ""}"/>`);
      nodes.push(`<g transform="translate(${childX - 12}, ${y - 12}) scale(0.5)"><title>${esc(name)}</title>${pawnSvg(PAWN_COLORS[(i + 4) % PAWN_COLORS.length])}</g>`);
    });
    const hasSfu = column.some((n) => n.route === "sfu");
    if (hasSfu) {
      lines.push(`<path d="M ${hostX + 24} ${midY} L ${sfuX - 20} ${midY}" fill="none" stroke="#8ea3b8" stroke-width="2.5" class="${flow ? "flow" : ""}"/>`);
    }
    return `<div class="b-route" role="img" aria-label="${esc(t("host.topology"))}">
      <svg viewBox="0 0 ${w} ${h}">
        <title>${esc(t("host.topology"))}</title>
        ${lines.join("")}
        <g transform="translate(${hostX - 4}, ${midY - 20}) scale(0.85)">${pawnSvg("#e4572e")}<title>${esc(hostLabel)} · ${esc(t("common.host"))}</title></g>
        ${hasSfu ? `<g transform="translate(${sfuX - 20}, ${midY - 16})"><title>${esc(t("host.sfu"))}</title><rect width="40" height="32" rx="7" fill="none" stroke="#8ea3b8" stroke-width="2.5"/><path d="M8 12h24M8 20h24" stroke="#8ea3b8" stroke-width="2.5" stroke-linecap="round"/></g>` : ""}
        ${nodes.join("")}
      </svg>
    </div>`;
  }

  function flashCheck(button) {
    const original = button.innerHTML;
    button.innerHTML = I("check", 16);
    window.setTimeout(() => { button.innerHTML = original; }, 1400);
  }

  function pill(icon, tone, label) {
    return `<span class="b-pill ${tone ? `is-${tone}` : ""}" role="status" title="${esc(label)}">${I(icon, 16)}${D.vis ? `<span class="visually-hidden">${esc(label)}</span>` : `<span>${esc(label)}</span>`}</span>`;
  }

  /* ---------- language mode helpers ---------- */

  // Visible caption rendered only in text modes (zh/en); in visual mode the
  // same string stays available through title/aria on the control itself.
  function cap(key) {
    return D.vis ? "" : `<span class="b-cap">${esc(t(key))}</span>`;
  }

  function tvMsg(key) {
    return D.vis ? "" : `<span class="b-tv-msg">${esc(t(key))}</span>`;
  }

  function renderHeaderControls() {
    const holder = document.getElementById("header-mode");
    if (!holder) return;
    const modeBtn = (mode, label, tipKey) => {
      const active = mode === "vis" ? D.vis : !D.vis && D.lang === mode;
      return `<button type="button" data-setmode="${mode}" class="${active ? "is-selected" : ""}" title="${esc(t(tipKey))}" aria-label="${esc(t(tipKey))}" aria-pressed="${active}">${label}</button>`;
    };
    holder.innerHTML = `
      <span class="b-lang" role="group" aria-label="${esc(t("mode.language"))}">
        ${modeBtn("zh", "中", "mode.zh")}
        ${modeBtn("en", "EN", "mode.en")}
        ${modeBtn("vis", I("sparkles", 15), "mode.vis")}
      </span>
      <button type="button" class="b-btn" data-settheme style="min-width:40px;height:40px;border-radius:999px" title="${esc(t(D.theme === "dark" ? "theme.light" : "theme.dark"))}" aria-label="${esc(t(D.theme === "dark" ? "theme.light" : "theme.dark"))}">${I(D.theme === "dark" ? "sun" : "moon", 16)}</button>`;
  }

  function bindHeaderControls(renderFn) {
    renderHeaderControls();
    document.addEventListener("click", (event) => {
      const modeTarget = event.target.closest("[data-setmode]");
      if (modeTarget) {
        const mode = modeTarget.dataset.setmode;
        D.setLangMode(mode === "vis" ? D.lang : mode, mode === "vis");
        renderHeaderControls();
        renderFn();
        return;
      }
      if (event.target.closest("[data-settheme]")) {
        D.setTheme(D.theme === "dark" ? "light" : "dark");
        renderHeaderControls();
      }
    });
  }

  /* ================================================================
     HOST
     ================================================================ */
  if (page === "host") {
    const SCENES = ["idle", "starting", "live", "paused", "ended", "error"];
    const root = document.getElementById("host-root");
    const H = {
      scene: D.scene || "idle",
      name: D.hostName(),
      code: D.roomCode(),
      replacing: false,
      switching: false,
      details: D.boolParam("details"),
      advanced: D.boolParam("advanced"),
      topology: D.boolParam("topology"),
      policy: D.param("policy", "open"),
      hasPassword: D.boolParam("password"),
      passwordOpen: false,
      invite: true,
      noAudio: D.boolParam("noaudio"),
      editingName: false,
      preset: 1,
      notice: null,
      timer: null,
    };
    let prevScene = null;
    let prevPawnKeys = new Set();
    const hasRoom = () => !["idle", "error"].includes(H.scene);
    const isLive = () => H.scene === "live" || H.scene === "paused";
    const viewers = () => D.roster(isLive() ? D.intParam("viewers", 4) : 0);

    function tvHtml() {
      if (["idle", "ended", "error"].includes(H.scene)) {
        return `<div class="b-tv-overlay b-fade">
          ${D.vis ? "" : `<div class="b-entry-text"><h2>${esc(t("host.idle.heading"))}</h2><p>${esc(t("host.idle.hint"))}</p></div>`}
          <div class="b-row-actions" style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center">
            <button type="button" class="b-tv-big is-action is-ripple" data-act="start" title="${esc(t("host.start"))}" aria-label="${esc(t("host.start"))}">${I("cast", 34)}</button>
            <button type="button" class="b-tv-big" data-act="toggle-join" title="${esc(t("host.join"))}" aria-label="${esc(t("host.join"))}">${I("door", 30)}</button>
          </div>
          <div class="b-dials-wrap" id="join-inline" hidden>
            <div class="b-dials" style="--dial-bg:#101a2c">
              ${[0, 1, 2, 3].map(() => `<span class="b-dial" style="width:46px;height:56px;font-size:24px;background:#1b2940;border-color:#3a4a66;color:#dfe8f2"></span>`).join("")}
            </div>
            <input inputmode="numeric" maxlength="4" aria-label="${esc(t("join.field"))}" data-join-code>
          </div>
        </div>`;
      }
      if (H.scene === "starting") {
        return `<div class="b-tv-static"></div>
        <div class="b-tv-overlay" role="status" aria-label="${esc(t("host.starting"))}">
          ${story(1)}
        </div>`;
      }
      if (H.scene === "paused") {
        return `<div class="b-tv-overlay is-dim" role="status" aria-label="${esc(t("host.paused"))}">
          <span class="b-tv-big">${I("pause", 30)}</span>
          ${tvMsg("host.paused")}
        </div>`;
      }
      return "";
    }

    function controlsHtml() {
      const busy = H.switching ? "disabled" : "";
      if (H.scene === "starting") {
        return `<button class="b-btn is-danger" data-act="cancel-start" title="${esc(t("host.cancelStart"))}" aria-label="${esc(t("host.cancelStart"))}">${I("x", 20)}</button>`;
      }
      if (!isLive()) return "";
      return `
        <button class="b-btn" data-act="pause" title="${esc(t(H.scene === "paused" ? "host.resume" : "host.pause"))}" aria-label="${esc(t(H.scene === "paused" ? "host.resume" : "host.pause"))}" ${busy}>${I(H.scene === "paused" ? "play" : "pause", 18)}${cap(H.scene === "paused" ? "host.resume" : "host.pause")}</button>
        <button class="b-btn" data-act="switch" title="${esc(t("host.switchSource"))}" aria-label="${esc(t("host.switchSource"))}" ${busy}>${I("refresh", 19)}${cap("host.switchSource")}</button>
        <button class="b-btn is-danger" data-act="stop" title="${esc(t("host.stop"))}" aria-label="${esc(t("host.stop"))}" ${busy}>${I("stop", 17)}${cap("host.stop")}</button>`;
    }

    function inviteRowHtml() {
      if (!hasRoom()) return "";
      return `<div class="b-row" role="group" aria-label="${esc(t("host.invite"))}">
        <button class="b-btn ${H.invite ? "is-primary" : ""}" data-act="copy-invite" title="${esc(t("host.invite.copy"))}" aria-label="${esc(t("host.invite.copy"))}" ${H.invite ? "" : "disabled"}>${I("link", 19)}${cap("common.copy")}</button>
        <button class="b-btn" data-act="rotate-invite" title="${esc(t("host.invite.rotate"))}" aria-label="${esc(t("host.invite.rotate"))}">${I("refresh", 18)}${cap("host.invite.rotate")}</button>
        <button class="b-btn is-danger" data-act="revoke-invite" title="${esc(t("host.invite.revoke"))}" aria-label="${esc(t("host.invite.revoke"))}" ${H.invite ? "" : "disabled"}>${I("linkOff", 19)}${cap("host.invite.revoke")}</button>
        <span class="b-divider"></span>
        <span class="b-toggle" role="group" aria-label="${esc(t("host.policy"))}">
          <button type="button" data-act="policy" data-v="open" class="${H.policy === "open" ? "is-selected" : ""}" title="${esc(t("host.policy.open"))} · ${esc(t("host.policy.openHint"))}" aria-label="${esc(t("host.policy.open"))}" aria-pressed="${H.policy === "open"}">${I("globe", 19)}${cap("host.policy.open")}</button>
          <button type="button" data-act="policy" data-v="private" class="${H.policy === "private" ? "is-selected" : ""}" title="${esc(t("host.policy.private"))} · ${esc(t("host.policy.privateHint"))}" aria-label="${esc(t("host.policy.private"))}" aria-pressed="${H.policy === "private"}">${I("lock", 19)}${cap("host.policy.private")}</button>
        </span>
        ${H.policy === "private" ? `
        <button class="b-btn ${H.hasPassword ? "is-on" : ""}" data-act="password-toggle" title="${esc(t(H.hasPassword ? "host.password.set" : "host.password.unset"))}" aria-label="${esc(t("host.password.setAction"))}" aria-expanded="${H.passwordOpen}">${I("key", 19)}${cap("join.password")}</button>
        ${H.passwordOpen ? `
          <span class="b-input" style="flex:1;min-width:180px">
            ${I("key", 17)}
            <input type="password" data-password-input placeholder="····" aria-label="${esc(t("join.password"))}" value="${H.hasPassword ? "momo42" : ""}">
          </span>
          <button class="b-btn" data-act="password-save" title="${esc(t("host.password.setAction"))}" aria-label="${esc(t("common.save"))}">${I("check", 18)}</button>
          ${H.hasPassword ? `<button class="b-btn is-danger" data-act="password-remove" title="${esc(t("host.password.remove"))}" aria-label="${esc(t("host.password.remove"))}">${I("x", 18)}</button>` : ""}
        ` : ""}
        ` : ""}
      </div>`;
    }

    function qualityRowHtml() {
      const tiles = [
        { caption: "720·30", key: "host.quality.720p30", density: 0 },
        { caption: "1080·30", key: "host.quality.1080p30", density: 1 },
        { caption: "1080·60", key: "host.quality.1080p60", density: 2 },
      ];
      const glyph = (density) => {
        const lines = [2, 3, 4][density];
        const wave = density === 2 ? `<path d="M7 34c1.4 0 1.4-2 2.8-2s1.4 2 2.8 2 1.4-2 2.8-2 1.4 2 2.8 2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : "";
        const bars = Array.from({ length: lines }, (_, i) => `<path d="M6 ${13 + i * 6}h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="${0.45 + i * 0.2}"/>`).join("");
        return `<svg width="28" height="38" viewBox="0 0 28 38" fill="none" aria-hidden="true"><rect x="2" y="3" width="24" height="26" rx="4" stroke="currentColor" stroke-width="2.2"/>${bars}${wave}</svg>`;
      };
      return `<div class="b-row" role="group" aria-label="${esc(t("host.quality"))}">
        <div class="b-tiles">
          ${tiles.map((tile, i) => `
            <button type="button" class="b-tile ${H.preset === i ? "is-selected" : ""}" data-act="preset" data-v="${i}" title="${esc(t(tile.key))}" aria-label="${esc(t(tile.key))}" aria-pressed="${H.preset === i}" ${H.scene === "starting" || H.switching ? "disabled" : ""}>
              ${glyph(tile.density)}<small>${D.vis ? tile.caption : esc(t(tile.key))}</small>
            </button>`).join("")}
        </div>
        <span class="b-spacer"></span>
        <button class="b-btn ${H.advanced ? "is-on" : ""}" data-act="advanced" title="${esc(t("host.advanced"))}" aria-label="${esc(t("host.advanced"))}" aria-expanded="${H.advanced}">${I("sliders", 20)}${cap("host.advanced")}</button>
      </div>
      ${H.advanced ? advancedHtml() : ""}`;
    }

    function advancedHtml() {
      const capsLocked = H.scene === "starting" || H.switching;
      const prefLocked = !isLive() || H.switching;
      const routeCodecLocked = isLive() || H.scene === "starting";
      return `<div class="b-door-body b-fade" role="group" aria-label="${esc(t("host.advanced"))}">
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.resolution"))}">${I("expand", 19)}${cap("host.advanced.resolution")}</span>
          <div class="b-chips" role="group" aria-label="${esc(t("host.advanced.resolution"))}">
            ${["480p", "720p", "1080p", "1440p"].map((r, i) => `<button class="b-chip ${i === 2 ? "is-selected" : ""}" ${capsLocked ? "disabled" : ""}>${r}</button>`).join("")}
          </div>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.framerate"))}">${I("wave", 19)}${cap("host.advanced.framerate")}</span>
          <span class="b-slider"><input type="range" min="15" max="60" step="5" value="30" data-range="fps" aria-label="${esc(t("host.advanced.framerate"))}" ${capsLocked ? "disabled" : ""}><output>30</output></span>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.bitrate"))}">${I("gauge", 19)}${cap("host.advanced.bitrate")}</span>
          <span class="b-slider"><input type="range" min="2" max="12" step="0.5" value="5" data-range="mbps" aria-label="${esc(t("host.advanced.bitrate"))}" ${capsLocked ? "disabled" : ""}><output>5.0</output></span>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.preference"))}">${I("mountain", 19)}${cap("host.advanced.preference")}</span>
          <div class="b-chips" role="group" aria-label="${esc(t("host.advanced.preference"))}">
            <button class="b-chip" title="${esc(t("host.advanced.preference.resolution"))} · ${esc(t("host.advanced.preference.resolutionHint"))}" ${prefLocked ? "disabled" : ""}>${I("mountain", 18)}</button>
            <button class="b-chip is-selected" title="${esc(t("host.advanced.preference.balanced"))} · ${esc(t("host.advanced.preference.balancedHint"))}" ${prefLocked ? "disabled" : ""}>${I("balance", 18)}</button>
            <button class="b-chip" title="${esc(t("host.advanced.preference.framerate"))} · ${esc(t("host.advanced.preference.framerateHint"))}" ${prefLocked ? "disabled" : ""}>${I("zap", 18)}</button>
          </div>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.audio"))}">${I("speaker", 19)}${cap("host.advanced.audio")}</span>
          <div class="b-chips" role="group" aria-label="${esc(t("host.advanced.audio"))}">
            <button class="b-chip" title="${esc(t("host.advanced.audio.saver"))} · 64 kbps" ${capsLocked ? "disabled" : ""}>64</button>
            <button class="b-chip is-selected" title="${esc(t("host.advanced.audio.music"))} · 128 kbps" ${capsLocked ? "disabled" : ""}>128</button>
            <button class="b-chip" title="${esc(t("host.advanced.audio.veryHigh"))} · 192 kbps" ${capsLocked ? "disabled" : ""}>192</button>
          </div>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.route"))}">${I("branch", 19)}${cap("host.advanced.route")}</span>
          <div class="b-chips">
            <button class="b-switch" role="switch" aria-checked="false" data-act="switch-toggle" title="${esc(t("host.advanced.route.topo"))} · ${esc(t("host.advanced.route.topoHint"))}" aria-label="${esc(t("host.advanced.route.topo"))}" ${routeCodecLocked ? "disabled" : ""}></button>
            <button class="b-switch" role="switch" aria-checked="false" data-act="switch-toggle" title="${esc(t("host.advanced.route.peerOnly"))} · ${esc(t("host.advanced.route.peerOnlyHint"))}" aria-label="${esc(t("host.advanced.route.peerOnly"))}" ${routeCodecLocked ? "disabled" : ""}></button>
          </div>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.codec"))}">${I("cpu", 19)}${cap("host.advanced.codec")}</span>
          <div class="b-chips" role="group" aria-label="${esc(t("host.advanced.codec"))}">
            <button class="b-chip" title="VP8 · ${esc(t("host.advanced.codec.vp8Hint"))}" ${routeCodecLocked ? "disabled" : ""}>VP8</button>
            <button class="b-chip is-selected" title="${isLive() ? "AUTO · H264" : `${esc(t("host.advanced.codec.auto"))} · ${esc(t("host.advanced.codec.autoHint"))}`}" ${routeCodecLocked ? "disabled" : ""}>AUTO${isLive() ? '<i class="b-chip-dot" title="H264"></i>' : ""}</button>
            <button class="b-chip" title="H264 · ${esc(t("host.advanced.codec.h264Hint"))}" ${routeCodecLocked ? "disabled" : ""}>H264</button>
          </div>
        </div>
      </div>`;
    }

    function nameHtml() {
      if (H.editingName) {
        return `<span class="b-input" style="min-width:150px">
          <input data-name-input value="${esc(H.name)}" maxlength="48" aria-label="${esc(t("host.name"))}">
        </span>
        <button class="b-btn" data-act="name-save" title="${esc(t("host.nameSave"))}" aria-label="${esc(t("host.nameSave"))}">${I("check", 17)}</button>
        <button class="b-btn" data-act="name-cancel" title="${esc(t("host.nameCancel"))}" aria-label="${esc(t("host.nameCancel"))}">${I("x", 17)}</button>`;
      }
      return `<span class="b-name-tag" title="${esc(t("host.name"))}"><i></i>${esc(H.name)}</span>
        <button class="b-btn" data-act="name-edit" title="${esc(t("host.nameEdit"))}" aria-label="${esc(t("host.nameEdit"))}" style="min-width:44px;height:44px">${I("pencil", 16)}</button>`;
    }

    function render() {
      const list = viewers();
      const crt = H.scene === "live" && prevScene !== "live";
      const led = H.scene === "live" ? ["live", t("state.signal.connected")]
        : H.scene === "starting" ? ["busy", t("host.starting")]
        : H.scene === "paused" ? ["warn", t("host.paused")]
        : ["", t("state.signal.offline")];
      document.getElementById("header-leds").innerHTML = ledStrip(led[0], led[1]);
      const phaseText = D.vis ? "" : (() => {
        const map = {
          starting: `${t("host.starting")}…`,
          live: `${t("host.live")} · ${list.length} / 20 ${t("common.online")}`,
          paused: t("host.paused"),
          ended: t("host.ended"),
          error: t("host.captureError"),
        };
        const text = map[H.scene];
        return text ? `<span class="b-status-text">${esc(text)}</span>` : "";
      })();

      root.innerHTML = `
      <div class="b-scene">
        <div class="b-tv">
          <div class="b-tv-screen ${crt ? "is-on" : ""}" id="tv">
            ${isLive() ? `<div data-feed ${H.scene === "paused" ? 'data-state="frozen"' : ""}></div>` : ""}
            ${H.switching ? `<div class="b-tv-static"></div>` : ""}
            ${tvHtml()}
          </div>
          <div class="b-tv-chin"><i class="${H.scene === "live" ? "is-on" : H.scene === "paused" ? "is-warn" : H.scene === "starting" ? "is-busy" : ""}"></i></div>
        </div>
        <div class="b-shelf"></div>
        <div class="b-couch">
          ${couchSvg()}
          <div class="b-pawns" role="group" aria-label="${esc(t("common.viewers"))}">
            ${list.map((v, i) => pawn(v, i, { animate: !prevPawnKeys.has(v.name) })).join("")}
          </div>
          ${list.length === 0 ? `<div class="b-couch-empty" title="${esc(t(H.scene === "live" ? "host.viewers.waiting" : "host.viewers.empty"))}">${I("users", 22)}</div>` : ""}
        </div>
      </div>
      <div class="b-deck">
        <div class="b-row">
          ${hasRoom() ? lcd(H.code) : ""}
          ${hasRoom() ? (H.replacing ? `
            <button class="b-btn" data-act="replace-confirm" title="${esc(t("host.roomReplaceConfirm"))}" aria-label="${esc(t("host.roomReplaceConfirm"))}">${I("check", 18)}</button>
            <button class="b-btn" data-act="replace-cancel" title="${esc(t("common.cancel"))}" aria-label="${esc(t("common.cancel"))}">${I("x", 18)}</button>
          ` : `
            <button class="b-btn" data-act="replace-room" title="${esc(t("host.roomReplace"))}" aria-label="${esc(t("host.roomReplace"))}" ${H.scene === "starting" ? "disabled" : ""}>${I("refresh", 18)}${cap("host.roomReplace")}</button>
          `) : ""}
          ${phaseText}
          <span class="b-spacer"></span>
          ${H.noAudio && isLive() ? pill("speaker", "", t("host.noAudio")) : ""}
          ${H.notice ?? ""}
          ${nameHtml()}
          ${controlsHtml()}
        </div>
        ${inviteRowHtml()}
        ${qualityRowHtml()}
        <div class="b-row" role="group" aria-label="${esc(t("host.details"))}">
          <button class="b-btn ${H.details ? "is-on" : ""}" data-act="details" title="${esc(t(H.details ? "host.details.hide" : "host.details"))}" aria-label="${esc(t("host.details"))}" aria-expanded="${H.details}">${I("gauge", 20)}${cap("host.details")}</button>
          <button class="b-btn ${H.topology ? "is-on" : ""}" data-act="topology" title="${esc(t(H.topology ? "host.topology.hide" : "host.topology.show"))}" aria-label="${esc(t("host.topology"))}" aria-expanded="${H.topology}">${I("network", 20)}${cap("host.topology")}</button>
        </div>
        ${H.details ? `<div class="b-row is-sub b-fade">${meterTag("arrowUp", t("stats.title"))}${meterStrip()}</div>` : ""}
        ${H.topology ? `<div class="b-row is-sub b-fade">${routePath({ viewers: list, hostLabel: H.name, flow: H.scene === "starting" })}</div>` : ""}
      </div>`;

      const feedHolder = root.querySelector("[data-feed]");
      if (feedHolder) {
        window.ScreenerFeed.mount(feedHolder, feedHolder.dataset.state === "frozen" ? "frozen" : "live");
      }
      prevScene = H.scene;
      prevPawnKeys = new Set(list.map((v) => v.name));
      if (H.scene === "starting") {
        H.timer = window.setTimeout(() => setScene("live"), 2600);
      }
    }

    function setScene(scene) {
      window.clearTimeout(H.timer);
      H.scene = scene;
      H.notice = null;
      if (scene === "idle") H.editingName = false;
      render();
    }

    root.addEventListener("click", async (event) => {
      const target = event.target.closest("[data-act]");
      if (!target) return;
      const act = target.dataset.act;
      if (act === "start") setScene("starting");
      if (act === "cancel-start") setScene("idle");
      if (act === "pause") setScene(H.scene === "paused" ? "live" : "paused");
      if (act === "stop") setScene("ended");
      if (act === "switch" && !H.switching) {
        H.switching = true;
        render();
        window.setTimeout(() => { H.switching = false; render(); }, 900);
      }
      if (act === "toggle-join") {
        const box = root.querySelector("#join-inline");
        box.hidden = !box.hidden;
        if (!box.hidden) box.querySelector("input").focus();
      }
      if (act === "copy-room") { if (await copyText(H.code)) flashCheck(target); }
      if (act === "copy-invite") { if (await copyText(`https://share.example/${H.code}#v=Kx9Qm4LwTz2Ab8Cd3EfGh1`)) flashCheck(target); }
      if (act === "replace-room") { H.replacing = true; render(); }
      if (act === "replace-cancel") { H.replacing = false; render(); }
      if (act === "replace-confirm") {
        H.code = String(Math.floor(1000 + Math.random() * 9000));
        H.replacing = false;
        H.notice = pill("check", "good", t("host.roomReplaced"));
        if (isLive()) { setScene("ended"); } else { render(); }
      }
      if (act === "rotate-invite") { H.invite = true; H.notice = pill("refresh", "good", t("host.invite.updated")); render(); }
      if (act === "revoke-invite") { H.invite = false; H.notice = pill("linkOff", "bad", t("host.invite.revoked")); render(); }
      if (act === "policy") { H.policy = target.dataset.v; render(); }
      if (act === "password-toggle") { H.passwordOpen = !H.passwordOpen; render(); }
      if (act === "password-save") { H.hasPassword = true; H.passwordOpen = false; H.notice = pill("key", "good", t("host.password.saved")); render(); }
      if (act === "password-remove") { H.hasPassword = false; H.notice = pill("linkOff", "bad", t("host.password.removed")); render(); }
      if (act === "preset") { H.preset = Number(target.dataset.v); render(); }
      if (act === "advanced") { H.advanced = !H.advanced; render(); }
      if (act === "details") { H.details = !H.details; render(); }
      if (act === "topology") { H.topology = !H.topology; render(); }
      if (act === "switch-toggle") {
        target.setAttribute("aria-checked", target.getAttribute("aria-checked") !== "true");
      }
      if (act === "name-edit") { H.editingName = true; render(); root.querySelector("[data-name-input]").focus(); }
      if (act === "name-cancel") { H.editingName = false; render(); }
      if (act === "name-save") {
        const value = root.querySelector("[data-name-input]").value.trim();
        if (value && [...value].length <= 24) { H.name = value; H.editingName = false; }
        render();
      }
    });

    root.addEventListener("input", (event) => {
      const range = event.target.closest("[data-range]");
      if (range) {
        range.parentElement.querySelector("output").textContent =
          range.dataset.range === "fps" ? range.value : Number(range.value).toFixed(1);
      }
      const joinInput = event.target.closest("[data-join-code]");
      if (joinInput) {
        const dials = root.querySelectorAll("#join-inline .b-dial");
        const value = joinInput.value.replace(/\D/g, "").slice(0, 4);
        joinInput.value = value;
        dials.forEach((dial, i) => {
          dial.textContent = value[i] ?? "";
          dial.classList.toggle("is-filled", Boolean(value[i]));
          dial.classList.toggle("is-active", i === value.length);
        });
        if (value.length === 4) {
          window.location.assign(`viewer.html?scene=playing&lang=${D.lang}&mode=${D.vis ? "vis" : "text"}&room=${encodeURIComponent(value)}`);
        }
      }
    });

    D.mountSceneBar("host", SCENES, H.scene, (scene) => setScene(scene));
    bindHeaderControls(render);
    render();
  }

  /* ================================================================
     VIEWER
     ================================================================ */
  if (page === "viewer") {
    const SCENES = ["playing", "joining", "waiting", "connecting", "needsplay", "paused", "recovering", "failed", "hostoffline", "denied", "notfound", "full"];
    const root = document.getElementById("viewer-root");
    const V = {
      scene: D.scene || "playing",
      route: D.param("route", "p2p"),
      relay: D.boolParam("relay"),
      name: D.lang === "en" ? "You" : "你",
      details: D.boolParam("details"),
      topology: D.boolParam("topology"),
      editingName: false,
      timer: null,
    };
    let prevScene = null;
    let prevPawnKeys = new Set();
    const inRoom = () => !["denied", "notfound", "full"].includes(V.scene);
    const hasFeed = () => ["playing", "needsplay", "paused", "recovering", "failed", "hostoffline"].includes(V.scene);
    const frozen = () => ["needsplay", "paused", "failed", "hostoffline"].includes(V.scene);

    function tvOverlay() {
      const map = {
        waiting: { icon: "moon", label: t("viewer.msg.waitingHost"), key: "viewer.msg.waitingHost", dim: false, spin: false },
        paused: { icon: "pause", label: t("viewer.msg.hostPaused"), key: "viewer.msg.hostPaused", dim: true, spin: false },
        recovering: { icon: "loader", label: t("viewer.msg.recovering"), key: "viewer.msg.recovering", dim: true, spin: true },
        failed: { icon: "alert", label: t("viewer.msg.routeFailed"), key: "viewer.msg.routeFailed", dim: true, spin: false },
        hostoffline: { icon: "wifiOff", label: t("viewer.msg.hostOffline"), key: "viewer.msg.hostOffline", dim: true, spin: false },
      };
      if (V.scene === "connecting") {
        return `<div class="b-tv-static"></div>
        <div class="b-tv-overlay" role="status" aria-label="${esc(t(V.route === "sfu" ? "viewer.msg.preparingSfu" : "viewer.msg.preparingP2p"))}">${story(1)}</div>`;
      }
      const o = map[V.scene];
      if (!o) return "";
      return `<div class="b-tv-overlay ${o.dim ? "is-dim" : ""}" role="status" aria-label="${esc(o.label)}">
        <span class="b-tv-big ${o.spin ? "b-spin" : ""}">${I(o.icon, 30)}</span>
        ${tvMsg(o.key)}
      </div>`;
    }

    function accessView() {
      const map = {
        denied: { icon: "lock", label: t("viewer.msg.denied"), hint: t("viewer.hint.denied"), password: true },
        notfound: { icon: "door", label: t("viewer.msg.notFound"), hint: t("viewer.hint.notFound"), password: false },
        full: { icon: "users", label: t("viewer.msg.full"), hint: t("join.fullHint"), password: false },
      };
      const p = map[V.scene];
      return `<div class="b-join"><div class="b-join-panel b-fade">
        <span class="b-tv-big" style="border-color:var(--ink);color:var(--ink);background:var(--paper)" title="${esc(p.label)}" aria-label="${esc(p.label)}">${I(p.icon, 30)}</span>
        ${D.vis ? `<span class="b-pill is-bad" title="${esc(p.hint)}">${I("alert", 16)}<span class="visually-hidden">${esc(p.hint)}</span></span>` : `
        <div class="b-access-text">
          <h2>${esc(p.label)}</h2>
          <p>${esc(p.hint)}</p>
        </div>`}
        ${p.password ? `
        <form data-form="viewer-password" style="display:grid;justify-items:center;gap:14px">
          <span class="b-input" style="min-width:220px">
            ${I("key", 17)}
            <input type="password" aria-label="${esc(t("join.password"))}" placeholder="${D.vis ? "····" : esc(t("join.password"))}">
          </span>
          <button class="b-join-go" type="submit" title="${esc(t("join.submit"))}" aria-label="${esc(t("join.submit"))}">${I("arrowRight", 26)}</button>
          ${cap("join.submit")}
        </form>` : `
        <button class="b-join-go" data-act="back-join" title="${esc(t("common.retry"))}" aria-label="${esc(t("common.retry"))}">${I("refresh", 24)}</button>
        ${cap("common.retry")}`}
      </div></div>`;
    }

    function roomView() {
      const list = D.roster(D.intParam("viewers", 4));
      const children = V.relay ? ["豆腐", "Rex"] : [];
      const self = { name: V.name, state: V.scene === "playing" ? "connected" : "connecting" };
      const ledState = V.scene === "playing" ? ["live", t("viewer.msg.playing")]
        : V.scene === "paused" ? ["warn", t("viewer.msg.hostPaused")]
        : V.scene === "recovering" ? ["warn", t("viewer.msg.recovering")]
        : V.scene === "failed" ? ["bad", t("viewer.msg.routeFailed")]
        : V.scene === "hostoffline" ? ["bad", t("viewer.msg.hostOffline")]
        : V.scene === "waiting" ? ["", t("viewer.msg.waitingHost")]
        : ["busy", t("viewer.msg.preparingP2p")];
      document.getElementById("header-leds").innerHTML = ledStrip(ledState[0], ledState[1]);
      const crt = V.scene === "playing" && prevScene !== "playing";

      return `
      <div class="b-scene">
        <div class="b-tv">
          <div class="b-tv-screen ${crt ? "is-on" : ""}" id="tv">
            ${hasFeed() ? `<div data-feed ${frozen() ? 'data-state="frozen"' : ""}></div>` : ""}
            ${tvOverlay()}
            ${V.scene === "needsplay" ? `
              <div class="b-tv-overlay is-dim">
                <button type="button" class="b-tv-big is-action is-ripple" data-act="play" title="${esc(t("viewer.play"))}" aria-label="${esc(t("viewer.play"))}">${I("play", 30)}</button>
                ${tvMsg("viewer.msg.needsPlay")}
              </div>` : ""}
            ${V.scene === "failed" ? `
              <div class="b-tv-overlay" style="align-content:end;padding-bottom:26px">
                <button type="button" class="b-tv-big is-action" data-act="reconnect" title="${esc(t("viewer.reconnect"))}" aria-label="${esc(t("viewer.reconnect"))}">${I("refresh", 26)}</button>
                ${tvMsg("viewer.reconnect")}
              </div>` : ""}
          </div>
          <div class="b-tv-chin"><i class="${V.scene === "playing" ? "is-on" : ["paused", "recovering"].includes(V.scene) ? "is-warn" : ["failed", "hostoffline"].includes(V.scene) ? "is-bad" : "is-busy"}"></i></div>
        </div>
        <div class="b-shelf"></div>
        <div class="b-couch">
          ${couchSvg()}
          <div class="b-pawns" role="group" aria-label="${esc(t("common.viewers"))}">
            ${pawn(self, 0, { you: true, animate: !prevPawnKeys.has("you") })}
            ${children.map((name, i) => pawn({ name, state: "connected" }, i + 4, { child: true, animate: !prevPawnKeys.has(`child:${name}`) })).join("")}
            ${list.map((v, i) => pawn(v, i, { animate: !prevPawnKeys.has(v.name) })).join("")}
          </div>
        </div>
      </div>
      <div class="b-deck">
        <div class="b-row">
          ${lcd(D.roomCode())}
          ${D.vis ? "" : `<span class="b-status-text">${esc(ledState[1])}</span>`}
          <span class="b-spacer"></span>
          ${V.editingName ? `
            <span class="b-input" style="min-width:140px"><input data-name-input value="${esc(V.name)}" maxlength="48" aria-label="${esc(t("host.name"))}"></span>
            <button class="b-btn" data-act="name-save" title="${esc(t("host.nameSave"))}" aria-label="${esc(t("host.nameSave"))}" style="min-width:44px;height:44px">${I("check", 16)}</button>
            <button class="b-btn" data-act="name-cancel" title="${esc(t("host.nameCancel"))}" aria-label="${esc(t("host.nameCancel"))}" style="min-width:44px;height:44px">${I("x", 16)}</button>
          ` : `
            <span class="b-name-tag" title="${esc(t("host.name"))}"><i></i>${esc(V.name)}</span>
            <button class="b-btn" data-act="name-edit" title="${esc(t("host.nameEdit"))}" aria-label="${esc(t("host.nameEdit"))}" style="min-width:44px;height:44px">${I("pencil", 15)}</button>
          `}
          <button class="b-btn ${V.topology ? "is-on" : ""}" data-act="topology" title="${esc(t(V.topology ? "host.topology.hide" : "host.topology.show"))}" aria-label="${esc(t("host.topology"))}" aria-expanded="${V.topology}">${I("network", 19)}${cap("host.topology")}</button>
          <button class="b-btn" data-act="reconnect" title="${esc(t("viewer.reconnect"))}" aria-label="${esc(t("viewer.reconnect"))}" ${["playing", "recovering", "failed", "hostoffline", "paused"].includes(V.scene) ? "" : "disabled"}>${I("refresh", 19)}${cap("viewer.reconnect")}</button>
          <button class="b-btn ${V.details ? "is-on" : ""}" data-act="details" title="${esc(t(V.details ? "host.details.hide" : "host.details"))}" aria-label="${esc(t("host.details"))}" aria-expanded="${V.details}">${I("gauge", 19)}${cap("host.details")}</button>
        </div>
        ${V.details ? `<div class="b-row is-sub b-fade">${meterTag("arrowDown", t("stats.title"))}${meterStrip(V.route)}</div>` : ""}
        ${V.details && V.relay ? `<div class="b-row is-sub b-fade">${meterTag("arrowUp", t("stats.relay"))}${meterStrip()}</div>` : ""}
        ${V.topology ? `<div class="b-row is-sub b-fade">${routePath({ viewers: list, self: { name: V.name, route: V.route, children }, hostLabel: D.hostName(), flow: ["connecting", "recovering"].includes(V.scene) })}</div>` : ""}
      </div>`;
    }

    function render() {
      if (!inRoom()) { root.innerHTML = accessView(); return; }
      if (V.scene === "joining") {
        document.getElementById("header-leds").innerHTML = ledStrip("busy", t("viewer.msg.joining"));
        root.innerHTML = `<div class="b-join"><div class="b-join-panel"><span class="b-tv-big b-spin" role="status" aria-label="${esc(t("viewer.msg.joining"))}">${I("loader", 30)}</span>${tvMsg("viewer.msg.joining")}</div></div>`;
        V.timer = window.setTimeout(() => setScene("playing"), 1800);
        return;
      }
      root.innerHTML = roomView();
      const feedHolder = root.querySelector("[data-feed]");
      if (feedHolder) {
        window.ScreenerFeed.mount(feedHolder, feedHolder.dataset.state === "frozen" ? "frozen" : "live");
      }
      prevScene = V.scene;
      prevPawnKeys = new Set([
        "you",
        ...(V.relay ? ["child:豆腐", "child:Rex"] : []),
        ...D.roster(D.intParam("viewers", 4)).map((v) => v.name),
      ]);
    }

    function setScene(scene) {
      window.clearTimeout(V.timer);
      V.scene = scene;
      render();
    }

    root.addEventListener("click", async (event) => {
      const target = event.target.closest("[data-act]");
      if (!target) return;
      const act = target.dataset.act;
      if (act === "play") setScene("playing");
      if (act === "reconnect") { setScene("recovering"); V.timer = window.setTimeout(() => setScene("playing"), 2200); }
      if (act === "topology") { V.topology = !V.topology; render(); }
      if (act === "details") { V.details = !V.details; render(); }
      if (act === "copy-room") { if (await copyText(D.roomCode())) flashCheck(target); }
      if (act === "back-join") { window.location.assign(`join.html?lang=${D.lang}`); }
      if (act === "name-edit") { V.editingName = true; render(); root.querySelector("[data-name-input]").focus(); }
      if (act === "name-cancel") { V.editingName = false; render(); }
      if (act === "name-save") {
        const value = root.querySelector("[data-name-input]").value.trim();
        if (value && [...value].length <= 24) { V.name = value; V.editingName = false; }
        render();
      }
    });

    root.addEventListener("submit", (event) => {
      if (event.target.matches('[data-form="viewer-password"]')) {
        event.preventDefault();
        setScene("joining");
      }
    });

    D.mountSceneBar("viewer", SCENES, V.scene, (scene) => setScene(scene));
    bindHeaderControls(render);
    render();
  }

  /* ================================================================
     JOIN
     ================================================================ */
  if (page === "join") {
    const SCENES = ["form", "invalid", "joining", "denied", "notfound", "full", "gate"];
    const root = document.getElementById("join-root");
    const J = { scene: D.scene || "form", code: "" };

    function dialsHtml() {
      return `<div class="b-dials-wrap">
        <div class="b-dials" id="dials">
          ${[0, 1, 2, 3].map((i) => `<span class="b-dial ${i === 0 ? "is-active" : ""}"></span>`).join("")}
        </div>
        <input inputmode="numeric" autocomplete="off" maxlength="4" aria-label="${esc(t("join.field"))}" data-dials-input ${J.scene === "invalid" ? 'value="12ab"' : ""}>
      </div>`;
    }

    function render() {
      if (J.scene === "gate") {
        root.innerHTML = `<div class="b-join"><form class="b-join-panel b-fade" data-form="gate">
          <span class="b-tv-big" style="border-color:var(--ink);color:var(--ink);background:var(--paper)" title="${esc(t("gate.title"))}" aria-label="${esc(t("gate.title"))}">${I("key", 30)}</span>
          ${D.vis ? "" : `<div class="b-access-text"><h2>${esc(t("gate.title"))}</h2><p>${esc(t("gate.hint"))}</p></div>`}
          <span class="b-input" style="min-width:230px">
            ${I("lock", 17)}
            <input type="password" aria-label="${esc(t("gate.password"))}" placeholder="${D.vis ? "····" : esc(t("gate.password"))}" autofocus>
          </span>
          <button class="b-join-go" type="submit" title="${esc(t("gate.submit"))}" aria-label="${esc(t("gate.submit"))}">${I("arrowRight", 26)}</button>
          ${cap("gate.submit")}
        </form></div>`;
        return;
      }
      if (J.scene === "joining") {
        root.innerHTML = `<div class="b-join"><div class="b-join-panel"><span class="b-tv-big b-spin" role="status" aria-label="${esc(t("join.joining"))}">${I("loader", 30)}</span>${tvMsg("join.joining")}</div></div>`;
        window.setTimeout(() => {
          window.location.assign(`viewer.html?scene=playing&lang=${D.lang}&mode=${D.vis ? "vis" : "text"}&room=${encodeURIComponent(J.code || "7316")}`);
        }, 1500);
        return;
      }
      if (["denied", "notfound", "full"].includes(J.scene)) {
        const map = {
          denied: { icon: "lock", label: t("join.denied"), hint: t("join.deniedHint"), password: true },
          notfound: { icon: "door", label: t("join.notFound"), hint: t("join.notFoundHint"), password: false },
          full: { icon: "users", label: t("join.full"), hint: t("join.fullHint"), password: false },
        };
        const p = map[J.scene];
        root.innerHTML = `<div class="b-join"><div class="b-join-panel b-fade">
          <span class="b-tv-big" style="border-color:var(--ink);color:var(--ink);background:var(--paper)" title="${esc(p.label)}" aria-label="${esc(p.label)}">${I(p.icon, 30)}</span>
          ${D.vis ? `<span class="b-pill is-bad" title="${esc(p.hint)}">${I("alert", 16)}<span class="visually-hidden">${esc(p.hint)}</span></span>` : `
          <div class="b-access-text">
            <h2>${esc(p.label)}</h2>
            <p>${esc(p.hint)}</p>
          </div>`}
          ${p.password ? `
          <form data-form="room-password" style="display:grid;justify-items:center;gap:14px">
            <span class="b-input" style="min-width:220px">
              ${I("key", 17)}
              <input type="password" aria-label="${esc(t("join.password"))}" placeholder="${D.vis ? "····" : esc(t("join.password"))}" autofocus>
            </span>
            <button class="b-join-go" type="submit" title="${esc(t("join.submit"))}" aria-label="${esc(t("join.submit"))}">${I("arrowRight", 26)}</button>
            ${cap("join.submit")}
          </form>` : `
          <button class="b-join-go" data-act="again" title="${esc(t("common.retry"))}" aria-label="${esc(t("common.retry"))}">${I("refresh", 24)}</button>
          ${cap("common.retry")}`}
        </div></div>`;
        return;
      }
      root.innerHTML = `<div class="b-join"><form class="b-join-panel b-fade" data-form="code">
        <span class="b-join-door ${J.scene === "invalid" ? "is-shake" : ""}" title="${esc(t("join.title"))}" aria-label="${esc(t("join.title"))}">${I("door", 96)}</span>
        ${D.vis ? "" : `<div class="b-access-text"><h2>${esc(t("join.title"))}</h2><p>${esc(t("join.hint"))}</p></div>`}
        ${dialsHtml()}
        ${J.scene === "invalid" ? `<span class="b-join-error" role="alert" title="${esc(t("join.invalid"))}" aria-label="${esc(t("join.invalid"))}">${I("x", 24)}</span>` : ""}
        ${J.scene === "invalid" && !D.vis ? `<span class="b-cap" style="color:var(--danger)">${esc(t("join.invalid"))}</span>` : ""}
        <button class="b-join-go" type="submit" title="${esc(t("join.submit"))}" aria-label="${esc(t("join.submit"))}" disabled>${I("arrowRight", 26)}</button>
        ${cap("join.submit")}
      </form></div>`;
      const input = root.querySelector("[data-dials-input]");
      input.focus();
    }

    function setScene(scene) {
      J.scene = scene;
      render();
    }

    root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-act]");
      if (target?.dataset.act === "again") setScene("form");
    });

    root.addEventListener("input", (event) => {
      const input = event.target.closest("[data-dials-input]");
      if (!input) return;
      const value = input.value.replace(/\D/g, "").slice(0, 4);
      input.value = value;
      J.code = value;
      const dials = root.querySelectorAll(".b-dial");
      dials.forEach((dial, i) => {
        dial.textContent = value[i] ?? "";
        dial.classList.toggle("is-filled", Boolean(value[i]));
        dial.classList.toggle("is-active", i === Math.min(value.length, 3) && value.length < 4 || (value.length === 0 && i === 0));
      });
      const go = root.querySelector(".b-join-go");
      if (go) go.disabled = value.length !== 4;
    });

    root.addEventListener("submit", (event) => {
      event.preventDefault();
      if (event.target.matches('[data-form="code"]')) {
        if (/^[1-9][0-9]{3}$/.test(J.code)) setScene("joining");
        else setScene("invalid");
      }
      if (event.target.matches('[data-form="room-password"], [data-form="gate"]')) {
        setScene("joining");
      }
    });

    D.mountSceneBar("join", SCENES, J.scene, (scene) => setScene(scene));
    bindHeaderControls(render);
    render();
  }
})();
