import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/roi")({
  head: () => ({ meta: [{ title: "ROI — Stratos Hub" }] }),
  component: Roi,
});

function Roi() {
  const { t } = useTranslation();

  const { data: usage = [], isLoading } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.usage.summary(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => api.leads.list(),
  });

  const totals = usage.reduce(
    (a, d) => ({ credits: a.credits + d.credits, chats: a.chats + d.chats }),
    { credits: 0, chats: 0 }
  );
  
  // Calculate dynamic ROI metrics
  const estValue = totals.chats * 4500; // est ₹ per chat
  const timeSavedHrs = Math.round(totals.chats * 0.066); // ~4 mins saved per chat
  
  // Conversion lift calculation: qualified leads / total leads (compare to a baseline of 5%)
  const qualifiedLeads = leads.filter(l => l.status === "qualified" || l.status === "won").length;
  const conversionRate = leads.length > 0 ? (qualifiedLeads / leads.length) * 100 : 0;
  const conversionLift = conversionRate > 5 ? Math.round(conversionRate - 5) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: t("Credits consumed"), v: totals.credits.toLocaleString() },
          { l: t("Chats handled"), v: totals.chats.toLocaleString() },
          { l: t("Est. pipeline value"), v: `₹${(estValue / 100000).toFixed(1)}L` },
          { l: t("Avg. cost / lead"), v: totals.chats > 0 ? `₹${Math.round((totals.credits * 1.5) / totals.chats)}` : "—" },
        ].map((k) => (
          <Card key={k.l}><CardContent className="p-5">
            <div className="text-sm text-muted-foreground">{k.l}</div>
            <div className="mt-2 text-2xl font-semibold">{k.v}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Usage trend")}</CardTitle>
          <CardDescription>{t("Credits consumed and chats handled over the last 7 days.")}</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usage}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="credits" stroke="var(--color-chart-1)" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="chats" stroke="var(--color-chart-2)" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("Business impact")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-muted-foreground">{t("Time saved")}</div>
              <div className="text-2xl font-semibold mt-1">{timeSavedHrs} {t("hrs")}</div>
              <div className="text-xs text-muted-foreground mt-1">{t("~4 min saved per AI-handled chat.")}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("Response time")}</div>
              <div className="text-2xl font-semibold mt-1">{"< 30s"}</div>
              <div className="text-xs text-muted-foreground mt-1">{t("Down from ~4 hours average.")}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("Conversion lift")}</div>
              <div className="text-2xl font-semibold mt-1">+{conversionLift}%</div>
              <div className="text-xs text-muted-foreground mt-1">{t("Qualified leads vs. 5% baseline.")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
