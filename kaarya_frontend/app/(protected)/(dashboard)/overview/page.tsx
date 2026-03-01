import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, Eye, FileClock, Target, Users } from "lucide-react";
import { DashboardHeader } from "../_components/dashboard-header";
import {
  ApplicationsSummaryCard,
  type ApplicationsSummaryStatus,
} from "./_components/applications-summary-card";
import { DeadlineCard } from "./_components/deadline-card";
import { InvitationCard } from "./_components/invitation-card";
import { RatingCard } from "./_components/rating-card";
import { JobRecommendationsCard } from "../_components/job-recommendations-card";
import { TipsCard } from "./_components/tips-card";
import { OverviewHeaderActions } from "./_components/overview-header-actions";
import { OverviewAnalyticsCharts } from "./_components/overview-analytics-charts";
import {
  getOverviewDashboardData,
  getRecruiterOverviewDashboardData,
} from "./overview-data";
import { getCurrentUser } from "@/lib/dal";
import { listCollegeWorkspaces } from "@/lib/actions/college-actions";
import { Role } from "@/lib/definitions";
import { computeProfileRating } from "@/lib/compute-profile-rating";
import { listRecruiterWorkspaces } from "@/lib/actions/company-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  extractCollegeWorkspaces,
  extractRecruiterWorkspaces,
  extractWorkspaceRows,
  resolveCollegeWorkspace,
  resolveRecruiterWorkspace,
} from "@/lib/workspaces";

type OverviewPageProps = {
  searchParams?: Promise<{
    workspace?: string;
    range?: string;
    month?: string;
    tab?: string;
    statuses?: string;
  }>;
};

const candidateStatuses: ApplicationsSummaryStatus[] = [
  "applied",
  "reviewing",
  "shortlisted",
  "interview_scheduled",
  "accepted",
  "rejected",
  "withdrawn",
];

const parseSummaryStatuses = (
  value: string | undefined,
): ApplicationsSummaryStatus[] | undefined => {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  const tokens = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean) as ApplicationsSummaryStatus[];
  if (!tokens.length) return undefined;
  const filtered = tokens.filter((token) => candidateStatuses.includes(token));
  if (!filtered.length) return undefined;
  return Array.from(new Set(filtered));
};

const buildOverviewHref = (input: {
  workspace?: string | null;
  rangeDays?: number;
}) => {
  const query = new URLSearchParams();
  if (input.workspace) query.set("workspace", input.workspace);
  if (typeof input.rangeDays === "number") {
    query.set("range", String(input.rangeDays));
  }
  const queryString = query.toString();
  return queryString ? `/overview?${queryString}` : "/overview";
};

const getInterviewRatingMeta = (rating: number) => {
  if (rating >= 80) {
    return {
      badgeLabel: "Excellent",
      ratingClassName: "text-emerald-600",
      badgeClassName: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
      description:
        "Your interview readiness is consistently strong across attempts.",
      suggestionBody:
        "Keep practicing targeted advanced interviews to maintain your momentum.",
    };
  }

  if (rating >= 65) {
    return {
      badgeLabel: "Good",
      ratingClassName: "text-sky-600",
      badgeClassName: "bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
      description: "You have a solid interview baseline with room to sharpen.",
      suggestionBody:
        "Focus on weak categories from recent feedback and retake similar interviews.",
    };
  }

  if (rating >= 50) {
    return {
      badgeLabel: "Average",
      ratingClassName: "text-amber-600",
      badgeClassName: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
      description: "Your fundamentals are visible, but consistency needs work.",
      suggestionBody:
        "Give more mock interviews and improve low-scoring categories first.",
    };
  }

  if (rating > 0) {
    return {
      badgeLabel: "Below Average",
      ratingClassName: "text-rose-500",
      badgeClassName: "bg-rose-50 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300",
      description:
        "Your current performance is below target and needs focused practice.",
      suggestionBody:
        "Take structured mock interviews and review feedback before each retake.",
    };
  }

  return {
    badgeLabel: "Not Started",
    ratingClassName: "text-muted-foreground",
    badgeClassName: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
    description:
      "No interview attempts yet. Complete one mock to start your rating.",
    suggestionBody: "Give your first interview in AI Interview Hub.",
  };
};

