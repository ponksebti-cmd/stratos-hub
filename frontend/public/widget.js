/**
 * Stratos Hub — Embeddable Chat Widget v3
 *
 * Usage:
 *   <script
 *     src="https://yourdomain.com/widget.js"
 *     data-key="YOUR_AGENCY_ID"
 *     data-color="#6366f1"
 *     data-name="Property Assistant"
 *     data-greeting="Hi! How can I help?"
 *     data-theme="light"
 *     data-position="right"
 *   ></script>
 */
(function () {
  "use strict";

  // ── Origin validation ────────────────────────────────────────────────────
  var allowedOrigins = [
    "http://localhost:8080",
    "https://yourdomain.com",  // Add your production domain here
  ];

  var currentOrigin = window.location.origin;
  if (allowedOrigins.indexOf(currentOrigin) === -1) {
    console.warn("Stratos Widget: Blocked from " + currentOrigin);
    return;
  }

  var script = document.currentScript || (function () {
    var s = document.querySelectorAll("script[data-key]");
    return s[s.length - 1] || null;
  })();

  if (!script) return;

  var KEY      = script.getAttribute("data-key")      || "demo";
  var COLOR    = script.getAttribute("data-color")    || "#6366f1";
  var NAME     = script.getAttribute("data-name")     || "Property Assistant";
  var GREETING = script.getAttribute("data-greeting") || "";
  var THEME    = script.getAttribute("data-theme")    || "light";
  var POSITION = script.getAttribute("data-position") || "right";

  var BASE_URL;
  try { BASE_URL = new URL(script.src).origin; } catch (_) { BASE_URL = window.location.origin; }
  if (!BASE_URL) BASE_URL = window.location.origin;

  // ── Color helpers ────────────────────────────────────────────────────────
  function hexToRgb(h) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    if (!r) return [99, 102, 241];
    return [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)];
  }
  function rgba(h, a) {
    var c = hexToRgb(h);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }
  function darken(h, f) {
    var c = hexToRgb(h);
    return "rgb(" + Math.max(0, Math.round(c[0]*f)) + "," + Math.max(0, Math.round(c[1]*f)) + "," + Math.max(0, Math.round(c[2]*f)) + ")";
  }
  function lighten(h, f) {
    var c = hexToRgb(h);
    return "rgb(" + Math.min(255, Math.round(c[0]+(255-c[0])*f)) + "," + Math.min(255, Math.round(c[1]+(255-c[1])*f)) + "," + Math.min(255, Math.round(c[2]+(255-c[2])*f)) + ")";
  }

  var GRAD  = "linear-gradient(135deg, " + lighten(COLOR, 0.15) + " 0%, " + COLOR + " 50%, " + darken(COLOR, 0.78) + " 100%)";
  var SIDE  = POSITION === "left" ? "left" : "right";
  var DARK  = THEME === "dark";
  var ORIGIN = "bottom " + SIDE;

  // ── CSS ────────────────────────────────────────────────────────────────────
  var css = [
    "#sh-root*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}",

    /* Root container */
    "#sh-root{",
      "position:fixed;" + SIDE + ":20px;bottom:20px;",
      "z-index:2147483647;",
      "display:flex;flex-direction:column;",
      "align-items:" + (SIDE === "right" ? "flex-end" : "flex-start") + ";",
      "gap:12px;",
      "pointer-events:none;",
    "}",
    "#sh-root>*{pointer-events:auto;}",

    /* ── Teaser bubble ───────────────────────────────────────────────────── */
    "#sh-teaser{",
      "display:flex;align-items:center;gap:10px;",
      "padding:10px 10px 10px 12px;",
      "max-width:280px;",
      "border-radius:20px;",
      "border-" + (SIDE === "right" ? "bottom-right" : "bottom-left") + "-radius:6px;",
      "background:" + (DARK ? "rgba(15,23,42,0.96)" : "rgba(255,255,255,0.98)") + ";",
      "backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);",
      "box-shadow:0 8px 40px -8px rgba(0,0,0,0.18),0 2px 12px -2px rgba(0,0,0,0.1),0 0 0 1px " + (DARK ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") + ";",
      "cursor:pointer;",
      "opacity:0;transform:translateY(16px) scale(0.9);",
      "transition:opacity 0.4s cubic-bezier(0.34,1.4,0.64,1),transform 0.4s cubic-bezier(0.34,1.4,0.64,1),box-shadow 0.2s ease;",
    "}",
    "#sh-teaser.sh-in{opacity:1;transform:translateY(0) scale(1);}",
    "#sh-teaser:hover{transform:translateY(-3px) scale(1.015);box-shadow:0 16px 48px -8px rgba(0,0,0,0.22),0 4px 16px -2px rgba(0,0,0,0.1),0 0 0 1px " + (DARK ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)") + ";}",

    "#sh-teaser-avatar{",
      "position:relative;flex-shrink:0;",
      "width:38px;height:38px;",
      "border-radius:12px;",
      "background:" + GRAD + ";",
      "display:flex;align-items:center;justify-content:center;",
      "box-shadow:0 4px 12px " + rgba(COLOR, 0.4) + ";",
    "}",
    "#sh-teaser-avatar svg{width:18px;height:18px;fill:none;stroke:white;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}",
    "#sh-teaser-online{",
      "position:absolute;bottom:-2px;right:-2px;",
      "width:11px;height:11px;border-radius:50%;",
      "background:#22c55e;border:2px solid " + (DARK ? "#0f172a" : "#fff") + ";",
    "}",

    "#sh-teaser-body{flex:1;min-width:0;}",
    "#sh-teaser-name{",
      "font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;",
      "opacity:" + (DARK ? "0.5" : "0.45") + ";",
      "margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
      "color:" + (DARK ? "#f1f5f9" : "#0f172a") + ";",
    "}",
    "#sh-teaser-msg{",
      "font-size:13.5px;font-weight:500;line-height:1.45;",
      "color:" + (DARK ? "#e2e8f0" : "#1e293b") + ";",
      "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;",
    "}",

    "#sh-dismiss{",
      "flex-shrink:0;width:22px;height:22px;",
      "border:none;background:" + (DARK ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") + ";",
      "border-radius:50%;padding:0;cursor:pointer;",
      "display:flex;align-items:center;justify-content:center;",
      "opacity:0.6;transition:opacity 0.15s,background 0.15s,transform 0.15s;",
      "color:" + (DARK ? "#94a3b8" : "#64748b") + ";",
    "}",
    "#sh-dismiss:hover{opacity:1;background:" + (DARK ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)") + ";transform:scale(1.1);}",
    "#sh-dismiss svg{width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;}",

    /* ── FAB ───────────────────────────────────────────────────────────── */
    "#sh-fab{",
      "position:relative;",
      "width:58px;height:58px;border-radius:18px;",
      "background:" + GRAD + ";",
      "cursor:pointer;border:none;outline:none;padding:0;margin:0;",
      "box-shadow:",
        "0 12px 32px -6px " + rgba(COLOR, 0.6) + ",",
        "0 4px 12px -2px " + rgba(COLOR, 0.35) + ",",
        "0 0 0 0 " + rgba(COLOR, 0.3) + ";",
      "display:flex;align-items:center;justify-content:center;",
      "transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.3s ease,border-radius 0.3s ease;",
      "animation:sh-pulse 3.5s ease-in-out infinite;",
    "}",
    "#sh-fab:hover{",
      "transform:scale(1.08) translateY(-3px);",
      "box-shadow:",
        "0 20px 40px -8px " + rgba(COLOR, 0.65) + ",",
        "0 8px 16px -4px " + rgba(COLOR, 0.4) + ";",
      "border-radius:20px;",
    "}",
    "#sh-fab:active{transform:scale(0.92);animation:none;}",
    "#sh-fab.sh-open{",
      "animation:none;",
      "border-radius:14px;",
      "box-shadow:0 8px 24px -4px " + rgba(COLOR, 0.45) + ";",
    "}",

    /* Icons */
    ".sh-icon{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity 0.25s ease,transform 0.35s cubic-bezier(0.34,1.56,0.64,1);}",
    "#sh-icon-chat{opacity:1;transform:scale(1) rotate(0deg);}",
    "#sh-icon-chat svg{width:26px;height:26px;fill:none;stroke:white;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 4px rgba(0,0,0,0.2));}",
    "#sh-icon-close{opacity:0;transform:scale(0.5) rotate(-180deg);}",
    "#sh-icon-close svg{width:22px;height:22px;fill:none;stroke:white;stroke-width:2.5;stroke-linecap:round;}",
    "#sh-fab.sh-open #sh-icon-chat{opacity:0;transform:scale(0.5) rotate(180deg);}",
    "#sh-fab.sh-open #sh-icon-close{opacity:1;transform:scale(1) rotate(0deg);}",

    /* Notification dot */
    "#sh-dot{",
      "position:absolute;top:-4px;" + (SIDE === "right" ? "right:-4px;" : "left:-4px;"),
      "width:16px;height:16px;border-radius:50%;",
      "background:linear-gradient(135deg,#f97316,#ef4444);",
      "border:2.5px solid white;",
      "display:flex;align-items:center;justify-content:center;",
      "font-size:8px;font-weight:700;color:white;",
      "animation:sh-dot-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;",
      "transition:opacity 0.2s,transform 0.2s;",
    "}",

    /* Panel */
    "#sh-panel{",
      "position:fixed;" + SIDE + ":18px;bottom:92px;",
      "width:400px;",
      "height:620px;",
      "max-height:calc(100svh - 130px);",
      "border-radius:24px;overflow:hidden;",
      "background:" + (DARK ? "#0f172a" : "#f8fafc") + ";",
      "border:1px solid " + (DARK ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)") + ";",
      "box-shadow:",
        "0 32px 80px -20px rgba(0,0,0,0.35),",
        "0 12px 32px -8px rgba(0,0,0,0.15),",
        "0 0 0 1px " + rgba(COLOR, 0.08) + ";",
      "z-index:2147483646;",
      "transform-origin:" + ORIGIN + ";",
      "transform:scale(0.85) translateY(28px);",
      "opacity:0;pointer-events:none;",
      "transition:transform 0.45s cubic-bezier(0.32,1.25,0.64,1),opacity 0.3s ease;",
      "display:flex;flex-direction:column;",
    "}",
    "#sh-panel.sh-open{transform:scale(1) translateY(0);opacity:1;pointer-events:auto;}",

    "#sh-iframe{width:100%;flex:1;border:none;display:block;min-height:0;}",

    /* Keyframes */
    "@keyframes sh-pulse{",
      "0%,100%{box-shadow:0 12px 32px -6px " + rgba(COLOR, 0.6) + ",0 0 0 0 " + rgba(COLOR, 0.35) + ";}",
      "50%{box-shadow:0 12px 32px -6px " + rgba(COLOR, 0.6) + ",0 0 0 10px " + rgba(COLOR, 0) + ";}",
    "}",
    "@keyframes sh-dot-pop{from{transform:scale(0);}to{transform:scale(1);}}",

    /* Mobile */
    "@media(max-width:480px){",
      "#sh-root{" + SIDE + ":14px;bottom:14px;}",
      "#sh-panel{",
        SIDE + ":0;bottom:0;right:0;left:0;",
        "width:100%;height:100dvh;max-height:100dvh;",
        "border-radius:0;border:none;",
        "transform-origin:bottom center;",
      "}",
      "#sh-fab{width:54px;height:54px;border-radius:16px;}",
    "}",
  ].join("");

  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── DOM ────────────────────────────────────────────────────────────────────
  var root = document.createElement("div");
  root.id = "sh-root";

  // Teaser
  var teaser = document.createElement("div");
  teaser.id = "sh-teaser";
  teaser.setAttribute("role", "button");
  teaser.setAttribute("aria-label", "Chat with " + NAME);
  teaser.innerHTML =
    '<div id="sh-teaser-avatar">' +
      '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<div id="sh-teaser-online"></div>' +
    '</div>' +
    '<div id="sh-teaser-body">' +
      '<div id="sh-teaser-name">' + NAME + '</div>' +
      '<div id="sh-teaser-msg">' + (GREETING || "👋 Hi there! Any questions about properties? I'm here to help.") + '</div>' +
    '</div>' +
    '<button id="sh-dismiss" aria-label="Dismiss" title="Dismiss">' +
      '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    '</button>';
  root.appendChild(teaser);

  // FAB
  var fab = document.createElement("button");
  fab.id = "sh-fab";
  fab.setAttribute("aria-label", "Chat with " + NAME);
  fab.innerHTML =
    '<div class="sh-icon" id="sh-icon-chat">' +
      '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
    '</div>' +
    '<div class="sh-icon" id="sh-icon-close">' +
      '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    '</div>' +
    '<div id="sh-dot">1</div>';
  root.appendChild(fab);

  // Panel + iframe
  var panel = document.createElement("div");
  panel.id = "sh-panel";

  var iframeSrc = BASE_URL + "/embed/" + encodeURIComponent(KEY)
    + "?color="    + encodeURIComponent(COLOR)
    + "&name="     + encodeURIComponent(NAME)
    + "&theme="    + encodeURIComponent(THEME)
    + (GREETING ? "&greeting=" + encodeURIComponent(GREETING) : "");

  var iframe = document.createElement("iframe");
  iframe.id = "sh-iframe";
  iframe.src = iframeSrc;
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("title", NAME + " Chat");
  panel.appendChild(iframe);

  // ── State ────────────────────────────────────────────────────────────────────
  var isOpen = false;

  function openWidget() {
    if (isOpen) return;
    isOpen = true;
    panel.classList.add("sh-open");
    fab.classList.add("sh-open");
    teaser.classList.remove("sh-in");
    var dot = document.getElementById("sh-dot");
    if (dot) { dot.style.opacity = "0"; dot.style.transform = "scale(0)"; }
    if (window.innerWidth <= 480) document.body.style.overflow = "hidden";
  }

  function closeWidget() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove("sh-open");
    fab.classList.remove("sh-open");
    if (window.innerWidth <= 480) document.body.style.overflow = "";
  }

  fab.onclick = function (e) { e.stopPropagation(); isOpen ? closeWidget() : openWidget(); };
  teaser.onclick = function (e) { if (e.target.closest("#sh-dismiss")) return; openWidget(); };

  var dismissBtn = teaser.querySelector("#sh-dismiss");
  if (dismissBtn) {
    dismissBtn.onclick = function (e) {
      e.stopPropagation();
      teaser.classList.remove("sh-in");
      setTimeout(function () { teaser.style.display = "none"; }, 400);
    };
  }

  // Show teaser after 2.5s
  setTimeout(function () {
    if (!isOpen) teaser.classList.add("sh-in");
  }, 2500);

  // Auto-hide after 12s
  setTimeout(function () {
    if (!isOpen) teaser.classList.remove("sh-in");
  }, 14500);

  // ── postMessage bridge ──────────────────────────────────────────────────────
  window.addEventListener("message", function (ev) {
    if (!ev.data) return;
    if (ev.data.type === "stratos_close_widget") closeWidget();
    if (ev.data.type === "stratos_widget_config" && ev.data.color) {
      var c = ev.data.color;
      var newGrad = "linear-gradient(135deg," + lighten(c, 0.15) + " 0%," + c + " 50%," + darken(c, 0.78) + " 100%)";
      fab.style.background = newGrad;
      fab.style.boxShadow = "0 12px 32px -6px " + rgba(c, 0.6) + ",0 4px 12px -2px " + rgba(c, 0.35);
      var avatar = document.getElementById("sh-teaser-avatar");
      if (avatar) avatar.style.background = newGrad;
    }
  });

  // ── Mount ────────────────────────────────────────────────────────────────────
  function mount() {
    document.body.appendChild(panel);
    document.body.appendChild(root);
  }
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", mount)
    : mount();
})();
