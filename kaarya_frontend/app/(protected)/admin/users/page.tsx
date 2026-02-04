import { getAdminUsers } from "@/lib/actions/admin/admin-user-actions";
import { TUser } from "@/lib/definitions";
import { AdminUsersAnalytics } from "./_components/user-analytics";
import { UsersHeader } from "./_components/users-header";
import { UsersTable } from "./_components/users-table";

type AdminUsersPageProps = {
  searchParams?: { page?: string; size?: string; search?: string };
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const rawPage = Number(searchParams?.page);
  const rawSize = Number(searchParams?.size);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : undefined;
  const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : undefined;

  const search =
    typeof searchParams?.search === "string" &&
    searchParams.search.trim().length > 0
      ? searchParams.search
      : undefined;

  const response = await getAdminUsers({ page, size, search });
  const responseData = response?.data;
  const users = (
    Array.isArray(responseData) ? responseData : (responseData?.data ?? [])
  ) as TUser[];

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
