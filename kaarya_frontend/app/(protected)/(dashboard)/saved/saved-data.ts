import { getMyBookmarks } from "@/lib/actions/bookmark-actions";
import { formatRelativeTime } from "@/lib/date/relative-time";
import type { TInterview, TJob } from "@/lib/definitions";
import type { JobCardProps } from "../_components/job-card";
import type { MockInterviewCardProps } from "../interview-hub/_components/mock-interview-card";
import type { SavedBookmarksBoardProps } from "./_components/saved-bookmarks-board";
import type { SavedHeroProps } from "./_components/saved-hero";

type SavedJobRecord = {
  savedAt: string;
  job: TJob;
};

type SavedInterviewRecord = {
  savedAt: string;
  interview: TInterview & { viewerId?: string };
};

type TabDefinition<TRecord> = {
  label: string;
  matches: (record: TRecord) => boolean;
};

type SavedBoardData = Omit<SavedBookmarksBoardProps, "description"> & {
  description: string;
};

export type SavedPageData = {
  hero: SavedHeroProps;
  board: SavedBoardData;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  mixed: "Mixed",
  system_design: "System Design",
  custom: "Custom",
};

function toTimestamp(isoDate: string) {
  return new Date(isoDate).getTime();
}

function formatDate(isoDate: string) {
  return DATE_FORMATTER.format(new Date(isoDate));
}

function companyInitials(companyName?: string | null) {
  if (!companyName) return "K";
  const parts = companyName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return parts || companyName.slice(0, 1).toUpperCase();
}

function statusLabelByJobStatus(status?: string) {
  if (status === "closed") return "Closed Hiring";
  if (status === "draft") return "Draft";
  return "Open Hiring";
}

function statusToneByJobStatus(status?: string): JobCardProps["statusTone"] {
  if (status === "closed") return "warning";
  if (status === "draft") return "info";
  return "success";
}

function toInterviewTypeLabel(type: string) {
  return INTERVIEW_TYPE_LABELS[type] ?? "Mixed";
}

function withReturnTo(path: string, returnTo: string) {
  return `${path}${path.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(returnTo)}`;
}

function resolveFeedbackSessionId(interview: TInterview) {
  const evaluationSessionId = interview.myLatestEvaluation?.sessionId?.trim();
  if (evaluationSessionId) return evaluationSessionId;
  return null;
}

function mapSavedJobToCard(record: SavedJobRecord): JobCardProps {
  const job = record.job;
  const companyName = job.company?.name ?? job.college?.name ?? "Organization";
  const logoUrl = job.company?.logo ?? job.college?.logo ?? undefined;
  const hasApplied = Boolean(job.hasApplied);

  return {
    id: job.id,
    title: job.title,
    company: companyName,
    statusLabel: statusLabelByJobStatus(job.status),
    statusTone: statusToneByJobStatus(job.status),
    postedAt: `Saved ${formatRelativeTime(record.savedAt, {
      style: "compact",
      fallback: "just now",
    })}`,
    location: job.location || "Remote",
    employmentType: job.employmentType || "Full-Time",
    engagementType: job.engagementType || "Internship",
    salaryRange: job.salaryRange || "Compensation not specified",
    logoText: companyInitials(companyName),
    logoUrl,
    extraTags: [`${job.applicationsCount ?? 0} applicants`],
    applyLabel: hasApplied ? "View Application" : "Open Job",
    applyHref: hasApplied
      ? job.myApplicationId
        ? `/applications?application=${job.myApplicationId}`
        : "/applications"
      : `/jobs/${job.id}`,
    isBookmarked: true,
    showBookmark: true,
  };
}

