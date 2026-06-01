import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Loader2, LayoutList, LayoutGrid } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Lead } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({ meta: [{ title: "Leads — Stratos Hub" }] }),
  component: Leads,
});

const statusColor: Record<string, string> = {
  new: "bg-accent text-accent-foreground",
  contacted: "bg-warning/20 text-warning-foreground",
  qualified: "bg-success/20 text-success",
  won: "bg-success text-success-foreground",
  lost: "bg-muted text-muted-foreground",
};

const STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;

const fmtBudget = (n: number) => n > 0 ? `₹${(n / 10000000).toFixed(2)} Cr` : "—";

function initials(name: string) {
  return (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function Leads() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [view, setView] = useState<"table" | "board">("table");
  const [active, setActive] = useState<Lead | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => api.leads.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Lead> }) => api.leads.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(t("Lead updated"));
    },
    onError: () => toast.error(t("Update failed")),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => api.leads.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsAddOpen(false);
      toast.success(t("Lead created"));
    },
    onError: () => toast.error(t("Creation failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.leads.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsDeleteDialogOpen(false);
      setActive(null);
      toast.success(t("Lead deleted"));
    },
    onError: () => toast.error(t("Delete failed")),
  });

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      budget: Number(formData.get("budget")),
      city: formData.get("city") as string,
      propertyType: formData.get("propertyType") as string,
      source: "Manual",
      status: "new"
    });
  };

  const filtered = useMemo(() => leads.filter((l) => {
    const matchQ = !q || [l.name, l.phone, l.city, l.propertyType].join(" ").toLowerCase().includes(q.toLowerCase());
    const matchS = status === "all" || l.status === status;
    return matchQ && matchS;
  }), [leads, q, status]);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mb-2">
        <h2 className="text-xl font-semibold tracking-tight">{t("Leads")}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={`p-2 transition-colors ${view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
              title={t("Table view")}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("board")}
              className={`p-2 transition-colors ${view === "board" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
              title={t("Board view")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>{t("Add lead")}</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search by name, city, phone…")} className="ps-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All statuses")}</SelectItem>
            <SelectItem value="new">{t("New")}</SelectItem>
            <SelectItem value="contacted">{t("Contacted")}</SelectItem>
            <SelectItem value="qualified">{t("Qualified")}</SelectItem>
            <SelectItem value="won">{t("Won")}</SelectItem>
            <SelectItem value="lost">{t("Lost")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table view */}
      {view === "table" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 border-b last:border-0 pb-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {leads.length === 0 ? t("No leads yet. Start a chat to extract leads automatically.") : t("No leads match your filters.")}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-start px-4 py-3">{t("Name")}</th>
                    <th className="text-start px-4 py-3">{t("Phone")}</th>
                    <th className="text-start px-4 py-3">{t("Budget")}</th>
                    <th className="text-start px-4 py-3">{t("City")}</th>
                    <th className="text-start px-4 py-3">{t("Property")}</th>
                    <th className="text-start px-4 py-3">{t("Source")}</th>
                    <th className="text-start px-4 py-3">{t("Score")}</th>
                    <th className="text-start px-4 py-3">{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} onClick={() => setActive(l)} className="border-t border-border cursor-pointer hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                            {initials(l.name)}
                          </div>
                          {l.name || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{l.phone || "—"}</td>
                      <td className="px-4 py-3">{fmtBudget(l.budget)}</td>
                      <td className="px-4 py-3">{t(l.city) || "—"}</td>
                      <td className="px-4 py-3">{t(l.propertyType) || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t(l.source)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={l.score >= 5 ? "default" : l.score >= 3 ? "secondary" : "outline"}>
                          {l.score || 0}
                        </Badge>
                      </td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusColor[l.status]}`}>{t(l.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Board / Kanban view */}
      {view === "board" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STATUSES.map((col) => {
              const columnLeads = filtered.filter((l) => l.status === col);
              return (
                <div key={col} className="flex flex-col w-60 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor[col]}`}>{t(col)}</span>
                    <span className="text-xs text-muted-foreground font-medium tabular-nums">{isLoading ? "—" : columnLeads.length}</span>
                  </div>
                  <div className="space-y-2">
                    {isLoading ? (
                      [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                    ) : columnLeads.length === 0 ? (
                      <div className="h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">{t("No leads")}</span>
                      </div>
                    ) : columnLeads.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setActive(l)}
                        className="w-full text-start bg-card border border-border rounded-xl p-3 hover:shadow-sm hover:border-primary/40 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                            {initials(l.name)}
                          </div>
                          <span className="text-sm font-medium truncate">{l.name || "—"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{t(l.city) || "—"} · {t(l.propertyType) || "—"}</div>
                        {l.budget > 0 && <div className="text-xs font-medium mt-1.5 text-foreground">{fmtBudget(l.budget)}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lead detail sheet */}
      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent>
          {active && (
            <>
              <SheetHeader><SheetTitle>{active.name || t("Lead details")}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                {[
                  [t("Phone"), active.phone || "—"],
                  [t("Budget"), fmtBudget(active.budget)],
                  [t("City"), t(active.city) || "—"],
                  [t("Property type"), t(active.propertyType) || "—"],
                  [t("Source"), t(active.source)],
                  [t("Status"), t(active.status)],
                  [t("Created"), active.createdAt],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium capitalize">{v}</span>
                  </div>
                ))}
                <div className="flex gap-2 pt-4 flex-wrap">
                  <Select
                    value={active.status}
                    onValueChange={(val) => updateMutation.mutate({ id: active.id, patch: { status: val as Lead["status"] } })}
                  >
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{t("New")}</SelectItem>
                      <SelectItem value="contacted">{t("Contacted")}</SelectItem>
                      <SelectItem value="qualified">{t("Qualified")}</SelectItem>
                      <SelectItem value="won">{t("Won")}</SelectItem>
                      <SelectItem value="lost">{t("Lost")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>{t("Delete")}</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete lead")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("Are you sure you want to delete")} <strong>{active?.name}</strong>? {t("This cannot be undone.")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>{t("Cancel")}</Button>
            <Button variant="destructive" onClick={() => active && deleteMutation.mutate(active.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add lead dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Add lead")}</DialogTitle></DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div><Label>{t("Name")}</Label><Input name="name" required /></div>
            <div><Label>{t("Phone")}</Label><Input name="phone" dir="ltr" /></div>
            <div><Label>{t("Budget (₹)")}</Label><Input name="budget" type="number" min={0} defaultValue={0} /></div>
            <div><Label>{t("City")}</Label><Input name="city" /></div>
            <div><Label>{t("Property type")}</Label><Input name="propertyType" /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)}>{t("Cancel")}</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
