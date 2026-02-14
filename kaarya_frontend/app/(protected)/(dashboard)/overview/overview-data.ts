import type { ApplicationsSummaryCardProps } from "./_components/applications-summary-card";
import type { DeadlineCardProps } from "./_components/deadline-card";
import type { InvitationCardProps } from "./_components/invitation-card";
import { getJobs, getMyApplications } from "@/lib/actions/job-actions";
import { listInterviews } from "@/lib/actions/interview-actions";
import type { TJob } from "@/lib/definitions";
import { formatRelativeTime } from "@/lib/date/relative-time";
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
    | "monthLabel"
    | "monthOptions"
    | "tabs"
    | "activeTab"
    | "logos"
    | "extraCount"
  >;
  deadlineCard: Pick<
    DeadlineCardProps,
    "title" | "company" | "logoUrl" | "logoAlt" | "deadlineLabel" | "ctaHref"
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

const overviewJobsForYou: JobCardProps[] = [
  {
    id: "overview-backend-software-engineer",
    title: "Backend Software Engineer",
    company: "Kaarya Co. Inc.",
    statusLabel: "Suit You Best!",
    statusTone: "success",
    postedAt: "3d ago",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Internship",
    salaryRange: "NPR 10,00,000 - NPR 15,00,000",
    logoText: "K",
    extraTags: ["+4"],
    applyHref: "/jobs",
  },
  {
    id: "overview-frontend-software-engineer",
    title: "Frontend Software Engineer",
    company: "Softwarica College of IT & E-commerce",
    statusLabel: "Suit You Best!",
    statusTone: "success",
    postedAt: "2d ago",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Internship",
    salaryRange: "NPR 10,00,000 - NPR 15,00,000",
    logoText: "S",
    logoClassName: "bg-[#003d7c]",
    extraTags: ["+4"],
    applyHref: "/jobs",
  },
  {
    id: "overview-ui-ux-designer",
    title: "UI/UX Designer",
    company: "Softwarica College of IT & E-commerce",
    statusLabel: "Still Hiring",
    statusTone: "warning",
    postedAt: "1d ago",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Internship",
    salaryRange: "NPR 8,00,000 - NPR 12,00,000",
    logoText: "U",
    logoClassName: "bg-[#2d8574]",
    extraTags: ["+3"],
    applyHref: "/jobs",
  },
  {
    id: "overview-product-engineer",
    title: "Product Engineer",
    company: "Kaarya Co. Inc.",
    statusLabel: "New This Week",
    statusTone: "info",
    postedAt: "5h ago",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Internship",
    salaryRange: "NPR 12,00,000 - NPR 18,00,000",
    logoText: "P",
    logoClassName: "bg-[#5f4ebf]",
    extraTags: ["+5"],
    applyHref: "/jobs",
  },
];

function rotateJobs(jobs: JobCardProps[], amount: number) {
  if (jobs.length === 0) return [];
  const normalizedAmount = amount % jobs.length;
  return [...jobs.slice(normalizedAmount), ...jobs.slice(0, normalizedAmount)];
}

const overviewJobsByTab: Record<string, JobCardProps[]> = {
  "For You": overviewJobsForYou,
  "Trending Jobs": rotateJobs(overviewJobsForYou, 1),
  "New This Week": rotateJobs(overviewJobsForYou, 2),
  "Urgent Hiring": rotateJobs(overviewJobsForYou, 3),
  "Remote Opportunities": overviewJobsForYou,
};

