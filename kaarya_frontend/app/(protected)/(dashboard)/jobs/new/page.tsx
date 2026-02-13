import { redirect } from "next/navigation";
import { DashboardHeader } from "../../_components/dashboard-header";
import { getCurrentUser } from "@/lib/dal";
import { listRecruiterWorkspaces } from "@/lib/actions/company-actions";
import { listCollegeWorkspaces } from "@/lib/actions/college-actions";
import { Role } from "@/lib/definitions";
import {
  extractCollegeWorkspaces,
  extractRecruiterWorkspaces,
  extractWorkspaceRows,
  resolveCollegeWorkspace,
  resolveRecruiterWorkspace,
} from "@/lib/workspaces";
import { CreateJobForm } from "./_components/create-job-form";

type NewJobPageProps = {
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

export default async function NewJobPage({ searchParams }: NewJobPageProps) {
  const user = await getCurrentUser();
  if (!user || (user.role !== Role.RECRUITER && user.role !== Role.COLLEGE)) {
    redirect("/overview");
  }

  const params = await searchParams;
  const requestedWorkspaceId =
    typeof params?.workspace === "string" ? params.workspace : null;

  const isCollege = user.role === Role.COLLEGE;
  const workspaceResponse = isCollege
    ? await listCollegeWorkspaces({ page: 1, size: 50 })
    : await listRecruiterWorkspaces({ page: 1, size: 50 });
  const workspaceRows = extractWorkspaceRows(workspaceResponse);
  const recruiterWorkspaces = extractRecruiterWorkspaces(workspaceRows);
  const collegeWorkspaces = extractCollegeWorkspaces(workspaceRows);

  const activeRecruiterWorkspace = resolveRecruiterWorkspace({
    workspaces: recruiterWorkspaces,
    requestedId: requestedWorkspaceId,
  });
  const activeCollegeWorkspace = resolveCollegeWorkspace({
    workspaces: collegeWorkspaces,
    requestedId: requestedWorkspaceId,
  });

  const activeWorkspaceId = isCollege
    ? activeCollegeWorkspace?.college?.id
    : activeRecruiterWorkspace?.company?.id;
  const activeWorkspaceName = isCollege
    ? activeCollegeWorkspace?.college?.name
    : activeRecruiterWorkspace?.company?.name;

  if (!activeWorkspaceId) {
    redirect("/overview");
  }

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader title="Post New Job" />
        <div className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
          <section className="rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {activeWorkspaceName ?? "Workspace"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Craft a high-quality role brief with structured hiring details for
                the selected workspace.
              </p>
            </div>
            <CreateJobForm
              workspaceId={activeWorkspaceId}
              workspaceType={isCollege ? "college" : "company"}
              activeWorkspaceId={activeWorkspaceId}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
