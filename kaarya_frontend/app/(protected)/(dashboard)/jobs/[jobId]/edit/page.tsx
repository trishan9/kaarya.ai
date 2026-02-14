import { notFound, redirect } from "next/navigation";
import { DashboardHeader } from "../../../_components/dashboard-header";
import { getCurrentUser } from "@/lib/dal";
import { getJobById } from "@/lib/actions/job-actions";
import { listRecruiterWorkspaces } from "@/lib/actions/company-actions";
import { listCollegeWorkspaces } from "@/lib/actions/college-actions";
import { Role, TJob } from "@/lib/definitions";
import {
  extractCollegeWorkspaces,
  extractRecruiterWorkspaces,
  extractWorkspaceRows,
  resolveCollegeWorkspace,
  resolveRecruiterWorkspace,
} from "@/lib/workspaces";
import { CreateJobForm } from "../../new/_components/create-job-form";

type EditJobPageProps = {
  params: Promise<{
    jobId: string;
  }>;
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

const toDateValue = (isoDate?: string) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];

export default async function EditJobPage({
  params,
  searchParams,
}: EditJobPageProps) {
  const user = await getCurrentUser();
  if (!user || (user.role !== Role.RECRUITER && user.role !== Role.COLLEGE)) {
    redirect("/overview");
  }

  const { jobId } = await params;
  const query = await searchParams;
  const requestedWorkspaceId =
    typeof query?.workspace === "string" ? query.workspace : null;

  const jobResponse = await getJobById(decodeURIComponent(jobId));
  if (!jobResponse?.success || !jobResponse?.data) {
    notFound();
  }

  const job = jobResponse.data as TJob;
  const isCollegeWorkspace = Boolean(job.collegeId);
  const workspaceResponse = isCollegeWorkspace
    ? await listCollegeWorkspaces({ page: 1, size: 50 })
    : await listRecruiterWorkspaces({ page: 1, size: 50 });
  const workspaceRows = extractWorkspaceRows(workspaceResponse);
  const recruiterWorkspaces = extractRecruiterWorkspaces(workspaceRows);
  const collegeWorkspaces = extractCollegeWorkspaces(workspaceRows);

  const activeRecruiterWorkspace = resolveRecruiterWorkspace({
    workspaces: recruiterWorkspaces,
    requestedId: requestedWorkspaceId,
    fallbackIds: [job.companyId],
  });
  const activeCollegeWorkspace = resolveCollegeWorkspace({
    workspaces: collegeWorkspaces,
    requestedId: requestedWorkspaceId,
    fallbackIds: [job.collegeId],
  });

  const workspaceId = isCollegeWorkspace
    ? (activeCollegeWorkspace?.college?.id ?? job.collegeId ?? null)
    : (activeRecruiterWorkspace?.company?.id ?? job.companyId ?? null);

  if (!workspaceId) {
    redirect("/jobs");
  }

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader title="Edit Job" />
        <div className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
          <section className="rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {job.company?.name ?? "Workspace"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Update the role using the same structured form used for creating
                a new posting.
              </p>
            </div>

            <CreateJobForm
              workspaceId={workspaceId}
              workspaceType={isCollegeWorkspace ? "college" : "company"}
              mode="edit"
              jobId={job.id}
              activeWorkspaceId={workspaceId}
              initialValues={{
                title: job.title ?? "",
                description: job.description ?? "",
                location: job.location ?? "",
                employmentType: job.employmentType ?? "",
                engagementType: job.engagementType ?? "",
                workMode: job.workMode ?? "onsite",
                salaryRange: job.salaryRange ?? "",
                skills: asStringArray(job.requirements?.skills),
                deadline: toDateValue(job.deadline),
              }}
              submitLabel="Save Job Changes"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
