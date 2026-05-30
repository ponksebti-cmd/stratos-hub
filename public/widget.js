/**
 * Stratos Hub — Embeddable Chat Widget
 *
 * Usage:
 *   <script
 *     src="https://yourdomain.com/widget.js"
 *     data-key="YOUR_AGENCY_ID"
 *     data-color="#6366f1"
 *     data-name="Property Assistant"
 *     data-greeting="Hi! How can I help you?"
 *     data-theme="light"
 *     data-position="right"
 *   ></script>
 */
(function () {
  "use strict";

  // ── Config ────────────────────────────────────────────────────────────────

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

  // Derive base URL from script src
  var BASE_URL;
  try {
    BASE_URL = new URL(script.src).origin;
  } catch (_) {
    BASE_URL = window.location.origin;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function hexAlpha(hex, a) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!r) return "rgba(99,102,241," + a + ")";
    return "rgba(" + parseInt(r[1], 16) + "," + parseInt(r[2], 16) + "," + parseInt(r[3], 16) + "," + a + ")";
  }

  function darkenHex(hex, f) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!r) return hex;
    var ch = function (v) { return Math.max(0, Math.round(parseInt(v, 16) * f)).toString(16).padStart(2, "0"); };
    return "#" + ch(r[1]) + ch(r[2]) + ch(r[3]);
  }

  // ── CSS ───────────────────────────────────────────────────────────────────

  var PANEL_BG   = THEME === "dark" ? "#0f172a" : "#ffffff";
  var SHADOW     = "0 12px 48px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)";
  var GRAD       = "linear-gradient(135deg, " + COLOR + " 0%, " + darkenHex(COLOR, 0.72) + " 100%)";
  var SIDE       = POSITION === "left" ? "left" : "right";
  var ORIGIN     = "bottom " + SIDE;

  var css = `
    #sh-fab-container {
      position: fixed;
      ${SIDE}: 24px;
      bottom: 24px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      align-items: ${SIDE === 'right' ? 'flex-end' : 'flex-start'};
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #sh-teaser {
      background: #ffffff;
      color: #1e293b;
      padding: 12px 18px;
      border-radius: 18px;
      box-shadow: 0 4px 20px -4px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
      font-size: 13.5px;
      font-weight: 500;
      max-width: 240px;
      cursor: pointer;
      opacity: 0;
      transform: translateY(10px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: none;
      border-${SIDE === 'right' ? 'bottom-right' : 'bottom-left'}-radius: 4px;
      position: relative;
    }
    #sh-teaser.sh-visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    #sh-teaser:hover { transform: translateY(-2px) scale(1.02); }

    #sh-fab {
      box-sizing: border-box;
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: ${GRAD};
      cursor: pointer;
      box-shadow: 0 10px 32px -4px ${hexAlpha(COLOR, 0.45)}, 0 4px 12px -2px ${hexAlpha(COLOR, 0.25)};
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      outline: none;
      padding: 0;
      margin: 0;
      transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
      position: relative;
      overflow: visible;
    }
    #sh-fab:hover {
      transform: scale(1.08) translateY(-3px);
      box-shadow: 0 16px 40px -6px ${hexAlpha(COLOR, 0.55)}, 0 6px 16px -2px ${hexAlpha(COLOR, 0.3)};
    }
    #sh-fab:active { transform: scale(0.92); }

    #sh-fab-logo {
      width: 28px;
      height: 28px;
      object-contain: contain;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    #sh-fab:hover #sh-fab-logo { transform: scale(1.1) rotate(5deg); }

    #sh-fab-close {
      display: none;
      width: 24px;
      height: 24px;
      stroke: #fff;
    }

    #sh-badge {
      box-sizing: border-box;
      position: absolute;
      top: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ef4444;
      border: 2px solid #fff;
      box-shadow: 0 0 0 2px ${hexAlpha('#ef4444', 0.2)};
      animation: sh-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    @keyframes sh-ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }

    #sh-panel {
      box-sizing: border-box;
      position: fixed;
      ${SIDE}: 24px;
      bottom: 100px;
      width: 400px;
      height: 600px;
      max-height: calc(100svh - 130px);
      border-radius: 24px;
      overflow: hidden;
      background: ${PANEL_BG};
      box-shadow: ${SHADOW};
      z-index: 2147483646;
      transform-origin: ${ORIGIN};
      transform: scale(0.9) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.34,1.15,0.64,1);
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(0,0,0,0.05);
    }
    #sh-panel.sh-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    #sh-iframe {
      width: 100%;
      height: 100%;
      flex: 1;
      border: none;
      display: block;
    }

    @media (max-width: 480px) {
      #sh-fab-container { ${SIDE}: 16px; bottom: 16px; }
      #sh-panel {
        ${SIDE}: 0;
        bottom: 0;
        width: 100vw;
        height: 100svh;
        max-height: 100svh;
        border-radius: 0;
        border: none;
      }
    }
  `;

  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── Icons ─────────────────────────────────────────────────────────────────

  var LOGO_URL = BASE_URL + "/logo.png"; // Default to white logo as it pops better on colored FAB

  var ICON_CLOSE = `
    <svg id="sh-fab-close" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L12 12L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  // ── Elements ──────────────────────────────────────────────────────────────

  var container = document.createElement("div");
  container.id = "sh-fab-container";

  var teaser = document.createElement("div");
  teaser.id = "sh-teaser";
  teaser.textContent = GREETING || "Hi! Any questions? I'm here to help.";
  container.appendChild(teaser);

  var fab = document.createElement("button");
  fab.id = "sh-fab";
  fab.innerHTML = `
    <img id="sh-fab-logo" src="${LOGO_URL}" alt="Chat" />
    ${ICON_CLOSE}
    <div id="sh-badge"></div>
  `;
  container.appendChild(fab);

  var panel = document.createElement("div");
  panel.id = "sh-panel";

  var iframeSrc =
    BASE_URL +
    "/embed/" + encodeURIComponent(KEY) +
    "?name="     + encodeURIComponent(NAME) +
    "&color="    + encodeURIComponent(COLOR) +
    "&theme="    + encodeURIComponent(THEME);

  var iframe = document.createElement("iframe");
  iframe.id = "sh-iframe";
  iframe.src = iframeSrc;
  iframe.setAttribute("allow", "clipboard-write");
  panel.appendChild(iframe);

  // ── State ───────────────────────────────────────────────────────────────

  var isOpen = false;

  function openWidget() {
    isOpen = true;
    panel.classList.add("sh-open");
    teaser.classList.remove("sh-visible");
    document.getElementById("sh-fab-logo").style.display = "none";
    document.getElementById("sh-fab-close").style.display = "block";
    document.getElementById("sh-badge").style.display = "none";
    if (window.innerWidth <= 480) document.body.style.overflow = "hidden";
  }

  function closeWidget() {
    isOpen = false;
    panel.classList.remove("sh-open");
    document.getElementById("sh-fab-logo").style.display = "block";
    document.getElementById("sh-fab-close").style.display = "none";
    if (window.innerWidth <= 480) document.body.style.overflow = "";
  }

  fab.onclick = function(e) {
    e.stopPropagation();
    if (isOpen) closeWidget(); else openWidget();
  };

  teaser.onclick = openWidget;

  // Show teaser after delay
  setTimeout(function() {
    if (!isOpen) teaser.classList.add("sh-visible");
  }, 2500);

  // ── Communication ────────────────────────────────────────────────────────

  window.addEventListener("message", function(event) {
    if (event.data.type === "stratos_close_widget") closeWidget();
    if (event.data.type === "stratos_widget_config") {
      if (event.data.color) {
        var c = event.data.color;
        fab.style.background = "linear-gradient(135deg, " + c + " 0%, " + darkenHex(c, 0.72) + " 100%)";
        fab.style.boxShadow = "0 10px 32px -4px " + hexAlpha(c, 0.45) + ", 0 4px 12px -2px " + hexAlpha(c, 0.25);
      }
    }
  });

  // ── Mount ────────────────────────────────────────────────────────────────

  function mount() {
    document.body.appendChild(panel);
    document.body.appendChild(container);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

})();
