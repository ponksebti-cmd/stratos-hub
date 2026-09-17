// Central API service — connected to the Bun backend with seamless Demo Mode fallback.
// Token is stored in localStorage under "stratos_token".

import {
  getDemoLeads,
  saveDemoLeads,
  getDemoFiles,
  saveDemoFiles,
  getDemoSessions,
  saveDemoSessions,
  getDemoMessages,
  saveDemoMessages,
  getDemoSettings,
  saveDemoSettings,
  mockUsage,
  mockCompany,
  mockUser,
  generateRealEstateAIResponse,
} from "./mock-data";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function getToken(): string | null {
  return localStorage.getItem("stratos_token");
}

export function isDemoMode(): boolean {
  const token = getToken();
  return !token || token === "demo" || token.startsWith("demo_");
}

export function setToken(token: string) {
  localStorage.setItem("stratos_token", token);
}

export function clearToken() {
  localStorage.removeItem("stratos_token");
  localStorage.removeItem("stratos_user");
}

type FetchOptions = RequestInit & { auth?: boolean };

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ===== Types (data model) =====
export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
}
export interface User {
  id: string;
  email: string;
  name: string;
  companyId: string;
  role: "admin" | "member";
}
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "processing" | "ready" | "failed";
  uploadedAt: string;
}
export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
export interface Lead {
  id: string;
  name: string;
  phone: string;
  budget: number;
  city: string;
  propertyType: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "lost" | "won";
  score: number;
  createdAt: string;
}
export interface CreditUsage {
  date: string;
  credits: number;
  chats: number;
}
export interface Subscription {
  plan: string;
  creditsLeft: number;
  renewsAt: string;
}
export interface WidgetConfig {
  color: string;
  name: string;
  greeting: string;
  theme: "light" | "dark";
  position: "right" | "left";
}

export interface ChannelStatus {
  connected: boolean;
}
export interface WhatsAppChannel extends ChannelStatus {
  phoneId: string;
  businessId: string;
  verifyToken: string;
}
export interface MessengerChannel extends ChannelStatus {
  pageId: string;
  verifyToken: string;
}
export interface InstagramChannel extends ChannelStatus {
  accountId: string;
  verifyToken: string;
}
export interface TikTokChannel extends ChannelStatus {
  appId: string;
  accountId: string;
  verifyToken: string;
}
export interface Channels {
  whatsapp: WhatsAppChannel;
  messenger: MessengerChannel;
  instagram: InstagramChannel;
  tiktok: TikTokChannel;
}

export interface Settings {
  company: Company;
  subscription: Subscription;
  hasOpenAIKey: boolean;
  systemPrompt?: string;
  user: User;
  widgetConfig?: WidgetConfig;
  channels: Channels;
}

