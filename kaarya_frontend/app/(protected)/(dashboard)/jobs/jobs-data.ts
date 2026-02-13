import { getJobs, JobListQuery } from "@/lib/actions/job-actions";
import type { TJob } from "@/lib/definitions";
import type { JobCardProps } from "../_components/job-card";
import type { JobRecommendationsCardProps } from "../_components/job-recommendations-card";
import type { ExploreJobsHeroProps } from "./_components/explore-jobs-hero";
import { formatRelativeTime } from "@/lib/date/relative-time";

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
  | "emptyMessage"
>;

export type ExploreJobsPageData = {
  hero: ExploreJobsHeroProps;
  jobsSection: ExploreJobsSectionData;
};

export type ExploreJobsPageOptions = {
  isRecruiter?: boolean;
  isCollege?: boolean;
  workspaceId?: string | null;
  search?: string;
  location?: string;
};

const EXPLORE_HERO: ExploreJobsHeroProps = {
  title: "Explore Your Career Opportunities Here",
  description:
    "Apply to jobs and internships that match your skills and aspirations with live postings from the Kaarya API.",
  searchPlaceholder: "Search your job title or keyword...",
  locationPlaceholder: "Set your city or timezone...",
  actionLabel: "Find Job",
};

const RECRUITER_HERO: ExploreJobsHeroProps = {
  title: "Manage Your Company's Job Pipeline",
  description:
    "Track all openings in your selected workspace and post new roles without leaving your dashboard.",
  searchPlaceholder: "Search your company jobs...",
  locationPlaceholder: "Filter by location...",
  actionLabel: "Find Job",
};

const COLLEGE_HERO: ExploreJobsHeroProps = {
  title: "Manage Jobs For Your College Students",
  description:
    "Track college-specific opportunities and publish roles visible only within your college workspace.",
  searchPlaceholder: "Search college jobs...",
  locationPlaceholder: "Filter by location...",
  actionLabel: "Find Job",
};

const statusToneByJobStatus = (
  status?: string,
): JobCardProps["statusTone"] => {
  if (status === "closed") return "warning";
  if (status === "draft") return "info";
  return "success";
};

const statusLabelByJobStatus = (status?: string) => {
  if (status === "closed") return "Closed Hiring";
  if (status === "draft") return "Draft";
  return "Open Hiring";
};

const companyInitials = (companyName?: string | null) => {
  if (!companyName) return "K";
  const parts = companyName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return parts || companyName.slice(0, 1).toUpperCase();
};

const toJobCards = (
  jobs: TJob[],
  options?: {
    isRecruiter?: boolean;
    workspaceId?: string | null;
    featuredCollegeId?: string | null;
  },
) =>
  jobs.map<JobCardProps>((job) => ({
    ...(job.hasApplied && !options?.isRecruiter
      ? {
          applyLabel: "View Application",
          applyHref: job.myApplicationId
            ? `/applications?application=${job.myApplicationId}`
            : "/applications",
        }
      : {}),
    id: job.id,
    title: job.title,
    company: job.company?.name ?? "Company",
    statusLabel: statusLabelByJobStatus(job.status),
    statusTone: statusToneByJobStatus(job.status),
    postedAt: formatRelativeTime(job.createdAt, {
      style: "compact",
      fallback: "just now",
    }),
    location: job.location || "Remote",
    employmentType: job.employmentType || "Full-Time",
    engagementType: job.engagementType || "Internship",
    salaryRange: job.salaryRange || "Compensation not specified",
    logoText: companyInitials(job.company?.name),
    logoUrl: job.company?.logo ?? undefined,
    extraTags: (() => {
      const isFeaturedCollegeJob =
        !options?.isRecruiter &&
        Boolean(options?.featuredCollegeId) &&
        (job.collegeId === options?.featuredCollegeId ||
          job.college?.id === options?.featuredCollegeId);

      const baseTags = options?.isRecruiter
        ? [
            `${job.applicationsCount ?? 0} applicants`,
            `${job.viewsCount ?? 0} views`,
          ]
        : [`${job.applicationsCount ?? 0} applicants`];

      return isFeaturedCollegeJob
        ? ["Your College Featured Job", ...baseTags]
        : baseTags;
    })(),
    applyLabel: options?.isRecruiter
      ? "Manage Job"
      : job.hasApplied
        ? "View Application"
        : "Apply",
    applyHref: options?.isRecruiter
      ? `/jobs/${job.id}${options.workspaceId ? `?workspace=${options.workspaceId}` : ""}`
      : job.hasApplied
        ? job.myApplicationId
          ? `/applications?application=${job.myApplicationId}`
          : "/applications"
        : `/jobs/${job.id}`,
    showBookmark: !options?.isRecruiter,
  }));

const extractJobs = (response: any): TJob[] => {
  const jobs = response?.data?.jobs;
  return Array.isArray(jobs) ? (jobs as TJob[]) : [];
};

const prioritizeFeaturedCollegeJobs = (
  jobs: TJob[],
  featuredCollegeId?: string | null,
) => {
  const normalizedCollegeId = featuredCollegeId?.trim();
  if (!normalizedCollegeId) {
    return jobs;
  }

  const isFeatured = (job: TJob) =>
    job.collegeId === normalizedCollegeId || job.college?.id === normalizedCollegeId;

  return [...jobs].sort((left, right) => {
    const leftScore = isFeatured(left) ? 1 : 0;
    const rightScore = isFeatured(right) ? 1 : 0;
    return rightScore - leftScore;
  });
};

