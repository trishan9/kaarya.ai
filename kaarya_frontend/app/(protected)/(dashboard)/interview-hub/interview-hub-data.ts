import { listInterviews } from "@/lib/actions/interview-actions";
import { getCurrentUser } from "@/lib/dal";
import { Role, type TInterview } from "@/lib/definitions";
import type { AIInterviewHubHeroProps } from "./_components/ai-interview-hub-hero";
import type { MockInterviewCardProps } from "./_components/mock-interview-card";
import type {
  MockInterviewRecommendationsCardProps,
} from "./_components/mock-interview-recommendations-card";

type InterviewHubSectionData = Pick<
  MockInterviewRecommendationsCardProps,
  | "title"
  | "tabs"
  | "activeTab"
  | "interviewsByTab"
  | "showToolbar"
  | "sortLabel"
  | "filterLabel"
  | "gridClassName"
>;

export type InterviewHubPageData = {
  hero: AIInterviewHubHeroProps;
  interviewsSection: InterviewHubSectionData;
};

const DEFAULT_DATA: InterviewHubPageData = {
  hero: {
    title: "Simulate industry-level interviews with AI.",
    description:
      "Get interview ready on your targeted roles with AI mock interviews. Practice on real interview questions and get instant feedback to improve your skills.",
  },
  interviewsSection: {
    title: "Mock Interviews",
    tabs: [
      "For You",
      "Trending Interviews",
      "New This Week",
      "All Time Popular",
      "By You",
    ],
    activeTab: "For You",
    interviewsByTab: {
      "For You": [],
      "Trending Interviews": [],
      "New This Week": [],
      "All Time Popular": [],
      "By You": [],
    },
    showToolbar: true,
    sortLabel: "Sort By",
    filterLabel: "Filter",
    gridClassName: "md:grid-cols-2",
  },
};

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  mixed: "Mixed",
  system_design: "System Design",
  custom: "Custom",
};

const TECH_ICON_MAP: Record<string, string> = {
  react: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  typescript:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  javascript:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  node: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  nest: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-plain.svg",
  flutter:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
  dart: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg",
  firebase:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",
  next: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
  mongodb:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
  postgresql:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
  mysql: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
  docker:
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
};

