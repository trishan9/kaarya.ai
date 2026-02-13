import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/dal";
import { getCompanyById, listRecruiterWorkspaces } from "@/lib/actions/company-actions";
import { getJobs } from "@/lib/actions/job-actions";
import { Role, TRecruiterWorkspace } from "@/lib/definitions";
import { CompanyInviteJoinCard } from "./_components/company-invite-join-card";

type CompanyInvitesPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    inviteCode?: string;
    designation?: string;
  }>;
};

const isObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(value);

export default async function CompanyInvitesPage({
  searchParams,
}: CompanyInvitesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const params = searchParams ? await searchParams : undefined;
  const companyId =
    typeof params?.companyId === "string" && isObjectId(params.companyId.trim())
      ? params.companyId.trim()
      : null;
  const inviteCode =
    typeof params?.inviteCode === "string" ? params.inviteCode.trim() : "";
  const designation =
    typeof params?.designation === "string" ? params.designation.trim() : "";

  if (user.role !== Role.RECRUITER) {
    return (
      <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:p-5">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-4 sm:rounded-2xl sm:p-5">
          <Card className="gap-3 rounded-2xl border border-[#ececf0] bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold">Recruiter Access Required</h1>
            <p className="text-sm text-muted-foreground">
              This invite link can only be used from a recruiter account.
            </p>
            <Button asChild className="w-fit">
              <Link href="/overview">Go to Overview</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const workspaceResponse = await listRecruiterWorkspaces({ page: 1, size: 50 });
  const workspaces = Array.isArray(workspaceResponse?.data?.workspaces)
    ? (workspaceResponse.data.workspaces as TRecruiterWorkspace[])
    : [];
  const normalizedInviteCode = inviteCode.toUpperCase();
  const existingWorkspace =
    workspaces.find((workspace) => workspace.company.id === companyId) ??
    workspaces.find(
      (workspace) =>
        typeof workspace.company.inviteCode === "string" &&
        workspace.company.inviteCode.toUpperCase() === normalizedInviteCode,
    ) ??
    null;

  let companyName: string | null = existingWorkspace?.company.name ?? null;
  let companyLogo: string | null = existingWorkspace?.company.logo ?? null;
  let companyIndustry: string | null = null;
  let companyLocation: string | null = null;
  let openRolesCount: number | null = null;

  if (companyId) {
    const companyResponse = await getCompanyById(companyId);
    const companyData =
      companyResponse?.success && companyResponse?.data
        ? (companyResponse.data as {
            name?: string | null;
            logo?: string | null;
            industry?: string | null;
            location?: string | null;
          })
        : null;

    if (companyData) {
      companyName = companyData.name ?? companyName;
      companyLogo = companyData.logo ?? companyLogo;
      companyIndustry = companyData.industry ?? null;
      companyLocation = companyData.location ?? null;
    }

    const jobsResponse = await getJobs({
      page: 1,
      size: 20,
      feed: "all",
      companyId,
      status: "open",
    });
    const openJobs = Array.isArray(jobsResponse?.data?.jobs) ? jobsResponse.data.jobs : [];
    openRolesCount = openJobs.length;
  }

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:p-5">
      <div className="mx-auto max-w-3xl rounded-xl bg-white sm:rounded-2xl">
        <CompanyInviteJoinCard
          companyId={companyId}
          initialInviteCode={inviteCode}
          initialDesignation={designation}
          companyName={companyName}
          companyLogo={companyLogo}
          companyIndustry={companyIndustry}
          companyLocation={companyLocation}
          openRolesCount={openRolesCount}
          alreadyMember={Boolean(existingWorkspace)}
          existingWorkspaceId={existingWorkspace?.company.id ?? null}
          currentUserName={user.name}
          currentUserEmail={user.email ?? null}
        />
      </div>
    </div>
  );
}
