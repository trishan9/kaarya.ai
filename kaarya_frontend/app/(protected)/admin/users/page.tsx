import Link from "next/link";
import Image from "next/image";
import { getAdminUsers } from "@/lib/actions/admin/admin-user-actions";
import { TUser } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { AdminUsersAnalytics } from "./_components/user-analytics";

export default async function AdminUsersPage() {
  const response = await getAdminUsers();
  const users = (response?.data ?? []) as TUser[];
  const errorMessage =
    response?.success === false ? response?.message : undefined;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Kaarya Admin Panel
          </p>

          <h1 className="text-2xl font-semibold">Users</h1>
        </div>

        <Button asChild className="transition hover:-translate-y-0.5">
          <Link href="/admin/users/create">Create user</Link>
        </Button>
      </div>

      {!errorMessage && <AdminUsersAnalytics users={users} />}

      <div className="rounded-2xl border bg-card shadow-sm animate-in fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {errorMessage && (
                <tr>
                  <td className="px-4 py-8 text-muted-foreground" colSpan={6}>
                    {errorMessage}
                  </td>
                </tr>
              )}

              {!errorMessage && users.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-muted-foreground" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              )}

              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b last:border-none transition hover:bg-muted/40"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative size-9 overflow-hidden rounded-full border bg-muted">
                        {user?.photo ? (
                          <Image
                            src={user.photo}
                            alt={user.name}
                            width={100}
                            height={100}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs">
                            {user.name.charAt(0).toUpperCase()}
                            {user.name.split(" ")[1]?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-medium">{user.name}</p>

                        <p className="text-xs text-muted-foreground">
                          {user.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">{user.email ?? "-"}</td>

                  <td className="px-4 py-4">
                    <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                      {user.role}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-4 py-4">
                    {user.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/users/${user.id}`}>View</Link>
                    </Button>

                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/users/${user.id}/edit`}>Edit</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
