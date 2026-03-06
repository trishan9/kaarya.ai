import { DashboardHeader } from "../_components/dashboard-header";
import { DashboardLoadingPanel } from "../_components/dashboard-loading-panel";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { ResumeBuilderHero } from "./_components/resume-builder-hero";

const PREVIEWS = [
  { id: "preview-1", title: "Software", subtitle: "ATS-ready" },
  { id: "preview-2", title: "Product", subtitle: "Professional" },
  { id: "preview-3", title: "Design", subtitle: "One-page" },
];

export default function Loading() {
  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader
          title="Resume Builder"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
          <ResumeBuilderHero
            title="AI-powered, ATS-ready resumes"
            description="Create professional resumes with AI assistance. Build from scratch, generate bullet points and summaries, and export LaTeX-style PDFs optimized for applicant tracking systems."
            previews={PREVIEWS}
          />
          <DashboardLoadingPanel label="Loading resume tools..." />
        </div>
      </div>
    </div>
  );
}
