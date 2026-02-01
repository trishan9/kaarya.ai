import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function UsersHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Kaarya Admin Panel
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and monitor all user accounts
        </p>
      </div>

      <Button asChild className="gap-2">
        <Link href="/admin/users/create">
          <Plus className="h-4 w-4" />
          Create User
        </Link>
      </Button>
    </div>
  );
}

