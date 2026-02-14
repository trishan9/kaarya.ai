import { getMyApplications } from "@/lib/actions/job-actions";
import type { MyApplicationsBoardProps } from "./_components/my-applications-board";
import type {
  ApplicationStatus,
  MyApplicationRecord,
} from "./_components/my-applications-board";
import type { MyApplicationsHeroProps } from "./_components/my-applications-hero";

type SourceApplicationRecord = {
  id: string;
  jobId: string;
  roleTitle: string;
  company: string;
  logoText: string;
  logoUrl?: string;
  logoClassName?: string;
  status: ApplicationStatus;
  location: string;
  workMode: MyApplicationRecord["workMode"];
  employmentType: MyApplicationRecord["employmentType"];
  salaryRange: string;
  level?: string;
  experience?: string;
  jobType?: string;
  workType?: string;
  appliedAt: string;
  updatedAt: string;
  nextStepLabel?: string;
  jobHref?: string;
  timeline: MyApplicationRecord["timeline"];
  description?: string;
  qualifications?: string[];
  companyProfile?: MyApplicationRecord["companyProfile"];
  resume?: MyApplicationRecord["resume"];
  resumeActivity?: MyApplicationRecord["resumeActivity"];
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
    label: "Waiting for Approval",
    tone: "info",
    defaultNextStep: "Waiting for recruiter approval",
  },
  reviewing: {
    label: "Under Review",
    tone: "warning",
    defaultNextStep: "Hiring team is reviewing your profile",
  },
  shortlisted: {
    label: "Shortlisted",
    tone: "success",
    defaultNextStep: "Expect interview scheduling update",
  },
  interview_scheduled: {
    label: "Interview Invited",
    tone: "info",
    defaultNextStep: "Prepare for your upcoming interview",
  },
  accepted: {
    label: "Accepted",
    tone: "success",
    defaultNextStep: "Offer accepted",
  },
  rejected: {
    label: "Rejected",
    tone: "destructive",
    defaultNextStep: "Application closed",
  },
  withdrawn: {
    label: "Rejected",
    tone: "neutral",
    defaultNextStep: "Application withdrawn",
  },
};

const tabDefinitions: TabDefinition[] = [
  { label: "All Applications", matches: () => true },
  {
    label: "Screening",
    matches: (record) =>
      record.status === "applied" ||
      record.status === "reviewing" ||
      record.status === "shortlisted",
  },
  {
    label: "Interview",
    matches: (record) => record.status === "interview_scheduled",
  },
  {
    label: "Offering",
    matches: (record) => record.status === "accepted",
  },
  {
    label: "Rejected",
    matches: (record) =>
      record.status === "rejected" || record.status === "withdrawn",
  },
];

const asString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];

const mapStatus = (value: unknown): ApplicationStatus => {
  const normalized = asString(value)?.toLowerCase();
  if (
    normalized === "applied" ||
    normalized === "reviewing" ||
    normalized === "shortlisted" ||
    normalized === "interview_scheduled" ||
    normalized === "accepted" ||
    normalized === "rejected" ||
    normalized === "withdrawn"
  ) {
    return normalized;
  }
  return "applied";
};

const toTimestamp = (isoDate: string) => new Date(isoDate).getTime();
const formatDate = (isoDate: string) => DATE_FORMATTER.format(new Date(isoDate));

const workModeLabel = (value: unknown): MyApplicationRecord["workMode"] => {
  const normalized = asString(value)?.toLowerCase();
  if (normalized === "onsite") return "On-site";
  if (normalized === "hybrid") return "Hybrid";
  return "Remote";
};

const employmentTypeLabel = (
  value: unknown,
): MyApplicationRecord["employmentType"] => {
  const normalized = asString(value)?.toLowerCase();
  if (normalized === "part-time") return "Part-Time";
  if (normalized === "internship") return "Internship";
  if (normalized === "contract") return "Contract";
  return "Full-Time";
};

const companyInitials = (companyName?: string | null) => {
  if (!companyName) return "C";
  const parts = companyName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return parts || companyName.slice(0, 1).toUpperCase();
};

const parseTimeline = (value: unknown): MyApplicationRecord["timeline"] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const key = asString((entry as { key?: unknown }).key);
      const label = asString((entry as { label?: unknown }).label);
      if (!key || !label) return null;
      return {
        key,
        label,
        reached: Boolean((entry as { reached?: unknown }).reached),
        isCurrent: Boolean((entry as { isCurrent?: unknown }).isCurrent),
        at: asString((entry as { at?: unknown }).at) ?? null,
      };
    })
    .filter(Boolean) as MyApplicationRecord["timeline"];
};

