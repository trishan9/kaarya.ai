import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateUserForm } from "../_components/create-user-form";

export default function AdminUserCreatePage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Admin Panel
          </p>
          <h1 className="text-2xl font-semibold">Create user</h1>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/users">Back to users</Link>
        </Button>
      </div>

      <CreateUserForm />
    </section>
  );
}
