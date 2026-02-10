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
  | "sidePanelData"
>;

export type InterviewHubPageData = {
  hero: AIInterviewHubHeroProps;
  interviewsSection: InterviewHubSectionData;
};

const interviewTabs = [
  "For You",
  "Trending Interviews",
  "New This Week",
  "All Time Popular",
  "By You",
];

const interviewCardsForYou: MockInterviewCardProps[] = [
  {
    id: "interview-flutter-technical-kaarya",
    title: "Flutter Developer Interview",
    company: "Kaarya Co. Inc.",
    categoryLabel: "Technical",
    takenCount: 90,
    createdAtLabel: "Created on: November 22, 2025",
    createdAtTimestamp: Date.UTC(2025, 10, 22),
    scoreLabel: "Your Score: 80/100",
    scoreValue: 80,
    description:
      "You've already taken this interview. Revisit your results anytime to track your progress and strengthen your skills.",
    attemptStatus: "attempted",
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
        id: "dart",
        name: "Dart",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg",
      },
      {
        id: "firebase",
        name: "Firebase",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",
      },
    ],
    primaryActionLabel: "Review Results",
    secondaryActionLabel: "Re-take",
  },
  {
    id: "interview-frontend-mixed-softwarica",
    title: "Front-end Developer Interview",
    company: "Softwarica College of IT & E-commerce",
    categoryLabel: "Mixed",
    takenCount: 60,
    createdAtLabel: "Created on: November 20, 2025",
    createdAtTimestamp: Date.UTC(2025, 10, 20),
    scoreLabel: "Your Score: -/100",
    scoreValue: null,
    description:
      "You haven't attempted this interview so far. Begin now to measure your performance and grow further.",
    attemptStatus: "not_attempted",
    logoText: "S",
    logoClassName: "bg-[#0b67c2]",
    stackTechnologies: [
      {
        id: "react",
        name: "React",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
      },
      {
        id: "node",
        name: "Node.js",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
      },
      {
        id: "javascript",
        name: "JavaScript",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
      },
    ],
    primaryActionLabel: "Take Interview",
  },
  {
    id: "interview-backend-technical-kaarya",
    title: "Backend Developer Interview",
    company: "Kaarya Co. Inc.",
    categoryLabel: "Technical",
    takenCount: 84,
    createdAtLabel: "Created on: November 21, 2025",
    createdAtTimestamp: Date.UTC(2025, 10, 21),
    scoreLabel: "Your Score: 76/100",
    scoreValue: 76,
    description:
      "You've already taken this interview. Revisit your results anytime to track your progress and strengthen your skills.",
    attemptStatus: "attempted",
    logoText: "K",
    logoClassName: "bg-primary",
    stackTechnologies: [
      {
        id: "nestjs",
        name: "NestJS",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-plain.svg",
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
    primaryActionLabel: "Review Results",
    secondaryActionLabel: "Re-take",
  },
  {
    id: "interview-product-mixed-softwarica",
    title: "Product-focused Interview",
    company: "Softwarica College of IT & E-commerce",
    categoryLabel: "Mixed",
    takenCount: 58,
    createdAtLabel: "Created on: November 19, 2025",
    createdAtTimestamp: Date.UTC(2025, 10, 19),
    scoreLabel: "Your Score: -/100",
    scoreValue: null,
    description:
      "You haven't attempted this interview so far. Begin now to measure your performance and grow further.",
    attemptStatus: "not_attempted",
    logoText: "S",
    logoClassName: "bg-[#0b67c2]",
    stackTechnologies: [
      {
        id: "figma",
        name: "Figma",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
      },
      {
        id: "jira",
        name: "Jira",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg",
      },
      {
        id: "notion",
        name: "Notion",
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/notion/notion-original.svg",
      },
    ],
    primaryActionLabel: "Take Interview",
  },
];

const interviewsByTab: Record<string, MockInterviewCardProps[]> = {
  "For You": interviewCardsForYou,
  "Trending Interviews": [...interviewCardsForYou].sort(
    (a, b) => b.takenCount - a.takenCount,
  ),
  "New This Week": [...interviewCardsForYou].sort(
    (a, b) => b.createdAtTimestamp - a.createdAtTimestamp,
  ),
  "All Time Popular": [...interviewCardsForYou].sort(
    (a, b) => b.takenCount - a.takenCount,
  ),
  "By You": interviewCardsForYou.filter(
    (interview) => interview.attemptStatus === "attempted",
  ),
};

const INTERVIEW_HUB_DEFAULT_DATA: InterviewHubPageData = {
  hero: {
    title: "Simulate industry-level interviews with AI.",
    description:
      "Get interview ready on your targeted roles with AI mock interviews. Practice on real interview questions and get instant feedback to improve your skills.",
  },
  interviewsSection: {
    title: "Mock Interviews",
    tabs: interviewTabs,
    activeTab: "For You",
    interviewsByTab,
    showToolbar: true,
    sortLabel: "Sort By",
    filterLabel: "Filter",
    gridClassName: "md:grid-cols-2",
    sidePanelData: {
      title: "Interview Overall Rating",
      rating: 23,
      badgeLabel: "Below Average",
      description:
        "It shows some potential, but it's still below average and needs more refinement before you're ready for real interviews.",
      suggestionTitle: "Our Suggestion",
      suggestionBody:
        "Give more interviews with AI Interview Hub. Choose from expertly curated interviews inspired by real companies and colleges, or create your own mock interview tailored to your experience and goals. Practice repeatedly, gain valuable exposure, and sharpen your performance. Plus, our AI can generate customized learning materials to help you prepare and crush your next interview.",
    },
  },
};

export async function getInterviewHubPageData(): Promise<InterviewHubPageData> {
  return INTERVIEW_HUB_DEFAULT_DATA;
}