function mapSavedInterviewToCard(
  record: SavedInterviewRecord,
): MockInterviewCardProps {
  const interview = record.interview;
  const attempted = Boolean(interview.myLatestSessionId);
  const feedbackSessionId = resolveFeedbackSessionId(interview);
  const hasFeedback = Boolean(feedbackSessionId);
  const scoreValue =
    typeof interview.myLatestScore === "number" ? interview.myLatestScore : null;
  const companyName =
    interview.company?.name ??
    interview.college?.name ??
    (interview.source === "candidate" ? "By Candidate" : "Kaarya");
  const logoUrl =
    interview.company?.logo ?? interview.college?.logo ?? "/kaarya.svg";

  return {
    id: interview.id,
    title: interview.title,
    company: companyName,
    categoryLabel: toInterviewTypeLabel(interview.interviewType),
    takenCount: interview.attemptsCount ?? 0,
    createdAtLabel: `Created on: ${formatDate(interview.createdAt)}`,
    createdAtTimestamp: toTimestamp(interview.createdAt),
    scoreLabel: attempted
      ? `Your Score: ${scoreValue ?? "-"}/100`
      : "Your Score: -/100",
    scoreValue,
    description: attempted && hasFeedback
      ? `Saved ${formatRelativeTime(record.savedAt, { style: "compact", fallback: "just now" })}. Review your previous attempt or retake to improve.`
      : `Saved ${formatRelativeTime(record.savedAt, { style: "compact", fallback: "just now" })}. Start this interview whenever you are ready.`,
    attemptStatus: attempted ? "attempted" : "not_attempted",
    logoText: companyInitials(companyName),
    logoUrl,
    stackTechnologies: [],
    primaryActionLabel: attempted && hasFeedback ? "Review Results" : "Take Interview",
    primaryActionHref: attempted && feedbackSessionId
      ? withReturnTo(`/interviews/sessions/${feedbackSessionId}/feedback`, "/saved")
      : withReturnTo(`/interviews/${interview.id}/take`, "/saved"),
    secondaryActionLabel: attempted && hasFeedback ? "Re-take" : undefined,
    secondaryActionHref: attempted && hasFeedback
      ? withReturnTo(`/interviews/${interview.id}/take`, "/saved")
      : undefined,
    isBookmarked: true,
  };
}

function normalizeSavedJobs(response: unknown): SavedJobRecord[] {
  const rows = Array.isArray((response as { data?: { jobs?: unknown } })?.data?.jobs)
    ? ((response as { data: { jobs: unknown[] } }).data.jobs as Array<{
        savedAt?: string;
        job?: TJob;
      }>)
    : [];

  return rows
    .map((row) => {
      const job = row.job;
      if (!job?.id || !row.savedAt) return null;
      return {
        savedAt: row.savedAt,
        job,
      };
    })
    .filter((row): row is SavedJobRecord => Boolean(row));
}

function normalizeSavedInterviews(response: unknown): SavedInterviewRecord[] {
  const rows = Array.isArray(
    (response as { data?: { interviews?: unknown } })?.data?.interviews,
  )
    ? ((response as { data: { interviews: unknown[] } }).data.interviews as Array<{
        savedAt?: string;
        interview?: TInterview & { viewerId?: string };
      }>)
    : [];

  return rows
    .map((row) => {
      const interview = row.interview;
      if (!interview?.id || !row.savedAt) return null;
      return {
        savedAt: row.savedAt,
        interview,
      };
    })
    .filter((row): row is SavedInterviewRecord => Boolean(row));
}

const jobTabDefinitions: TabDefinition<SavedJobRecord>[] = [
  { label: "All Saved", matches: () => true },
  {
    label: "Recently Saved",
    matches: (record) => Date.now() - toTimestamp(record.savedAt) <= 1000 * 60 * 60 * 24 * 14,
  },
  { label: "Open Roles", matches: (record) => record.job.status === "open" },
  {
    label: "Remote",
    matches: (record) =>
      record.job.workMode === "remote" ||
      record.job.engagementType.toLowerCase().includes("remote"),
  },
];

function buildInterviewTabs(viewerId?: string): TabDefinition<SavedInterviewRecord>[] {
  return [
    { label: "All Saved", matches: () => true },
    {
      label: "Attempted",
      matches: (record) => Boolean(record.interview.myLatestSessionId),
    },
    {
      label: "Not Attempted",
      matches: (record) => !record.interview.myLatestSessionId,
    },
    {
      label: "Created by Me",
      matches: (record) =>
        Boolean(viewerId) && record.interview.createdBy === viewerId,
    },
  ];
}

function buildJobsByTab(records: SavedJobRecord[]) {
  return Object.fromEntries(
    jobTabDefinitions.map((tab) => [
      tab.label,
      records
        .filter(tab.matches)
        .sort((a, b) => toTimestamp(b.savedAt) - toTimestamp(a.savedAt))
        .map(mapSavedJobToCard),
    ]),
  ) as Record<string, JobCardProps[]>;
}

