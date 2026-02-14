import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { InboxWorkspace } from "./_components/inbox-workspace";
import { getInboxPageData } from "./inbox-data";

export default async function InboxPage() {
  const inboxData = await getInboxPageData();

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="grid min-h-[calc(100svh-1rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl bg-white sm:min-h-[calc(100svh-2rem)] sm:rounded-2xl lg:min-h-[calc(100svh-2.5rem)]">
        <DashboardHeader title={inboxData.title} actions={<OverviewHeaderActions />} />

        <div className="min-h-0 px-3 pb-3 sm:px-4 sm:pb-4">
          <InboxWorkspace data={inboxData} />
        </div>
      </div>
    </div>
  );
}
