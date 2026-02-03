import { getAdminUsers } from "@/lib/actions/admin/admin-user-actions";
import { TUser } from "@/lib/definitions";
import { AdminUsersAnalytics } from "./_components/user-analytics";
import { UsersHeader } from "./_components/users-header";
import { UsersTable } from "./_components/users-table";

export default async function AdminUsersPage() {
  const response = await getAdminUsers();
  const users = (response?.data ?? []) as TUser[];
  const errorMessage =
    response?.success === false ? response?.message : undefined;

  return (
    <section className="space-y-8">
      <UsersHeader />

      {!errorMessage && <AdminUsersAnalytics users={users} />}

      <UsersTable users={users} errorMessage={errorMessage} />
    </section>
  );
}
