import { DashboardHeader } from "../_components/dashboard-header";
import { DashboardLoadingPanel } from "../_components/dashboard-loading-panel";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { BlogsSearchHero } from "./_components/blogs-search-hero";

export default function Loading() {
  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader
          title="Blogs & Articles"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <BlogsSearchHero
            title="Career Blogs & Insightful Articles"
            description="Discover practical advice, market trends, and interview strategies curated for job seekers."
            searchPlaceholder="Search article topic, author, or keyword..."
          />
          <DashboardLoadingPanel label="Loading articles..." />
        </div>
      </div>
    </div>
  );
}
