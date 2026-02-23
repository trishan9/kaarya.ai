import type {
  ApplicationsSummaryCardProps,
  ApplicationsSummaryStatus,
  ApplicationsSummaryTab,
} from "./_components/applications-summary-card";
import type { DeadlineCardProps } from "./_components/deadline-card";
import type { InvitationCardProps } from "./_components/invitation-card";
import {
  getJobs,
  getMyApplications,
  getMyApplicationsSummary,
} from "@/lib/actions/job-actions";
import { listInterviews } from "@/lib/actions/interview-actions";
import type { TJob, TUser } from "@/lib/definitions";
import { formatRelativeTime } from "@/lib/date/relative-time";
import { computeProfileRating } from "@/lib/compute-profile-rating";
import type {
  JobRecommendationsCardProps,
} from "../_components/job-recommendations-card";
import type { OverviewAnalyticsData } from "./_components/overview-analytics-charts";
import type { JobCardProps } from "../_components/job-card";

export type OverviewDashboardData = {
  applicationsSummary: Pick<
    ApplicationsSummaryCardProps,
    | "total"
    | "delta"
    | "todayCount"
    | "monthLabel"
    | "monthKey"
    | "monthOptions"
    | "tabs"
    | "activeTab"
    | "recentCompanies"
  >;
  deadlineCard: Pick<
    DeadlineCardProps,
    | "jobId"
    | "title"
    | "company"
    | "isBookmarked"
    | "logoUrl"
    | "logoAlt"
    | "deadlineLabel"
    | "ctaHref"
  >;
  invitationCard: Pick<
    InvitationCardProps,
    | "title"
    | "description"
    | "eventTitle"
    | "eventTime"
    | "logoUrl"
    | "logoAlt"
    | "initialStatus"
  >;
  analytics: OverviewAnalyticsData;
  jobRecommendations: Pick<
    JobRecommendationsCardProps,
    | "title"
    | "titleClassName"
    | "seeAllLabel"
    | "seeAllHref"
    | "tabs"
    | "activeTab"
    | "jobsByTab"
  >;
  ratings: {
    profile: number;
    interview: number;
  };
};

const overviewJobTabs = [
  "For You",
  "Trending Jobs",
  "New This Week",
  "Urgent Hiring",
  "Remote Opportunities",
];

const overviewJobsByTab: Record<string, JobCardProps[]> = {
  "For You": [],
  "Trending Jobs": [],
  "New This Week": [],
  "Urgent Hiring": [],
  "Remote Opportunities": [],
};

const OVERVIEW_DEFAULT_DATA: OverviewDashboardData = {
  applicationsSummary: {
    total: 0,
    delta: 0,
    todayCount: 0,
    monthLabel: "Current Month",
    monthKey: "",
    monthOptions: [],
    tabs: [
      { key: "all", label: "All Applications", count: 0 },
      { key: "applied", label: "Applied", count: 0, statuses: ["applied"] },
      { key: "reviewing", label: "Reviewing", count: 0, statuses: ["reviewing"] },
      {
        key: "shortlisted",
        label: "Shortlisted",
        count: 0,
        statuses: ["shortlisted"],
      },
      {
        key: "interview",
        label: "Interview",
        count: 0,
        statuses: ["interview_scheduled"],
      },
      { key: "accepted", label: "Accepted", count: 0, statuses: ["accepted"] },
      {
        key: "rejected",
        label: "Rejected",
        count: 0,
        statuses: ["rejected", "withdrawn"],
      },
    ],
    activeTab: "all",
    recentCompanies: [],
  },
  deadlineCard: {
    title: "No upcoming deadlines",
    company: "Check saved jobs",
    logoAlt: "Company",
    deadlineLabel: "Upcoming",
    ctaHref: "/jobs",
  },
  invitationCard: {
    title: "No pending invitations",
    description:
      "Interview invitations will appear here once recruiters schedule your next round.",
    eventTitle: "No interviews scheduled yet",
    eventTime: "Keep applying to increase interview opportunities",
    logoAlt: "Company",
    initialStatus: "pending",
  },
  analytics: {
    summary: {
      applicationsThisWeek: 0,
      interviewConversion: 0,
    },
    momentum: [
      { label: "Mon", applications: 0, interviews: 0 },
      { label: "Tue", applications: 0, interviews: 0 },
      { label: "Wed", applications: 0, interviews: 0 },
      { label: "Thu", applications: 0, interviews: 0 },
      { label: "Fri", applications: 0, interviews: 0 },
      { label: "Sat", applications: 0, interviews: 0 },
      { label: "Sun", applications: 0, interviews: 0 },
    ],
    pipeline: [
      { stage: "Applied", thisWeek: 0, lastWeek: 0 },
      { stage: "Screening", thisWeek: 0, lastWeek: 0 },
      { stage: "Interview", thisWeek: 0, lastWeek: 0 },
      { stage: "Offer", thisWeek: 0, lastWeek: 0 },
    ],
    invitationMix: [
      { name: "Accepted", value: 0, fill: "#10b981" },
      { name: "Pending", value: 0, fill: "#f59e0b" },
      { name: "Declined", value: 0, fill: "#ef4444" },
    ],
  },
  jobRecommendations: {
    title: "Job Recommendations",
    titleClassName: "text-base font-semibold",
    seeAllLabel: "See All",
    seeAllHref: "/jobs",
    tabs: overviewJobTabs,
    activeTab: "For You",
    jobsByTab: overviewJobsByTab,
  },
  ratings: {
    profile: 0,
    interview: 0,
  },
};

