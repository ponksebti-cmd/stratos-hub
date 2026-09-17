import { useState, useEffect, useCallback } from "react";
import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  Settings,
  TrendingUp,
  Bell,
  LogOut,
  Sun,
  Moon,
  Search,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { clearToken, isDemoMode } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CommandPalette } from "@/components/CommandPalette";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/files", label: "Files", icon: FileText },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/roi", label: "ROI", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = navItems.find((n) => pathname.startsWith(n.to));

  const [cmdOpen, setCmdOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("theme");
    return stored ? stored === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCmdOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.settings.get(),
    retry: false,
  });

  const { data: usage = [] } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.usage.summary(),
    retry: false,
  });

  const companyName = settings?.company?.name ?? "Stratos Hub";
  const creditsLeft = settings?.subscription?.creditsLeft ?? 0;
  const creditsUsed = usage.reduce((a: number, d: { credits: number }) => a + d.credits, 0);
  const creditsTotal = creditsLeft + creditsUsed || 1;
  const creditsPct = Math.min(100, Math.round((creditsUsed / creditsTotal) * 100));
  const initials = companyName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleSignOut() {
    clearToken();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar relative">
        {/* Top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* Logo / brand */}
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border">
          <div className="sparkle-hover flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden flex-shrink-0 transition-transform duration-200 hover:scale-110 cursor-default ring-1 ring-primary/10">
            <img
              src={dark ? "/logo.png" : "/logo-dark.png"}
              alt="Stratos Hub"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[15px] text-sidebar-foreground leading-tight tracking-tight truncate">
              {t("Stratos Hub")}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium tracking-wide leading-none mt-0.5">
              {t("Real Estate AI")}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 overflow-hidden",
                  active
                    ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )}
              >
                {active && (
                  <span className="nav-indicator absolute start-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-e-full bg-primary shadow-[0_0_8px_0px] shadow-primary/50" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-all duration-150",
                    active ? "text-primary" : "group-hover:scale-105",
                  )}
                />
                <span className="truncate">{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer — plan + credits */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-xl bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground capitalize">
                {settings?.subscription?.plan ?? t("Starter")} {t("plan")}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground">
                {creditsLeft.toLocaleString()} {t("left")}
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    creditsPct >= 90
                      ? "bg-destructive"
                      : creditsPct >= 70
                        ? "bg-warning"
                        : "bg-primary",
                  )}
                  style={{ width: `${creditsPct}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground">
                {creditsPct}% {t("used")}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Demo banner */}
        {isDemoMode() && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-xs text-primary flex flex-wrap items-center justify-between gap-2 z-30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0 animate-pulse text-primary" />
              <span className="font-medium">
                {t(
                  "Live Demo Mode: Exploring Apex Luxury Realty sample inventory, chats, and qualified leads.",
                )}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <Link to="/signup" className="underline hover:text-primary/80 font-semibold">
                {t("Start Free Trial")}
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/" className="hover:underline text-muted-foreground hover:text-foreground">
                {t("Back to Website")}
              </Link>
            </div>
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 md:px-8 border-b ios-glass">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">
              {current ? t(current.label) : t("Stratos Hub")}
            </h1>
          </div>

          {/* iOS 26ish Dynamic Spatial Island Pill */}
          <div
            onClick={() => setCmdOpen(true)}
            className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full ios-glass dynamic-island cursor-pointer border border-primary/25 hover:border-primary/50 text-xs shadow-sm hover:shadow-primary/20 transition-all group select-none"
            title={t("Open Stratos Command Center")}
          >
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex items-end gap-0.5 h-3 px-1">
                <span
                  className="w-0.5 bg-primary rounded-full neural-wave-bar"
                  style={{ animationDelay: "0s" }}
                />
                <span
                  className="w-0.5 bg-primary rounded-full neural-wave-bar"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="w-0.5 bg-primary rounded-full neural-wave-bar"
                  style={{ animationDelay: "0.4s" }}
                />
                <span
                  className="w-0.5 bg-primary rounded-full neural-wave-bar"
                  style={{ animationDelay: "0.1s" }}
                />
              </div>
            </div>
            <span className="font-semibold text-foreground tracking-tight flex items-center gap-1">
              <span>{t("Stratos Spatial AI")}</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                · {creditsLeft.toLocaleString()} {t("credits left")}
              </span>
            </span>
            <kbd className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Search / Command palette trigger */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={() => setCmdOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">{t("Search…")}</span>
              <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-60">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setCmdOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((d) => !d)}
              title={dark ? t("Light mode") : t("Dark mode")}
              className="transition-transform active:scale-90 rounded-lg"
            >
              {dark ? (
                <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />
              )}
            </Button>

            {/* Language toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold uppercase text-xs rounded-lg px-2.5"
                >
                  {i18n.language === "ar" ? "ع" : "EN"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => i18n.changeLanguage("ar")}>
                  العربية
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="rounded-lg relative">
              <Bell className="h-4 w-4" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 ps-2 pe-3 rounded-xl hover:bg-accent/60">
                  <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                    {companyName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold truncate">{companyName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {settings?.user?.email ?? ""}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">{t("Settings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 me-2" />
                  {t("Sign out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Mobile nav ──────────────────────────────────────────────────── */}
        <div className="md:hidden border-b overflow-x-auto scrollbar-none bg-card/80 backdrop-blur-md">
          <div className="flex gap-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 active:scale-95",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-150",
                      active && "scale-110",
                    )}
                  />
                  <span className="text-[10px] font-medium">{t(item.label)}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div key={pathname} className="motion-blur-enter h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
