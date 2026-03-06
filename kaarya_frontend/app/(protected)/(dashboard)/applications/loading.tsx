import { DashboardHeader } from "../_components/dashboard-header";
import { DashboardLoadingPanel } from "../_components/dashboard-loading-panel";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { MyApplicationsHero } from "./_components/my-applications-hero";

const HERO_STATS = [
  { id: "total-applications", label: "Submissions", value: "--" },
  { id: "active-pipeline", label: "In Progress", value: "--" },
  { id: "interviewing", label: "Interview", value: "--" },
  { id: "offers", label: "Accepted", value: "--" },
];

export default function Loading() {
  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader
          title="My Applications"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <MyApplicationsHero
            title="Track Your Job Applications"
            description="Monitor every stage of your applications, from screening to interview and final decision."
            lastUpdatedLabel="Updating your application activity..."
            stats={HERO_STATS}
          />
          <DashboardLoadingPanel label="Loading applications..." />
        </div>
      </div>
    </div>
  );
}
