import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  ChevronDown,
  Lock,
  X,
  Phone,
  User,
  Mail,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Route ──────────────────────────────────────────────────────────────────

const searchSchema = z.object({
  color: z.string().optional().default("#6366f1"),
  name: z.string().optional().default("Property Assistant"),
  greeting: z
    .string()
    .optional()
    .default("Hi! I can help you find your perfect property. What are you looking for?"),
  theme: z.enum(["light", "dark"]).optional().default("light"),
});

export const Route = createFileRoute("/embed/$agencyId")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Chat" }] }),
  component: EmbedWidget,
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmbedMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// ─── Quick suggestions ───────────────────────────────────────────────────────

const QUICK = ["Looking to buy", "Looking to rent", "Just browsing"] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function darken(hex: string, factor = 0.72): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return hex;
  const ch = (v: string) =>
    Math.round(parseInt(v, 16) * factor)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(r[1])}${ch(r[2])}${ch(r[3])}`;
}

function alpha(hex: string, a: number): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return `rgba(99,102,241,${a})`;
  return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${a})`;
}

function parseMessage(content: string) {
  const match = content.match(/<thought_process>([\s\S]*?)<\/thought_process>/);
  if (match) {
    return {
      thoughtProcess: match[1].trim(),
      cleanContent: content.replace(match[0], "").trim(),
    };
  }
  return { thoughtProcess: null, cleanContent: content };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypingDots({ dark }: { dark: boolean }) {
  return (
    <div className="flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ background: "var(--accent-color)" }}
      >
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div
        className={cn(
          "px-4 py-3 rounded-2xl rounded-bl-none shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]",
          dark ? "bg-white/10 border border-white/5" : "bg-white border border-slate-100",
        )}
      >
        <div className="flex gap-1.5 items-center h-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full animate-bounce",
                dark ? "bg-white/50" : "bg-indigo-400",
              )}
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface BubbleProps {
  msg: EmbedMsg;
  dark: boolean;
  isLatest: boolean;
}

function Bubble({ msg, dark, isLatest }: BubbleProps) {
  const { t } = useTranslation();
  const isUser = msg.role === "user";
  const { thoughtProcess, cleanContent } = parseMessage(msg.content);

  return (
    <div
      className={cn(
        "flex items-end gap-2.5 group",
        isUser ? "flex-row-reverse" : "flex-row",
        isLatest && "animate-[widget-pop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)_both]",
      )}
    >
      {!isUser && (
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-1 shadow-md ring-2 ring-white/10"
          style={{ background: "var(--accent-color)" }}
        >
          <img src="/logo.png" alt="AI" className="h-5 w-5 object-contain" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] px-4 py-3 rounded-[20px] text-[14px] leading-relaxed shadow-[0_3px_12px_-3px_rgba(0,0,0,0.08)] flex flex-col gap-2 transition-all relative",
          isUser
            ? "rounded-br-none text-white font-medium"
            : dark
              ? "bg-white/10 text-slate-100 rounded-bl-none border border-white/10 prose-invert prose prose-sm prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-white"
              : "bg-white text-slate-800 rounded-bl-none border border-slate-200/60 prose prose-sm prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-slate-900",
        )}
        style={isUser ? { background: "var(--accent-color)" } : undefined}
      >
        {!isUser && thoughtProcess && (
          <details className="text-[11px] opacity-80 border-b border-current/10 pb-2 mb-1 group/tp">
            <summary className="cursor-pointer list-none flex items-center gap-2 font-bold tracking-wider uppercase text-[10px]">
              <div className="p-1 rounded-md bg-primary/10">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              </div>
              {t("Thinking Process")}
              <ChevronDown className="h-3 w-3 ml-auto transition-transform duration-300 group-open/tp:rotate-180" />
            </summary>
            <div className="mt-2 font-mono text-[11px] whitespace-pre-wrap leading-relaxed bg-black/5 p-2.5 rounded-xl border border-black/5">
              {thoughtProcess}
            </div>
          </details>
        )}
        <div dir="auto" className="break-words">
          {isUser ? (
            <div className="whitespace-pre-wrap">{cleanContent}</div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
          )}
        </div>
        <div
          className={cn(
            "text-[10px] mt-1 text-right font-semibold tracking-tight opacity-50",
            isUser ? "text-white" : "text-slate-500",
          )}
        >
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function EmbedWidget() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const { agencyId } = Route.useParams();
  const searchParams = Route.useSearch();

  // Default values until we fetch from DB
  const [config, setConfig] = useState({
    color: searchParams.color || "#6366f1",
    name: searchParams.name || t("Property Assistant"),
    greeting:
      searchParams.greeting ||
      t("Hi! I can help you find your perfect property. What are you looking for?"),
    theme: searchParams.theme || "light",
    position: "right",
  });

  const dark = config.theme === "dark";
  const botName = config.name;
  const color = config.color;
  const greeting = config.greeting;

  const [hasCapturedInfo, setHasCapturedInfo] = useState(false);
  const [captureForm, setCaptureForm] = useState({ name: "", email: "", phone: "" });
  const [captureError, setCaptureError] = useState("");

  const [messages, setMessages] = useState<EmbedMsg[]>([
    { id: "welcome", role: "assistant", content: greeting, createdAt: new Date().toISOString() },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Detect scroll position
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setScrolled(!near);
  }, []);

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load session from localStorage on mount & fetch live widget config
  useEffect(() => {
    fetch(`${API_BASE_URL}/widget/config/${agencyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setConfig((prev) => ({ ...prev, ...data }));
          setMessages((m) => {
            if (m.length === 1 && m[0].id === "welcome") {
              return [
                { ...m[0], content: data.greeting || prevGreeting, createdAt: m[0].createdAt },
              ];
            }
            return m;
          });
          if (window.parent) {
            window.parent.postMessage(
              {
                type: "stratos_widget_config",
                color: data.color || prevColor,
                position: data.position || "right",
              },
              "*",
            );
          }
        }
      })
      .catch(console.error);

    const savedSessionId = localStorage.getItem(`sh_session_${agencyId}`);
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }
    const captured = localStorage.getItem(`sh_captured_${agencyId}`);
    if (captured === "true" || savedSessionId) {
      setHasCapturedInfo(true);
    }
  }, [agencyId]);

  const handleCaptureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCaptureError("");

    if (!captureForm.name.trim() || !captureForm.phone.trim()) {
      setCaptureError("Name and phone number are required");
      return;
    }

    setHasCapturedInfo(true);
    localStorage.setItem(`sh_captured_${agencyId}`, "true");
    localStorage.setItem(`sh_lead_${agencyId}`, JSON.stringify(captureForm));
  };

  const send = async (text?: string) => {
    const content = (text ?? draft).trim();
    if (!content || typing) return;
    setDraft("");
    setSending(true);

    const userMsg: EmbedMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setTyping(true);

    const assistantMsgId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      { id: assistantMsgId, role: "assistant", content: "", createdAt: new Date().toISOString() },
    ]);

    try {
      const savedLead = localStorage.getItem(`sh_lead_${agencyId}`);
      const leadInfo = savedLead ? JSON.parse(savedLead) : null;

      const res = await fetch(`${API_BASE_URL}/chat/widget?stream=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
          message: content,
          sessionId,
          leadInfo: sessionId ? null : leadInfo, // Only send leadInfo when starting a new session
        }),
      });

      if (!res.ok) throw new Error(t("Failed to send message"));

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
                      msg.id === assistantMsgId
                        ? { ...msg, content: msg.content + data.text }
                        : msg,
                    ),
                  );
                } else if (data.type === "done") {
                  if (data.sessionId && data.sessionId !== sessionId) {
                    setSessionId(data.sessionId);
                    localStorage.setItem(`sh_session_${agencyId}`, data.sessionId);
                  }
                  try {
                    const audio = new Audio("/notify.mp3");
                    audio.volume = 0.5;
                    audio.play().catch((err) => {
                      console.warn("Audio play failed:", err);
                    });
                  } catch (err) {
                    console.warn("Audio initialization failed:", err);
                  }
                  setMessages((m) =>
                    m.map((msg) =>
                      msg.id === assistantMsgId ? { ...msg, content: data.message } : msg,
                    ),
                  );
                }
              } catch (err) {
                console.error("Failed to parse data line:", err);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Fetch/Stream failed:", err);
      await new Promise((r) => setTimeout(r, 900));
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: t("Thanks for your message! Our team will get back to you shortly."),
              }
            : msg,
        ),
      );
    } finally {
      setTyping(false);
      setSending(false);
    }
  };

  const headerGrad = `linear-gradient(135deg, ${color} 0%, ${darken(color, 0.82)} 100%)`;

  return (
    <>
      {/* Inject widget-pop keyframe & accent CSS var */}
      <style>{`
        :root { --accent-color: ${color}; }
        @keyframes widget-pop {
          from { opacity: 0; transform: translateY(15px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out 2; }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root {
          height: 100%;
          width: 100%;
          overflow: hidden;
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${alpha(color, 0.15)}; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: ${alpha(color, 0.3)}; }
      `}</style>

      <div
        className={cn(
          "flex flex-col w-full h-full select-none overflow-hidden",
          dark ? "bg-[#0b0e14] text-white" : "bg-slate-50 text-slate-900",
        )}
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-5 py-5 flex-shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative z-20 border-b border-white/10"
          style={{ background: headerGrad }}
        >
          <div className="relative flex-shrink-0 group">
            <div className="h-12 w-12 rounded-[14px] bg-white/15 backdrop-blur-xl flex items-center justify-center ring-1 ring-white/30 overflow-hidden shadow-inner transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
              <img src="/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-[2.5px] border-white shadow-lg" />
          </div>

          <div className="flex-1 min-w-0 ml-1">
            <div className="text-[16px] font-extrabold text-white leading-none tracking-tight truncate mb-1">
              {botName}
            </div>
            <div className="text-[11px] text-white/90 flex items-center gap-1.5 font-bold tracking-wide uppercase">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {t("Live Support")}
            </div>
          </div>

          <button
            onClick={() => {
              if (window.parent) {
                window.parent.postMessage({ type: "stratos_close_widget" }, "*");
              }
            }}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-black/10 hover:bg-black/20 transition-all text-white/90 hover:text-white hover:scale-110 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Main Content Area ──────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {!hasCapturedInfo ? (
            <div className="h-full overflow-y-auto px-6 py-4 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-white/5 flex flex-col items-center">
                <div className="text-center space-y-4 mb-8">
                  <div
                    className="w-16 h-16 rounded-[22px] mx-auto flex items-center justify-center shadow-lg rotate-3 hover:rotate-0 transition-all duration-500"
                    style={{ background: headerGrad }}
                  >
                    <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-[22px] font-black tracking-tight leading-tight text-slate-900 dark:text-white">
                      {t("Welcome to")} {botName}
                    </h2>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {t("We'd love to help you find your next property. How can we reach you?")}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCaptureSubmit} className="w-full space-y-4">
                  <div className="space-y-4">
                    <div className="group space-y-1.5">
                      <Label
                        className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2"
                        htmlFor="name"
                      >
                        <User className="w-3 h-3" />
                        {t("Full Name")}
                      </Label>
                      <div className="relative">
                        <input
                          id="name"
                          type="text"
                          required
                          placeholder={t("John Doe")}
                          value={captureForm.name}
                          onChange={(e) =>
                            setCaptureForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className={cn(
                            "w-full px-4 py-3.5 text-[14px] font-semibold rounded-[16px] outline-none transition-all border-2",
                            dark
                              ? "bg-white/5 border-white/10 focus:border-white/30 text-white"
                              : "bg-slate-50 border-slate-50 focus:border-indigo-500/20 focus:bg-white focus:shadow-sm",
                          )}
                        />
                      </div>
                    </div>

                    <div className="group space-y-1.5">
                      <Label
                        className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2"
                        htmlFor="phone"
                      >
                        <Phone className="w-3 h-3" />
                        {t("Phone Number")}
                      </Label>
                      <div className="relative">
                        <input
                          id="phone"
                          type="tel"
                          required
                          placeholder={t("+91 98765 43210")}
                          value={captureForm.phone}
                          onChange={(e) =>
                            setCaptureForm((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          className={cn(
                            "w-full px-4 py-3.5 text-[14px] font-semibold rounded-[16px] outline-none transition-all border-2",
                            dark
                              ? "bg-white/5 border-white/10 focus:border-white/30 text-white"
                              : "bg-slate-50 border-slate-50 focus:border-indigo-500/20 focus:bg-white focus:shadow-sm",
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {captureError && (
                    <div className="text-red-500 text-[12px] text-center font-bold animate-shake bg-red-50 py-2 rounded-xl border border-red-100">
                      {t(captureError)}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-[16px] text-[14px] font-bold text-white shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.97] transition-all relative overflow-hidden group h-[52px]"
                    style={{ background: headerGrad }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {t("Start Conversation")}
                      <ArrowRight
                        className={`w-4 h-4 transition-transform duration-300 ${isRtl ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"}`}
                      />
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </button>

                  <div className="flex items-center justify-center gap-2 pt-2 opacity-50">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold tracking-tight uppercase dark:text-white">
                      {t("Secure End-to-End Chat")}
                    </span>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                onScroll={onScroll}
                className="h-full overflow-y-auto px-3 py-4 space-y-3"
              >
                {messages.map((msg, i) => (
                  <Bubble key={msg.id} msg={msg} dark={dark} isLatest={i === messages.length - 1} />
                ))}

                {typing && <TypingDots dark={dark} />}

                <div ref={bottomRef} />
              </div>

              {/* Scroll-to-bottom hint */}
              {scrolled && (
                <button
                  onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="absolute bottom-4 right-4 h-7 w-7 rounded-full bg-white shadow-md border border-black/10 flex items-center justify-center z-10 hover:scale-110 transition-transform"
                >
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </button>
              )}

              {/* Quick suggestions */}
              {messages.length === 1 && !typing && (
                <div className="absolute bottom-6 left-0 right-0 px-4 flex gap-2.5 flex-wrap justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(t(q))}
                      className={cn(
                        "text-[12px] px-4 py-2.5 rounded-2xl border font-semibold shadow-sm transition-all duration-200 active:scale-95",
                        dark
                          ? "border-white/10 text-white/80 hover:border-white/30 hover:bg-white/10 bg-white/5"
                          : "border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50 bg-white",
                      )}
                    >
                      {t(q)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Input ──────────────────────────────────────────────── */}
        <div
          className={cn(
            "p-5 flex-shrink-0 relative transition-all duration-300",
            dark ? "bg-[#0b0e14] border-t border-white/5" : "bg-white border-t border-slate-100",
          )}
        >
          {!hasCapturedInfo && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] transition-all">
              <div className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl flex items-center gap-2.5 text-[13px] font-bold tracking-tight shadow-2xl ring-1 ring-white/10 animate-bounce">
                <Lock className="w-4 h-4 text-emerald-400" />
                {t("Complete sign-in to chat")}
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2 pl-5 pr-2 py-2 rounded-[22px] transition-all shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border-2",
              dark
                ? "bg-white/5 border-white/10 focus-within:border-white/20 focus-within:bg-white/10"
                : "bg-slate-50 border-slate-100 focus-within:border-indigo-500/20 focus-within:bg-white focus-within:shadow-[0_8px_20px_-5px_rgba(0,0,0,0.1)]",
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
              placeholder={t("How can I help you today?")}
              disabled={!hasCapturedInfo}
              className={cn(
                "flex-1 bg-transparent outline-none text-[15px] font-semibold placeholder:text-slate-400 min-w-0 disabled:opacity-50",
                dark ? "text-white" : "text-slate-900",
              )}
            />
            <button
              onClick={() => send()}
              disabled={!draft.trim() || typing || sending || !hasCapturedInfo}
              className="h-11 w-11 rounded-[18px] flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-lg hover:brightness-110 active:scale-90 disabled:opacity-30 disabled:grayscale group"
              style={{ background: headerGrad }}
            >
              <Send
                className={cn(
                  "h-5 w-5 text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                  isRtl && "rotate-180",
                )}
              />
            </button>
          </div>
        </div>

        {/* ── Powered by ─────────────────────────────────────────── */}
        <div
          className={cn(
            "text-center py-2.5 text-[10px] flex items-center justify-center gap-1.5 flex-shrink-0 uppercase tracking-[0.15em] font-black opacity-40 hover:opacity-100 transition-opacity cursor-default bg-transparent",
            dark ? "text-white" : "text-slate-900",
          )}
        >
          <div className="flex items-center gap-1 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full border border-black/5 dark:border-white/5">
            <Sparkles className="h-2.5 w-2.5 text-indigo-500" />
            <span>{t("Powered by")} Stratos Hub</span>
          </div>
        </div>
      </div>
    </>
  );
}
