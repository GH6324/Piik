// Fake "game feed" shown inside prototype stages so live/paused states read
// honestly without a real capture. Flat inline SVG, CSS-animated, frozen
// under prefers-reduced-motion or data-feed="frozen".
(function () {
  const STYLE = `
.screener-feed{position:absolute;inset:0;overflow:hidden;background:#0d1320}
.screener-feed svg{position:absolute;inset:0;width:100%;height:100%}
.sf-hero{animation:sf-hop 1.7s cubic-bezier(.3,.7,.4,1) infinite}
@keyframes sf-hop{0%,58%,100%{transform:translateY(0)}70%{transform:translateY(-52px)}82%{transform:translateY(0)}88%{transform:translateY(-6px)}94%{transform:translateY(0)}}
.sf-obs-a{animation:sf-slide 3.4s linear infinite}
.sf-obs-b{animation:sf-slide 5.1s linear infinite;animation-delay:-2.2s}
@keyframes sf-slide{from{transform:translateX(0)}to{transform:translateX(-760px)}}
.screener-feed[data-feed="frozen"] .sf-hero,
.screener-feed[data-feed="frozen"] .sf-obs-a,
.screener-feed[data-feed="frozen"] .sf-obs-b{animation-play-state:paused}
@media (prefers-reduced-motion: reduce){
  .sf-hero,.sf-obs-a,.sf-obs-b{animation:none}
}`;

  const SVG = `
<svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <rect width="640" height="360" fill="#0d1320"/>
  <circle cx="70" cy="52" r="2" fill="#33415c"/>
  <circle cx="180" cy="34" r="1.6" fill="#33415c"/>
  <circle cx="300" cy="66" r="2.2" fill="#33415c"/>
  <circle cx="430" cy="40" r="1.8" fill="#33415c"/>
  <circle cx="540" cy="70" r="2" fill="#33415c"/>
  <circle cx="600" cy="30" r="1.5" fill="#33415c"/>
  <circle cx="505" cy="96" r="16" fill="#f2e9c9" opacity=".9"/>
  <circle cx="497" cy="90" r="14" fill="#0d1320"/>
  <path d="M0 258 Q130 196 260 250 T520 246 T760 258 V360 H0 Z" fill="#141e30"/>
  <path d="M0 316 Q180 276 360 312 T760 312 V360 H0 Z" fill="#1a2740"/>
  <g class="sf-obs sf-obs-a">
    <path d="M676 316 L688 288 L700 316 Z" fill="#e0533a"/>
    <path d="M706 316 L716 292 L726 316 Z" fill="#c94a30"/>
  </g>
  <g class="sf-obs sf-obs-b">
    <path d="M700 316 L712 286 L724 316 Z" fill="#e0533a"/>
  </g>
  <g class="sf-hero">
    <rect x="118" y="284" width="36" height="32" rx="11" fill="#4cc38a"/>
    <rect x="126" y="312" width="8" height="6" rx="3" fill="#37996b"/>
    <rect x="140" y="312" width="8" height="6" rx="3" fill="#37996b"/>
    <circle cx="131" cy="296" r="3.4" fill="#0d1320"/>
    <circle cx="145" cy="296" r="3.4" fill="#0d1320"/>
  </g>
  <text x="24" y="40" fill="#5b6b8c" font-family="ui-monospace, Consolas, monospace" font-size="14" letter-spacing="2">SCORE 04821</text>
  <text x="616" y="40" text-anchor="end" fill="#5b6b8c" font-family="ui-monospace, Consolas, monospace" font-size="14" letter-spacing="2">STAGE 3</text>
</svg>`;

  let styled = false;

  function mount(element, state) {
    if (!styled) {
      const style = document.createElement("style");
      style.textContent = STYLE;
      document.head.append(style);
      styled = true;
    }
    const holder = document.createElement("div");
    holder.className = "screener-feed";
    holder.dataset.feed = state ?? "live";
    holder.innerHTML = SVG;
    element.prepend(holder);
    return holder;
  }

  window.ScreenerFeed = { mount };
})();
