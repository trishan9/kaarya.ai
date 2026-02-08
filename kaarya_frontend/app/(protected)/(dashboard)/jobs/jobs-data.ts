import type { JobCardProps } from "../_components/job-card";
import type { JobRecommendationsCardProps } from "../_components/job-recommendations-card";
import type { ExploreJobsHeroProps } from "./_components/explore-jobs-hero";

type ExploreJobsSectionData = Pick<
  JobRecommendationsCardProps,
  | "title"
  | "tabs"
  | "activeTab"
  | "jobsByTab"
  | "showToolbar"
  | "sortLabel"
  | "filterLabel"
  | "surface"
  | "gridClassName"
>;

export type ExploreJobsPageData = {
  hero: ExploreJobsHeroProps;
  jobsSection: ExploreJobsSectionData;
};

const exploreJobTabs = [
  "For You",
  "Trending Jobs",
  "New This Week",
  "Urgently Hiring",
  "Remote Opportunities",
];

const exploreJobsForYou: JobCardProps[] = [
  {
    id: "job-backend-software-engineer",
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
    id: "job-software-engineer-google",
    title: "Software Engineer",
    company: "Google",
    statusLabel: "Suit You Best!",
    statusTone: "success",
    postedAt: "3d ago",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Internship",
    salaryRange: "NPR 10,00,000 - NPR 15,00,000",
    logoText: "G",
    logoClassName: "bg-white text-[#4285f4] border border-[#d7e1f4]",
    extraTags: ["+4"],
    applyHref: "/jobs",
  },
  {
    id: "job-laravel-developer",
    title: "Laravel Developer",
    company: "PHP Pvt. Ltd.",
    statusLabel: "Still Hiring",
    statusTone: "warning",
    postedAt: "3d ago",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Internship",
    salaryRange: "NPR 10,00,000 - NPR 15,00,000",
    logoText: "php",
    logoClassName: "bg-[#6f6cc5]",
    extraTags: ["+4"],
    applyHref: "/jobs",
  },
  {
    id: "job-frontend-software-engineer",
    title: "Frontend Software Engineer",
    company: "Softwarica College of IT & E-commerce",
    statusLabel: "Suit You Best!",
    statusTone: "success",
    postedAt: "3d ago",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Internship",
    salaryRange: "NPR 10,00,000 - NPR 15,00,000",
    logoText: "S",
    logoClassName: "bg-[#0056a5]",
    extraTags: ["+4"],
    applyHref: "/jobs",
  },
  {
    id: "job-devops-engineer",
    title: "DevOps Engineer",
    company: "Amazon",
    statusLabel: "Still Hiring",
    statusTone: "warning",
    postedAt: "3d ago",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Internship",
    salaryRange: "NPR 10,00,000 - NPR 15,00,000",
    logoText: "aws",
    logoClassName: "bg-[#f79500]",
    extraTags: ["+4"],
    applyHref: "/jobs",
  },
  {
    id: "job-flutter-developer",
    title: "Flutter Developer",
    company: "The North Face",
    statusLabel: "Still Hiring",
    statusTone: "warning",
    postedAt: "3d ago",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Internship",
    salaryRange: "NPR 10,00,000 - NPR 15,00,000",
    logoText: "tnf",
    logoClassName: "bg-[#de3036]",
    extraTags: ["+4"],
    applyHref: "/jobs",
  },
];

function rotateJobs(jobs: JobCardProps[], amount: number) {
  if (jobs.length === 0) return [];
  const normalizedAmount = amount % jobs.length;
  return [...jobs.slice(normalizedAmount), ...jobs.slice(0, normalizedAmount)];
}

const exploreJobsByTab: Record<string, JobCardProps[]> = {
  "For You": exploreJobsForYou,
  "Trending Jobs": rotateJobs(exploreJobsForYou, 1),
  "New This Week": rotateJobs(exploreJobsForYou, 2),
  "Urgently Hiring": rotateJobs(exploreJobsForYou, 3),
  "Remote Opportunities": exploreJobsForYou,
};

const EXPLORE_JOBS_DEFAULT_DATA: ExploreJobsPageData = {
  hero: {
    title: "Explore Your Career Opportunities Here",
    description:
      "Apply to jobs & internships that match your skills and aspirations, and embark on a rewarding career journey with the help of Kaarya.",
    searchPlaceholder: "Search your job title or keyword...",
    locationPlaceholder: "Set your country or timezone...",
    actionLabel: "Find Job",
  },
  jobsSection: {
    title: "Jobs For You",
    tabs: exploreJobTabs,
    activeTab: "For You",
    jobsByTab: exploreJobsByTab,
    showToolbar: true,
    sortLabel: "Sort By",
    filterLabel: "Filter",
    surface: "plain",
    gridClassName: "md:grid-cols-2 xl:grid-cols-3",
  },
};

export async function getExploreJobsPageData(): Promise<ExploreJobsPageData> {
  return EXPLORE_JOBS_DEFAULT_DATA;
}
