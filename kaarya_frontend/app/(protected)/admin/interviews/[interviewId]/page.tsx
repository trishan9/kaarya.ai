import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "../../../(dashboard)/_components/dashboard-header";
import { getInterviewAnalytics, getInterviewById } from "@/lib/actions/interview-actions";
import type { TInterview } from "@/lib/definitions";

type AdminInterviewDetailsPageProps = {
  params: Promise<{
    interviewId: string;
  }>;
};

type AnalyticsSummary = {
  totalSessions?: number;
  uniqueParticipants?: number;
  completionRate?: number;
  averageScore?: number;
  highestScore?: number;
};

const typeLabelByValue: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  mixed: "Mixed",
  system_design: "System Design",
  custom: "Custom",
};

const visibilityLabelByValue: Record<string, string> = {
  public: "Public",
  private: "Private",
  college_only: "College Only",
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

const metricValue = (value: number | string | undefined, suffix = "") => {
  if (typeof value === "number") return `${value}${suffix}`;
  if (typeof value === "string" && value.trim().length > 0) return `${value}${suffix}`;
  return "-";
};

export default async function AdminInterviewDetailsPage({
  params,
}: AdminInterviewDetailsPageProps) {
  const { interviewId } = await params;
  const [interviewResponse, analyticsResponse] = await Promise.all([
    getInterviewById(interviewId),
    getInterviewAnalytics(interviewId, { page: 1, size: 20 }),
  ]);

  if (!interviewResponse?.success || !interviewResponse?.data) {
    notFound();
  }

  const interview = interviewResponse.data as TInterview;
  const analytics = analyticsResponse?.success ? analyticsResponse.data : null;
  const summary = (analytics?.summary ?? {}) as AnalyticsSummary;
  const recentSessions = Array.isArray(analytics?.recentSessions)
    ? analytics.recentSessions
    : [];

  return (
    <>
      <DashboardHeader
        title="Interview Details"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="h-9 rounded-lg text-xs font-semibold">
              <Link href="/admin/interviews">Back to Interviews</Link>
            </Button>
            <Button asChild className="h-9 rounded-lg text-xs font-semibold">
              <Link href="/admin/interviews/create">Create Interview</Link>
            </Button>
          </div>
        }
      />

      <section className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
        <Card className="gap-4 rounded-2xl border border-[#ececf0] p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {typeLabelByValue[interview.interviewType] ?? interview.interviewType}
            </Badge>
            <Badge variant="outline">
              {visibilityLabelByValue[interview.visibility] ?? interview.visibility}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {interview.status}
            </Badge>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">{interview.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {interview.description || "No description provided."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Role Focus" value={interview.role} />
            <MetricCard label="Question Count" value={String(interview.questionCount)} />
            <MetricCard label="Duration" value={`${interview.durationMinutes} min`} />
            <MetricCard label="Created" value={toDateTime(interview.createdAt)} />
          </div>

          {interview.techStack?.length ? (
            <div className="flex flex-wrap gap-2">
              {interview.techStack.map((skill) => (
                <Badge key={skill} variant="outline" className="rounded-md">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="gap-4 rounded-2xl border border-[#ececf0] p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">System Analytics</h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Total Sessions"
              value={metricValue(summary.totalSessions ?? interview.attemptsCount)}
            />
            <MetricCard
              label="Participants"
              value={metricValue(summary.uniqueParticipants)}
            />
            <MetricCard
              label="Completion Rate"
              value={metricValue(summary.completionRate, "%")}
            />
            <MetricCard
              label="Average Score"
              value={metricValue(summary.averageScore, "/100")}
            />
            <MetricCard
              label="Highest Score"
              value={metricValue(summary.highestScore, "/100")}
            />
          </div>

          <div className="rounded-xl border border-[#ececf0]">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-semibold text-foreground">Recent Sessions</p>
            </div>

            {recentSessions.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                No sessions recorded for this interview yet.
              </p>
            ) : (
              <div className="space-y-2 p-3">
                {recentSessions.map((session: any, index: number) => {
                  const candidate = session?.candidate ?? {};
                  const candidateName =
                    (typeof candidate?.name === "string" && candidate.name) ||
                    (typeof session?.candidateName === "string" && session.candidateName) ||
                    "Candidate";
                  const candidateEmail =
                    (typeof candidate?.email === "string" && candidate.email) ||
                    (typeof session?.userId === "string" && session.userId) ||
                    "-";
                  const sessionStatus =
                    typeof session?.status === "string" ? session.status : "unknown";
                  const score = typeof session?.score === "number" ? session.score : null;
                  const sessionCreatedAt =
                    typeof session?.createdAt === "string" ? session.createdAt : null;

                  return (
                    <div
                      key={typeof session?.id === "string" ? session.id : `session-${index}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#ececf0] bg-neutral-50 p-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{candidateName}</p>
                        <p className="text-xs text-muted-foreground">{candidateEmail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {toDateTime(sessionCreatedAt)}
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {sessionStatus.replaceAll("_", " ")}
                        </Badge>
                        {score !== null ? (
                          <Badge variant="secondary">{score}/100</Badge>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </section>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#ececf0] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

