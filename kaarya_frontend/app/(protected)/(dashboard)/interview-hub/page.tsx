import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { AIInterviewHubHero } from "./_components/ai-interview-hub-hero";
import { MockInterviewRecommendationsCard } from "./_components/mock-interview-recommendations-card";
import { getInterviewHubPageData } from "./interview-hub-data";

export default async function InterviewHubPage() {
  const interviewHubData = await getInterviewHubPageData();

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader title="AI Interview Hub" actions={<OverviewHeaderActions />} />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <AIInterviewHubHero {...interviewHubData.hero} />
          <MockInterviewRecommendationsCard {...interviewHubData.interviewsSection} />
        </div>
      </div>
    </div>
  );
}
