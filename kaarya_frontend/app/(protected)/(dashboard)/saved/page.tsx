import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { SavedBookmarksBoard } from "./_components/saved-bookmarks-board";
import { SavedHero } from "./_components/saved-hero";
import { getSavedPageData } from "./saved-data";

export default async function SavedPage() {
  const savedPageData = await getSavedPageData();

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader title="Saved" actions={<OverviewHeaderActions />} />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <SavedHero {...savedPageData.hero} />
          <SavedBookmarksBoard {...savedPageData.board} />
        </div>
      </div>
    </div>
  );
}