export default async function OverviewPage({
  searchParams,
}: OverviewPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (user?.role === Role.ADMIN) {
    redirect("/admin");
  }

  if (user?.role === Role.RECRUITER || user?.role === Role.COLLEGE) {
    const isCollege = user.role === Role.COLLEGE;
    const requestedWorkspaceId =
      typeof params?.workspace === "string" ? params.workspace : null;
    const workspaceResponse = isCollege
      ? await listCollegeWorkspaces({ page: 1, size: 50 })
      : await listRecruiterWorkspaces({ page: 1, size: 50 });
    const workspaceRows = extractWorkspaceRows(workspaceResponse);
    const recruiterWorkspaces = extractRecruiterWorkspaces(workspaceRows);
    const collegeWorkspaces = extractCollegeWorkspaces(workspaceRows);

    const activeRecruiterWorkspace = resolveRecruiterWorkspace({
      workspaces: recruiterWorkspaces,
      requestedId: requestedWorkspaceId,
    });
    const activeCollegeWorkspace = resolveCollegeWorkspace({
      workspaces: collegeWorkspaces,
      requestedId: requestedWorkspaceId,
    });
    const activeWorkspaceId = isCollege
      ? (activeCollegeWorkspace?.college?.id ?? null)
      : (activeRecruiterWorkspace?.company?.id ?? null);
    const activeWorkspaceName = isCollege
      ? activeCollegeWorkspace?.college?.name
      : activeRecruiterWorkspace?.company?.name;
    const requestedRangeValue =
      typeof params?.range === "string"
        ? Number.parseInt(params.range, 10)
        : Number.NaN;
    const rangeDays = [7, 30, 90].includes(requestedRangeValue)
      ? requestedRangeValue
      : 30;

    const overviewData = await getRecruiterOverviewDashboardData({
      workspaceId: activeWorkspaceId,
      workspaceName: activeWorkspaceName,
      workspaceType: isCollege ? "college" : "company",
      rangeDays,
    });
    const createJobHref = activeWorkspaceId
      ? `/jobs/new?workspace=${activeWorkspaceId}`
      : "/jobs/new";

    const recruiterStats = [
      {
        label: "Open Jobs",
        value: overviewData.summary.activeJobs,
        helper: "Live roles currently hiring",
      },
      {
        label: "Draft Jobs",
        value: overviewData.summary.draftJobs,
        helper: "Roles saved but not published",
      },
      {
        label: "Total Applicants",
        value: overviewData.summary.totalApplicants,
        helper: "Applicants across tracked roles",
      },
      {
        label: "Job Views",
        value: overviewData.summary.totalViews,
        helper: "Total visibility across roles",
      },
      {
        label: "Closing Soon",
        value: overviewData.summary.closingSoon,
        helper: "Open roles closing in 14 days",
      },
    ];
    const maxWorkModeCount = Math.max(
      ...overviewData.insights.workModeDistribution.map((item) => item.count),
      1,
    );

    return (
      <div className="dashboard-stage">
        <div className="dashboard-surface">
          <DashboardHeader
            title={isCollege ? "College Overview" : "Recruiter Overview"}
            actions={
              <Button asChild className="h-9 rounded-lg text-xs font-semibold">
                <Link href={createJobHref}>Create Job Posting</Link>
              </Button>
            }
          />

          <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {recruiterStats.map((stat) => {
                return (
                  <Card
                    key={stat.label}
                    className="gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm dark:bg-[#111824] dark:shadow-none"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.helper}
                    </p>
                  </Card>
                );
              })}
            </div>

            <OverviewAnalyticsCharts
              data={overviewData.analytics}
              variant="recruiter"
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <Card className="gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm dark:bg-[#111824] dark:shadow-none sm:p-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Work Mode Split</h3>
                  <p className="text-xs text-muted-foreground">
                    Distribution of roles by work arrangement.
                  </p>
                </div>
                <div className="space-y-3">
                  {overviewData.insights.workModeDistribution.map((item) => (
                    <div key={item.mode} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          {item.mode}
                        </span>
                        <span className="text-muted-foreground">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${Math.max(
                              8,
                              Math.round((item.count / maxWorkModeCount) * 100),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm dark:bg-[#111824] dark:shadow-none sm:p-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Top Skills Demand</h3>
                  <p className="text-xs text-muted-foreground">
                    Most frequently requested skills across active role briefs.
                  </p>
                </div>
                {overviewData.insights.topSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add skills in role descriptions to populate this section.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {overviewData.insights.topSkills.map((item) => (
                      <Badge
                        key={item.skill}
                        variant="secondary"
                        className="rounded-md"
                      >
                        {item.skill} ({item.count})
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm dark:bg-[#111824] dark:shadow-none sm:p-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Upcoming Deadlines</h3>
                  <p className="text-xs text-muted-foreground">
                    Open roles closing in the next 30 days.
                  </p>
                </div>
                {overviewData.insights.upcomingDeadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No upcoming deadlines right now.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {overviewData.insights.upcomingDeadlines.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-muted/40 p-2.5"
                      >
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Deadline: {item.deadlineLabel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.applicants} applicants
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <JobRecommendationsCard {...overviewData.jobRecommendations} />
          </div>
        </div>
      </div>
    );
  }

  const canTakeInterview =
    user?.role === Role.USER || user?.role === Role.STUDENT;
  const candidateStatusesFilter = parseSummaryStatuses(
    typeof params?.statuses === "string" ? params.statuses : undefined,
  );
  const overviewData = await getOverviewDashboardData({
    enableInterviewMetrics: canTakeInterview,
    user: user ?? undefined,
    monthKey: typeof params?.month === "string" ? params.month : undefined,
    tabKey: typeof params?.tab === "string" ? params.tab : undefined,
    statuses: candidateStatusesFilter,
  });
  const interviewRatingMeta = getInterviewRatingMeta(
    overviewData.ratings.interview,
  );
  const profileRatingMeta = user ? computeProfileRating(user) : null;

  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader title="Overview" actions={<OverviewHeaderActions />} />

        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <ApplicationsSummaryCard {...overviewData.applicationsSummary} />

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <DeadlineCard {...overviewData.deadlineCard} />
                <InvitationCard {...overviewData.invitationCard} />
              </div>

              <OverviewAnalyticsCharts data={overviewData.analytics} />
            </div>

            <div className="min-w-0 flex h-full flex-col gap-4">
              <RatingCard
                title="Your Profile Rating"
                rating={overviewData.ratings.profile}
                badgeLabel={profileRatingMeta?.tierLabel ?? "STARTER"}
                ratingClassName={
                  profileRatingMeta?.tierColor ?? "text-muted-foreground"
                }
                badgeClassName={
                  profileRatingMeta?.tierBadgeClass ??
                  "bg-muted text-muted-foreground"
                }
                description={
                  profileRatingMeta?.summaryText ??
                  "Complete your profile to get started."
                }
                suggestionTitle="Our Suggestion"
                suggestionBody={
                  profileRatingMeta?.suggestionBody ??
                  "Fill out your profile and resume details."
                }
                actionLabel="Improve Profile"
                actionHref="/settings"
                showAction
              />

              {canTakeInterview ? (
                <RatingCard
                  title="Interview Overall Rating"
                  rating={overviewData.ratings.interview}
                  badgeLabel={interviewRatingMeta.badgeLabel}
                  ratingClassName={interviewRatingMeta.ratingClassName}
                  badgeClassName={interviewRatingMeta.badgeClassName}
                  description={interviewRatingMeta.description}
                  suggestionTitle="Our Suggestion"
                  suggestionBody={interviewRatingMeta.suggestionBody}
                  actionLabel="Take an Interview"
                  actionHref="/interview-hub"
                  showAction
                />
              ) : null}

              <TipsCard
                title="We've got some tips only for you!"
                description="Check our latest information for tips and tricks for your career!"
                actionHref="/resources"
                actionLabel="Open tips"
                className="flex-1"
              />
            </div>
          </div>

          <JobRecommendationsCard {...overviewData.jobRecommendations} />
        </div>
      </div>
    </div>
  );
}