const loadJobCards = async (
  query: JobListQuery,
  options?: {
    isRecruiter?: boolean;
    workspaceId?: string | null;
    featuredCollegeId?: string | null;
  },
) => {
  const response = await getJobs(query);
  const jobs = extractJobs(response);
  const prioritizedJobs = prioritizeFeaturedCollegeJobs(
    jobs,
    options?.featuredCollegeId,
  );
  return toJobCards(prioritizedJobs, options);
};

export async function getExploreJobsPageData(
  options?: ExploreJobsPageOptions,
): Promise<ExploreJobsPageData> {
  const isRecruiter = Boolean(options?.isRecruiter);
  const isCollege = Boolean(options?.isCollege);
  const isManager = isRecruiter || isCollege;
  const search = options?.search?.trim() || undefined;
  const location = options?.location?.trim() || undefined;
  const candidateFeaturedCollegeId = !isManager
    ? options?.workspaceId ?? undefined
    : undefined;

  if (isManager) {
    const workspaceId = options?.workspaceId ?? undefined;
    const managerHero = isRecruiter ? RECRUITER_HERO : COLLEGE_HERO;

    if (!workspaceId) {
      return {
        hero: managerHero,
        jobsSection: {
          title: isRecruiter ? "Company Jobs" : "College Jobs",
          tabs: [isRecruiter ? "All Company Jobs" : "All College Jobs"],
          activeTab: isRecruiter ? "All Company Jobs" : "All College Jobs",
          jobsByTab: {
            [isRecruiter ? "All Company Jobs" : "All College Jobs"]: [],
          },
          showToolbar: true,
          sortLabel: "Sort By",
          filterLabel: "Filter",
          surface: "plain",
          gridClassName: "md:grid-cols-2 xl:grid-cols-3",
          emptyMessage:
            "No workspace selected. Choose a workspace to view jobs.",
        },
      };
    }

    const workspaceFilter = isRecruiter
      ? { companyId: workspaceId }
      : { collegeId: workspaceId, visibility: "college_only" as const };

    const [allJobs, openJobs, closedJobs] = await Promise.all([
      loadJobCards(
        {
          page: 1,
          size: 40,
          feed: "all",
          ...workspaceFilter,
          search,
          location,
        },
        { isRecruiter: isManager, workspaceId },
      ),
      loadJobCards(
        {
          page: 1,
          size: 40,
          feed: "all",
          ...workspaceFilter,
          status: "open",
          search,
          location,
        },
        { isRecruiter: isManager, workspaceId },
      ),
      loadJobCards(
        {
          page: 1,
          size: 40,
          feed: "all",
          ...workspaceFilter,
          status: "closed",
          search,
          location,
        },
        { isRecruiter: isManager, workspaceId },
      ),
    ]);

    return {
      hero: managerHero,
      jobsSection: {
        title: isRecruiter ? "Company Jobs" : "College Jobs",
        tabs: [
          isRecruiter ? "All Company Jobs" : "All College Jobs",
          "Open Jobs",
          "Closed Jobs",
        ],
        activeTab: isRecruiter ? "All Company Jobs" : "All College Jobs",
        jobsByTab: {
          [isRecruiter ? "All Company Jobs" : "All College Jobs"]: allJobs,
          "Open Jobs": openJobs,
          "Closed Jobs": closedJobs,
        },
        showToolbar: true,
        sortLabel: "Sort By",
        filterLabel: "Filter",
        surface: "plain",
        gridClassName: "md:grid-cols-2 xl:grid-cols-3",
        emptyMessage:
          "No jobs found for this workspace yet. Create a posting to get started.",
      },
    };
  }

  const [forYou, trending, lastWeek, remote] = await Promise.all([
    loadJobCards({
      page: 1,
      size: 30,
      feed: "for_you",
      search,
      location,
    }, {
      featuredCollegeId: candidateFeaturedCollegeId,
    }),
    loadJobCards({
      page: 1,
      size: 30,
      feed: "trending",
      search,
      location,
    }, {
      featuredCollegeId: candidateFeaturedCollegeId,
    }),
    loadJobCards({
      page: 1,
      size: 30,
      feed: "last_week",
      search,
      location,
    }, {
      featuredCollegeId: candidateFeaturedCollegeId,
    }),
    loadJobCards({
      page: 1,
      size: 30,
      feed: "for_you",
      remoteOnly: true,
      search,
      location,
    }, {
      featuredCollegeId: candidateFeaturedCollegeId,
    }),
  ]);

  return {
    hero: EXPLORE_HERO,
    jobsSection: {
      title: "Jobs For You",
      tabs: ["For You", "Trending Jobs", "New This Week", "Remote Opportunities"],
      activeTab: "For You",
      jobsByTab: {
        "For You": forYou,
        "Trending Jobs": trending,
        "New This Week": lastWeek,
        "Remote Opportunities": remote,
      },
      showToolbar: true,
      sortLabel: "Sort By",
      filterLabel: "Filter",
      surface: "plain",
      gridClassName: "md:grid-cols-2 xl:grid-cols-3",
      emptyMessage: "No jobs matched your current filters.",
    },
  };
}
