"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createInterview as createInterviewAction } from "@/lib/actions/interview-actions";
import { Role } from "@/lib/definitions";

type WorkspaceOption = {
  id: string;
  name: string | null;
};

type CreateInterviewFormProps = {
  role?: Role | null;
  recruiterWorkspaces: WorkspaceOption[];
  collegeWorkspaces: WorkspaceOption[];
};

type VisibilityValue = "public" | "college_only" | "private";

const INTERVIEW_TYPES = [
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "mixed", label: "Mixed" },
  { value: "system_design", label: "System Design" },
  { value: "custom", label: "Custom" },
] as const;

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
] as const;

const initialVisibilityByRole = (role?: Role | null): VisibilityValue => {
  if (role === Role.COLLEGE) return "college_only";
  if (role === Role.RECRUITER) return "public";
  return "private";
};

const toErrorMessage = (value: unknown, fallback: string) => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (Array.isArray(record.message)) {
      return record.message.map((item) => String(item)).join(", ");
    }
    if (record.message) return toErrorMessage(record.message, fallback);
    if (typeof record.error === "string") return record.error;
    if (record.error) return toErrorMessage(record.error, fallback);
    if (Array.isArray(record.errors)) {
      return record.errors.map((item) => String(item)).join(", ");
    }

    try {
      return JSON.stringify(record);
    } catch {
      return fallback;
    }
  }

  return fallback;
};

const resolveInterviewId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  const directId =
    typeof record.id === "string" && record.id.trim()
      ? record.id.trim()
      : typeof record._id === "string" && record._id.trim()
        ? record._id.trim()
        : null;
  if (directId) return directId;

  if (record.data && typeof record.data === "object") {
    const nestedId = resolveInterviewId(record.data);
    if (nestedId) return nestedId;
  }

  if (record.interview && typeof record.interview === "object") {
    const nestedId = resolveInterviewId(record.interview);
    if (nestedId) return nestedId;
  }

  return null;
};

