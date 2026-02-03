import { getAdminUserById } from "@/lib/actions/admin/admin-user-actions";
import { TUser } from "@/lib/definitions";
import { UserDetailHeader } from "./_components/user-detail-header";
import { UserProfileCard } from "./_components/user-profile-card";
import { QuickActionsCard } from "./_components/quick-actions-card";
import { UserNotFound } from "./_components/user-not-found";

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
    return <UserNotFound />;
  }

  return (
    <section className="space-y-8">
      <UserDetailHeader />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <UserProfileCard user={user} />
        <QuickActionsCard userId={user.id} />
      </div>
    </section>
  );
}
