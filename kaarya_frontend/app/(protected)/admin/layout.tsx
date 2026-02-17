import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { Role } from "@/lib/definitions";
import { AdminShell } from "./_components/admin-shell";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  if (user.role !== Role.ADMIN) {
    return redirect("/overview");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
