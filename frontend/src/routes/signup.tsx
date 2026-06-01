import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
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
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(pwValue);

  return (
    <AuthShell title="Create your workspace" subtitle="Free for 14 days. No card required.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="company">{t("Agency name")}</Label>
          <Input id="company" placeholder="Riya Realty" {...register("company")} />
          {errors.company && <p className="text-xs text-destructive mt-1">{errors.company.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">{t("Work email")}</Label>
          <Input id="email" type="email" placeholder="you@agency.com" dir="ltr" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">{t("Password")}</Label>
          <Input
            id="password"
            type="password"
            dir="ltr"
            {...register("password", {
              onChange: (e) => setPwValue(e.target.value),
            })}
          />
          {pwValue.length > 0 && (
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
              </div>
              <p className={`text-xs mt-1 ${strength.color.replace("bg-", "text-")}`}>{t(strength.label)}</p>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{t("Create account")}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t("Or continue with")}</span>
          </div>
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={() => googleLogin()} disabled={loading}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
          {t("Sign up with Google")}
        </Button>

        <p className="text-sm text-center text-muted-foreground mt-4">{t("Already have one?")} <Link to="/login" className="text-primary hover:underline">{t("Sign in")}</Link></p>
      </form>
    </AuthShell>
  );
}