type OverviewDashboardOptions = {
  enableInterviewMetrics?: boolean;
  user?: TUser | null;
  monthKey?: string;
  tabKey?: string;
  statuses?: ApplicationsSummaryStatus[];
};

const CANDIDATE_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const CANDIDATE_SUMMARY_TABS: Array<{
  key: string;
  label: string;
  statuses?: ApplicationsSummaryStatus[];
}> = [
  { key: "all", label: "All Applications" },
  { key: "applied", label: "Applied", statuses: ["applied"] },
  { key: "reviewing", label: "Reviewing", statuses: ["reviewing"] },
  { key: "shortlisted", label: "Shortlisted", statuses: ["shortlisted"] },
  { key: "interview", label: "Interview", statuses: ["interview_scheduled"] },
  { key: "accepted", label: "Accepted", statuses: ["accepted"] },
  { key: "rejected", label: "Rejected", statuses: ["rejected", "withdrawn"] },
];

type CandidateStatusCounts = Record<ApplicationsSummaryStatus, number>;

const EMPTY_STATUS_COUNTS: CandidateStatusCounts = {
  applied: 0,
  reviewing: 0,
  shortlisted: 0,
  interview_scheduled: 0,
  accepted: 0,
  rejected: 0,
  withdrawn: 0,
};

const monthKeyToDate = (monthKey: string) => {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const month = Number.parseInt(monthRaw ?? "", 10);
  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return new Date();
  }
  return new Date(Date.UTC(year, month - 1, 1));
};

const toMonthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const normalizeMonthKey = (value?: string | null) => {
  const monthKey = value?.trim() ?? "";
  if (CANDIDATE_MONTH_REGEX.test(monthKey)) return monthKey;
  return toMonthKey(new Date());
};

const buildMonthOptions = (selectedMonthKey: string, count = 6) => {
  const baseDate = monthKeyToDate(selectedMonthKey);
  return Array.from({ length: count }).map((_, index) => {
    const date = new Date(
      Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() - index, 1),
    );

    return {
      key: toMonthKey(date),
      label: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    };
  });
};

const normalizeStatuses = (statuses?: ApplicationsSummaryStatus[]) =>
  Array.isArray(statuses) ? Array.from(new Set(statuses)) : [];

const areEqualStatuses = (
  left?: ApplicationsSummaryStatus[],
  right?: ApplicationsSummaryStatus[],
) => {
  const leftValues = normalizeStatuses(left).sort();
  const rightValues = normalizeStatuses(right).sort();
  if (leftValues.length !== rightValues.length) return false;
  return leftValues.every((value, index) => value === rightValues[index]);
};

const resolveActiveSummaryTab = (
  tabKey?: string,
  statuses?: ApplicationsSummaryStatus[],
) => {
  if (tabKey) {
    const tabByKey = CANDIDATE_SUMMARY_TABS.find((tab) => tab.key === tabKey);
    if (tabByKey) return tabByKey;
  }

  if (statuses?.length) {
    const tabByStatuses = CANDIDATE_SUMMARY_TABS.find((tab) =>
      areEqualStatuses(tab.statuses, statuses),
    );
    if (tabByStatuses) return tabByStatuses;
  }

  return CANDIDATE_SUMMARY_TABS[0];
};

