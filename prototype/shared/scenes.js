// Shared scenario engine for the prototypes. Parses URL params, provides
// fake roster/stats data, resolves copy, and mounts the scene switcher bar.
(function () {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get("lang") === "en" ? "en" : "zh";
  const copy = window.SCREENER_COPY[lang];

  function t(key, vars) {
    let value = copy[key] ?? key;
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
    return param("host", lang === "en" ? "A-Zhou" : "阿舟");
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
    label.textContent = lang === "en" ? "scenes" : "原型场景";
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
    langButton.textContent = lang === "en" ? "中文" : "EN";
    langButton.addEventListener("click", () => {
      const next = new URL(window.location.href);
      next.searchParams.set("lang", lang === "en" ? "zh" : "en");
      window.location.assign(next);
    });
    bar.append(langButton);
    const home = document.createElement("a");
    home.href = `../../index.html?lang=${lang}`;
    home.textContent = "↩";
    home.title = "Prototype index";
    bar.append(home);
    document.body.append(bar);
  }

  window.ScreenerDemo = {
    lang,
    t,
    param,
    boolParam,
    intParam,
    roster,
    STATS,
    roomCode,
    hostName,
    mountSceneBar,
    scene: param("scene", ""),
  };
})();
