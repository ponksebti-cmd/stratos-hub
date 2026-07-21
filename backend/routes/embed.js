// routes/embed.js — Self-contained iframe chat UI for the widget
import db from "../db.js";

export async function handleEmbed(req, agencyId) {
  const url = new URL(req.url);
  const color  = url.searchParams.get("color")    || "#6366f1";
  const name   = url.searchParams.get("name")     || "Property Assistant";
  const theme  = url.searchParams.get("theme")    || "light";
  const greeting = url.searchParams.get("greeting") || "Hi! How can I help you today?";

  // Derive the base API URL from the request itself so it always points to the right backend
  const baseUrl = `${url.protocol}//${url.host}`;

  const dark = theme === "dark";
  const bg        = dark ? "#0f172a"  : "#ffffff";
  const chatBg    = dark ? "#0f172a"  : "#f8fafc";
  const msgBg     = dark ? "rgba(255,255,255,0.08)" : "#ffffff";
  const inputBg   = dark ? "#111827"  : "#ffffff";
  const inputBorder = dark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
  const textColor = dark ? "#f1f5f9"  : "#0f172a";
  const mutedColor = dark ? "rgba(255,255,255,0.4)" : "#64748b";
  const footerBg  = dark ? "#0f172a"  : "#f8fafc";
  const footerColor = dark ? "rgba(255,255,255,0.25)" : "#94a3b8";

  // Simple color helpers (inline, no deps)
  function hexToRgb(h) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    if (!r) return [99, 102, 241];
    return [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)];
  }
  function darken(h, f = 0.72) {
    const [r,g,b] = hexToRgb(h);
    return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
  }
  function lighten(h, f = 0.15) {
    const [r,g,b] = hexToRgb(h);
    return `rgb(${Math.min(255,Math.round(r+(255-r)*f))},${Math.min(255,Math.round(g+(255-g)*f))},${Math.min(255,Math.round(b+(255-b)*f))})`;
  }
  function rgba(h, a) {
    const [r,g,b] = hexToRgb(h);
    return `rgba(${r},${g},${b},${a})`;
  }

  const grad = `linear-gradient(135deg, ${lighten(color)} 0%, ${color} 55%, ${darken(color)} 100%)`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{height:100%;overflow:hidden;}
    body{
      font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:${bg};
      color:${textColor};
      display:flex;flex-direction:column;
    }

    /* ── Header ── */
    #sh-header{
      flex-shrink:0;
      background:${grad};
      padding:12px 14px;
      display:flex;align-items:center;gap:10px;
    }
    #sh-avatar{
      width:34px;height:34px;border-radius:50%;
      background:rgba(255,255,255,0.2);
      backdrop-filter:blur(8px);
      border:1.5px solid rgba(255,255,255,0.35);
      display:flex;align-items:center;justify-content:center;
      flex-shrink:0;position:relative;
    }
    #sh-avatar svg{width:16px;height:16px;fill:none;stroke:white;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
    #sh-online-dot{
      position:absolute;bottom:1px;right:1px;
      width:9px;height:9px;border-radius:50%;
      background:#34d399;border:1.5px solid white;
    }
    #sh-header-info{flex:1;min-width:0;}
    #sh-name{font-size:13px;font-weight:600;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    #sh-status{font-size:10px;color:rgba(255,255,255,0.75);margin-top:2px;display:flex;align-items:center;gap:4px;}
    #sh-status-dot{width:6px;height:6px;border-radius:50%;background:#34d399;animation:pulse 2s infinite;}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}

    /* ── Messages ── */
    #sh-messages{
      flex:1;overflow-y:auto;overflow-x:hidden;
      padding:16px 12px;display:flex;flex-direction:column;gap:12px;
      background:${chatBg};
      scroll-behavior:smooth;
    }
    #sh-messages::-webkit-scrollbar{width:4px;}
    #sh-messages::-webkit-scrollbar-track{background:transparent;}
    #sh-messages::-webkit-scrollbar-thumb{background:${rgba(color,0.25)};border-radius:4px;}

    .sh-row{display:flex;align-items:flex-end;gap:7px;}
    .sh-row.user{flex-direction:row-reverse;}
    .sh-bubble-avatar{
      width:22px;height:22px;border-radius:50%;flex-shrink:0;
      background:${color};
      display:flex;align-items:center;justify-content:center;
    }
    .sh-bubble-avatar svg{width:11px;height:11px;fill:none;stroke:white;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
    .sh-bubble{
      max-width:78%;padding:9px 12px;border-radius:14px;
      font-size:13px;line-height:1.55;word-break:break-word;
    }
    .sh-bubble.bot{
      background:${msgBg};color:${textColor};
      border-bottom-left-radius:3px;
      box-shadow:0 1px 4px rgba(0,0,0,0.07);
    }
    .sh-bubble.user{
      background:${color};color:white;
      border-bottom-right-radius:3px;
      box-shadow:0 2px 8px ${rgba(color,0.35)};
    }
    .sh-bubble p{margin-bottom:6px;}
    .sh-bubble p:last-child{margin-bottom:0;}
    .sh-bubble strong{font-weight:600;}
    .sh-bubble em{font-style:italic;}
    .sh-bubble ul,.sh-bubble ol{padding-left:18px;margin:4px 0;}
    .sh-bubble li{margin-bottom:3px;}
    .sh-bubble a{color:${dark?'#93c5fd':'#4f46e5'};text-decoration:underline;}
    .sh-bubble img{max-width:100%;border-radius:8px;margin-top:6px;}

    /* Typing indicator */
    .sh-typing{display:flex;gap:4px;align-items:center;padding:10px 12px;}
    .sh-dot{width:7px;height:7px;border-radius:50%;background:${mutedColor};animation:bounce 1s infinite;}
    .sh-dot:nth-child(2){animation-delay:0.15s;}
    .sh-dot:nth-child(3){animation-delay:0.3s;}
    @keyframes bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}

    /* Thought process */
    .sh-thought{
      font-size:11px;color:${mutedColor};font-style:italic;
      padding:6px 12px;background:${rgba(color,0.06)};
      border-left:2px solid ${rgba(color,0.3)};
      border-radius:4px;margin:2px 0;
    }

    /* ── Input bar ── */
    #sh-input-bar{
      flex-shrink:0;
      padding:10px 12px;
      border-top:1px solid ${inputBorder};
      background:${inputBg};
      display:flex;align-items:flex-end;gap:8px;
    }
    #sh-input{
      flex:1;border:1px solid ${inputBorder};
      border-radius:10px;
      padding:9px 12px;
      font-size:13px;font-family:inherit;
      background:${chatBg};color:${textColor};
      resize:none;outline:none;
      max-height:100px;overflow-y:auto;line-height:1.5;
      transition:border-color 0.2s;
    }
    #sh-input:focus{border-color:${color};}
    #sh-input::placeholder{color:${mutedColor};}
    #sh-send{
      width:34px;height:34px;border-radius:10px;border:none;
      background:${grad};color:white;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      flex-shrink:0;transition:opacity 0.2s,transform 0.15s;
    }
    #sh-send:hover{opacity:0.88;transform:translateY(-1px);}
    #sh-send:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
    #sh-send svg{width:15px;height:15px;fill:none;stroke:white;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}

    /* ── Footer ── */
    #sh-footer{
      flex-shrink:0;text-align:center;
      padding:5px 12px 7px;
      font-size:10px;color:${footerColor};
      background:${footerBg};
      display:flex;align-items:center;justify-content:center;gap:4px;
    }
    #sh-footer svg{width:10px;height:10px;fill:none;stroke:${footerColor};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}

    /* Markdown rendered output */
    .sh-bubble h1,.sh-bubble h2,.sh-bubble h3{font-weight:700;margin:8px 0 4px;}
    .sh-bubble code{background:rgba(0,0,0,0.08);padding:1px 5px;border-radius:4px;font-size:12px;}
    .sh-bubble pre{background:rgba(0,0,0,0.08);padding:8px;border-radius:6px;overflow-x:auto;font-size:12px;}
  </style>