function buildInterviewsByTab(
  records: SavedInterviewRecord[],
  tabs: TabDefinition<SavedInterviewRecord>[],
) {
  return Object.fromEntries(
    tabs.map((tab) => [
      tab.label,
      records
        .filter(tab.matches)
        .sort((a, b) => toTimestamp(b.savedAt) - toTimestamp(a.savedAt))
        .map(mapSavedInterviewToCard),
    ]),
  ) as Record<string, MockInterviewCardProps[]>;
}

function buildHeroData(
  jobRecords: SavedJobRecord[],
  interviewRecords: SavedInterviewRecord[],
  lastSavedAt?: string | null,
): SavedHeroProps {
  const totalSaved = jobRecords.length + interviewRecords.length;
  const latestSavedTimestamp = lastSavedAt
    ? toTimestamp(lastSavedAt)
    : [...jobRecords, ...interviewRecords]
        .map((record) => toTimestamp(record.savedAt))
        .reduce((max, timestamp) => Math.max(max, timestamp), 0);
  const attemptedInterviews = interviewRecords.filter((record) =>
    Boolean(record.interview.myLatestSessionId),
  ).length;

  return {
    title: "Your saved opportunities, neatly organized.",
    description:
      "Switch between jobs and interviews, filter what matters, and jump back in whenever you are ready.",
    lastUpdatedLabel:
      latestSavedTimestamp > 0
        ? `Last saved activity: ${formatDate(new Date(latestSavedTimestamp).toISOString())}`
        : "Last saved activity: -",
    stats: [
      { id: "total-saved", label: "Total Saved", value: `${totalSaved}` },
      { id: "saved-jobs", label: "Bookmarked Jobs", value: `${jobRecords.length}` },
      {
        id: "saved-interviews",
        label: "Saved Interviews",
        value: `${interviewRecords.length}`,
      },
      {
        id: "attempted-interviews",
        label: "Attempted Saved Interviews",
        value: `${attemptedInterviews}`,
      },
    ],
  };
}

function buildBoardData(
  jobRecords: SavedJobRecord[],
  interviewRecords: SavedInterviewRecord[],
): SavedBoardData {
  const viewerId = interviewRecords.find((record) => record.interview.viewerId)
    ?.interview.viewerId;
  const interviewTabs = buildInterviewTabs(viewerId);

  return {
    title: "Saved Bookmarks",
    description:
      "Browse your saved jobs and interviews, refine by tabs and filters, and remove items anytime.",
    searchPlaceholder: "Search saved jobs or interviews...",
    typeOptions: [
      { value: "jobs", label: "Jobs", count: jobRecords.length },
      { value: "interviews", label: "Interviews", count: interviewRecords.length },
    ],
    defaultType: "jobs",
    jobsSection: {
      title: "Bookmarked Jobs",
      tabs: jobTabDefinitions.map((tab) => tab.label),
      activeTab: "All Saved",
      jobsByTab: buildJobsByTab(jobRecords),
      showToolbar: true,
      sortLabel: "Sort By",
      filterLabel: "Filter",
      emptyMessage: "No saved jobs found for this category.",
      surface: "plain",
      gridClassName: "md:grid-cols-2 xl:grid-cols-3",
    },
    interviewsSection: {
      title: "Saved Mock Interviews",
      tabs: interviewTabs.map((tab) => tab.label),
      activeTab: "All Saved",
      interviewsByTab: buildInterviewsByTab(interviewRecords, interviewTabs),
      showToolbar: true,
      sortLabel: "Sort By",
      filterLabel: "Filter",
      emptyMessage: "No saved interviews found for this category.",
      gridClassName: "md:grid-cols-2",
    },
  };
}

export async function getSavedPageData(): Promise<SavedPageData> {
  const response = await getMyBookmarks({
    type: "all",
    sortBy: "saved_at_desc",
  });

  const savedJobs = normalizeSavedJobs(response);
  const savedInterviews = normalizeSavedInterviews(response);
  const lastSavedAt =
    typeof response?.data?.lastSavedAt === "string" ? response.data.lastSavedAt : null;

  return {
    hero: buildHeroData(savedJobs, savedInterviews, lastSavedAt),
    board: buildBoardData(savedJobs, savedInterviews),
  };
}
