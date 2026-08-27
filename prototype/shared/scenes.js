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

  const NAMES = [
    "阿茶", "老白", "蘑菇", "Kite", "夜风", "麦子", "豆腐", "Rex",
    "小七", "洛洛", "阿岚", "Momo", "青山", "柚子", "Bolt", "阿灿",
    "天天", "Nora", "小雨", "CC", "南风", "阿栋", "米粒", "Zed",
  ];

  // route: p2p | sfu; via: relay parent name (null = fed by host/sfu directly)
  const TOPO = [
    { route: "p2p", via: null, state: "connected" },
    { route: "p2p", via: null, state: "connected" },
    { route: "p2p", via: "阿茶", state: "connected" },
    { route: "sfu", via: null, state: "connecting" },
    { route: "sfu", via: null, state: "connected" },
    { route: "p2p", via: "老白", state: "connected" },
    { route: "p2p", via: null, state: "routing" },
    { route: "sfu", via: null, state: "connected" },
    { route: "p2p", via: "阿茶", state: "connected" },
    { route: "p2p", via: null, state: "connected" },
    { route: "sfu", via: null, state: "connected" },
    { route: "p2p", via: "蘑菇", state: "connected" },
    { route: "p2p", via: null, state: "connected" },
    { route: "sfu", via: null, state: "connected" },
    { route: "p2p", via: "老白", state: "connecting" },
    { route: "p2p", via: null, state: "connected" },
    { route: "sfu", via: null, state: "connected" },
    { route: "p2p", via: null, state: "connected" },
    { route: "p2p", via: "夜风", state: "connected" },
    { route: "sfu", via: null, state: "connected" },
    { route: "p2p", via: null, state: "connected" },
    { route: "p2p", via: "阿茶", state: "connected" },
    { route: "sfu", via: null, state: "connected" },
    { route: "p2p", via: null, state: "connected" },
  ];

  function roster(count) {
    return NAMES.slice(0, Math.max(0, Math.min(count, NAMES.length))).map(
      (name, index) => ({
        name,
        route: TOPO[index].route,
        via: TOPO[index].via,
        state: TOPO[index].state,
        hue: index,
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
    const phone = document.createElement("a");
    const pagePath = window.location.pathname.split("/").slice(-2).join("/");
    phone.href = `../frame.html?src=${encodeURIComponent(pagePath + window.location.search)}`;
    phone.target = "_blank";
    phone.textContent = "📱";
    phone.title = "Open in phone frame";
    bar.append(phone);
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
