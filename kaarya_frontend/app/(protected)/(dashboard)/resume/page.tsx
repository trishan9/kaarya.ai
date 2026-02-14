import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { ResumeBuilderHero } from "./_components/resume-builder-hero";
import { ResumePageTabs } from "./_components/resume-page-tabs";

export default async function ResumeBuilderPage() {
  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader
          title="Resume Builder"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
          <ResumeBuilderHero
            title="AI-powered, ATS-ready resumes"
            description="Create professional resumes with AI assistance. Build from scratch, generate bullet points and summaries, and export LaTeX-style PDFs optimized for applicant tracking systems."
            previews={[
              { id: "preview-1", title: "Software", subtitle: "ATS-ready" },
              { id: "preview-2", title: "Product", subtitle: "Professional" },
              { id: "preview-3", title: "Design", subtitle: "One-page" },
            ]}
          />
          <ResumePageTabs />
        </div>
      </div>
    </div>
  );
}
