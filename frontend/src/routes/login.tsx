import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2, Bot, Zap, BarChart3 } from "lucide-react";
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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await api.auth.google(tokenResponse.access_token);
        setToken(res.token);
        localStorage.setItem("stratos_user", JSON.stringify(res.user));
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
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your workspace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">{t("Email")}</Label>
          <Input id="email" type="email" placeholder="you@agency.com" dir="ltr" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex justify-between">
            <Label htmlFor="password">{t("Password")}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">{t("Forgot?")}</Link>
          </div>
          <Input id="password" type="password" dir="ltr" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{t("Sign in")}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t("Or continue with")}</span>
          </div>
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={() => googleLogin()} disabled={loading}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
          {t("Sign in with Google")}
        </Button>

        <p className="text-sm text-center text-muted-foreground mt-4">{t("No account?")} <Link to="/signup" className="text-primary hover:underline">{t("Sign up")}</Link></p>
      </form>
    </AuthShell>
  );
}

const features = [
  { icon: Bot,       title: "AI lead capture",         desc: "Automatically extract and qualify leads from every conversation." },
  { icon: Zap,       title: "Instant 24/7 responses",  desc: "Reply to enquiries in under 30 seconds, any time of day." },
  { icon: BarChart3, title: "Full pipeline visibility", desc: "Track every lead from first contact to closed deal." },
] as const;

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-sm:px-4 max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-md overflow-hidden">
              <img 
                src={isDark ? "/logo.png" : "/logo-dark.png"} 
                alt="Stratos Hub" 
                className="h-full w-full object-contain scale-125" 
              />
            </div>
            <span className="font-semibold tracking-tight text-xl">{t("Stratos Hub")}</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{t(title)}</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-8">{t(subtitle)}</p>
          {children}
        </div>
      </div>
      <div className="hidden lg:block relative flex-1 bg-muted overflow-hidden">
        <img src="/auth-bg.png" alt="Luxury Real Estate" className="absolute inset-0 h-full w-full object-cover" />
        {/* Gradient overlay with feature highlights */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-4">{t("Why Stratos Hub")}</p>
          <div className="space-y-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 backdrop-blur-sm flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t(f.title)}</div>
                    <div className="text-xs text-white/70 mt-0.5">{t(f.desc)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
