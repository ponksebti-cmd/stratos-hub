import { useState, useEffect, useCallback } from "react";
import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, MessageSquare, Users, Settings, TrendingUp, Sparkles, Bell, LogOut, Sun, Moon, Search,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { clearToken } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CommandPalette } from "@/components/CommandPalette";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/files",     label: "Files",     icon: FileText },
  { to: "/chat",      label: "Chat",      icon: MessageSquare },
  { to: "/leads",     label: "Leads",     icon: Users },
  { to: "/roi",       label: "ROI",       icon: TrendingUp },
  { to: "/settings",  label: "Settings",  icon: Settings },
] as const;

export function AppShell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = navItems.find((n) => pathname.startsWith(n.to));

  const [cmdOpen, setCmdOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
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

  const companyName = settings?.company?.name ?? "Stratos Hub";
  const creditsLeft = settings?.subscription?.creditsLeft ?? 0;
  const initials = companyName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  function handleSignOut() {
    clearToken();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
          <div className="sparkle-hover flex h-10 w-10 items-center justify-center rounded-md overflow-hidden transition-transform duration-200 hover:scale-110 cursor-default">
            <img 
              src={dark ? "/logo.png" : "/logo-dark.png"} 
              alt="Stratos Hub" 
              className="h-full w-full object-contain scale-125" 
            />
          </div>
          <span className="font-semibold text-sidebar-foreground">{t("Stratos Hub")}</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 overflow-hidden",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:translate-x-0.5"
                )}
              >
                {active && (
                  <span className="nav-indicator absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                )}
                <Icon className={cn(
                  "h-4 w-4 transition-transform duration-150",
                  active ? "scale-110 text-primary" : "group-hover:scale-110"
                )} />
                <span>{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-lg bg-accent/40 p-3 text-xs">
            <div className="font-medium text-foreground">{settings?.subscription?.plan ? `${settings.subscription.plan} ${t("plan")}` : t("Starter plan")}</div>
            <div className="text-muted-foreground mt-0.5">{creditsLeft.toLocaleString()} {t("credits left")}</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b bg-card">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">{current ? t(current.label) : t("Stratos Hub")}</h1>
          </div>
          <div className="flex items-center gap-1">
            {/* Search / Command palette trigger */}
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground" onClick={() => setCmdOpen(true)}>
              <Search className="h-4 w-4" />
              <span className="text-xs">{t("Search…")}</span>
              <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-60">
                ⌘K
              </kbd>
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setCmdOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>

            {/* Dark mode toggle */}
            <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} title={dark ? t("Light mode") : t("Dark mode")} className="transition-transform active:scale-90">
              {dark
                ? <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
                : <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />
              }
            </Button>

            {/* Language toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="font-medium uppercase">
                  {i18n.language === "ar" ? "العربية" : "EN"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => i18n.changeLanguage("ar")}>العربية</DropdownMenuItem>
                <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>English</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 ps-2 pe-3">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback></Avatar>
                  <span className="hidden sm:inline text-sm">{companyName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{companyName}</div>
                  <div className="text-xs text-muted-foreground">{settings?.user?.email ?? ""}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/settings">{t("Settings")}</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 me-2" />{t("Sign out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="md:hidden border-b overflow-x-auto">
          <div className="flex gap-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md whitespace-nowrap transition-all duration-150 active:scale-95",
                    active
                      ? "bg-primary text-primary-foreground scale-[1.03] shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn("h-4 w-4 transition-transform duration-150", active && "scale-110")} />
                  <span className="text-[10px] font-medium">{t(item.label)}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div key={pathname} className="card-pop h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
