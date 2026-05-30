import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, FileText, MessageSquare, Users, TrendingUp, Settings, Plus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "" },
  { to: "/chat",      label: "Chat",      icon: MessageSquare,   shortcut: "" },
  { to: "/leads",     label: "Leads",     icon: Users,           shortcut: "" },
  { to: "/files",     label: "Files",     icon: FileText,        shortcut: "" },
  { to: "/roi",       label: "ROI",       icon: TrendingUp,      shortcut: "" },
  { to: "/settings",  label: "Settings",  icon: Settings,        shortcut: "" },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => api.leads.list(),
    enabled: open,
    staleTime: 30_000,
  });

  const createSessionMutation = useMutation({
    mutationFn: () => api.chat.createSession(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      navigate({ to: "/chat" });
      onOpenChange(false);
    },
    onError: () => toast.error(t("Failed to create conversation")),
  });

  const go = (to: string) => {
    navigate({ to });
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("Search or jump to…")} />
      <CommandList>
        <CommandEmpty>{t("No results found.")}</CommandEmpty>

        <CommandGroup heading={t("Navigate")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.to} value={item.label} onSelect={() => go(item.to)}>
                <Icon />
                {t(item.label)}
                {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("Actions")}>
          <CommandItem value="new conversation" onSelect={() => createSessionMutation.mutate()}>
            <Plus />
            {t("New conversation")}
          </CommandItem>
        </CommandGroup>

        {leads.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("Recent leads")}>
              {leads.slice(0, 6).map((lead) => (
                <CommandItem key={lead.id} value={`lead ${lead.name} ${lead.city}`} onSelect={() => go("/leads")}>
                  <Users />
                  <span className="font-medium">{lead.name || "—"}</span>
                  <span className="text-muted-foreground text-xs ms-1">· {lead.city || ""} · {lead.propertyType || ""}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
