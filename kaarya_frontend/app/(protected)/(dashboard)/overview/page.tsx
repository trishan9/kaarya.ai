import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, Eye, FileClock, Target, Users } from "lucide-react";
import { DashboardHeader } from "../_components/dashboard-header";
import { ApplicationsSummaryCard } from "./_components/applications-summary-card";
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
import {
  Role,
} from "@/lib/definitions";
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
  }>;
};

const getInterviewRatingMeta = (rating: number) => {
  if (rating >= 80) {
    return {
      badgeLabel: "Excellent",
      ratingClassName: "text-emerald-600",
      badgeClassName: "bg-emerald-50 text-emerald-600",
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
      badgeClassName: "bg-sky-50 text-sky-600",
      description: "You have a solid interview baseline with room to sharpen.",
      suggestionBody:
        "Focus on weak categories from recent feedback and retake similar interviews.",
    };
  }

  if (rating >= 50) {
    return {
      badgeLabel: "Average",
      ratingClassName: "text-amber-600",
      badgeClassName: "bg-amber-50 text-amber-600",
      description: "Your fundamentals are visible, but consistency needs work.",
      suggestionBody:
        "Give more mock interviews and improve low-scoring categories first.",
    };
  }

  if (rating > 0) {
    return {
      badgeLabel: "Below Average",
      ratingClassName: "text-rose-500",
      badgeClassName: "bg-rose-50 text-rose-500",
      description:
        "Your current performance is below target and needs focused practice.",
      suggestionBody:
        "Take structured mock interviews and review feedback before each retake.",
    };
  }

  return {
    badgeLabel: "Not Started",
    ratingClassName: "text-muted-foreground",
    badgeClassName: "bg-slate-100 text-slate-600",
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

    const overviewData = await getRecruiterOverviewDashboardData({
      workspaceId: activeWorkspaceId,
      workspaceName: activeWorkspaceName,
      workspaceType: isCollege ? "college" : "company",
    });
    const createJobHref = activeWorkspaceId
      ? `/jobs/new?workspace=${activeWorkspaceId}`
      : "/jobs/new";

    const recruiterStats = [
      {
        label: "Open Jobs",
        value: overviewData.summary.activeJobs,
        helper: "Live roles currently hiring",
        icon: BriefcaseBusiness,
      },
      {
        label: "Draft Jobs",
        value: overviewData.summary.draftJobs,
        helper: "Roles saved but not published",
        icon: FileClock,
      },
      {
        label: "Total Applicants",
        value: overviewData.summary.totalApplicants,
        helper: "Applicants across tracked roles",
        icon: Users,
      },
      {
        label: "Job Views",
        value: overviewData.summary.totalViews,
        helper: "Total visibility across roles",
        icon: Eye,
      },
      {
        label: "Closing Soon",
        value: overviewData.summary.closingSoon,
        helper: "Open roles closing in 14 days",
        icon: Target,
      },
    ];
    const maxWorkModeCount = Math.max(
      ...overviewData.insights.workModeDistribution.map((item) => item.count),
      1,
    );

    return (
      <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
        <div className="rounded-xl bg-white sm:rounded-2xl">
          <DashboardHeader
            title={isCollege ? "College Overview" : "Recruiter Overview"}
            actions={
              <Button asChild className="h-9 rounded-lg text-xs font-semibold">
                <Link href={createJobHref}>Create Job Posting</Link>
              </Button>
            }
          />

          <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#ececf0] bg-neutral-50 px-3 py-2">
              <span className="text-sm text-muted-foreground">Workspace</span>
              <Badge variant="secondary">
                {overviewData.workspaceName || "No workspace selected"}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {recruiterStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="gap-3 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {stat.label}
                      </p>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
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
              <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
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
                      <div className="h-2 rounded-full bg-neutral-100">
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

              <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
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

              <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
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
                        className="rounded-lg border border-[#ececf0] bg-neutral-50 p-2.5"
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
  const overviewData = await getOverviewDashboardData({
    enableInterviewMetrics: canTakeInterview,
  });
  const interviewRatingMeta = getInterviewRatingMeta(overviewData.ratings.interview);

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="bg-white rounded-xl sm:rounded-2xl">
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
                badgeLabel="Standard"
                ratingClassName="text-[#f4b000]"
                badgeClassName="bg-[#fff3d8] text-[#f4b000]"
                description="It's already great, but it still needs to be even better to impress the recruiters."
                suggestionTitle="Our Suggestion"
                suggestionBody="Try enhancing your profile & re-generating your version of an interactive resume with the help of our very own Resume Builder AI."
                actionLabel="Enhance with AI"
                actionHref="/resume"
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