const parseSummaryStatusCounts = (value: any): CandidateStatusCounts => ({
  applied:
    typeof value?.statusCounts?.applied === "number"
      ? value.statusCounts.applied
      : 0,
  reviewing:
    typeof value?.statusCounts?.reviewing === "number"
      ? value.statusCounts.reviewing
      : 0,
  shortlisted:
    typeof value?.statusCounts?.shortlisted === "number"
      ? value.statusCounts.shortlisted
      : 0,
  interview_scheduled:
    typeof value?.statusCounts?.interviewScheduled === "number"
      ? value.statusCounts.interviewScheduled
      : 0,
  accepted:
    typeof value?.statusCounts?.accepted === "number"
      ? value.statusCounts.accepted
      : 0,
  rejected:
    typeof value?.statusCounts?.rejected === "number"
      ? value.statusCounts.rejected
      : 0,
  withdrawn:
    typeof value?.statusCounts?.withdrawn === "number"
      ? value.statusCounts.withdrawn
      : 0,
});

const sumStatuses = (
  statusCounts: CandidateStatusCounts,
  statuses?: ApplicationsSummaryStatus[],
) => {
  if (!statuses?.length) {
    return Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  }
  return statuses.reduce((sum, status) => sum + (statusCounts[status] ?? 0), 0);
};

const parseSummaryTabs = (statusCounts: CandidateStatusCounts): ApplicationsSummaryTab[] =>
  CANDIDATE_SUMMARY_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    statuses: tab.statuses,
    count: sumStatuses(statusCounts, tab.statuses),
  }));

const parseSummaryRecentCompanies = (value: any) => {
  const companies = Array.isArray(value?.recentCompanies)
    ? value.recentCompanies
    : [];

  return companies
    .map((company: any) => {
      const workspaceId =
        typeof company?.workspaceId === "string" ? company.workspaceId : null;
      if (!workspaceId || typeof company?.name !== "string") return null;
      return {
        workspaceId,
        workspaceType: company?.workspaceType === "college" ? "college" : "company",
        name: company.name,
        logo: typeof company?.logo === "string" ? company.logo : null,
        applicationsCount:
          typeof company?.applicationsCount === "number"
            ? company.applicationsCount
            : 0,
      };
    })
    .filter(Boolean) as ApplicationsSummaryCardProps["recentCompanies"];
};

const parseSummaryAnalytics = (value: any): OverviewAnalyticsData => {
  const analytics = value?.analytics;
  if (!analytics || typeof analytics !== "object") {
    return OVERVIEW_DEFAULT_DATA.analytics;
  }

  const momentum = Array.isArray(analytics.momentum)
    ? analytics.momentum
        .map((item: any) => ({
          label: typeof item?.label === "string" ? item.label : "",
          applications:
            typeof item?.applications === "number" ? item.applications : 0,
          interviews: typeof item?.interviews === "number" ? item.interviews : 0,
        }))
        .filter((item: any) => item.label.length > 0)
    : [];

  const pipeline = Array.isArray(analytics.pipeline)
    ? analytics.pipeline
        .map((item: any) => ({
          stage: typeof item?.stage === "string" ? item.stage : "",
          thisWeek: typeof item?.thisWeek === "number" ? item.thisWeek : 0,
          lastWeek: typeof item?.lastWeek === "number" ? item.lastWeek : 0,
        }))
        .filter((item: any) => item.stage.length > 0)
    : [];

  const invitationMix = Array.isArray(analytics.invitationMix)
    ? analytics.invitationMix
        .map((item: any) => ({
          name: typeof item?.name === "string" ? item.name : "",
          value: typeof item?.value === "number" ? item.value : 0,
          fill: typeof item?.fill === "string" ? item.fill : undefined,
        }))
        .filter((item: any) => item.name.length > 0)
    : [];

  return {
    summary: {
      applicationsThisWeek:
        typeof analytics?.summary?.applicationsThisWeek === "number"
          ? analytics.summary.applicationsThisWeek
          : 0,
      interviewConversion:
        typeof analytics?.summary?.interviewConversion === "number"
          ? analytics.summary.interviewConversion
          : 0,
    },
    momentum:
      momentum.length > 0 ? momentum : OVERVIEW_DEFAULT_DATA.analytics.momentum,
    pipeline:
      pipeline.length > 0 ? pipeline : OVERVIEW_DEFAULT_DATA.analytics.pipeline,
    invitationMix:
      invitationMix.length > 0
        ? invitationMix
        : OVERVIEW_DEFAULT_DATA.analytics.invitationMix,
  };
};

const companyInitials = (companyName?: string | null) => {
  if (!companyName) return "K";
  const parts = companyName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return parts || companyName.slice(0, 1).toUpperCase();
};

const jobStatusLabel = (status?: string) => {
  if (status === "closed") return "Closed Hiring";
  if (status === "draft") return "Draft";
  return "Open Hiring";
};

const jobStatusTone = (status?: string): JobCardProps["statusTone"] => {
  if (status === "closed") return "warning";
  if (status === "draft") return "info";
  return "success";
};

