import {
  getAdminUsers,
  getAdminUsersAnalytics,
} from "@/lib/actions/admin/admin-user-actions";
import { TUser } from "@/lib/definitions";
import { PaginationMeta, parsePaginationParams } from "@/lib/pagination";
import {
  AdminUsersAnalytics,
  AdminUsersAnalyticsData,
} from "./_components/user-analytics";
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

  const [usersResponse, analyticsResponse] = await Promise.all([
    getAdminUsers({ page, size, search }),
    getAdminUsersAnalytics(),
  ]);

  const responseData = usersResponse?.data;

  const users = (
    Array.isArray(responseData) ? responseData : (responseData?.users ?? [])
  ) as TUser[];

  const meta = (
    !Array.isArray(responseData)
      ? (responseData?.meta as PaginationMeta | undefined)
      : undefined
  ) as PaginationMeta | undefined;

  const errorMessage =
    usersResponse?.success === false ? usersResponse?.message : undefined;

  const analyticsData =
    analyticsResponse?.success === false
      ? undefined
      : (analyticsResponse?.data as AdminUsersAnalyticsData | undefined);

  return (
    <section className="space-y-8">
      <UsersHeader />

      {analyticsData && <AdminUsersAnalytics data={analyticsData} />}

      <UsersTable users={users} meta={meta} errorMessage={errorMessage} />
    </section>
  );
}
