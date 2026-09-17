import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Check,
  Zap,
  ChevronDown,
  Globe,
  Sun,
  Moon,
  Send,
  Globe2,
  Clock,
  Users,
  BarChart3,
  MessageSquare,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

// Latin digits for prices/numbers in both languages (keeps prices readable)
const fmt = (n: number) => n.toLocaleString("en-US");

function RouteComponent() {
  const { t } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [isDark, setIsDark] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(true);

  // Synchronize theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const darkActive = saved === "dark";
    setIsDark(darkActive);
    document.documentElement.classList.toggle("dark", darkActive);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  // ── Mount the live embed widget on the landing page (re-mounts on language/theme change)
  const lang = i18n.language?.startsWith("ar") ? "ar" : "en";
  useEffect(() => {
    const scriptId = "stratos-landing-widget";
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();
    const s = document.createElement("script");
    s.id = scriptId;
    s.src = "/widget.js?v=" + Date.now();
    s.setAttribute("data-key", "demo");
    s.setAttribute("data-color", "#6366f1");
    s.setAttribute("data-name", "Sarah - Property Concierge");
    s.setAttribute("data-lang", lang);
    s.setAttribute(
      "data-greeting",
      lang === "ar"
        ? "مرحباً! 👋 تبحث عن عقارك القادم؟ أجيب على أسئلتك من كتيبات وأسعار العقارات لدينا."
        : "Hi! 👋 Looking for your next property? I answer questions using our own brochures and price sheets.",
    );
    s.setAttribute("data-theme", isDark ? "dark" : "light");
    s.setAttribute("data-position", isRtl ? "left" : "right");
    document.body.appendChild(s);
  }, [isDark, lang, isRtl]);

  // ── Interactive demo conversation (honest preview of chat + lead capture) ──
  const demoScript = {
    welcome: t(
      "Welcome to Apex Luxury Realty! 👋 I'm Sarah, your 24/7 property assistant. Ask me anything about our listings, prices, or brochures.",
    ),
    ask: t("What's the price of the 4-bedroom villa in Palm Reserve?"),
    answer: t(
      "The Palm Reserve Villa is listed at €1,250,000 — 4 bedrooms, 4,800 sq ft, sea view, per the uploaded brochure. Would you like the sales team to call you?",
    ),
    reply: t(
      "Done! I've saved your details as a new lead and notified the sales team — they'll reach out shortly.",
    ),
  };

  const [simChatMessages, setSimChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [simInput, setSimInput] = useState("");

  // Seed the conversation whenever the language changes
  useEffect(() => {
    setSimChatMessages([
      { role: "assistant", content: demoScript.welcome },
      { role: "user", content: demoScript.ask },
      { role: "assistant", content: demoScript.answer },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleSimSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim()) return;
    const text = simInput.trim();
    setSimInput("");
    setSimChatMessages((prev) => [...prev, { role: "user", content: text }]);

    setTimeout(() => {
      setSimChatMessages((prev) => [...prev, { role: "assistant", content: demoScript.reply }]);
    }, 600);
  };

  // ── ROI Calculator State (illustrative estimate) ──────────────────────────
  const [inquiries, setInquiries] = useState(400);
  const [commission, setCommission] = useState(12000);
  const hoursSaved = Math.round(inquiries * 0.35);
  const qualifiedLeads = Math.round(inquiries * 0.18);
  const additionalDeals = Math.max(1, Math.round(qualifiedLeads * 0.12));
  const quarterlyLift = additionalDeals * 3 * commission;

  // ── Accordion State ───────────────────────────────────────────────────────
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: t("How does the AI answer questions about my listings?"),
      a: t(
        "You upload your property PDFs, brochures and spreadsheets (CSV/Excel) in the workspace. The AI parses them into a searchable index, so buyer questions are answered with exact details taken from your own documents.",
      ),
    },
    {
      q: t("Does it connect to WhatsApp Business?"),
      a: t(
        "Yes. Stratos Hub connects to the official WhatsApp Business Cloud API using your own token — you paste the credentials once in Settings and the same assistant answers on WhatsApp, Messenger, Instagram, TikTok and your website.",
      ),
    },
    {
      q: t("How does Arabic and RTL language support work?"),
      a: t(
        "Stratos Hub was built from the ground up with native English and Arabic support. The dashboard switches to full RTL with one click, and the assistant replies to each buyer in the language they write in — with proper RTL formatting.",
      ),
    },
    {
      q: t("Is our proprietary listing and client data protected?"),
      a: t(
        "Yes. All data is encrypted at rest and in transit. Your agency portfolio is strictly private, isolated in your workspace, and never used to train public foundation models.",
      ),
    },
    {
      q: t("What happens when our free 14-day trial ends?"),
      a: t(
        "You can upgrade to the Starter, Growth or Scale plan at any time. There is no auto-billing unless you choose to subscribe, and you keep full access to everything you uploaded.",
      ),
    },
  ];

  return (
    <div
      className={cn(
        "min-h-screen font-sans transition-colors duration-300 overflow-x-hidden",
        isDark ? "bg-[#0b0e14] text-slate-100" : "bg-[#fbfbfd] text-[#1d1d1f]",
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#0b0e14]/85">
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 overflow-hidden">
              <img src="/logo.png" alt="Stratos Hub" className="h-5 w-5 object-contain" />
            </div>
            <span className="font-bold text-base leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Stratos Hub
              <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {t("AI Workforce")}
              </span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#platform" className="hover:text-indigo-600 transition-colors">
              {t("Platform")}
            </a>
            <a href="#demo" className="hover:text-indigo-600 transition-colors">
              {t("Live Demo")}
            </a>
            <a href="#how" className="hover:text-indigo-600 transition-colors">
              {t("How It Works")}
            </a>
            <a href="#roi" className="hover:text-indigo-600 transition-colors">
              {t("ROI Calculator")}
            </a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">
              {t("Pricing")}
            </a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">
              {t("FAQ")}
            </a>
          </nav>

          {/* Utilities & CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")}
              className="h-8 px-2.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 gap-1.5"
            >
              <Globe className="h-3.5 w-3.5 text-indigo-500" />
              <span>{i18n.language === "ar" ? "English" : "العربية"}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              title={isDark ? t("Light mode") : t("Dark mode")}
            >
              {isDark ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </Button>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex text-xs font-semibold"
            >
              <Link to="/login">{t("Sign in")}</Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 rounded-lg px-3 sm:px-3.5 flex-shrink-0"
            >
              <Link to="/signup">{t("Start Free Trial")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm text-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("Bilingual AI assistant for modern real-estate teams")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            {t("Turn every buyer inquiry into a")}{" "}
            <span className="text-indigo-600 dark:text-indigo-400">{t("qualified lead.")}</span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {t(
              "Stratos Hub replies to your buyers 24/7 on your website, WhatsApp, Messenger, Instagram and TikTok. It answers questions using your own listings and brochures — and turns every conversation into a structured lead.",
            )}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
            >
              <Link to="/signup">
                <span>{t("Deploy AI Assistant")}</span>
                <ArrowRight className={cn("h-4 w-4", isRtl ? "mr-2 rotate-180" : "ml-2")} />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 px-5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <Link to="/test-site.html">
                <Sparkles className="h-4 w-4 text-indigo-500 me-2" />
                <span>{t("Test Live Widget Demo")}</span>
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> {t("14-Day Free Trial")}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> {t("No Credit Card Required")}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> {t("Arabic & English Bilingual")}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> {t("2-Minute Setup")}
            </span>
          </div>
        </div>

        {/* ── Interactive Live Preview: chat + lead capture ─────────────────── */}
        <div id="demo" className="mt-14 max-w-4xl mx-auto scroll-mt-20">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] shadow-xl shadow-slate-200/50 dark:shadow-black/40 overflow-hidden">
            {/* Console Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-[#151926]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="hidden sm:flex gap-1.5 flex-shrink-0">
                  <span className="h-3 w-3 rounded-full bg-red-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 sm:ms-2 font-mono truncate">
                  {t("Live Preview · AI Chat Widget")}
                </span>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold flex-shrink-0">
                ● {t("24/7 Active")}
              </Badge>
            </div>

            {/* Interactive Console Content */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Left: Conversational Stream (7 cols) */}
              <div className="md:col-span-7 p-4 sm:p-5 flex flex-col border-b md:border-b-0 md:border-e border-slate-100 dark:border-slate-800">
                <div className="space-y-3 overflow-y-auto max-h-[300px] min-h-[220px]">
                  {simChatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-2.5 text-xs leading-relaxed max-w-[90%]",
                        msg.role === "user" ? "ms-auto flex-row-reverse" : "me-auto",
                      )}
                    >
                      <div
                        className={cn(
                          "h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]",
                          msg.role === "user" ? "bg-slate-800" : "bg-indigo-600 shadow-sm",
                        )}
                      >
                        {msg.role === "user" ? "U" : "AI"}
                      </div>
                      <div
                        className={cn(
                          "p-3 rounded-2xl border",
                          msg.role === "user"
                            ? "bg-indigo-600 text-white border-transparent rounded-se-none"
                            : "bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-700 rounded-ss-none shadow-sm",
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prompt bar */}
                <form
                  onSubmit={handleSimSend}
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="flex gap-2">
                    <Input
                      value={simInput}
                      onChange={(e) => setSimInput(e.target.value)}
                      placeholder={t("Type a message…")}
                      className="text-xs h-9"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Send className="h-3 w-3 rtl:-scale-x-100" />
                    </Button>
                  </div>
                </form>
              </div>

              {/* Right: Captured Lead Card (5 cols) */}
              <div className="md:col-span-5 p-4 sm:p-5 bg-slate-50/50 dark:bg-[#10141f] flex flex-col justify-between gap-4">
                <div className="space-y-3.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{t("Captured automatically")}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {t("Palm Reserve Villa Walkthrough")}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t("Interested buyer · WhatsApp")}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono flex-shrink-0">
                        {t("new")}
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">{t("Name")}:</span>
                        <span className="font-semibold">Alexander Vance</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">{t("Phone")}:</span>
                        <span className="font-semibold" dir="ltr">
                          +34 612 34 56 78
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">{t("Budget")}:</span>
                        <span className="font-semibold">€1,200,000</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">{t("Property type")}:</span>
                        <span className="font-semibold">{t("Villa")}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">{t("Qualification score")}:</span>
                        <span className="text-emerald-500 font-semibold">★★★★☆ 4/5</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900 text-xs space-y-1">
                    <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      <span>{t("Zero manual data entry")}</span>
                    </div>
                    <p className="text-[11px] text-indigo-600/90 dark:text-indigo-400/90 leading-relaxed">
                      {t(
                        "Name, phone, budget and property interest are extracted from the conversation and pushed to your leads pipeline.",
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center font-medium">
                  {t("Also answers on WhatsApp, Messenger, Instagram & TikTok.")}
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-3">
            {t("Simulated preview — connect your documents to make it yours.")}
          </p>
        </div>
      </section>

      {/* ── Feature Pillars (all real, shipped capabilities) ───────────────── */}
      <section
        id="platform"
        className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/70 dark:border-slate-800 scroll-mt-16"
      >
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-3">
          <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-xs font-bold">
            {t("Platform")}
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("One AI assistant across your whole sales funnel.")}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            {t(
              "From the first buyer question to a qualified lead in your pipeline — no engineering team required.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {/* 1. Web Chat Widget */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 sm:p-7 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {t("Web Chat Widget")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t("Add an AI property assistant to any website with one line of code.")}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("Custom colors, agent name & greeting")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("Light & dark themes, left/right position")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Document Q&A */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 sm:p-7 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {t("Document & brochure Q&A")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t(
                    "Upload PDF brochures, price sheets and spreadsheets — the AI answers buyers with exact details from your own documents.",
                  )}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("PDF, Excel & CSV ingestion")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("Answers cite your own listings")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. AI Lead Capture */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 sm:p-7 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {t("AI lead capture")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t("Automatically extract and qualify leads from every conversation.")}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("Name, phone, city, budget & property type")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("1–5 star qualification score")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Leads CRM */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 sm:p-7 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {t("Leads CRM & pipeline")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t(
                    "Search, filter and manage every lead in one pipeline — from first contact to won or lost.",
                  )}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("Search & status filters")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("One-click status updates")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Omnichannel */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 sm:p-7 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Globe2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {t("Omnichannel inboxes")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t(
                    "Connect the messaging apps your buyers actually use — one AI brain answers everywhere.",
                  )}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("WhatsApp Business Cloud API")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("Messenger · Instagram · TikTok")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. Usage & ROI */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 sm:p-7 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {t("Usage & ROI analytics")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t("Watch credits, conversations and estimated pipeline value in one dashboard.")}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("Credit usage tracking")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{t("Chats handled per day")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Bilingual band ───────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/70 dark:border-slate-800">
        <div className="rounded-3xl bg-slate-50 dark:bg-[#121622] border border-slate-200 dark:border-slate-800 p-6 sm:p-10 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {t("Arabic & English Bilingual")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t("Arabic & English, out of the box")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t(
                  "The dashboard switches to native RTL with one click, and your assistant chats with each buyer in the language they write in.",
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-center">
                <Globe className="h-5 w-5 text-indigo-500 mx-auto" />
                <div className="font-bold text-slate-900 dark:text-white">
                  {t("Native RTL dashboard")}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-center">
                <MessageSquare className="h-5 w-5 text-emerald-500 mx-auto" />
                <div className="font-bold text-slate-900 dark:text-white">
                  {t("Bilingual AI replies")}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-center">
                <Zap className="h-5 w-5 text-amber-500 mx-auto" />
                <div className="font-bold text-slate-900 dark:text-white">
                  {t("One-click language toggle")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section
        id="how"
        className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/70 dark:border-slate-800 scroll-mt-16"
      >
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-xs font-bold">
            {t("How it works")}
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("Up and running in an afternoon")}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            {t("No engineering team required.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: t("Connect your data"),
              desc: t("Upload listings or paste your API key in under two minutes."),
              icon: FileText,
              step: "1",
            },
            {
              title: t("Train the assistant"),
              desc: t("We index your inventory so replies stay accurate and on-brand."),
              icon: Sparkles,
              step: "2",
            },
            {
              title: t("Convert leads faster"),
              desc: t("Your team handles only the qualified, sales-ready conversations."),
              icon: Clock,
              step: "3",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-3xl font-extrabold font-mono text-slate-200 dark:text-slate-800 select-none">
                  {s.step}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Interactive Financial ROI Calculator ──────────────────────────── */}
      <section
        id="roi"
        className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/70 dark:border-slate-800 scroll-mt-16"
      >
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] p-6 sm:p-10 md:p-12 shadow-xl shadow-slate-200/40 dark:shadow-black/40">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Sliders */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-1.5">
                <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-xs font-bold">
                  {t("ROI Calculator")}
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t("Calculate Your Commission Lift")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {t(
                    "See how many additional qualified leads and deals Stratos Hub can unlock each quarter.",
                  )}
                </p>
              </div>

              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold gap-2">
                  <span>{t("Monthly Inquiries")}</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {fmt(inquiries)} {t("inquiries")}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={inquiries}
                  onChange={(e) => setInquiries(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  dir="ltr"
                />
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold gap-2">
                  <span>{t("Average Deal Commission")}</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    ${fmt(commission)}
                  </span>
                </div>
                <input
                  type="range"
                  min="3000"
                  max="50000"
                  step="1000"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Results Card */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("Estimated Quarterly Lift")}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap justify-between items-baseline border-b border-slate-200 dark:border-slate-800 pb-2 gap-x-2 gap-y-1">
                  <span className="text-xs text-slate-500">{t("Hours saved")}:</span>
                  <span className="text-base font-bold font-mono whitespace-nowrap">
                    {fmt(hoursSaved)} {t("hrs")}
                  </span>
                </div>
                <div className="flex flex-wrap justify-between items-baseline border-b border-slate-200 dark:border-slate-800 pb-2 gap-x-2 gap-y-1">
                  <span className="text-xs text-slate-500">{t("Additional qualified leads")}:</span>
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    +{fmt(qualifiedLeads)}
                  </span>
                </div>
                <div className="flex flex-wrap justify-between items-baseline pt-1 gap-x-2 gap-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t("Commission lift")}:
                  </span>
                  <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    +${fmt(quarterlyLift)}
                  </span>
                </div>
              </div>

              <Button
                asChild
                className="w-full h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                <Link to="/signup">{t("Start Free 14-Day Trial")}</Link>
              </Button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                {t("Illustrative estimate based on your inputs — not a guarantee.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ──────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/70 dark:border-slate-800 scroll-mt-16"
      >
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-14 space-y-3">
          <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-xs font-bold">
            {t("Transparent Pricing")}
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("Simple, Predictable Plans for Brokerages.")}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
            {t(
              "Pay for AI capacity — not seats. Every plan includes the web widget, document Q&A and the leads CRM.",
            )}
          </p>

          <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-4">
            <button
              onClick={() => setBillingAnnual(false)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                !billingAnnual
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500",
              )}
            >
              {t("Monthly")}
            </button>
            <button
              onClick={() => setBillingAnnual(true)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                billingAnnual ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500",
              )}
            >
              <span>{t("Annual")}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                {t("Save 20%")}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Starter */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("Starter")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("For solo agents")}</p>
              </div>
              <div className="text-3xl font-extrabold font-mono">
                {billingAnnual ? "$39" : "$49"}
                <span className="text-xs font-normal text-slate-500">/{t("mo")}</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{" "}
                  {t("1,000 AI Conversations / mo")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{" "}
                  {t("Web Chat Widget")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{" "}
                  {t("Document & brochure Q&A")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{" "}
                  {t("Lead capture CRM")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{" "}
                  {t("English & Arabic AI")}
                </div>
              </div>
            </div>
            <Button asChild variant="outline" className="mt-8 w-full rounded-xl text-xs font-bold">
              <Link to="/signup">{t("Start Free Trial")}</Link>
            </Button>
          </Card>

          {/* Growth */}
          <Card className="rounded-3xl border-2 border-indigo-600 dark:border-indigo-500 p-7 flex flex-col justify-between shadow-xl relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              {t("Most popular")}
            </span>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("Growth")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("For growing teams")}</p>
              </div>
              <div className="text-3xl font-extrabold font-mono">
                {billingAnnual ? "$119" : "$149"}
                <span className="text-xs font-normal text-slate-500">/{t("mo")}</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t">
                <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
                  <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />{" "}
                  {t("8,000 AI Conversations / mo")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />{" "}
                  {t("Everything in Starter")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />{" "}
                  {t("WhatsApp Business Cloud API")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />{" "}
                  {t("Messenger · Instagram · TikTok")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />{" "}
                  {t("Usage & ROI analytics")}
                </div>
              </div>
            </div>
            <Button
              asChild
              className="mt-8 w-full rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              <Link to="/signup">{t("Start Free 14-Day Trial")}</Link>
            </Button>
          </Card>

          {/* Scale */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("Scale")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("For brokerages")}</p>
              </div>
              <div className="text-3xl font-extrabold font-mono">
                {billingAnnual ? "$319" : "$399"}
                <span className="text-xs font-normal text-slate-500">/{t("mo")}</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{" "}
                  {t("30,000 AI Conversations / mo")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{" "}
                  {t("Everything in Growth")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{" "}
                  {t("Full widget customization")}
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{" "}
                  {t("Priority support")}
                </div>
              </div>
            </div>
            <Button asChild variant="outline" className="mt-8 w-full rounded-xl text-xs font-bold">
              <Link to="/signup">{t("Deploy AI Assistant")}</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────────────── */}
      <section
        id="faq"
        className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-slate-200/70 dark:border-slate-800 scroll-mt-16"
      >
        <div className="text-center space-y-2 mb-10">
          <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-xs font-bold">
            {t("FAQ")}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("Frequently Asked Questions")}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-start text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between gap-3"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0",
                    openFaq === idx && "rotate-180 text-indigo-600",
                  )}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/70 dark:border-slate-800">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("Ready to close more deals?")}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            {t("Spin up your workspace in minutes. No credit card required.")}
          </p>
          <Button
            asChild
            size="lg"
            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25"
          >
            <Link to="/signup">{t("Get started free")}</Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090c12] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="font-bold text-slate-900 dark:text-white">Stratos Hub</span>
            <span>· {t("Real Estate AI")}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium text-slate-600 dark:text-slate-400">
            <Link to="/test-site.html" className="hover:text-indigo-600 transition-colors">
              {t("Widget Showcase")}
            </Link>
            <Link to="/privacy" className="hover:text-indigo-600 transition-colors">
              {t("Privacy Policy")}
            </Link>
            <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">
              {t("Workspace")}
            </Link>
            <Link to="/login" className="hover:text-indigo-600 transition-colors">
              {t("Sign in")}
            </Link>
            <Link to="/signup" className="hover:text-indigo-600 transition-colors">
              {t("Get started")}
            </Link>
          </div>

          <div>
            © {new Date().getFullYear()} Stratos Hub. {t("All rights reserved.")}
          </div>
        </div>
      </footer>
    </div>
  );
}