const mapLiveJobsToCards = (
  jobs: TJob[],
  options?: { isRecruiter?: boolean; workspaceId?: string | null },
) =>
  jobs.map<JobCardProps>((job) => ({
    id: job.id,
    title: job.title,
    company: job.company?.name ?? "Company",
    statusLabel: jobStatusLabel(job.status),
    statusTone: jobStatusTone(job.status),
    postedAt: formatRelativeTime(job.createdAt, {
      style: "compact",
      fallback: "just now",
    }),
    location: job.location || "Remote",
    employmentType: job.employmentType || "Full-Time",
    engagementType: job.engagementType || "Internship",
    salaryRange: job.salaryRange || "Compensation not specified",
    logoText: companyInitials(job.company?.name),
    logoUrl: job.company?.logo ?? undefined,
    extraTags: options?.isRecruiter
      ? [`${job.applicationsCount ?? 0} applicants`, `${job.viewsCount ?? 0} views`]
      : [`${job.applicationsCount ?? 0} applicants`],
    applyLabel: options?.isRecruiter ? "Manage Job" : "Apply",
    applyHref: options?.isRecruiter
      ? `/jobs/${job.id}${options.workspaceId ? `?workspace=${options.workspaceId}` : ""}`
      : `/jobs/${job.id}`,
    showBookmark: !options?.isRecruiter,
    isBookmarked: Boolean(job.isSaved),
  }));

const extractJobs = (response: any): TJob[] => {
  const jobs = response?.data?.jobs;
  return Array.isArray(jobs) ? (jobs as TJob[]) : [];
};

const toInterviewScheduleLabel = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const findInterviewInvitation = (applicationsResponse: any) => {
  const applications = Array.isArray(applicationsResponse?.data?.applications)
    ? applicationsResponse.data.applications
    : [];

  const now = Date.now();
  return applications
    .filter((application: any) => {
      const status =
        typeof application?.status === "string"
          ? application.status.toLowerCase()
          : "";
      if (status !== "interview_scheduled") return false;
      const interviewAt = new Date(application?.interviewScheduledAt).getTime();
      return Number.isFinite(interviewAt) && interviewAt >= now;
    })
    .sort(
      (left: any, right: any) =>
        new Date(left.interviewScheduledAt).getTime() -
        new Date(right.interviewScheduledAt).getTime(),
    )[0];
};

const findNearestDeadlineJob = (jobs: TJob[]) => {
  const now = Date.now();

  return jobs
    .filter((job) => job.status === "open")
    .map((job) => ({
      job,
      deadlineTs: new Date(job.deadline).getTime(),
    }))
    .filter((item) => !Number.isNaN(item.deadlineTs) && item.deadlineTs >= now)
    .sort((left, right) => left.deadlineTs - right.deadlineTs)[0]?.job;
};

const toCandidateDeadlineLabel = (value?: string) => {
  if (!value) return "Upcoming";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Upcoming";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const extractInterviewScores = (response: any) => {
  const interviews = Array.isArray(response?.data?.interviews)
    ? response.data.interviews
    : [];
  return interviews
    .map((interview: any) => interview?.myLatestScore)
    .filter((score: unknown): score is number => typeof score === "number");
};

const toAverageInterviewScore = (scores: number[]) => {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
};

