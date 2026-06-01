import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Upload, FileText, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export const Route = createFileRoute("/_app/files")({
  head: () => ({ meta: [{ title: "Files — Stratos Hub" }] }),
  component: Files,
});

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function Files() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["files"],
    queryFn: () => api.files.list(),
    // Poll every 3s to catch files switching from processing → ready
    refetchInterval: (query) => {
      const data = query.state.data ?? [];
      return data.some((f) => f.status === "processing") ? 3000 : false;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (fileList: FileList) => {
      const formData = new FormData();
      Array.from(fileList).forEach((f) => formData.append("file", f));
      return api.files.upload(formData);
    },
    onSuccess: (uploaded) => {
      toast.success(`${uploaded.length} ${t("file(s) uploaded — processing")}`);
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: () => toast.error(t("Upload failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.files.remove(id),
    onSuccess: () => {
      toast(t("File deleted"));
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: () => toast.error(t("Delete failed")),
  });

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    uploadMutation.mutate(list);
  };

  return (
    <div className="space-y-6">
      <Card
        className={`border-dashed transition-colors ${dragging ? "border-primary bg-accent/30" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <CardContent className="p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            {uploadMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </div>
          <h3 className="font-medium">{t("Upload listings, brochures, or lead exports")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("PDF, Excel, or CSV. Drag and drop or click to browse.")}</p>
          <Button className="mt-4" onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending}>
            {t("Choose files")}
          </Button>
          <input ref={inputRef} type="file" multiple accept=".pdf,.csv,.xls,.xlsx" hidden onChange={(e) => handleFiles(e.target.files)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b last:border-0 pb-3">
                  <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-1/6" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">{t("No files uploaded yet.")}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3">{t("Name")}</th>
                  <th className="text-start px-4 py-3 hidden sm:table-cell">{t("Size")}</th>
                  <th className="text-start px-4 py-3">{t("Status")}</th>
                  <th className="text-start px-4 py-3 hidden md:table-cell">{t("Uploaded")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id} className="border-t border-border">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{f.name}</div></td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{formatSize(f.size)}</td>
                    <td className="px-4 py-3">
                      {f.status === "processing" && <span className="inline-flex items-center gap-1 text-warning-foreground"><Loader2 className="h-3 w-3 animate-spin" /> {t("Processing")}</span>}
                      {f.status === "ready" && <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" /> {t("Ready")}</span>}
                      {f.status === "failed" && <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" /> {t("Failed")}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{new Date(f.uploadedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-end">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => deleteMutation.mutate(f.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
