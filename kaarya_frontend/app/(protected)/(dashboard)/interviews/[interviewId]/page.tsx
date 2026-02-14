import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Clock3, FileText, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "../../_components/dashboard-header";
import { OverviewHeaderActions } from "../../overview/_components/overview-header-actions";
import { getCurrentUser } from "@/lib/dal";
import {
  getInterviewAnalytics,
  getInterviewById,
  listMyInterviewSessions,
} from "@/lib/actions/interview-actions";
import { Role, type TInterview, type TInterviewSession } from "@/lib/definitions";
import { DeleteInterviewButton } from "./_components/delete-interview-button";

type InterviewDetailsPageProps = {
  params: Promise<{
    interviewId: string;
  }>;
};

const extractInterview = (response: any) =>
  (response?.data as TInterview | undefined) ?? null;
const extractSessions = (response: any) =>
  (Array.isArray(response?.data?.sessions)
    ? response.data.sessions
    : []) as TInterviewSession[];

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

export default async function InterviewDetailsPage({
  params,
}: InterviewDetailsPageProps) {
  const { interviewId } = await params;
  const [interviewResponse, currentUser] = await Promise.all([
    getInterviewById(interviewId),
    getCurrentUser(),
  ]);

  if (!interviewResponse?.success) {
    notFound();
  }

  const interview = extractInterview(interviewResponse);
  if (!interview) {
    notFound();
  }

  const canTakeInterview =
    currentUser?.role === Role.USER || currentUser?.role === Role.STUDENT;
  const canDeleteInterview = currentUser?.id === interview.createdBy;

  const [sessionsResponse, analyticsResponse] = await Promise.all([
    canTakeInterview
      ? listMyInterviewSessions(interviewId, { page: 1, size: 20 })
      : Promise.resolve({ success: true, data: { sessions: [] } }),
    getInterviewAnalytics(interviewId, { page: 1, size: 6 }),
  ]);
  const sessions = extractSessions(sessionsResponse);
  const analytics = analyticsResponse?.success ? analyticsResponse.data : null;

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader
          title="Interview Details"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-4 px-3 pb-6 sm:space-y-5 sm:px-4 sm:pb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="outline" className="h-9 w-full rounded-lg sm:w-auto">
              <Link href="/interviews">
                <ArrowLeft className="h-4 w-4" />
                Back to My Interviews
              </Link>
            </Button>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {canTakeInterview ? (
                <>
                  <Button asChild className="h-9 w-full rounded-lg sm:w-auto">
                    <Link href={`/interviews/${interview.id}/take`}>
                      <Mic className="h-4 w-4" />
                      Take Interview
                    </Link>
                  </Button>
                  {interview.myLatestSessionId ? (
                    <Button
                      asChild
                      variant="outline"
                      className="h-9 w-full rounded-lg sm:w-auto"
                    >
                      <Link
                        href={`/interviews/sessions/${interview.myLatestSessionId}/feedback`}
                      >
                        View Latest Feedback
                      </Link>
                    </Button>
                  ) : null}
                </>
              ) : null}
              {canDeleteInterview ? <DeleteInterviewButton interviewId={interview.id} /> : null}
            </div>
          </div>

          <section className="rounded-2xl border border-[#ececf0] bg-white p-4 sm:p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {typeLabelByValue[interview.interviewType] ?? "Mixed"}
              </Badge>
              <Badge variant="outline">
                {visibilityLabelByValue[interview.visibility] ?? interview.visibility}
              </Badge>
              <Badge variant="outline">{interview.status}</Badge>
            </div>

            <h2 className="mt-3 text-xl font-semibold leading-tight text-foreground sm:text-2xl">
              {interview.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {interview.description || "No description provided."}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#ececf0] p-3">
                <p className="text-xs text-muted-foreground">Role Focus</p>
                <p className="text-sm font-medium text-foreground">{interview.role}</p>
              </div>
              <div className="rounded-xl border border-[#ececf0] p-3">
                <p className="text-xs text-muted-foreground">Experience Level</p>
                <p className="text-sm font-medium text-foreground">
                  {interview.level || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-[#ececf0] p-3">
                <p className="text-xs text-muted-foreground">Question Count</p>
                <p className="text-sm font-medium text-foreground">{interview.questionCount}</p>
              </div>
              <div className="rounded-xl border border-[#ececf0] p-3">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium text-foreground">
                  {interview.durationMinutes} minutes
                </p>
              </div>
            </div>

            {interview.techStack?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {interview.techStack.map((skill) => (
                  <Badge key={skill} variant="outline" className="rounded-md">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-[#ececf0] p-3">
              <p className="text-xs text-muted-foreground">Interview Questions</p>
              <ul className="mt-2 space-y-2 text-sm text-foreground">
                {Array.isArray(interview.questions) && interview.questions.length > 0 ? (
                  interview.questions.map((question) => (
                    <li key={`${question.order}-${question.question}`} className="flex gap-2">
                      <span className="text-muted-foreground">{question.order}.</span>
                      <span>{question.question}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">Questions will appear after generation.</li>
                )}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-[#ececf0] bg-white p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Interview Metrics</h3>
            </div>
            {analytics ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <MetricCard label="Total Sessions" value={`${analytics.summary?.totalSessions ?? 0}`} />
                  <MetricCard label="Participants" value={`${analytics.summary?.uniqueParticipants ?? 0}`} />
                  <MetricCard label="Completion Rate" value={`${analytics.summary?.completionRate ?? 0}%`} />
                  <MetricCard label="Average Score" value={`${analytics.summary?.averageScore ?? 0}/100`} />
                  <MetricCard label="Highest Score" value={`${analytics.summary?.highestScore ?? 0}/100`} />
                </div>

                <div className="mt-4 rounded-xl border border-[#ececf0] p-3">
                  <p className="text-sm font-semibold text-foreground">Recent Participants</p>
                  {Array.isArray(analytics.recentSessions) && analytics.recentSessions.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {analytics.recentSessions.map((row: any) => (
                        <div
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#ececf0] p-2.5"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {row.candidate?.name || "Candidate"}{" "}
                              <span className="text-muted-foreground">
                                ({row.candidate?.email || row.candidate?.id || row.userId})
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {toDateTime(row.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{row.status}</Badge>
                            {typeof row.score === "number" ? (
                              <Badge variant="secondary">{row.score}/100</Badge>
                            ) : null}
                            {row.status === "completed" ? (
                              <Button asChild variant="outline" className="h-8 rounded-md px-3 text-xs">
                                <Link href={`/interviews/sessions/${row.id}/feedback`}>
                                  View Feedback
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No participants yet.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Analytics are available to interview owners and workspace managers.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[#ececf0] bg-white p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">My Attempts</h3>
            </div>
            {!canTakeInterview ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Attempt history is available for candidate accounts only.
              </p>
            ) : sessions.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                You have not attempted this interview yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ececf0] p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Session {session.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                        {toDateTime(session.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{session.status}</Badge>
                      {session.evaluation?.totalScore ? (
                        <Badge variant="secondary">{session.evaluation.totalScore}/100</Badge>
                      ) : null}
                      {session.status === "completed" ? (
                        <Button asChild variant="outline" className="h-8 rounded-md px-3 text-xs">
                          <Link href={`/interviews/sessions/${session.id}/feedback`}>
                            View Feedback
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#ececf0] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