const OVERVIEW_DEFAULT_DATA: OverviewDashboardData = {
  applicationsSummary: {
    total: 124,
    delta: 12,
    monthLabel: "February, 2026",
    monthOptions: ["February, 2026", "January, 2026", "December, 2025"],
    tabs: [
      "All Applications",
      "Mock Interviews",
      "Screening",
      "Assessments",
      "Offering",
      "Acceptance",
      "Rejected",
    ],
    activeTab: "All Applications",
    logos: [
      "https://res.cloudinary.com/dnqet3vq1/image/upload/v1770473342/kaarya/lnzrl9t7liqdt7pmquxt.png",
      "https://res.cloudinary.com/dnqet3vq1/image/upload/v1770357829/kaarya/tl0x4mtzklebkdsbl50b.png",
      "https://res.cloudinary.com/dnqet3vq1/image/upload/v1770473353/kaarya/acy5rbpegmme5jgree6w.png",
      "https://res.cloudinary.com/dnqet3vq1/image/upload/v1770466148/kaarya/xpn5jf1sxap5ialnqzka.webp",
    ],
    extraCount: 8,
  },
  deadlineCard: {
    title: "Marketing Manager",
    company: "Anthropic",
    logoUrl:
      "https://res.cloudinary.com/dnqet3vq1/image/upload/v1770473353/kaarya/acy5rbpegmme5jgree6w.png",
    logoAlt: "Anthropic",
  },
  invitationCard: {
    title: "You've got an invitation!",
    description:
      "Congratulations! You've got an interview invitation from OpenAI, accept the invitation and be prepared with our AI mock interviews!",
    eventTitle: "Sunday, February 9, 2026",
    eventTime: "4:30 PM - 6:30 PM",
    logoUrl:
      "https://res.cloudinary.com/dnqet3vq1/image/upload/v1770357829/kaarya/tl0x4mtzklebkdsbl50b.png",
    logoAlt: "OpenAI",
    initialStatus: "pending",
  },
  analytics: {
    summary: {
      applicationsThisWeek: 139,
      interviewConversion: 43.2,
    },
    momentum: [
      { label: "Mon", applications: 14, interviews: 6 },
      { label: "Tue", applications: 19, interviews: 8 },
      { label: "Wed", applications: 16, interviews: 7 },
      { label: "Thu", applications: 24, interviews: 11 },
      { label: "Fri", applications: 21, interviews: 10 },
      { label: "Sat", applications: 18, interviews: 8 },
      { label: "Sun", applications: 27, interviews: 12 },
    ],
    pipeline: [
      { stage: "Applied", thisWeek: 124, lastWeek: 110 },
      { stage: "Screening", thisWeek: 79, lastWeek: 68 },
      { stage: "Interview", thisWeek: 42, lastWeek: 34 },
      { stage: "Offer", thisWeek: 16, lastWeek: 11 },
    ],
    invitationMix: [
      { name: "Accepted", value: 58, fill: "#10b981" },
      { name: "Pending", value: 27, fill: "#f59e0b" },
      { name: "Declined", value: 15, fill: "#ef4444" },
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
    profile: 79,
    interview: 23,
  },
};

type OverviewDashboardOptions = {
  enableInterviewMetrics?: boolean;
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

  return applications.find((application: any) => {
    const status =
      typeof application?.status === "string"
        ? application.status.toLowerCase()
        : "";
    return status === "interview_scheduled";
  });
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
  try {
    const [
      forYouResponse,
      trendingResponse,
      lastWeekResponse,
      remoteResponse,
      myApplicationsResponse,
      takenInterviewsResponse,
    ] =
      await Promise.all([
        getJobs({ page: 1, size: 10, feed: "for_you" }),
        getJobs({ page: 1, size: 10, feed: "trending" }),
        getJobs({ page: 1, size: 10, feed: "last_week" }),
        getJobs({ page: 1, size: 10, feed: "for_you", remoteOnly: true }),
        getMyApplications({ page: 1, size: 100 }),
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
    const interviewScores = extractInterviewScores(takenInterviewsResponse);
    const interviewRating = toAverageInterviewScore(interviewScores);

    if (!hasLiveJobs) {
      return {
        ...OVERVIEW_DEFAULT_DATA,
        ratings: {
          ...OVERVIEW_DEFAULT_DATA.ratings,
          interview: interviewRating,
        },
      };
    }

    const nearestDeadline = findNearestDeadlineJob(forYouRawJobs);
    const invitation = findInterviewInvitation(myApplicationsResponse);
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

    return {
      ...OVERVIEW_DEFAULT_DATA,
      ratings: {
        ...OVERVIEW_DEFAULT_DATA.ratings,
        interview: interviewRating,
      },
      deadlineCard: nearestDeadline
        ? {
            title: nearestDeadline.title,
            company: nearestDeadline.company?.name ?? "Company",
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
        jobsByTab: {
          "For You": forYouJobs,
          "Trending Jobs": trendingJobs,
          "New This Week": lastWeekJobs,
          "Urgent Hiring": forYouJobs.filter((job) =>
            job.statusLabel.toLowerCase().includes("open"),
          ),
          "Remote Opportunities": remoteJobs,
        },
      },
    };
  } catch {
    return {
      ...OVERVIEW_DEFAULT_DATA,
      ratings: {
        ...OVERVIEW_DEFAULT_DATA.ratings,
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

    const [allResponse, openResponse, closedResponse, draftResponse] =
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
      ]);

    const allJobs = extractJobs(allResponse);
    const openJobs = extractJobs(openResponse);
    const closedJobs = extractJobs(closedResponse);
    const draftJobs = extractJobs(draftResponse);

    const totalApplicants = allJobs.reduce(
      (sum, job) => sum + (job.applicationsCount ?? 0),
      0,
    );
    const totalViews = allJobs.reduce((sum, job) => sum + (job.viewsCount ?? 0), 0);
    const closingSoon = openJobs.filter((job) =>
      isWithinNextDays(job.deadline, 14),
    ).length;
    const momentum = buildMomentumFromJobs(allJobs);
    const interviewsCount = Math.round(totalApplicants * 0.28);
    const interviewRate =
      totalApplicants > 0
        ? Number(((interviewsCount / totalApplicants) * 100).toFixed(1))
        : 0;

    const pipelineApplied = totalApplicants;
    const pipelineScreening = Math.round(totalApplicants * 0.57);
    const pipelineInterview = interviewsCount;
    const pipelineOffer = Math.round(totalApplicants * 0.11);

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
    const workModeDistribution = [
      {
        mode: "Remote",
        count: allJobs.filter((job) => job.workMode === "remote").length,
      },
      {
        mode: "Hybrid",
        count: allJobs.filter((job) => job.workMode === "hybrid").length,
      },
      {
        mode: "Onsite",
        count: allJobs.filter((job) => job.workMode === "onsite").length,
      },
    ];
    const skillsCounter = allJobs.reduce<Map<string, number>>((acc, job) => {
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
          applicationsThisWeek: totalApplicants,
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