export async function getOverviewDashboardData(
  options?: OverviewDashboardOptions,
): Promise<OverviewDashboardData> {
  const enableInterviewMetrics = options?.enableInterviewMetrics !== false;
  const profileRating = computeProfileRating(options?.user).completion;
  const selectedMonthKey = normalizeMonthKey(options?.monthKey);
  const requestedStatuses = normalizeStatuses(options?.statuses);
  const activeSummaryTab = resolveActiveSummaryTab(
    options?.tabKey,
    requestedStatuses,
  );

  try {
    const [
      forYouResponse,
      trendingResponse,
      lastWeekResponse,
      remoteResponse,
      applicationsSummaryResponse,
      interviewInvitesResponse,
      takenInterviewsResponse,
    ] =
      await Promise.all([
        getJobs({ page: 1, size: 10, feed: "for_you" }),
        getJobs({ page: 1, size: 10, feed: "trending" }),
        getJobs({ page: 1, size: 10, feed: "last_week" }),
        getJobs({ page: 1, size: 10, feed: "for_you", remoteOnly: true }),
        getMyApplicationsSummary({
          month: selectedMonthKey,
          statuses: activeSummaryTab.statuses,
        }),
        getMyApplications({ page: 1, size: 50, status: "interview_scheduled" }),
        enableInterviewMetrics
          ? listInterviews({
              page: 1,
              size: 100,
              ownership: "taken_by_me",
              sortBy: "updated",
            })
          : Promise.resolve({ success: true, data: { interviews: [] } }),
      ]);

    const forYouRawJobs = extractJobs(forYouResponse);
    const trendingRawJobs = extractJobs(trendingResponse);
    const lastWeekRawJobs = extractJobs(lastWeekResponse);
    const remoteRawJobs = extractJobs(remoteResponse);

    const forYouJobs = mapLiveJobsToCards(forYouRawJobs);
    const trendingJobs = mapLiveJobsToCards(trendingRawJobs);
    const lastWeekJobs = mapLiveJobsToCards(lastWeekRawJobs);
    const remoteJobs = mapLiveJobsToCards(remoteRawJobs);

    const hasLiveJobs =
      forYouJobs.length > 0 ||
      trendingJobs.length > 0 ||
      lastWeekJobs.length > 0 ||
      remoteJobs.length > 0;
    const summaryData = applicationsSummaryResponse?.success
      ? applicationsSummaryResponse.data
      : null;
    const statusCounts = summaryData
      ? parseSummaryStatusCounts(summaryData)
      : EMPTY_STATUS_COUNTS;
    const summaryMonthKey =
      typeof summaryData?.month?.key === "string"
        ? summaryData.month.key
        : selectedMonthKey;
    const summaryTabs = parseSummaryTabs(statusCounts);
    const summaryTotal =
      typeof summaryData?.summary?.total === "number"
        ? summaryData.summary.total
        : sumStatuses(statusCounts, activeSummaryTab.statuses);
    const summaryDelta =
      typeof summaryData?.summary?.delta === "number"
        ? summaryData.summary.delta
        : 0;
    const summaryTodayCount =
      typeof summaryData?.summary?.todayCount === "number"
        ? summaryData.summary.todayCount
        : 0;
    const summaryMonthLabel =
      typeof summaryData?.month?.label === "string"
        ? summaryData.month.label
        : buildMonthOptions(summaryMonthKey, 1)[0]?.label ?? "Current Month";
    const summaryMonthOptions = buildMonthOptions(summaryMonthKey, 6);
    const summaryRecentCompanies = summaryData
      ? parseSummaryRecentCompanies(summaryData)
      : [];
    const summaryAnalytics = summaryData
      ? parseSummaryAnalytics(summaryData)
      : OVERVIEW_DEFAULT_DATA.analytics;

    const interviewScores = extractInterviewScores(takenInterviewsResponse);
    const interviewRating = toAverageInterviewScore(interviewScores);

    const nearestDeadline = findNearestDeadlineJob(forYouRawJobs);
    const invitation = findInterviewInvitation(interviewInvitesResponse);
    const invitationJob =
      invitation?.job && typeof invitation.job === "object" ? invitation.job : null;
    const invitationCompany =
      invitationJob?.company && typeof invitationJob.company === "object"
        ? invitationJob.company
        : null;
    const invitationSchedule = toInterviewScheduleLabel(
      typeof invitation?.interviewScheduledAt === "string"
        ? invitation.interviewScheduledAt
        : null,
    );
    const jobsByTab = hasLiveJobs
      ? {
          "For You": forYouJobs,
          "Trending Jobs": trendingJobs,
          "New This Week": lastWeekJobs,
          "Urgent Hiring": forYouJobs.filter((job) =>
            job.statusLabel.toLowerCase().includes("open"),
          ),
          "Remote Opportunities": remoteJobs,
        }
      : {
          "For You": [],
          "Trending Jobs": [],
          "New This Week": [],
          "Urgent Hiring": [],
          "Remote Opportunities": [],
        };

    return {
      ...OVERVIEW_DEFAULT_DATA,
      applicationsSummary: {
        total: summaryTotal,
        delta: summaryDelta,
        todayCount: summaryTodayCount,
        monthLabel: summaryMonthLabel,
        monthKey: summaryMonthKey,
        monthOptions: summaryMonthOptions,
        tabs: summaryTabs,
        activeTab: activeSummaryTab.key,
        recentCompanies: summaryRecentCompanies,
      },
      analytics: summaryAnalytics,
      ratings: {
        profile: profileRating,
        interview: interviewRating,
      },
      deadlineCard: nearestDeadline
        ? {
            jobId: nearestDeadline.id,
            title: nearestDeadline.title,
            company: nearestDeadline.company?.name ?? "Company",
            isBookmarked: Boolean(nearestDeadline.isSaved),
            logoUrl: nearestDeadline.company?.logo ?? undefined,
            logoAlt: nearestDeadline.company?.name ?? "Company logo",
            deadlineLabel: toCandidateDeadlineLabel(nearestDeadline.deadline),
            ctaHref: `/jobs/${nearestDeadline.id}`,
          }
        : OVERVIEW_DEFAULT_DATA.deadlineCard,
      invitationCard: invitation
        ? {
            title: "Interview invitation received",
            description:
              "A recruiter invited you for an interview. Review the schedule and prepare your next steps.",
            eventTitle:
              invitationSchedule ??
              "Interview schedule will be shared soon.",
            eventTime:
              typeof invitationJob?.title === "string"
                ? invitationJob.title
                : "Interview",
            logoUrl:
              typeof invitationCompany?.logo === "string"
                ? invitationCompany.logo
                : undefined,
            logoAlt:
              typeof invitationCompany?.name === "string"
                ? invitationCompany.name
                : "Company",
            initialStatus: "pending",
          }
        : OVERVIEW_DEFAULT_DATA.invitationCard,
      jobRecommendations: {
        ...OVERVIEW_DEFAULT_DATA.jobRecommendations,
        jobsByTab,
      },
    };
  } catch {
    return {
      ...OVERVIEW_DEFAULT_DATA,
      applicationsSummary: {
        ...OVERVIEW_DEFAULT_DATA.applicationsSummary,
        monthKey: selectedMonthKey,
        monthLabel: buildMonthOptions(selectedMonthKey, 1)[0]?.label ?? "Current Month",
        monthOptions: buildMonthOptions(selectedMonthKey, 6),
        activeTab: activeSummaryTab.key,
      },
      jobRecommendations: {
        ...OVERVIEW_DEFAULT_DATA.jobRecommendations,
        jobsByTab: {
          "For You": [],
          "Trending Jobs": [],
          "New This Week": [],
          "Urgent Hiring": [],
          "Remote Opportunities": [],
        },
      },
      ratings: {
        profile: profileRating,
        interview: 0,
      },
    };
  }
}

