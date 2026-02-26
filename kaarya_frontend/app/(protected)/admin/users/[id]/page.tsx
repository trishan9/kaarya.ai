import { getAdminUserById } from "@/lib/actions/admin/admin-user-actions";
import { TUser } from "@/lib/definitions";
import { UserProfileCard } from "./_components/user-profile-card";
import { QuickActionsCard } from "./_components/quick-actions-card";
import { UserNotFound } from "./_components/user-not-found";
import { DashboardHeader } from "../../../(dashboard)/_components/dashboard-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <>
      <DashboardHeader
        title="User Details"
        actions={
          <Button asChild variant="outline" className="h-9 rounded-lg text-xs font-semibold">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        }
      />

      <section className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
        <div className="rounded-xl border border-[#ececf0] bg-neutral-50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            View identity, role, and account metadata for this user.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <UserProfileCard user={user} />
          <QuickActionsCard userId={user.id} />
        </div>
      </section>
    </>
  );
}
