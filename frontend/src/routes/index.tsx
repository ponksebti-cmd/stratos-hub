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
  Building2,
  Calendar,
  Clock,
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

function RouteComponent() {
  const { t } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [isDark, setIsDark] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(true);

  // Mount the live embed widget on the landing page
  useEffect(() => {
    const existingScript = document.getElementById("stratos-landing-widget");
    if (!existingScript) {
      const s = document.createElement("script");
      s.id = "stratos-landing-widget";
      s.src = "/widget.js?v=" + Date.now();
      s.setAttribute("data-key", "demo");
      s.setAttribute("data-color", "#6366f1");
      s.setAttribute("data-name", "Sarah - Property Concierge");
      s.setAttribute(
        "data-greeting",
        "Hi! Looking for a luxury villa or apartment? I can answer listing questions and book a private walkthrough for you.",
      );
      s.setAttribute("data-theme", isDark ? "dark" : "light");
      s.setAttribute("data-position", "right");
      document.body.appendChild(s);
    }
  }, [isDark]);

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

  // ── Interactive Live Tour Booking Simulator (EliseAI Concept) ─────────────
  const [simChatMessages, setSimChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to Apex Luxury Realty! 👋 I'm Sarah, your 24/7 property concierge. I can answer questions about floor plans, pricing, or schedule a private showing.",
    },
    {
      role: "user",
      content: "Can I view the 4-Bed Marbella Coastal Villa this Saturday afternoon?",
    },
    {
      role: "assistant",
      content:
        "The Palm Reserve Villa (€1,250,000) is available! We have private walkthrough slots this Saturday at 2:00 PM and 4:30 PM CET. Would you like me to reserve the 2:00 PM slot?",
    },
  ]);
  const [simInput, setSimInput] = useState("");

  const handleSimSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim()) return;
    const text = simInput.trim();
    setSimInput("");
    setSimChatMessages((prev) => [...prev, { role: "user", content: text }]);

    setTimeout(() => {
      setSimChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I've provisionally reserved Saturday at 2:00 PM for you with our senior broker. Please confirm your details below to sync your calendar invite and gate pass.",
        },
      ]);
    }, 600);
  };

  // ── ROI Calculator State ──────────────────────────────────────────────────
  const [inquiries, setInquiries] = useState(400);
  const [commission, setCommission] = useState(12000);
  const hoursSaved = Math.round(inquiries * 0.35);
  const toursBooked = Math.round(inquiries * 0.18);
  const additionalDeals = Math.max(1, Math.round(toursBooked * 0.12));
  const quarterlyLift = additionalDeals * 3 * commission;

  // ── Accordion State ───────────────────────────────────────────────────────
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div
      className={cn(
        "min-h-screen font-sans transition-colors duration-300",
        isDark ? "bg-[#0b0e14] text-slate-100" : "bg-[#fbfbfd] text-[#1d1d1f]",
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#0b0e14]/85">
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 overflow-hidden">
              <img src="/logo.png" alt="Stratos Hub" className="h-5 w-5 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Stratos Hub
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  AI Workforce
                </span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#solutions" className="hover:text-indigo-600 transition-colors">
              Platform
            </a>
            <a href="#showing" className="hover:text-indigo-600 transition-colors">
              Auto-Scheduler
            </a>
            <a href="#nurturing" className="hover:text-indigo-600 transition-colors">
              Long-Term Follow-Up
            </a>
            <a href="#roi" className="hover:text-indigo-600 transition-colors">
              ROI Calculator
            </a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">
              Pricing
            </a>
          </nav>

          {/* Utilities & CTAs */}
          <div className="flex items-center gap-2.5">
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
              title="Toggle theme"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>

            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-xs font-semibold">
              <Link to="/login">Sign In</Link>
            </Button>

            <Button asChild size="sm" className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 rounded-lg px-3.5">
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero Section (The Autonomous Real Estate Workforce) ─────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Autonomous AI for Modern Brokerages & Property Teams</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Turn Every Buyer Inquiry Into a{" "}
            <span className="text-indigo-600 dark:text-indigo-400">Confirmed Showing.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Like <strong>EliseAI</strong>, <strong>Roof AI</strong>, and <strong>Structurely</strong> combined. Stratos Hub answers buyer questions 24/7, schedules showings directly into agent calendars, and follows up over WhatsApp and SMS until deals close.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
            >
              <Link to="/signup">
                <span>Deploy AI Assistant</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 px-5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <Link to="/test-site.html">
                <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                <span>Test Live Widget Demo</span>
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> 14-Day Free Trial
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> 2-Minute Setup
            </span>
          </div>
        </div>

        {/* ── Interactive Auto-Scheduler & Qualification Console (EliseAI Core) ─ */}
        <div id="showing" className="mt-14 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] shadow-xl shadow-slate-200/50 dark:shadow-black/40 overflow-hidden">
            {/* Console Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#151926]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2 font-mono">
                  Autonomous Showing Pipeline · Live Preview
                </span>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                ● 24/7 Active
              </Badge>
            </div>

            {/* Interactive Console Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
              {/* Left: Conversational Stream (7 cols) */}
              <div className="md:col-span-7 p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
                <div className="space-y-3 overflow-y-auto max-h-[300px]">
                  {simChatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-2.5 text-xs leading-relaxed max-w-[90%]",
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
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
                            ? "bg-indigo-600 text-white border-transparent rounded-tr-none"
                            : "bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-700 rounded-tl-none shadow-sm",
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prompt bar */}
                <form onSubmit={handleSimSend} className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2">
                    <Input
                      value={simInput}
                      onChange={(e) => setSimInput(e.target.value)}
                      placeholder="Type 'Yes, please book 2:00 PM'..."
                      className="text-xs h-9"
                    />
                    <Button type="submit" size="sm" className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </form>
              </div>

              {/* Right: Automated Showing Card & Calendar Sync (5 cols) */}
              <div className="md:col-span-5 p-5 bg-slate-50/50 dark:bg-[#10141f] flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Automated Appointment Booking</span>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Palm Reserve Villa Walkthrough
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Saturday · 2:00 PM CET
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-mono">
                        Confirmed
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Prospect:</span>
                        <span className="font-semibold">Alexander Vance</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Broker:</span>
                        <span className="font-semibold">Marcus Sterling</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Calendar Sync:</span>
                        <span className="text-emerald-500 font-semibold">Google & Outlook</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900 text-xs space-y-1">
                    <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      <span>Zero Agent Time Spent</span>
                    </div>
                    <p className="text-[11px] text-indigo-600/90 dark:text-indigo-400/90 leading-relaxed">
                      Gate passes, address directions, and broker reminders are generated and dispatched autonomously.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center font-medium">
                  Integrates with Google Calendar, Outlook, and Yardi / Entrata.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Missing Ideas: EliseAI, Structurely, Roof AI Pillars ─────── */}
      <section id="solutions" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/70 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-xs font-bold">
            The Three Pillars of Modern Real Estate AI
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything EliseAI, Structurely, and Roof AI Offer — in One Platform.
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Stop stitching together five different point solutions. Stratos Hub unifies conversational scheduling, long-term nurturing, and MLS document intelligence.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Autonomous Leasing & Showing Agent (EliseAI) */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-7 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Like EliseAI
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  24/7 Showing & Tour Scheduler
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Prospective buyers and tenants never wait for office hours. The AI verifies showing availability, books in-person or video tours directly into broker calendars, and issues automated gate passes.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Two-way Google & Outlook Calendar Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Automated SMS & WhatsApp Showing Reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Cuts no-shows by 44%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pillar 2: 12-Month Conversational Nurturing (Structurely) */}
          <Card id="nurturing" className="rounded-3xl border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 scroll-mt-24">
            <CardContent className="p-7 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Like Structurely
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Long-Term 2-Way Follow-Up
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  70% of real estate deals close after 5+ touchpoints, but most agents give up after 1. Stratos Hub persistently follows up over WhatsApp, SMS, and email with tailored price cuts and new listings.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Cadence on Days 1, 3, 7, 14, 30 & 60</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Dynamic listing price-drop alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Re-engages 3x more cold leads</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pillar 3: MLS & PDF Document Intelligence (Roof AI) */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-7 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-cyan-50 dark:cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Like Roof AI
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Inventory RAG & Lender Routing
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Upload PDF development brochures, floor plans, and price sheets. The AI quotes exact square footage and payment milestones, qualifies cash vs. loan readiness, and routes pre-approvals to preferred lenders.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Parses 100-page property brochures in 60s</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Mortgage pre-approval qualification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>RERA & Fair Housing compliant</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Follow-Up Cadence Visualizer (Structurely Differentiator) ──────── */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/70 dark:border-slate-800">
        <div className="rounded-3xl bg-slate-50 dark:bg-[#121622] border border-slate-200 dark:border-slate-800 p-8 sm:p-12">
          <div className="max-w-3xl mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Automated Conversational Cadence
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How Stratos Hub Nurtures Prospects Over 60 Days
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              When a buyer inquires on your site or WhatsApp, our persistent two-way nurturing checks in naturally until an appointment is booked.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">Minute 1 · Inquiry</div>
              <div className="font-semibold text-slate-900 dark:text-white">Instant Response</div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                "Hi! I see you were looking at the Marbella Coastal Villa. Here is the PDF lookbook and floor plan."
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">Day 3 · Check-in</div>
              <div className="font-semibold text-slate-900 dark:text-white">Schedule Showing</div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                "Our broker Marcus is hosting private walkthroughs this Saturday. Would 2 PM suit your schedule?"
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">Day 14 · Value Drop</div>
              <div className="font-semibold text-slate-900 dark:text-white">Portfolio Matching</div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                "A sister penthouse just listed in the same building with sea views. Thought you'd love a preview."
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2">
              <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">Day 30 · Closing</div>
              <div className="font-semibold text-slate-900 dark:text-white">Broker Hand-off</div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Buyer confirms pre-approval and books viewing. Broker receives instant dossier with full chat summary.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Financial ROI Calculator ──────────────────────────── */}
      <section id="roi" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/70 dark:border-slate-800">
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] p-8 sm:p-12 shadow-xl shadow-slate-200/40 dark:shadow-black/40">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Sliders */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-1.5">
                <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-xs font-bold">
                  Brokerage ROI Calculator
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Calculate Your Commission Lift
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  See how many additional showings and deals Stratos Hub unlocks each quarter.
                </p>
              </div>

              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Monthly Inquiries</span>
                  <span className="font-mono text-indigo-600">{inquiries} inquiries</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={inquiries}
                  onChange={(e) => setInquiries(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Average Deal Commission ($)</span>
                  <span className="font-mono text-indigo-600">${commission.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="3000"
                  max="50000"
                  step="1000"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Results Card */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Projected Quarterly Lift
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs text-slate-500">Broker Hours Saved:</span>
                  <span className="text-base font-bold font-mono">{hoursSaved} hrs</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs text-slate-500">Additional Showings:</span>
                  <span className="text-base font-bold font-mono text-emerald-600">+{toursBooked}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Commission Lift:</span>
                  <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                    +${quarterlyLift.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button asChild className="w-full h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                <Link to="/signup">Claim Your Free 14-Day Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/70 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-xs font-bold">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Simple, Predictable Plans for Brokerages.
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
            Pay for intelligence capacity — not seat licenses. Every plan includes full access to document ingestion and showing scheduling.
          </p>

          <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-4">
            <button
              onClick={() => setBillingAnnual(false)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                !billingAnnual ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500",
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingAnnual(true)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                billingAnnual ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500",
              )}
            >
              <span>Annual</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Starter */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Starter</h3>
                <p className="text-xs text-slate-500 mt-0.5">For boutique brokers and solo agents.</p>
              </div>
              <div className="text-3xl font-extrabold font-mono">
                {billingAnnual ? "$39" : "$49"}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> 1,000 AI Conversations / mo
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> Web Chat Widget Embed
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> Brochure & PDF Document RAG
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> Showing Booking Scheduler
                </div>
              </div>
            </div>
            <Button asChild variant="outline" className="mt-8 w-full rounded-xl text-xs font-bold">
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </Card>

          {/* Growth */}
          <Card className="rounded-3xl border-2 border-indigo-600 dark:border-indigo-500 p-7 flex flex-col justify-between shadow-xl relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </span>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Growth Agency</h3>
                <p className="text-xs text-slate-500 mt-0.5">For expanding teams and top brokerages.</p>
              </div>
              <div className="text-3xl font-extrabold font-mono">
                {billingAnnual ? "$119" : "$149"}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t">
                <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
                  <Check className="h-4 w-4 text-indigo-600" /> 8,000 AI Conversations / mo
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600" /> Official WhatsApp Cloud API
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600" /> Automated 60-Day Lead Nurturing
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600" /> Google & Outlook Calendar Sync
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600" /> Arabic RTL & English Bilingual
                </div>
              </div>
            </div>
            <Button asChild className="mt-8 w-full rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              <Link to="/signup">Start Free 14-Day Trial</Link>
            </Button>
          </Card>

          {/* Scale */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 p-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scale & Enterprise</h3>
                <p className="text-xs text-slate-500 mt-0.5">For multi-office brokerages.</p>
              </div>
              <div className="text-3xl font-extrabold font-mono">
                {billingAnnual ? "$319" : "$399"}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> 30,000 AI Conversations / mo
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> Unlimited Team Seats
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> Custom CRM Webhooks (Salesforce, HubSpot)
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> Dedicated Account Manager & 99.9% SLA
                </div>
              </div>
            </div>
            <Button asChild variant="outline" className="mt-8 w-full rounded-xl text-xs font-bold">
              <Link to="/signup">Deploy Enterprise</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-slate-200/70 dark:border-slate-800">
        <div className="text-center space-y-2 mb-10">
          <Badge className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 text-xs font-bold">
            FAQ
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "How does Stratos Hub compare to EliseAI and Structurely?",
              a: "Stratos Hub provides EliseAI-style autonomous showing booking and property intake combined with Structurely's persistent two-way long-term follow-up over WhatsApp and SMS. Plus, we offer native Arabic RTL support for the MENA region.",
            },
            {
              q: "Can it book showings directly into agent calendars?",
              a: "Yes! Stratos Hub connects two-way to Google Calendar and Microsoft Outlook. It detects open appointment slots, confirms the time with the buyer, creates the calendar event, and dispatches automated reminder notifications.",
            },
            {
              q: "Does it support WhatsApp Business Cloud API?",
              a: "Yes. Stratos Hub integrates with the official Meta WhatsApp Business Cloud API. Your assistant replies instantly, shares property photos and PDF brochures, and can alert human agents when a buyer is ready to submit an offer.",
            },
            {
              q: "Is our proprietary listing and client data protected?",
              a: "Yes. All data is encrypted with AES-256 at rest and TLS 1.3 in transit. Your agency portfolio is strictly private, isolated in your workspace, and never used to train public foundation models.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-400 transition-transform duration-200",
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

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090c12] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="font-bold text-slate-900 dark:text-white">Stratos Hub</span>
            <span>· Autonomous Real Estate AI</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-slate-600 dark:text-slate-400">
            <Link to="/test-site.html" className="hover:text-indigo-600 transition-colors">
              Widget Showcase
            </Link>
            <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">
              Workspace
            </Link>
            <Link to="/login" className="hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-indigo-600 transition-colors">
              Get Started
            </Link>
          </div>

          <div>© {new Date().getFullYear()} Stratos Hub Inc. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