export type RecruiterOverviewDashboardData = {
  workspaceName: string;
  summary: {
    activeJobs: number;
    draftJobs: number;
    totalApplicants: number;
    totalViews: number;
    closingSoon: number;
  };
  analytics: OverviewAnalyticsData;
  jobRecommendations: Pick<
    JobRecommendationsCardProps,
    | "title"
    | "titleClassName"
    | "seeAllLabel"
    | "seeAllHref"
    | "tabs"
    | "activeTab"
    | "jobsByTab"
  >;
  insights: {
    workModeDistribution: Array<{ mode: string; count: number }>;
    topSkills: Array<{ skill: string; count: number }>;
    upcomingDeadlines: Array<{
      id: string;
      title: string;
      deadlineLabel: string;
      applicants: number;
    }>;
  };
};

type RecruiterOverviewOptions = {
  workspaceId?: string | null;
  workspaceName?: string | null;
  workspaceType?: "company" | "college";
  rangeDays?: number;
};

const RECRUITER_EMPTY_OVERVIEW: RecruiterOverviewDashboardData = {
  workspaceName: "Selected Workspace",
  summary: {
    activeJobs: 0,
    draftJobs: 0,
    totalApplicants: 0,
    totalViews: 0,
    closingSoon: 0,
  },
  analytics: {
    summary: {
      applicationsThisWeek: 0,
      interviewConversion: 0,
    },
    momentum: [
      { label: "Mon", applications: 0, interviews: 0 },
      { label: "Tue", applications: 0, interviews: 0 },
      { label: "Wed", applications: 0, interviews: 0 },
      { label: "Thu", applications: 0, interviews: 0 },
      { label: "Fri", applications: 0, interviews: 0 },
      { label: "Sat", applications: 0, interviews: 0 },
      { label: "Sun", applications: 0, interviews: 0 },
    ],
    pipeline: [
      { stage: "Applied", thisWeek: 0, lastWeek: 0 },
      { stage: "Screening", thisWeek: 0, lastWeek: 0 },
      { stage: "Interview", thisWeek: 0, lastWeek: 0 },
      { stage: "Offer", thisWeek: 0, lastWeek: 0 },
    ],
    invitationMix: [
      { name: "Open", value: 0, fill: "#10b981" },
      { name: "Draft", value: 0, fill: "#6366f1" },
      { name: "Closed", value: 0, fill: "#f59e0b" },
    ],
  },
  jobRecommendations: {
    title: "Recent Roles",
    titleClassName: "text-base font-semibold",
    seeAllLabel: "See All",
    seeAllHref: "/jobs",
    tabs: ["All Roles", "Open Roles", "Draft Roles"],
    activeTab: "All Roles",
    jobsByTab: {
      "All Roles": [],
      "Open Roles": [],
      "Draft Roles": [],
    },
  },
  insights: {
    workModeDistribution: [
      { mode: "Remote", count: 0 },
      { mode: "Hybrid", count: 0 },
      { mode: "Onsite", count: 0 },
    ],
    topSkills: [],
    upcomingDeadlines: [],
  },
};

