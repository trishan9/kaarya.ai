import { redirect } from "next/navigation";
import { DashboardHeader } from "../../_components/dashboard-header";
import { getCurrentUser } from "@/lib/dal";
import { listRecruiterWorkspaces } from "@/lib/actions/company-actions";
import { Role, TRecruiterWorkspace } from "@/lib/definitions";
import { CreateJobForm } from "./_components/create-job-form";

type NewJobPageProps = {
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

export default async function NewJobPage({ searchParams }: NewJobPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.RECRUITER) {
    redirect("/overview");
  }

  const params = await searchParams;
  const requestedWorkspaceId =
    typeof params?.workspace === "string" ? params.workspace : null;

  const workspaceResponse = await listRecruiterWorkspaces({ page: 1, size: 50 });
  const workspaces = Array.isArray(workspaceResponse?.data?.workspaces)
    ? (workspaceResponse.data.workspaces as TRecruiterWorkspace[])
    : [];

  const activeWorkspace =
    workspaces.find((workspace) => workspace.company.id === requestedWorkspaceId) ??
    workspaces[0];

  if (!activeWorkspace?.company.id) {
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
                {activeWorkspace.company.name ?? "Company Workspace"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Craft a high-quality role brief with structured hiring details for
                the selected workspace.
              </p>
            </div>
            <CreateJobForm companyId={activeWorkspace.company.id} />
          </section>
        </div>
      </div>
    </div>
  );
}
