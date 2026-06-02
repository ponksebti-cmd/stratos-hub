import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Loader2,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Globe,
  Check,
  Sparkles,
  Send,
  ExternalLink,
  AlertCircle,
  User2,
  Building2,
  KeyRound,
  CreditCard,
  Bot,
  Radio,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Stratos Hub" }] }),
  component: Settings,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function webhookUrl(platform: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/chat/${platform}/webhook`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 shrink-0"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? <span className="text-emerald-600">Copied!</span> : label}
    </Button>
  );
}

function WebhookRow({ platform }: { platform: string }) {
  const { t } = useTranslation();
  const url = webhookUrl(platform);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {t("Webhook URL (paste in developer portal)")}
      </Label>
      <div className="flex gap-2 items-center">
        <Input value={url} readOnly dir="ltr" className="font-mono text-xs bg-muted" />
        <CopyButton value={url} label={t("Copy")} />
      </div>
    </div>
  );
}

function ConnectedBadge({ connected }: { connected: boolean }) {
  const { t } = useTranslation();
  return connected ? (
    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200 gap-1.5 font-medium">
      <CheckCircle2 className="h-3 w-3" /> {t("Connected")}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground gap-1.5 font-medium">
      <AlertCircle className="h-3 w-3" /> {t("Not configured")}
    </Badge>
  );
}

// ── Brand icon components ─────────────────────────────────────────────────────
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" fill="none">
      <rect width="48" height="48" rx="12" fill="#25D366" />
      <path
        d="M34.5 13.5A14.47 14.47 0 0 0 24 9C16.27 9 10 15.27 10 23c0 2.5.66 4.95 1.9 7.1L9 38l8.1-2.9A14.95 14.95 0 0 0 24 37c7.73 0 14-6.27 14-14a13.95 13.95 0 0 0-3.5-9.5ZM24 35a12.94 12.94 0 0 1-6.6-1.8l-.47-.28-4.87 1.74 1.23-4.74-.3-.49A13 13 0 1 1 24 35Zm7.11-9.74c-.39-.2-2.3-1.14-2.66-1.27-.36-.13-.62-.2-.88.2s-1.01 1.27-1.24 1.53c-.23.26-.46.3-.85.1a10.67 10.67 0 0 1-3.14-1.94 11.75 11.75 0 0 1-2.17-2.7c-.23-.4-.02-.61.17-.81.18-.18.4-.46.6-.69.2-.23.26-.4.4-.66.13-.26.06-.49-.03-.69-.1-.2-.88-2.12-1.2-2.9-.32-.77-.64-.66-.88-.67h-.75c-.26 0-.68.1-1.04.49s-1.36 1.33-1.36 3.25 1.4 3.77 1.59 4.03c.2.26 2.74 4.18 6.64 5.86.93.4 1.65.64 2.22.82.93.3 1.78.26 2.45.16.75-.12 2.3-.94 2.63-1.85.32-.91.32-1.69.22-1.85-.1-.16-.36-.26-.75-.46Z"
        fill="white"
      />
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#msg-g)" />
      <defs>
        <linearGradient id="msg-g" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#0084FF" />
          <stop offset="1" stopColor="#A33FFF" />
        </linearGradient>
      </defs>
      <path
        d="M24 9C15.16 9 8 15.73 8 24.07c0 4.46 1.82 8.4 4.77 11.17.25.22.4.54.41.87l.08 2.74a1.06 1.06 0 0 0 1.5.94l3.05-1.35c.26-.11.55-.14.82-.07A17.5 17.5 0 0 0 24 39c8.84 0 16-6.73 16-15.07C40 15.58 32.84 9 24 9Zm9.64 11.52-4.8 7.63a2.5 2.5 0 0 1-3.63.67l-3.82-2.86a1 1 0 0 0-1.21 0l-5.15 3.91c-.69.52-1.58-.32-1.1-1.06l4.8-7.63a2.5 2.5 0 0 1 3.63-.67l3.82 2.86a1 1 0 0 0 1.21 0l5.15-3.91c.69-.52 1.58.32 1.1 1.06Z"
        fill="white"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#ig-g)" />
      <defs>
        <radialGradient id="ig-g" cx="30%" cy="107%" r="130%">
          <stop offset="0%" stopColor="#ffd879" />
          <stop offset="15%" stopColor="#f9a33a" />
          <stop offset="35%" stopColor="#ea4460" />
          <stop offset="60%" stopColor="#c2326b" />
          <stop offset="100%" stopColor="#6b3fa0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="7" stroke="white" strokeWidth="2.5" />
      <rect x="10" y="10" width="28" height="28" rx="8" stroke="white" strokeWidth="2.5" />
      <circle cx="33" cy="15" r="2" fill="white" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" fill="none">
      <rect width="48" height="48" rx="12" fill="#010101" />
      <path
        d="M34 19.42a8.98 8.98 0 0 1-5.25-1.67v7.62a6.96 6.96 0 1 1-6.96-6.96c.25 0 .5.01.74.04v3.85a3.17 3.17 0 1 0 2.22 3.07V10h3.84a5.26 5.26 0 0 0 5.41 5.41v4Z"
        fill="#25F4EE"
      />
      <path
        d="M34 19.42a8.98 8.98 0 0 1-5.25-1.67v7.62a6.96 6.96 0 1 1-6.96-6.96c.25 0 .5.01.74.04v3.85a3.17 3.17 0 1 0 2.22 3.07V10h3.84a5.26 5.26 0 0 0 5.41 5.41v4Z"
        fill="white"
        opacity="0.4"
      />
      <path
        d="M33 18.42a8.98 8.98 0 0 1-5.25-1.67v7.62a6.96 6.96 0 1 1-6.96-6.96c.25 0 .5.01.74.04v3.85a3.17 3.17 0 1 0 2.22 3.07V9h3.84a5.26 5.26 0 0 0 5.41 5.41v4Z"
        fill="#FE2C55"
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function Settings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  const [newKey, setNewKey] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.settings.get(),
  });

  const [profileDraft, setProfileDraft] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const saveProfileMutation = useMutation({
    mutationFn: () => api.settings.update(profileDraft),
    onSuccess: () => {
      toast.success(t("Profile saved"));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setProfileDraft({});
    },
    onError: () => toast.error(t("Save failed")),
  });

  const [systemPrompt, setSystemPrompt] = useState("");
  useEffect(() => {
    if (settings?.systemPrompt !== undefined) setSystemPrompt(settings.systemPrompt ?? "");
  }, [settings?.systemPrompt]);

  const savePersonaMutation = useMutation({
    mutationFn: () => api.settings.saveSystemPrompt(systemPrompt),
    onSuccess: () => {
      toast.success(t("AI Persona") + " " + t("Profile saved"));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error(t("Failed to save AI Persona")),
  });

  const saveKeyMutation = useMutation({
    mutationFn: (key: string) => api.settings.saveOpenAIKey(key),
    onSuccess: () => {
      toast.success(t("API key saved securely"));
      setNewKey("");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err: Error) => toast.error(err.message ?? t("Failed to save key")),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: () => api.settings.deleteOpenAIKey(),
    onSuccess: () => {
      toast(t("API key removed"));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error(t("Failed to remove key")),
  });

  // ── Widget config state ──────────────────────────────────────────────────
  const [wColor, setWColor] = useState(settings?.widgetConfig?.color ?? "#6366f1");
  const [wName, setWName] = useState(settings?.widgetConfig?.name ?? "Property Assistant");
  const [wGreeting, setWGreeting] = useState(
    settings?.widgetConfig?.greeting ??
      "Hi! I can help you find your perfect property. What are you looking for?",
  );
  const [wPosition, setWPosition] = useState<"right" | "left">(
    settings?.widgetConfig?.position ?? "right",
  );
  const [wTheme, setWTheme] = useState<"light" | "dark">(settings?.widgetConfig?.theme ?? "light");
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (settings?.widgetConfig) {
      setWColor(settings.widgetConfig.color ?? "#6366f1");
      setWName(settings.widgetConfig.name ?? "Property Assistant");
      setWGreeting(
        settings.widgetConfig.greeting ??
          "Hi! I can help you find your perfect property. What are you looking for?",
      );
      setWPosition(settings.widgetConfig.position ?? "right");
      setWTheme(settings.widgetConfig.theme ?? "light");
    }
  }, [settings?.widgetConfig]);

  const saveWidgetMutation = useMutation({
    mutationFn: () =>
      api.settings.saveWidgetConfig({
        color: wColor,
        name: wName,
        greeting: wGreeting,
        position: wPosition,
        theme: wTheme,
      }),
    onSuccess: () => {
      toast.success(t("Widget settings saved!"));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error(t("Failed to save widget settings")),
  });

  const widgetKey = settings?.company?.id ?? "your-agency-id";
  const embedCode = [
    `<!-- Stratos Hub Widget — paste before </body> -->`,
    `<script`,
    `  src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js"`,
    `  data-key="${widgetKey}"`,
    `  data-color="${wColor}"`,
    `  data-name="${wName}"`,
    `  data-greeting="${wGreeting}"`,
    `  data-position="${wPosition}"`,
    `  data-theme="${wTheme}"`,
    `></script>`,
  ].join("\n");

  function copyEmbedCode() {
    navigator.clipboard.writeText(embedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  const company = settings?.company;
  const subscription = settings?.subscription;
  const creditsLeft = subscription?.creditsLeft ?? 0;
  const creditsTotal = creditsLeft + (settings ? 0 : 0) || 1;
  const usagePct = Math.min(100, (creditsLeft / creditsTotal) * 100);

  // ── Channel state ─────────────────────────────────────────────────────────
  const ch = settings?.channels;

  // WhatsApp
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waBusinessId, setWaBusinessId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waVerify, setWaVerify] = useState("");
  useEffect(() => {
    if (ch?.whatsapp) {
      setWaPhoneId(ch.whatsapp.phoneId ?? "");
      setWaBusinessId(ch.whatsapp.businessId ?? "");
      setWaVerify(ch.whatsapp.verifyToken ?? "");
    }
  }, [ch?.whatsapp]);

  const saveWhatsAppMutation = useMutation({
    mutationFn: () =>
      api.settings.saveWhatsApp({
        phoneId: waPhoneId,
        businessId: waBusinessId,
        token: waToken,
        verifyToken: waVerify,
      }),
    onSuccess: () => {
      toast.success(t("WhatsApp Business") + " " + t("Profile saved"));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setWaToken("");
    },
    onError: (e: Error) => toast.error(e.message ?? t("Save failed")),
  });

  // Messenger
  const [msgPageId, setMsgPageId] = useState("");
  const [msgToken, setMsgToken] = useState("");
  const [msgVerify, setMsgVerify] = useState("");
  useEffect(() => {
    if (ch?.messenger) {
      setMsgPageId(ch.messenger.pageId ?? "");
      setMsgVerify(ch.messenger.verifyToken ?? "");
    }
  }, [ch?.messenger]);

  const saveMessengerMutation = useMutation({
    mutationFn: () =>
      api.settings.saveMessenger({ pageId: msgPageId, token: msgToken, verifyToken: msgVerify }),
    onSuccess: () => {
      toast.success(t("Facebook Messenger") + " " + t("Profile saved"));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setMsgToken("");
    },
    onError: (e: Error) => toast.error(e.message ?? t("Save failed")),
  });

  // Instagram
  const [igAccountId, setIgAccountId] = useState("");
  const [igToken, setIgToken] = useState("");
  const [igVerify, setIgVerify] = useState("");
  useEffect(() => {
    if (ch?.instagram) {
      setIgAccountId(ch.instagram.accountId ?? "");
      setIgVerify(ch.instagram.verifyToken ?? "");
    }
  }, [ch?.instagram]);

  const saveInstagramMutation = useMutation({
    mutationFn: () =>
      api.settings.saveInstagram({ accountId: igAccountId, token: igToken, verifyToken: igVerify }),
    onSuccess: () => {
      toast.success("Instagram " + t("Profile saved"));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setIgToken("");
    },
    onError: (e: Error) => toast.error(e.message ?? t("Save failed")),
  });

  // TikTok
  const [ttAppId, setTtAppId] = useState("");
  const [ttAccountId, setTtAccountId] = useState("");
  const [ttAppSecret, setTtAppSecret] = useState("");
  const [ttAccToken, setTtAccToken] = useState("");
  const [ttVerify, setTtVerify] = useState("");
  useEffect(() => {
    if (ch?.tiktok) {
      setTtAppId(ch.tiktok.appId ?? "");
      setTtAccountId(ch.tiktok.accountId ?? "");
      setTtVerify(ch.tiktok.verifyToken ?? "");
    }
  }, [ch?.tiktok]);

  const saveTikTokMutation = useMutation({
    mutationFn: () =>
      api.settings.saveTikTok({
        appId: ttAppId,
        accountId: ttAccountId,
        appSecret: ttAppSecret,
        accessToken: ttAccToken,
        verifyToken: ttVerify,
      }),
    onSuccess: () => {
      toast.success(t("TikTok for Business") + " " + t("Profile saved"));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setTtAppSecret("");
      setTtAccToken("");
    },
    onError: (e: Error) => toast.error(e.message ?? t("Save failed")),
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("Settings")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("Update your agency details.")}</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="h-auto p-1 flex flex-wrap gap-1 bg-muted/60 rounded-xl mb-6">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-1.5 rounded-lg text-xs px-3 py-2 data-[state=active]:shadow-sm"
          >
            <User2 className="h-3.5 w-3.5" />
            {t("Profile")}
          </TabsTrigger>
          <TabsTrigger
            value="apikeys"
            className="flex items-center gap-1.5 rounded-lg text-xs px-3 py-2 data-[state=active]:shadow-sm"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {t("API Keys")}
          </TabsTrigger>
          <TabsTrigger
            value="persona"
            className="flex items-center gap-1.5 rounded-lg text-xs px-3 py-2 data-[state=active]:shadow-sm"
          >
            <Bot className="h-3.5 w-3.5" />
            {t("AI Persona")}
          </TabsTrigger>
          <TabsTrigger
            value="channels"
            className="flex items-center gap-1.5 rounded-lg text-xs px-3 py-2 data-[state=active]:shadow-sm"
          >
            <Radio className="h-3.5 w-3.5" />
            {t("Channels")}
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="flex items-center gap-1.5 rounded-lg text-xs px-3 py-2 data-[state=active]:shadow-sm"
          >
            <CreditCard className="h-3.5 w-3.5" />
            {t("Billing")}
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="flex items-center gap-1.5 rounded-lg text-xs px-3 py-2 data-[state=active]:shadow-sm"
          >
            <Building2 className="h-3.5 w-3.5" />
            {t("Account")}
          </TabsTrigger>
          <TabsTrigger
            value="widget"
            className="flex items-center gap-1.5 rounded-lg text-xs px-3 py-2 data-[state=active]:shadow-sm"
          >
            <Globe className="h-3.5 w-3.5" />
            {t("Web Widget")}
          </TabsTrigger>
        </TabsList>

        {/* ── Profile tab ─────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t("Company profile")}</CardTitle>
              <CardDescription>{t("Update your agency details.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-32 mt-2" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">{t("Agency name")}</Label>
                    <Input
                      defaultValue={company?.name ?? ""}
                      onChange={(e) => setProfileDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Acme Realty"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t("Contact email")}</Label>
                    <Input
                      type="email"
                      defaultValue={company?.email ?? ""}
                      onChange={(e) => setProfileDraft((d) => ({ ...d, email: e.target.value }))}
                      placeholder="hello@agency.com"
                      dir="ltr"
                    />
                  </div>
                  <Button
                    onClick={() => saveProfileMutation.mutate()}
                    disabled={
                      saveProfileMutation.isPending || Object.keys(profileDraft).length === 0
                    }
                    className="mt-2"
                  >
                    {saveProfileMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                    )}
                    {t("Save changes")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── API Keys tab ────────────────────────────────────────────── */}
        <TabsContent value="apikeys">
          <Card>
            <CardHeader>
              <CardTitle>{t("OpenAI API key")}</CardTitle>
              <CardDescription>
                {t("Your key is encrypted with AES-256-GCM and never stored in plaintext.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-28" />
                </div>
              ) : settings?.hasOpenAIKey ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    {t("API key is set — AI responses are enabled")}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => deleteKeyMutation.mutate()}
                      disabled={deleteKeyMutation.isPending}
                    >
                      {deleteKeyMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      {t("Remove")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {t("Without a key, the AI will use a placeholder response.")}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t("API key")}</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showKey ? "text" : "password"}
                          value={newKey}
                          onChange={(e) => setNewKey(e.target.value)}
                          placeholder="sk-..."
                          dir="ltr"
                          className="font-mono text-sm pe-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey((s) => !s)}
                          className="absolute inset-y-0 end-0 px-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button
                        onClick={() => saveKeyMutation.mutate(newKey)}
                        disabled={
                          saveKeyMutation.isPending ||
                          (!newKey.startsWith("sk-") && !newKey.startsWith("AIza"))
                        }
                      >
                        {saveKeyMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin me-2" />
                        )}
                        {t("Save")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI Persona tab ──────────────────────────────────────────── */}
        <TabsContent value="persona">
          <Card>
            <CardHeader>
              <CardTitle>{t("AI Persona")}</CardTitle>
              <CardDescription>
                {t("Customize how your virtual agent introduces itself and handles conversations.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-9 w-28" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("System Prompt")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("This text will be injected into the AI's system instructions.")}
                    </p>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={8}
                      placeholder={t(
                        "e.g. You are a helpful real estate assistant for Stratos Hub...",
                      )}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-y placeholder:text-muted-foreground leading-relaxed"
                    />
                  </div>
                  <Button
                    onClick={() => savePersonaMutation.mutate()}
                    disabled={savePersonaMutation.isPending}
                  >
                    {savePersonaMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                    )}
                    {t("Save persona")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Channels tab ────────────────────────────────────────────── */}
        <TabsContent value="channels" className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">{t("Messaging Channels")}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {t(
                  "Connect your agency AI to WhatsApp, Messenger, Instagram, and TikTok using your own API keys. Each channel needs a webhook URL configured in the respective developer portal.",
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))
          ) : (
            <>
              {/* ── WhatsApp ─────────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center overflow-hidden">
                        <WhatsAppIcon />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{t("WhatsApp Business")}</CardTitle>
                        <CardDescription className="text-xs">
                          {t("Meta Cloud API · Bring your own token")}
                        </CardDescription>
                      </div>
                    </div>
                    <ConnectedBadge connected={ch?.whatsapp?.connected ?? false} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <WebhookRow platform="whatsapp" />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("Phone Number ID")}</Label>
                      <Input
                        value={waPhoneId}
                        onChange={(e) => setWaPhoneId(e.target.value)}
                        placeholder="12345678901234"
                        dir="ltr"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("Business Account ID")}</Label>
                      <Input
                        value={waBusinessId}
                        onChange={(e) => setWaBusinessId(e.target.value)}
                        placeholder="98765432109876"
                        dir="ltr"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {t("Permanent Access Token")}{" "}
                      {ch?.whatsapp?.connected && (
                        <span className="text-muted-foreground">
                          ({t("Leave blank to keep current")})
                        </span>
                      )}
                    </Label>
                    <Input
                      type="password"
                      value={waToken}
                      onChange={(e) => setWaToken(e.target.value)}
                      placeholder={ch?.whatsapp?.connected ? "••••••••••••" : "EAAxxxxxxx..."}
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("Verify Token (choose any string)")}</Label>
                    <Input
                      value={waVerify}
                      onChange={(e) => setWaVerify(e.target.value)}
                      placeholder="my-secret-verify-token"
                      dir="ltr"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> {t("Meta for Developers")}
                    </a>
                    <Button
                      size="sm"
                      onClick={() => saveWhatsAppMutation.mutate()}
                      disabled={saveWhatsAppMutation.isPending}
                    >
                      {saveWhatsAppMutation.isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                      )}
                      {t("Save WhatsApp")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Messenger ──────────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center overflow-hidden">
                        <MessengerIcon />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{t("Facebook Messenger")}</CardTitle>
                        <CardDescription className="text-xs">
                          {t("Meta Graph API · Bring your own Page token")}
                        </CardDescription>
                      </div>
                    </div>
                    <ConnectedBadge connected={ch?.messenger?.connected ?? false} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <WebhookRow platform="messenger" />
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("Facebook Page ID")}</Label>
                    <Input
                      value={msgPageId}
                      onChange={(e) => setMsgPageId(e.target.value)}
                      placeholder="123456789012345"
                      dir="ltr"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {t("Page Access Token")}{" "}
                      {ch?.messenger?.connected && (
                        <span className="text-muted-foreground">
                          ({t("Leave blank to keep current")})
                        </span>
                      )}
                    </Label>
                    <Input
                      type="password"
                      value={msgToken}
                      onChange={(e) => setMsgToken(e.target.value)}
                      placeholder={ch?.messenger?.connected ? "••••••••••••" : "EAAxxxxxxx..."}
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("Verify Token (choose any string)")}</Label>
                    <Input
                      value={msgVerify}
                      onChange={(e) => setMsgVerify(e.target.value)}
                      placeholder="my-secret-verify-token"
                      dir="ltr"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> {t("Meta for Developers")}
                    </a>
                    <Button
                      size="sm"
                      onClick={() => saveMessengerMutation.mutate()}
                      disabled={saveMessengerMutation.isPending}
                    >
                      {saveMessengerMutation.isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                      )}
                      {t("Save Messenger")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Instagram ─────────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center overflow-hidden">
                        <InstagramIcon />
                      </div>
                      <div>
                        <CardTitle className="text-sm">Instagram</CardTitle>
                        <CardDescription className="text-xs">
                          {t("Meta Graph API · Instagram Business / Creator")}
                        </CardDescription>
                      </div>
                    </div>
                    <ConnectedBadge connected={ch?.instagram?.connected ?? false} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <WebhookRow platform="instagram" />
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("Instagram Account ID")}</Label>
                    <Input
                      value={igAccountId}
                      onChange={(e) => setIgAccountId(e.target.value)}
                      placeholder="123456789012345"
                      dir="ltr"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {t("Instagram Graph API Token")}{" "}
                      {ch?.instagram?.connected && (
                        <span className="text-muted-foreground">
                          ({t("Leave blank to keep current")})
                        </span>
                      )}
                    </Label>
                    <Input
                      type="password"
                      value={igToken}
                      onChange={(e) => setIgToken(e.target.value)}
                      placeholder={ch?.instagram?.connected ? "••••••••••••" : "EAAxxxxxxx..."}
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("Verify Token (choose any string)")}</Label>
                    <Input
                      value={igVerify}
                      onChange={(e) => setIgVerify(e.target.value)}
                      placeholder="my-secret-verify-token"
                      dir="ltr"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> {t("Meta for Developers")}
                    </a>
                    <Button
                      size="sm"
                      onClick={() => saveInstagramMutation.mutate()}
                      disabled={saveInstagramMutation.isPending}
                    >
                      {saveInstagramMutation.isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                      )}
                      {t("Save Instagram")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── TikTok ────────────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center overflow-hidden">
                        <TikTokIcon />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{t("TikTok for Business")}</CardTitle>
                        <CardDescription className="text-xs">
                          {t("TikTok Business API · Direct Messaging")}
                        </CardDescription>
                      </div>
                    </div>
                    <ConnectedBadge connected={ch?.tiktok?.connected ?? false} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <WebhookRow platform="tiktok" />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("App ID (Client Key)")}</Label>
                      <Input
                        value={ttAppId}
                        onChange={(e) => setTtAppId(e.target.value)}
                        placeholder="aw123456..."
                        dir="ltr"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("TikTok Business Account User ID")}</Label>
                      <Input
                        value={ttAccountId}
                        onChange={(e) => setTtAccountId(e.target.value)}
                        placeholder="6789012345678901234"
                        dir="ltr"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {t("App Secret")}{" "}
                      {ch?.tiktok?.connected && (
                        <span className="text-muted-foreground">
                          ({t("Leave blank to keep current")})
                        </span>
                      )}
                    </Label>
                    <Input
                      type="password"
                      value={ttAppSecret}
                      onChange={(e) => setTtAppSecret(e.target.value)}
                      placeholder={ch?.tiktok?.connected ? "••••••••••••" : "abc123..."}
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {t("Access Token")}{" "}
                      {ch?.tiktok?.connected && (
                        <span className="text-muted-foreground">
                          ({t("Leave blank to keep current")})
                        </span>
                      )}
                    </Label>
                    <Input
                      type="password"
                      value={ttAccToken}
                      onChange={(e) => setTtAccToken(e.target.value)}
                      placeholder={ch?.tiktok?.connected ? "••••••••••••" : "act.xyz123..."}
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("Verify Token (choose any string)")}</Label>
                    <Input
                      value={ttVerify}
                      onChange={(e) => setTtVerify(e.target.value)}
                      placeholder="my-secret-verify-token"
                      dir="ltr"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href="https://developers.tiktok.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> {t("TikTok for Developers")}
                    </a>
                    <Button
                      size="sm"
                      onClick={() => saveTikTokMutation.mutate()}
                      disabled={saveTikTokMutation.isPending}
                    >
                      {saveTikTokMutation.isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                      )}
                      {t("Save TikTok")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Billing tab ─────────────────────────────────────────────── */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>{t("Billing & credits")}</CardTitle>
              <CardDescription>
                {subscription
                  ? `${subscription.plan} ${t("plan")} · ${t("renews")} ${subscription.renewsAt}`
                  : "—"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-6 w-3/4" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">{t("Credits left")}</div>
                      <div className="text-2xl font-bold">
                        {subscription?.creditsLeft?.toLocaleString() ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">{t("Plan")}</div>
                      <div className="text-2xl font-bold capitalize">
                        {subscription?.plan ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">{t("Renewal")}</div>
                      <div className="text-2xl font-bold">{subscription?.renewsAt ?? "—"}</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{t("Credits remaining")}</span>
                      <span>{usagePct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${usagePct <= 10 ? "bg-destructive" : usagePct <= 30 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button>{t("Upgrade plan")}</Button>
                    <Button variant="outline">{t("Buy credits")}</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Account tab ─────────────────────────────────────────────── */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t("Account")}</CardTitle>
              <CardDescription>{t("Your login details.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-9 w-28 mt-2" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-muted-foreground">{t("Email")}</span>
                    <span className="font-medium">{settings?.user?.email ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-muted-foreground">{t("Role")}</span>
                    <Badge variant={settings?.user?.role === "admin" ? "default" : "outline"}>
                      {settings?.user?.role ?? "—"}
                    </Badge>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(settings?.user?.email ?? "");
                        toast(t("Copied"));
                      }}
                    >
                      <Copy className="h-4 w-4 me-2" />
                      {t("Copy email")}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Widget tab ──────────────────────────────────────────────── */}
        <TabsContent value="widget" className="space-y-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <Globe className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sm">{t("Embeddable Chat Widget")}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t("Add an AI property assistant to any website with one line of code.")}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-5">
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("Widget ID (Public Key)")}</CardTitle>
                  <CardDescription className="text-xs">
                    {t("Use this key in the embed script to identify your agency.")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={widgetKey}
                      readOnly
                      dir="ltr"
                      className="font-mono text-xs bg-muted"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(widgetKey);
                        toast(t("Copied"));
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("Customization")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">{t("Accent color")}</Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { label: "Indigo", value: "#6366f1" },
                        { label: "Violet", value: "#8b5cf6" },
                        { label: "Blue", value: "#3b82f6" },
                        { label: "Emerald", value: "#10b981" },
                        { label: "Rose", value: "#f43f5e" },
                        { label: "Amber", value: "#f59e0b" },
                      ].map((p) => (
                        <button
                          key={p.value}
                          title={p.label}
                          onClick={() => setWColor(p.value)}
                          className="h-7 w-7 rounded-full border-2 transition-all duration-150 hover:scale-110 active:scale-95 flex items-center justify-center"
                          style={{
                            background: p.value,
                            borderColor: wColor === p.value ? p.value : "transparent",
                            boxShadow:
                              wColor === p.value ? `0 0 0 2px white, 0 0 0 4px ${p.value}` : "none",
                          }}
                        >
                          {wColor === p.value && <Check className="h-3 w-3 text-white" />}
                        </button>
                      ))}
                      <div className="flex items-center gap-1.5 ms-1">
                        <input
                          type="color"
                          value={wColor}
                          onChange={(e) => setWColor(e.target.value)}
                          className="h-7 w-7 rounded-full cursor-pointer border border-border bg-transparent p-0.5"
                          title={t("Custom color")}
                        />
                        <span className="text-xs text-muted-foreground font-mono">{wColor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("Agent name")}</Label>
                    <Input
                      value={wName}
                      onChange={(e) => setWName(e.target.value)}
                      placeholder="Property Assistant"
                      maxLength={40}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("Opening message")}</Label>
                    <textarea
                      value={wGreeting}
                      onChange={(e) => setWGreeting(e.target.value)}
                      rows={2}
                      maxLength={160}
                      placeholder="Hi! How can I help you find your perfect property?"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground"
                    />
                    <div className="text-[11px] text-muted-foreground text-end">
                      {wGreeting.length}/160
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("Position")}</Label>
                      <div className="flex rounded-md border border-input overflow-hidden">
                        {(["right", "left"] as const).map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setWPosition(pos)}
                            className={`flex-1 py-1.5 text-xs transition-colors ${wPosition === pos ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}
                          >
                            {pos === "right" ? t("Right") : t("Left")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("Theme")}</Label>
                      <div className="flex rounded-md border border-input overflow-hidden">
                        {(["light", "dark"] as const).map((th) => (
                          <button
                            key={th}
                            onClick={() => setWTheme(th)}
                            className={`flex-1 py-1.5 text-xs transition-colors ${wTheme === th ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}
                          >
                            {th === "light" ? t("Light") : t("Dark")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      onClick={() => saveWidgetMutation.mutate()}
                      disabled={saveWidgetMutation.isPending}
                      className="w-full"
                    >
                      {saveWidgetMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin me-2" />
                      ) : null}
                      {t("Save Widget Customization")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("Embed Code")}</CardTitle>
                  <CardDescription className="text-xs">
                    {t("Paste this snippet before the closing")}{" "}
                    <code className="font-mono text-primary">&lt;/body&gt;</code>{" "}
                    {t("tag of your website.")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto leading-relaxed text-foreground/80 whitespace-pre-wrap break-all">
                    {embedCode}
                  </pre>
                  <Button
                    onClick={copyEmbedCode}
                    variant={codeCopied ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                  >
                    {codeCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> {t("Copied!")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> {t("Copy embed code")}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">{t("Live Preview")}</div>
              <WidgetPreview
                color={wColor}
                name={wName}
                greeting={wGreeting}
                dark={wTheme === "dark"}
              />
              <p className="text-[11px] text-muted-foreground text-center">
                {t("Looks exactly like this on any website")}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Widget Preview component ──────────────────────────────────────────────────
interface WidgetPreviewProps {
  color: string;
  name: string;
  greeting: string;
  dark: boolean;
}

function darkenPreview(hex: string, f = 0.72): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return hex;
  const ch = (v: string) =>
    Math.round(parseInt(v, 16) * f)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(r[1])}${ch(r[2])}${ch(r[3])}`;
}

function WidgetPreview({ color, name, greeting, dark }: WidgetPreviewProps) {
  const bg = dark ? "#0f172a" : "#f8fafc";
  const msgBg = dark ? "rgba(255,255,255,0.08)" : "#ffffff";
  const grad = `linear-gradient(135deg, ${color} 0%, ${darkenPreview(color)} 100%)`;

  return (
    <div className="relative flex flex-col items-end gap-3 select-none">
      <div
        className="w-full rounded-2xl overflow-hidden border border-black/8 shadow-xl"
        style={{
          background: bg,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ background: grad }}>
          <div className="relative flex-shrink-0">
            <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border-[1.5px] border-white" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white leading-none truncate max-w-[180px]">
              {name}
            </div>
            <div className="text-[9px] text-white/70 mt-0.5 flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400 inline-block animate-pulse" />{" "}
              Online
            </div>
          </div>
        </div>
        {/* Chat */}
        <div className="px-3 py-3 space-y-2.5" style={{ background: bg }}>
          <div className="flex items-end gap-1.5">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: color }}
            >
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </div>
            <div
              className="max-w-[80%] px-2.5 py-1.5 rounded-xl rounded-bl-sm text-[10px] leading-relaxed"
              style={{
                background: msgBg,
                color: dark ? "#f1f5f9" : "#1e293b",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              {greeting.length > 70 ? greeting.slice(0, 70) + "…" : greeting}
            </div>
          </div>
          <div className="flex items-end justify-end">
            <div
              className="max-w-[65%] px-2.5 py-1.5 rounded-xl rounded-br-sm text-[10px] text-white leading-relaxed"
              style={{ background: color }}
            >
              I'm looking for a 3-bedroom villa
            </div>
          </div>
          <div className="flex items-end gap-1.5">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: color }}
            >
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </div>
            <div
              className="px-2.5 py-2 rounded-xl rounded-bl-sm"
              style={{ background: msgBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div className="flex gap-0.5 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1 w-1 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Input bar */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-t"
          style={{
            background: dark ? "#111827" : "#ffffff",
            borderColor: dark ? "rgba(255,255,255,0.08)" : "#f0f0f0",
          }}
        >
          <span className="flex-1 text-[10px] text-gray-400">Type a message…</span>
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: grad }}
          >
            <Send className="h-2.5 w-2.5 text-white translate-x-px" />
          </div>
        </div>
        {/* Footer */}
        <div
          className="text-center py-1 text-[9px] flex items-center justify-center gap-1"
          style={{
            color: dark ? "rgba(255,255,255,0.2)" : "#9ca3af",
            background: dark ? "#0f172a" : "#f8fafc",
          }}
        >
          <Sparkles className="h-2 w-2" />
          Powered by <span className="font-semibold ms-0.5">Stratos Hub</span>
        </div>
      </div>
      {/* FAB preview */}
      <div
        className="h-11 w-11 rounded-[14px] flex items-center justify-center shadow-xl transition-transform hover:scale-110 cursor-pointer"
        style={{ background: grad, boxShadow: `0 6px 20px ${color}66` }}
        title="Widget button"
      >
        <MessageSquare className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}
