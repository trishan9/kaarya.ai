import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OverviewHeaderActions } from "../../overview/_components/overview-header-actions";
import { JobDetailHeader } from "../_components/job-detail-header";
import { JobDetailView } from "../_components/job-detail-view";
import { JobViewTracker } from "../_components/job-view-tracker";
import { getJobDetailPageData } from "../job-detail-data";
import { getCurrentUser } from "@/lib/dal";
import { Role } from "@/lib/definitions";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

export default async function JobDetailPage({
  params,
  searchParams,
}: JobDetailPageProps) {
  const user = await getCurrentUser();
  const isRecruiter = user?.role === Role.RECRUITER;
  const isCollege = user?.role === Role.COLLEGE;
  const isWorkspaceManager = isRecruiter || isCollege;
  const query = await searchParams;
  const workspaceId =
    typeof query?.workspace === "string" ? query.workspace : null;
  const { jobId } = await params;
  const detailData = await getJobDetailPageData(decodeURIComponent(jobId), {
    isWorkspaceManager,
    workspaceId,
  });
  if (!detailData) {
    notFound();
  }

  const headerActions = isWorkspaceManager ? (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" className="h-9 rounded-lg text-xs font-semibold">
        <Link href={workspaceId ? `/jobs?workspace=${workspaceId}` : "/jobs"}>
          Back to Jobs
        </Link>
      </Button>
      <Button asChild className="h-9 rounded-lg text-xs font-semibold">
        <Link href={workspaceId ? `/jobs/new?workspace=${workspaceId}` : "/jobs/new"}>
          Create Job
        </Link>
      </Button>
    </div>
  ) : (
    <OverviewHeaderActions />
  );

  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        {!isWorkspaceManager ? (
          <JobViewTracker jobId={detailData.id} enabled viewerId={user?.id} />
        ) : null}
        <JobDetailHeader
          title={isWorkspaceManager ? "Manage Job" : "Detail Job"}
          actions={headerActions}
        />

        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <JobDetailView
            data={detailData}
            defaultResumeId={user?.candidateProfile?.defaultResumeId ?? null}
            defaultPortfolioLinks={
              Array.isArray(user?.candidateProfile?.portfolioLinks)
                ? user.candidateProfile.portfolioLinks
                    .map((link) =>
                      typeof link === "string" ? link.trim() : "",
                    )
                    .filter(Boolean)
                : []
            }
          />
        </div>
      </div>
    </div>
  );
}

