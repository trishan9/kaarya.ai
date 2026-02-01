import { getAdminUserById } from "@/lib/actions/admin/admin-user-actions";
import { TUser } from "@/lib/definitions";
import { EditUserForm } from "../../_components/edit-user-form";
import { EditUserHeader } from "./_components/edit-user-header";
import { UserNotFound } from "./_components/user-not-found";

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
    <section className="space-y-8">
      <EditUserHeader userId={user.id} />
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
