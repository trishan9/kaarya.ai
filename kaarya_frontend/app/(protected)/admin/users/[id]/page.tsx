import Link from "next/link";
import { getAdminUserById } from "@/lib/actions/admin-user-actions";
import { Button } from "@/components/ui/button";
import { TUser } from "@/lib/definitions";
import { UserDetailActions } from "../_components/user-detail-actions";
import Image from "next/image";

type AdminUserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;
  const response = await getAdminUserById(id);
  const user = response?.data as TUser | undefined;

  if (!user) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Admin Panel
            </p>
            <h1 className="text-2xl font-semibold">User details</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/users">Back to users</Link>
          </Button>
        </div>
        <div className="rounded-2xl border bg-card p-6 text-muted-foreground">
          User not found.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Admin Panel
          </p>
          <h1 className="text-2xl font-semibold">User details</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/users">Back to users</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-sm animate-in fade-in">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative size-16 overflow-hidden rounded-full border bg-muted">
                {user.photo ? (
                  <Image
                    src={user.photo}
                    alt={user.name}
                    width={100}
                    height={100}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No photo
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <UserDetailActions userId={user.id} />
          </div>

          <div className="mt-8 grid gap-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-4 py-3">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-medium">{user.id}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-4 py-3">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{user.role}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-4 py-3">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium capitalize">
                {user.provider ?? "email"}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-4 py-3">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleString()
                  : "-"}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-4 py-3">
              <span className="text-muted-foreground">Updated</span>
              <span className="font-medium">
                {user.updatedAt
                  ? new Date(user.updatedAt).toLocaleString()
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm animate-in fade-in delay-100">
          <h3 className="text-base font-semibold">Quick actions</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Make edits or remove this account from the platform.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild variant="outline">
              <Link href={`/admin/users/${user.id}/edit`}>
                Edit user details
              </Link>
            </Button>

            <Button asChild variant="secondary">
              <Link href="/admin/users/create">Create another user</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
