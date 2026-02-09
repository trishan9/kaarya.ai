import { DashboardHeader } from "../_components/dashboard-header";
import { JobRecommendationsCard } from "../_components/job-recommendations-card";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { ExploreJobsHero } from "./_components/explore-jobs-hero";
import { getExploreJobsPageData } from "./jobs-data";

export default async function JobsPage() {
  const exploreJobsData = await getExploreJobsPageData();

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader
          title="Explore Jobs & Internships"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <ExploreJobsHero {...exploreJobsData.hero} />
          <JobRecommendationsCard {...exploreJobsData.jobsSection} />
        </div>
      </div>
    </div>
  );
}
