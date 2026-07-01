import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./login";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Stratos Hub" }] }),
  component: Forgot,
});

function Forgot() {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a reset link.">
      {sent ? (
        <div className="text-sm text-muted-foreground">
          <p>If an account exists for that email, a reset link is on its way.</p>
          <Link to="/login" className="text-primary hover:underline mt-4 inline-block">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required />
          </div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
