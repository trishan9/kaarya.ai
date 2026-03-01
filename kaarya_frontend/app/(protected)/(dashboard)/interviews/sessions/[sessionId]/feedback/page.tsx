import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  RotateCcw,
  Target,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "../../../../_components/dashboard-header";
import { OverviewHeaderActions } from "../../../../overview/_components/overview-header-actions";
import { getInterviewSessionFeedback } from "@/lib/actions/interview-actions";
import type {
  TInterview,
  TInterviewEvaluation,
  TInterviewSession,
} from "@/lib/definitions";

type SessionFeedbackPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
  }>;
};

const resolveReturnTo = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  return trimmed;
};

const withReturnTo = (path: string, returnTo?: string | null) => {
  if (!returnTo) return path;
  return `${path}${path.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(returnTo)}`;
};

const toDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const extractPayload = (response: any) =>
  (response?.data as
    | {
        interview: TInterview;
        session: TInterviewSession;
        evaluation: TInterviewEvaluation;
      }
    | undefined) ?? null;

const clampScore = (value: number) =>
  Math.min(100, Math.max(0, Math.round(value)));

const getPerformanceBand = (score: number) => {
  if (score >= 85) {
    return {
      label: "Excellent",
      note: "Strong readiness for real interviews.",
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
      barClass: "bg-emerald-500",
    };
  }
  if (score >= 70) {
    return {
      label: "Good",
      note: "Solid baseline with a few areas to sharpen.",
      badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
      barClass: "bg-sky-500",
    };
  }
  if (score >= 55) {
    return {
      label: "Developing",
      note: "Improving, but key gaps are still visible.",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
      barClass: "bg-amber-500",
    };
  }

  return {
    label: "Needs Work",
    note: "Focus on fundamentals before advanced rounds.",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    barClass: "bg-rose-500",
  };
};

const getScoreAccent = (score: number) => {
  if (score >= 85) return "#34d399";
  if (score >= 70) return "#38bdf8";
  if (score >= 55) return "#f59e0b";
  return "#fb7185";
};

const getLevelBenchmark = (level?: string | null) => {
  const normalized = (level ?? "").trim().toLowerCase();
  if (!normalized) {
    return { label: "General", min: 60, max: 80 };
  }
  if (
    normalized.includes("intern") ||
    normalized.includes("entry") ||
    normalized.includes("fresher") ||
    normalized.includes("junior")
  ) {
    return { label: "Intern/Entry", min: 55, max: 72 };
  }
  if (
    normalized.includes("senior") ||
    normalized.includes("lead") ||
    normalized.includes("staff") ||
    normalized.includes("principal")
  ) {
    return { label: "Senior/Lead", min: 75, max: 90 };
  }
  return { label: "Mid-Level", min: 65, max: 82 };
};

const getScoreRangeMessage = (
  score: number,
  range: { min: number; max: number },
) => {
  if (score < range.min) {
    return "You are below the recommended range right now.";
  }
  if (score > range.max) {
    return "You are above the recommended range. Great job.";
  }
  return "You are within the recommended range.";
};

const formatMinutes = (seconds?: number | null) => {
  if (typeof seconds !== "number") return "-";
  const minutes = Math.max(0, Math.round(seconds / 60));
  return `${minutes} min`;
};

