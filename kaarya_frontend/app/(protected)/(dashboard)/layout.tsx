import { getCurrentUser } from "@/lib/dal";
import { listRecruiterWorkspaces } from "@/lib/actions/company-actions";
import { listCollegeWorkspaces } from "@/lib/actions/college-actions";
import { Role, TCollegeWorkspace, TRecruiterWorkspace } from "@/lib/definitions";
import {
  extractCollegeWorkspaces,
  extractRecruiterWorkspaces,
  extractWorkspaceRows,
} from "@/lib/workspaces";
import { DashboardShell } from "./_components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  let recruiterWorkspaces: TRecruiterWorkspace[] = [];
  let collegeWorkspaces: TCollegeWorkspace[] = [];

  if (user?.role === Role.RECRUITER) {
    const workspaceResponse = await listRecruiterWorkspaces({
      page: 1,
      size: 50,
    });

    recruiterWorkspaces = extractRecruiterWorkspaces(
      extractWorkspaceRows(workspaceResponse),
    ) as TRecruiterWorkspace[];
  }

  if (
    user?.role === Role.USER ||
    user?.role === Role.STUDENT ||
    user?.role === Role.COLLEGE
  ) {
    const workspaceResponse = await listCollegeWorkspaces({
      page: 1,
      size: 50,
    });

    collegeWorkspaces = extractCollegeWorkspaces(
      extractWorkspaceRows(workspaceResponse),
    ) as TCollegeWorkspace[];
  }

  return (
    <main>
      <DashboardShell
        user={user}
        recruiterWorkspaces={recruiterWorkspaces}
        collegeWorkspaces={collegeWorkspaces}
      >
        {children}
      </DashboardShell>
    </main>
  );
}
