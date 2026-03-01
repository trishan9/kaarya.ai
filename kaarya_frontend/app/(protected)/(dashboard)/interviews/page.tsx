import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { MyInterviewsBoard } from "./_components/my-interviews-board";
import { MyInterviewsHero } from "./_components/my-interviews-hero";
import { getMyInterviewsPageData } from "./interviews-data";

export default async function MyInterviewsPage() {
  const myInterviewsData = await getMyInterviewsPageData();

  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader title="My Interviews" actions={<OverviewHeaderActions />} />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <MyInterviewsHero {...myInterviewsData.hero} />
          <MyInterviewsBoard {...myInterviewsData.board} />
        </div>
      </div>
    </div>
  );
}

