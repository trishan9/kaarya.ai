import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "../_components/dashboard-header";
import { getCurrentUser } from "@/lib/dal";
import {
  getCollegeById,
  getCollegeMetrics,
  listCollegeStudents,
  listCollegeWorkspaces,
} from "@/lib/actions/college-actions";
import {
  Role,
  TCollegeMetrics,
  TCollegeWorkspaceMembersResponse,
  TStudentWorkspaceMember,
} from "@/lib/definitions";
import {
  extractCollegeWorkspaces,
  extractWorkspaceRows,
  resolveCollegeWorkspace,
} from "@/lib/workspaces";
import { CollegeSettingsPanel } from "./_components/college-settings-panel";

type CollegeSettingsPageProps = {
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

export default async function CollegeSettingsPage({
  searchParams,
}: CollegeSettingsPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.COLLEGE) {
    redirect("/overview");
  }

  const params = await searchParams;
  const requestedWorkspaceId =
    typeof params?.workspace === "string" ? params.workspace : null;

  const workspaceResponse = await listCollegeWorkspaces({ page: 1, size: 50 });
  const workspaces = extractCollegeWorkspaces(
    extractWorkspaceRows(workspaceResponse),
  );
  const activeWorkspace = resolveCollegeWorkspace({
    workspaces,
    requestedId: requestedWorkspaceId,
  });

  if (!activeWorkspace?.college?.id) {
    return (
      <div className="dashboard-stage">
        <div className="dashboard-surface">
          <DashboardHeader title="College Settings" />
          <div className="px-3 pb-6 sm:px-4 sm:pb-8">
            <Card className="gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">No workspace selected</h2>
              <p className="text-sm text-muted-foreground">
                Create your college workspace first from sign up or contact support
                if your account is not linked.
              </p>
              <Button asChild className="w-fit">
                <Link href="/overview">Go to Overview</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const [studentsResponse, metricsResponse, collegeResponse] = await Promise.all([
    listCollegeStudents(activeWorkspace.college.id, {
      page: 1,
      size: 200,
    }),
    getCollegeMetrics(activeWorkspace.college.id),
    getCollegeById(activeWorkspace.college.id),
  ]);

  const membersData = (studentsResponse?.data ?? {}) as
    | Partial<TCollegeWorkspaceMembersResponse>
    | {
        students?: unknown;
        members?: unknown;
        rows?: unknown;
        workspace?: {
          inviteCode?: unknown;
        };
      };
  const members = Array.isArray(membersData.members)
    ? (membersData.members as TStudentWorkspaceMember[])
    : Array.isArray((membersData as { students?: unknown }).students)
      ? ((membersData as { students: TStudentWorkspaceMember[] })
          .students as TStudentWorkspaceMember[])
      : Array.isArray((membersData as { rows?: unknown }).rows)
        ? ((membersData as { rows: TStudentWorkspaceMember[] })
            .rows as TStudentWorkspaceMember[])
      : [];
  const inviteCode =
    typeof membersData.workspace?.inviteCode === "string"
      ? membersData.workspace.inviteCode
      : activeWorkspace.college.inviteCode ?? null;
  const metricsData = (metricsResponse?.data ?? null) as TCollegeMetrics | null;
  const collegeData = (collegeResponse?.data ?? null) as {
    name?: string;
    institutionType?: string | null;
    location?: string | null;
    logo?: string | null;
  } | null;

  const workspaceName =
    typeof collegeData?.name === "string"
      ? collegeData.name
      : activeWorkspace.college.name ?? "College Workspace";
  const workspaceLogo =
    typeof collegeData?.logo === "string"
      ? collegeData.logo
      : activeWorkspace.college.logo ?? null;
  const workspaceInstitutionType =
    typeof collegeData?.institutionType === "string"
      ? collegeData.institutionType
      : null;
  const workspaceLocation =
    typeof collegeData?.location === "string" ? collegeData.location : null;

  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader title="College Settings" />
        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <CollegeSettingsPanel
            collegeId={activeWorkspace.college.id}
            workspaceName={workspaceName}
            workspaceLogo={workspaceLogo}
            workspaceInstitutionType={workspaceInstitutionType}
            workspaceLocation={workspaceLocation}
            inviteCode={inviteCode}
            members={members}
            metrics={metricsData}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  );
}