export default async function SessionFeedbackPage({
  params,
  searchParams,
}: SessionFeedbackPageProps) {
  const { sessionId } = await params;
  const query = await searchParams;
  const returnTo = resolveReturnTo(query?.returnTo);
  const feedbackResponse = await getInterviewSessionFeedback(sessionId);
  if (!feedbackResponse?.success) {
    notFound();
  }

  const payload = extractPayload(feedbackResponse);
  if (!payload?.interview || !payload?.session || !payload?.evaluation) {
    notFound();
  }

  const { interview, session, evaluation } = payload;
  const totalScore = clampScore(evaluation.totalScore);
  const performanceBand = getPerformanceBand(totalScore);
  const benchmark = getLevelBenchmark(interview.level);
  const userTurns =
    session.transcript?.filter((message) => message.role === "user").length ??
    0;
  const scoreRingAngle = totalScore * 3.6;
  const scoreAccent = getScoreAccent(totalScore);
  const rangeMessage = getScoreRangeMessage(totalScore, benchmark);

  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader
          title="Interview Feedback"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-4 px-3 pb-6 sm:space-y-5 sm:px-4 sm:pb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              asChild
              variant="outline"
              className="h-9 w-full rounded-lg sm:w-auto"
            >
              <Link href={returnTo ?? `/interviews/${interview.id}`}>
                <ArrowLeft className="h-4 w-4" />
                {returnTo ? "Back" : "Back to Interview"}
              </Link>
            </Button>
            <Button asChild className="h-9 w-full rounded-lg sm:w-auto">
              <Link
                href={withReturnTo(
                  `/interviews/${interview.id}/take`,
                  returnTo,
                )}
              >
                <RotateCcw className="h-4 w-4" />
                Retake Interview
              </Link>
            </Button>
          </div>

          <section className="rounded-3xl bg-gradient-to-br from-[#0d6fae] to-[#084f7f] p-4 text-white shadow-[0_10px_35px_rgba(8,79,127,0.35)] sm:p-4 lg:p-5">
            <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(190px,220px)]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-card/15 text-white hover:bg-accent/15">
                    AI Interview Report
                  </Badge>
                  <Badge className="border-0 bg-card/15 text-white hover:bg-accent/15">
                    {benchmark.label} level
                  </Badge>
                </div>

                <h2 className="mt-2 text-xl font-semibold leading-tight sm:text-2xl">
                  {interview.title}
                </h2>
                <p className="mt-1 text-sm text-white/90">
                  Level target: {interview.level || "Not specified"} | Completed{" "}
                  {toDateTime(session.endedAt || evaluation.createdAt)}
                </p>
                <p className="mt-2 text-sm text-white/90">
                  {performanceBand.note} {rangeMessage}
                </p>
              </div>

              <div className="h-fit rounded-2xl border border-white/20 bg-[#0b5e93]/40 p-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-white/80">
                  Overall Score
                </p>
                <div className="mt-2 flex items-center justify-center">
                  <div
                    className="relative flex h-24 w-24 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${scoreAccent} ${scoreRingAngle}deg, rgba(255,255,255,0.18) 0deg)`,
                    }}
                  >
                    <div className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full border border-white/10 bg-[#0a4f7d]">
                      <span className="text-xl font-semibold">
                        {totalScore}
                      </span>
                      <span className="text-[11px] text-white/85">of 100</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-center">
                  <Badge className={performanceBand.badgeClass}>
                    {performanceBand.label}
                  </Badge>
                </div>
                <div className="mt-2 rounded-lg border border-white/15 bg-card/10 px-2 py-1.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-white/70">
                    Recommended score
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {benchmark.min}-{benchmark.max}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <MetricPill
                icon={<Target className="h-3.5 w-3.5" />}
                label="Recommended"
                value={`${benchmark.min}-${benchmark.max}`}
              />
              <MetricPill
                icon={<BarChart3 className="h-3.5 w-3.5" />}
                label="Skills Rated"
                value={`${evaluation.categoryScores?.length ?? 0}`}
              />
              <MetricPill
                icon={<UserRound className="h-3.5 w-3.5" />}
                label="Your Answers"
                value={`${userTurns}`}
              />
              <MetricPill
                icon={<CalendarClock className="h-3.5 w-3.5" />}
                label="Duration"
                value={formatMinutes(session.durationSeconds)}
              />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Competency Radar
                </h3>
                <Badge variant="outline">Category Distribution</Badge>
              </div>
              <div className="mt-4 overflow-x-auto">
                <div className="mx-auto w-[340px] sm:w-[420px]">
                  <RadarChart categories={evaluation.categoryScores ?? []} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Level Benchmark
                </h3>
                <Badge variant="outline">{benchmark.label}</Badge>
              </div>

              <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Benchmark Range
                </p>
                <div className="h-3 rounded-full bg-[#e3edf8]">
                  <div
                    className="h-3 rounded-full bg-[#0d6fae]/35"
                    style={{
                      marginLeft: `${benchmark.min}%`,
                      width: `${Math.max(0, benchmark.max - benchmark.min)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{benchmark.min}</span>
                  <span>{benchmark.max}</span>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">
                    Your Score: {totalScore}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rangeMessage}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Final Assessment
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {evaluation.finalAssessment || "No assessment generated."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                Detailed Category Analysis
              </h3>
              <Badge variant="outline">Evidence-Based Scores</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {evaluation.categoryScores?.length ? (
                evaluation.categoryScores.map((category) => {
                  const score = clampScore(category.score);
                  return (
                    <div
                      key={`${category.name}-${category.score}`}
                      className="rounded-xl border border-border bg-muted/30 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {category.name}
                        </p>
                        <Badge variant="outline">{score}/100</Badge>
                      </div>
                      <div className="mt-2 h-2.5 w-full rounded-full bg-[#e8edf3]">
                        <div
                          className={`h-2.5 rounded-full ${performanceBand.barClass}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {category.comment}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No category scores available.
                </p>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-lg font-semibold text-foreground">
                  Strengths
                </h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {evaluation.strengths?.length ? (
                  evaluation.strengths.map((strength) => (
                    <li
                      key={strength}
                      className="rounded-lg bg-[#f3fbf5] px-3 py-2"
                    >
                      {strength}
                    </li>
                  ))
                ) : (
                  <li>No strengths listed.</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-amber-600" />
                <h3 className="text-lg font-semibold text-foreground">
                  Areas for Improvement
                </h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {evaluation.areasForImprovement?.length ? (
                  evaluation.areasForImprovement.map((area) => (
                    <li
                      key={area}
                      className="rounded-lg bg-[#fff7f2] px-3 py-2"
                    >
                      {area}
                    </li>
                  ))
                ) : (
                  <li>No areas listed.</li>
                )}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/20 bg-card/10 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-white/85">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold leading-tight text-white">
        {value}
      </p>
    </div>
  );
}

function RadarChart({
  categories,
}: {
  categories: Array<{
    name: string;
    score: number;
  }>;
}) {
  const rows = categories.slice(0, 6).map((item) => ({
    name: item.name,
    score: clampScore(item.score),
  }));

  if (!rows.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
        No data for chart.
      </div>
    );
  }

  const size = 420;
  const center = size / 2;
  const radius = 118;
  const steps = 5;
  const pointFor = (index: number, value: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const distance = (radius * value) / 100;
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    };
  };

  const labelPointFor = (index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const distance = radius + 32;
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    };
  };

  const polygonPoints = rows
    .map((row, index) => {
      const point = pointFor(index, row.score, rows.length);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full">
      {Array.from({ length: steps }).map((_, index) => {
        const value = ((index + 1) / steps) * 100;
        const ringPoints = rows
          .map((__, ringIndex) => {
            const point = pointFor(ringIndex, value, rows.length);
            return `${point.x},${point.y}`;
          })
          .join(" ");
        return (
          <polygon
            key={`ring-${value}`}
            points={ringPoints}
            fill="none"
            stroke="#d7e3f2"
            strokeWidth={1}
          />
        );
      })}

      {rows.map((_, index) => {
        const outerPoint = pointFor(index, 100, rows.length);
        return (
          <line
            key={`axis-${index}`}
            x1={center}
            y1={center}
            x2={outerPoint.x}
            y2={outerPoint.y}
            stroke="#d7e3f2"
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={polygonPoints}
        fill="rgba(13, 111, 174, 0.2)"
        stroke="#0d6fae"
        strokeWidth={2}
      />

      {rows.map((row, index) => {
        const point = pointFor(index, row.score, rows.length);
        const labelPoint = labelPointFor(index, rows.length);
        return (
          <g key={`label-${row.name}`}>
            <circle cx={point.x} cy={point.y} r={4} fill="#0d6fae" />
            <text
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              fontSize="11"
              fill="#334155"
            >
              {row.name}
            </text>
            <text
              x={labelPoint.x}
              y={labelPoint.y + 13}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {row.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}


