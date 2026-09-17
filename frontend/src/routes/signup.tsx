import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Loader2,
  Building,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./login";
import { toast } from "sonner";
import { api, setToken } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { useGoogleLogin } from "@react-oauth/google";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Stratos Hub" }] }),
  component: Signup,
});

const signupSchema = z.object({
  company: z.string().min(2, "Agency name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type SignupForm = z.infer<typeof signupSchema>;

function passwordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "", width: "0%" };
  const score =
    (pw.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  if (score <= 1) return { label: "Weak", color: "bg-destructive", width: "25%" };
  if (score === 2) return { label: "Fair", color: "bg-warning", width: "50%" };
  if (score === 3) return { label: "Strong", color: "bg-success", width: "75%" };
  return { label: "Very strong", color: "bg-success", width: "100%" };
}

function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pwValue, setPwValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await api.auth.google(tokenResponse.access_token);
        setToken(res.token);
        localStorage.setItem("stratos_user", JSON.stringify(res.user));
        toast.success(t("Workspace created successfully"));
        navigate({ to: "/dashboard" });
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Google registration failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google Registration Failed"),
  });

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    try {
      const res = await api.auth.register(data.email, data.password, data.company);
      setToken(res.token);
      toast.success(t("Workspace created successfully"));
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(pwValue);

  return (
    <AuthShell
      mode="signup"
      title="Create your agency workspace"
      subtitle="Free for 14 days · Full access · No credit card required"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Agency Name */}
        <div className="space-y-1.5">
          <Label htmlFor="company" className="text-xs font-semibold text-foreground/90">
            {t("Agency name")}
          </Label>
          <div className="relative">
            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="company"
              placeholder="e.g. Apex Luxury Realty"
              className="h-11 ps-10 rounded-xl bg-background/70 border-black/10 dark:border-white/10 text-sm focus-visible:ring-primary/40 transition-all"
              {...register("company")}
            />
          </div>
          {errors.company && (
            <p className="text-[11px] text-destructive mt-1 font-medium">{errors.company.message}</p>
          )}
        </div>

        {/* Work Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
            {t("Work email")}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="founder@luxuryagency.com"
              dir="ltr"
              className="h-11 ps-10 rounded-xl bg-background/70 border-black/10 dark:border-white/10 text-sm focus-visible:ring-primary/40 transition-all"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-destructive mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
            {t("Password")}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              dir="ltr"
              placeholder="Minimum 8 characters"
              className="h-11 ps-10 pe-10 rounded-xl bg-background/70 border-black/10 dark:border-white/10 text-sm focus-visible:ring-primary/40 transition-all"
              {...register("password", {
                onChange: (e) => setPwValue(e.target.value),
              })}
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

          {/* Password Strength Indicator */}
          {pwValue.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className={`text-[11px] font-semibold ${strength.color.replace("bg-", "text-")}`}>
                {t(strength.label)}
              </p>
            </div>
          )}

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
          {t("Create account")}
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
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          {t("Sign up with Google")}
        </Button>
      </form>
    </AuthShell>
  );
}
