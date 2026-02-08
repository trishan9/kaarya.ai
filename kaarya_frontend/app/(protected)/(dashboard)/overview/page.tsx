import { DashboardHeader } from "../_components/dashboard-header";
import { ApplicationsSummaryCard } from "./_components/applications-summary-card";
import { DeadlineCard } from "./_components/deadline-card";
import { InvitationCard } from "./_components/invitation-card";
import { RatingCard } from "./_components/rating-card";
import { JobRecommendationsCard } from "./_components/job-recommendations-card";
import { TipsCard } from "./_components/tips-card";
import { OverviewHeaderActions } from "./_components/overview-header-actions";
import { OverviewAnalyticsCharts } from "./_components/overview-analytics-charts";
import { getOverviewDashboardData } from "./overview-data";

export default async function OverviewPage() {
  const overviewData = await getOverviewDashboardData();

  return (
    <div className="min-h-svh bg-neutral-100 lg:pl-0 lg:p-6">
      <div className="bg-white rounded-2xl">
        <DashboardHeader title="Overview" actions={<OverviewHeaderActions />} />

        <div className="px-4 pb-8">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <ApplicationsSummaryCard {...overviewData.applicationsSummary} />

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <DeadlineCard {...overviewData.deadlineCard} />
                <InvitationCard {...overviewData.invitationCard} />
              </div>

              <OverviewAnalyticsCharts data={overviewData.analytics} />

              <JobRecommendationsCard {...overviewData.jobRecommendations} />
            </div>

            <div className="space-y-4">
              <RatingCard
                title="Your Profile Rating"
                rating={overviewData.ratings.profile}
                badgeLabel="Standard"
                ratingClassName="text-[#f4b000]"
                badgeClassName="bg-[#fff3d8] text-[#f4b000]"
                description="It's already great, but it still needs to be even better to impress the recruiters."
                suggestionTitle="Our Suggestion"
                suggestionBody="Try enhancing your profile & re-generating your version of an interactive resume with the help of our very own Resume Builder AI."
                actionLabel="Enhance with AI"
                actionHref="/resume"
                showAction
              />

              <RatingCard
                title="Interview Overall Rating"
                rating={overviewData.ratings.interview}
                badgeLabel="Below Average"
                ratingClassName="text-rose-500"
                badgeClassName="bg-rose-50 text-rose-500"
                description="It shows some potential, but it's still below average and needs more refinement before you're ready for real interviews."
                suggestionTitle="Our Suggestion"
                suggestionBody="Give more interviews with AI Interview Hub."
                actionLabel="Take an Interview"
                actionHref="/interview-hub"
                showAction
              />

              <TipsCard
                title="We've got some tips only for you!"
                description="Check our latest information for tips and tricks for your career!"
                actionHref="/resources"
                actionLabel="Open tips"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
