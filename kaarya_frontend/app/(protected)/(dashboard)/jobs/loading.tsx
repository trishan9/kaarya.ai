import { DashboardHeader } from "../_components/dashboard-header";
import { DashboardLoadingPanel } from "../_components/dashboard-loading-panel";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { ExploreJobsHero } from "./_components/explore-jobs-hero";

export default function Loading() {
  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader title="Jobs" actions={<OverviewHeaderActions />} />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <ExploreJobsHero
            title="Explore Your Career Opportunities Here"
            description="Apply to jobs and internships that match your skills and aspirations with live postings from the Kaarya API."
            searchPlaceholder="Search your job title or keyword..."
            locationPlaceholder="Set your city or timezone..."
            actionLabel="Find Job"
          />
          <DashboardLoadingPanel label="Loading job listings..." />
        </div>
      </div>
    </div>
  );
}
