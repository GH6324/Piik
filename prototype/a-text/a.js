// Direction A — text-first. Renders simulated Host / Viewer / Join states
// from the shared scene engine and copy catalog.
(function () {
  const D = window.ScreenerDemo;
  const I = (n, s) => window.ScreenerIcons.icon(n, s ?? 18);
  const t = D.t;
  const page = document.body.dataset.page;

  /* ---------------- helpers ---------------- */

  function esc(value) {
    return String(value).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.append(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      area.remove();
      return ok;
    }
  }

  function flashCopied(button) {
    const original = button.innerHTML;
    button.classList.add("is-done");
    button.innerHTML = I("check", 16);
    window.setTimeout(() => {
      button.classList.remove("is-done");
      button.innerHTML = original;
    }, 1500);
  }

  function badge(state) {
    const map = {
      live: ["is-live", t("host.live")],
      connected: ["is-live", t("state.peer.connected")],
      signal: ["is-live", t("state.signal.connected")],
      connecting: ["", t("state.peer.connecting")],
      routing: ["", t("state.peer.routing")],
      waiting: ["", t("state.peer.waiting")],
      reconnecting: ["is-warn", t("state.peer.reconnecting")],
      paused: ["is-warn", t("host.paused")],
      failed: ["is-danger", t("state.peer.failed")],
    };
    const [tone, label] = map[state] ?? ["", state];
    return `<span class="a-badge ${tone}">${esc(label)}</span>`;
  }

  function routeBadge(route) {
    return `<span class="a-route">${esc(t(route === "sfu" ? "state.route.sfu" : "state.route.p2p"))}</span>`;
  }

  function statsGrid(extra) {
    const S = D.STATS;
    const rows = [
      [t("stats.resolution"), S.resolution],
      [t("stats.fps"), `${S.fps} fps`],
      [t("stats.bitrate"), S.bitrate],
      [t("stats.loss"), S.loss],
      ...(extra ? [
        [t("stats.rtt"), S.rtt],
        [t("stats.codec"), S.codec],
        [t("stats.jitter"), S.jitter],
        [t("stats.audio"), S.audio],
      ] : []),
    ];
    return `<dl class="a-stats">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
  }

  function ticket(code, { replace } = {}) {
    return `<span class="a-ticket" role="group" aria-label="${esc(t("common.roomCode"))} ${esc(code)}">
      <span class="a-ticket-digits">${esc(code)}</span>
      ${replace ? `<button type="button" data-act="replace-room" title="${esc(t("host.roomReplaced"))}" aria-label="replace room code">${I("refresh", 15)}</button>` : ""}
      <button type="button" data-act="copy-room" title="${esc(t("common.copy"))}" aria-label="${esc(t("common.copy"))}">${I("copy", 15)}</button>
    </span>`;
  }

  function notice(text, tone) {
    return text ? `<div class="a-notice ${tone ? `is-${tone}` : ""}" role="status">${esc(text)}</div>` : "";
  }

  /* ================================================================
     HOST
     ================================================================ */
  if (page === "host") {
    const SCENES = ["idle", "starting", "live", "paused", "ended", "error"];
    const root = document.getElementById("host-root");
    const headerStatus = document.getElementById("header-status");
    const H = {
      scene: D.scene || "idle",
      name: D.hostName(),
      editingName: false,
      details: D.boolParam("details"),
      advanced: D.boolParam("advanced"),
      topology: D.boolParam("topology"),
      policy: D.param("policy", "open"),
      hasPassword: D.boolParam("password"),
      invite: true,
      noAudio: D.boolParam("noaudio"),
      notice: null,
      noticeTone: null,
      preset: "1080p30",
      timer: null,
    };

    const hasRoom = () => !["idle", "error"].includes(H.scene);
    const isLive = () => H.scene === "live" || H.scene === "paused";
    const viewerCount = () => (isLive() ? D.intParam("viewers", 4) : 0);

    function phaseMeta() {
      switch (H.scene) {
        case "starting": return t("host.starting") + "…";
        case "live": return `${viewerCount()} / 20 ${t("common.online")}`;
        case "paused": return t("host.paused");
        case "ended": return hasRoom() ? t("host.ended") : "";
        default: return hasRoom() ? t("host.roomReady") : "";
      }
    }

    function stageHtml() {
      if (["idle", "ended", "error"].includes(H.scene)) {
        return `<div class="a-entry a-fade">
          ${H.scene === "ended" ? `<span class="a-entry-status">${esc(t("host.ended"))}</span>` : ""}
          <h2>${esc(t("host.idle.heading"))}</h2>
          <p>${esc(t("host.idle.hint"))}</p>
          <div class="a-entry-actions">
            <button class="a-btn a-btn-primary" data-act="start">${I("share", 17)}${esc(t("host.start"))}</button>
            <button class="a-btn a-btn-secondary" data-act="toggle-join" aria-expanded="false">${I("hash", 17)}${esc(t("host.join"))}</button>
          </div>
          <div class="a-join-inline" id="join-inline" hidden>
            <input inputmode="numeric" maxlength="4" placeholder="7316" aria-label="${esc(t("join.field"))}">
            <button class="a-btn a-btn-primary" data-act="join-go">${esc(t("join.submit"))}</button>
          </div>
        </div>`;
      }
      if (H.scene === "starting") {
        return `<div class="a-stage-overlay is-dim a-fade" role="status">
          <span class="a-overlay-icon a-spin">${I("loader", 30)}</span>
          <span class="a-overlay-msg">${esc(t("host.starting"))}…</span>
          <span class="a-steps"><i class="is-done"></i><i class="is-now"></i><i></i></span>
        </div>`;
      }
      if (H.scene === "paused") {
        return `<div class="a-stage-overlay is-dim" role="status">
          <span class="a-overlay-icon">${I("pause", 30)}</span>
          <span class="a-overlay-msg">${esc(t("host.paused"))}</span>
        </div>`;
      }
      return "";
    }

    function actionsHtml() {
      if (!isLive() && H.scene !== "starting") return "";
      if (H.scene === "starting") {
        return `<div class="a-actions">
          <button class="a-btn a-btn-danger" data-act="cancel-start">${esc(t("host.cancelStart"))}</button>
        </div>`;
      }
      return `<div class="a-actions">
        <button class="a-btn a-btn-secondary" data-act="pause">${I(H.scene === "paused" ? "play" : "pause", 16)}${esc(t(H.scene === "paused" ? "host.resume" : "host.pause"))}</button>
        <button class="a-btn a-btn-secondary" data-act="switch">${I("refresh", 16)}${esc(t("host.switchSource"))}</button>
        <button class="a-btn a-btn-danger" data-act="stop">${I("stop", 15)}${esc(t("host.stop"))}</button>
      </div>`;
    }

    function qualityHtml() {
      const locked = H.scene === "starting";
      const presets = ["720p30", "1080p30", "1080p60"]
        .map((id) => `<button type="button" data-act="preset" data-v="${id}" class="${H.preset === id ? "is-selected" : ""}" aria-pressed="${H.preset === id}" ${locked ? "disabled" : ""}>${esc(t(`host.quality.${id}`))}</button>`)
        .join("");
      return `<div class="a-block">
        <span class="a-section-label">${esc(t("host.quality"))}</span>
        <div class="a-segmented" role="group">${presets}</div>
        <details class="a-details a-block" ${H.advanced ? "open" : ""} id="advanced-details">
          <summary>${esc(t("host.advanced"))} ${I("chevron", 15)}</summary>
          <div class="a-advanced-grid">
            <label class="a-field"><span>${esc(t("host.advanced.resolution"))}</span>
              <select ${locked ? "disabled" : ""}>
                ${["480p", "720p", "1080p", "1440p"].map((r) => `<option ${r === "1080p" ? "selected" : ""}>${r}</option>`).join("")}
              </select>
            </label>
            <label class="a-field"><span>${esc(t("host.advanced.framerate"))}</span>
              <span class="a-range"><input type="range" min="15" max="60" step="5" value="30" data-range="fps" ${locked ? "disabled" : ""}><output>30 fps</output></span>
            </label>
            <label class="a-field"><span>${esc(t("host.advanced.bitrate"))}</span>
              <span class="a-range"><input type="range" min="2" max="12" step="0.5" value="5" data-range="mbps" ${locked ? "disabled" : ""}><output>5.0 Mbps</output></span>
            </label>
            <fieldset class="a-field a-field-wide"><legend>${esc(t("host.advanced.preference"))}</legend>
              <div class="a-segmented is-tall" role="group">
                ${["resolution", "balanced", "framerate"].map((p) => `
                  <button type="button" class="${p === "balanced" ? "is-selected" : ""}" aria-pressed="${p === "balanced"}" ${locked ? "disabled" : ""}>
                    ${esc(t(`host.advanced.preference.${p}`))}<small>${esc(t(`host.advanced.preference.${p}Hint`))}</small>
                  </button>`).join("")}
              </div>
            </fieldset>
            <fieldset class="a-field a-field-wide"><legend>${esc(t("host.advanced.audio"))}</legend>
              <div class="a-segmented is-tall" role="group">
                ${[["saver", "64"], ["music", "128"], ["veryHigh", "192"]].map(([a, kbps]) => `
                  <button type="button" class="${a === "music" ? "is-selected" : ""}" aria-pressed="${a === "music"}" ${locked ? "disabled" : ""}>
                    ${esc(t(`host.advanced.audio.${a}`))}<small>${kbps} kbps</small>
                  </button>`).join("")}
              </div>
            </fieldset>
            <fieldset class="a-field a-field-wide"><legend>${esc(t("host.advanced.route"))}</legend>
              <div class="a-checks">
                <label><input type="checkbox" ${isLive() || locked ? "disabled" : ""}><span>${esc(t("host.advanced.route.topo"))}<small>${esc(t("host.advanced.route.topoHint"))}</small></span></label>
                <label><input type="checkbox" ${isLive() || locked ? "disabled" : ""}><span>${esc(t("host.advanced.route.peerOnly"))}<small>${esc(t("host.advanced.route.peerOnlyHint"))}</small></span></label>
              </div>
            </fieldset>
            <fieldset class="a-field a-field-wide"><legend>${esc(t("host.advanced.codec"))}</legend>
              <div class="a-segmented is-tall" role="group">
                ${[["vp8", t("host.advanced.codec.vp8Hint")], ["auto", t("host.advanced.codec.autoHint")], ["h264", t("host.advanced.codec.h264Hint")]].map(([c, hint]) => `
                  <button type="button" class="${c === "auto" ? "is-selected" : ""}" aria-pressed="${c === "auto"}" ${isLive() || locked ? "disabled" : ""}>
                    ${c === "auto" ? esc(t("host.advanced.codec.auto")) : c.toUpperCase()}<small>${esc(hint)}</small>
                  </button>`).join("")}
              </div>
            </fieldset>
          </div>
        </details>
      </div>`;
    }

    function inviteHtml() {
      if (!hasRoom()) return "";
      const url = `https://share.example/${D.roomCode()}#v=Kx9Qm4LwTz2Ab8Cd3EfGh1`;
      return `<div class="a-block">
        <span class="a-section-label">${esc(t("host.invite"))}</span>
        <div class="a-invite-url">
          <code class="${H.invite ? "" : "is-empty"}">${H.invite ? esc(url) : esc(t(H.policy === "open" ? "host.invite.emptyOpen" : H.hasPassword ? "host.invite.emptyPassword" : "host.invite.emptyPrivate"))}</code>
          <button class="a-btn a-btn-primary" data-act="copy-invite" ${H.invite ? "" : "disabled"}>${I("copy", 16)}${esc(t("host.invite.copy"))}</button>
          <button class="a-icon-btn" data-act="rotate-invite" title="${esc(t("host.invite.rotate"))}" aria-label="${esc(t("host.invite.rotate"))}">${I("refresh", 16)}</button>
          <button class="a-icon-btn" data-act="revoke-invite" title="${esc(t("host.invite.revoke"))}" aria-label="${esc(t("host.invite.revoke"))}" ${H.invite ? "" : "disabled"}>${I("linkOff", 16)}</button>
        </div>
        <div class="a-row" style="margin-top:16px">
          <span class="a-section-label" style="margin:0">${esc(t("host.policy"))}</span>
          <div class="a-segmented" role="group">
            <button type="button" data-act="policy" data-v="open" class="${H.policy === "open" ? "is-selected" : ""}" aria-pressed="${H.policy === "open"}">${esc(t("host.policy.open"))}</button>
            <button type="button" data-act="policy" data-v="private" class="${H.policy === "private" ? "is-selected" : ""}" aria-pressed="${H.policy === "private"}">${esc(t("host.policy.private"))}</button>
          </div>
          <span class="a-hint">${esc(t(H.policy === "open" ? "host.policy.openHint" : "host.policy.privateHint"))}</span>
        </div>
        ${H.policy === "private" ? `
        <div class="a-row">
          <form class="a-password" data-form="password">
            <span class="a-input-wrap">
              ${I("key", 16)}
              <input type="password" placeholder="${esc(t("host.password.placeholder"))}" aria-label="${esc(t("join.password"))}" value="${H.hasPassword ? "momo42" : ""}">
              <button type="button" data-act="peek" title="${esc(t("host.password.show"))}" aria-label="${esc(t("host.password.show"))}">${I("eye", 16)}</button>
            </span>
            <button class="a-icon-btn" type="submit" title="${esc(t(H.hasPassword ? "host.password.changeAction" : "host.password.setAction"))}" aria-label="${esc(t(H.hasPassword ? "host.password.changeAction" : "host.password.setAction"))}">${I("check", 16)}</button>
            ${H.hasPassword ? `<button class="a-icon-btn" type="button" data-act="remove-password" title="${esc(t("host.password.remove"))}" aria-label="${esc(t("host.password.remove"))}">${I("x", 16)}</button>` : ""}
          </form>
        </div>
        <div class="a-row"><span class="a-hint">${esc(t(H.hasPassword ? "host.password.set" : "host.password.unset"))}</span></div>` : ""}
      </div>`;
    }

    function rosterHtml() {
      const viewers = D.roster(viewerCount());
      const items = viewers.map((v) => {
        const state = v.state === "connected" ? "connected" : v.state === "connecting" ? "connecting" : "routing";
        return `<div class="a-viewer">
          <div class="a-viewer-head">
            <div class="a-viewer-name"><span>${esc(v.name)}</span></div>
            ${badge(state)}
          </div>
          ${H.details && state === "connected" ? `${routeBadge(v.route)}${statsGrid(false)}` : ""}
        </div>`;
      }).join("");
      return `<div class="a-rail-head">
          <h2>${esc(t("common.viewers"))}</h2>
          <span class="a-meta">${esc(t("common.online"))} ${viewers.length} / 20</span>
        </div>
        <button class="a-btn a-btn-ghost" data-act="topology" aria-expanded="${H.topology}">
          ${I("network", 16)}${esc(t(H.topology ? "host.topology.hide" : "host.topology.show"))}
        </button>
        ${H.topology ? topologyHtml(viewers) : ""}
        ${viewers.length === 0
          ? `<div class="a-empty">${I("users", 22)}<span>${esc(t(H.scene === "live" ? "host.viewers.waiting" : "host.viewers.empty"))}</span></div>`
          : items}`;
    }

    function topologyHtml(viewers) {
      const connected = viewers.filter((v) => v.state === "connected");
      const pending = viewers.filter((v) => v.state !== "connected");
      const direct = connected.filter((v) => v.route === "p2p");
      const sfu = connected.filter((v) => v.route === "sfu");
      const li = (v, edge) => `<li><span class="a-topo-node"><span class="a-topo-tag">${edge}</span><strong>${esc(v.name)}</strong></span>${v.children.length ? `<ul>${v.children.map((c) => `<li><span class="a-topo-node"><span class="a-topo-tag">P2P</span><strong>${esc(c)}</strong></span></li>`).join("")}</ul>` : ""}</li>`;
      return `<div class="a-topology" id="room-topology">
        <ul style="border:0;padding:0;margin:0"><li><span class="a-topo-node"><span class="a-topo-tag">${esc(t("common.host"))}</span><strong>${esc(H.name)}</strong></span>
          <ul>
            ${direct.map((v) => li(v, "P2P")).join("")}
            ${sfu.length ? `<li><span class="a-topo-node"><span class="a-topo-tag">SFU</span><strong>${esc(t("host.sfu"))}</strong></span><ul>${sfu.map((v) => li(v, "SFU")).join("")}</ul></li>` : ""}
          </ul>
        </li></ul>
        ${pending.length ? `<div class="a-topo-pending">${esc(t("host.topology.pending"))}：${pending.map((v) => esc(v.name)).join("、")}</div>` : ""}
      </div>`;
    }

    function render() {
      headerStatus.innerHTML = H.details && isLive() ? badge("signal") : "";
      const phase = phaseMeta();
      root.innerHTML = `
      <div class="a-host-grid">
        <div>
          <div class="a-title-row">
            <div class="a-title-line">
              <h1>${esc(t("host.title", { name: H.name }))}</h1>
              ${hasRoom() ? ticket(D.roomCode(), { replace: true }) : ""}
            </div>
            ${actionsHtml()}
          </div>
          <p class="a-meta">${esc(phase)}</p>
          <div class="a-name" style="margin-top:10px">
            ${H.editingName ? `
              <input id="name-input" value="${esc(H.name)}" maxlength="48" aria-label="${esc(t("host.name"))}">
              <button class="a-icon-btn" data-act="name-save" title="${esc(t("host.nameSave"))}" aria-label="${esc(t("host.nameSave"))}">${I("check", 15)}</button>
              <button class="a-icon-btn" data-act="name-cancel" title="${esc(t("host.nameCancel"))}" aria-label="${esc(t("host.nameCancel"))}">${I("x", 15)}</button>
            ` : `
              <span>${esc(t("host.name"))}</span><strong>${esc(H.name)}</strong>
              <button class="a-icon-btn" data-act="name-edit" title="${esc(t("host.nameEdit"))}" aria-label="${esc(t("host.nameEdit"))}">${I("pencil", 14)}</button>
            `}
          </div>
          <div class="a-stage" role="group" aria-label="${esc(t("host.titleFallback"))}">
            ${isLive() ? `<div data-feed ${H.scene === "paused" ? 'data-state="frozen"' : ""}></div>` : ""}
            ${stageHtml()}
          </div>
          ${H.details && isLive() ? `<div class="a-capture"><span>1920×1080</span><span>60 fps</span><span>H264</span><span>${H.noAudio ? "—" : "Opus 128 kbps"}</span></div>` : ""}
          ${H.noAudio && isLive() ? notice(t("host.noAudio"), "warn") : ""}
          ${notice(H.notice, H.noticeTone)}
          <div style="margin-top:14px">
            <button class="a-btn a-btn-ghost" data-act="details" aria-expanded="${H.details}">
              ${I("signal", 16)}${esc(t(H.details ? "host.details.hide" : "host.details"))}
            </button>
          </div>
          ${qualityHtml()}
          ${inviteHtml()}
        </div>
        <aside class="a-rail" aria-label="${esc(t("common.viewers"))}">
          ${rosterHtml()}
        </aside>
      </div>`;
      const feedHolder = root.querySelector("[data-feed]");
      if (feedHolder) {
        window.ScreenerFeed.mount(feedHolder, feedHolder.dataset.state === "frozen" ? "frozen" : "live");
      }
      if (H.scene === "starting") {
        H.timer = window.setTimeout(() => setScene("live", t("host.resumeNotice")), 2600);
      }
    }

    function setScene(scene, note) {
      window.clearTimeout(H.timer);
      H.scene = scene;
      H.notice = note ?? null;
      H.noticeTone = null;
      if (scene === "idle" || scene === "error") { H.editingName = false; }
      render();
    }

    root.addEventListener("click", async (event) => {
      const target = event.target.closest("[data-act]");
      if (!target) return;
      const act = target.dataset.act;
      if (act === "start") { setScene("starting"); }
      if (act === "cancel-start") { setScene("idle"); }
      if (act === "pause") {
        setScene(H.scene === "paused" ? "live" : "paused",
          t(H.scene === "paused" ? "host.resumeNotice" : "host.pauseNotice"));
      }
      if (act === "switch") { H.notice = t("host.switching") + "…"; render(); window.setTimeout(() => { H.notice = null; render(); }, 1400); }
      if (act === "stop") { setScene("ended", t("host.stopNotice")); }
      if (act === "toggle-join") {
        const box = root.querySelector("#join-inline");
        box.hidden = !box.hidden;
        target.setAttribute("aria-expanded", String(!box.hidden));
        if (!box.hidden) box.querySelector("input").focus();
      }
      if (act === "join-go") {
        const code = root.querySelector("#join-inline input").value.trim();
        window.location.assign(`viewer.html?scene=playing&lang=${D.lang}&room=${encodeURIComponent(code || "2481")}`);
      }
      if (act === "copy-room") { if (await copyText(D.roomCode())) flashCopied(target); }
      if (act === "copy-invite") { if (await copyText(`https://share.example/${D.roomCode()}#v=Kx9Qm4LwTz2Ab8Cd3EfGh1`)) flashCopied(target); }
      if (act === "replace-room") { H.notice = t("host.roomReplaced"); render(); }
      if (act === "rotate-invite") { H.invite = true; H.notice = t("host.invite.updated"); render(); }
      if (act === "revoke-invite") { H.invite = false; H.notice = t("host.invite.revoked"); render(); }
      if (act === "policy") { H.policy = target.dataset.v; H.notice = null; render(); }
      if (act === "peek") {
        const input = target.parentElement.querySelector("input");
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        target.innerHTML = I(show ? "eyeOff" : "eye", 16);
        target.setAttribute("aria-label", t(show ? "host.password.hide" : "host.password.show"));
      }
      if (act === "remove-password") { H.hasPassword = false; H.notice = t("host.password.removed"); render(); }
      if (act === "details") { H.details = !H.details; render(); }
      if (act === "topology") { H.topology = !H.topology; render(); }
      if (act === "preset") { H.preset = target.dataset.v; render(); }
      if (act === "name-edit") { H.editingName = true; render(); root.querySelector("#name-input").focus(); }
      if (act === "name-cancel") { H.editingName = false; render(); }
      if (act === "name-save") {
        const value = root.querySelector("#name-input").value.trim();
        if (value && [...value].length <= 24) { H.name = value; H.editingName = false; }
        render();
      }
      const advanced = target.closest("#advanced-details");
      if (advanced) H.advanced = advanced.open;
    });

    root.addEventListener("submit", (event) => {
      if (event.target.matches('[data-form="password"]')) {
        event.preventDefault();
        H.hasPassword = true;
        H.notice = t("host.password.saved");
        render();
      }
    });

    root.addEventListener("input", (event) => {
      const range = event.target.closest("[data-range]");
      if (range) {
        const output = range.parentElement.querySelector("output");
        output.textContent = range.dataset.range === "fps"
          ? `${range.value} fps`
          : `${Number(range.value).toFixed(1)} Mbps`;
      }
    });

    root.addEventListener("toggle", (event) => {
      if (event.target.id === "advanced-details") H.advanced = event.target.open;
    }, true);

    D.mountSceneBar("host", SCENES, H.scene, (scene) => setScene(scene));
    render();
  }

  /* ================================================================
     VIEWER
     ================================================================ */
  if (page === "viewer") {
    const SCENES = ["playing", "joining", "waiting", "connecting", "needsplay", "paused", "recovering", "failed", "hostoffline", "denied", "notfound", "full"];
    const root = document.getElementById("viewer-root");
    const headerStatus = document.getElementById("header-status");
    const V = {
      scene: D.scene || "playing",
      route: D.param("route", "p2p"),
      name: D.lang === "en" ? "You" : "你",
      editingName: false,
      details: D.boolParam("details"),
      topology: D.boolParam("topology"),
      timer: null,
    };
    const inRoom = () => !["denied", "notfound", "full"].includes(V.scene);
    const hasFeed = () => ["playing", "needsplay", "paused", "recovering", "failed", "hostoffline"].includes(V.scene);
    const frozen = () => ["needsplay", "paused", "failed", "hostoffline"].includes(V.scene);
    const viewerCount = () => D.intParam("viewers", 4);

    function stageOverlay() {
      const map = {
        waiting: { icon: "moon", msg: t("viewer.msg.waitingHost"), dim: false, spin: false },
        connecting: { icon: "loader", msg: t(V.route === "sfu" ? "viewer.msg.preparingSfu" : "viewer.msg.preparingP2p"), dim: false, spin: true },
        paused: { icon: "pause", msg: t("viewer.msg.hostPaused"), dim: true, spin: false },
        recovering: { icon: "loader", msg: t("viewer.msg.recovering"), dim: true, spin: true },
        failed: { icon: "alert", msg: t("viewer.msg.routeFailed"), dim: true, spin: false },
        hostoffline: { icon: "wifiOff", msg: t("viewer.msg.hostOffline"), dim: true, spin: false },
      };
      const o = map[V.scene];
      if (!o) return "";
      return `<div class="a-stage-overlay ${o.dim ? "is-dim" : ""} a-fade" role="status">
        <span class="a-overlay-icon ${o.spin ? "a-spin" : ""}">${I(o.icon, 30)}</span>
        <span class="a-overlay-msg">${esc(o.msg)}</span>
      </div>`;
    }

    function statusMessage() {
      const map = {
        playing: t("viewer.msg.playing"),
        needsplay: t("viewer.msg.needsPlay"),
        waiting: t("viewer.msg.waitingHost"),
        connecting: t(V.route === "sfu" ? "viewer.msg.preparingSfu" : "viewer.msg.preparingP2p"),
        paused: t("viewer.msg.hostPaused"),
        recovering: t("viewer.msg.recovering"),
        failed: t("viewer.msg.routeFailed"),
        hostoffline: t("viewer.msg.hostOffline"),
      };
      return map[V.scene] ?? "";
    }

    function viewerNotice() {
      if (V.scene === "recovering") return notice(t("viewer.notice.mediaRecovering"), "warn");
      if (V.scene === "hostoffline") return notice(t("viewer.notice.hostOffline"), "warn");
      return "";
    }

    function accessPanel() {
      const map = {
        denied: { msg: t("viewer.msg.denied"), hint: t("viewer.hint.denied"), password: true },
        notfound: { msg: t("viewer.msg.notFound"), hint: t("viewer.hint.notFound"), password: false },
        full: { msg: t("viewer.msg.full"), hint: t("join.fullHint"), password: false },
      };
      const p = map[V.scene];
      return `<div class="a-center"><div class="a-panel a-fade">
        <div>
          <h1>${esc(p.msg)}</h1>
          <p class="a-hint" style="margin-top:8px">${esc(p.hint)}</p>
        </div>
        ${p.password ? `
        <button class="a-btn a-btn-secondary" data-act="password-open">${I("key", 16)}${esc(t("join.passwordAction"))}</button>
        <form class="a-panel" data-form="viewer-password" id="viewer-password" hidden>
          <span class="a-input-wrap">
            ${I("key", 16)}
            <input type="password" aria-label="${esc(t("join.password"))}" autocomplete="current-password">
          </span>
          <p class="a-error" id="viewer-password-error" hidden>${esc(t("join.passwordError"))}</p>
          <button class="a-btn a-btn-primary" type="submit">${esc(t("join.submit"))}</button>
        </form>` : `
        <button class="a-btn a-btn-secondary" data-act="back-join">${I("arrowRight", 16)}${esc(t("common.retry"))}</button>`}
      </div></div>`;
    }

    function roomView() {
      const viewers = D.roster(viewerCount());
      const routeState = V.scene === "playing" ? "connected" : V.scene === "recovering" ? "reconnecting" : V.scene === "failed" ? "failed" : V.scene === "waiting" ? "waiting" : "connecting";
      return `
      <div class="a-title-row">
        <div class="a-title-line">
          <h1>${esc(t("viewer.title", { name: D.hostName() }))}</h1>
          ${ticket(D.roomCode())}
        </div>
        <div class="a-row" style="margin:0">
          ${badge(routeState)}
          ${V.details && ["playing", "recovering"].includes(V.scene) ? routeBadge(V.route) : ""}
        </div>
      </div>
      <div class="a-name" style="margin:8px 0 4px">
        ${V.editingName ? `
          <input id="name-input" value="${esc(V.name)}" maxlength="48" aria-label="${esc(t("host.name"))}">
          <button class="a-icon-btn" data-act="name-save" title="${esc(t("host.nameSave"))}" aria-label="${esc(t("host.nameSave"))}">${I("check", 15)}</button>
          <button class="a-icon-btn" data-act="name-cancel" title="${esc(t("host.nameCancel"))}" aria-label="${esc(t("host.nameCancel"))}">${I("x", 15)}</button>
        ` : `
          <span>${esc(t("host.name"))}</span><strong>${esc(V.name)}</strong>
          <button class="a-icon-btn" data-act="name-edit" title="${esc(t("host.nameEdit"))}" aria-label="${esc(t("host.nameEdit"))}">${I("pencil", 14)}</button>
        `}
      </div>
      <div class="a-stage" role="group" aria-label="${esc(t("viewer.titleFallback"))}">
        ${hasFeed() ? `<div data-feed ${frozen() ? 'data-state="frozen"' : ""}></div>` : ""}
        ${stageOverlay()}
        ${V.scene === "needsplay" ? `
          <button class="a-stage-overlay is-dim a-fade" data-act="play" style="width:100%;border:0;cursor:pointer" aria-label="${esc(t("viewer.play"))}">
            <span class="a-overlay-icon">${I("play", 34)}</span>
            <span class="a-overlay-msg">${esc(t("viewer.msg.needsPlay"))}</span>
          </button>` : ""}
      </div>
      <div class="a-status-row">
        <span class="a-status-msg" role="status" aria-live="polite">${esc(statusMessage())}</span>
        <span class="a-row" style="margin:0">
          <button class="a-icon-btn" data-act="topology" title="${esc(t(V.topology ? "host.topology.hide" : "host.topology.show"))}" aria-label="${esc(t(V.topology ? "host.topology.hide" : "host.topology.show"))}" aria-expanded="${V.topology}">${I("network", 17)}</button>
          <button class="a-icon-btn" data-act="reconnect" title="${esc(t("viewer.reconnect"))}" aria-label="${esc(t("viewer.reconnect"))}" ${["playing", "recovering", "failed", "hostoffline", "paused"].includes(V.scene) ? "" : "disabled"}>${I("refresh", 17)}</button>
        </span>
      </div>
      ${viewerNotice()}
      <div class="a-block">
        <div class="a-rail-head">
          <h2>${esc(t("common.viewers"))}</h2>
          <span class="a-meta">${esc(t("common.online"))} ${viewers.length + 1}</span>
        </div>
        ${V.topology ? viewerTopology(viewers) : ""}
        <ul class="a-viewer-roster">
          <li><i class="a-dot"></i>${esc(V.name)}${V.name === t("common.you") ? "" : ` · ${esc(t("common.you"))}`}</li>
          ${viewers.map((v) => `<li><i class="a-dot" style="${v.state === "connected" ? "" : "background:var(--warn)"}"></i>${esc(v.name)}</li>`).join("")}
        </ul>
      </div>
      <div style="margin-top:14px">
        <button class="a-btn a-btn-ghost" data-act="details" aria-expanded="${V.details}">
          ${I("signal", 16)}${esc(t(V.details ? "host.details.hide" : "host.details"))}
        </button>
      </div>
      ${V.details ? `
      <div class="a-block">
        <span class="a-section-label">${esc(t("stats.title"))}</span>
        ${routeBadge(V.route)}
        <div style="height:10px"></div>
        ${statsGrid(true)}
      </div>
      <div class="a-block">
        <span class="a-section-label">${esc(t("stats.relay"))}</span>
        ${statsGrid(false)}
      </div>` : ""}`;
    }

    function viewerTopology(viewers) {
      const connected = viewers.filter((v) => v.state === "connected");
      const direct = connected.filter((v) => v.route === "p2p");
      const sfu = connected.filter((v) => v.route === "sfu");
      return `<div class="a-topology" id="room-topology">
        <ul style="border:0;padding:0;margin:0"><li><span class="a-topo-node"><span class="a-topo-tag">${esc(t("common.host"))}</span><strong>${esc(D.hostName())}</strong></span>
          <ul>
            ${direct.map((v) => `<li><span class="a-topo-node"><span class="a-topo-tag">P2P</span><strong>${esc(v.name)}</strong></span></li>`).join("")}
            ${sfu.length ? `<li><span class="a-topo-node"><span class="a-topo-tag">SFU</span><strong>${esc(t("host.sfu"))}</strong></span><ul>${sfu.map((v) => `<li><span class="a-topo-node"><span class="a-topo-tag">SFU</span><strong>${esc(v.name)}</strong></span></li>`).join("")}</ul></li>` : ""}
            <li><span class="a-topo-node"><span class="a-topo-tag">${V.route === "sfu" ? "SFU" : "P2P"}</span><strong>${esc(V.name)} (${esc(t("common.you"))})</strong></span></li>
          </ul>
        </li></ul>
      </div>`;
    }

    function render() {
      headerStatus.innerHTML = V.details && inRoom() ? badge("signal") : "";
      if (!inRoom()) {
        root.innerHTML = accessPanel();
        return;
      }
      if (V.scene === "joining") {
        root.innerHTML = `<div class="a-center"><span class="a-loading" role="status"><span class="a-spin">${I("loader", 20)}</span>${esc(t("viewer.msg.joining"))}…</span></div>`;
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
      if (act === "copy-room") { if (await copyText(D.roomCode())) flashCopied(target); }
      if (act === "password-open") {
        const form = root.querySelector("#viewer-password");
        form.hidden = false;
        target.hidden = true;
        form.querySelector("input").focus();
      }
      if (act === "back-join") { window.location.assign(`join.html?lang=${D.lang}`); }
      if (act === "name-edit") { V.editingName = true; render(); root.querySelector("#name-input").focus(); }
      if (act === "name-cancel") { V.editingName = false; render(); }
      if (act === "name-save") {
        const value = root.querySelector("#name-input").value.trim();
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
    const header = document.getElementById("a-header");
    const J = { scene: D.scene || "form" };

    function render() {
      header.hidden = J.scene === "gate";
      if (J.scene === "gate") {
        root.innerHTML = `<div class="a-center" style="min-height:80dvh">
          <form class="a-panel a-fade" data-form="gate">
            <div>
              <h1>${esc(t("gate.title"))}</h1>
              <p class="a-hint" style="margin-top:8px">${esc(t("gate.hint"))}</p>
            </div>
            <span class="a-input-wrap">
              ${I("key", 16)}
              <input type="password" aria-label="${esc(t("gate.password"))}" autocomplete="current-password" autofocus>
            </span>
            <button class="a-btn a-btn-primary" type="submit">${esc(t("gate.submit"))}</button>
          </form>
        </div>`;
        return;
      }
      if (J.scene === "joining") {
        root.innerHTML = `<div class="a-center"><span class="a-loading" role="status"><span class="a-spin">${I("loader", 20)}</span>${esc(t("join.joining"))}…</span></div>`;
        window.setTimeout(() => {
          window.location.assign(`viewer.html?scene=playing&lang=${D.lang}&room=${encodeURIComponent(J.code ?? "7316")}`);
        }, 1600);
        return;
      }
      if (["denied", "notfound", "full"].includes(J.scene)) {
        const map = {
          denied: { msg: t("join.denied"), hint: t("join.deniedHint"), password: true },
          notfound: { msg: t("join.notFound"), hint: t("join.notFoundHint"), password: false },
          full: { msg: t("join.full"), hint: t("join.fullHint"), password: false },
        };
        const p = map[J.scene];
        root.innerHTML = `<div class="a-center"><div class="a-panel a-fade">
          <div>
            <h1>${esc(p.msg)}</h1>
            <p class="a-hint" style="margin-top:8px">${esc(p.hint)}</p>
          </div>
          ${p.password ? `
          <form class="a-panel" data-form="room-password">
            <span class="a-input-wrap">
              ${I("key", 16)}
              <input type="password" aria-label="${esc(t("join.password"))}" placeholder="${esc(t("join.password"))}" autocomplete="current-password">
            </span>
            <button class="a-btn a-btn-primary" type="submit">${esc(t("join.submit"))}</button>
          </form>` : `
          <button class="a-btn a-btn-secondary" data-act="again">${I("arrowRight", 16)}${esc(t("common.retry"))}</button>`}
        </div></div>`;
        return;
      }
      root.innerHTML = `<div class="a-center">
        <form class="a-panel a-fade" data-form="code" novalidate>
          <div>
            <h1>${esc(t("join.title"))}</h1>
            <p class="a-hint" style="margin-top:8px">${esc(t("join.hint"))}</p>
          </div>
          <label class="visually-hidden" for="room-code">${esc(t("join.field"))}</label>
          <input id="room-code" class="a-code-input" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="1234" value="${J.scene === "invalid" ? "12ab" : ""}">
          ${J.scene === "invalid" ? `<p class="a-error" role="alert">${esc(t("join.invalid"))}</p>` : ""}
          <button class="a-btn a-btn-primary" type="submit">${esc(t("join.submit"))}</button>
        </form>
      </div>`;
      if (J.scene === "form") {
        const input = root.querySelector("#room-code");
        input.focus();
      }
    }

    function setScene(scene) {
      J.scene = scene;
      render();
    }

    root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-act]");
      if (target?.dataset.act === "again") setScene("form");
    });

    root.addEventListener("submit", (event) => {
      event.preventDefault();
      if (event.target.matches('[data-form="code"]')) {
        const code = root.querySelector("#room-code").value.trim();
        if (/^[1-9][0-9]{3}$/.test(code)) {
          J.code = code;
          setScene("joining");
        } else {
          setScene("invalid");
        }
      }
      if (event.target.matches('[data-form="room-password"], [data-form="gate"]')) {
        setScene("joining");
      }
    });

    D.mountSceneBar("join", SCENES, J.scene, (scene) => setScene(scene));
    render();
  }
})();
