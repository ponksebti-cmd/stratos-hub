import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  MessageSquare,
  FileText,
  Users,
  TrendingUp,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import i18n from "@/lib/i18n"; // Import to check direction

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stratos Hub — AI co-pilot for real-estate agencies" },
      {
        name: "description",
        content:
          "Upload listings, qualify leads, and grow your pipeline with an AI assistant built for real-estate teams.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  const features = [
    {
      icon: FileText,
      title: t("Smart file intake"),
      body: t(
        "Drop PDFs, CSVs, and spreadsheets. We parse listings, leads, and pricing automatically.",
      ),
    },
    {
      icon: MessageSquare,
      title: t("AI assistant"),
      body: t(
        "A trained agent that answers buyer questions, qualifies leads, and drafts WhatsApp messages.",
      ),
    },
    {
      icon: Users,
      title: t("Lead capture"),
      body: t("Every conversation becomes a structured lead with budget, city, and property type."),
    },
    {
      icon: TrendingUp,
      title: t("ROI tracking"),
      body: t("Watch credits, conversations, and pipeline value in one dashboard."),
    },
  ];

  const steps = [
    {
      n: "01",
      title: t("Connect your data"),
      body: t("Upload listings or paste your API key in under two minutes."),
    },
    {
      n: "02",
      title: t("Train the assistant"),
      body: t("We index your inventory so replies stay accurate and on-brand."),
    },
    {
      n: "03",
      title: t("Convert leads faster"),
      body: t("Your team handles only the qualified, sales-ready conversations."),
    },
  ];

  const plans = [
    {
      name: t("Starter"),
      price: "$49",
      desc: t("For solo agents"),
      features: [t("1,000 AI credits"), t("1 user"), t("WhatsApp inbox"), t("Email support")],
    },
    {
      name: t("Growth"),
      price: "$149",
      desc: t("For growing teams"),
      features: [t("8,000 AI credits"), t("5 users"), t("Lead routing"), t("Priority support")],
      featured: true,
    },
    {
      name: t("Scale"),
      price: "$399",
      desc: t("For brokerages"),
      features: [
        t("30,000 AI credits"),
        t("Unlimited users"),
        t("Custom integrations"),
        t("Dedicated CSM"),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md overflow-hidden">
              <img
                src={isDark ? "/logo.png" : "/logo-dark.png"}
                alt="Stratos Hub"
                className="h-full w-full object-contain scale-125"
              />
            </div>
            <span className="font-semibold text-lg">{t("Stratos Hub")}</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              {t("Features")}
            </a>
            <a href="#how" className="hover:text-foreground">
              {t("How it works")}
            </a>
            <a href="#pricing" className="hover:text-foreground">
              {t("Pricing")}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">{t("Sign in")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">{t("Get started")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />{" "}
          {t("Now in private beta for India & MENA")}
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground max-w-3xl mx-auto">
          {t("The AI co-pilot for modern real-estate agencies")}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t(
            "Stratos Hub turns your listings, brochures, and chats into a 24/7 assistant that qualifies leads, books showings, and grows your pipeline — without adding headcount.",
          )}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/signup">
              {t("Start free trial")}
              <ArrowRight className={`h-4 w-4 ${isRtl ? "mr-2 rotate-180" : "ml-2"}`} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard">{t("View live demo")}</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border-border/60">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-muted/40 border-y border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("Up and running in an afternoon")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("No engineering team required.")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="rounded-xl bg-card border border-border p-6">
                <div className="text-sm font-mono text-primary">{s.n}</div>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("Simple, predictable pricing")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("Pay for credits — not seats.")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card key={p.name} className={p.featured ? "border-primary shadow-lg relative" : ""}>
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {t("Most popular")}
                </div>
              )}
              <CardContent className="p-6">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.desc}</div>
                <div className="mt-4 text-4xl font-semibold">
                  {p.price}
                  <span className="text-base font-normal text-muted-foreground">/{t("mo")}</span>
                </div>
                <Button
                  asChild
                  className="w-full mt-6"
                  variant={p.featured ? "default" : "outline"}
                >
                  <Link to="/signup">{t("Start trial")}</Link>
                </Button>
                <ul className="mt-6 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl bg-foreground text-background p-10 md:p-14 text-center">
          <h2 className="text-3xl font-semibold">{t("Ready to close more deals?")}</h2>
          <p className="mt-3 opacity-80">
            {t("Spin up your workspace in minutes. No credit card required.")}
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to="/signup">{t("Get started free")}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
        <div>© 2026 {t("Stratos Hub. Built for real-estate teams.")}</div>
        <Link to="/privacy" className="hover:underline opacity-80">
          {t("Privacy Policy")}
        </Link>
      </footer>
    </div>
  );
}
