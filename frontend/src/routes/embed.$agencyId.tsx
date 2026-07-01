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
  const { t } = useTranslation();
  return (
    <div className="flex items-end gap-2">
      <div
        className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--accent-color)" }}
      >
        <Sparkles className="h-3 w-3 text-white" />
      </div>
      <div
        className={cn(
          "px-4 py-3 rounded-2xl rounded-bl-sm",
          dark ? "bg-white/10" : "bg-white shadow-sm border border-black/5",
        )}
      >
        <div className="flex gap-1 items-center h-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full animate-bounce",
                dark ? "bg-white/50" : "bg-gray-400",
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
        isLatest && "animate-[widget-pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both]",
      )}
    >
      {!isUser && (
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mb-1 shadow-sm ring-1 ring-black/5"
          style={{ background: "var(--accent-color)" }}
        >
          <img src="/logo.png" alt="AI" className="h-5 w-5 object-contain" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[82%] px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] flex flex-col gap-2 transition-all",
          isUser
            ? "rounded-br-sm text-white"
            : dark
              ? "bg-white/10 text-white rounded-bl-sm border border-white/5 prose-invert prose prose-sm prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-white"
              : "bg-white text-slate-800 rounded-bl-sm border border-slate-100 prose prose-sm prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-slate-900",
        )}
        style={isUser ? { background: "var(--accent-color)" } : undefined}
      >
        {!isUser && thoughtProcess && (
          <details className="text-[11px] opacity-75 border-b border-current/10 pb-2 mb-1 group/tp">
            <summary className="cursor-pointer list-none flex items-center gap-1.5 font-bold tracking-wide uppercase text-[9px]">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              {t("Thinking Process")}
              <ChevronDown className="h-3 w-3 ml-auto transition-transform group-open/tp:rotate-180" />
            </summary>
            <div className="mt-2 font-mono whitespace-pre-wrap leading-tight bg-black/5 p-2 rounded-lg">
              {thoughtProcess}
            </div>
          </details>
        )}
        <div dir="auto" className="break-words">
          {isUser ? (
            <div className="whitespace-pre-wrap font-medium">{cleanContent}</div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
          )}
        </div>
        <div
          className={cn(
            "text-[10px] mt-1 text-right font-medium tracking-tight",
            isUser ? "text-white/70" : "text-slate-400",
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
                { ...m[0], content: data.greeting || config.greeting, createdAt: m[0].createdAt },
              ];
            }
            return m;
          });
          if (window.parent) {
            window.parent.postMessage(
              {
                type: "stratos_widget_config",
                color: data.color || color,
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
                    audio.play().catch(() => {});
                  } catch {}
                  setMessages((m) =>
                    m.map((msg) =>
                      msg.id === assistantMsgId ? { ...msg, content: data.message } : msg,
                    ),
                  );
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch {
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

  const headerGrad = `linear-gradient(135deg, ${color} 0%, ${darken(color)} 100%)`;

  return (
    <>
      {/* Inject widget-pop keyframe & accent CSS var */}
      <style>{`
        :root { --accent-color: ${color}; }
        @keyframes widget-pop {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root {
          height: 100%;
          width: 100%;
          overflow: hidden;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${alpha(color, 0.25)}; border-radius: 99px; }
      `}</style>

      <div
        className={cn(
          "flex flex-col w-full h-full select-none",
          dark ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900",
        )}
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-4 flex-shrink-0 shadow-lg relative z-20"
          style={{ background: headerGrad }}
        >
          <div className="relative flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 overflow-hidden shadow-inner">
              <img
                src={dark ? "/logo.png" : "/logo-dark.png"}
                alt="Logo"
                className="h-full w-full object-contain scale-110"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-white leading-tight tracking-tight truncate">
              {botName}
            </div>
            <div className="text-[11px] text-white/80 mt-0.5 flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("Online · replies instantly")}
            </div>
          </div>

          <button
            onClick={() => {
              if (window.parent) {
                window.parent.postMessage({ type: "stratos_close_widget" }, "*");
              }
            }}
            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-white/20 transition-all text-white/80 hover:text-white hover:scale-105 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Main Content Area ──────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {!hasCapturedInfo ? (
            <div className="h-full overflow-y-auto px-6 py-10 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="text-center space-y-4">
                <div
                  className="w-16 h-16 rounded-[24px] mx-auto flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300"
                  style={{ background: headerGrad }}
                >
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-[20px] font-black tracking-tight leading-tight">
                    {t("Welcome to")} {botName}
                  </h2>
                  <p className="text-[14px] opacity-70 leading-relaxed font-medium">
                    {t("We'd love to help you find your next property. How can we reach you?")}
                  </p>
                </div>
              </div>

              <form onSubmit={handleCaptureSubmit} className="w-full space-y-4 max-w-[300px]">
                <div className="space-y-3">
                  <div className="group space-y-1.5">
                    <Label
                      className="text-[11px] font-bold uppercase tracking-wider opacity-60 px-1"
                      htmlFor="name"
                    >
                      {t("Full Name")}
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      </div>
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
                          "w-full pl-10 pr-4 py-3 text-[14px] font-medium rounded-2xl outline-none transition-all ring-1",
                          dark
                            ? "bg-white/5 ring-white/10 focus:ring-white/30 text-white placeholder:text-slate-600"
                            : "bg-white ring-slate-200 focus:ring-slate-400 shadow-sm text-slate-900",
                        )}
                      />
                    </div>
                  </div>

                  <div className="group space-y-1.5">
                    <Label
                      className="text-[11px] font-bold uppercase tracking-wider opacity-60 px-1"
                      htmlFor="phone"
                    >
                      {t("Phone Number")}
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      </div>
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
                          "w-full pl-10 pr-4 py-3 text-[14px] font-medium rounded-2xl outline-none transition-all ring-1",
                          dark
                            ? "bg-white/5 ring-white/10 focus:ring-white/30 text-white placeholder:text-slate-600"
                            : "bg-white ring-slate-200 focus:ring-slate-400 shadow-sm text-slate-900",
                        )}
                      />
                    </div>
                  </div>
                </div>

                {captureError && (
                  <div className="text-red-500 text-[12px] text-center font-bold animate-shake">
                    {t(captureError)}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl text-[14px] font-black text-white shadow-xl hover:brightness-110 active:scale-[0.98] transition-all relative overflow-hidden group"
                  style={{ background: headerGrad }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {t("Start Conversation")}
                    <ArrowRight
                      className={`w-4 h-4 transition-transform ${isRtl ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"}`}
                    />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-2 pt-2 opacity-60">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold tracking-tight">
                    {t("Secure & Private Channel")}
                  </span>
                </div>
              </form>
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
                <div className="absolute bottom-4 left-0 right-0 px-3 flex gap-2 flex-wrap justify-center">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(t(q))}
                      className={cn(
                        "text-[11px] px-3 py-1.5 rounded-full border transition-all duration-150 active:scale-95",
                        dark
                          ? "border-white/15 text-white/70 hover:border-white/40 hover:text-white bg-white/5"
                          : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white hover:bg-gray-50",
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
            "p-4 border-t flex-shrink-0 relative",
            dark ? "bg-slate-900/50 border-white/5" : "bg-white border-slate-100",
          )}
        >
          {!hasCapturedInfo && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 backdrop-blur-[2px] transition-all">
              <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-[12px] font-bold tracking-tight shadow-xl ring-1 ring-white/10">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                {t("Information Required")}
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-2xl transition-all shadow-inner ring-1",
              dark
                ? "bg-white/5 ring-white/10 focus-within:ring-white/25 focus-within:bg-white/10"
                : "bg-slate-50 ring-slate-200 focus-within:ring-slate-300 focus-within:bg-white",
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
              placeholder={t("Type a message…")}
              disabled={!hasCapturedInfo}
              className={cn(
                "flex-1 bg-transparent outline-none text-[14px] font-medium placeholder:text-slate-400 min-w-0 disabled:opacity-50",
                dark ? "text-white" : "text-slate-900",
              )}
            />
            <button
              onClick={() => send()}
              disabled={!draft.trim() || typing || sending || !hasCapturedInfo}
              className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-md hover:brightness-110 active:scale-90 disabled:opacity-30 disabled:grayscale"
              style={{ background: `linear-gradient(135deg, ${color} 0%, ${darken(color)} 100%)` }}
            >
              <Send className="h-4 w-4 text-white translate-x-px" />
            </button>
          </div>
        </div>

        {/* ── Powered by ─────────────────────────────────────────── */}
        <div
          className={cn(
            "text-center py-1 text-[10px] flex items-center justify-center gap-1 flex-shrink-0",
            dark ? "text-white/25" : "text-gray-400",
          )}
        >
          <Sparkles className="h-2.5 w-2.5" />
          {t("Powered by")}&nbsp;<span className="font-semibold">Stratos Hub</span>
        </div>
      </div>
    </>
  );
}
