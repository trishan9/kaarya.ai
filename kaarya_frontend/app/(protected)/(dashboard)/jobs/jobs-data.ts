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
  options?: { isRecruiter?: boolean; workspaceId?: string | null },
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
    extraTags: options?.isRecruiter
      ? [`${job.applicationsCount ?? 0} applicants`, `${job.viewsCount ?? 0} views`]
      : [`${job.applicationsCount ?? 0} applicants`],
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

const loadJobCards = async (
  query: JobListQuery,
  options?: { isRecruiter?: boolean; workspaceId?: string | null },
) => {
  const response = await getJobs(query);
  return toJobCards(extractJobs(response), options);
};

export async function getExploreJobsPageData(
  options?: ExploreJobsPageOptions,
): Promise<ExploreJobsPageData> {
  const isRecruiter = Boolean(options?.isRecruiter);
  const search = options?.search?.trim() || undefined;
  const location = options?.location?.trim() || undefined;

  if (isRecruiter) {
    const workspaceId = options?.workspaceId ?? undefined;

    if (!workspaceId) {
      return {
        hero: RECRUITER_HERO,
        jobsSection: {
          title: "Company Jobs",
          tabs: ["All Company Jobs"],
          activeTab: "All Company Jobs",
          jobsByTab: { "All Company Jobs": [] },
          showToolbar: true,
          sortLabel: "Sort By",
          filterLabel: "Filter",
          surface: "plain",
          gridClassName: "md:grid-cols-2 xl:grid-cols-3",
          emptyMessage:
            "No workspace selected. Choose a company workspace to view jobs.",
        },
      };
    }

    const [allJobs, openJobs, closedJobs] = await Promise.all([
      loadJobCards({
        page: 1,
        size: 40,
        feed: "all",
        companyId: workspaceId,
        search,
        location,
      }, { isRecruiter: true, workspaceId }),
      loadJobCards({
        page: 1,
        size: 40,
        feed: "all",
        companyId: workspaceId,
        status: "open",
        search,
        location,
      }, { isRecruiter: true, workspaceId }),
      loadJobCards({
        page: 1,
        size: 40,
        feed: "all",
        companyId: workspaceId,
        status: "closed",
        search,
        location,
      }, { isRecruiter: true, workspaceId }),
    ]);

    return {
      hero: RECRUITER_HERO,
      jobsSection: {
        title: "Company Jobs",
        tabs: ["All Company Jobs", "Open Jobs", "Closed Jobs"],
        activeTab: "All Company Jobs",
        jobsByTab: {
          "All Company Jobs": allJobs,
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
    }),
    loadJobCards({
      page: 1,
      size: 30,
      feed: "trending",
      search,
      location,
    }),
    loadJobCards({
      page: 1,
      size: 30,
      feed: "last_week",
      search,
      location,
    }),
    loadJobCards({
      page: 1,
      size: 30,
      feed: "for_you",
      remoteOnly: true,
      search,
      location,
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