const startOfDayTimestamp = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const isWithinNextDays = (isoDate?: string, days = 14) => {
  if (!isoDate) return false;
  const deadlineAt = new Date(isoDate).getTime();
  if (Number.isNaN(deadlineAt)) return false;

  const now = Date.now();
  const maxWindow = now + days * 24 * 60 * 60 * 1000;
  return deadlineAt >= now && deadlineAt <= maxWindow;
};

const toIsoDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.max(0, Math.floor(days)));
  return date.toISOString();
};

const buildMomentumFromJobs = (jobs: TJob[]) => {
  const dayBuckets: Array<{ key: string; label: string; timestamp: number }> = [];
  const now = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    const timestamp = startOfDayTimestamp(day);
    dayBuckets.push({
      key: String(timestamp),
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      timestamp,
    });
  }

  const dayMap = new Map(
    dayBuckets.map((bucket) => [
      bucket.key,
      { label: bucket.label, applications: 0, interviews: 0 },
    ]),
  );

  jobs.forEach((job) => {
    const createdAt = new Date(job.createdAt).getTime();
    if (Number.isNaN(createdAt)) return;

    const bucketKey = String(startOfDayTimestamp(new Date(createdAt)));
    if (!dayMap.has(bucketKey)) return;

    const bucket = dayMap.get(bucketKey);
    if (!bucket) return;

    const applications = Math.max(job.applicationsCount ?? 0, 0);
    bucket.applications += applications;
    bucket.interviews += Math.round(applications * 0.28);
  });

  return dayBuckets.map((bucket) => dayMap.get(bucket.key)!);
};

