/**
 * Stratos Hub — Embeddable Chat Widget v2
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

  try { BASE_URL = new URL(script.src).origin; } catch (_) { var BASE_URL = window.location.origin; }
  if (!BASE_URL) BASE_URL = window.location.origin;

  // ── Color helpers ────────────────────────────────────────────────────────
  function hex(h, a) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    if (!r) return "rgba(99,102,241," + a + ")";
    return "rgba(" + parseInt(r[1],16) + "," + parseInt(r[2],16) + "," + parseInt(r[3],16) + "," + a + ")";
  }
  function darken(h, f) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    if (!r) return h;
    var ch = function(v){ return Math.max(0, Math.round(parseInt(v,16)*f)).toString(16).padStart(2,"0"); };
    return "#" + ch(r[1]) + ch(r[2]) + ch(r[3]);
  }
  function lighten(h, f) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    if (!r) return h;
    var ch = function(v){ return Math.min(255, Math.round(parseInt(v,16) + (255-parseInt(v,16))*f)).toString(16).padStart(2,"0"); };
    return "#" + ch(r[1]) + ch(r[2]) + ch(r[3]);
  }

  var GRAD  = "linear-gradient(135deg, " + lighten(COLOR,0.1) + " 0%, " + darken(COLOR,0.85) + " 100%)";
  var SIDE  = POSITION === "left" ? "left" : "right";
  var ORIGIN= "bottom " + SIDE;
  var DARK  = THEME === "dark";

  // ── Inject CSS ────────────────────────────────────────────────────────────
  var css = [
    "#sh-root *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}",

    /* Container */
    "#sh-root{",
      "position:fixed;" + SIDE + ":20px;bottom:20px;",
      "z-index:2147483647;",
      "display:flex;flex-direction:column;",
      "align-items:" + (SIDE==="right"?"flex-end":"flex-start") + ";",
      "gap:10px;",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;",
    "}",

    /* Teaser bubble */
    "#sh-teaser{",
      "background:" + (DARK?"rgba(15,20,40,0.95)":"#ffffff") + ";",
      "color:" + (DARK?"#f1f5f9":"#1e293b") + ";",
      "padding:10px 14px 10px 10px;",
      "border-radius:18px;",
      "border-" + (SIDE==="right"?"bottom-right":"bottom-left") + "-radius:4px;",
      "box-shadow:0 8px 32px -8px rgba(0,0,0,0.2),0 0 0 1px rgba(0,0,0,0.06);",
      "max-width:260px;cursor:pointer;",
      "opacity:0;transform:translateY(12px) scale(0.92);",
      "transition:opacity 0.35s cubic-bezier(0.34,1.4,0.64,1),transform 0.35s cubic-bezier(0.34,1.4,0.64,1);",
      "pointer-events:none;display:flex;align-items:center;gap:9px;",
      "backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);",
    "}",
    "#sh-teaser.sh-in{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}",
    "#sh-teaser:hover{transform:translateY(-2px) scale(1.02);}",
    "#sh-teaser-avatar{",
      "flex-shrink:0;width:32px;height:32px;border-radius:10px;",
      "background:" + GRAD + ";",
      "display:flex;align-items:center;justify-content:center;",
      "box-shadow:0 2px 8px " + hex(COLOR,0.35) + ";",
    "}",
    "#sh-teaser-avatar svg{width:16px;height:16px;fill:none;stroke:white;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}",
    "#sh-teaser-body{flex:1;min-width:0;}",
    "#sh-teaser-name{font-size:11px;font-weight:700;letter-spacing:0.02em;opacity:0.55;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    "#sh-teaser-msg{font-size:13px;font-weight:500;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
    "#sh-dismiss{flex-shrink:0;width:18px;height:18px;border:none;background:none;padding:0;cursor:pointer;",
      "opacity:0.35;transition:opacity 0.15s;display:flex;align-items:center;justify-content:center;",
    "}",
    "#sh-dismiss:hover{opacity:0.7;}",
    "#sh-dismiss svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;}",

    /* FAB button */
    "#sh-fab{",
      "position:relative;",
      "width:56px;height:56px;border-radius:28px;",
      "background:" + GRAD + ";",
      "cursor:pointer;border:none;outline:none;padding:0;margin:0;",
      "box-shadow:0 8px 24px -4px " + hex(COLOR,0.55) + ",0 4px 10px -2px " + hex(COLOR,0.3) + ",0 0 0 0 " + hex(COLOR,0.4) + ";",
      "display:flex;align-items:center;justify-content:center;",
      "transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.3s ease;",
      "animation:sh-pulse 3s cubic-bezier(0.4,0,0.6,1) infinite;",
    "}",
    "#sh-fab:hover{",
      "transform:scale(1.1) translateY(-2px);",
      "box-shadow:0 14px 32px -6px " + hex(COLOR,0.65) + ",0 6px 14px -2px " + hex(COLOR,0.4) + ";",
    "}",
    "#sh-fab:active{transform:scale(0.93);animation:none;}",
    "#sh-fab.sh-open{animation:none;box-shadow:0 6px 20px -4px " + hex(COLOR,0.5) + ";}",

    /* Icons inside FAB */
    ".sh-fab-icon{",
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",
      "transition:opacity 0.2s ease,transform 0.3s cubic-bezier(0.34,1.56,0.64,1);",
    "}",
    "#sh-icon-chat{opacity:1;transform:scale(1);}",
    "#sh-icon-chat svg{width:26px;height:26px;fill:none;stroke:white;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.15));}",
    "#sh-icon-close{opacity:0;transform:scale(0.7) rotate(-90deg);}",
    "#sh-icon-close svg{width:22px;height:22px;fill:none;stroke:white;stroke-width:2.5;stroke-linecap:round;}",
    "#sh-fab.sh-open #sh-icon-chat{opacity:0;transform:scale(0.6) rotate(90deg);}",
    "#sh-fab.sh-open #sh-icon-close{opacity:1;transform:scale(1) rotate(0deg);}",

    /* Notification dot */
    "#sh-dot{",
      "position:absolute;top:-1px;" + (SIDE==="right"?"right:-1px;":"left:-1px;"),
      "width:13px;height:13px;border-radius:50%;",
      "background:#ef4444;border:2.5px solid white;",
      "animation:sh-ping-dot 2.5s ease-in-out infinite;",
      "transition:opacity 0.2s;",
    "}",

    /* Panel */
    "#sh-panel{",
      "position:fixed;" + SIDE + ":18px;bottom:88px;",
      "width:390px;height:610px;",
      "max-height:calc(100svh - 120px);",
      "border-radius:20px;overflow:hidden;",
      "background:" + (DARK?"#0f172a":"#f8fafc") + ";",
      "box-shadow:0 24px 64px -16px rgba(0,0,0,0.3),0 8px 32px -8px rgba(0,0,0,0.12),0 0 0 1px rgba(0,0,0,0.06);",
      "z-index:2147483646;",
      "transform-origin:" + ORIGIN + ";",
      "transform:scale(0.88) translateY(24px);",
      "opacity:0;pointer-events:none;",
      "transition:transform 0.42s cubic-bezier(0.32,1.2,0.64,1),opacity 0.3s ease;",
      "display:flex;flex-direction:column;",
    "}",
    "#sh-panel.sh-open{transform:scale(1) translateY(0);opacity:1;pointer-events:auto;}",

    "#sh-iframe{width:100%;height:100%;flex:1;border:none;display:block;}",

    /* Keyframes */
    "@keyframes sh-pulse{0%,100%{box-shadow:0 8px 24px -4px " + hex(COLOR,0.55) + ",0 0 0 0 " + hex(COLOR,0.4) + ";}50%{box-shadow:0 8px 24px -4px " + hex(COLOR,0.55) + ",0 0 0 8px " + hex(COLOR,0) + ";}}",
    "@keyframes sh-ping-dot{0%,80%,100%{transform:scale(1);}40%{transform:scale(1.3);}}",

    /* Mobile full-screen */
    "@media(max-width:480px){",
      "#sh-root{" + SIDE + ":14px;bottom:14px;}",
      "#sh-panel{" + SIDE + ":0;bottom:0;width:100vw;height:100dvh;max-height:100dvh;border-radius:0;}",
      "#sh-fab{width:52px;height:52px;border-radius:26px;}",
    "}",
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ── Build DOM ─────────────────────────────────────────────────────────────
  var root = document.createElement("div");
  root.id = "sh-root";

  // Teaser bubble
  var teaser = document.createElement("div");
  teaser.id = "sh-teaser";
  teaser.setAttribute("role", "button");
  teaser.setAttribute("aria-label", "Open chat with " + NAME);
  teaser.innerHTML = [
    '<div id="sh-teaser-avatar">',
      '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    '</div>',
    '<div id="sh-teaser-body">',
      '<div id="sh-teaser-name">' + NAME + '</div>',
      '<div id="sh-teaser-msg">' + (GREETING || "Hi! Any questions? I'm here to help 👋") + '</div>',
    '</div>',
    '<button id="sh-dismiss" aria-label="Dismiss" title="Dismiss">',
      '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    '</button>',
  ].join("");
  root.appendChild(teaser);

  // FAB
  var fab = document.createElement("button");
  fab.id = "sh-fab";
  fab.setAttribute("aria-label", "Chat with " + NAME);
  fab.innerHTML = [
    '<div class="sh-fab-icon" id="sh-icon-chat">',
      '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    '</div>',
    '<div class="sh-fab-icon" id="sh-icon-close">',
      '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    '</div>',
    '<div id="sh-dot"></div>',
  ].join("");
  root.appendChild(fab);

  // Panel with iframe
  var panel = document.createElement("div");
  panel.id = "sh-panel";

  var iframeSrc = BASE_URL + "/embed/" + encodeURIComponent(KEY)
    + "?name="     + encodeURIComponent(NAME)
    + "&color="    + encodeURIComponent(COLOR)
    + "&theme="    + encodeURIComponent(THEME);

  var iframe = document.createElement("iframe");
  iframe.id = "sh-iframe";
  iframe.src = iframeSrc;
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("title", NAME + " chat");
  panel.appendChild(iframe);

  // ── State ─────────────────────────────────────────────────────────────────
  var isOpen = false;

  function openWidget() {
    if (isOpen) return;
    isOpen = true;
    panel.classList.add("sh-open");
    fab.classList.add("sh-open");
    teaser.classList.remove("sh-in");
    var dot = document.getElementById("sh-dot");
    if (dot) dot.style.opacity = "0";
    if (window.innerWidth <= 480) document.body.style.overflow = "hidden";
  }

  function closeWidget() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove("sh-open");
    fab.classList.remove("sh-open");
    if (window.innerWidth <= 480) document.body.style.overflow = "";
  }

  fab.onclick = function (e) {
    e.stopPropagation();
    isOpen ? closeWidget() : openWidget();
  };

  teaser.onclick = function (e) {
    if (e.target.closest("#sh-dismiss")) return;
    openWidget();
  };

  var dismissBtn = teaser.querySelector("#sh-dismiss");
  if (dismissBtn) {
    dismissBtn.onclick = function (e) {
      e.stopPropagation();
      teaser.classList.remove("sh-in");
      teaser.style.display = "none";
    };
  }

  // Show teaser after 3 seconds
  setTimeout(function () {
    if (!isOpen) teaser.classList.add("sh-in");
  }, 3000);

  // Auto-hide teaser after 12 seconds if not interacted
  setTimeout(function () {
    if (!isOpen) teaser.classList.remove("sh-in");
  }, 15000);

  // ── PostMessage ──────────────────────────────────────────────────────────
  window.addEventListener("message", function (ev) {
    if (!ev.data) return;
    if (ev.data.type === "stratos_close_widget") closeWidget();
    if (ev.data.type === "stratos_widget_config" && ev.data.color) {
      var c = ev.data.color;
      var newGrad = "linear-gradient(135deg," + lighten(c,0.1) + " 0%," + darken(c,0.85) + " 100%)";
      fab.style.background = newGrad;
      fab.style.boxShadow = "0 8px 24px -4px " + hex(c,0.55) + ",0 4px 10px -2px " + hex(c,0.3);
    }
  });

  // ── Mount ─────────────────────────────────────────────────────────────────
  function mount() {
    document.body.appendChild(panel);
    document.body.appendChild(root);
  }
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", mount)
    : mount();
})();