const toDateLabel = (value?: string | null) => {
  if (!value) return "Created on: -";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Created on: -";
  return `Created on: ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
};

const toInterviewTypeLabel = (type: string) =>
  INTERVIEW_TYPE_LABELS[type] ?? "Mixed";

const toCompanyLabel = (interview: TInterview) =>
  interview.company?.name ??
  interview.college?.name ??
  (interview.source === "candidate" ? "By Candidate" : "Kaarya");

const resolveInterviewLogoUrl = (interview: TInterview) => {
  if (interview.source === "company") {
    return interview.company?.logo || "/kaarya.svg";
  }
  if (interview.source === "college") {
    return interview.college?.logo || "/kaarya.svg";
  }
  return "/kaarya.svg";
};

const toLogoText = (label: string) =>
  label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "K";

const toStackIcons = (techStack: string[]) =>
  techStack
    .slice(0, 3)
    .map((technology) => {
      const key = technology.trim().toLowerCase();
      const mappedKey = Object.keys(TECH_ICON_MAP).find((candidate) =>
        key.includes(candidate),
      );
      if (!mappedKey) return null;
      return {
        id: `${key}-${mappedKey}`,
        name: technology,
        iconUrl: TECH_ICON_MAP[mappedKey],
      };
    })
    .filter(Boolean) as NonNullable<MockInterviewCardProps["stackTechnologies"]>;

const withReturnTo = (path: string, returnTo: string) =>
  `${path}${path.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(returnTo)}`;

const toCard = (
  interview: TInterview,
  options?: {
    canTakeInterview?: boolean;
    viewerId?: string | null;
    returnTo?: string;
  },
): MockInterviewCardProps => {
  const canTakeInterview = options?.canTakeInterview === true;
  const isViewerCreator =
    options?.viewerId && interview.createdBy === options.viewerId;
  const returnTo = options?.returnTo ?? "/interview-hub";
  const company = toCompanyLabel(interview);
  const attempted = canTakeInterview && Boolean(interview.myLatestSessionId);
  const scoreValue =
    canTakeInterview && typeof interview.myLatestScore === "number"
      ? interview.myLatestScore
      : null;
  const scoreLabel =
    typeof scoreValue === "number"
      ? `Your Score: ${scoreValue}/100`
      : canTakeInterview
        ? "Your Score: -/100"
        : "Participant Score: -/100";

  return {
    id: interview.id,
    title: interview.title,
    company,
    categoryLabel: toInterviewTypeLabel(interview.interviewType),
    takenCount: interview.attemptsCount ?? 0,
    createdAtLabel: toDateLabel(interview.createdAt),
    createdAtTimestamp: new Date(interview.createdAt).getTime() || Date.now(),
    scoreLabel,
    scoreValue,
    description: canTakeInterview
      ? attempted
        ? "You've already taken this interview. Revisit your results anytime and keep improving."
        : "You haven't attempted this interview yet. Start now and get AI-driven feedback."
      : "Manage this interview and review participant feedback from the details page.",
    attemptStatus: attempted ? "attempted" : "not_attempted",
    logoText: toLogoText(company),
    logoUrl: resolveInterviewLogoUrl(interview),
    stackTechnologies: toStackIcons(interview.techStack ?? []),
    primaryActionLabel: canTakeInterview
      ? attempted
        ? "Review Results"
        : "Take Interview"
      : isViewerCreator
        ? "Manage Interview"
        : "View Interview",
    primaryActionHref: canTakeInterview
      ? attempted && interview.myLatestSessionId
        ? withReturnTo(`/interviews/sessions/${interview.myLatestSessionId}/feedback`, returnTo)
        : withReturnTo(`/interviews/${interview.id}/take`, returnTo)
      : `/interviews/${interview.id}`,
    secondaryActionLabel: canTakeInterview && attempted ? "Re-take" : undefined,
    secondaryActionHref:
      canTakeInterview && attempted
        ? withReturnTo(`/interviews/${interview.id}/take`, returnTo)
        : undefined,
  };
};

const extractInterviews = (response: any): TInterview[] =>
  Array.isArray(response?.data?.interviews) ? (response.data.interviews as TInterview[]) : [];

export async function getInterviewHubPageData(): Promise<InterviewHubPageData> {
  const currentUser = await getCurrentUser();
  const canTakeInterview =
    currentUser?.role === Role.USER || currentUser?.role === Role.STUDENT;
  const [forYouResponse, trendingResponse, byYouResponse] =
    await Promise.all([
    listInterviews({ page: 1, size: 20, ownership: "all", sortBy: "newest" }),
    listInterviews({ page: 1, size: 20, ownership: "all", sortBy: "popular" }),
    listInterviews({ page: 1, size: 20, ownership: "created_by_me", sortBy: "updated" }),
    ]);

  if (
    !forYouResponse?.success &&
    !trendingResponse?.success &&
    !byYouResponse?.success
  ) {
    return DEFAULT_DATA;
  }

  const forYou = extractInterviews(forYouResponse);
  const trending = extractInterviews(trendingResponse);
  const byYou = extractInterviews(byYouResponse);
  const newThisWeek = [...forYou]
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime() || 0;
      const rightTime = new Date(right.createdAt).getTime() || 0;
      return rightTime - leftTime;
    })
    .slice(0, 20);
  const popularAllTime = [...trending];

  return {
    hero: DEFAULT_DATA.hero,
    interviewsSection: {
      ...DEFAULT_DATA.interviewsSection,
      interviewsByTab: {
        "For You": forYou.map((interview) =>
          toCard(interview, {
            canTakeInterview,
            viewerId: currentUser?.id ?? null,
            returnTo: "/interview-hub",
          }),
        ),
        "Trending Interviews": trending.map((interview) =>
          toCard(interview, {
            canTakeInterview,
            viewerId: currentUser?.id ?? null,
            returnTo: "/interview-hub",
          }),
        ),
        "New This Week": newThisWeek.map((interview) =>
          toCard(interview, {
            canTakeInterview,
            viewerId: currentUser?.id ?? null,
            returnTo: "/interview-hub",
          }),
        ),
        "All Time Popular": popularAllTime.map((interview) =>
          toCard(interview, {
            canTakeInterview,
            viewerId: currentUser?.id ?? null,
            returnTo: "/interview-hub",
          }),
        ),
        "By You": byYou.map((interview) =>
          toCard(interview, {
            canTakeInterview,
            viewerId: currentUser?.id ?? null,
            returnTo: "/interview-hub",
          }),
        ),
      },
    },
  };
}
