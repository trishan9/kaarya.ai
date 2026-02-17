import { CreateUserForm } from "../_components/create-user-form";
import { DashboardHeader } from "../../../(dashboard)/_components/dashboard-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminUserCreatePage() {
  return (
    <>
      <DashboardHeader
        title="Create User"
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
            Add a new user account with role, auth provider, and profile image.
          </p>
        </div>

        <CreateUserForm />
      </section>
    </>
  );
}
