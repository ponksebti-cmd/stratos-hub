import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./login";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Stratos Hub" }] }),
  component: Forgot,
});

function Forgot() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <AuthShell
      mode="forgot"
      title="Reset your password"
      subtitle="We'll send a secure password reset link to your work email."
    >
      {sent ? (
        <div className="text-center space-y-4 py-2">
          <div className="h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground">Reset link dispatched</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If an account exists for <strong className="text-foreground">{email}</strong>, check your inbox for instructions to restore access.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full h-11 rounded-full text-xs font-semibold mt-4">
            <Link to="/login">
              <ArrowLeft className="h-3.5 w-3.5 me-2" />
              {t("Back to sign in")}
            </Link>
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) setSent(true);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
              {t("Work email")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@luxuryagency.com"
                dir="ltr"
                className="h-11 ps-10 rounded-xl bg-background/70 border-black/10 dark:border-white/10 text-sm focus-visible:ring-primary/40 transition-all"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 rounded-full font-semibold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/95 text-primary-foreground active:scale-[0.98] transition-all">
            Send reset link
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-2">
            <Link to="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              {t("Back to sign in")}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
