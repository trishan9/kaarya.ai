import { getCurrentUser } from "@/lib/dal";
import { DashboardShell } from "./_components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <main>
      <DashboardShell user={user}>{children}</DashboardShell>
    </main>
  );
}