export function CreateInterviewForm({
  role,
  recruiterWorkspaces,
  collegeWorkspaces,
}: CreateInterviewFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [interviewType, setInterviewType] =
    useState<(typeof INTERVIEW_TYPES)[number]["value"]>("technical");
  const [targetRole, setTargetRole] = useState("");
  const [level, setLevel] = useState("");
  const [techStack, setTechStack] = useState("");
  const [questionCount, setQuestionCount] = useState(8);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [visibility, setVisibility] = useState<VisibilityValue>(
    initialVisibilityByRole(role),
  );
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]["value"]>("published");
  const [instructions, setInstructions] = useState("");
  const [generateQuestions, setGenerateQuestions] = useState(false);
  const [questionsText, setQuestionsText] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(() => {
    if (role === Role.RECRUITER) return recruiterWorkspaces[0]?.id ?? "";
    if (role === Role.COLLEGE) return collegeWorkspaces[0]?.id ?? "";
    return "";
  });

  const visibilityOptions = useMemo(() => {
    if (role === Role.COLLEGE) {
      return [
        { value: "college_only", label: "College Only" },
        { value: "public", label: "Public" },
        { value: "private", label: "Private" },
      ] as const;
    }
    return [
      { value: "private", label: "Private" },
      { value: "public", label: "Public" },
      { value: "college_only", label: "College Only" },
    ] as const;
  }, [role]);

  const workspaceOptions = role === Role.RECRUITER
    ? recruiterWorkspaces
    : role === Role.COLLEGE
      ? collegeWorkspaces
      : [];

  const workspaceLabel = role === Role.RECRUITER ? "Company Workspace" : "College Workspace";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 2) {
      setError("Interview title must be at least 2 characters long.");
      return;
    }

    if (!targetRole.trim() || targetRole.trim().length < 2) {
      setError("Role focus must be at least 2 characters long.");
      return;
    }

    if (questionCount < 1 || questionCount > 20) {
      setError("Question count must be between 1 and 20.");
      return;
    }

    if (durationMinutes < 5 || durationMinutes > 120) {
      setError("Duration must be between 5 and 120 minutes.");
      return;
    }

    if (
      (role === Role.RECRUITER || role === Role.COLLEGE) &&
      workspaceOptions.length === 0
    ) {
      setError(
        role === Role.RECRUITER
          ? "No company workspace found. Join or create a company workspace first."
          : "No college workspace found. Join or create a college workspace first.",
      );
      return;
    }

    if (
      (role === Role.RECRUITER || role === Role.COLLEGE) &&
      !selectedWorkspaceId
    ) {
      setError("Please select a workspace before creating the interview.");
      return;
    }

    const customQuestions = questionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!generateQuestions && customQuestions.length > 0) {
      const invalidQuestion = customQuestions.find((question) => question.length < 8);
      if (invalidQuestion) {
        setError("Each custom question must be at least 8 characters.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const data = await createInterviewAction({
        title: title.trim(),
        description: description || undefined,
        interviewType,
        role: targetRole.trim(),
        level: level || undefined,
        techStack: techStack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        questionCount,
        durationMinutes,
        visibility,
        status,
        instructions: instructions || undefined,
        generateQuestions,
        questions: customQuestions.length > 0 ? customQuestions : undefined,
        ...(role === Role.RECRUITER ? { companyId: selectedWorkspaceId || undefined } : {}),
        ...(role === Role.COLLEGE ? { collegeId: selectedWorkspaceId || undefined } : {}),
      });

      if (!data?.success) {
        setError(
          toErrorMessage(
            data?.message ?? data?.errors ?? data,
            "Failed to create interview",
          ),
        );
        toast.error(
          toErrorMessage(
            data?.message ?? data?.errors ?? data,
            "Failed to create interview",
          ),
        );
        return;
      }

      const interviewId = resolveInterviewId(data);
      if (!interviewId) {
        setError("Interview created but id is missing.");
        toast.success("Interview created successfully.");
        router.push("/interviews");
        router.refresh();
        return;
      }

      toast.success("Interview created successfully.");
      router.push(`/interviews/${interviewId}`);
      router.refresh();
    } catch (caughtError) {
      const message = toErrorMessage(
        caughtError,
        "Something went wrong while creating interview.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-[#e5e9f0] bg-white p-4 sm:p-6"
    >
      <div className="rounded-xl border border-[#d9e5f2] bg-[#f7fbff] px-3 py-3 sm:px-4">
        <p className="text-sm font-semibold text-[#0d6fae]">Manual Interview Setup</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use manual mode when voice workflow is unavailable or when precise field
          control is required.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-[#ececf0] bg-[#fafbfd] p-3 sm:p-4">
        <p className="text-sm font-semibold text-foreground">Interview Basics</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="interview-title">Interview title</Label>
            <Input
              id="interview-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Frontend Engineering Mock Interview"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-role">Role focus</Label>
            <Input
              id="target-role"
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              placeholder="Frontend Engineer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience-level">Experience level</Label>
            <Input
              id="experience-level"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              placeholder="Junior, Mid, Senior"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interview-type">Interview type</Label>
            <Select
              value={interviewType}
              onValueChange={(value) =>
                setInterviewType(value as (typeof INTERVIEW_TYPES)[number]["value"])
              }
            >
              <SelectTrigger id="interview-type" className="w-full">
                <SelectValue placeholder="Select interview type" />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tech-stack">Tech stack (comma separated)</Label>
            <Input
              id="tech-stack"
              value={techStack}
              onChange={(event) => setTechStack(event.target.value)}
              placeholder="React, TypeScript, Next.js"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-count">Questions</Label>
            <Input
              id="question-count"
              type="number"
              min={1}
              max={20}
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              max={120}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              required
            />
          </div>

          {workspaceOptions.length > 0 ? (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="workspace">{workspaceLabel}</Label>
              <Select
                value={selectedWorkspaceId}
                onValueChange={(value) => setSelectedWorkspaceId(value)}
              >
                <SelectTrigger id="workspace" className="w-full">
                  <SelectValue placeholder={`Select ${workspaceLabel}`} />
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

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(value) => setVisibility(value as VisibilityValue)}
            >
              <SelectTrigger id="visibility" className="w-full">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as (typeof STATUS_OPTIONS)[number]["value"])
              }
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-[#ececf0] bg-[#fafbfd] p-3 sm:p-4">
        <p className="text-sm font-semibold text-foreground">Interview Guidance</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what this interview should focus on."
              className="min-h-24"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="instructions">AI Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Optional guidance for question generation and interview style."
              className="min-h-24"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-[#ececf0] bg-[#fafbfd] p-3 sm:p-4">
        <p className="text-sm font-semibold text-foreground">Question Strategy</p>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={generateQuestions}
            onChange={(event) => setGenerateQuestions(event.target.checked)}
            className="h-4 w-4 rounded border border-input"
          />
          Generate and save a fixed question bank now (optional)
        </label>
        <p className="text-xs text-muted-foreground">
          Leave unchecked to keep session questions fully dynamic from interview context.
        </p>

        {!generateQuestions ? (
          <div className="space-y-2">
            <Label htmlFor="custom-questions">
              Optional custom questions (one per line)
            </Label>
            <Textarea
              id="custom-questions"
              value={questionsText}
              onChange={(event) => setQuestionsText(event.target.value)}
              placeholder={"Tell me about yourself.\nHow would you optimize a React app?\nDescribe a challenging project you led."}
              className="min-h-36"
            />
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Interview"
          )}
        </Button>
      </div>
    </form>
  );
}
