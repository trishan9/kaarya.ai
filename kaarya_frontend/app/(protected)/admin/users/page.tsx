import { getAdminUsers } from "@/lib/actions/admin/admin-user-actions";
import { TUser } from "@/lib/definitions";
import { parsePaginationParams } from "@/lib/pagination";
import { AdminUsersAnalytics } from "./_components/user-analytics";
import { UsersHeader } from "./_components/users-header";
import { UsersTable } from "./_components/users-table";

type AdminUsersPageProps = {
  searchParams?: Promise<{ page?: string; size?: string; search?: string }>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const queryParams = await searchParams;
  const { page, size } = parsePaginationParams(queryParams);

  const search =
    typeof queryParams?.search === "string" &&
    queryParams.search.trim().length > 0
      ? queryParams.search
      : undefined;

  const response = await getAdminUsers({ page, size, search });
  const responseData = response?.data;
  const users = (
    Array.isArray(responseData) ? responseData : (responseData?.users ?? [])
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
