import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "../_components/dashboard-header";
import { getCurrentUser } from "@/lib/dal";
import {
  getCompanyById,
  listCompanyRecruiters,
  listRecruiterWorkspaces,
} from "@/lib/actions/company-actions";
import {
  Role,
  TCompanyWorkspaceMembersResponse,
  TRecruiterWorkspace,
  TWorkspaceMember,
} from "@/lib/definitions";
import { CompanySettingsPanel } from "./_components/company-settings-panel";

type CompanySettingsPageProps = {
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

export default async function CompanySettingsPage({
  searchParams,
}: CompanySettingsPageProps) {
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
    return (
      <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
        <div className="rounded-xl bg-white sm:rounded-2xl">
          <DashboardHeader title="Company Settings" />
          <div className="px-3 pb-6 sm:px-4 sm:pb-8">
            <Card className="gap-3 rounded-2xl border border-[#ececf0] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">No workspace selected</h2>
              <p className="text-sm text-muted-foreground">
                Create or join a company workspace before managing company settings.
              </p>
              <Button asChild className="w-fit">
                <Link href="/company-settings/workspaces">Open Workspace Hub</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const membersResponse = await listCompanyRecruiters(activeWorkspace.company.id, {
    page: 1,
    size: 100,
  });
  const membersData = (membersResponse?.data ?? {}) as Partial<TCompanyWorkspaceMembersResponse>;
  const members = Array.isArray(membersData.members)
    ? (membersData.members as TWorkspaceMember[])
    : [];
  const inviteCode =
    typeof membersData.workspace?.inviteCode === "string"
      ? membersData.workspace.inviteCode
      : activeWorkspace.company.inviteCode ?? null;
  const companyResponse = await getCompanyById(activeWorkspace.company.id);
  const companyData = (companyResponse?.data ?? null) as {
    name?: string;
    industry?: string | null;
    location?: string | null;
    logo?: string | null;
  } | null;
  const workspaceName =
    typeof companyData?.name === "string"
      ? companyData.name
      : activeWorkspace.company.name ?? "Company Workspace";
  const workspaceLogo =
    typeof companyData?.logo === "string"
      ? companyData.logo
      : activeWorkspace.company.logo ?? null;
  const workspaceIndustry =
    typeof companyData?.industry === "string" ? companyData.industry : null;
  const workspaceLocation =
    typeof companyData?.location === "string" ? companyData.location : null;

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader title="Company Settings" />
        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <CompanySettingsPanel
            companyId={activeWorkspace.company.id}
            workspaceName={workspaceName}
            workspaceLogo={workspaceLogo}
            workspaceIndustry={workspaceIndustry}
            workspaceLocation={workspaceLocation}
            inviteCode={inviteCode}
            members={members}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
