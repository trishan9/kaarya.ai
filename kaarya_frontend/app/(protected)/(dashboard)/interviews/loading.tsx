import { DashboardHeader } from "../_components/dashboard-header";
import { DashboardLoadingPanel } from "../_components/dashboard-loading-panel";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { MyInterviewsHero } from "./_components/my-interviews-hero";

const HERO_STATS = [
  { id: "total", label: "Total Interviews", value: "--" },
  { id: "taken", label: "Taken by Me", value: "--" },
  { id: "created", label: "Created by Me", value: "--" },
  { id: "average-score", label: "Average Score", value: "--/100" },
];

export default function Loading() {
  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader
          title="My Interviews"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <MyInterviewsHero
            title="Track every mock and custom interview in one place."
            description="Review interviews you've taken, manage interviews you've created, and keep your practice pipeline organized."
            lastUpdatedLabel="Updating your interview activity..."
            stats={HERO_STATS}
          />
          <DashboardLoadingPanel label="Loading interviews..." />
        </div>
      </div>
    </div>
  );
}
