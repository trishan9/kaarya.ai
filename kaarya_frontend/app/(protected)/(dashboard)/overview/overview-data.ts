import type { ApplicationsSummaryCardProps } from "./_components/applications-summary-card";
import type { DeadlineCardProps } from "./_components/deadline-card";
import type { InvitationCardProps } from "./_components/invitation-card";
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
  deadlineCard: Pick<DeadlineCardProps, "title" | "company" | "logoUrl" | "logoAlt">;
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

export async function getOverviewDashboardData(): Promise<OverviewDashboardData> {
  return OVERVIEW_DEFAULT_DATA;
}
