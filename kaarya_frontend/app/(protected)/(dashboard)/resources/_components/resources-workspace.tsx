"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe2,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createResourceCourse,
  deleteResourceCourse,
  updateResourceCourse,
} from "@/lib/actions/resource-actions";
import { Role, TResourceCourse } from "@/lib/definitions";
import { cn } from "@/lib/utils";

type WorkspaceOption = {
  id: string;
  name: string | null;
};

type Props = {
  role?: Role | null;
  myCourses: TResourceCourse[];
  publicCourses: TResourceCourse[];
  recruiterWorkspaces: WorkspaceOption[];
  collegeWorkspaces: WorkspaceOption[];
};

const canCreateCourse = (role?: Role | null) =>
  role === Role.ADMIN ||
  role === Role.RECRUITER ||
  role === Role.COLLEGE ||
  role === Role.USER ||
  role === Role.STUDENT;

const toListFromComma = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toListFromLine = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const extractCourseId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  if (typeof record.id === "string" && record.id.trim())
    return record.id.trim();
  if (typeof record.courseId === "string" && record.courseId.trim()) {
    return record.courseId.trim();
  }

  if (record.data && typeof record.data === "object") {
    const nested = extractCourseId(record.data);
    if (nested) return nested;
  }

  return null;
};

const parseError = (value: unknown, fallback: string) => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (Array.isArray(record.message))
      return record.message.map(String).join(", ");
  }
  return fallback;
};

const completionStorageKey = (courseId: string) =>
  `kaarya_resource_completion_${courseId}`;

const getCourseCompletion = (course: TResourceCourse) => {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(completionStorageKey(course.id));
    if (!raw) return 0;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return 0;

    const chapterCount = Math.max(1, course.chapters.length);
    const completed = new Set(
      parsed
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value))
        .filter((value) => value >= 0 && value < chapterCount),
    ).size;

    return Math.round((completed / chapterCount) * 100);
  } catch {
    return 0;
  }
};

const normalizeTag = (value: string) => value.trim().toLowerCase();