const fallbackTimeline = (
  status: ApplicationStatus,
  appliedAt: string,
): MyApplicationRecord["timeline"] => {
  const defaultSteps = [
    { key: "submitted", label: "Application Submitted" },
    { key: "screening", label: "Application Screening" },
    { key: "hr_interview", label: "HR Interview" },
    { key: "assessment", label: "Assessment" },
    { key: "second_interview", label: "Second Interview" },
    { key: "offering", label: "Offering" },
    { key: "accepted", label: "Accepted" },
  ];

  const stageByStatus: Record<ApplicationStatus, number> = {
    applied: 0,
    reviewing: 1,
    shortlisted: 1,
    interview_scheduled: 2,
    accepted: 6,
    rejected: 0,
    withdrawn: 0,
  };
  const currentStage = stageByStatus[status];

  return defaultSteps.map((step, index) => ({
    key: step.key,
    label: step.label,
    reached: index <= currentStage,
    isCurrent: index === currentStage,
    at: index === 0 ? appliedAt : null,
  }));
};

const toSourceRecords = (response: any): SourceApplicationRecord[] => {
  const rawApplications = Array.isArray(response?.data?.applications)
    ? response.data.applications
    : [];

  return rawApplications
    .map((raw: any) => {
      const applicationId = asString(raw?.id) ?? asString(raw?._id);
      const job = raw?.job && typeof raw.job === "object" ? raw.job : null;
      const jobId = asString(job?.id) ?? asString(raw?.jobId);
      if (!applicationId || !jobId) return null;

      const status = mapStatus(raw?.status);
      const companyName = asString(job?.company?.name) ?? "Company";
      const companyId =
        asString(job?.company?.id) ?? asString(job?.companyId) ?? undefined;
      const companyLogo = asString(job?.company?.logo) ?? undefined;
      const location = asString(job?.location) ?? "Remote";
      const appliedAt = asString(raw?.createdAt) ?? new Date().toISOString();
      const updatedAt = asString(raw?.updatedAt) ?? appliedAt;
      const requirements =
        job?.requirements && typeof job.requirements === "object"
          ? (job.requirements as Record<string, unknown>)
          : {};
      const timeline = parseTimeline(raw?.timeline);

      return {
        id: applicationId,
        jobId,
        roleTitle: asString(job?.title) ?? "Job Role",
        company: companyName,
        logoText: companyInitials(companyName),
        logoUrl: companyLogo,
        logoClassName: undefined,
        status,
        location,
        workMode: workModeLabel(job?.workMode),
        employmentType: employmentTypeLabel(job?.employmentType),
        salaryRange:
          asString(job?.salaryRange) ?? "Compensation not specified",
        level: asString(requirements.level) ?? undefined,
        experience: asString(requirements.experience) ?? undefined,
        jobType: employmentTypeLabel(job?.employmentType),
        workType: workModeLabel(job?.workMode),
        appliedAt,
        updatedAt,
        nextStepLabel: asString(raw?.nextStepLabel) ?? undefined,
        jobHref: `/jobs/${jobId}`,
        timeline: timeline.length > 0 ? timeline : fallbackTimeline(status, appliedAt),
        description: asString(job?.description) ?? undefined,
        qualifications: asStringArray(requirements.qualifications),
        companyProfile: {
          id: companyId,
          name: companyName,
          location: asString(requirements.companyLocation) ?? location,
          industry: asString(requirements.industry) ?? "Technology",
          companySize: asString(requirements.companySize) ?? undefined,
          description: asString(requirements.companyDescription) ?? undefined,
          logoUrl: companyLogo,
          profileHref: companyId
            ? `/companies/${companyId}?from=${encodeURIComponent("/applications")}`
            : undefined,
        },
        resume:
          raw?.resume && typeof raw.resume === "object"
            ? {
                fileName: asString(raw.resume.fileName) ?? undefined,
                previewUrl: asString(raw.resume.previewUrl) ?? undefined,
                downloadUrl: asString(raw.resume.downloadUrl) ?? undefined,
              }
            : undefined,
        resumeActivity:
          raw?.resumeActivity && typeof raw.resumeActivity === "object"
            ? {
                viewedAt:
                  asString((raw.resumeActivity as { viewedAt?: unknown }).viewedAt) ??
                  null,
                downloadedAt:
                  asString(
                    (raw.resumeActivity as { downloadedAt?: unknown }).downloadedAt,
                  ) ?? null,
                viewCount:
                  typeof (raw.resumeActivity as { viewCount?: unknown }).viewCount ===
                  "number"
                    ? (raw.resumeActivity as { viewCount: number }).viewCount
                    : 0,
                downloadCount:
                  typeof (raw.resumeActivity as { downloadCount?: unknown })
                    .downloadCount === "number"
                    ? (raw.resumeActivity as { downloadCount: number }).downloadCount
                    : 0,
              }
            : undefined,
      } satisfies SourceApplicationRecord;
    })
    .filter(Boolean) as SourceApplicationRecord[];
};

