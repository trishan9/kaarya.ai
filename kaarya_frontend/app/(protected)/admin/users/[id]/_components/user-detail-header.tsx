import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function UserDetailHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Kaarya Admin Panel
        </p>
        <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage user account information
        </p>
      </div>

      <Button asChild variant="outline" className="gap-2">
        <Link href="/admin/users">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </Button>
    </div>
  );
}

