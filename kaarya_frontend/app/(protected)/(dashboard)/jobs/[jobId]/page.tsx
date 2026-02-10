import { OverviewHeaderActions } from "../../overview/_components/overview-header-actions";
import { JobDetailHeader } from "../_components/job-detail-header";
import { JobDetailView } from "../_components/job-detail-view";
import { getJobDetailPageData } from "../job-detail-data";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;
  const detailData = await getJobDetailPageData(decodeURIComponent(jobId));

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <JobDetailHeader title="Detail Job" actions={<OverviewHeaderActions />} />

        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <JobDetailView data={detailData} />
        </div>
      </div>
    </div>
  );
}
