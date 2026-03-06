import { DashboardLoadingPanel } from "./_components/dashboard-loading-panel";

export default function DashboardLoading() {
  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <div className="px-3 py-6 sm:px-4 sm:py-8">
          <DashboardLoadingPanel
            label="Loading page..."
            className="min-h-[420px]"
          />
        </div>
      </div>
    </div>
  );
}
