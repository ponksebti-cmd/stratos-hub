import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Eye, EyeOff, Copy, Loader2, CheckCircle2, Trash2, MessageSquare,
  Globe, Check, Sparkles, Send, Radio, ExternalLink, AlertCircle,
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

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline" size="sm"
      className="gap-1.5 shrink-0"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}

function WebhookRow({ platform }: { platform: string }) {
  const url = webhookUrl(platform);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">Webhook URL (paste in developer portal)</Label>
      <div className="flex gap-2 items-center">
        <Input value={url} readOnly dir="ltr" className="font-mono text-xs bg-muted" />
        <CopyButton value={url} />
      </div>
    </div>
  );
}

function ConnectedBadge({ connected }: { connected: boolean }) {
  return connected
    ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>
    : <Badge variant="outline" className="text-muted-foreground gap-1"><AlertCircle className="h-3 w-3" /> Not configured</Badge>;
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

  const [profileDraft, setProfileDraft] = useState<{ name?: string; email?: string; phone?: string }>({});

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
      toast.success(t("AI Persona saved"));
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
  const [wColor,    setWColor]    = useState(settings?.widgetConfig?.color ?? "#6366f1");
  const [wName,     setWName]     = useState(settings?.widgetConfig?.name ?? "Property Assistant");
  const [wGreeting, setWGreeting] = useState(settings?.widgetConfig?.greeting ?? "Hi! I can help you find your perfect property. What are you looking for?");
  const [wPosition, setWPosition] = useState<"right" | "left">(settings?.widgetConfig?.position ?? "right");
  const [wTheme,    setWTheme]    = useState<"light" | "dark">(settings?.widgetConfig?.theme ?? "light");
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (settings?.widgetConfig) {
      setWColor(settings.widgetConfig.color ?? "#6366f1");
      setWName(settings.widgetConfig.name ?? "Property Assistant");
      setWGreeting(settings.widgetConfig.greeting ?? "Hi! I can help you find your perfect property. What are you looking for?");
      setWPosition(settings.widgetConfig.position ?? "right");
      setWTheme(settings.widgetConfig.theme ?? "light");
    }
  }, [settings?.widgetConfig]);

  const saveWidgetMutation = useMutation({
    mutationFn: () => api.settings.saveWidgetConfig({ color: wColor, name: wName, greeting: wGreeting, position: wPosition, theme: wTheme }),
    onSuccess: () => { toast.success(t("Widget settings saved!")); queryClient.invalidateQueries({ queryKey: ["settings"] }); },
    onError: () => toast.error(t("Failed to save widget settings")),
  });

  const widgetKey = settings?.company?.id ?? "your-agency-id";
  const embedCode = [
    `<!-- Stratos Hub Widget — paste before </body> -->`,
    `<script`,
    `  src="${typeof window !== "undefined" ? window.location.origin : "https://app.stratoshub.ai"}/widget.js"`,
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
  const [waPhoneId,    setWaPhoneId]    = useState("");
  const [waBusinessId, setWaBusinessId] = useState("");
  const [waToken,      setWaToken]      = useState("");
  const [waVerify,     setWaVerify]     = useState("");
  useEffect(() => {
    if (ch?.whatsapp) {
      setWaPhoneId(ch.whatsapp.phoneId ?? "");
      setWaBusinessId(ch.whatsapp.businessId ?? "");
      setWaVerify(ch.whatsapp.verifyToken ?? "");
    }
  }, [ch?.whatsapp]);

  const saveWhatsAppMutation = useMutation({
    mutationFn: () => api.settings.saveWhatsApp({ phoneId: waPhoneId, businessId: waBusinessId, token: waToken, verifyToken: waVerify }),
    onSuccess: () => { toast.success("WhatsApp settings saved!"); queryClient.invalidateQueries({ queryKey: ["settings"] }); setWaToken(""); },
    onError: (e: Error) => toast.error(e.message ?? "Failed to save"),
  });

  // Messenger
  const [msgPageId, setMsgPageId] = useState("");
  const [msgToken,  setMsgToken]  = useState("");
  const [msgVerify, setMsgVerify] = useState("");
  useEffect(() => {
    if (ch?.messenger) {
      setMsgPageId(ch.messenger.pageId ?? "");
      setMsgVerify(ch.messenger.verifyToken ?? "");
    }
  }, [ch?.messenger]);

  const saveMessengerMutation = useMutation({
    mutationFn: () => api.settings.saveMessenger({ pageId: msgPageId, token: msgToken, verifyToken: msgVerify }),
    onSuccess: () => { toast.success("Messenger settings saved!"); queryClient.invalidateQueries({ queryKey: ["settings"] }); setMsgToken(""); },
    onError: (e: Error) => toast.error(e.message ?? "Failed to save"),
  });

  // Instagram
  const [igAccountId, setIgAccountId] = useState("");
  const [igToken,     setIgToken]     = useState("");
  const [igVerify,    setIgVerify]    = useState("");
  useEffect(() => {
    if (ch?.instagram) {
      setIgAccountId(ch.instagram.accountId ?? "");
      setIgVerify(ch.instagram.verifyToken ?? "");
    }
  }, [ch?.instagram]);

  const saveInstagramMutation = useMutation({
    mutationFn: () => api.settings.saveInstagram({ accountId: igAccountId, token: igToken, verifyToken: igVerify }),
    onSuccess: () => { toast.success("Instagram settings saved!"); queryClient.invalidateQueries({ queryKey: ["settings"] }); setIgToken(""); },
    onError: (e: Error) => toast.error(e.message ?? "Failed to save"),
  });

  // TikTok
  const [ttAppId,      setTtAppId]      = useState("");
  const [ttAppSecret,  setTtAppSecret]  = useState("");
  const [ttAccToken,   setTtAccToken]   = useState("");
  const [ttAccountId,  setTtAccountId]  = useState("");
  const [ttVerify,     setTtVerify]     = useState("");
  useEffect(() => {
    if (ch?.tiktok) {
      setTtAppId(ch.tiktok.appId ?? "");
      setTtAccountId(ch.tiktok.accountId ?? "");
      setTtVerify(ch.tiktok.verifyToken ?? "");
    }
  }, [ch?.tiktok]);

  const saveTikTokMutation = useMutation({
    mutationFn: () => api.settings.saveTikTok({ appId: ttAppId, appSecret: ttAppSecret, accessToken: ttAccToken, accountId: ttAccountId, verifyToken: ttVerify }),
    onSuccess: () => { toast.success("TikTok settings saved!"); queryClient.invalidateQueries({ queryKey: ["settings"] }); setTtAppSecret(""); setTtAccToken(""); },
    onError: (e: Error) => toast.error(e.message ?? "Failed to save"),
  });

  const SkeletonSection = () => (
    <div className="space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-10 w-full" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  );

  return (
    <div className="max-w-3xl">
      <Tabs defaultValue="profile">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile">{t("Profile")}</TabsTrigger>
          <TabsTrigger value="apikeys">{t("API Keys")}</TabsTrigger>
          <TabsTrigger value="persona" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />{t("AI Persona")}
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5" />Channels
          </TabsTrigger>
          <TabsTrigger value="billing">{t("Billing")}</TabsTrigger>
          <TabsTrigger value="account">{t("Account")}</TabsTrigger>
          <TabsTrigger value="widget" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />{t("Web Widget")}
          </TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t("Company profile")}</CardTitle>
              <CardDescription>{t("Update your agency details.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <SkeletonSection /> : (
                <>
                  <div>
                    <Label>{t("Agency name")}</Label>
                    <Input
                      defaultValue={company?.name ?? ""}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>{t("Contact email")}</Label>
                      <Input type="email" dir="ltr" className="text-start" defaultValue={company?.email ?? ""} onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div>
                      <Label>{t("Phone")}</Label>
                      <Input dir="ltr" className="text-start" defaultValue={company?.phone ?? ""} onChange={(e) => setProfileDraft((p) => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>
                  <Button onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending}>
                    {saveProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t("Save changes")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys tab */}
        <TabsContent value="apikeys">
          <Card>
            <CardHeader>
              <CardTitle>{t("OpenAI API key")}</CardTitle>
              <CardDescription>{t("Your key is encrypted with AES-256-GCM and never stored in plaintext.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-4 w-2/3" /></div>
              ) : settings?.hasOpenAIKey ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />{t("API key is set — AI responses are enabled")}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => deleteKeyMutation.mutate()} disabled={deleteKeyMutation.isPending}>
                    <Trash2 className="h-4 w-4 mr-1" /> {t("Remove")}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={newKey} onChange={(e) => setNewKey(e.target.value)}
                    placeholder="sk-..." dir="ltr" className="font-mono text-start"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowKey((s) => !s)}>
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button onClick={() => saveKeyMutation.mutate(newKey)} disabled={!newKey.startsWith("sk-") || saveKeyMutation.isPending}>
                    {saveKeyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Save")}
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t("Without a key, the AI will use a placeholder response.")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Persona tab */}
        <TabsContent value="persona">
          <Card>
            <CardHeader>
              <CardTitle>{t("AI Persona")}</CardTitle>
              <CardDescription>{t("Customize how your virtual agent introduces itself and handles conversations.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <Skeleton className="h-32 w-full" /> : (
                <>
                  <div className="space-y-2">
                    <Label>{t("System Prompt")}</Label>
                    <textarea
                      className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder={t("e.g. You are a helpful real estate assistant for Stratos Hub...")}
                      value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
                    />
                    <p className="text-[0.8rem] text-muted-foreground">{t("This text will be injected into the AI's system instructions.")}</p>
                  </div>
                  <Button onClick={() => savePersonaMutation.mutate()} disabled={savePersonaMutation.isPending || systemPrompt === settings?.systemPrompt}>
                    {savePersonaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t("Save persona")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Channels tab ─────────────────────────────────────────────────── */}
        <TabsContent value="channels" className="space-y-5">

          {/* Header */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
              <Radio className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sm">Messaging Channels</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Connect your agency AI to WhatsApp, Messenger, Instagram, and TikTok using your own API keys. Each channel needs a webhook URL configured in the respective developer portal.
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
            </div>
          ) : (
            <>

              {/* ── WhatsApp ──────────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-lg font-bold" style={{ background: "#25D366" }}>
                        W
                      </div>
                      <div>
                        <CardTitle className="text-sm">WhatsApp Business</CardTitle>
                        <CardDescription className="text-xs">Meta Cloud API · Bring your own token</CardDescription>
                      </div>
                    </div>
                    <ConnectedBadge connected={ch?.whatsapp?.connected ?? false} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <WebhookRow platform="whatsapp" />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Phone Number ID</Label>
                      <Input value={waPhoneId} onChange={e => setWaPhoneId(e.target.value)} placeholder="123456789012345" dir="ltr" className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Business Account ID</Label>
                      <Input value={waBusinessId} onChange={e => setWaBusinessId(e.target.value)} placeholder="123456789012345" dir="ltr" className="text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Permanent Access Token {ch?.whatsapp?.connected && <span className="text-muted-foreground">(leave blank to keep current)</span>}</Label>
                    <Input type="password" value={waToken} onChange={e => setWaToken(e.target.value)} placeholder={ch?.whatsapp?.connected ? "••••••••••••" : "EAAxxxxxxx..."} dir="ltr" className="font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Verify Token (choose any string)</Label>
                    <Input value={waVerify} onChange={e => setWaVerify(e.target.value)} placeholder="my-secret-verify-token" dir="ltr" className="text-sm" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Meta for Developers
                    </a>
                    <Button size="sm" onClick={() => saveWhatsAppMutation.mutate()} disabled={saveWhatsAppMutation.isPending}>
                      {saveWhatsAppMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                      Save WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Facebook Messenger ────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-lg font-bold" style={{ background: "linear-gradient(135deg, #0099FF, #A033FF)" }}>
                        M
                      </div>
                      <div>
                        <CardTitle className="text-sm">Facebook Messenger</CardTitle>
                        <CardDescription className="text-xs">Meta Graph API · Bring your own Page token</CardDescription>
                      </div>
                    </div>
                    <ConnectedBadge connected={ch?.messenger?.connected ?? false} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <WebhookRow platform="messenger" />
                  <div className="space-y-1.5">
                    <Label className="text-xs">Facebook Page ID</Label>
                    <Input value={msgPageId} onChange={e => setMsgPageId(e.target.value)} placeholder="123456789012345" dir="ltr" className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Page Access Token {ch?.messenger?.connected && <span className="text-muted-foreground">(leave blank to keep current)</span>}</Label>
                    <Input type="password" value={msgToken} onChange={e => setMsgToken(e.target.value)} placeholder={ch?.messenger?.connected ? "••••••••••••" : "EAAxxxxxxx..."} dir="ltr" className="font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Verify Token (choose any string)</Label>
                    <Input value={msgVerify} onChange={e => setMsgVerify(e.target.value)} placeholder="my-secret-verify-token" dir="ltr" className="text-sm" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Meta for Developers
                    </a>
                    <Button size="sm" onClick={() => saveMessengerMutation.mutate()} disabled={saveMessengerMutation.isPending}>
                      {saveMessengerMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                      Save Messenger
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Instagram ─────────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-lg font-bold" style={{ background: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)" }}>
                        I
                      </div>
                      <div>
                        <CardTitle className="text-sm">Instagram</CardTitle>
                        <CardDescription className="text-xs">Meta Graph API · Instagram Business / Creator</CardDescription>
                      </div>
                    </div>
                    <ConnectedBadge connected={ch?.instagram?.connected ?? false} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <WebhookRow platform="instagram" />
                  <div className="space-y-1.5">
                    <Label className="text-xs">Instagram Account ID</Label>
                    <Input value={igAccountId} onChange={e => setIgAccountId(e.target.value)} placeholder="123456789012345" dir="ltr" className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Instagram Graph API Token {ch?.instagram?.connected && <span className="text-muted-foreground">(leave blank to keep current)</span>}</Label>
                    <Input type="password" value={igToken} onChange={e => setIgToken(e.target.value)} placeholder={ch?.instagram?.connected ? "••••••••••••" : "EAAxxxxxxx..."} dir="ltr" className="font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Verify Token (choose any string)</Label>
                    <Input value={igVerify} onChange={e => setIgVerify(e.target.value)} placeholder="my-secret-verify-token" dir="ltr" className="text-sm" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Meta for Developers
                    </a>
                    <Button size="sm" onClick={() => saveInstagramMutation.mutate()} disabled={saveInstagramMutation.isPending}>
                      {saveInstagramMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                      Save Instagram
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── TikTok ────────────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-lg font-bold bg-black">
                        T
                      </div>
                      <div>
                        <CardTitle className="text-sm">TikTok for Business</CardTitle>
                        <CardDescription className="text-xs">TikTok Business API · Direct Messaging</CardDescription>
                      </div>
                    </div>
                    <ConnectedBadge connected={ch?.tiktok?.connected ?? false} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <WebhookRow platform="tiktok" />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">App ID (Client Key)</Label>
                      <Input value={ttAppId} onChange={e => setTtAppId(e.target.value)} placeholder="aw123456..." dir="ltr" className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">TikTok Business Account User ID</Label>
                      <Input value={ttAccountId} onChange={e => setTtAccountId(e.target.value)} placeholder="6789012345678901234" dir="ltr" className="text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">App Secret {ch?.tiktok?.connected && <span className="text-muted-foreground">(leave blank to keep current)</span>}</Label>
                    <Input type="password" value={ttAppSecret} onChange={e => setTtAppSecret(e.target.value)} placeholder={ch?.tiktok?.connected ? "••••••••••••" : "abc123..."} dir="ltr" className="font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Access Token {ch?.tiktok?.connected && <span className="text-muted-foreground">(leave blank to keep current)</span>}</Label>
                    <Input type="password" value={ttAccToken} onChange={e => setTtAccToken(e.target.value)} placeholder={ch?.tiktok?.connected ? "••••••••••••" : "act.xyz123..."} dir="ltr" className="font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Verify Token (choose any string)</Label>
                    <Input value={ttVerify} onChange={e => setTtVerify(e.target.value)} placeholder="my-secret-verify-token" dir="ltr" className="text-sm" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <a href="https://developers.tiktok.com" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> TikTok for Developers
                    </a>
                    <Button size="sm" onClick={() => saveTikTokMutation.mutate()} disabled={saveTikTokMutation.isPending}>
                      {saveTikTokMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                      Save TikTok
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </>
          )}
        </TabsContent>

        {/* Billing tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>{t("Billing & credits")}</CardTitle>
              <CardDescription>{subscription ? `${subscription.plan} ${t("plan")} · ${t("renews")} ${subscription.renewsAt}` : "—"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <div key={i}><Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-6 w-3/4" /></div>)}
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div><div className="text-muted-foreground">{t("Credits left")}</div><div className="text-lg font-semibold">{subscription?.creditsLeft?.toLocaleString() ?? "—"}</div></div>
                    <div><div className="text-muted-foreground">{t("Plan")}</div><div className="text-lg font-semibold capitalize">{subscription?.plan ?? "—"}</div></div>
                    <div><div className="text-muted-foreground">{t("Renewal")}</div><div className="text-lg font-semibold">{subscription?.renewsAt ?? "—"}</div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{t("Credits remaining")}</span>
                      <span>{usagePct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full transition-all ${usagePct <= 10 ? "bg-destructive" : usagePct <= 30 ? "bg-warning" : "bg-success"}`} style={{ width: `${usagePct}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button>{t("Upgrade plan")}</Button>
                    <Button variant="outline">{t("Buy credits")}</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t("Account")}</CardTitle>
              <CardDescription>{t("Your login details.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-9 w-28 mt-2" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">{t("Email")}</span>
                    <span className="font-medium">{settings?.user?.email ?? "—"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">{t("Role")}</span>
                    <Badge variant={settings?.user?.role === "admin" ? "default" : "outline"}>{settings?.user?.role ?? "—"}</Badge>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => { navigator.clipboard.writeText(settings?.user?.email ?? ""); toast(t("Copied")); }}>
                      <Copy className="h-4 w-4 mr-2" />{t("Copy email")}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Widget tab ──────────────────────────────────────────── */}
        <TabsContent value="widget" className="space-y-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <Globe className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sm">{t("Embeddable Chat Widget")}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("Add an AI property assistant to any website with one line of code.")}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-5">
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("Widget ID (Public Key)")}</CardTitle>
                  <CardDescription className="text-xs">{t("Use this key in the embed script to identify your agency.")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input value={widgetKey} readOnly dir="ltr" className="font-mono text-xs bg-muted" />
                    <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(widgetKey); toast(t("Copied")); }}>
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
                        { label: "Indigo", value: "#6366f1" }, { label: "Violet", value: "#8b5cf6" },
                        { label: "Blue",   value: "#3b82f6" }, { label: "Emerald", value: "#10b981" },
                        { label: "Rose",   value: "#f43f5e" }, { label: "Amber",   value: "#f59e0b" },
                      ].map((p) => (
                        <button key={p.value} title={p.label} onClick={() => setWColor(p.value)}
                          className="h-7 w-7 rounded-full border-2 transition-all duration-150 hover:scale-110 active:scale-95 flex items-center justify-center"
                          style={{ background: p.value, borderColor: wColor === p.value ? p.value : "transparent", boxShadow: wColor === p.value ? `0 0 0 2px white, 0 0 0 4px ${p.value}` : "none" }}
                        >
                          {wColor === p.value && <Check className="h-3 w-3 text-white" />}
                        </button>
                      ))}
                      <div className="flex items-center gap-1.5 ms-1">
                        <input type="color" value={wColor} onChange={(e) => setWColor(e.target.value)} className="h-7 w-7 rounded-full cursor-pointer border border-border bg-transparent p-0.5" title={t("Custom color")} />
                        <span className="text-xs text-muted-foreground font-mono">{wColor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("Agent name")}</Label>
                    <Input value={wName} onChange={(e) => setWName(e.target.value)} placeholder="Property Assistant" maxLength={40} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("Opening message")}</Label>
                    <textarea value={wGreeting} onChange={(e) => setWGreeting(e.target.value)} rows={2} maxLength={160}
                      placeholder="Hi! How can I help you find your perfect property?"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground"
                    />
                    <div className="text-[11px] text-muted-foreground text-end">{wGreeting.length}/160</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("Position")}</Label>
                      <div className="flex rounded-md border border-input overflow-hidden">
                        {(["right", "left"] as const).map((pos) => (
                          <button key={pos} onClick={() => setWPosition(pos)}
                            className={`flex-1 py-1.5 text-xs capitalize transition-colors ${wPosition === pos ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}
                          >
                            {t(pos.charAt(0).toUpperCase() + pos.slice(1))}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("Theme")}</Label>
                      <div className="flex rounded-md border border-input overflow-hidden">
                        {(["light", "dark"] as const).map((th) => (
                          <button key={th} onClick={() => setWTheme(th)}
                            className={`flex-1 py-1.5 text-xs capitalize transition-colors ${wTheme === th ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}
                          >
                            {t(th.charAt(0).toUpperCase() + th.slice(1))}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button onClick={() => saveWidgetMutation.mutate()} disabled={saveWidgetMutation.isPending} className="w-full">
                      {saveWidgetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {t("Save Widget Customization")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("Embed Code")}</CardTitle>
                  <CardDescription className="text-xs">
                    {t("Paste this snippet before the closing")} <code className="font-mono text-primary">&lt;/body&gt;</code> {t("tag of your website.")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto leading-relaxed text-foreground/80 whitespace-pre-wrap break-all">
                    {embedCode}
                  </pre>
                  <Button onClick={copyEmbedCode} variant={codeCopied ? "default" : "outline"} size="sm" className="gap-2">
                    {codeCopied ? <><Check className="h-3.5 w-3.5" /> {t("Copied!")}</> : <><Copy className="h-3.5 w-3.5" /> {t("Copy embed code")}</>}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">{t("Live Preview")}</div>
              <WidgetPreview color={wColor} name={wName} greeting={wGreeting} dark={wTheme === "dark"} />
              <p className="text-[11px] text-muted-foreground text-center">{t("Looks exactly like this on any website")}</p>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

// ── Widget Preview component ──────────────────────────────────────────────────
interface WidgetPreviewProps { color: string; name: string; greeting: string; dark: boolean; }

function darkenPreview(hex: string, f = 0.72): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return hex;
  const ch = (v: string) => Math.round(parseInt(v, 16) * f).toString(16).padStart(2, "0");
  return `#${ch(r[1])}${ch(r[2])}${ch(r[3])}`;
}

function WidgetPreview({ color, name, greeting, dark }: WidgetPreviewProps) {
  const bg    = dark ? "#0f172a" : "#f8fafc";
  const msgBg = dark ? "rgba(255,255,255,0.08)" : "#ffffff";
  const grad  = `linear-gradient(135deg, ${color} 0%, ${darkenPreview(color)} 100%)`;

  return (
    <div className="relative flex flex-col items-end gap-3 select-none">
      <div className="w-full rounded-2xl overflow-hidden border border-black/8 shadow-xl" style={{ background: bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ background: grad }}>
          <div className="relative flex-shrink-0">
            <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border-[1.5px] border-white" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white leading-none truncate max-w-[180px]">{name}</div>
            <div className="text-[9px] text-white/70 mt-0.5 flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400 inline-block" /> Online
            </div>
          </div>
        </div>
        <div className="px-3 py-3 space-y-2.5" style={{ background: bg }}>
          <div className="flex items-end gap-1.5">
            <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: color }}>
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="max-w-[80%] px-2.5 py-1.5 rounded-xl rounded-bl-sm text-[10px] leading-relaxed" style={{ background: msgBg, color: dark ? "#f1f5f9" : "#1e293b", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              {greeting.length > 70 ? greeting.slice(0, 70) + "…" : greeting}
            </div>
          </div>
          <div className="flex items-end justify-end">
            <div className="max-w-[65%] px-2.5 py-1.5 rounded-xl rounded-br-sm text-[10px] text-white leading-relaxed" style={{ background: color }}>
              I'm looking for a 3-bedroom villa
            </div>
          </div>
          <div className="flex items-end gap-1.5">
            <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: color }}>
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="px-2.5 py-2 rounded-xl rounded-bl-sm" style={{ background: msgBg, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1 w-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 border-t" style={{ background: dark ? "#111827" : "#ffffff", borderColor: dark ? "rgba(255,255,255,0.08)" : "#f0f0f0" }}>
          <span className="flex-1 text-[10px] text-gray-400">Type a message…</span>
          <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: grad }}>
            <Send className="h-2.5 w-2.5 text-white translate-x-px" />
          </div>
        </div>
        <div className="text-center py-1 text-[9px] flex items-center justify-center gap-1" style={{ color: dark ? "rgba(255,255,255,0.2)" : "#9ca3af", background: dark ? "#0f172a" : "#f8fafc" }}>
          <Sparkles className="h-2 w-2" />
          Powered by <span className="font-semibold ms-0.5">Stratos Hub</span>
        </div>
      </div>
      <div className="h-11 w-11 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110 cursor-pointer" style={{ background: grad, boxShadow: `0 6px 20px ${color}66` }} title="Widget button">
        <MessageSquare className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}