const toApplicationRecord = (
  sourceRecord: SourceApplicationRecord,
): MyApplicationRecord => {
  const statusMeta = STATUS_META[sourceRecord.status];

  return {
    id: sourceRecord.id,
    jobId: sourceRecord.jobId,
    roleTitle: sourceRecord.roleTitle,
    company: sourceRecord.company,
    logoText: sourceRecord.logoText,
    logoUrl: sourceRecord.logoUrl,
    logoClassName: sourceRecord.logoClassName,
    status: sourceRecord.status,
    statusLabel: statusMeta.label,
    statusTone: statusMeta.tone,
    location: sourceRecord.location,
    workMode: sourceRecord.workMode,
    employmentType: sourceRecord.employmentType,
    salaryRange: sourceRecord.salaryRange,
    level: sourceRecord.level,
    experience: sourceRecord.experience,
    jobType: sourceRecord.jobType,
    workType: sourceRecord.workType,
    nextStepLabel: sourceRecord.nextStepLabel ?? statusMeta.defaultNextStep,
    appliedAtLabel: formatDate(sourceRecord.appliedAt),
    appliedAtTimestamp: toTimestamp(sourceRecord.appliedAt),
    updatedAtLabel: formatDate(sourceRecord.updatedAt),
    updatedAtTimestamp: toTimestamp(sourceRecord.updatedAt),
    jobHref: sourceRecord.jobHref ?? `/jobs/${sourceRecord.jobId}`,
    timeline: sourceRecord.timeline,
    description: sourceRecord.description,
    qualifications: sourceRecord.qualifications,
    companyProfile: sourceRecord.companyProfile,
    resume: sourceRecord.resume,
    resumeActivity: sourceRecord.resumeActivity,
  };
};

const buildApplicationsByTab = (records: SourceApplicationRecord[]) =>
  Object.fromEntries(
    tabDefinitions.map((tab) => {
      const tabRecords = records
        .filter(tab.matches)
        .map(toApplicationRecord)
        .sort((a, b) => b.updatedAtTimestamp - a.updatedAtTimestamp);
      return [tab.label, tabRecords];
    }),
  ) as Record<string, MyApplicationRecord[]>;

const buildHeroData = (records: SourceApplicationRecord[]): MyApplicationsHeroProps => {
  const totalApplications = records.length;
  const activeApplications = records.filter(
    (record) =>
      record.status !== "rejected" && record.status !== "withdrawn",
  ).length;
  const interviewingCount = records.filter(
    (record) => record.status === "interview_scheduled",
  ).length;
  const offerCount = records.filter(
    (record) => record.status === "accepted",
  ).length;
  const latestUpdatedAt = records
    .map((record) => toTimestamp(record.updatedAt))
    .reduce((maxTimestamp, timestamp) => Math.max(maxTimestamp, timestamp), 0);

  return {
    title: "Track Your Job Applications",
    description:
      "Monitor every stage of your applications, from screening to interview and final decision.",
    lastUpdatedLabel: `Last updated: ${formatDate(new Date(latestUpdatedAt || Date.now()).toISOString())}`,
    stats: [
      {
        id: "total-applications",
        label: "Submissions",
        value: `${totalApplications}`,
      },
      {
        id: "active-pipeline",
        label: "In Progress",
        value: `${activeApplications}`,
      },
      {
        id: "interviewing",
        label: "Interview",
        value: `${interviewingCount}`,
      },
      {
        id: "offers",
        label: "Accepted",
        value: `${offerCount}`,
      },
    ],
  };
};

const buildBoardData = (
  records: SourceApplicationRecord[],
  initialApplicationId?: string | null,
): MyApplicationsBoardProps => ({
  title: "My Applications",
  description:
    "Filter by stage, search applications, and open any application for complete hiring-process details.",
  tabs: tabDefinitions.map((tab) => tab.label),
  activeTab: "All Applications",
  applicationsByTab: buildApplicationsByTab(records),
  emptyMessage: "You do not have applications in this view yet.",
  sortLabel: "Sort By",
  filterLabel: "Filter",
  searchPlaceholder: "Search role, company, or location...",
  initialApplicationId,
});

export async function getMyApplicationsPageData(options?: {
  initialApplicationId?: string | null;
}): Promise<MyApplicationsPageData> {
  const response = await getMyApplications({
    page: 1,
    size: 100,
  });

  const records = response?.success ? toSourceRecords(response) : [];

  return {
    hero: buildHeroData(records),
    board: buildBoardData(records, options?.initialApplicationId ?? null),
  };
}
