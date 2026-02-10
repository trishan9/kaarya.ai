import type { MockInterviewCardProps } from "../interview-hub/_components/mock-interview-card";
import type { MyInterviewsBoardProps } from "./_components/my-interviews-board";
import type { MyInterviewsHeroProps } from "./_components/my-interviews-hero";

type InterviewOwnership = "taken_by_me" | "created_by_me";
type InterviewState = "completed" | "scheduled" | "draft" | "published";

export type UserInterviewRecord = {
  id: string;
  title: string;
  company: string;
  categoryLabel: string;
  ownership: InterviewOwnership;
  state: InterviewState;
  createdAt: string;
  scheduledFor?: string;
  scoreValue?: number;
  participantCount: number;
  logoText: string;
  logoClassName?: string;
  stackTechnologies: MockInterviewCardProps["stackTechnologies"];
};

type MyInterviewsSectionData = Omit<MyInterviewsBoardProps, "description"> & {
  description: string;
};

export type MyInterviewsPageData = {
  hero: MyInterviewsHeroProps;
  board: MyInterviewsSectionData;
};

type TabDefinition = {
  label: string;
  matches: (record: UserInterviewRecord) => boolean;
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

function formatRatingBadge(rating: number) {
  if (rating >= 80) return "Excellent";
  if (rating >= 65) return "Good";
  if (rating >= 50) return "Needs Improvement";
  return "Below Average";
}

function formatRatingDescription(rating: number) {
  if (rating >= 80) {
    return "Your interview performance is strong and consistent. Keep sharpening with advanced role-specific mocks.";
  }

  if (rating >= 65) {
    return "You are progressing well with solid fundamentals. Regular practice can push you into top-tier interview readiness.";
  }

  if (rating >= 50) {
    return "Your baseline is improving, but consistency is still missing across rounds. Focus on structured practice and feedback loops.";
  }

  return "Your interview confidence needs more repetition. Practice targeted mocks and review your weak areas before real rounds.";
}

function getRecordActionLabels(record: UserInterviewRecord) {
  if (record.state === "completed") {
    return {
      primaryActionLabel: "Review Results",
      secondaryActionLabel: "Re-take",
    };
  }

  if (record.state === "scheduled") {
    return {
      primaryActionLabel: "Join Interview",
      secondaryActionLabel: "Reschedule",
    };
  }

  if (record.state === "draft") {
    return {
      primaryActionLabel: "Continue Setup",
    };
  }

  if (record.ownership === "created_by_me") {
    return {
      primaryActionLabel: "View Interview",
      secondaryActionLabel: "Edit",
    };
  }

  return {
    primaryActionLabel: "Take Interview",
  };
}

function getRecordDescription(record: UserInterviewRecord) {
  if (record.state === "completed") {
    return "Completed by you. Review AI feedback and repeat this interview to improve your score and confidence.";
  }

  if (record.state === "scheduled") {
    return "You have already scheduled this interview. Join on time and keep your setup ready for a smooth session.";
  }

  if (record.state === "draft") {
    return "This interview is still in draft mode. Add final questions and publish it when you're ready.";
  }

  if (record.ownership === "created_by_me") {
    return "Created by you and published. Track participation and iterate your question set from candidate feedback.";
  }

  return "Start your next mock interview session and receive instant AI evaluation on your responses.";
}

function toInterviewCard(record: UserInterviewRecord): MockInterviewCardProps {
  const eventTimestamp = toTimestamp(record.scheduledFor ?? record.createdAt);
  const eventLabelPrefix =
    record.state === "scheduled" ? "Scheduled for" : "Created on";
  const actionLabels = getRecordActionLabels(record);
  const attempted = record.state === "completed";

  return {
    id: record.id,
    title: record.title,
    company: record.company,
    categoryLabel: record.categoryLabel,
    takenCount: record.participantCount,
    takenCountLabel:
      record.ownership === "created_by_me"
        ? `${record.participantCount} attempts on your interview`
        : `${record.participantCount} people took this!`,
    createdAtLabel: `${eventLabelPrefix}: ${formatDate(record.scheduledFor ?? record.createdAt)}`,
    createdAtTimestamp: eventTimestamp,
    scoreLabel:
      record.scoreValue !== undefined
        ? `Your Score: ${record.scoreValue}/100`
        : "Your Score: -/100",
    scoreValue: record.scoreValue ?? null,
    description: getRecordDescription(record),
    attemptStatus: attempted ? "attempted" : "not_attempted",
    logoText: record.logoText,
    logoClassName: record.logoClassName,
    stackTechnologies: record.stackTechnologies,
    primaryActionLabel: actionLabels.primaryActionLabel,
    primaryActionHref: `/interviews/${record.id}`,
    secondaryActionLabel: actionLabels.secondaryActionLabel,
    secondaryActionHref: `/interviews/${record.id}`,
  };
}

function sortByMostRecent(records: UserInterviewRecord[]) {
  return [...records].sort((a, b) => {
    const aTimestamp = toTimestamp(a.scheduledFor ?? a.createdAt);
    const bTimestamp = toTimestamp(b.scheduledFor ?? b.createdAt);
    return bTimestamp - aTimestamp;
  });
}

const userInterviewRecords: UserInterviewRecord[] = [
  {
    id: "my-int-frontend-react-deep-dive",
    title: "Frontend React Deep-Dive",
    company: "Kaarya Co. Inc.",
    categoryLabel: "Technical",
    ownership: "taken_by_me",
    state: "completed",
    createdAt: "2026-01-29T10:30:00.000Z",
    scoreValue: 84,
    participantCount: 124,
    logoText: "K",
    logoClassName: "bg-primary",
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
      {
        id: "nextjs",
        name: "Next.js",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
      },
    ],
  },
  {
    id: "my-int-backend-node-round",
    title: "Node.js Backend Problem Solving",
    company: "OpenAI",
    categoryLabel: "Technical",
    ownership: "taken_by_me",
    state: "completed",
    createdAt: "2026-01-20T08:00:00.000Z",
    scoreValue: 77,
    participantCount: 89,
    logoText: "O",
    logoClassName: "bg-black",
    stackTechnologies: [
      {
        id: "nodejs",
        name: "Node.js",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
      },
      {
        id: "postgresql",
        name: "PostgreSQL",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
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
    id: "my-int-product-behavioral-round",
    title: "Product Behavioral Interview",
    company: "Meta",
    categoryLabel: "Behavioral",
    ownership: "taken_by_me",
    state: "scheduled",
    createdAt: "2026-02-01T09:00:00.000Z",
    scheduledFor: "2026-02-14T14:30:00.000Z",
    participantCount: 52,
    logoText: "M",
    logoClassName: "bg-[#0866ff]",
    stackTechnologies: [
      {
        id: "notion",
        name: "Notion",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/notion/notion-original.svg",
      },
      {
        id: "jira",
        name: "Jira",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg",
      },
    ],
  },
  {
    id: "my-int-system-design-saas",
    title: "System Design for SaaS Platforms",
    company: "By You",
    categoryLabel: "System Design",
    ownership: "created_by_me",
    state: "published",
    createdAt: "2026-01-26T12:15:00.000Z",
    participantCount: 41,
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
        id: "redis",
        name: "Redis",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",
      },
    ],
  },
  {
    id: "my-int-flutter-startup-kit",
    title: "Flutter Startup Hiring Screen",
    company: "By You",
    categoryLabel: "Mixed",
    ownership: "created_by_me",
    state: "draft",
    createdAt: "2026-02-06T11:00:00.000Z",
    participantCount: 0,
    logoText: "Y",
    logoClassName: "bg-[#14532d]",
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
  {
    id: "my-int-data-engineering-foundation",
    title: "Data Engineering Foundation Round",
    company: "By You",
    categoryLabel: "Technical",
    ownership: "created_by_me",
    state: "published",
    createdAt: "2026-01-12T09:00:00.000Z",
    participantCount: 67,
    logoText: "Y",
    logoClassName: "bg-[#14532d]",
    stackTechnologies: [
      {
        id: "python",
        name: "Python",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
      },
      {
        id: "mysql",
        name: "MySQL",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
      },
      {
        id: "airflow",
        name: "Airflow",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apacheairflow/apacheairflow-original.svg",
      },
    ],
  },
];

const tabDefinitions: TabDefinition[] = [
  {
    label: "All Interviews",
    matches: () => true,
  },
  {
    label: "Taken by Me",
    matches: (record) => record.ownership === "taken_by_me",
  },
  {
    label: "Created by Me",
    matches: (record) => record.ownership === "created_by_me",
  },
  {
    label: "Scheduled",
    matches: (record) => record.state === "scheduled",
  },
  {
    label: "Drafts",
    matches: (record) => record.state === "draft",
  },
];

function buildInterviewsByTab(records: UserInterviewRecord[]) {
  return Object.fromEntries(
    tabDefinitions.map((tab) => {
      const tabRecords = sortByMostRecent(records.filter(tab.matches)).map(
        toInterviewCard,
      );
      return [tab.label, tabRecords];
    }),
  ) as Record<string, MockInterviewCardProps[]>;
}

function buildHeroData(records: UserInterviewRecord[]): MyInterviewsHeroProps {
  const takenCount = records.filter(
    (record) => record.ownership === "taken_by_me",
  ).length;
  const createdCount = records.filter(
    (record) => record.ownership === "created_by_me",
  ).length;
  const completedScores = records
    .map((record) => record.scoreValue)
    .filter((score): score is number => score !== undefined);
  const averageScore =
    completedScores.length > 0
      ? Math.round(
          completedScores.reduce((sum, score) => sum + score, 0) /
            completedScores.length,
        )
      : 0;

  return {
    title: "Track every mock and custom interview in one place.",
    description:
      "Review interviews you've taken, manage interviews you've created, and keep your practice pipeline organized for upcoming opportunities.",
    stats: [
      { id: "total-interviews", label: "Total Interviews", value: `${records.length}` },
      { id: "taken-interviews", label: "Taken by Me", value: `${takenCount}` },
      { id: "created-interviews", label: "Created by Me", value: `${createdCount}` },
      {
        id: "average-score",
        label: "Average Score",
        value: `${averageScore}/100`,
      },
    ],
  };
}

function buildBoardData(records: UserInterviewRecord[]): MyInterviewsSectionData {
  const completedScores = records
    .map((record) => record.scoreValue)
    .filter((score): score is number => score !== undefined);
  const averageScore =
    completedScores.length > 0
      ? Math.round(
          completedScores.reduce((sum, score) => sum + score, 0) /
            completedScores.length,
        )
      : 0;

  return {
    title: "Interview Library",
    description:
      "Use tabs, sorting, and filters to quickly find completed mocks, drafts, and scheduled sessions.",
    tabs: tabDefinitions.map((tab) => tab.label),
    activeTab: "All Interviews",
    interviewsByTab: buildInterviewsByTab(records),
    showToolbar: true,
    sortLabel: "Sort By",
    filterLabel: "Filter",
    emptyMessage: "No interviews available in this category yet.",
    gridClassName: "md:grid-cols-2",
    sidePanelData: {
      title: "My Interview Rating",
      rating: averageScore,
      badgeLabel: formatRatingBadge(averageScore),
      description: formatRatingDescription(averageScore),
      suggestionTitle: "Our Suggestion",
      suggestionBody:
        "Create role-specific interviews and keep iterating. Repeated practice with feedback is the fastest path to better real-world interview performance.",
    },
    createButtonLabel: "Create Interview",
    createDialogTitle: "Create Your Interview",
    createDialogDescription:
      "Set up a custom interview template now. You can publish it immediately or keep it as a draft.",
    createFields: [
      {
        id: "interview-title",
        label: "Interview title",
        placeholder: "Example: Senior Frontend Architecture Round",
        required: true,
      },
      {
        id: "interview-role",
        label: "Role focus",
        placeholder: "Frontend Engineer, Product Manager, etc.",
        required: true,
      },
      {
        id: "interview-company",
        label: "Company name",
        placeholder: "Optional company or organization name",
      },
      {
        id: "interview-category",
        label: "Category",
        placeholder: "Technical, Mixed, Behavioral, System Design",
        required: true,
      },
      {
        id: "interview-duration",
        label: "Duration (minutes)",
        placeholder: "30",
        type: "number",
        required: true,
      },
      {
        id: "interview-question-count",
        label: "Questions",
        placeholder: "8",
        type: "number",
        required: true,
      },
    ],
    notesLabel: "Brief / Notes",
    notesPlaceholder:
      "Add context, candidate level, expected focus areas, and any scoring guidance for this interview.",
    saveDraftLabel: "Save as Draft",
    publishLabel: "Publish Interview",
  };
}

export async function getMyInterviewsPageData(): Promise<MyInterviewsPageData> {
  const records = userInterviewRecords;

  return {
    hero: buildHeroData(records),
    board: buildBoardData(records),
  };
}
