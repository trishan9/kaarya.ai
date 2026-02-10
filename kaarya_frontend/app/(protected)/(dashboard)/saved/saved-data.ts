import type { JobCardProps } from "../_components/job-card";
import type { MockInterviewCardProps } from "../interview-hub/_components/mock-interview-card";
import type { SavedBookmarksBoardProps } from "./_components/saved-bookmarks-board";
import type { SavedHeroProps } from "./_components/saved-hero";

type SavedJobRecord = {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  engagementType: "Remote" | "Hybrid" | "On-site";
  salaryRange: string;
  logoText: string;
  logoClassName?: string;
  matchScore: number;
  hiringPriority: "normal" | "urgent";
  savedAt: string;
};

type SavedInterviewRecord = {
  id: string;
  title: string;
  company: string;
  categoryLabel: string;
  ownership: "taken_by_me" | "created_by_me";
  createdAt: string;
  savedAt: string;
  takenCount: number;
  scoreValue?: number;
  logoText: string;
  logoClassName?: string;
  stackTechnologies: MockInterviewCardProps["stackTechnologies"];
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

function toTimestamp(isoDate: string) {
  return new Date(isoDate).getTime();
}

function formatDate(isoDate: string) {
  return DATE_FORMATTER.format(new Date(isoDate));
}

function formatRelativeDays(isoDate: string) {
  const diffInMs = Date.now() - toTimestamp(isoDate);
  const days = Math.max(1, Math.floor(diffInMs / (1000 * 60 * 60 * 24)));
  return `${days}d ago`;
}

function mapSavedJobToCard(record: SavedJobRecord): JobCardProps {
  const statusLabel =
    record.matchScore >= 85
      ? "Top Match"
      : record.hiringPriority === "urgent"
        ? "Urgent Hiring"
        : "Still Hiring";

  const statusTone =
    record.matchScore >= 85
      ? "success"
      : record.hiringPriority === "urgent"
        ? "warning"
        : "info";

  return {
    id: record.id,
    title: record.title,
    company: record.company,
    statusLabel,
    statusTone,
    postedAt: `Saved ${formatRelativeDays(record.savedAt)}`,
    location: record.location,
    employmentType: record.employmentType,
    engagementType: record.engagementType,
    salaryRange: record.salaryRange,
    logoText: record.logoText,
    logoClassName: record.logoClassName,
    extraTags: [`${record.matchScore}% match`],
    applyLabel: "Open Job",
    applyHref: `/jobs/${record.id}`,
  };
}

function mapSavedInterviewToCard(record: SavedInterviewRecord): MockInterviewCardProps {
  const attempted = record.scoreValue !== undefined;

  return {
    id: record.id,
    title: record.title,
    company: record.company,
    categoryLabel: record.categoryLabel,
    takenCount: record.takenCount,
    createdAtLabel: `Created on: ${formatDate(record.createdAt)}`,
    createdAtTimestamp: toTimestamp(record.createdAt),
    scoreLabel: attempted ? `Your Score: ${record.scoreValue}/100` : "Your Score: -/100",
    scoreValue: record.scoreValue ?? null,
    description: attempted
      ? `Bookmarked ${formatRelativeDays(record.savedAt)}. Revisit this interview to improve your performance even further.`
      : `Bookmarked ${formatRelativeDays(record.savedAt)}. You can start this interview anytime from your saved list.`,
    attemptStatus: attempted ? "attempted" : "not_attempted",
    logoText: record.logoText,
    logoClassName: record.logoClassName,
    stackTechnologies: record.stackTechnologies,
    primaryActionLabel: attempted ? "Review Results" : "Take Interview",
    primaryActionHref: `/interview-hub/${record.id}`,
    secondaryActionLabel:
      record.ownership === "created_by_me"
        ? "Edit"
        : attempted
          ? "Re-take"
          : undefined,
    secondaryActionHref: `/interview-hub/${record.id}`,
  };
}

const savedJobs: SavedJobRecord[] = [
  {
    id: "saved-job-frontend-platform-openai",
    title: "Frontend Platform Engineer",
    company: "OpenAI",
    location: "San Francisco, CA",
    employmentType: "Full-Time",
    engagementType: "Hybrid",
    salaryRange: "$170k - $230k",
    logoText: "O",
    logoClassName: "bg-black",
    matchScore: 92,
    hiringPriority: "normal",
    savedAt: "2026-02-07T09:30:00.000Z",
  },
  {
    id: "saved-job-fullstack-kaarya",
    title: "Full-Stack Developer",
    company: "Kaarya Co. Inc.",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Remote",
    salaryRange: "NPR 18,00,000 - NPR 24,00,000",
    logoText: "K",
    logoClassName: "bg-primary",
    matchScore: 88,
    hiringPriority: "urgent",
    savedAt: "2026-02-05T11:00:00.000Z",
  },
  {
    id: "saved-job-react-google",
    title: "React Engineer",
    company: "Google",
    location: "New York, NY",
    employmentType: "Full-Time",
    engagementType: "On-site",
    salaryRange: "$160k - $220k",
    logoText: "G",
    logoClassName: "bg-white text-[#4285f4] border border-[#d7e1f4]",
    matchScore: 79,
    hiringPriority: "normal",
    savedAt: "2026-01-29T10:00:00.000Z",
  },
  {
    id: "saved-job-mobile-stripe",
    title: "Mobile Engineer",
    company: "Stripe",
    location: "Dublin, Ireland",
    employmentType: "Full-Time",
    engagementType: "Remote",
    salaryRange: "EUR 95k - EUR 125k",
    logoText: "S",
    logoClassName: "bg-[#635bff]",
    matchScore: 84,
    hiringPriority: "urgent",
    savedAt: "2026-01-24T08:00:00.000Z",
  },
];

const savedInterviews: SavedInterviewRecord[] = [
  {
    id: "saved-int-react-architecture",
    title: "React Architecture Interview",
    company: "OpenAI",
    categoryLabel: "Technical",
    ownership: "taken_by_me",
    createdAt: "2026-01-20T09:00:00.000Z",
    savedAt: "2026-02-08T15:00:00.000Z",
    takenCount: 146,
    scoreValue: 86,
    logoText: "O",
    logoClassName: "bg-black",
    stackTechnologies: [
      {
        id: "react",
        name: "React",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
      },
      {
        id: "typescript",
        name: "TypeScript",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
      },
    ],
  },
  {
    id: "saved-int-system-design",
    title: "System Design Round for Scale",
    company: "By You",
    categoryLabel: "System Design",
    ownership: "created_by_me",
    createdAt: "2026-01-12T14:15:00.000Z",
    savedAt: "2026-02-06T09:00:00.000Z",
    takenCount: 59,
    logoText: "Y",
    logoClassName: "bg-[#14532d]",
    stackTechnologies: [
      {
        id: "aws",
        name: "AWS",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
      },
      {
        id: "docker",
        name: "Docker",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
      },
    ],
  },
  {
    id: "saved-int-behavioral-meta",
    title: "Behavioral Interview Preparation",
    company: "Meta",
    categoryLabel: "Behavioral",
    ownership: "taken_by_me",
    createdAt: "2026-01-27T12:00:00.000Z",
    savedAt: "2026-02-03T12:20:00.000Z",
    takenCount: 73,
    logoText: "M",
    logoClassName: "bg-[#0866ff]",
    stackTechnologies: [
      {
        id: "notion",
        name: "Notion",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/notion/notion-original.svg",
      },
    ],
  },
  {
    id: "saved-int-flutter-mock",
    title: "Flutter Mobile Fundamentals",
    company: "Kaarya Co. Inc.",
    categoryLabel: "Mixed",
    ownership: "taken_by_me",
    createdAt: "2026-01-30T10:45:00.000Z",
    savedAt: "2026-01-30T10:50:00.000Z",
    takenCount: 91,
    logoText: "K",
    logoClassName: "bg-primary",
    stackTechnologies: [
      {
        id: "flutter",
        name: "Flutter",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
      },
      {
        id: "firebase",
        name: "Firebase",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",
      },
    ],
  },
];

const jobTabDefinitions: TabDefinition<SavedJobRecord>[] = [
  { label: "All Saved", matches: () => true },
  {
    label: "Recently Saved",
    matches: (record) => Date.now() - toTimestamp(record.savedAt) <= 1000 * 60 * 60 * 24 * 14,
  },
  { label: "High Match", matches: (record) => record.matchScore >= 85 },
  { label: "Remote", matches: (record) => record.engagementType === "Remote" },
];

const interviewTabDefinitions: TabDefinition<SavedInterviewRecord>[] = [
  { label: "All Saved", matches: () => true },
  {
    label: "Taken by Me",
    matches: (record) => record.ownership === "taken_by_me",
  },
  {
    label: "Created by Me",
    matches: (record) => record.ownership === "created_by_me",
  },
  {
    label: "Not Attempted",
    matches: (record) => record.scoreValue === undefined,
  },
];

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

function buildInterviewsByTab(records: SavedInterviewRecord[]) {
  return Object.fromEntries(
    interviewTabDefinitions.map((tab) => [
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
): SavedHeroProps {
  const totalSaved = jobRecords.length + interviewRecords.length;
  const latestSavedTimestamp = [...jobRecords, ...interviewRecords]
    .map((record) => toTimestamp(record.savedAt))
    .reduce((max, timestamp) => Math.max(max, timestamp), 0);

  return {
    title: "All your saved opportunities in one place.",
    description:
      "Switch between jobs and interviews, review your bookmarked items, and jump back into opportunities that matter most.",
    lastUpdatedLabel: `Last saved activity: ${formatDate(new Date(latestSavedTimestamp).toISOString())}`,
    stats: [
      { id: "total-saved", label: "Total Saved", value: `${totalSaved}` },
      { id: "saved-jobs", label: "Bookmarked Jobs", value: `${jobRecords.length}` },
      {
        id: "saved-interviews",
        label: "Saved Interviews",
        value: `${interviewRecords.length}`,
      },
      { id: "top-match-jobs", label: "Top Match Jobs", value: `${jobRecords.filter((job) => job.matchScore >= 85).length}` },
    ],
  };
}

function buildBoardData(
  jobRecords: SavedJobRecord[],
  interviewRecords: SavedInterviewRecord[],
): SavedBoardData {
  return {
    title: "Saved Bookmarks",
    description:
      "Select a category to browse your bookmarked jobs or interviews. Search and refine by tabs, sort, and filters.",
    searchPlaceholder: "Search saved jobs or interviews...",
    typeOptions: [
      { value: "jobs", label: "Jobs", count: jobRecords.length },
      {
        value: "interviews",
        label: "Interviews",
        count: interviewRecords.length,
      },
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
      title: "Bookmarked Mock Interviews",
      tabs: interviewTabDefinitions.map((tab) => tab.label),
      activeTab: "All Saved",
      interviewsByTab: buildInterviewsByTab(interviewRecords),
      showToolbar: true,
      sortLabel: "Sort By",
      filterLabel: "Filter",
      emptyMessage: "No saved interviews found for this category.",
      gridClassName: "md:grid-cols-2",
    },
  };
}

export async function getSavedPageData(): Promise<SavedPageData> {
  return {
    hero: buildHeroData(savedJobs, savedInterviews),
    board: buildBoardData(savedJobs, savedInterviews),
  };
}
