import { getCurrentUser } from "@/lib/dal";
import { listRecruiterWorkspaces } from "@/lib/actions/company-actions";
import { Role, TRecruiterWorkspace } from "@/lib/definitions";
import { DashboardShell } from "./_components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  let recruiterWorkspaces: TRecruiterWorkspace[] = [];

  if (user?.role === Role.RECRUITER) {
    const workspaceResponse = await listRecruiterWorkspaces({
      page: 1,
      size: 50,
    });

    recruiterWorkspaces = Array.isArray(workspaceResponse?.data?.workspaces)
      ? (workspaceResponse.data.workspaces as TRecruiterWorkspace[])
      : [];
  }

  return (
    <main>
      <DashboardShell user={user} recruiterWorkspaces={recruiterWorkspaces}>
        {children}
      </DashboardShell>
    </main>
  );
}