</head>
<body>

  <!-- Header -->
  <div id="sh-header">
    <div id="sh-avatar">
      <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      <div id="sh-online-dot"></div>
    </div>
    <div id="sh-header-info">
      <div id="sh-name">${name.replace(/</g,"&lt;")}</div>
      <div id="sh-status">
        <span id="sh-status-dot"></span>
        <span>Online now</span>
      </div>
    </div>
  </div>

  <!-- Messages -->
  <div id="sh-messages"></div>

  <!-- Input -->
  <div id="sh-input-bar">
    <textarea id="sh-input" placeholder="Type a message…" rows="1" aria-label="Chat message"></textarea>
    <button id="sh-send" title="Send message" disabled>
      <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    </button>
  </div>

  <!-- Footer -->
  <div id="sh-footer">
    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    Powered by <strong style="margin-left:3px">Stratos Hub</strong>
  </div>

<script>
(function() {
  var AGENCY_ID = ${JSON.stringify(agencyId)};
  var BASE_URL  = ${JSON.stringify(baseUrl)};
  var GREETING  = ${JSON.stringify(greeting)};

  var sessionId = null;
  var isStreaming = false;

  var messagesEl = document.getElementById("sh-messages");
  var inputEl    = document.getElementById("sh-input");
  var sendBtn    = document.getElementById("sh-send");

  // ── Simple markdown renderer ──────────────────────────────────────────────
  function renderMarkdown(text) {
    return text
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      // headers
      .replace(/^### (.+)$/gm,"<h3>$1</h3>")
      .replace(/^## (.+)$/gm,"<h2>$1</h2>")
      .replace(/^# (.+)$/gm,"<h1>$1</h1>")
      // bold/italic
      .replace(/\\*\\*(.+?)\\*\\*/g,"<strong>$1</strong>")
      .replace(/\\*(.+?)\\*/g,"<em>$1</em>")
      // code
      .replace(/\`(.+?)\`/g,"<code>$1</code>")
      // images
      .replace(/!\\[([^\\]]*?)\\]\\(([^)]+)\\)/g,'<img src="$2" alt="$1"/>')
      // links
      .replace(/\\[([^\\]]+?)\\]\\(([^)]+)\\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
      // lists
      .replace(/^\\* (.+)$/gm,"<li>$1</li>")
      .replace(/^- (.+)$/gm,"<li>$1</li>")
      .replace(/^\\d+\\. (.+)$/gm,"<li>$1</li>")
      // line breaks -> paragraphs
      .split(/\\n\\n+/)
      .map(function(p){ return p.trim() ? "<p>"+p.replace(/\\n/g,"<br/>")+"</p>" : ""; })
      .join("");
  }

  // ── Append message ────────────────────────────────────────────────────────
  function appendMessage(role, content, id) {
    var row = document.createElement("div");
    row.className = "sh-row " + (role==="user" ? "user" : "");
    if (id) row.id = id;

    if (role !== "user") {
      var av = document.createElement("div");
      av.className = "sh-bubble-avatar";
      av.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
      row.appendChild(av);
    }

    var bubble = document.createElement("div");
    bubble.className = "sh-bubble " + (role==="user" ? "user" : "bot");
    if (content) bubble.innerHTML = renderMarkdown(content);
    row.appendChild(bubble);

    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  // ── Typing indicator ──────────────────────────────────────────────────────
  function showTyping() {
    var row = document.createElement("div");
    row.className = "sh-row";
    row.id = "sh-typing-row";
    var av = document.createElement("div");
    av.className = "sh-bubble-avatar";
    av.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
    row.appendChild(av);
    var typing = document.createElement("div");
    typing.className = "sh-bubble bot sh-typing";
    typing.innerHTML = '<div class="sh-dot"></div><div class="sh-dot"></div><div class="sh-dot"></div>';
    row.appendChild(typing);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    var el = document.getElementById("sh-typing-row");
    if (el) el.remove();
  }

  // ── Send a message ────────────────────────────────────────────────────────
  async function send(text) {
    if (!text.trim() || isStreaming) return;
    isStreaming = true;
    sendBtn.disabled = true;

    appendMessage("user", text);

    showTyping();

    try {
      var res = await fetch(BASE_URL + "/chat/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: AGENCY_ID,
          message: text,
          sessionId: sessionId,
          stream: true
        })
      });

      if (!res.ok || !res.body) {
        hideTyping();
        appendMessage("bot", "Sorry, something went wrong. Please try again.");
        return;
      }

      hideTyping();

      // Streaming
      var aiBubble = appendMessage("bot", "");
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";
      var accumulated = "";

      while (true) {
        var _ref = await reader.read();
        var done = _ref.done, value = _ref.value;
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        var lines = buffer.split("\\n");
        buffer = lines.pop() || "";

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (!line.startsWith("data: ")) continue;
          var dataStr = line.slice(6).trim();
          try {
            var data = JSON.parse(dataStr);
            if (data.type === "chunk" && data.text) {
              accumulated += data.text;
              // Strip thought_process tags for display
              var display = accumulated.replace(/<thought_process>[\\s\\S]*?<\\/thought_process>\\n*/g, "");
              aiBubble.innerHTML = renderMarkdown(display);
              messagesEl.scrollTop = messagesEl.scrollHeight;
            } else if (data.type === "done") {
              if (data.sessionId) sessionId = data.sessionId;
              var final = (data.message || accumulated)
                .replace(/<thought_process>[\\s\\S]*?<\\/thought_process>\\n*/g, "")
                .trim();
              aiBubble.innerHTML = renderMarkdown(final);
              messagesEl.scrollTop = messagesEl.scrollHeight;
            }
          } catch(e) {}
        }
      }

      // Fallback if no done event
      if (accumulated && !aiBubble.innerHTML) {
        var fallback = accumulated.replace(/<thought_process>[\\s\\S]*?<\\/thought_process>\\n*/g,"").trim();
        aiBubble.innerHTML = renderMarkdown(fallback);
      }

    } catch(err) {
      hideTyping();
      appendMessage("bot", "Connection error. Please check your internet and try again.");
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  // ── Input auto-resize ─────────────────────────────────────────────────────
  inputEl.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 100) + "px";
    sendBtn.disabled = !this.value.trim() || isStreaming;
  });

  inputEl.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      var text = this.value.trim();
      if (text && !isStreaming) {
        this.value = "";
        this.style.height = "auto";
        sendBtn.disabled = true;
        send(text);
      }
    }
  });

  sendBtn.addEventListener("click", function() {
    var text = inputEl.value.trim();
    if (text && !isStreaming) {
      inputEl.value = "";
      inputEl.style.height = "auto";
      sendBtn.disabled = true;
      send(text);
    }
  });

  // ── Init: show greeting ───────────────────────────────────────────────────
  if (GREETING) {
    setTimeout(function() {
      appendMessage("bot", GREETING);
      sendBtn.disabled = false;
    }, 300);
  } else {
    sendBtn.disabled = false;
  }

  // Let parent know we're loaded (for postMessage resize etc)
  try { window.parent.postMessage({ type: "sh-ready" }, "*"); } catch(e) {}
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "ALLOWALL",
      "Cache-Control": "no-cache, no-store",
    }
  });
}
