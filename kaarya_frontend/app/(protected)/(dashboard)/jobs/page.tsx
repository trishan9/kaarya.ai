import Link from "next/link";
import { PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/dal";
import { Role } from "@/lib/definitions";
import { DashboardHeader } from "../_components/dashboard-header";
import { JobRecommendationsCard } from "../_components/job-recommendations-card";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { ExploreJobsHero } from "./_components/explore-jobs-hero";
import { getExploreJobsPageData } from "./jobs-data";

type JobsPageProps = {
  searchParams?: Promise<{
    workspace?: string;
    search?: string;
    location?: string;
  }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const user = await getCurrentUser();
  const queryParams = await searchParams;
  const workspaceId =
    typeof queryParams?.workspace === "string" ? queryParams.workspace : null;
  const search =
    typeof queryParams?.search === "string" ? queryParams.search : "";
  const location =
    typeof queryParams?.location === "string" ? queryParams.location : "";

  const isRecruiter = user?.role === Role.RECRUITER;
  const isCollege = user?.role === Role.COLLEGE;
  const exploreJobsData = await getExploreJobsPageData({
    isRecruiter,
    isCollege,
    workspaceId,
    search,
    location,
  });

  const headerActions = isRecruiter || isCollege ? (
    <Button asChild className="h-9 rounded-lg text-xs font-semibold">
      <Link
        href={workspaceId ? `/jobs/new?workspace=${workspaceId}` : "/jobs/new"}
      >
        <PlusSquare className="h-4 w-4" />
        Create Job Posting
      </Link>
    </Button>
  ) : (
    <OverviewHeaderActions />
  );

  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader
          title={
            isRecruiter
              ? "Company Jobs"
              : isCollege
                ? "College Jobs"
                : "Explore Jobs & Internships"
          }
          actions={headerActions}
        />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <ExploreJobsHero
            {...exploreJobsData.hero}
            workspaceId={
              isRecruiter || isCollege ? (workspaceId ?? undefined) : undefined
            }
          />
          <JobRecommendationsCard {...exploreJobsData.jobsSection} />
        </div>
      </div>
    </div>
  );
}

