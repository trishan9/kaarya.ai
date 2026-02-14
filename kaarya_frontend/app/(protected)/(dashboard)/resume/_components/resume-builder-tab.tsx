"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CirclePlus,
  FileText,
  Loader2,
  PencilLine,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createResumeDraft,
  deleteResumeBuilder,
  listResumeBuilders,
  type ResumeBuilderListItem,
  type ResumeBuilderTemplateId,
} from "@/lib/actions/resume-builder-actions";
import { cn } from "@/lib/utils";
import { ResumeEditorFlow } from "./resume-editor-flow";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "saved", label: "Saved" },
  { id: "draft", label: "Drafts" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["id"];
type TemplateFilter = "all" | ResumeBuilderTemplateId;

const TEMPLATE_FILTERS: { id: TemplateFilter; label: string }[] = [
  { id: "all", label: "All templates" },
  { id: "professional", label: "Professional" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "executive", label: "Executive" },
];

export function ResumeBuilderTab() {
  const [items, setItems] = useState<ResumeBuilderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>("all");

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listResumeBuilders({ page: 1, size: 50 });
      setItems(data.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load resumes.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        (item.targetRole ?? "").toLowerCase().includes(search);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "saved"
            ? Boolean(item.generatedResumeId)
            : !item.generatedResumeId;
      const matchesTemplate =
        templateFilter === "all" ? true : item.templateId === templateFilter;
      return matchesSearch && matchesStatus && matchesTemplate;
    });
  }, [items, query, statusFilter, templateFilter]);

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const draft = await createResumeDraft({
        title: "Untitled Resume",
        templateId: "professional",
        content: {},
      });
      setEditingId(draft.id);
      toast.success("Resume draft created.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create resume.";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this resume draft?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteResumeBuilder(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Resume draft deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete resume.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseEditor = () => {
    setEditingId(null);
    fetchList();
  };

  if (editingId) {
    return (
      <ResumeEditorFlow
        resumeId={editingId}
        onClose={handleCloseEditor}
        onSaved={handleCloseEditor}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">My Resumes</h3>
          <p className="text-sm text-muted-foreground">
            Build, preview, and save ATS-ready resumes for job applications.
          </p>
        </div>
        <Button onClick={handleCreateNew} disabled={creating} className="gap-2 rounded-lg">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CirclePlus className="h-4 w-4" />}
          Create new
        </Button>
      </div>

      <Card className="rounded-xl border-[#ececf0] shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:p-5 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by resume title or target role"
              className="pl-9"
            />
          </div>
          <Select
            value={templateFilter}
            onValueChange={(value) => setTemplateFilter(value as TemplateFilter)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Filter by template" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_FILTERS.map((filter) => (
                <SelectItem key={filter.id} value={filter.id}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="col-span-full flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.id}
                type="button"
                variant={statusFilter === filter.id ? "default" : "outline"}
                className={cn(
                  "h-8 rounded-md px-3 text-xs",
                  statusFilter === filter.id ? "shadow-sm" : "bg-white"
                )}
                onClick={() => setStatusFilter(filter.id)}
              >
                {filter.label}
              </Button>
            ))}
            <Badge variant="secondary" className="ml-auto">
              {filteredItems.length} result{filteredItems.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="rounded-xl border border-dashed border-[#e5e7eb] py-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">No resumes found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or create a new resume draft.
              </p>
            </div>
            <Button onClick={handleCreateNew} disabled={creating} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CirclePlus className="h-4 w-4" />}
              Create resume
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="rounded-xl border-[#ececf0] shadow-sm">
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="line-clamp-1 text-base">{item.title}</CardTitle>
                  <Badge variant={item.generatedResumeId ? "default" : "outline"}>
                    {item.generatedResumeId ? "Saved" : "Draft"}
                  </Badge>
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  Target role: {item.targetRole || "Not set"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Template: {item.templateId}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="flex items-center gap-2 pt-0">
                <Button
                  className="flex-1 gap-2"
                  size="sm"
                  onClick={() => setEditingId(item.id)}
                >
                  <PencilLine className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-rose-600 hover:text-rose-700"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