export function ResourcesWorkspace({
  role,
  myCourses,
  publicCourses,
  recruiterWorkspaces,
  collegeWorkspaces,
}: Props) {
  const router = useRouter();
  const canCreate = canCreateCourse(role);
  const workspaceOptions =
    role === Role.RECRUITER
      ? recruiterWorkspaces
      : role === Role.COLLEGE
        ? collegeWorkspaces
        : [];

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<
    "all" | "beginner" | "intermediate" | "advanced"
  >("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionCourseId, setActionCourseId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generationMode, setGenerationMode] = useState<
    "learn" | "interview_prep"
  >("learn");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "intermediate",
  );
  const [rolesInput, setRolesInput] = useState("");
  const [chapterCount, setChapterCount] = useState(6);
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [chapterTitles, setChapterTitles] = useState("");
  const [promptContext, setPromptContext] = useState("");
  const [jobDescriptionContext, setJobDescriptionContext] = useState("");
  const [workspaceId, setWorkspaceId] = useState(workspaceOptions[0]?.id ?? "");

  const [completionMap, setCompletionMap] = useState<Record<string, number>>(
    {},
  );

  const allCourses = useMemo(() => {
    const merged = [...myCourses, ...publicCourses];
    const byId = new Map<string, TResourceCourse>();
    merged.forEach((course) => {
      if (!byId.has(course.id)) byId.set(course.id, course);
    });
    return Array.from(byId.values());
  }, [myCourses, publicCourses]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next: Record<string, number> = {};
    allCourses.forEach((course) => {
      next[course.id] = getCourseCompletion(course);
    });
    setCompletionMap(next);
  }, [allCourses]);

  const tags = useMemo(() => {
    const dynamic = allCourses
      .flatMap((course) => [course.category, ...course.targetRoles])
      .map((item) => item.trim())
      .filter(Boolean);

    return Array.from(new Set(dynamic)).slice(0, 22);
  }, [allCourses]);

  const matchesFilters = (
    course: TResourceCourse,
    q: string,
    selectedDifficulty: typeof difficulty,
    tag: string,
  ) => {
    const normalizedSearch = q.trim().toLowerCase();
    const normalizedTag = normalizeTag(tag);

    const matchesSearch =
      !normalizedSearch ||
      course.title.toLowerCase().includes(normalizedSearch) ||
      course.description?.toLowerCase().includes(normalizedSearch) ||
      course.category.toLowerCase().includes(normalizedSearch) ||
      course.targetRoles.some((item) =>
        item.toLowerCase().includes(normalizedSearch),
      );

    const matchesDifficulty =
      selectedDifficulty === "all" || course.difficulty === selectedDifficulty;

    const matchesTag =
      normalizedTag === "all" ||
      normalizeTag(course.category) === normalizedTag ||
      course.targetRoles.some(
        (targetRole) => normalizeTag(targetRole) === normalizedTag,
      );

    return matchesSearch && matchesDifficulty && matchesTag;
  };

  const filteredMine = useMemo(
    () =>
      myCourses.filter((course) =>
        matchesFilters(course, search, difficulty, selectedTag),
      ),
    [myCourses, search, difficulty, selectedTag],
  );

  const filteredPublic = useMemo(
    () =>
      publicCourses.filter((course) =>
        matchesFilters(course, search, difficulty, selectedTag),
      ),
    [publicCourses, search, difficulty, selectedTag],
  );

  const resetCreateForm = () => {
    setTitle("");
    setDescription("");
    setGenerationMode("learn");
    setLevel("intermediate");
    setRolesInput("");
    setChapterCount(6);
    setVisibility("private");
    setChapterTitles("");
    setPromptContext("");
    setJobDescriptionContext("");
    setWorkspaceId(workspaceOptions[0]?.id ?? "");
  };

  const handleCreateCourse = async () => {
    if (!title.trim()) {
      toast.error("Course name is required.");
      return;
    }

    const targetRoles = toListFromComma(rolesInput);
    if (!targetRoles.length) {
      toast.error("Add at least one target role.");
      return;
    }

    if ((role === Role.RECRUITER || role === Role.COLLEGE) && !workspaceId) {
      toast.error("Please select a workspace.");
      return;
    }

    setSaving(true);
    try {
      const response = await createResourceCourse({
        title: title.trim(),
        description: description.trim() || undefined,
        category: generationMode === "learn" ? "Learn" : "Interview Prep",
        generationMode,
        difficulty: level,
        targetRoles,
        chapterCount,
        chapterTitles: toListFromLine(chapterTitles),
        visibility,
        promptContext: promptContext.trim() || undefined,
        jobDescriptionContext: jobDescriptionContext.trim() || undefined,
        ...(role === Role.RECRUITER ? { companyId: workspaceId } : {}),
        ...(role === Role.COLLEGE ? { collegeId: workspaceId } : {}),
      });

      if (!response?.success) {
        toast.error(parseError(response, "Failed to generate course."));
        return;
      }

      const courseId = extractCourseId(response);
      toast.success("Course generated successfully.");
      setCreateOpen(false);
      resetCreateForm();
      if (courseId) {
        router.push(`/resources/${courseId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(parseError(error, "Failed to generate course."));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (course: TResourceCourse) => {
    setActionCourseId(course.id);
    try {
      const nextVisibility =
        course.visibility === "public" ? "private" : "public";
      const response = await updateResourceCourse(course.id, {
        visibility: nextVisibility,
      });
      if (!response?.success) {
        toast.error(parseError(response, "Failed to update visibility."));
        return;
      }
      toast.success(
        nextVisibility === "public"
          ? "Course is now public."
          : "Course is now private.",
      );
      router.refresh();
    } catch (error) {
      toast.error(parseError(error, "Failed to update visibility."));
    } finally {
      setActionCourseId(null);
    }
  };

  const handleRegenerate = async (course: TResourceCourse) => {
    setActionCourseId(course.id);
    try {
      const response = await updateResourceCourse(course.id, {
        regenerateContent: true,
      });
      if (!response?.success) {
        toast.error(parseError(response, "Failed to regenerate course."));
        return;
      }
      toast.success("Course regenerated.");
      router.refresh();
    } catch (error) {
      toast.error(parseError(error, "Failed to regenerate course."));
    } finally {
      setActionCourseId(null);
    }
  };

  const handleDelete = async (course: TResourceCourse) => {
    if (!window.confirm(`Delete "${course.title}"?`)) return;
    setActionCourseId(course.id);
    try {
      const response = await deleteResourceCourse(course.id);
      if (!response?.success) {
        toast.error(parseError(response, "Failed to delete course."));
        return;
      }
      toast.success("Course deleted.");
      router.refresh();
    } catch (error) {
      toast.error(parseError(error, "Failed to delete course."));
    } finally {
      setActionCourseId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#00629F]/80 to-[#00629F] px-4 py-8 text-white sm:px-8">
        <div className="pointer-events-none absolute left-0 bottom-0 h-8 w-72 rounded-tr-2xl bg-white/10" />
        <div className="pointer-events-none absolute right-0 top-0 h-12 w-48 rounded-bl-2xl rounded-tr-2xl bg-white/10" />
        <div className="pointer-events-none absolute right-0 top-0 h-22 w-32 rounded-tr-2xl rounded-bl-2xl bg-white/10" />

        <div className="relative z-10 space-y-5">
          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl font-semibold leading-tight">
              Learning Resources
            </h2>
            <p className="max-w-2xl text-sm text-white/90">
              Build role-aligned learning resources and interview preparation
              tracks with AI-generated chapter material.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatChip label="My Resources" value={`${myCourses.length}`} />
            <StatChip
              label="Public Resources"
              value={`${publicCourses.length}`}
            />
            <StatChip label="Total" value={`${allCourses.length}`} />
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, category, role"
              className="sm:w-80"
            />
            <Select
              value={difficulty}
              onValueChange={(value) =>
                setDifficulty(value as typeof difficulty)
              }
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Generate New Resource
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="mine" className="space-y-4">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="mine">My Resources</TabsTrigger>
          <TabsTrigger value="public">Public Library</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {filteredMine.length} resources
          </p>
          <CourseGrid
            courses={filteredMine}
            actionCourseId={actionCourseId}
            emptyMessage="No resources in your library yet."
            completionByCourse={completionMap}
            onToggleVisibility={handleToggleVisibility}
            onRegenerate={handleRegenerate}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="public" className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {filteredPublic.length} resources
          </p>
          <CourseGrid
            courses={filteredPublic}
            actionCourseId={actionCourseId}
            emptyMessage="No public resources matched this filter."
            completionByCourse={completionMap}
            onToggleVisibility={handleToggleVisibility}
            onRegenerate={handleRegenerate}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[86vh] max-w-2xl overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
          <DialogHeader>
            <DialogTitle>Generate AI Course</DialogTitle>
            <DialogDescription>
              Choose whether this resource should teach concepts deeply or
              optimize for interview answers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="course-title">Course Name</Label>
              <Input
                id="course-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  generationMode === "learn"
                    ? "Transformers From Fundamentals to Production"
                    : "Backend Engineer Interview Sprint"
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="course-description">Description</Label>
              <Textarea
                id="course-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-24"
                placeholder={
                  generationMode === "learn"
                    ? "Explain what should be taught, how deep it should go, and which subtopics or alternatives must be covered."
                    : "Explain the interview scenarios, question styles, and answer depth this course should optimize for."
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Course Type</Label>
              <Select
                value={generationMode}
                onValueChange={(value) =>
                  setGenerationMode(value as typeof generationMode)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learn">Learn</SelectItem>
                  <SelectItem value="interview_prep">Interview Prep</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={level}
                onValueChange={(value) => setLevel(value as typeof level)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="target-roles">
                Target Roles (comma separated)
              </Label>
              <Input
                id="target-roles"
                value={rolesInput}
                onChange={(event) => setRolesInput(event.target.value)}
                placeholder="AI Engineer, ML Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter-count">Chapter Count</Label>
              <Input
                id="chapter-count"
                type="number"
                min={1}
                max={14}
                value={chapterCount}
                onChange={(event) => {
                  const nextCount = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(nextCount)) {
                    setChapterCount(6);
                    return;
                  }
                  setChapterCount(Math.min(14, Math.max(1, nextCount)));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value) =>
                  setVisibility(value as typeof visibility)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(role === Role.RECRUITER || role === Role.COLLEGE) &&
            workspaceOptions.length > 0 ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>Workspace</Label>
                <Select value={workspaceId} onValueChange={setWorkspaceId}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        role === Role.RECRUITER
                          ? "Select company workspace"
                          : "Select college workspace"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaceOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name ?? option.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="job-description-context">
                Job Perspective / Job Description Context
              </Label>
              <Textarea
                id="job-description-context"
                value={jobDescriptionContext}
                onChange={(event) =>
                  setJobDescriptionContext(event.target.value)
                }
                className="min-h-24"
                placeholder="Paste role expectations, responsibilities, required skills, or any contextual constraints."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="chapter-titles">
                Preferred Chapter Titles (one per line)
              </Label>
              <Textarea
                id="chapter-titles"
                value={chapterTitles}
                onChange={(event) => setChapterTitles(event.target.value)}
                className="min-h-24"
                placeholder={
                  "System Design Fundamentals\nBackend Performance Patterns"
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="prompt-context">Additional AI Instructions</Label>
              <Textarea
                id="prompt-context"
                value={promptContext}
                onChange={(event) => setPromptContext(event.target.value)}
                className="min-h-24"
                placeholder={
                  generationMode === "learn"
                    ? "Ask for deeper treatment of theory, alternatives, architecture, formulas, or implementation details."
                    : "Ask for concise answer framing, common follow-ups, and answer patterns."
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCourse}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Course
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CourseGrid({
  courses,
  actionCourseId,
  emptyMessage,
  completionByCourse,
  onToggleVisibility,
  onRegenerate,
  onDelete,
}: {
  courses: TResourceCourse[];
  actionCourseId: string | null;
  emptyMessage: string;
  completionByCourse: Record<string, number>;
  onToggleVisibility: (course: TResourceCourse) => void;
  onRegenerate: (course: TResourceCourse) => void;
  onDelete: (course: TResourceCourse) => void;
}) {
  if (courses.length === 0) {
    return (
      <Card className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        {emptyMessage}
      </Card>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {courses.map((course) => {
        const completion = completionByCourse[course.id] ?? 0;
        return (
          <Card
            key={course.id}
            className="rounded-2xl border border-border bg-card dark:bg-[#111824] p-0"
          >
            <div className="space-y-2.5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Learning Resource
              </p>
              <h3 className="line-clamp-2 text-xl font-semibold leading-tight text-foreground">
                {course.title}
              </h3>
              <p className="line-clamp-2 text-sm leading-6 text-foreground">
                {course.description ||
                  "AI-generated learning material aligned to your role context."}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge className="border-0 bg-primary/15 text-xs text-primary hover:bg-primary/15">
                  {course.category}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {course.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {course.generationMode === "learn"
                    ? "Learn"
                    : "Interview Prep"}
                </Badge>
                {course.targetRoles.slice(0, 2).map((targetRole) => (
                  <Badge
                    key={targetRole}
                    variant="outline"
                    className="bg-muted/35 text-xs"
                  >
                    {targetRole}
                  </Badge>
                ))}
                {course.targetRoles.length > 2 ? (
                  <Badge variant="outline" className="bg-muted/35 text-xs">
                    +{course.targetRoles.length - 2}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="space-y-2.5 border-t border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Progress
                  value={completion}
                  className="h-2 bg-muted [&_[data-slot=progress-indicator]]:bg-[#2de48a]"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {completion}%
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  {course.chapters.length} chapters
                </div>
                <Badge
                  className={cn(
                    "border-0",
                    course.visibility === "public"
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      : "bg-muted text-foreground hover:bg-muted",
                  )}
                >
                  {course.visibility === "public" ? (
                    <Globe2 className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 mr-1" />
                  )}
                  {course.visibility.charAt(0).toUpperCase() +
                    course.visibility.slice(1)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-9 min-w-32 border-border bg-card"
                >
                  <Link href={`/resources/${course.id}`}>View Details</Link>
                </Button>

                {course.isOwner ? (
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleVisibility(course)}
                      disabled={actionCourseId === course.id}
                      title={
                        course.visibility === "public"
                          ? "Make private"
                          : "Share publicly"
                      }
                    >
                      {actionCourseId === course.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : course.visibility === "public" ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <Globe2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRegenerate(course)}
                      disabled={actionCourseId === course.id}
                      title="Regenerate course"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      onClick={() => onDelete(course)}
                      disabled={actionCourseId === course.id}
                      title="Delete course"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-xs text-white/80">{label}</p>
      <p className="text-xl font-semibold leading-tight text-white">{value}</p>
    </div>
  );
}

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-[#072748] text-white"
          : "bg-muted/40 text-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}



