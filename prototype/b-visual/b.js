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
    return `<button type="button" class="b-pawn ${opts.you ? "is-you" : ""}" style="animation-delay:${index * 70}ms" title="${esc(label)}" aria-label="${esc(label)}">
      ${pawnSvg(color)}
      ${opts.hideLed ? "" : `<i class="b-pawn-led ${waiting ? "is-wait" : ""}"></i>`}
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
    const panels = ["door", "plug", "tv"];
    return `<div class="b-story" role="status" aria-label="${esc(t("host.starting"))}">
      ${panels.map((p, i) => `
        ${i > 0 ? `<span class="b-story-link ${step > i - 1 ? "is-done" : ""}"></span>` : ""}
        <span class="b-story-panel ${step > i ? "is-done" : step === i ? "is-now" : ""}">
          ${step > i ? I("check", 22) : I(p, 22)}
        </span>`).join("")}
    </div>`;
  }

  function meterStrip() {
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
      ${cells.map(([icon, value, label]) => `
        <span class="b-meter-cell" title="${esc(label)}">${I(icon, 17)}<b>${esc(value)}</b></span>`).join("")}
    </div>`;
  }

  function routePath({ viewers, selfName, hostLabel, flow }) {
    const h = Math.max(150, 60 + viewers.length * 40);
    const midY = h / 2;
    const hostX = 30;
    const selfX = 300;
    const sfuX = 300;
    const viewerX = 570;
    const lines = [];
    const nodes = [];
    viewers.forEach((v, i) => {
      const y = 40 + i * 40;
      const color = PAWN_COLORS[i % PAWN_COLORS.length];
      if (v.route === "sfu") {
        lines.push(`<path d="M ${sfuX + 20} ${midY} Q ${(sfuX + viewerX) / 2} ${midY + (y - midY) * 0.7}, ${viewerX - 24} ${y}" fill="none" stroke="#8ea3b8" stroke-width="2.5" class="${flow ? "flow" : ""}"/>`);
      } else {
        lines.push(`<path d="M ${hostX + 24} ${midY} Q ${(hostX + viewerX) / 2} ${midY + (y - midY) * 0.7}, ${viewerX - 24} ${y}" fill="none" stroke="${v.state === "connected" ? "#2fa66a" : "#d98e04"}" stroke-width="2.5" class="${flow ? "flow" : ""}"/>`);
      }
      nodes.push(`<g transform="translate(${viewerX - 14}, ${y - 15}) scale(0.72)"><title>${esc(v.name)}</title>${pawnSvg(color)}</g>`);
    });
    const hasSfu = viewers.some((v) => v.route === "sfu");
    if (hasSfu) {
      lines.push(`<path d="M ${hostX + 24} ${midY} L ${selfX - 20} ${midY}" fill="none" stroke="#8ea3b8" stroke-width="2.5" class="${flow ? "flow" : ""}"/>`);
    }
    return `<div class="b-route" role="img" aria-label="${esc(t("host.topology"))}">
      <svg viewBox="0 0 640 ${h}">
        <title>${esc(t("host.topology"))}</title>
        ${lines.join("")}
        <g transform="translate(${hostX - 6}, ${midY - 24})">${pawnSvg("#e4572e")}<title>${esc(hostLabel)} · ${esc(t("common.host"))}</title></g>
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
    return `<span class="b-pill ${tone ? `is-${tone}` : ""}" role="status" title="${esc(label)}">${I(icon, 16)}<span class="visually-hidden">${esc(label)}</span></span>`;
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
    const hasRoom = () => !["idle", "error"].includes(H.scene);
    const isLive = () => H.scene === "live" || H.scene === "paused";
    const viewers = () => D.roster(isLive() ? D.intParam("viewers", 4) : 0);

    function tvHtml() {
      if (["idle", "ended", "error"].includes(H.scene)) {
        return `<div class="b-tv-overlay b-fade">
          <button type="button" class="b-tv-big is-action is-ripple" data-act="start" title="${esc(t("host.start"))}" aria-label="${esc(t("host.start"))}">${I("cast", 34)}</button>
          <button type="button" class="b-tv-big" data-act="toggle-join" title="${esc(t("host.join"))}" aria-label="${esc(t("host.join"))}">${I("door", 30)}</button>
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
        </div>`;
      }
      return "";
    }

    function controlsHtml() {
      if (H.scene === "starting") {
        return `<button class="b-btn is-danger" data-act="cancel-start" title="${esc(t("host.cancelStart"))}" aria-label="${esc(t("host.cancelStart"))}">${I("x", 20)}</button>`;
      }
      if (!isLive()) return "";
      return `
        <button class="b-btn" data-act="pause" title="${esc(t(H.scene === "paused" ? "host.resume" : "host.pause"))}" aria-label="${esc(t(H.scene === "paused" ? "host.resume" : "host.pause"))}">${I(H.scene === "paused" ? "play" : "pause", 18)}</button>
        <button class="b-btn" data-act="switch" title="${esc(t("host.switchSource"))}" aria-label="${esc(t("host.switchSource"))}">${I("refresh", 19)}</button>
        <button class="b-btn is-danger" data-act="stop" title="${esc(t("host.stop"))}" aria-label="${esc(t("host.stop"))}">${I("stop", 17)}</button>`;
    }

    function inviteRowHtml() {
      if (!hasRoom()) return "";
      return `<div class="b-row" role="group" aria-label="${esc(t("host.invite"))}">
        <button class="b-btn ${H.invite ? "is-primary" : ""}" data-act="copy-invite" title="${esc(t("host.invite.copy"))}" aria-label="${esc(t("host.invite.copy"))}" ${H.invite ? "" : "disabled"}>${I("link", 19)}</button>
        <button class="b-btn" data-act="rotate-invite" title="${esc(t("host.invite.rotate"))}" aria-label="${esc(t("host.invite.rotate"))}">${I("refresh", 18)}</button>
        <button class="b-btn is-danger" data-act="revoke-invite" title="${esc(t("host.invite.revoke"))}" aria-label="${esc(t("host.invite.revoke"))}" ${H.invite ? "" : "disabled"}>${I("linkOff", 19)}</button>
        <span class="b-divider"></span>
        <span class="b-toggle" role="group" aria-label="${esc(t("host.policy"))}">
          <button type="button" data-act="policy" data-v="open" class="${H.policy === "open" ? "is-selected" : ""}" title="${esc(t("host.policy.open"))} · ${esc(t("host.policy.openHint"))}" aria-label="${esc(t("host.policy.open"))}" aria-pressed="${H.policy === "open"}">${I("globe", 19)}</button>
          <button type="button" data-act="policy" data-v="private" class="${H.policy === "private" ? "is-selected" : ""}" title="${esc(t("host.policy.private"))} · ${esc(t("host.policy.privateHint"))}" aria-label="${esc(t("host.policy.private"))}" aria-pressed="${H.policy === "private"}">${I("lock", 19)}</button>
        </span>
        ${H.policy === "private" ? `
        <button class="b-btn ${H.hasPassword ? "is-on" : ""}" data-act="password-toggle" title="${esc(t(H.hasPassword ? "host.password.set" : "host.password.unset"))}" aria-label="${esc(t("host.password.setAction"))}" aria-expanded="${H.passwordOpen}">${I("key", 19)}</button>
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
        { caption: "720·30", density: 0, label: t("host.quality.720p30") },
        { caption: "1080·30", density: 1, label: t("host.quality.1080p30") },
        { caption: "1080·60", density: 2, label: t("host.quality.1080p60") },
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
            <button type="button" class="b-tile ${H.preset === i ? "is-selected" : ""}" data-act="preset" data-v="${i}" title="${esc(tile.label)}" aria-label="${esc(tile.label)}" aria-pressed="${H.preset === i}" ${H.scene === "starting" ? "disabled" : ""}>
              ${glyph(tile.density)}<small>${tile.caption}</small>
            </button>`).join("")}
        </div>
        <span class="b-spacer"></span>
        <button class="b-btn ${H.advanced ? "is-on" : ""}" data-act="advanced" title="${esc(t("host.advanced"))}" aria-label="${esc(t("host.advanced"))}" aria-expanded="${H.advanced}">${I("sliders", 20)}</button>
      </div>
      ${H.advanced ? advancedHtml() : ""}`;
    }

    function advancedHtml() {
      const locked = isLive() || H.scene === "starting";
      return `<div class="b-door-body b-fade" role="group" aria-label="${esc(t("host.advanced"))}">
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.resolution"))}">${I("expand", 19)}</span>
          <div class="b-chips" role="group" aria-label="${esc(t("host.advanced.resolution"))}">
            ${["480p", "720p", "1080p", "1440p"].map((r, i) => `<button class="b-chip ${i === 2 ? "is-selected" : ""}" ${H.scene === "starting" ? "disabled" : ""}>${r}</button>`).join("")}
          </div>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.framerate"))}">${I("wave", 19)}</span>
          <span class="b-slider"><input type="range" min="15" max="60" step="5" value="30" data-range="fps" aria-label="${esc(t("host.advanced.framerate"))}" ${H.scene === "starting" ? "disabled" : ""}><output>30</output></span>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.bitrate"))}">${I("gauge", 19)}</span>
          <span class="b-slider"><input type="range" min="2" max="12" step="0.5" value="5" data-range="mbps" aria-label="${esc(t("host.advanced.bitrate"))}" ${H.scene === "starting" ? "disabled" : ""}><output>5.0</output></span>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.preference"))}">${I("mountain", 19)}</span>
          <div class="b-chips" role="group" aria-label="${esc(t("host.advanced.preference"))}">
            <button class="b-chip" title="${esc(t("host.advanced.preference.resolution"))} · ${esc(t("host.advanced.preference.resolutionHint"))}" ${locked ? "disabled" : ""}>${I("mountain", 18)}</button>
            <button class="b-chip is-selected" title="${esc(t("host.advanced.preference.balanced"))} · ${esc(t("host.advanced.preference.balancedHint"))}" ${locked ? "disabled" : ""}>${I("balance", 18)}</button>
            <button class="b-chip" title="${esc(t("host.advanced.preference.framerate"))} · ${esc(t("host.advanced.preference.framerateHint"))}" ${locked ? "disabled" : ""}>${I("zap", 18)}</button>
          </div>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.audio"))}">${I("speaker", 19)}</span>
          <div class="b-chips" role="group" aria-label="${esc(t("host.advanced.audio"))}">
            <button class="b-chip" title="${esc(t("host.advanced.audio.saver"))} · 64 kbps" ${H.scene === "starting" ? "disabled" : ""}>64</button>
            <button class="b-chip is-selected" title="${esc(t("host.advanced.audio.music"))} · 128 kbps" ${H.scene === "starting" ? "disabled" : ""}>128</button>
            <button class="b-chip" title="${esc(t("host.advanced.audio.veryHigh"))} · 192 kbps" ${H.scene === "starting" ? "disabled" : ""}>192</button>
          </div>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.route"))}">${I("branch", 19)}</span>
          <div class="b-chips">
            <button class="b-switch" role="switch" aria-checked="false" data-act="switch-toggle" title="${esc(t("host.advanced.route.topo"))} · ${esc(t("host.advanced.route.topoHint"))}" aria-label="${esc(t("host.advanced.route.topo"))}" ${locked ? "disabled" : ""}></button>
            <button class="b-switch" role="switch" aria-checked="false" data-act="switch-toggle" title="${esc(t("host.advanced.route.peerOnly"))} · ${esc(t("host.advanced.route.peerOnlyHint"))}" aria-label="${esc(t("host.advanced.route.peerOnly"))}" ${locked ? "disabled" : ""}></button>
          </div>
        </div>
        <div class="b-door-group">
          <span class="b-door-glyph" title="${esc(t("host.advanced.codec"))}">${I("cpu", 19)}</span>
          <div class="b-chips" role="group" aria-label="${esc(t("host.advanced.codec"))}">
            <button class="b-chip" title="VP8 · ${esc(t("host.advanced.codec.vp8Hint"))}" ${locked ? "disabled" : ""}>VP8</button>
            <button class="b-chip is-selected" title="${esc(t("host.advanced.codec.auto"))} · ${esc(t("host.advanced.codec.autoHint"))}" ${locked ? "disabled" : ""}>AUTO</button>
            <button class="b-chip" title="H264 · ${esc(t("host.advanced.codec.h264Hint"))}" ${locked ? "disabled" : ""}>H264</button>
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
      const led = H.scene === "live" ? ["live", t("state.signal.connected")]
        : H.scene === "starting" ? ["busy", t("host.starting")]
        : H.scene === "paused" ? ["warn", t("host.paused")]
        : ["", t("state.signal.offline")];
      document.getElementById("header-leds").innerHTML = ledStrip(led[0], led[1]);

      root.innerHTML = `
      <div class="b-scene">
        <div class="b-tv">
          <div class="b-tv-screen ${H.scene === "live" ? "is-on" : ""}" id="tv">
            ${isLive() ? `<div data-feed ${H.scene === "paused" ? 'data-state="frozen"' : ""}></div>` : ""}
            ${tvHtml()}
          </div>
          <div class="b-tv-chin"><i class="${H.scene === "live" ? "is-on" : H.scene === "paused" ? "is-warn" : H.scene === "starting" ? "is-busy" : ""}"></i></div>
        </div>
        <div class="b-shelf"></div>
        <div class="b-couch">
          ${couchSvg()}
          <div class="b-pawns" role="group" aria-label="${esc(t("common.viewers"))}">
            ${list.map((v, i) => pawn(v, i)).join("")}
          </div>
          ${list.length === 0 ? `<div class="b-couch-empty" title="${esc(t(H.scene === "live" ? "host.viewers.waiting" : "host.viewers.empty"))}">${I("users", 22)}</div>` : ""}
        </div>
      </div>
      <div class="b-deck">
        <div class="b-row">
          ${hasRoom() ? lcd(D.roomCode()) : ""}
          <span class="b-spacer"></span>
          ${H.noAudio && isLive() ? pill("speaker", "", t("host.noAudio")) : ""}
          ${H.notice ?? ""}
          ${nameHtml()}
          ${controlsHtml()}
        </div>
        ${inviteRowHtml()}
        ${qualityRowHtml()}
        <div class="b-row" role="group" aria-label="${esc(t("host.details"))}">
          <button class="b-btn ${H.details ? "is-on" : ""}" data-act="details" title="${esc(t(H.details ? "host.details.hide" : "host.details"))}" aria-label="${esc(t("host.details"))}" aria-expanded="${H.details}">${I("gauge", 20)}</button>
          <button class="b-btn ${H.topology ? "is-on" : ""}" data-act="topology" title="${esc(t(H.topology ? "host.topology.hide" : "host.topology.show"))}" aria-label="${esc(t("host.topology"))}" aria-expanded="${H.topology}">${I("network", 20)}</button>
        </div>
        ${H.details ? `<div class="b-row is-sub b-fade">${meterStrip()}</div>` : ""}
        ${H.topology ? `<div class="b-row is-sub b-fade">${routePath({ viewers: list, hostLabel: H.name, flow: H.scene === "starting" })}</div>` : ""}
      </div>`;

      const feedHolder = root.querySelector("[data-feed]");
      if (feedHolder) {
        window.ScreenerFeed.mount(feedHolder, feedHolder.dataset.state === "frozen" ? "frozen" : "live");
      }
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
      if (act === "switch") { /* simulated source switch: brief static flash */ }
      if (act === "toggle-join") {
        const box = root.querySelector("#join-inline");
        box.hidden = !box.hidden;
        if (!box.hidden) box.querySelector("input").focus();
      }
      if (act === "copy-room") { if (await copyText(D.roomCode())) flashCheck(target); }
      if (act === "copy-invite") { if (await copyText(`https://share.example/${D.roomCode()}#v=Kx9Qm4LwTz2Ab8Cd3EfGh1`)) flashCheck(target); }
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
          window.location.assign(`viewer.html?scene=playing&lang=${D.lang}&room=${encodeURIComponent(value)}`);
        }
      }
    });

    D.mountSceneBar("host", SCENES, H.scene, (scene) => setScene(scene));
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
      name: D.lang === "en" ? "You" : "你",
      details: D.boolParam("details"),
      topology: D.boolParam("topology"),
      editingName: false,
      timer: null,
    };
    const inRoom = () => !["denied", "notfound", "full"].includes(V.scene);
    const hasFeed = () => ["playing", "needsplay", "paused", "recovering", "failed", "hostoffline"].includes(V.scene);
    const frozen = () => ["needsplay", "paused", "failed", "hostoffline"].includes(V.scene);

    function tvOverlay() {
      const map = {
        waiting: { icon: "moon", label: t("viewer.msg.waitingHost"), dim: false, spin: false },
        paused: { icon: "pause", label: t("viewer.msg.hostPaused"), dim: true, spin: false },
        recovering: { icon: "loader", label: t("viewer.msg.recovering"), dim: true, spin: true },
        failed: { icon: "alert", label: t("viewer.msg.routeFailed"), dim: true, spin: false },
        hostoffline: { icon: "wifiOff", label: t("viewer.msg.hostOffline"), dim: true, spin: false },
      };
      if (V.scene === "connecting") {
        return `<div class="b-tv-static"></div>
        <div class="b-tv-overlay" role="status" aria-label="${esc(t(V.route === "sfu" ? "viewer.msg.preparingSfu" : "viewer.msg.preparingP2p"))}">${story(1)}</div>`;
      }
      const o = map[V.scene];
      if (!o) return "";
      return `<div class="b-tv-overlay ${o.dim ? "is-dim" : ""}" role="status" aria-label="${esc(o.label)}">
        <span class="b-tv-big ${o.spin ? "b-spin" : ""}">${I(o.icon, 30)}</span>
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
        <span class="b-pill is-bad" title="${esc(p.hint)}">${I("alert", 16)}<span class="visually-hidden">${esc(p.hint)}</span></span>
        ${p.password ? `
        <form data-form="viewer-password" style="display:grid;justify-items:center;gap:14px">
          <span class="b-input" style="min-width:220px">
            ${I("key", 17)}
            <input type="password" aria-label="${esc(t("join.password"))}" placeholder="····">
          </span>
          <button class="b-join-go" type="submit" title="${esc(t("join.submit"))}" aria-label="${esc(t("join.submit"))}">${I("arrowRight", 26)}</button>
        </form>` : `
        <button class="b-join-go" data-act="back-join" title="${esc(t("common.retry"))}" aria-label="${esc(t("common.retry"))}">${I("refresh", 24)}</button>`}
      </div></div>`;
    }

    function roomView() {
      const list = D.roster(D.intParam("viewers", 4));
      const self = { name: V.name, state: V.scene === "playing" ? "connected" : "connecting" };
      const ledState = V.scene === "playing" ? ["live", t("viewer.msg.playing")]
        : V.scene === "paused" ? ["warn", t("viewer.msg.hostPaused")]
        : V.scene === "recovering" ? ["warn", t("viewer.msg.recovering")]
        : V.scene === "failed" ? ["bad", t("viewer.msg.routeFailed")]
        : V.scene === "hostoffline" ? ["bad", t("viewer.msg.hostOffline")]
        : V.scene === "waiting" ? ["", t("viewer.msg.waitingHost")]
        : ["busy", t("viewer.msg.preparingP2p")];
      document.getElementById("header-leds").innerHTML = ledStrip(ledState[0], ledState[1]);

      return `
      <div class="b-scene">
        <div class="b-tv">
          <div class="b-tv-screen ${V.scene === "playing" ? "is-on" : ""}" id="tv">
            ${hasFeed() ? `<div data-feed ${frozen() ? 'data-state="frozen"' : ""}></div>` : ""}
            ${tvOverlay()}
            ${V.scene === "needsplay" ? `
              <div class="b-tv-overlay is-dim">
                <button type="button" class="b-tv-big is-action is-ripple" data-act="play" title="${esc(t("viewer.play"))}" aria-label="${esc(t("viewer.play"))}">${I("play", 30)}</button>
              </div>` : ""}
            ${V.scene === "failed" ? `
              <div class="b-tv-overlay" style="align-content:end;padding-bottom:26px">
                <button type="button" class="b-tv-big is-action" data-act="reconnect" title="${esc(t("viewer.reconnect"))}" aria-label="${esc(t("viewer.reconnect"))}">${I("refresh", 26)}</button>
              </div>` : ""}
          </div>
          <div class="b-tv-chin"><i class="${V.scene === "playing" ? "is-on" : ["paused", "recovering"].includes(V.scene) ? "is-warn" : ["failed", "hostoffline"].includes(V.scene) ? "is-bad" : "is-busy"}"></i></div>
        </div>
        <div class="b-shelf"></div>
        <div class="b-couch">
          ${couchSvg()}
          <div class="b-pawns" role="group" aria-label="${esc(t("common.viewers"))}">
            ${pawn(self, 0, { you: true })}
            ${list.map((v, i) => pawn(v, i)).join("")}
          </div>
        </div>
      </div>
      <div class="b-deck">
        <div class="b-row">
          ${lcd(D.roomCode())}
          <span class="b-spacer"></span>
          ${V.editingName ? `
            <span class="b-input" style="min-width:140px"><input data-name-input value="${esc(V.name)}" maxlength="48" aria-label="${esc(t("host.name"))}"></span>
            <button class="b-btn" data-act="name-save" title="${esc(t("host.nameSave"))}" aria-label="${esc(t("host.nameSave"))}" style="min-width:44px;height:44px">${I("check", 16)}</button>
            <button class="b-btn" data-act="name-cancel" title="${esc(t("host.nameCancel"))}" aria-label="${esc(t("host.nameCancel"))}" style="min-width:44px;height:44px">${I("x", 16)}</button>
          ` : `
            <span class="b-name-tag" title="${esc(t("host.name"))}"><i></i>${esc(V.name)}</span>
            <button class="b-btn" data-act="name-edit" title="${esc(t("host.nameEdit"))}" aria-label="${esc(t("host.nameEdit"))}" style="min-width:44px;height:44px">${I("pencil", 15)}</button>
          `}
          <button class="b-btn ${V.topology ? "is-on" : ""}" data-act="topology" title="${esc(t(V.topology ? "host.topology.hide" : "host.topology.show"))}" aria-label="${esc(t("host.topology"))}" aria-expanded="${V.topology}">${I("network", 19)}</button>
          <button class="b-btn" data-act="reconnect" title="${esc(t("viewer.reconnect"))}" aria-label="${esc(t("viewer.reconnect"))}" ${["playing", "recovering", "failed", "hostoffline", "paused"].includes(V.scene) ? "" : "disabled"}>${I("refresh", 19)}</button>
          <button class="b-btn ${V.details ? "is-on" : ""}" data-act="details" title="${esc(t(V.details ? "host.details.hide" : "host.details"))}" aria-label="${esc(t("host.details"))}" aria-expanded="${V.details}">${I("gauge", 19)}</button>
        </div>
        ${V.details ? `<div class="b-row is-sub b-fade">${meterStrip()}</div>` : ""}
        ${V.topology ? `<div class="b-row is-sub b-fade">${routePath({ viewers: [...list], hostLabel: D.hostName(), flow: ["connecting", "recovering"].includes(V.scene) })}</div>` : ""}
      </div>`;
    }

    function render() {
      if (!inRoom()) { root.innerHTML = accessView(); return; }
      if (V.scene === "joining") {
        document.getElementById("header-leds").innerHTML = ledStrip("busy", t("viewer.msg.joining"));
        root.innerHTML = `<div class="b-join"><span class="b-tv-big b-spin" role="status" aria-label="${esc(t("viewer.msg.joining"))}">${I("loader", 30)}</span></div>`;
        V.timer = window.setTimeout(() => setScene("playing"), 1800);
        return;
      }
      root.innerHTML = roomView();
      const feedHolder = root.querySelector("[data-feed]");
      if (feedHolder) {
        window.ScreenerFeed.mount(feedHolder, feedHolder.dataset.state === "frozen" ? "frozen" : "live");
      }
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
          <span class="b-input" style="min-width:230px">
            ${I("lock", 17)}
            <input type="password" aria-label="${esc(t("gate.password"))}" placeholder="····" autofocus>
          </span>
          <button class="b-join-go" type="submit" title="${esc(t("gate.submit"))}" aria-label="${esc(t("gate.submit"))}">${I("arrowRight", 26)}</button>
        </form></div>`;
        return;
      }
      if (J.scene === "joining") {
        root.innerHTML = `<div class="b-join"><span class="b-tv-big b-spin" role="status" aria-label="${esc(t("join.joining"))}">${I("loader", 30)}</span></div>`;
        window.setTimeout(() => {
          window.location.assign(`viewer.html?scene=playing&lang=${D.lang}&room=${encodeURIComponent(J.code || "7316")}`);
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
          <span class="b-pill is-bad" title="${esc(p.hint)}">${I("alert", 16)}<span class="visually-hidden">${esc(p.hint)}</span></span>
          ${p.password ? `
          <form data-form="room-password" style="display:grid;justify-items:center;gap:14px">
            <span class="b-input" style="min-width:220px">
              ${I("key", 17)}
              <input type="password" aria-label="${esc(t("join.password"))}" placeholder="····" autofocus>
            </span>
            <button class="b-join-go" type="submit" title="${esc(t("join.submit"))}" aria-label="${esc(t("join.submit"))}">${I("arrowRight", 26)}</button>
          </form>` : `
          <button class="b-join-go" data-act="again" title="${esc(t("common.retry"))}" aria-label="${esc(t("common.retry"))}">${I("refresh", 24)}</button>`}
        </div></div>`;
        return;
      }
      root.innerHTML = `<div class="b-join"><form class="b-join-panel b-fade" data-form="code">
        <span class="b-join-door ${J.scene === "invalid" ? "is-shake" : ""}" title="${esc(t("join.title"))}" aria-label="${esc(t("join.title"))}">${I("door", 96)}</span>
        ${dialsHtml()}
        ${J.scene === "invalid" ? `<span class="b-join-error" role="alert" title="${esc(t("join.invalid"))}" aria-label="${esc(t("join.invalid"))}">${I("x", 24)}</span>` : ""}
        <button class="b-join-go" type="submit" title="${esc(t("join.submit"))}" aria-label="${esc(t("join.submit"))}" disabled>${I("arrowRight", 26)}</button>
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
    render();
  }
})();
