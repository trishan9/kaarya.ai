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
import { UsersTable } from "./_components/users-table";
import { DashboardHeader } from "../../(dashboard)/_components/dashboard-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

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
    <>
      <DashboardHeader
        title="Users"
        actions={
          <Button asChild className="h-9 rounded-lg text-xs font-semibold">
            <Link href="/admin/users/create">
              <Plus className="h-4 w-4" />
              Create User
            </Link>
          </Button>
        }
      />

      <section className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
        <div className="rounded-xl border border-[#ececf0] bg-neutral-50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Manage, filter, and monitor all user accounts and role distribution.
          </p>
        </div>

        {analyticsData && <AdminUsersAnalytics data={analyticsData} />}

        <UsersTable users={users} meta={meta} errorMessage={errorMessage} />
      </section>
    </>
  );
}