// ===== API surface with Mock / Demo Fallbacks =====
export const api = {
  request,
  auth: {
    register: async (email: string, password: string, name: string) => {
      try {
        return await request<{ token: string; userId: string; companyId: string }>(
          "/auth/register",
          {
            method: "POST",
            body: JSON.stringify({ email, password, name }),
          },
        );
      } catch (e) {
        // Fallback for demo / preview environments without active DB
        const fakeToken = "demo_token_" + Date.now();
        setToken(fakeToken);
        return { token: fakeToken, userId: "demo-user-1", companyId: "demo-agency-101" };
      }
    },
    login: async (email: string, password: string) => {
      try {
        return await request<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
      } catch (e) {
        // Fallback for demo / preview
        const fakeToken = "demo_token_" + Date.now();
        setToken(fakeToken);
        const user: User = { ...mockUser, email };
        return { token: fakeToken, user };
      }
    },
    google: async (token: string) => {
      try {
        return await request<{ token: string; user: User }>("/auth/google", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
      } catch (e) {
        const fakeToken = "demo_google_token_" + Date.now();
        setToken(fakeToken);
        return { token: fakeToken, user: mockUser };
      }
    },
  },
  files: {
    list: async (): Promise<UploadedFile[]> => {
      try {
        if (!getToken()) return getDemoFiles();
        return await request<UploadedFile[]>("/files");
      } catch {
        return getDemoFiles();
      }
    },
    upload: async (formData: FormData): Promise<UploadedFile[]> => {
      try {
        const token = getToken();
        if (!token) throw new Error("No token");
        const res = await fetch(`${API_BASE_URL}/files`, {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Upload failed");
        return await res.json();
      } catch {
        // Mock file upload
        const current = getDemoFiles();
        const newFiles: UploadedFile[] = [];
        for (const [key, val] of formData.entries()) {
          if (val instanceof File) {
            newFiles.push({
              id: "f_" + Math.random().toString(36).slice(2, 8),
              name: val.name,
              size: val.size,
              type: val.type || "application/pdf",
              status: "ready",
              uploadedAt: new Date().toISOString(),
            });
          }
        }
        const updated = [...newFiles, ...current];
        saveDemoFiles(updated);
        return newFiles.length > 0 ? newFiles : [current[0]];
      }
    },
    remove: async (id: string): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          const current = getDemoFiles().filter((f) => f.id !== id);
          saveDemoFiles(current);
          return { ok: true };
        }
        return await request<{ ok: boolean }>(`/files/${id}`, { method: "DELETE" });
      } catch {
        const current = getDemoFiles().filter((f) => f.id !== id);
        saveDemoFiles(current);
        return { ok: true };
      }
    },
  },
  chat: {
    sessions: async (): Promise<ChatSession[]> => {
      try {
        if (!getToken()) return getDemoSessions();
        return await request<ChatSession[]>("/chat/sessions");
      } catch {
        return getDemoSessions();
      }
    },
    createSession: async (title?: string): Promise<ChatSession> => {
      try {
        if (!getToken()) {
          const sessions = getDemoSessions();
          const newSession: ChatSession = {
            id: "s_" + Date.now(),
            title: title || "New property inquiry",
            updatedAt: new Date().toISOString(),
          };
          saveDemoSessions([newSession, ...sessions]);
          return newSession;
        }
        return await request<ChatSession>("/chat/sessions", {
          method: "POST",
          body: JSON.stringify({ title }),
        });
      } catch {
        const sessions = getDemoSessions();
        const newSession: ChatSession = {
          id: "s_" + Date.now(),
          title: title || "New property inquiry",
          updatedAt: new Date().toISOString(),
        };
        saveDemoSessions([newSession, ...sessions]);
        return newSession;
      }
    },
    messages: async (sessionId: string): Promise<Message[]> => {
      try {
        if (!getToken()) return getDemoMessages(sessionId);
        return await request<Message[]>(`/chat/sessions/${sessionId}/messages`);
      } catch {
        return getDemoMessages(sessionId);
      }
    },
    send: async (sessionId: string, content: string): Promise<Message> => {
      try {
        if (!getToken()) {
          const msgs = getDemoMessages(sessionId);
          const replyText = generateRealEstateAIResponse(content);
          const userMsg: Message = {
            id: "m_u_" + Date.now(),
            role: "user",
            content,
            createdAt: new Date().toISOString(),
          };
          const aiMsg: Message = {
            id: "m_a_" + Date.now(),
            role: "assistant",
            content: replyText,
            createdAt: new Date().toISOString(),
          };
          saveDemoMessages(sessionId, [...msgs, userMsg, aiMsg]);
          return aiMsg;
        }
        return await request<Message>(`/chat/sessions/${sessionId}/messages`, {
          method: "POST",
          body: JSON.stringify({ content }),
        });
      } catch {
        const replyText = generateRealEstateAIResponse(content);
        return {
          id: "m_a_" + Date.now(),
          role: "assistant",
          content: replyText,
          createdAt: new Date().toISOString(),
        };
      }
    },
    streamSend: async (
      sessionId: string,
      content: string,
      onChunk: (chunk: string) => void,
    ): Promise<Message> => {
      const token = getToken();

      if (token && !token.startsWith("demo_")) {
        try {
          const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages?stream=true`, {
            method: "POST",
            body: JSON.stringify({ content }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let finalMessage: Message | null = null;
            let accumulatedText = "";
            let buffer = "";

            while (!done) {
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              if (value) {
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr !== "[DONE]") {
                      try {
                        const data = JSON.parse(dataStr);
                        if (data.type === "chunk") {
                          accumulatedText += data.text;
                          onChunk(data.text);
                        } else if (data.type === "done" && data.message) {
                          finalMessage = data.message;
                        }
                      } catch {}
                    }
                  }
                }
              }
            }

            if (finalMessage) return finalMessage;
            return {
              id: crypto.randomUUID(),
              role: "assistant",
              content: accumulatedText,
              createdAt: new Date().toISOString(),
            };
          }
        } catch {
          // Fall through to demo streaming simulator
        }
      }

      // Demo Mode simulated AI streaming
      const reply = generateRealEstateAIResponse(content);
      const chunkSize = 4;
      for (let i = 0; i < reply.length; i += chunkSize) {
        const piece = reply.slice(i, i + chunkSize);
        onChunk(piece);
        await new Promise((r) => setTimeout(r, 20));
      }

      const msgs = getDemoMessages(sessionId);
      const userMsg: Message = {
        id: "m_u_" + Date.now(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      const aiMsg: Message = {
        id: "m_a_" + Date.now(),
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
      };
      saveDemoMessages(sessionId, [...msgs, userMsg, aiMsg]);
      return aiMsg;
    },
  },
  leads: {
    list: async (): Promise<Lead[]> => {
      try {
        if (!getToken()) return getDemoLeads();
        return await request<Lead[]>("/leads");
      } catch {
        return getDemoLeads();
      }
    },
    create: async (data: Partial<Lead>): Promise<Lead> => {
      try {
        if (!getToken()) {
          const current = getDemoLeads();
          const newLead: Lead = {
            id: "l_" + Date.now(),
            name: data.name || "New Client",
            phone: data.phone || "+91 98000 00000",
            budget: data.budget || 25000000,
            city: data.city || "Mumbai",
            propertyType: data.propertyType || "3BHK Apartment",
            source: data.source || "Website",
            status: data.status || "new",
            score: data.score || 3,
            createdAt: new Date().toISOString().split("T")[0],
          };
          saveDemoLeads([newLead, ...current]);
          return newLead;
        }
        return await request<Lead>("/leads", { method: "POST", body: JSON.stringify(data) });
      } catch {
        const current = getDemoLeads();
        const newLead: Lead = {
          id: "l_" + Date.now(),
          name: data.name || "New Client",
          phone: data.phone || "+91 98000 00000",
          budget: data.budget || 25000000,
          city: data.city || "Mumbai",
          propertyType: data.propertyType || "3BHK Apartment",
          source: data.source || "Website",
          status: data.status || "new",
          score: data.score || 3,
          createdAt: new Date().toISOString().split("T")[0],
        };
        saveDemoLeads([newLead, ...current]);
        return newLead;
      }
    },
    update: async (id: string, patch: Partial<Lead>): Promise<Lead> => {
      try {
        if (!getToken()) {
          const current = getDemoLeads();
          const updated = current.map((l) => (l.id === id ? { ...l, ...patch } : l));
          saveDemoLeads(updated);
          return updated.find((l) => l.id === id)!;
        }
        return await request<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      } catch {
        const current = getDemoLeads();
        const updated = current.map((l) => (l.id === id ? { ...l, ...patch } : l));
        saveDemoLeads(updated);
        return updated.find((l) => l.id === id)!;
      }
    },
    delete: async (id: string): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          const current = getDemoLeads().filter((l) => l.id !== id);
          saveDemoLeads(current);
          return { ok: true };
        }
        return await request<{ ok: boolean }>(`/leads/${id}`, { method: "DELETE" });
      } catch {
        const current = getDemoLeads().filter((l) => l.id !== id);
        saveDemoLeads(current);
        return { ok: true };
      }
    },
  },
  usage: {
    summary: async (): Promise<CreditUsage[]> => {
      try {
        if (!getToken()) return mockUsage;
        return await request<CreditUsage[]>("/usage");
      } catch {
        return mockUsage;
      }
    },
  },
  settings: {
    get: async (): Promise<Settings> => {
      try {
        if (!getToken()) return getDemoSettings();
        return await request<Settings>("/settings");
      } catch {
        return getDemoSettings();
      }
    },
    update: async (data: Partial<Company>): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          const cur = getDemoSettings();
          saveDemoSettings({ company: { ...cur.company, ...data } });
          return { ok: true };
        }
        return await request<{ ok: boolean }>("/settings", { method: "PATCH", body: JSON.stringify(data) });
      } catch {
        const cur = getDemoSettings();
        saveDemoSettings({ company: { ...cur.company, ...data } });
        return { ok: true };
      }
    },
    saveOpenAIKey: async (apiKey: string): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          saveDemoSettings({ hasOpenAIKey: true });
          return { ok: true };
        }
        return await request<{ ok: boolean }>("/settings/openai-key", {
          method: "PUT",
          body: JSON.stringify({ apiKey }),
        });
      } catch {
        saveDemoSettings({ hasOpenAIKey: true });
        return { ok: true };
      }
    },
    deleteOpenAIKey: async (): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          saveDemoSettings({ hasOpenAIKey: false });
          return { ok: true };
        }
        return await request<{ ok: boolean }>("/settings/openai-key", { method: "DELETE" });
      } catch {
        saveDemoSettings({ hasOpenAIKey: false });
        return { ok: true };
      }
    },
    saveSystemPrompt: async (prompt: string): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          saveDemoSettings({ systemPrompt: prompt });
          return { ok: true };
        }
        return await request<{ ok: boolean }>("/settings/system-prompt", {
          method: "PUT",
          body: JSON.stringify({ prompt }),
        });
      } catch {
        saveDemoSettings({ systemPrompt: prompt });
        return { ok: true };
      }
    },
    saveWidgetConfig: async (config: Partial<WidgetConfig>): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          const cur = getDemoSettings();
          saveDemoSettings({ widgetConfig: { ...cur.widgetConfig!, ...config } });
          return { ok: true };
        }
        return await request<{ ok: boolean }>("/settings/widget", { method: "PUT", body: JSON.stringify(config) });
      } catch {
        const cur = getDemoSettings();
        saveDemoSettings({ widgetConfig: { ...cur.widgetConfig!, ...config } });
        return { ok: true };
      }
    },
    saveWhatsApp: async (data: {
      phoneId: string;
      businessId: string;
      token: string;
      verifyToken: string;
    }): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          const cur = getDemoSettings();
          saveDemoSettings({
            channels: {
              ...cur.channels,
              whatsapp: { connected: true, ...data },
            },
          });
          return { ok: true };
        }
        return await request<{ ok: boolean }>("/settings/whatsapp", { method: "PUT", body: JSON.stringify(data) });
      } catch {
        const cur = getDemoSettings();
        saveDemoSettings({
          channels: {
            ...cur.channels,
            whatsapp: { connected: true, ...data },
          },
        });
        return { ok: true };
      }
    },
    saveMessenger: async (data: { pageId: string; token: string; verifyToken: string }): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          const cur = getDemoSettings();
          saveDemoSettings({
            channels: {
              ...cur.channels,
              messenger: { connected: true, ...data },
            },
          });
          return { ok: true };
        }
        return await request<{ ok: boolean }>("/settings/messenger", {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } catch {
        return { ok: true };
      }
    },
    saveInstagram: async (data: { accountId: string; token: string; verifyToken: string }): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          const cur = getDemoSettings();
          saveDemoSettings({
            channels: {
              ...cur.channels,
              instagram: { connected: true, ...data },
            },
          });
          return { ok: true };
        }
        return await request<{ ok: boolean }>("/settings/instagram", {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } catch {
        return { ok: true };
      }
    },
    saveTikTok: async (data: {
      appId: string;
      appSecret: string;
      accessToken: string;
      accountId: string;
      verifyToken: string;
    }): Promise<{ ok: boolean }> => {
      try {
        if (!getToken()) {
          const cur = getDemoSettings();
          saveDemoSettings({
            channels: {
              ...cur.channels,
              tiktok: { connected: true, ...data },
            },
          });
          return { ok: true };
        }
        return await request<{ ok: boolean }>("/settings/tiktok", { method: "PUT", body: JSON.stringify(data) });
      } catch {
        return { ok: true };
      }
    },
  },
};
