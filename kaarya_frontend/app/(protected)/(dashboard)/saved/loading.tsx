import { DashboardHeader } from "../_components/dashboard-header";
import { DashboardLoadingPanel } from "../_components/dashboard-loading-panel";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { SavedHero } from "./_components/saved-hero";

const HERO_STATS = [
  { id: "total-saved", label: "Total Saved", value: "--" },
  { id: "saved-jobs", label: "Bookmarked Jobs", value: "--" },
  { id: "saved-interviews", label: "Saved Interviews", value: "--" },
  {
    id: "attempted-interviews",
    label: "Attempted Saved Interviews",
    value: "--",
  },
];

export default function Loading() {
  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader title="Saved" actions={<OverviewHeaderActions />} />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <SavedHero
            title="Your saved opportunities, neatly organized."
            description="Switch between jobs and interviews, filter what matters, and jump back in whenever you are ready."
            lastUpdatedLabel="Updating your saved activity..."
            stats={HERO_STATS}
          />
          <DashboardLoadingPanel label="Loading saved items..." />
        </div>
      </div>
    </div>
  );
}
