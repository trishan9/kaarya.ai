"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  FileUp,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResumeUploadDropzone } from "./resume-upload-dropzone";
import { atsScanResume, type AtsScanCategory, type AtsScanResult } from "@/lib/actions/resume-builder-actions";
import { deleteMyResume, getMyResumes } from "@/lib/actions/job-actions";
import { cn } from "@/lib/utils";

type AtsHistoryItem = {
  id: string;
  fileName: string;
  createdAt?: string;
  atsScore: number | null;
  report: AtsScanResult | null;
  previewUrl?: string | null;
  downloadUrl?: string | null;
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreTone(score: number) {
  if (score >= 75) {
    return {
      badge: "bg-emerald-100 text-emerald-800",
      text: "text-emerald-800",
      accent: "#10b981",
    };
  }
  if (score >= 55) {
    return {
      badge: "bg-amber-100 text-amber-800",
      text: "text-amber-800",
      accent: "#f59e0b",
    };
  }
  return {
    badge: "bg-rose-100 text-rose-800",
    text: "text-rose-800",
    accent: "#f43f5e",
  };
}

function scoreFill(score: number) {
  if (score >= 75) return "#10b981";
  if (score >= 55) return "#f59e0b";
  return "#f43f5e";
}

function shortCategoryLabel(title: string) {
  switch (title) {
    case "ATS suitability":
      return "ATS";
    case "Tone & style":
      return "Tone";
    case "Content quality":
      return "Content";
    case "Skills relevance":
      return "Skills";
    default:
      return title;
  }
}

function formatResumeDate(value?: string) {
  if (!value) return "Recently scanned";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently scanned";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function parseAtsReport(value: unknown): AtsScanResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const direct = value as Record<string, unknown>;
  const nestedCandidate = direct.atsScan ?? direct.report ?? value;
  if (!nestedCandidate || typeof nestedCandidate !== "object") {
    return null;
  }

  const report = nestedCandidate as Record<string, unknown>;
  const ats = report.ATS as { score?: unknown } | undefined;
  if (typeof report.overallScore !== "number") return null;
  if (!ats || typeof ats.score !== "number") return null;

  return nestedCandidate as AtsScanResult;
}

function listCategoryModels(result: AtsScanResult | null) {
  if (!result) return [];
  const categories: Array<{ key: string; title: string; data?: AtsScanCategory }> = [
    { key: "ATS", title: "ATS suitability", data: result.ATS },
    { key: "toneAndStyle", title: "Tone & style", data: result.toneAndStyle },
    { key: "content", title: "Content quality", data: result.content },
    { key: "structure", title: "Structure", data: result.structure },
    { key: "skills", title: "Skills relevance", data: result.skills },
  ];
  return categories.filter((entry) => Boolean(entry.data));
}

export function AtsScannerTab() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<AtsScanResult | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<AtsHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AtsHistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await getMyResumes({ page: 1, size: 100 });
      const rawResumes = Array.isArray(response?.data?.resumes)
        ? response.data.resumes
        : [];
      const mapped = rawResumes
        .map((resume: any) => {
          const id =
            typeof resume?.id === "string"
              ? resume.id
              : typeof resume?._id === "string"
                ? resume._id
                : null;
          if (!id) return null;

          const report =
            parseAtsReport(resume?.atsReport) ?? parseAtsReport(resume?.aiEvaluation);
          const scoreFromApi =
            typeof resume?.atsScore === "number" && Number.isFinite(resume.atsScore)
              ? clampScore(resume.atsScore)
              : null;
          const atsScore =
            scoreFromApi ??
            (report && Number.isFinite(report.overallScore)
              ? clampScore(report.overallScore)
              : null);

          if (!report && atsScore === null) {
            return null;
          }

          return {
            id,
            fileName:
              typeof resume?.fileName === "string" && resume.fileName.trim().length > 0
                ? resume.fileName.trim()
                : "resume.pdf",
            createdAt:
              typeof resume?.createdAt === "string" ? resume.createdAt : undefined,
            atsScore,
            report,
            previewUrl:
              typeof resume?.previewUrl === "string" ? resume.previewUrl : null,
            downloadUrl:
              typeof resume?.downloadUrl === "string" ? resume.downloadUrl : null,
          } satisfies AtsHistoryItem;
        })
        .filter(Boolean) as AtsHistoryItem[];

      setScanHistory(mapped);
    } catch {
      toast.error("Unable to load your ATS scan history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const selectedHistoryItem = useMemo(
    () => scanHistory.find((item) => item.id === selectedHistoryId) ?? null,
    [scanHistory, selectedHistoryId],
  );

  const activeReport = selectedHistoryId
    ? (selectedHistoryItem?.report ?? null)
    : result;
  const categories = useMemo(() => listCategoryModels(activeReport), [activeReport]);
  const categoryChartData = useMemo(
    () =>
      categories.map((category) => {
        const score = clampScore(category.data?.score ?? 0);
        return {
          name: category.title,
          shortName: shortCategoryLabel(category.title),
          score,
          fill: scoreFill(score),
        };
      }),
    [categories],
  );

  const tipsMix = useMemo(() => {
    const baseline = { good: 0, improve: 0 };
    categories.forEach((category) => {
      (category.data?.tips ?? []).forEach((tip) => {
        if (tip.type === "good") baseline.good += 1;
        if (tip.type === "improve") baseline.improve += 1;
      });
    });
    return [
      { name: "Strengths", value: baseline.good, fill: "#10b981" },
      { name: "Improvements", value: baseline.improve, fill: "#f59e0b" },
    ];
  }, [categories]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resumeFile) {
      setError("Please upload your resume PDF.");
      return;
    }

    setError(null);
    setSelectedHistoryId(null);
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      if (targetRole.trim()) formData.append("targetRole", targetRole.trim());
      if (experienceLevel.trim()) {
        formData.append("experienceLevel", experienceLevel.trim());
      }
      if (jobDescription.trim()) {
        formData.append("jobDescription", jobDescription.trim());
      }

      const data = await atsScanResume(formData);
      setResult(data);
      toast.success("ATS scan completed and saved to your resume library.");
      await loadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : "ATS scan failed.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteScanReport = useCallback(async () => {
    if (!deleteTarget) return;
    setDeletingReportId(deleteTarget.id);
    try {
      const response = await deleteMyResume(deleteTarget.id);
      if (!response?.success) {
        toast.error(response?.message || "Failed to delete scanned report.");
        return;
      }

      setScanHistory((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      if (selectedHistoryId === deleteTarget.id) {
        setSelectedHistoryId(null);
        setResult(null);
      }
      toast.success(response?.message || "Scanned report deleted.");
      setDeleteTarget(null);
    } finally {
      setDeletingReportId(null);
    }
  }, [deleteTarget, selectedHistoryId]);

  const overallScore = clampScore(activeReport?.overallScore ?? 0);
  const overallTone = scoreTone(overallScore);
  const strengthsCount = tipsMix.find((entry) => entry.name === "Strengths")?.value ?? 0;
  const improvementsCount =
    tipsMix.find((entry) => entry.name === "Improvements")?.value ?? 0;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Scan a resume, save a persistent ATS report, and reuse the scanned file directly
        while applying for jobs.
      </p>

      <div className="space-y-5">
        <Card className="rounded-xl border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Scanned Resumes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="ats-history-select">View saved report</Label>
                <Select
                  value={selectedHistoryId ?? undefined}
                  onValueChange={(value) => {
                    setSelectedHistoryId(value);
                    setError(null);
                  }}
                  disabled={historyLoading || scanHistory.length === 0}
                >
                  <SelectTrigger id="ats-history-select">
                    <SelectValue
                      placeholder={
                        historyLoading
                          ? "Loading scanned resumes..."
                          : "Select a scanned resume to view report"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {scanHistory.map((item) => {
                      const score =
                        item.atsScore ??
                        (item.report ? clampScore(item.report.overallScore) : null);
                      const label = `${item.fileName} | ${formatResumeDate(item.createdAt)}${
                        typeof score === "number" ? ` | ATS ${score}` : ""
                      }`;
                      return (
                        <SelectItem key={item.id} value={item.id}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedHistoryId(null)}
                  disabled={!selectedHistoryId}
                >
                  View latest scan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void loadHistory()}
                  disabled={historyLoading}
                  aria-label="Refresh scanned resumes"
                >
                  {historyLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {selectedHistoryItem ? (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                <span className="font-medium text-slate-700">{selectedHistoryItem.fileName}</span>
                <span className="text-muted-foreground">{formatResumeDate(selectedHistoryItem.createdAt)}</span>
                {typeof selectedHistoryItem.atsScore === "number" ? (
                  <Badge className="rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    ATS {selectedHistoryItem.atsScore}
                  </Badge>
                ) : null}
                {selectedHistoryItem.downloadUrl ? (
                  <a
                    href={selectedHistoryItem.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600 hover:bg-slate-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </a>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                  onClick={() => setDeleteTarget(selectedHistoryItem)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            ) : null}
            {!historyLoading && scanHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No ATS scans yet. Run your first scan to save and view reports here.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card className="rounded-xl border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resume Scan Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResumeUploadDropzone
                label="Resume PDF"
                required
                helperText="Support file:"
                acceptedFileLabel="PDF"
                browseLabel="Choose file"
                maxFileSizeMb={10}
                acceptedMimeTypes={["application/pdf"]}
                onFileChange={setResumeFile}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="ats-target-role">Target role (optional)</Label>
                  <Input
                    id="ats-target-role"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ats-level">Experience level (optional)</Label>
                  <Input
                    id="ats-level"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    placeholder="e.g. Junior, Mid, Senior"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ats-jd">Job description (optional)</Label>
                <Textarea
                  id="ats-jd"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description for targeted keyword and relevance checks..."
                  rows={6}
                  className="mt-1 resize-none"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4" />
                )}
                Scan and save report
              </Button>
            </CardContent>
          </Card>
        </form>

        <div className="space-y-5">
          {error ? (
            <Card className="rounded-xl border-rose-200 bg-rose-50">
              <CardContent className="flex items-center gap-2 py-4">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <p className="text-sm text-rose-800">{error}</p>
              </CardContent>
            </Card>
          ) : null}

          {activeReport ? (
            <>
              <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="border-b bg-linear-to-r from-slate-50 via-white to-cyan-50">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-lg">
                    <span className="flex items-center gap-2 text-slate-900">
                      <Sparkles className="h-5 w-5 text-cyan-600" />
                      ATS Report
                    </span>
                    <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", overallTone.badge)}>
                      Overall {overallScore}/100
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <p className={cn("text-sm", overallTone.text)}>
                    {overallScore >= 75
                      ? "Strong ATS readiness. This resume is aligned for parsing, relevance, and recruiter readability."
                      : overallScore >= 55
                        ? "Solid baseline. Improve keyword precision and impact statements to increase ranking consistency."
                        : "ATS risk is high. Focus on structure, keyword match, and quantified achievements before applying."}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[11px] text-muted-foreground">Overall score</p>
                      <p className="text-lg font-semibold text-slate-900">{overallScore}/100</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[11px] text-muted-foreground">Strengths</p>
                      <p className="text-lg font-semibold text-emerald-700">{strengthsCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[11px] text-muted-foreground">Improvements</p>
                      <p className="text-lg font-semibold text-amber-700">{improvementsCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid items-start gap-4 xl:grid-cols-2">
                <Card className="rounded-xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Overall Readiness</CardTitle>
                  </CardHeader>
                  <CardContent className="grid items-center gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="relative mx-auto w-full max-w-[220px]">
                      <ChartContainer
                        config={{
                          score: {
                            label: "Score",
                            color: overallTone.accent,
                          },
                        }}
                        className="h-[220px] w-full aspect-auto"
                      >
                        <RadialBarChart
                          data={[{ name: "score", value: overallScore }]}
                          startAngle={90}
                          endAngle={-270}
                          innerRadius="72%"
                          outerRadius="100%"
                        >
                          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                          <RadialBar
                            dataKey="value"
                            cornerRadius={20}
                            fill="var(--color-score)"
                            background={{ fill: "#e2e8f0" }}
                          />
                        </RadialBarChart>
                      </ChartContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-3xl font-semibold text-slate-900">{overallScore}</p>
                        <p className="text-xs text-muted-foreground">out of 100</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Feedback Summary
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <p className="text-[11px] text-emerald-700">Strengths</p>
                          <p className="text-xl font-semibold text-emerald-800">{strengthsCount}</p>
                        </div>
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                          <p className="text-[11px] text-amber-700">Improvements</p>
                          <p className="text-xl font-semibold text-amber-800">{improvementsCount}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ChartContainer
                      config={{
                        score: {
                          label: "Score",
                          color: "#0ea5e9",
                        },
                      }}
                      className="h-[250px] w-full aspect-auto"
                    >
                      <BarChart
                        layout="vertical"
                        data={categoryChartData}
                        margin={{ top: 4, right: 18, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.18} />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          type="category"
                          dataKey="shortName"
                          tickLine={false}
                          axisLine={false}
                          width={86}
                        />
                        <ReferenceLine x={75} stroke="#94a3b8" strokeDasharray="4 4" />
                        <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                        <Bar dataKey="score" radius={[0, 8, 8, 0]} maxBarSize={26}>
                          <LabelList
                            dataKey="score"
                            position="right"
                            offset={8}
                            formatter={(value: number) => `${value}/100`}
                            className="fill-slate-700 text-[11px] font-medium"
                          />
                          {categoryChartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {categories.map((category) => {
                  const score = clampScore(category.data?.score ?? 0);
                  const tone = scoreTone(score);
                  const accentClass =
                    score >= 75
                      ? "border-l-4 border-l-emerald-400"
                      : score >= 55
                        ? "border-l-4 border-l-amber-400"
                        : "border-l-4 border-l-rose-400";

                  return (
                    <Card
                      key={category.key}
                      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", accentClass)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>{category.title}</span>
                          <Badge className={cn("rounded-full", tone.badge)}>{score}/100</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {(category.data?.tips ?? []).map((tip, index) => (
                            <li key={`${category.key}-${index}`} className="flex items-start gap-2 text-sm">
                              {tip.type === "good" ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              ) : (
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                              )}
                              <span className="text-slate-800">
                                {tip.tip}
                                {tip.explanation ? (
                                  <span className="mt-0.5 block text-muted-foreground">
                                    {tip.explanation}
                                  </span>
                                ) : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card className="rounded-xl border-dashed shadow-sm">
              <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3 py-10 text-center">
                <FileText className="h-8 w-8 text-slate-400" />
                <p className="font-medium text-slate-700">No ATS report selected</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Run a new scan or pick a resume from your saved scan history to view a full ATS report with charts and actionable recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(value) => {
          if (!value && !deletingReportId) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this scanned report?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.fileName || "selected scanned resume"}
              </span>{" "}
              from your ATS scan history. If already used in a submitted application, deletion may be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingReportId)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteScanReport()}
              disabled={Boolean(deletingReportId)}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {deletingReportId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete report"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
