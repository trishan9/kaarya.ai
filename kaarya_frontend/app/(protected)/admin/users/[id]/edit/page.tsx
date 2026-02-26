import { getAdminUserById } from "@/lib/actions/admin/admin-user-actions";
import { Role, TUser } from "@/lib/definitions";
import { EditUserForm } from "../../_components/edit-user-form";
import { UserNotFound } from "./_components/user-not-found";
import { DashboardHeader } from "../../../../(dashboard)/_components/dashboard-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AdminUserEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserEditPage({
  params,
}: AdminUserEditPageProps) {
  const { id } = await params;
  const response = await getAdminUserById(id);
  const user = response?.data as TUser | undefined;

  if (!user) {
    return <UserNotFound />;
  }

  return (
    <>
      <DashboardHeader
        title="Edit User"
        actions={
          <Button asChild variant="outline" className="h-9 rounded-lg text-xs font-semibold">
            <Link href={`/admin/users/${user.id}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Link>
          </Button>
        }
      />

      <section className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
        <div className="rounded-xl border border-[#ececf0] bg-neutral-50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Update account details, role, and auth metadata for this user.
          </p>
        </div>

        <EditUserForm
          userId={user.id}
          initialValues={{
            name: user.name,
            email: user.email ?? "",
            role: user.role === Role.ADMIN ? "admin" : "user",
            provider: user.provider ?? "email",
          }}
          imageUrl={user.photo}
        />
      </section>
    </>
  );
}
