import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  ChevronDown,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Sun,
  Moon,
  Building2,
  Calendar,
  CheckCheck,
  Check,
  Copy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import { generateRealEstateAIResponse } from "@/lib/mock-data";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Route Schema ────────────────────────────────────────────────────────────

const searchSchema = z.object({
  color: z.string().optional().default("#6366f1"),
  name: z.string().optional().default("Sarah - Property Concierge"),
  greeting: z
    .string()
    .optional()
    .default(
      "Hi there! 👋 Looking for your dream property? I'm here to help you explore listings, compare prices, and schedule VIP tours.",
    ),
  theme: z.enum(["light", "dark"]).optional().default("light"),
});

export const Route = createFileRoute("/embed/$agencyId")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "AI Property Concierge" }] }),
  component: EmbedWidget,
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmbedMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  showProperties?: boolean;
}

interface PropertyCardData {
  id: string;
  title: string;
  price: string;
  beds: string;
  baths: string;
  area: string;
  badge: string;
}

const FEATURED_PROPERTIES: PropertyCardData[] = [
  {
    id: "p1",
    title: "The Palm Reserve Villa, Marbella",
    price: "€1,250,000",
    beds: "4 Beds",
    baths: "4 Baths",
    area: "4,800 sq ft",
    badge: "For Sale · Verified",
  },
  {
    id: "p2",
    title: "Sky Crest Penthouse, Dubai Marina",
    price: "AED 12,000/mo",
    beds: "3 Beds",
    baths: "3 Baths",
    area: "3,200 sq ft",
    badge: "For Rent · Sea View",
  },
];

const QUICK_PROMPTS = [
  "Looking to buy a luxury villa",
  "Show penthouses with sea view",
  "Schedule a private property tour",
  "What properties have 8%+ yields?",
];

// ─── Web Audio API (Zero Latency Apple Chimes) ───────────────────────────────

function playChime(type: "send" | "receive") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "send") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      osc2.frequency.setValueAtTime(987.77, ctx.currentTime + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Ignore autoplay restriction
  }
}

// ─── Color Helpers ───────────────────────────────────────────────────────────

function hexToRgb(h: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  if (!r) return [99, 102, 241];
  return [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)];
}

function darken(hex: string, factor = 0.72): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return hex;
  const ch = (v: string) =>
    Math.round(parseInt(v, 16) * factor)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(r[1])}${ch(r[2])}${ch(r[3])}`;
}

function lighten(hex: string, factor = 0.2): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return hex;
  const ch = (v: string) =>
    Math.min(255, Math.round(parseInt(v, 16) + (255 - parseInt(v, 16)) * factor))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(r[1])}${ch(r[2])}${ch(r[3])}`;
}

// ─── Sub-Component: Typing Dots ──────────────────────────────────────────────

