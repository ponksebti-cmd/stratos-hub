---
name: widget + embed architecture
description: How the embeddable chat widget and its iframe content work.
---

## Architecture
- `public/widget.js` — self-contained vanilla JS snippet; injected by client websites via `<script data-key="...">`. Creates FAB + teaser bubble + iframe panel DOM in the host page.
- `src/routes/embed.$agencyId.tsx` — the React route rendered inside the iframe. Fetches live config from `/widget/config/:agencyId`, handles lead capture form, then streams chat.
- Config params passed from widget.js to iframe via URL query string: `?color=&name=&theme=&greeting=`
- `postMessage` bridge: iframe sends `stratos_close_widget` and `stratos_widget_config` to parent; parent widget.js listens and updates FAB color / closes panel.

## Widget.js structure (v3)
- FAB: rounded square (border-radius: 18px), pulse keyframe animation, spring open/close transition
- Teaser bubble: glassmorphism card, auto-shown after 2.5s, auto-hidden after 14.5s, dismiss button
- Panel: 400×620px desktop, full-screen on mobile (≤480px), spring scale+translateY animation
- Position: supports `data-position="right|left"`, affects teaser bubble corner rounding too

**Why separate:** widget.js must be zero-dependency vanilla JS (no React, no bundler) because it runs on arbitrary customer websites. The iframe loads React normally inside the sandbox.
