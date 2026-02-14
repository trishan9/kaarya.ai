import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/dal";
import { getCollegeById, listCollegeWorkspaces } from "@/lib/actions/college-actions";
import { getJobs } from "@/lib/actions/job-actions";
import { Role } from "@/lib/definitions";
import {
  extractCollegeWorkspaces,
  extractWorkspaceRows,
} from "@/lib/workspaces";
import { CollegeInviteJoinCard } from "./_components/college-invite-join-card";

type CollegeInvitesPageProps = {
  searchParams?: Promise<{
    collegeId?: string;
    inviteCode?: string;
    program?: string;
    year?: string;
  }>;
};

const isObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(value);

export default async function CollegeInvitesPage({
  searchParams,
}: CollegeInvitesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const params = searchParams ? await searchParams : undefined;
  const collegeId =
    typeof params?.collegeId === "string" && isObjectId(params.collegeId.trim())
      ? params.collegeId.trim()
      : null;
  const inviteCode =
    typeof params?.inviteCode === "string" ? params.inviteCode.trim() : "";
  const program = typeof params?.program === "string" ? params.program.trim() : "";
  const parsedYear =
    typeof params?.year === "string" && params.year.trim().length > 0
      ? Number(params.year.trim())
      : null;
  const year =
    parsedYear && Number.isFinite(parsedYear) && parsedYear >= 1 && parsedYear <= 10
      ? parsedYear
      : null;

  if (user.role !== Role.USER && user.role !== Role.STUDENT) {
    return (
      <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:p-5">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-4 sm:rounded-2xl sm:p-5">
          <Card className="gap-3 rounded-2xl border border-[#ececf0] bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold">Student Access Required</h1>
            <p className="text-sm text-muted-foreground">
              This invite link can only be used from a candidate or student account.
            </p>
            <Button asChild className="w-fit">
              <Link href="/overview">Go to Overview</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const workspaceResponse = await listCollegeWorkspaces({ page: 1, size: 50 });
  const workspaces = extractCollegeWorkspaces(
    extractWorkspaceRows(workspaceResponse),
  );
  const normalizedInviteCode = inviteCode.toUpperCase();
  const existingWorkspace =
    workspaces.find((workspace) => workspace.college?.id === collegeId) ??
    workspaces.find(
      (workspace) =>
        typeof workspace.college?.inviteCode === "string" &&
        workspace.college.inviteCode.toUpperCase() === normalizedInviteCode,
    ) ??
    null;

  let collegeName: string | null = existingWorkspace?.college.name ?? null;
  let collegeLogo: string | null = existingWorkspace?.college.logo ?? null;
  let collegeInstitutionType: string | null = null;
  let collegeLocation: string | null = null;
  let openRolesCount: number | null = null;

  if (collegeId) {
    const collegeResponse = await getCollegeById(collegeId);
    const collegeData =
      collegeResponse?.success && collegeResponse?.data
        ? (collegeResponse.data as {
            name?: string | null;
            logo?: string | null;
            institutionType?: string | null;
            location?: string | null;
          })
        : null;

    if (collegeData) {
      collegeName = collegeData.name ?? collegeName;
      collegeLogo = collegeData.logo ?? collegeLogo;
      collegeInstitutionType = collegeData.institutionType ?? null;
      collegeLocation = collegeData.location ?? null;
    }

    const jobsResponse = await getJobs({
      page: 1,
      size: 20,
      feed: "all",
      collegeId,
      visibility: "college_only",
      status: "open",
    });
    const openJobs = Array.isArray(jobsResponse?.data?.jobs) ? jobsResponse.data.jobs : [];
    openRolesCount = openJobs.length;
  }

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:p-5">
      <div className="mx-auto max-w-3xl rounded-xl bg-white sm:rounded-2xl">
        <CollegeInviteJoinCard
          collegeId={collegeId}
          initialInviteCode={inviteCode}
          initialProgram={program}
          initialYear={year}
          collegeName={collegeName}
          collegeLogo={collegeLogo}
          collegeInstitutionType={collegeInstitutionType}
          collegeLocation={collegeLocation}
          openRolesCount={openRolesCount}
          alreadyMember={Boolean(existingWorkspace)}
          existingWorkspaceId={existingWorkspace?.college?.id ?? null}
          currentUserName={user.name}
          currentUserEmail={user.email ?? null}
        />
      </div>
    </div>
  );
}
