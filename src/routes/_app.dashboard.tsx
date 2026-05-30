import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MessageSquare, Users, Coins, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Stratos Hub" }] }),
  component: Dashboard,
});

const statusColor: Record<string, string> = {
  new: "bg-accent text-accent-foreground",
  contacted: "bg-warning/20 text-warning-foreground",
  qualified: "bg-success/20 text-success",
  won: "bg-success text-success-foreground",
  lost: "bg-muted text-muted-foreground",
};

function Dashboard() {
  const { t } = useTranslation();

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => api.leads.list(),
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => api.chat.sessions(),
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.settings.get(),
  });

  const { data: usage = [] } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.usage.summary(),
  });

  const subscription = settings?.subscription;
  const totalCreditsUsed = usage.reduce((a, d) => a + d.credits, 0);
  const totalChats = usage.reduce((a, d) => a + d.chats, 0);
  const creditsLeft = subscription?.creditsLeft ?? 0;
  const creditsTotal = creditsLeft + totalCreditsUsed || 1;
  const usagePct = Math.min(100, (totalCreditsUsed / creditsTotal) * 100).toFixed(1);

  // Compute trends by splitting usage into two halves
  const half = Math.floor(usage.length / 2);
  const firstHalf = usage.slice(0, half);
  const secondHalf = usage.slice(half);
  const sumCredits = (arr: typeof usage) => arr.reduce((a, d) => a + d.credits, 0);
  const sumChats = (arr: typeof usage) => arr.reduce((a, d) => a + d.chats, 0);
  const creditsTrend = firstHalf.length > 0
    ? Math.round(((sumCredits(secondHalf) - sumCredits(firstHalf)) / (sumCredits(firstHalf) || 1)) * 100)
    : 0;
  const chatsTrend = firstHalf.length > 0
    ? Math.round(((sumChats(secondHalf) - sumChats(firstHalf)) / (sumChats(firstHalf) || 1)) * 100)
    : 0;

  const kpis = [
    { label: t("Total leads"), value: leads.length.toString(), delta: t("All time"), icon: Users, trend: undefined as number | undefined },
    { label: t("AI chats"), value: totalChats.toLocaleString(), delta: t("Last 7 days"), icon: MessageSquare, trend: chatsTrend },
    { label: t("Credits left"), value: creditsLeft.toLocaleString(), delta: subscription ? `${t("Renews")} ${subscription.renewsAt}` : "—", icon: Coins, trend: undefined as number | undefined },
    { label: t("Credits used"), value: totalCreditsUsed.toLocaleString(), delta: t("Last 7 days"), icon: TrendingUp, trend: creditsTrend },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{k.label}</div>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 text-2xl font-semibold">{k.value}</div>
                {k.trend !== undefined && k.trend !== 0 ? (
                  <div className={`mt-1 text-xs flex items-center gap-0.5 ${k.trend > 0 ? "text-success" : "text-destructive"}`}>
                    {k.trend > 0
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(k.trend)}% {t("vs prior period")}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-muted-foreground">{k.delta}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("Recent conversations")}</CardTitle>
            <Link to="/chat" className="text-xs text-primary inline-flex items-center gap-1">{t("View all")} <ArrowUpRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start justify-between border-b last:border-0 pb-3 last:pb-0">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-5 w-12 rounded-full ms-4" />
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("No conversations yet.")}</p>
            ) : sessions.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-start justify-between border-b last:border-0 pb-3 last:pb-0">
                <div>
                  <div className="text-sm font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(s.updatedAt).toLocaleString()}</div>
                </div>
                <Badge variant="outline">{t("Active")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("Recent leads")}</CardTitle>
            <Link to="/leads" className="text-xs text-primary inline-flex items-center gap-1">{t("View all")} <ArrowUpRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {leadsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-2/5" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full ms-4" />
                  </div>
                ))}
              </div>
            ) : leads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("No leads yet.")}</p>
            ) : leads.slice(0, 4).map((l) => (
              <div key={l.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                <div>
                  <div className="text-sm font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.propertyType} · {l.city}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusColor[l.status]}`}>{t(l.status)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("Usage summary")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div><div className="text-muted-foreground">{t("Plan")}</div><div className="font-medium capitalize mt-1">{subscription?.plan ?? "—"}</div></div>
            <div><div className="text-muted-foreground">{t("Credits used this cycle")}</div><div className="font-medium mt-1">{totalCreditsUsed.toLocaleString()} / {creditsTotal.toLocaleString()}</div></div>
            <div><div className="text-muted-foreground">{t("Next renewal")}</div><div className="font-medium mt-1">{subscription?.renewsAt ?? "—"}</div></div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{totalCreditsUsed.toLocaleString()} / {creditsTotal.toLocaleString()} {t("credits used")}</span>
              <span className={Number(usagePct) >= 90 ? "text-destructive font-medium" : Number(usagePct) >= 70 ? "text-warning-foreground font-medium" : ""}>{usagePct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all ${Number(usagePct) >= 90 ? "bg-destructive" : Number(usagePct) >= 70 ? "bg-warning" : "bg-success"}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
