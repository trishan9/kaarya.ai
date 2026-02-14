import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { ResumeBuilderForm } from "./_components/resume-builder-form";
import { ResumeBuilderHero } from "./_components/resume-builder-hero";
import { getResumeBuilderPageData } from "./resume-data";

export default async function ResumeBuilderPage() {
  const resumeBuilderData = await getResumeBuilderPageData();

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader
          title="Resume Builder AI"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <ResumeBuilderHero {...resumeBuilderData.hero} />
          <ResumeBuilderForm {...resumeBuilderData.form} />
        </div>
      </div>
    </div>
  );
}
