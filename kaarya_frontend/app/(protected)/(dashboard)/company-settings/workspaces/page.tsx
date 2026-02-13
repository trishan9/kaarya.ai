import { redirect } from "next/navigation";
import { DashboardHeader } from "../../_components/dashboard-header";
import { getCurrentUser } from "@/lib/dal";
import { listRecruiterWorkspaces } from "@/lib/actions/company-actions";
import { Role, TRecruiterWorkspace } from "@/lib/definitions";
import { WorkspaceHub } from "../_components/workspace-hub";

type WorkspaceHubPageProps = {
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

export default async function WorkspaceHubPage({
  searchParams,
}: WorkspaceHubPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.RECRUITER) {
    redirect("/overview");
  }

  const params = await searchParams;
  const activeWorkspaceId =
    typeof params?.workspace === "string" ? params.workspace : null;

  const workspaceResponse = await listRecruiterWorkspaces({ page: 1, size: 50 });
  const workspaces = Array.isArray(workspaceResponse?.data?.workspaces)
    ? (workspaceResponse.data.workspaces as TRecruiterWorkspace[])
    : [];

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader title="Workspace Hub" />
        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <WorkspaceHub
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
          />
        </div>
      </div>
    </div>
  );
}
