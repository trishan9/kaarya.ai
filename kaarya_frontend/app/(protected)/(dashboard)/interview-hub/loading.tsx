import { DashboardHeader } from "../_components/dashboard-header";
import { DashboardLoadingPanel } from "../_components/dashboard-loading-panel";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { AIInterviewHubHero } from "./_components/ai-interview-hub-hero";

export default function Loading() {
  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader
          title="AI Interview Hub"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <AIInterviewHubHero
            title="Simulate industry-level interviews with AI."
            description="Get interview ready on your targeted roles with AI mock interviews. Practice on real interview questions and get instant feedback to improve your skills."
          />
          <DashboardLoadingPanel label="Loading interview recommendations..." />
        </div>
      </div>
    </div>
  );
}
