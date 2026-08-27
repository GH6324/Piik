// Shared scenario engine for the prototypes. Parses URL params, provides
// fake roster/stats data, resolves copy, and mounts the scene switcher bar.
(function () {
  const params = new URLSearchParams(window.location.search);
  const state = {
    lang: params.get("lang") === "en" ? "en" : "zh",
    vis: params.get("mode") ? params.get("mode") === "vis" : true,
    theme: null,
  };

  function t(key, vars) {
    let value = window.SCREENER_COPY[state.lang][key] ?? key;
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = value.replace(`{${name}}`, replacement);
      }
    }
    return value;
  }

  function param(name, fallback) {
    const value = params.get(name);
    return value === null || value === "" ? fallback : value;
  }

  function boolParam(name) {
    const value = params.get(name);
    return value === "1" || value === "true" || value === "yes";
  }

  function intParam(name, fallback) {
    const value = Number.parseInt(params.get(name) ?? "", 10);
    return Number.isFinite(value) ? value : fallback;
  }

  function setLangMode(lang, vis) {
    state.lang = lang;
    state.vis = vis;
    const next = new URL(window.location.href);
    next.searchParams.set("lang", lang);
    next.searchParams.set("mode", vis ? "vis" : "text");
    window.history.replaceState(null, "", next);
  }

  function resolveTheme() {
    const fromUrl = params.get("theme");
    if (fromUrl === "dark" || fromUrl === "light") return fromUrl;
    try {
      const stored = window.localStorage.getItem("screener-proto-theme");
      if (stored === "dark" || stored === "light") return stored;
    } catch { /* private mode */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("screener-proto-theme", theme);
    } catch { /* private mode */ }
    const next = new URL(window.location.href);
    next.searchParams.set("theme", theme);
    window.history.replaceState(null, "", next);
  }

  applyTheme(resolveTheme());

  const NAMES = ["阿茶", "老白", "蘑菇", "Kite", "夜风", "麦子", "豆腐", "Rex"];

  const ROUTES = ["p2p", "p2p", "sfu", "p2p", "sfu", "p2p", "p2p", "sfu"];
  const PEER_STATES = [
    "connected",
    "connected",
    "connected",
    "connecting",
    "connected",
    "routing",
    "connected",
    "connected",
  ];

  function roster(count) {
    return NAMES.slice(0, Math.max(0, Math.min(count, NAMES.length))).map(
      (name, index) => ({
        name,
        route: ROUTES[index % ROUTES.length],
        state: PEER_STATES[index % PEER_STATES.length],
        hue: index,
        children: index === 0 && count > 3 ? [NAMES[3]] : [],
      }),
    );
  }

  const STATS = {
    resolution: "1920×1080",
    fps: "60",
    bitrate: "6.4 Mbps",
    loss: "0.4%",
    rtt: "23 ms",
    codec: "H264",
    jitter: "2.1 ms",
    dropped: "0",
    encoder: "H264HW · 节能",
    audio: "128 kbps",
  };

  function roomCode() {
    return param("room", "7316");
  }

  function hostName() {
    return param("host", state.lang === "en" ? "A-Zhou" : "阿舟");
  }

  // Scene switcher bar: prototype chrome, hidden with ?chrome=0.
  function mountSceneBar(page, scenes, current, onSwitch) {
    if (params.get("chrome") === "0") {
      document.body.classList.add("no-chrome");
      return;
    }
    const bar = document.createElement("nav");
    bar.className = "scene-bar";
    bar.setAttribute("aria-label", "Prototype scenes");
    const label = document.createElement("span");
    label.className = "scene-bar-label";
    label.textContent = state.lang === "en" ? "scenes" : "原型场景";
    bar.append(label);
    for (const scene of scenes) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = scene;
      button.className = scene === current ? "is-active" : "";
      button.addEventListener("click", () => {
        const next = new URL(window.location.href);
        next.searchParams.set("scene", scene);
        window.history.replaceState(null, "", next);
        for (const other of bar.querySelectorAll("button")) {
          other.classList.toggle("is-active", other === button);
        }
        onSwitch(scene);
      });
      bar.append(button);
    }
    const langButton = document.createElement("button");
    langButton.type = "button";
    langButton.className = "scene-bar-lang";
    const modeLabel = () =>
      state.vis ? "视觉" : state.lang === "en" ? "EN" : "中";
    langButton.textContent = modeLabel();
    langButton.title = "language / mode";
    langButton.addEventListener("click", () => {
      if (!state.vis && state.lang === "zh") setLangMode("en", false);
      else if (!state.vis && state.lang === "en") setLangMode("zh", true);
      else setLangMode("zh", false);
      window.location.reload();
    });
    bar.append(langButton);
    const home = document.createElement("a");
    home.href = `../../index.html?lang=${state.lang}`;
    home.textContent = "↩";
    home.title = "Prototype index";
    bar.append(home);
    document.body.append(bar);
  }

  window.ScreenerDemo = {
    get lang() { return state.lang; },
    get vis() { return state.vis; },
    get theme() { return state.theme; },
    t,
    param,
    boolParam,
    intParam,
    roster,
    STATS,
    roomCode,
    hostName,
    mountSceneBar,
    setLangMode,
    setTheme: applyTheme,
    scene: param("scene", ""),
  };
})();