const toDeadlineLabel = (isoDate?: string) => {
  if (!isoDate) return "No deadline";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const extractSkillsFromJob = (job: TJob): string[] => {
  const requirements = job.requirements as Record<string, unknown> | undefined;
  const skills = requirements?.skills;
  if (!Array.isArray(skills)) return [];

  return skills
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
};

const toSkillLabel = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

export async function getRecruiterOverviewDashboardData(
  options?: RecruiterOverviewOptions,
): Promise<RecruiterOverviewDashboardData> {
  const workspaceName = options?.workspaceName?.trim() || "Selected Workspace";
  const workspaceId = options?.workspaceId?.trim();
  const workspaceType = options?.workspaceType ?? "company";
  const rangeDays = [7, 30, 90].includes(Number(options?.rangeDays))
    ? Number(options?.rangeDays)
    : 30;

  if (!workspaceId) {
    return {
      ...RECRUITER_EMPTY_OVERVIEW,
      workspaceName,
    };
  }

  try {
    const workspaceFilter =
      workspaceType === "college"
        ? { collegeId: workspaceId, visibility: "college_only" as const }
        : { companyId: workspaceId };

    const [allResponse, openResponse, closedResponse, draftResponse, rangeResponse] =
      await Promise.all([
        getJobs({ page: 1, size: 100, feed: "all", ...workspaceFilter }),
        getJobs({
          page: 1,
          size: 100,
          feed: "all",
          ...workspaceFilter,
          status: "open",
        }),
        getJobs({
          page: 1,
          size: 100,
          feed: "all",
          ...workspaceFilter,
          status: "closed",
        }),
        getJobs({
          page: 1,
          size: 100,
          feed: "all",
          ...workspaceFilter,
          status: "draft",
        }),
        getJobs({
          page: 1,
          size: 100,
          feed: "all",
          ...workspaceFilter,
          createdFrom: toIsoDaysAgo(rangeDays),
        }),
      ]);

    const allJobs = extractJobs(allResponse);
    const openJobs = extractJobs(openResponse);
    const closedJobs = extractJobs(closedResponse);
    const draftJobs = extractJobs(draftResponse);
    const rangeJobs = extractJobs(rangeResponse);
    const analyticsJobs = rangeJobs.length > 0 ? rangeJobs : allJobs;

    const totalApplicants = allJobs.reduce(
      (sum, job) => sum + (job.applicationsCount ?? 0),
      0,
    );
    const totalViews = allJobs.reduce((sum, job) => sum + (job.viewsCount ?? 0), 0);
    const closingSoon = openJobs.filter((job) =>
      isWithinNextDays(job.deadline, 14),
    ).length;
    const momentum = buildMomentumFromJobs(analyticsJobs);
    const applicantsInRange = analyticsJobs.reduce(
      (sum, job) => sum + (job.applicationsCount ?? 0),
      0,
    );
    const interviewsCount = Math.round(applicantsInRange * 0.28);
    const interviewRate =
      applicantsInRange > 0
        ? Number(((interviewsCount / applicantsInRange) * 100).toFixed(1))
        : 0;

    const pipelineApplied = applicantsInRange;
    const pipelineScreening = Math.round(applicantsInRange * 0.57);
    const pipelineInterview = interviewsCount;
    const pipelineOffer = Math.round(applicantsInRange * 0.11);

    const allRoleCards = mapLiveJobsToCards(allJobs, {
      isRecruiter: true,
      workspaceId,
    });
    const openRoleCards = mapLiveJobsToCards(openJobs, {
      isRecruiter: true,
      workspaceId,
    });
    const draftRoleCards = mapLiveJobsToCards(draftJobs, {
      isRecruiter: true,
      workspaceId,
    });
    const insightJobs = analyticsJobs.length > 0 ? analyticsJobs : allJobs;
    const workModeDistribution = [
      {
        mode: "Remote",
        count: insightJobs.filter((job) => job.workMode === "remote").length,
      },
      {
        mode: "Hybrid",
        count: insightJobs.filter((job) => job.workMode === "hybrid").length,
      },
      {
        mode: "Onsite",
        count: insightJobs.filter((job) => job.workMode === "onsite").length,
      },
    ];
    const skillsCounter = insightJobs.reduce<Map<string, number>>((acc, job) => {
      extractSkillsFromJob(job).forEach((skill) => {
        const key = skill.toLowerCase();
        acc.set(key, (acc.get(key) ?? 0) + 1);
      });
      return acc;
    }, new Map());
    const topSkills = Array.from(skillsCounter.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([skill, count]) => ({
        skill: toSkillLabel(skill),
        count,
      }));
    const upcomingDeadlines = [...openJobs]
      .filter((job) => isWithinNextDays(job.deadline, 30))
      .sort(
        (left, right) =>
          new Date(left.deadline).getTime() - new Date(right.deadline).getTime(),
      )
      .slice(0, 5)
      .map((job) => ({
        id: job.id,
        title: job.title,
        deadlineLabel: toDeadlineLabel(job.deadline),
        applicants: job.applicationsCount ?? 0,
      }));

    return {
      workspaceName,
      summary: {
        activeJobs: openJobs.length,
        draftJobs: draftJobs.length,
        totalApplicants,
        totalViews,
        closingSoon,
      },
      analytics: {
        summary: {
          applicationsThisWeek: applicantsInRange,
          interviewConversion: interviewRate,
        },
        momentum:
          momentum.some((item) => item.applications > 0 || item.interviews > 0)
            ? momentum
            : RECRUITER_EMPTY_OVERVIEW.analytics.momentum,
        pipeline: [
          {
            stage: "Applied",
            thisWeek: pipelineApplied,
            lastWeek: Math.round(pipelineApplied * 0.82),
          },
          {
            stage: "Screening",
            thisWeek: pipelineScreening,
            lastWeek: Math.round(pipelineScreening * 0.8),
          },
          {
            stage: "Interview",
            thisWeek: pipelineInterview,
            lastWeek: Math.round(pipelineInterview * 0.78),
          },
          {
            stage: "Offer",
            thisWeek: pipelineOffer,
            lastWeek: Math.round(pipelineOffer * 0.74),
          },
        ],
        invitationMix: [
          { name: "Open", value: openJobs.length, fill: "#10b981" },
          { name: "Draft", value: draftJobs.length, fill: "#6366f1" },
          { name: "Closed", value: closedJobs.length, fill: "#f59e0b" },
        ],
      },
      jobRecommendations: {
        title: "Recent Roles",
        titleClassName: "text-base font-semibold",
        seeAllLabel: "Manage Jobs",
        seeAllHref: `/jobs?workspace=${workspaceId}`,
        tabs: ["All Roles", "Open Roles", "Draft Roles"],
        activeTab: "All Roles",
        jobsByTab: {
          "All Roles": allRoleCards,
          "Open Roles": openRoleCards,
          "Draft Roles": draftRoleCards,
        },
      },
      insights: {
        workModeDistribution,
        topSkills,
        upcomingDeadlines,
      },
    };
  } catch {
    return {
      ...RECRUITER_EMPTY_OVERVIEW,
      workspaceName,
    };
  }
}
