/**
 * Stratos Hub — Universal Real Estate AI Chat Widget
 * Apple-grade iOS Toast Notification & Spatial Drawer
 */
(function () {
  "use strict";

  // Clean up any previous widget instance on reload/HMR
  try {
    var prevRoot = document.getElementById("sw-root") || document.getElementById("sh-root");
    if (prevRoot && prevRoot.parentNode) prevRoot.parentNode.removeChild(prevRoot);
    var prevPanel = document.getElementById("sw-panel") || document.getElementById("sh-panel");
    if (prevPanel && prevPanel.parentNode) prevPanel.parentNode.removeChild(prevPanel);
    var prevStyle = document.getElementById("sw-styles");
    if (prevStyle && prevStyle.parentNode) prevStyle.parentNode.removeChild(prevStyle);
  } catch (e) {}

  var script =
    document.currentScript ||
    (function () {
      var s = document.querySelectorAll("script[data-key]");
      return s[s.length - 1] || null;
    })();

  var KEY = (script && script.getAttribute("data-key")) || "demo";
  var COLOR = (script && script.getAttribute("data-color")) || "#6366f1";
  var NAME = (script && script.getAttribute("data-name")) || "Sarah - Property Concierge";
  var GREETING =
    (script && script.getAttribute("data-greeting")) ||
    "Hi there! 👋 Looking for your dream property? I can help you find exclusive listings, calculate yields, and book private viewings.";
  var THEME = (script && script.getAttribute("data-theme")) || "light";
  var POSITION = (script && script.getAttribute("data-position")) || "right";

  var API_URL = script ? script.getAttribute("data-api") : null;
  var BASE_URL = API_URL || (typeof window !== "undefined" ? window.location.origin : "");

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
    return (
      "rgb(" +
      Math.max(0, Math.round(c[0] * f)) +
      "," +
      Math.max(0, Math.round(c[1] * f)) +
      "," +
      Math.max(0, Math.round(c[2] * f)) +
      ")"
    );
  }
  function lighten(h, f) {
    var c = hexToRgb(h);
    return (
      "rgb(" +
      Math.min(255, Math.round(c[0] + (255 - c[0]) * f)) +
      "," +
      Math.min(255, Math.round(c[1] + (255 - c[1]) * f)) +
      "," +
      Math.min(255, Math.round(c[2] + (255 - c[2]) * f)) +
      ")"
    );
  }

  var GRAD = "linear-gradient(135deg, " + lighten(COLOR, 0.15) + " 0%, " + COLOR + " 65%, " + darken(COLOR, 0.75) + " 100%)";
  var SIDE = POSITION === "left" ? "left" : "right";
  var DARK = THEME === "dark";

  // ── Bulletproof Isolated CSS with Zero Host Leaks ─────────────────────────
  var css = [
    "/* Stratos Hub Widget Isolated System */",
    "#sw-root, #sw-panel, #sw-root *, #sw-panel * {",
    "  box-sizing: border-box !important;",
    "  -webkit-font-smoothing: antialiased !important;",
    "  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Inter', system-ui, sans-serif !important;",
    "  margin: 0; padding: 0; border: 0; font-size: 100%; vertical-align: baseline; line-height: 1.4;",
    "}",

    "#sw-root {",
    "  position: fixed !important; " + SIDE + ": 20px !important; bottom: 20px !important;",
    "  z-index: 2147483647 !important;",
    "  display: flex !important; flex-direction: column !important;",
    "  align-items: " + (SIDE === "right" ? "flex-end" : "flex-start") + " !important;",
    "  gap: 12px !important;",
    "  pointer-events: none !important;",
    "}",
    "#sw-root > * { pointer-events: auto !important; }",

    /* ── Apple iOS Notification Toast Banner ──────────────────────────── */
    "#sw-toast {",
    "  position: relative !important;",
    "  display: flex !important; align-items: flex-start !important; gap: 11px !important;",
    "  padding: 12px 14px 12px 12px !important;",
    "  width: 326px !important; max-width: calc(100vw - 40px) !important;",
    "  border-radius: 18px !important;",
    "  background: " + (DARK ? "rgba(30, 32, 42, 0.94)" : "rgba(255, 255, 255, 0.95)") + " !important;",
    "  backdrop-filter: blur(30px) saturate(190%) !important;",
    "  -webkit-backdrop-filter: blur(30px) saturate(190%) !important;",
    "  border: 1px solid " + (DARK ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)") + " !important;",
    "  box-shadow:",
    "    0 16px 36px -6px rgba(0, 0, 0, " + (DARK ? "0.6" : "0.14") + "),",
    "    0 4px 12px -2px rgba(0, 0, 0, 0.06),",
    "    inset 0 1px 1px rgba(255, 255, 255, " + (DARK ? "0.15" : "0.9") + ") !important;",
    "  cursor: pointer !important;",
    "  opacity: 0 !important; transform: translateY(14px) scale(0.96) !important;",
    "  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease !important;",
    "}",
    "#sw-toast.sw-in { opacity: 1 !important; transform: translateY(0) scale(1) !important; }",
    "#sw-toast:hover { transform: translateY(-2px) scale(1.01) !important; box-shadow: 0 20px 42px -6px rgba(0,0,0," + (DARK ? "0.65" : "0.18") + ") !important; }",

    "#sw-toast-icon {",
    "  position: relative !important; flex-shrink: 0 !important;",
    "  width: 38px !important; height: 38px !important; border-radius: 12px !important;",
    "  background: " + GRAD + " !important;",
    "  display: flex !important; align-items: center !important; justify-content: center !important;",
    "  box-shadow: 0 4px 10px " + rgba(COLOR, 0.35) + " !important;",
    "}",
    "#sw-toast-icon svg { width: 19px !important; height: 19px !important; fill: none !important; stroke: white !important; stroke-width: 2 !important; stroke-linecap: round !important; stroke-linejoin: round !important; }",
    "#sw-toast-online {",
    "  position: absolute !important; bottom: -2px !important; right: -2px !important;",
    "  width: 10px !important; height: 10px !important; border-radius: 50% !important;",
    "  background: #10b981 !important; border: 2px solid " + (DARK ? "#1e202a" : "#ffffff") + " !important;",
    "}",

    "#sw-toast-body { flex: 1 !important; min-width: 0 !important; }",
    "#sw-toast-header { display: flex !important; align-items: center !important; justify-content: space-between !important; margin-bottom: 2px !important; }",
    "#sw-toast-title { font-size: 12px !important; font-weight: 700 !important; color: " + (DARK ? "#f8fafc" : "#0f172a") + " !important; letter-spacing: -0.01em !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }",
    "#sw-toast-time { font-size: 11px !important; font-weight: 500 !important; color: " + (DARK ? "#94a3b8" : "#64748b") + " !important; margin-left: 6px !important; flex-shrink: 0 !important; }",
    "#sw-toast-msg {",
    "  font-size: 13px !important; font-weight: 450 !important; line-height: 1.38 !important;",
    "  color: " + (DARK ? "#cbd5e1" : "#334155") + " !important;",
    "  display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important;",
    "}",

    "#sw-toast-close {",
    "  flex-shrink: 0 !important; width: 20px !important; height: 20px !important; margin-left: 2px !important;",
    "  border: none !important; background: " + (DARK ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") + " !important;",
    "  border-radius: 50% !important; padding: 0 !important; cursor: pointer !important;",
    "  display: flex !important; align-items: center !important; justify-content: center !important;",
    "  opacity: 0.65 !important; transition: opacity 0.15s, transform 0.15s !important;",
    "  color: " + (DARK ? "#cbd5e1" : "#64748b") + " !important;",
    "}",
    "#sw-toast-close:hover { opacity: 1 !important; transform: scale(1.1) !important; }",
    "#sw-toast-close svg { width: 10px !important; height: 10px !important; fill: none !important; stroke: currentColor !important; stroke-width: 2.5 !important; stroke-linecap: round !important; }",

    /* ── Floating Action Button (FAB) ─────────────────────────────────── */
    "#sw-fab {",
    "  position: relative !important;",
    "  width: 58px !important; height: 58px !important; border-radius: 18px !important;",
    "  background: " + GRAD + " !important;",
    "  cursor: pointer !important; border: none !important; outline: none !important; padding: 0 !important; margin: 0 !important;",
    "  box-shadow:",
    "    0 12px 28px -4px " + rgba(COLOR, 0.55) + ",",
    "    0 4px 10px -2px " + rgba(COLOR, 0.3) + ",",
    "    inset 0 1px 1px rgba(255, 255, 255, 0.45) !important;",
    "  display: flex !important; align-items: center !important; justify-content: center !important;",
    "  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-radius 0.25s ease !important;",
    "}",
    "#sw-fab:hover {",
    "  transform: scale(1.07) translateY(-2px) !important;",
    "  box-shadow: 0 16px 34px -4px " + rgba(COLOR, 0.65) + ", 0 6px 14px -2px " + rgba(COLOR, 0.35) + ", inset 0 1px 1px rgba(255, 255, 255, 0.5) !important;",
    "}",
    "#sw-fab:active { transform: scale(0.93) !important; }",
    "#sw-fab.sw-open { border-radius: 16px !important; box-shadow: 0 8px 20px -2px " + rgba(COLOR, 0.45) + " !important; }",

    ".sw-fab-icon { position: absolute !important; inset: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; }",
    "#sw-icon-chat { opacity: 1 !important; transform: scale(1) rotate(0deg) !important; }",
    "#sw-icon-chat svg { width: 26px !important; height: 26px !important; fill: none !important; stroke: white !important; stroke-width: 2 !important; stroke-linecap: round !important; stroke-linejoin: round !important; }",
    "#sw-icon-close { opacity: 0 !important; transform: scale(0.4) rotate(-180deg) !important; }",
    "#sw-icon-close svg { width: 22px !important; height: 22px !important; fill: none !important; stroke: white !important; stroke-width: 2.5 !important; stroke-linecap: round !important; }",
    "#sw-fab.sw-open #sw-icon-chat { opacity: 0 !important; transform: scale(0.4) rotate(180deg) !important; }",
    "#sw-fab.sw-open #sw-icon-close { opacity: 1 !important; transform: scale(1) rotate(0deg) !important; }",

    "#sw-dot {",
    "  position: absolute !important; top: -2px !important; " + (SIDE === "right" ? "right: -2px;" : "left: -2px;") + " !important;",
    "  width: 13px !important; height: 13px !important; border-radius: 50% !important;",
    "  background: #10b981 !important; border: 2.5px solid white !important;",
    "  box-shadow: 0 0 6px #10b981 !important;",
    "}",

    /* ── Apple Spatial Chat Drawer ─────────────────────────────────────── */
    "#sw-panel {",
    "  position: fixed !important; " + SIDE + ": 20px !important; bottom: 88px !important;",
    "  width: 384px !important; height: 600px !important;",
    "  max-width: calc(100vw - 32px) !important;",
    "  max-height: calc(100svh - 105px) !important;",
    "  border-radius: 22px !important; overflow: hidden !important;",
    "  background: " + (DARK ? "#0f172a" : "#ffffff") + " !important;",
    "  border: 1px solid " + (DARK ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)") + " !important;",
    "  box-shadow:",
    "    0 24px 60px -12px rgba(0, 0, 0, " + (DARK ? "0.6" : "0.2") + "),",
    "    0 6px 20px -4px rgba(0, 0, 0, 0.08) !important;",
    "  z-index: 2147483646 !important;",
    "  transform-origin: bottom " + SIDE + " !important;",
    "  transform: translateY(16px) scale(0.96) !important;",
    "  opacity: 0 !important; pointer-events: none !important;",
    "  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease !important;",
    "  display: flex !important; flex-direction: column !important;",
    "}",
    "#sw-panel.sw-open { transform: translateY(0) scale(1) !important; opacity: 1 !important; pointer-events: auto !important; }",
    "#sw-iframe { width: 100% !important; flex: 1 !important; border: none !important; display: block !important; min-height: 0 !important; background: transparent !important; }",

    /* Mobile Sheet Adaptation */
    "@media(max-width: 480px) {",
    "  #sw-root { " + SIDE + ": 14px !important; bottom: 14px !important; }",
    "  #sw-panel {",
    "    " + SIDE + ": 0 !important; bottom: 0 !important; right: 0 !important; left: 0 !important;",
    "    width: 100% !important; height: 100dvh !important; max-height: 100dvh !important; max-width: 100vw !important;",
    "    border-radius: 0 !important; border: none !important;",
    "    transform-origin: bottom center !important;",
    "  }",
    "  #sw-fab { width: 54px !important; height: 54px !important; border-radius: 16px !important; }",
    "}",
  ].join("\n");

  var styleEl = document.createElement("style");
  styleEl.id = "sw-styles";
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── DOM Construction ───────────────────────────────────────────────────────
  var root = document.createElement("div");
  root.id = "sw-root";

  // iOS Toast Notification
  var toast = document.createElement("div");
  toast.id = "sw-toast";
  toast.setAttribute("role", "button");
  toast.setAttribute("aria-label", "Notification from " + NAME);
  toast.innerHTML = [
    '<div id="sw-toast-icon">',
    '  <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    '  <div id="sw-toast-online"></div>',
    "</div>",
    '<div id="sw-toast-body">',
    '  <div id="sw-toast-header">',
    '    <span id="sw-toast-title">' + NAME + "</span>",
    '    <span id="sw-toast-time">now</span>',
    "  </div>",
    '  <div id="sw-toast-msg">' + GREETING + "</div>",
    "</div>",
    '<button id="sw-toast-close" aria-label="Dismiss" title="Dismiss">',
    '  <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    "</button>",
  ].join("");
  root.appendChild(toast);

  // FAB
  var fab = document.createElement("button");
  fab.id = "sw-fab";
  fab.setAttribute("aria-label", "Chat with " + NAME);
  fab.innerHTML = [
    '<div class="sw-fab-icon" id="sw-icon-chat">',
    '  <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>',
    "</div>",
    '<div class="sw-fab-icon" id="sw-icon-close">',
    '  <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    "</div>",
    '<div id="sw-dot"></div>',
  ].join("");
  root.appendChild(fab);

  // Panel
  var panel = document.createElement("div");
  panel.id = "sw-panel";

  var iframeSrc =
    BASE_URL +
    "/embed/" +
    encodeURIComponent(KEY) +
    "?color=" +
    encodeURIComponent(COLOR) +
    "&name=" +
    encodeURIComponent(NAME) +
    "&theme=" +
    encodeURIComponent(THEME) +
    (GREETING ? "&greeting=" + encodeURIComponent(GREETING) : "");

  var iframe = document.createElement("iframe");
  iframe.id = "sw-iframe";
  iframe.src = iframeSrc;
  iframe.setAttribute("allow", "clipboard-write; microphone");
  iframe.setAttribute("title", NAME + " Chat");
  panel.appendChild(iframe);

  // ── State & Interactions ───────────────────────────────────────────────────
  var isOpen = false;

  function openWidget(promptText) {
    if (isOpen) {
      if (promptText && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "stratos_send_prompt", prompt: promptText }, "*");
      }
      return;
    }
    isOpen = true;
    panel.classList.add("sw-open");
    fab.classList.add("sw-open");
    toast.classList.remove("sw-in");
    var dot = document.getElementById("sw-dot");
    if (dot) dot.style.display = "none";
    if (window.innerWidth <= 480) document.body.style.overflow = "hidden";

    if (promptText && iframe.contentWindow) {
      setTimeout(function () {
        iframe.contentWindow.postMessage({ type: "stratos_send_prompt", prompt: promptText }, "*");
      }, 350);
    }
  }

  function closeWidget() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove("sw-open");
    fab.classList.remove("sw-open");
    if (window.innerWidth <= 480) document.body.style.overflow = "";
  }

  fab.onclick = function (e) {
    e.stopPropagation();
    isOpen ? closeWidget() : openWidget();
  };

  toast.onclick = function (e) {
    if (e.target.closest("#sw-toast-close")) return;
    openWidget();
  };

  var dismissBtn = toast.querySelector("#sw-toast-close");
  if (dismissBtn) {
    dismissBtn.onclick = function (e) {
      e.stopPropagation();
      toast.classList.remove("sw-in");
      setTimeout(function () {
        toast.style.display = "none";
      }, 350);
    };
  }

  // Show toast notification after 2 seconds
  setTimeout(function () {
    if (!isOpen) toast.classList.add("sw-in");
  }, 2000);

  // Auto-hide toast after 14 seconds
  setTimeout(function () {
    if (!isOpen) toast.classList.remove("sw-in");
  }, 14000);

  // ── PostMessage Bridge ─────────────────────────────────────────────────────
  window.addEventListener("message", function (ev) {
    if (!ev.data) return;
    if (ev.data.type === "stratos_close_widget") closeWidget();
    if (ev.data.type === "stratos_open_widget") openWidget(ev.data.prompt);
    if (ev.data.type === "stratos_widget_config" && ev.data.color) {
      var c = ev.data.color;
      var newGrad = "linear-gradient(135deg, " + lighten(c, 0.18) + " 0%, " + c + " 60%, " + darken(c, 0.75) + " 100%)";
      fab.style.background = newGrad;
      fab.style.boxShadow = "0 12px 28px -4px " + rgba(c, 0.55) + ", 0 4px 10px -2px " + rgba(c, 0.3);
      var avatar = document.getElementById("sw-toast-icon");
      if (avatar) avatar.style.background = newGrad;
    }
  });

  // ── Mount ──────────────────────────────────────────────────────────────────
  function mount() {
    document.body.appendChild(panel);
    document.body.appendChild(root);
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", mount)
    : mount();
})();
