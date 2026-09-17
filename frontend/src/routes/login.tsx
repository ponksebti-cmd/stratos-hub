import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon,
  Globe,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api, setToken } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { useGoogleLogin } from "@react-oauth/google";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Stratos Hub" }] }),
  component: Login,
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await api.auth.google(tokenResponse.access_token);
        setToken(res.token);
        localStorage.setItem("stratos_user", JSON.stringify(res.user));
        toast.success(t("Welcome back"));
        navigate({ to: "/dashboard" });
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Google login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google Login Failed"),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await api.auth.login(data.email, data.password);
      setToken(res.token);
      localStorage.setItem("stratos_user", JSON.stringify(res.user));
      toast.success(t("Welcome back"));
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="login"
      title="Welcome back"
      subtitle="Sign in to your agency workspace"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
            {t("Work email")}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="agent@luxuryagency.com"
              dir="ltr"
              className="h-11 ps-10 rounded-xl bg-background/70 border-black/10 dark:border-white/10 text-sm focus-visible:ring-primary/40 transition-all"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-destructive mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
              {t("Password")}
            </Label>
            <Link
              to="/forgot-password"
              className="text-[11px] text-primary hover:underline font-medium"
            >
              {t("Forgot?")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              dir="ltr"
              placeholder="••••••••••••"
              className="h-11 ps-10 pe-10 rounded-xl bg-background/70 border-black/10 dark:border-white/10 text-sm focus-visible:ring-primary/40 transition-all"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              title={showPassword ? t("Hide password") : t("Show password")}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-destructive mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Primary Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 rounded-full font-semibold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/95 text-primary-foreground active:scale-[0.98] transition-all mt-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin me-2" />
          ) : (
            <Sparkles className="h-4 w-4 me-2" />
          )}
          {t("Sign in")}
        </Button>

        {/* Apple-style Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-black/5 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
            <span className="bg-card/90 px-3 text-muted-foreground rounded-full">
              {t("Or continue with")}
            </span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-full ios-glass border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all text-xs font-semibold gap-2"
          onClick={() => googleLogin()}
          disabled={loading}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t("Sign in with Google")}
        </Button>
      </form>
    </AuthShell>
  );
}

// ── Luxury Apple-Grade AuthShell Component ─────────────────────────────────────
export function AuthShell({
  mode,
  title,
  subtitle,
  children,
}: {
  mode: "login" | "signup" | "forgot";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkStored = localStorage.getItem("theme") === "dark";
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = localStorage.getItem("theme") ? isDarkStored : systemDark;
    setIsDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/20 selection:text-primary"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ── Luxury Architectural Ambient Background ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <img
          src="/auth-bg.png"
          alt="Luxury Architecture"
          className="w-full h-full object-cover opacity-25 dark:opacity-20 scale-105 filter blur-[2px] transition-transform duration-1000"
        />
        {/* Deep gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50 dark:from-background dark:via-background/90 dark:to-background/60" />
      </div>

      {/* ── Ambient Motion-Blur Color Orbs ────────────────────────────────── */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[580px] h-[340px] bg-primary/20 blur-[130px] rounded-full pointer-events-none -z-10 ambient-glow-orb" />
      <div className="fixed bottom-10 right-10 w-[380px] h-[260px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none -z-10 ambient-glow-orb" style={{ animationDelay: "-3s" }} />

      {/* ── Top Apple-Grade Nav Bar (So user NEVER gets lost) ─────────────── */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between relative z-30">
        {/* Back to Home Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ios-glass border border-black/5 dark:border-white/10 text-xs font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm group"
        >
          <ArrowLeft className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""} transition-transform group-hover:-translate-x-0.5`} />
          <span>{t("Back to Stratos Hub")}</span>
        </Link>

        {/* Center Brand Mark */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-md shadow-primary/25 ring-2 ring-primary/20 transition-transform group-hover:scale-105">
            <img
              src={isDark ? "/logo.png" : "/logo-dark.png"}
              alt="Stratos"
              className="h-full w-full object-contain scale-110"
            />
          </div>
          <span className="font-bold text-sm tracking-tight hidden sm:inline">Stratos Hub</span>
        </Link>

        {/* Right Controls: Theme + Language */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-8 w-8 rounded-full ios-glass text-muted-foreground hover:text-foreground active:scale-90 transition-all"
            title={isDark ? t("Light mode") : t("Dark mode")}
          >
            {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")}
            className="h-8 px-2.5 font-bold uppercase text-[11px] rounded-full ios-glass text-muted-foreground hover:text-foreground gap-1 active:scale-95"
          >
            <Globe className="h-3 w-3" />
            <span>{i18n.language === "ar" ? "English" : "العربية"}</span>
          </Button>
        </div>
      </header>

      {/* ── Main Content: Centered Luxury Glass Card ──────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-20">
        <div className="w-full max-w-md mx-auto">
          <div className="rounded-3xl ios-glass border border-white/30 dark:border-white/10 p-7 sm:p-9 shadow-2xl backdrop-blur-3xl motion-blur-enter relative overflow-hidden">
            {/* Top Specular Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

            {/* Apple-style Segmented Switcher (Sign In ⇄ Create Account) */}
            {mode !== "forgot" && (
              <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/10 rounded-full border border-white/10 mb-6 shadow-inner select-none">
                <Link
                  to="/login"
                  className={cn(
                    "flex-1 py-1.5 text-xs font-semibold rounded-full transition-all text-center",
                    mode === "login"
                      ? "bg-background text-foreground shadow-sm shadow-black/5"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("Sign in")}
                </Link>
                <Link
                  to="/signup"
                  className={cn(
                    "flex-1 py-1.5 text-xs font-semibold rounded-full transition-all text-center",
                    mode === "signup"
                      ? "bg-background text-foreground shadow-sm shadow-black/5"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("Create account")}
                </Link>
              </div>
            )}

            {/* Header Titles */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {t(title)}
              </h1>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {t(subtitle)}
              </p>
            </div>

            {/* Form Slot */}
            {children}

            {/* Apple-grade Security & Model Privacy Assurance */}
            <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10 flex items-center justify-center gap-2 text-[11px] text-muted-foreground text-center">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              <span>
                {t("End-to-End Encrypted")} · {t("Private Model Isolation")}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Subtle Apple-Grade Footer ─────────────────────────────────────── */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 relative z-20">
        <div>© 2026 Stratos Hub. {t("All rights reserved.")}</div>
        <div className="flex items-center gap-4 text-[11px]">
          <Link to="/privacy" className="hover:underline">
            {t("Privacy Policy")}
          </Link>
          <span>·</span>
          <Link to="/test-site.html" target="_blank" rel="noopener noreferrer" className="hover:underline">
            {t("Agency Web Demo")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
