import { listInterviews } from "@/lib/actions/interview-actions";
import { getCurrentUser } from "@/lib/dal";
import { Role, type TInterview } from "@/lib/definitions";
import type { MockInterviewCardProps } from "../interview-hub/_components/mock-interview-card";
import type { MyInterviewsBoardProps } from "./_components/my-interviews-board";
import type { MyInterviewsHeroProps } from "./_components/my-interviews-hero";

type MyInterviewsSectionData = Omit<MyInterviewsBoardProps, "description"> & {
  description: string;
};

export type MyInterviewsPageData = {
  hero: MyInterviewsHeroProps;
  board: MyInterviewsSectionData;
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

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  mixed: "Mixed",
  system_design: "System Design",
  custom: "Custom",
};

const extractInterviews = (response: any): TInterview[] =>
  Array.isArray(response?.data?.interviews) ? (response.data.interviews as TInterview[]) : [];

const toDateLabel = (value?: string | null, prefix = "Created on") => {
  if (!value) return `${prefix}: -`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `${prefix}: -`;
  return `${prefix}: ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
};

const toCompanyLabel = (interview: TInterview) =>
  interview.company?.name ??
  interview.college?.name ??
  (interview.source === "candidate" ? "By You" : "Kaarya");

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
    .join("") || "Y";

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

const resolveFeedbackSessionId = (interview: TInterview) => {
  const evaluationSessionId = interview.myLatestEvaluation?.sessionId?.trim();
  if (evaluationSessionId) return evaluationSessionId;
  return null;
};

const toCreatedByMeCard = (
  interview: TInterview,
  options?: { canTakeInterview?: boolean; returnTo?: string },
): MockInterviewCardProps => {
  const company = toCompanyLabel(interview);
  const isDraft = interview.status === "draft";
  const canTakeInterview = options?.canTakeInterview === true;
  const returnTo = options?.returnTo ?? "/interviews";
  const feedbackSessionId = resolveFeedbackSessionId(interview);
  const hasLatestFeedback = Boolean(feedbackSessionId);

  const primaryActionLabel = canTakeInterview
    ? hasLatestFeedback
      ? "Review Results"
      : "Take Interview"
    : isDraft
      ? "Continue Setup"
      : "View Interview";
  const primaryActionHref = canTakeInterview
    ? hasLatestFeedback && feedbackSessionId
      ? withReturnTo(`/interviews/sessions/${feedbackSessionId}/feedback`, returnTo)
      : withReturnTo(`/interviews/${interview.id}/take`, returnTo)
    : `/interviews/${interview.id}`;
  const secondaryActionLabel = canTakeInterview
    ? hasLatestFeedback
      ? "Re-take"
      : undefined
    : isDraft
      ? undefined
      : "Edit";
  const secondaryActionHref = canTakeInterview
    ? hasLatestFeedback
      ? withReturnTo(`/interviews/${interview.id}/take`, returnTo)
      : undefined
    : isDraft
      ? undefined
      : `/interviews/${interview.id}`;

  return {
    id: interview.id,
    title: interview.title,
    company,
    categoryLabel: INTERVIEW_TYPE_LABELS[interview.interviewType] ?? "Mixed",
    takenCount: interview.attemptsCount ?? 0,
    takenCountLabel: `${interview.attemptsCount ?? 0} attempts on your interview`,
    createdAtLabel: toDateLabel(interview.createdAt),
    createdAtTimestamp: new Date(interview.createdAt).getTime() || Date.now(),
    scoreLabel: "Your Score: -/100",
    scoreValue: null,
    description: canTakeInterview
      ? hasLatestFeedback
        ? "Created by you and already attempted. Review feedback or retake to improve."
        : "Created by you. Start your own mock to validate question quality and flow."
      : isDraft
        ? "This interview is still in draft mode. Review it, then publish when ready."
        : "Created by you and published. Track participation and iterate your question set.",
    attemptStatus: "not_attempted",
    logoText: toLogoText(company),
    logoUrl: resolveInterviewLogoUrl(interview),
    stackTechnologies: toStackIcons(interview.techStack ?? []),
    primaryActionLabel,
    primaryActionHref,
    secondaryActionLabel,
    secondaryActionHref,
  };
};

const toTakenByMeCard = (
  interview: TInterview,
  options?: { returnTo?: string },
): MockInterviewCardProps => {
  const company = toCompanyLabel(interview);
  const returnTo = options?.returnTo ?? "/interviews";
  const feedbackSessionId = resolveFeedbackSessionId(interview);
  const hasLatestFeedback = Boolean(feedbackSessionId);
  const scoreValue =
    typeof interview.myLatestScore === "number" ? interview.myLatestScore : null;
  const scoreLabel =
    typeof scoreValue === "number" ? `Your Score: ${scoreValue}/100` : "Your Score: -/100";

  return {
    id: interview.id,
    title: interview.title,
    company,
    categoryLabel: INTERVIEW_TYPE_LABELS[interview.interviewType] ?? "Mixed",
    takenCount: interview.attemptsCount ?? 0,
    takenCountLabel: `${interview.attemptsCount ?? 0} people took this!`,
    createdAtLabel: toDateLabel(interview.createdAt),
    createdAtTimestamp: new Date(interview.createdAt).getTime() || Date.now(),
    scoreLabel,
    scoreValue,
    description:
      "Completed by you. Review AI feedback and repeat this interview to improve your score.",
    attemptStatus: "attempted",
    logoText: toLogoText(company),
    logoUrl: resolveInterviewLogoUrl(interview),
    stackTechnologies: toStackIcons(interview.techStack ?? []),
    primaryActionLabel: hasLatestFeedback ? "Review Results" : "Take Interview",
    primaryActionHref: feedbackSessionId
      ? withReturnTo(`/interviews/sessions/${feedbackSessionId}/feedback`, returnTo)
      : withReturnTo(`/interviews/${interview.id}/take`, returnTo),
    secondaryActionLabel: hasLatestFeedback ? "Re-take" : undefined,
    secondaryActionHref: hasLatestFeedback
      ? withReturnTo(`/interviews/${interview.id}/take`, returnTo)
      : undefined,
  };
};

const mergeById = (lists: TInterview[][]): TInterview[] => {
  const map = new Map<string, TInterview>();
  for (const list of lists) {
    for (const interview of list) {
      if (!map.has(interview.id)) {
        map.set(interview.id, interview);
      }
    }
  }
  return Array.from(map.values()).sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt).getTime() || 0;
    const rightTime = new Date(right.updatedAt || right.createdAt).getTime() || 0;
    return rightTime - leftTime;
  });
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const averageScore = (interviews: TInterview[]) => {
  const scores = interviews
    .map((item) => item.myLatestScore)
    .filter((score): score is number => typeof score === "number");
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
};

const badgeLabel = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Needs Improvement";
  if (score > 0) return "Below Average";
  return "Not Started";
};

const badgeDescription = (score: number) => {
  if (score >= 80) {
    return "Your interview performance is strong and consistent.";
  }
  if (score >= 65) {
    return "You are progressing well with solid interview fundamentals.";
  }
  if (score >= 50) {
    return "Your baseline is improving, but consistency still needs work.";
  }
  if (score > 0) {
    return "You need more targeted practice rounds before real interviews.";
  }
  return "Take your first interview to start tracking your interview readiness.";
};

export async function getMyInterviewsPageData(): Promise<MyInterviewsPageData> {
  const currentUser = await getCurrentUser();
  const canTakeInterview =
    currentUser?.role === Role.USER || currentUser?.role === Role.STUDENT;
  const [createdResponse, takenResponse] = await Promise.all([
    listInterviews({
      page: 1,
      size: 50,
      ownership: "created_by_me",
      sortBy: "updated",
    }),
    canTakeInterview
      ? listInterviews({
          page: 1,
          size: 50,
          ownership: "taken_by_me",
          sortBy: "updated",
        })
      : Promise.resolve({ success: true, data: { interviews: [] } }),
  ]);

  const created = extractInterviews(createdResponse);
  const taken = extractInterviews(takenResponse);
  const all = mergeById([taken, created]);
  const averageTakenScore = averageScore(taken);
  const draftCards = created
    .filter((item) => item.status === "draft")
    .map((interview) =>
      toCreatedByMeCard(interview, {
        canTakeInterview,
        returnTo: "/interviews",
      }),
    );
  const allCards = mergeById([taken, created]).map((interview) =>
    taken.some((item) => item.id === interview.id)
      ? toTakenByMeCard(interview, { returnTo: "/interviews" })
      : toCreatedByMeCard(interview, {
          canTakeInterview,
          returnTo: "/interviews",
        }),
  );
  const latestUpdatedAt = all.reduce((latest, interview) => {
    const currentTs = new Date(interview.updatedAt || interview.createdAt).getTime() || 0;
    return currentTs > latest ? currentTs : latest;
  }, 0);

  return {
    hero: {
      title: "Track every mock and custom interview in one place.",
      description:
        "Review interviews you've taken, manage interviews you've created, and keep your practice pipeline organized.",
      lastUpdatedLabel: `Last updated: ${formatDate(
        latestUpdatedAt ? new Date(latestUpdatedAt).toISOString() : new Date().toISOString(),
      )}`,
      stats: canTakeInterview
        ? [
            { id: "total", label: "Total Interviews", value: `${all.length}` },
            { id: "taken", label: "Taken by Me", value: `${taken.length}` },
            { id: "created", label: "Created by Me", value: `${created.length}` },
            {
              id: "average-score",
              label: "Average Score",
              value: `${averageTakenScore}/100`,
            },
          ]
        : [
            { id: "total", label: "Total Interviews", value: `${all.length}` },
            { id: "created", label: "Created by Me", value: `${created.length}` },
            { id: "drafts", label: "Draft Interviews", value: `${draftCards.length}` },
            {
              id: "published",
              label: "Published Interviews",
              value: `${created.filter((item) => item.status === "published").length}`,
            },
          ],
    },
    board: {
      title: "Interview Library",
      description:
        "Use tabs, sorting, and filters to quickly find completed mocks, drafts, and interviews created by you.",
      tabs: canTakeInterview
        ? ["All Interviews", "Taken by Me", "Created by Me", "Drafts"]
        : ["All Interviews", "Created by Me", "Drafts"],
      activeTab: "All Interviews",
      interviewsByTab: canTakeInterview
        ? {
            "All Interviews": allCards,
            "Taken by Me": taken.map((interview) =>
              toTakenByMeCard(interview, { returnTo: "/interviews" }),
            ),
            "Created by Me": created.map((interview) =>
              toCreatedByMeCard(interview, {
                canTakeInterview,
                returnTo: "/interviews",
              }),
            ),
            Drafts: draftCards,
          }
        : {
            "All Interviews": allCards,
            "Created by Me": created.map((interview) =>
              toCreatedByMeCard(interview, {
                canTakeInterview: false,
                returnTo: "/interviews",
              }),
            ),
            Drafts: draftCards,
          },
      showToolbar: true,
      sortLabel: "Sort By",
      filterLabel: "Filter",
      emptyMessage: "No interviews available in this category yet.",
      gridClassName: "md:grid-cols-2",
      ...(canTakeInterview
        ? {
            sidePanelData: {
              title: "My Interview Rating",
              rating: averageTakenScore,
              badgeLabel: badgeLabel(averageTakenScore),
              description: badgeDescription(averageTakenScore),
              suggestionTitle: "Our Suggestion",
              suggestionBody:
                "Create role-specific interviews and iterate on your weak areas using AI feedback after each attempt.",
            },
          }
        : { sidePanelData: undefined }),
      createButtonLabel: "Create Interview",
      createDialogTitle: "Create Your Interview",
      createDialogDescription:
        "Use the dedicated create page to configure interview setup, question generation, and visibility.",
      createFields: [],
      notesLabel: "Brief / Notes",
      notesPlaceholder: "",
      saveDraftLabel: "Save as Draft",
      publishLabel: "Publish Interview",
    },
  };
}
