import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { InboxContainer } from "./_components/inbox-container";
import { getInboxPageData } from "./inbox-data";

export default async function InboxPage() {
  const inboxData = await getInboxPageData();

  return (
    <div className="dashboard-stage">
      <div className="grid min-h-[calc(100svh-1rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl bg-card sm:min-h-[calc(100svh-2rem)] sm:rounded-2xl lg:min-h-[calc(100svh-2.5rem)]">
        <DashboardHeader title={inboxData.title} actions={<OverviewHeaderActions />} />

        <div className="min-h-0 px-3 pb-3 sm:px-4 sm:pb-4">
          <InboxContainer data={inboxData} />
        </div>
      </div>
    </div>
  );
}


