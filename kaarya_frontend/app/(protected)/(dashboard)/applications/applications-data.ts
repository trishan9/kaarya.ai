import type {
  ApplicationStatus,
  MyApplicationRecord,
  MyApplicationsBoardProps,
} from "./_components/my-applications-board";
import type { MyApplicationsHeroProps } from "./_components/my-applications-hero";

type SourceApplicationRecord = {
  id: string;
  roleTitle: string;
  company: string;
  logoText: string;
  logoClassName?: string;
  status: ApplicationStatus;
  location: string;
  workMode: MyApplicationRecord["workMode"];
  employmentType: MyApplicationRecord["employmentType"];
  salaryRange: string;
  appliedAt: string;
  updatedAt: string;
  nextStepLabel?: string;
  jobHref?: string;
};

type TabDefinition = {
  label: string;
  matches: (record: SourceApplicationRecord) => boolean;
};

export type MyApplicationsPageData = {
  hero: MyApplicationsHeroProps;
  board: MyApplicationsBoardProps;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const STATUS_META: Record<
  ApplicationStatus,
  {
    label: string;
    tone: MyApplicationRecord["statusTone"];
    defaultNextStep: string;
  }
> = {
  applied: {
    label: "Applied",
    tone: "info",
    defaultNextStep: "Await recruiter review",
  },
  under_review: {
    label: "Under Review",
    tone: "warning",
    defaultNextStep: "Hiring team evaluating profile",
  },
  shortlisted: {
    label: "Shortlisted",
    tone: "success",
    defaultNextStep: "Expect interview scheduling update",
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    tone: "info",
    defaultNextStep: "Prepare for the upcoming interview",
  },
  offer_received: {
    label: "Offer Received",
    tone: "success",
    defaultNextStep: "Review compensation and respond",
  },
  rejected: {
    label: "Rejected",
    tone: "destructive",
    defaultNextStep: "Archive and move to next opportunities",
  },
  withdrawn: {
    label: "Withdrawn",
    tone: "neutral",
    defaultNextStep: "Application closed by candidate",
  },
};

const sourceApplicationRecords: SourceApplicationRecord[] = [
  {
    id: "app-senior-frontend-openai",
    roleTitle: "Senior Frontend Engineer",
    company: "OpenAI",
    logoText: "O",
    logoClassName: "bg-black",
    status: "interview_scheduled",
    location: "San Francisco, CA",
    workMode: "Hybrid",
    employmentType: "Full-Time",
    salaryRange: "$170k - $230k",
    appliedAt: "2026-01-18T10:00:00.000Z",
    updatedAt: "2026-02-07T09:30:00.000Z",
    nextStepLabel: "Final technical round on February 14, 2026",
    jobHref: "/jobs",
  },
  {
    id: "app-product-engineer-anthropic",
    roleTitle: "Product Engineer",
    company: "Anthropic",
    logoText: "A",
    logoClassName: "bg-[#d97706]",
    status: "under_review",
    location: "Seattle, WA",
    workMode: "Remote",
    employmentType: "Full-Time",
    salaryRange: "$150k - $210k",
    appliedAt: "2026-01-27T08:40:00.000Z",
    updatedAt: "2026-02-06T16:20:00.000Z",
    jobHref: "/jobs",
  },
  {
    id: "app-full-stack-kaarya",
    roleTitle: "Full-Stack Developer",
    company: "Kaarya Co. Inc.",
    logoText: "K",
    logoClassName: "bg-primary",
    status: "shortlisted",
    location: "Kathmandu, Bagmati",
    workMode: "Hybrid",
    employmentType: "Full-Time",
    salaryRange: "NPR 18,00,000 - NPR 24,00,000",
    appliedAt: "2026-01-21T12:00:00.000Z",
    updatedAt: "2026-02-05T13:00:00.000Z",
    nextStepLabel: "Awaiting recruiter to confirm interview slots",
    jobHref: "/jobs",
  },
  {
    id: "app-mobile-engineer-stripe",
    roleTitle: "Mobile Engineer",
    company: "Stripe",
    logoText: "S",
    logoClassName: "bg-[#635bff]",
    status: "offer_received",
    location: "Dublin, Ireland",
    workMode: "Remote",
    employmentType: "Full-Time",
    salaryRange: "EUR 95k - EUR 125k",
    appliedAt: "2026-01-05T07:15:00.000Z",
    updatedAt: "2026-02-03T11:00:00.000Z",
    nextStepLabel: "Offer response due by February 12, 2026",
    jobHref: "/jobs",
  },
  {
    id: "app-frontend-lead-google",
    roleTitle: "Frontend Lead",
    company: "Google",
    logoText: "G",
    logoClassName: "bg-white text-[#4285f4] border border-[#d7e1f4]",
    status: "applied",
    location: "New York, NY",
    workMode: "On-site",
    employmentType: "Full-Time",
    salaryRange: "$190k - $260k",
    appliedAt: "2026-02-04T14:00:00.000Z",
    updatedAt: "2026-02-04T14:00:00.000Z",
    jobHref: "/jobs",
  },
  {
    id: "app-data-engineer-meta",
    roleTitle: "Data Engineer",
    company: "Meta",
    logoText: "M",
    logoClassName: "bg-[#0866ff]",
    status: "rejected",
    location: "Menlo Park, CA",
    workMode: "Hybrid",
    employmentType: "Full-Time",
    salaryRange: "$165k - $220k",
    appliedAt: "2025-12-22T09:00:00.000Z",
    updatedAt: "2026-01-30T15:30:00.000Z",
    jobHref: "/jobs",
  },
  {
    id: "app-ui-designer-netflix",
    roleTitle: "Product Designer",
    company: "Netflix",
    logoText: "N",
    logoClassName: "bg-[#e50914]",
    status: "withdrawn",
    location: "Los Angeles, CA",
    workMode: "Remote",
    employmentType: "Contract",
    salaryRange: "$65/hr - $85/hr",
    appliedAt: "2026-01-11T10:00:00.000Z",
    updatedAt: "2026-01-28T08:45:00.000Z",
    nextStepLabel: "Closed by you",
    jobHref: "/jobs",
  },
];

const tabDefinitions: TabDefinition[] = [
  { label: "All Applications", matches: () => true },
  {
    label: "Active Pipeline",
    matches: (record) =>
      record.status !== "rejected" && record.status !== "withdrawn",
  },
  {
    label: "Interviewing",
    matches: (record) => record.status === "interview_scheduled",
  },
  {
    label: "Offers",
    matches: (record) => record.status === "offer_received",
  },
  {
    label: "Closed",
    matches: (record) =>
      record.status === "rejected" || record.status === "withdrawn",
  },
];

function toTimestamp(isoDate: string) {
  return new Date(isoDate).getTime();
}

function formatDate(isoDate: string) {
  return DATE_FORMATTER.format(new Date(isoDate));
}

function toApplicationRecord(
  sourceRecord: SourceApplicationRecord,
): MyApplicationRecord {
  const statusMeta = STATUS_META[sourceRecord.status];

  return {
    id: sourceRecord.id,
    roleTitle: sourceRecord.roleTitle,
    company: sourceRecord.company,
    logoText: sourceRecord.logoText,
    logoClassName: sourceRecord.logoClassName,
    status: sourceRecord.status,
    statusLabel: statusMeta.label,
    statusTone: statusMeta.tone,
    location: sourceRecord.location,
    workMode: sourceRecord.workMode,
    employmentType: sourceRecord.employmentType,
    salaryRange: sourceRecord.salaryRange,
    nextStepLabel: sourceRecord.nextStepLabel ?? statusMeta.defaultNextStep,
    appliedAtLabel: formatDate(sourceRecord.appliedAt),
    appliedAtTimestamp: toTimestamp(sourceRecord.appliedAt),
    updatedAtLabel: formatDate(sourceRecord.updatedAt),
    updatedAtTimestamp: toTimestamp(sourceRecord.updatedAt),
    jobHref: sourceRecord.jobHref ?? "/jobs",
  };
}

function buildApplicationsByTab(records: SourceApplicationRecord[]) {
  return Object.fromEntries(
    tabDefinitions.map((tab) => {
      const tabRecords = records
        .filter(tab.matches)
        .map(toApplicationRecord)
        .sort((a, b) => b.updatedAtTimestamp - a.updatedAtTimestamp);
      return [tab.label, tabRecords];
    }),
  ) as Record<string, MyApplicationRecord[]>;
}

function buildHeroData(records: SourceApplicationRecord[]): MyApplicationsHeroProps {
  const totalApplications = records.length;
  const activeApplications = records.filter(
    (record) => record.status !== "rejected" && record.status !== "withdrawn",
  ).length;
  const interviewingCount = records.filter(
    (record) => record.status === "interview_scheduled",
  ).length;
  const offerCount = records.filter(
    (record) => record.status === "offer_received",
  ).length;
  const latestUpdatedAt = records
    .map((record) => toTimestamp(record.updatedAt))
    .reduce((maxTimestamp, timestamp) => Math.max(maxTimestamp, timestamp), 0);

  return {
    title: "Stay on top of every job application.",
    description:
      "Track where each application stands, identify your active pipeline, and focus your effort on interviews and offers.",
    lastUpdatedLabel: `Last updated: ${formatDate(new Date(latestUpdatedAt).toISOString())}`,
    stats: [
      {
        id: "total-applications",
        label: "Total Applications",
        value: `${totalApplications}`,
      },
      {
        id: "active-pipeline",
        label: "Active Pipeline",
        value: `${activeApplications}`,
      },
      {
        id: "interviewing",
        label: "Interviewing",
        value: `${interviewingCount}`,
      },
      {
        id: "offers",
        label: "Offers Received",
        value: `${offerCount}`,
      },
    ],
  };
}

function buildBoardData(records: SourceApplicationRecord[]): MyApplicationsBoardProps {
  return {
    title: "Applied Jobs",
    description:
      "Filter by stage, search quickly, and sort by activity to prioritize follow-ups.",
    tabs: tabDefinitions.map((tab) => tab.label),
    activeTab: "All Applications",
    applicationsByTab: buildApplicationsByTab(records),
    emptyMessage: "You do not have applications in this view yet.",
    sortLabel: "Sort By",
    filterLabel: "Filter",
    searchPlaceholder: "Search role, company, or location...",
  };
}

export async function getMyApplicationsPageData(): Promise<MyApplicationsPageData> {
  const records = sourceApplicationRecords;

  return {
    hero: buildHeroData(records),
    board: buildBoardData(records),
  };
}