function TypingDots({ dark, color }: { dark: boolean; color: string }) {
  return (
    <div className="flex items-end gap-2 animate-in fade-in duration-200">
      <div
        className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${lighten(color, 0.2)} 0%, ${color} 100%)`,
        }}
      >
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div
        className={cn(
          "px-3.5 py-2.5 rounded-2xl rounded-bl-sm border shadow-sm flex items-center gap-1.5",
          dark ? "bg-slate-800/90 border-slate-700/80" : "bg-white border-slate-200/80",
        )}
      >
        <span className="text-[11px] font-medium text-slate-400">Thinking</span>
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full animate-bounce"
              style={{
                backgroundColor: color,
                animationDelay: `${i * 0.15}s`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function EmbedWidget() {
  const { agencyId } = Route.useParams();
  const searchParams = Route.useSearch();

  const [color, setColor] = useState(searchParams.color || "#6366f1");
  const [botName, setBotName] = useState(searchParams.name || "Sarah - Property Concierge");
  const [greeting, setGreeting] = useState(
    searchParams.greeting ||
      "Hi there! 👋 Looking for your dream property? I'm here to help you explore listings, compare prices, and schedule VIP tours.",
  );
  const [isDark, setIsDark] = useState(searchParams.theme === "dark");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Synchronize iframe root HTML and Body classes to match theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#0f172a";
      document.body.style.color = "#f8fafc";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#f8fafc";
      document.body.style.color = "#0f172a";
    }
  }, [isDark]);

  // Messages
  const [messages, setMessages] = useState<EmbedMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: greeting,
      createdAt: new Date().toISOString(),
      showProperties: false,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setScrolled(!near);
  }, []);

  // Listen to postMessage from parent
  useEffect(() => {
    const handleMsg = (ev: MessageEvent) => {
      if (!ev.data) return;
      if (ev.data.type === "stratos_send_prompt" && ev.data.prompt) {
        send(ev.data.prompt);
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  // Fetch live widget config if available
  useEffect(() => {
    fetch(`${API_BASE_URL}/widget/config/${agencyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          if (data.color) setColor(data.color);
          if (data.name) setBotName(data.name);
          if (data.greeting) setGreeting(data.greeting);
          if (data.theme) setIsDark(data.theme === "dark");
        }
      })
      .catch(() => {});
  }, [agencyId]);

  // Send message
  const send = async (text?: string) => {
    const content = (text ?? draft).trim();
    if (!content || typing) return;
    setDraft("");

    if (soundEnabled) playChime("send");

    const userMsg: EmbedMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    const assistantMsgId = crypto.randomUUID();
    const shouldShowListingCards = /villa|penthouse|apartment|property|tour|visit|viewing|rent|buy/i.test(
      content,
    );

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        showProperties: shouldShowListingCards,
      },
    ]);

    try {
      const res = await fetch(`${API_BASE_URL}/chat/widget?stream=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, message: content }),
      });

      if (!res.ok) throw new Error("Backend stream error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (reader && !done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") continue;
              try {
                const data = JSON.parse(dataStr);
                if (data.type === "chunk") {
                  setMessages((m) =>
                    m.map((msg) =>
                      msg.id === assistantMsgId ? { ...msg, content: msg.content + data.text } : msg,
                    ),
                  );
                } else if (data.type === "done") {
                  if (soundEnabled) playChime("receive");
                  setMessages((m) =>
                    m.map((msg) =>
                      msg.id === assistantMsgId ? { ...msg, content: data.message } : msg,
                    ),
                  );
                }
              } catch {}
            }
          }
        }
      }
    } catch {
      // Local fallback response generator
      const reply = generateRealEstateAIResponse(content);
      let acc = "";
      for (let i = 0; i < reply.length; i += 4) {
        acc += reply.slice(i, i + 4);
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantMsgId ? { ...msg, content: acc } : msg)),
        );
        await new Promise((r) => setTimeout(r, 14));
      }
      if (soundEnabled) playChime("receive");
    } finally {
      setTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const headerGrad = `linear-gradient(135deg, ${lighten(color, 0.15)} 0%, ${color} 60%, ${darken(color, 0.75)} 100%)`;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        html, body, #root {
          height: 100%;
          width: 100%;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }
        .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }
      `}</style>

      <div
        className={cn(
          "flex flex-col w-full h-full select-none overflow-hidden",
          isDark ? "bg-[#0f172a] text-slate-100" : "bg-[#f8fafc] text-slate-900",
        )}
      >
        {/* ── Apple Glass Header ──────────────────────────────────────────── */}
        <header
          className="flex items-center justify-between px-4 py-3.5 flex-shrink-0 relative z-20 shadow-md border-b border-white/10"
          style={{ background: headerGrad }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 overflow-hidden shadow-sm">
                <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
            </div>

            <div className="min-w-0">
              <h1 className="text-[14px] font-bold text-white leading-tight truncate">
                {botName}
              </h1>
              <div className="text-[11px] text-white/80 flex items-center gap-1 font-medium mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Online · Instant Answers</span>
              </div>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              title={isDark ? "Light mode" : "Dark mode"}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-black/10 hover:bg-black/20 text-white/90 hover:text-white transition-all active:scale-95"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute chimes" : "Enable chimes"}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-black/10 hover:bg-black/20 text-white/90 hover:text-white transition-all active:scale-95"
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 opacity-60" />}
            </button>

            {/* Reset Chat */}
            <button
              onClick={() =>
                setMessages([
                  {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: greeting,
                    createdAt: new Date().toISOString(),
                  },
                ])
              }
              title="Reset conversation"
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-black/10 hover:bg-black/20 text-white/90 hover:text-white transition-all active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Close Widget */}
            <button
              onClick={() => {
                if (window.parent) {
                  window.parent.postMessage({ type: "stratos_close_widget" }, "*");
                }
              }}
              title="Close"
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-black/15 hover:bg-black/30 text-white transition-all active:scale-90 ml-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ── Chat Messages Stream (Immediate Access, Zero Blocking) ──────── */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 relative"
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-1.5 group animate-in fade-in duration-200",
                  isUser ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "flex items-end gap-2 max-w-[88%]",
                    isUser ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  {!isUser && (
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${lighten(color, 0.2)} 0%, ${color} 100%)`,
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-sm border",
                      isUser
                        ? "rounded-br-sm text-white font-medium border-transparent"
                        : isDark
                          ? "rounded-bl-sm bg-slate-800/90 text-slate-100 border-slate-700/80 shadow-black/20"
                          : "rounded-bl-sm bg-white text-slate-800 border-slate-200/90 shadow-slate-200/50",
                    )}
                    style={
                      isUser
                        ? {
                            background: `linear-gradient(135deg, ${lighten(color, 0.15)} 0%, ${color} 100%)`,
                          }
                        : undefined
                    }
                  >
                    <div className="select-text whitespace-pre-wrap">
                      {isUser ? (
                        msg.content
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_strong]:font-bold">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex items-center justify-end gap-1 text-[10px] mt-1 opacity-70",
                        isUser ? "text-white" : isDark ? "text-slate-400" : "text-slate-500",
                      )}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isUser ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Copy"
                          className="opacity-0 group-hover:opacity-100 hover:text-indigo-400 ml-1 transition-opacity"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Property Recommendation Cards */}
                {msg.showProperties && (
                  <div className="w-full pl-9 pr-1 pt-1 flex flex-col gap-2 animate-in fade-in duration-300">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-indigo-500" />
                      <span>Available Matching Residences</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {FEATURED_PROPERTIES.map((prop) => (
                        <div
                          key={prop.id}
                          className={cn(
                            "p-2.5 rounded-xl border flex flex-col gap-1.5 shadow-sm transition-all hover:border-indigo-400",
                            isDark
                              ? "bg-slate-800/80 border-slate-700/80"
                              : "bg-white border-slate-200",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {prop.title}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-500 font-mono">
                              {prop.price}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>
                              {prop.beds} · {prop.baths} · {prop.area}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                              {prop.badge}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              send(
                                `I'm interested in ${prop.title} (${prop.price}). Please schedule a VIP walkthrough for me.`,
                              )
                            }
                            className="mt-0.5 py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
                          >
                            <Calendar className="h-3 w-3" />
                            <span>Book Private Tour</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {typing && <TypingDots dark={isDark} color={color} />}

          <div ref={bottomRef} />

          {/* Jump to bottom button */}
          {scrolled && (
            <button
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center z-10 hover:scale-110 active:scale-95 transition-all"
            >
              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </button>
          )}
        </div>

        {/* ── Quick Prompts Carousel ──────────────────────────────────────── */}
        <div
          className={cn(
            "px-3 py-1.5 border-t flex gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0",
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-100",
          )}
          style={{ scrollbarWidth: "none" }}
        >
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              disabled={typing}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full font-medium border whitespace-nowrap transition-all active:scale-95 disabled:opacity-50 flex-shrink-0",
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-400 hover:text-white"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50",
              )}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* ── Input Dock ──────────────────────────────────────────────────── */}
        <div
          className={cn(
            "p-3 flex-shrink-0 border-t",
            isDark ? "bg-[#0b0e17] border-slate-800/80" : "bg-white border-slate-200/80",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all",
              isDark
                ? "bg-slate-800/60 border-slate-700 focus-within:border-indigo-500 focus-within:bg-slate-800"
                : "bg-slate-50 border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-sm",
            )}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about properties, pricing, showings..."
              className={cn(
                "flex-1 bg-transparent outline-none text-[13px] font-medium placeholder:text-slate-400 min-w-0",
                isDark ? "text-white" : "text-slate-900",
              )}
            />

            <button
              onClick={() => send()}
              disabled={!draft.trim() || typing}
              className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm hover:brightness-110 active:scale-90 disabled:opacity-30 disabled:grayscale"
              style={{ background: headerGrad }}
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
