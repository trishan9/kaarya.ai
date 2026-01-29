import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminUserById } from "@/lib/actions/admin/admin-user-actions";
import { TUser } from "@/lib/definitions";
import { EditUserForm } from "../../_components/edit-user-form";

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
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Admin Panel
            </p>
            <h1 className="text-2xl font-semibold">Edit user</h1>
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
          <h1 className="text-2xl font-semibold">Edit user</h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/users/${user.id}`}>Back to profile</Link>
        </Button>
      </div>

      <EditUserForm
        userId={user.id}
        initialValues={{
          name: user.name,
          email: user.email ?? "",
          role: user.role,
          provider: user.provider ?? "email",
        }}
        imageUrl={user.photo}
      />
    </section>
  );
}
